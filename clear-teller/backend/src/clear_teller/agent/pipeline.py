"""Agent processing pipeline — the async DAG, now wired to a real engine + DB.

Shape (data-dependency aware): atomize -> [dedupe || conflicts] -> assemble.
dedupe and conflicts are independent reads over the units, so they fan out in
parallel (via threads) and fan back in for assembly. Every phase publishes a
progress event (real completion, not a fake animation) and appends an audit
event so the Run Timeline reflects exactly what happened.

The engine is pluggable: P1 ships the local mock engine; a model-backed engine
drops in behind the same phase calls once a provider key exists.
"""

from __future__ import annotations

import asyncio
import json
from datetime import UTC, datetime

from clear_teller.agent import mock_engine
from clear_teller.agent.events import broker
from clear_teller.db import models
from clear_teller.db.session import write_session


async def _publish(run_id: str, phase: str, progress: float) -> None:
    await broker.publish(run_id, {"phase": phase, "progress": round(progress, 3)})


def _audit(session, run_id: str, document_id: str, action: str, payload: dict | None = None):
    session.add(
        models.AuditEvent(
            run_id=run_id,
            document_id=document_id,
            actor="agent",
            action=action,
            provider="mock",
            model="mock-engine",
            payload=json.dumps(payload, ensure_ascii=False) if payload else None,
        )
    )


async def run_ingest(run_id: str, document_id: str, text: str) -> None:
    """Run the full pipeline for one document and persist all outputs."""
    try:
        # --- atomize (sequential) ---
        units = await asyncio.to_thread(mock_engine.atomize, text)
        await _publish(run_id, "atomize", 0.3)

        # --- dedupe || conflicts (parallel fan-out) ---
        async with asyncio.TaskGroup() as tg:
            t_merge = tg.create_task(asyncio.to_thread(mock_engine.dedupe, units))
            t_conf = tg.create_task(
                asyncio.to_thread(lambda: mock_engine.conflicts(units, mock_engine.dedupe(units)))
            )
        merges = t_merge.result()
        confs = t_conf.result()
        await _publish(run_id, "dedupe+conflict", 0.7)

        # --- assemble ---
        items, taxonomy = await asyncio.to_thread(mock_engine.checklist, units, merges)
        await _publish(run_id, "assemble", 0.9)

        _persist(run_id, document_id, units, merges, taxonomy, confs, items)
        await _publish(run_id, "done", 1.0)
        await broker.publish(run_id, {"phase": "done", "progress": 1.0, "final": True})
    except Exception as exc:  # surface failure to the stream + DB
        with write_session() as s:
            run = s.get(models.Run, run_id)
            if run:
                run.status = models.RunStatus.failed
                run.finished_at = datetime.now(UTC)
                s.add(run)
        await broker.publish(run_id, {"phase": "failed", "error": str(exc), "final": True})
        raise


def _persist(run_id, document_id, units, merges, taxonomy, confs, items) -> None:
    """Write units, taxonomy, checklist, conflicts, audit; flip doc to ready."""
    with write_session() as s:
        # info units (provenance preserved = content-complete base)
        unit_ids: list[str] = []
        for u in units:
            iu = models.InfoUnit(document_id=document_id, text=u.text, provenance=u.provenance)
            s.add(iu)
            unit_ids.append(iu.id)
        s.flush()

        # dedupe links
        for dup_idx, survivor_idx in merges.items():
            s.get(models.InfoUnit, unit_ids[dup_idx]).merged_into_id = unit_ids[survivor_idx]

        # taxonomy (1-level for the mock; up to 3 with a model)
        for order, (label, idxs) in enumerate(taxonomy.items()):
            node = models.TaxonomyNode(document_id=document_id, label=label, level=1, order=order)
            s.add(node)
            s.flush()
            for i in idxs:
                s.get(models.InfoUnit, unit_ids[i]).taxonomy_node_id = node.id

        # checklist (always present)
        for order, (text, src_idxs) in enumerate(items):
            s.add(
                models.ChecklistItem(
                    document_id=document_id,
                    text=text,
                    order=order,
                    source_unit_ids=json.dumps([unit_ids[i] for i in src_idxs]),
                )
            )

        # conflicts (kept separate)
        for left_idx, right_idx, summary in confs:
            s.add(
                models.Conflict(
                    document_id=document_id,
                    left_unit_id=unit_ids[left_idx],
                    right_unit_id=unit_ids[right_idx],
                    summary=summary,
                )
            )

        _audit(
            s,
            run_id,
            document_id,
            "process_complete",
            {
                "units": len(units),
                "merged": len(merges),
                "checklist": len(items),
                "conflicts": len(confs),
            },
        )

        doc = s.get(models.Document, document_id)
        doc.status = models.DocumentStatus.ready
        run = s.get(models.Run, run_id)
        run.status = models.RunStatus.done
        run.progress = 1.0
        run.finished_at = datetime.now(UTC)
