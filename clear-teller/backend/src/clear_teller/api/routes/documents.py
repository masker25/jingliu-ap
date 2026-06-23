"""Ingest + document read + run progress (SSE).

POST /ingest            paste text -> create document + run, kick the pipeline
GET  /documents/{id}    structured result (checklist + conflicts)
GET  /runs/{id}/stream  SSE progress feed (drives the erase + progress bar)
"""

from __future__ import annotations

import asyncio
import json
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlmodel import Session, select

from clear_teller.agent.events import broker
from clear_teller.agent.pipeline import run_ingest
from clear_teller.api.schemas import (
    ActivityOut,
    CanvasSaveRequest,
    ChecklistItemOut,
    CheckPatch,
    ConflictOut,
    ConflictSideOut,
    DocumentOut,
    DocumentSummary,
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


@router.get("/documents", response_model=list[DocumentSummary])
def list_documents(session: Session = Depends(get_session)) -> list[DocumentSummary]:
    docs = session.exec(
        select(models.Document).order_by(models.Document.created_at.desc()).limit(50)
    ).all()
    return [
        DocumentSummary(
            id=d.id, title=d.title, status=d.status, created_at=d.created_at.isoformat()
        )
        for d in docs
    ]


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

    canvas_row = session.get(models.CanvasState, document_id)
    canvas = json.loads(canvas_row.state) if canvas_row else None

    return DocumentOut(
        id=doc.id,
        status=doc.status,
        title=doc.title,
        checklist=checklist,
        conflicts=conflict_out,
        units=units_out,
        unit_count=len(units),
        canvas=canvas,
    )


@router.post("/documents/{document_id}/canvas", status_code=204)
def save_canvas(document_id: str, req: CanvasSaveRequest) -> None:
    """Persist node positions (event-sourced via an audit event)."""
    with write_session() as s:
        if not s.get(models.Document, document_id):
            raise HTTPException(status_code=404, detail="document not found")
        row = s.get(models.CanvasState, document_id)
        state = json.dumps(req.positions)
        if row:
            row.state = state
            row.updated_at = datetime.now(UTC)
        else:
            s.add(models.CanvasState(document_id=document_id, state=state))
        # coalesce consecutive layout tweaks instead of flooding the audit stream
        last = s.exec(
            select(models.AuditEvent)
            .where(models.AuditEvent.document_id == document_id)
            .order_by(models.AuditEvent.created_at.desc())
            .limit(1)
        ).first()
        if last and last.action == "canvas_update":
            last.created_at = datetime.now(UTC)
        else:
            s.add(
                models.AuditEvent(
                    document_id=document_id,
                    actor="user",
                    action="canvas_update",
                    payload=json.dumps({"nodes": len(req.positions)}),
                )
            )


@router.patch("/checklist/{item_id}", status_code=204)
def patch_checklist(item_id: str, req: CheckPatch) -> None:
    """Toggle a checklist item; record the action in the audit stream."""
    with write_session() as s:
        item = s.get(models.ChecklistItem, item_id)
        if not item:
            raise HTTPException(status_code=404, detail="item not found")
        item.checked = req.checked
        s.add(
            models.AuditEvent(
                document_id=item.document_id,
                actor="user",
                action="check" if req.checked else "uncheck",
                payload=json.dumps({"item": item_id}, ensure_ascii=False),
            )
        )


_TITLES = {
    "ingest_text": "投喂内容",
    "process_complete": "整理完成",
    "check": "勾选清单项",
    "uncheck": "取消勾选",
    "canvas_update": "调整画布布局",
}


@router.get("/documents/{document_id}/activity", response_model=list[ActivityOut])
def get_activity(
    document_id: str, session: Session = Depends(get_session)
) -> list[ActivityOut]:
    """The audit stream for this document, rendered for the Run Timeline."""
    events = session.exec(
        select(models.AuditEvent)
        .where(models.AuditEvent.document_id == document_id)
        .order_by(models.AuditEvent.created_at.desc())
        .limit(30)
    ).all()
    out: list[ActivityOut] = []
    for e in events:
        detail = None
        if e.payload:
            data = json.loads(e.payload)
            if e.action == "process_complete":
                detail = (
                    f"清单 {data.get('checklist', 0)} · "
                    f"冲突 {data.get('conflicts', 0)} · "
                    f"合并 {data.get('merged', 0)}"
                )
        out.append(
            ActivityOut(
                id=e.id,
                time=e.created_at.isoformat(),
                actor=e.actor,
                action=e.action,
                title=_TITLES.get(e.action, e.action),
                detail=detail,
                provider=e.provider,
                model=e.model,
            )
        )
    return out
