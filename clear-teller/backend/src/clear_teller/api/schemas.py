"""API request/response models (the typed contract the frontend consumes)."""

from __future__ import annotations

from pydantic import BaseModel


class IngestRequest(BaseModel):
    text: str
    title: str | None = None


class IngestResponse(BaseModel):
    document_id: str
    run_id: str


class ChecklistItemOut(BaseModel):
    id: str
    text: str
    checked: bool
    source: list[str]  # provenance strings, e.g. ["第2行"]


class ConflictSideOut(BaseModel):
    label: str  # provenance of the side
    text: str


class ConflictOut(BaseModel):
    id: str
    summary: str | None
    left: ConflictSideOut
    right: ConflictSideOut


class DocumentOut(BaseModel):
    id: str
    status: str
    title: str | None
    checklist: list[ChecklistItemOut]
    conflicts: list[ConflictOut]
    unit_count: int
