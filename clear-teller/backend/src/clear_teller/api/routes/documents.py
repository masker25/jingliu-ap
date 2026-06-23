"""Ingest + document read + run progress (SSE).

POST /ingest            paste text -> create document + run, kick the pipeline
GET  /documents/{id}    structured result (checklist + conflicts)
GET  /runs/{id}/stream  SSE progress feed (drives the erase + progress bar)
"""

from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select

from clear_teller.agent.events import broker
from clear_teller.agent.pipeline import run_ingest
from clear_teller.api.schemas import (
    ChecklistItemOut,
    ConflictOut,
    ConflictSideOut,
    DocumentOut,
    IngestRequest,
    IngestResponse,
    UnitOut,
)
from clear_teller.db import models
from clear_teller.db.session import get_session, write_session

router = APIRouter(tags=["documents"])


@router.post("/ingest", response_model=IngestResponse)
async def ingest(req: IngestRequest) -> IngestResponse:
    if not req.text.strip():
        raise HTTPException(status_code=422, detail="text is empty")
    with write_session() as s:
        doc = models.Document(
            source_type=models.SourceType.text,
            title=req.title,
            status=models.DocumentStatus.processing,
        )
        s.add(doc)
        s.flush()
        run = models.Run(document_id=doc.id, kind="ingest")
        s.add(run)
        s.flush()
        s.add(
            models.AuditEvent(
                run_id=run.id, document_id=doc.id, actor="user", action="ingest_text"
            )
        )
        doc_id, run_id = doc.id, run.id

    # fire-and-forget; progress is observed via the SSE stream
    asyncio.create_task(run_ingest(run_id, doc_id, req.text))
    return IngestResponse(document_id=doc_id, run_id=run_id)


@router.get("/runs/{run_id}/stream")
async def run_stream(run_id: str) -> StreamingResponse:
    async def gen():
        # Subscribe first, then check the DB: if the (fast) run already finished
        # before this stream connected, emit a terminal event instead of hanging.
        q = broker.subscribe(run_id)
        try:
            with write_session() as s:
                run = s.get(models.Run, run_id)
                status = run.status if run else None
            if status is not None and status != models.RunStatus.running:
                final = "done" if status == models.RunStatus.done else "failed"
                yield f"data: {json.dumps({'phase': final, 'progress': 1.0, 'final': True})}\n\n"
                return
            while True:
                event = await q.get()
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
                if event.get("final"):
                    break
        finally:
            broker.unsubscribe(run_id, q)

    return StreamingResponse(gen(), media_type="text/event-stream")


@router.get("/documents/{document_id}", response_model=DocumentOut)
def get_document(document_id: str, session: Session = Depends(get_session)) -> DocumentOut:
    doc = session.get(models.Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="document not found")

    units = session.exec(
        select(models.InfoUnit).where(models.InfoUnit.document_id == document_id)
    ).all()
    unit_by_id = {u.id: u for u in units}

    items = session.exec(
        select(models.ChecklistItem)
        .where(models.ChecklistItem.document_id == document_id)
        .order_by(models.ChecklistItem.order)
    ).all()
    checklist = [
        ChecklistItemOut(
            id=it.id,
            text=it.text,
            checked=it.checked,
            source=[
                unit_by_id[uid].provenance
                for uid in json.loads(it.source_unit_ids or "[]")
                if uid in unit_by_id and unit_by_id[uid].provenance
            ],
        )
        for it in items
    ]

    conflicts = session.exec(
        select(models.Conflict).where(models.Conflict.document_id == document_id)
    ).all()
    conflict_out = [
        ConflictOut(
            id=c.id,
            summary=c.summary,
            left=ConflictSideOut(
                label=unit_by_id[c.left_unit_id].provenance or "A",
                text=unit_by_id[c.left_unit_id].text,
            ),
            right=ConflictSideOut(
                label=unit_by_id[c.right_unit_id].provenance or "B",
                text=unit_by_id[c.right_unit_id].text,
            ),
        )
        for c in conflicts
        if c.left_unit_id in unit_by_id and c.right_unit_id in unit_by_id
    ]

    # which units were promoted (checklist source or a conflict side) — the rest
    # stay as the faint divergent fragments on the canvas
    surfaced_ids: set[str] = set()
    for it in items:
        surfaced_ids.update(json.loads(it.source_unit_ids or "[]"))
    for c in conflicts:
        surfaced_ids.add(c.left_unit_id)
        surfaced_ids.add(c.right_unit_id)
    units_out = [
        UnitOut(
            id=u.id,
            text=u.text,
            provenance=u.provenance,
            surfaced=u.id in surfaced_ids,
        )
        for u in units
        if u.merged_into_id is None
    ]

    return DocumentOut(
        id=doc.id,
        status=doc.status,
        title=doc.title,
        checklist=checklist,
        conflicts=conflict_out,
        units=units_out,
        unit_count=len(units),
    )
