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


class DocumentSummary(BaseModel):
    id: str
    title: str | None
    status: str
    created_at: str


class UnitOut(BaseModel):
    id: str
    text: str
    provenance: str | None
    surfaced: bool  # promoted into the checklist / a conflict side


class DocumentOut(BaseModel):
    id: str
    status: str
    title: str | None
    checklist: list[ChecklistItemOut]
    conflicts: list[ConflictOut]
    units: list[UnitOut]  # non-merged units; unsurfaced ones are the faint fragments
    unit_count: int
    canvas: dict[str, dict[str, float]] | None  # node id -> {x, y}; restores layout


class CanvasSaveRequest(BaseModel):
    positions: dict[str, dict[str, float]]  # node id -> {x, y}


class CheckPatch(BaseModel):
    checked: bool


class ActivityOut(BaseModel):
    id: str
    time: str  # ISO timestamp
    actor: str
    action: str
    title: str
    detail: str | None
    provider: str | None
    model: str | None
