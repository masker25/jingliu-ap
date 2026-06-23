"""SQLModel schema for clear teller.

The tables encode the product's core invariants:

- ``InfoUnit``      atomic source-anchored content (the "content-complete" base).
- ``ChecklistItem`` the minimal, checkable output; links back to its info units.
- ``Conflict``      contradictions kept *separate* from the checklist, in pairs.
- ``AuditEvent``    append-only event stream (event sourcing) — never updated.
- ``Run``           one agent execution; groups audit events for the Run Timeline.

P0 ships the schema; later phases fill behaviour. Vector columns for RAG live in
``RuleChunk`` and arrive with the sqlite-vec integration (P4), so they are kept
nullable here.
"""

from __future__ import annotations

from datetime import UTC, datetime
from enum import StrEnum
from uuid import uuid4

from sqlmodel import Field, SQLModel


def _uuid() -> str:
    return uuid4().hex


def _now() -> datetime:
    return datetime.now(UTC)


# --- enums -----------------------------------------------------------------


class SourceType(StrEnum):
    text = "text"
    word = "word"
    pdf = "pdf"
    png = "png"


class DocumentStatus(StrEnum):
    received = "received"
    processing = "processing"
    ready = "ready"
    failed = "failed"


class ConflictStatus(StrEnum):
    open = "open"  # awaiting human adjudication
    resolved = "resolved"


class RunStatus(StrEnum):
    running = "running"
    done = "done"
    failed = "failed"


class ViewKind(StrEnum):
    flowchart = "flowchart"
    mindmap = "mindmap"
    project = "project"


# --- tables ----------------------------------------------------------------


class Document(SQLModel, table=True):
    """One input: a paste of text or an uploaded Word/PDF/PNG."""

    id: str = Field(default_factory=_uuid, primary_key=True)
    source_type: SourceType
    title: str | None = None
    raw_ref: str | None = None  # path/key of the original file in object storage
    status: DocumentStatus = DocumentStatus.received
    created_at: datetime = Field(default_factory=_now)


class InfoUnit(SQLModel, table=True):
    """Atomic, source-anchored unit of content. Content completeness lives here."""

    id: str = Field(default_factory=_uuid, primary_key=True)
    document_id: str = Field(foreign_key="document.id", index=True)
    text: str
    # provenance: where in the source this came from (page, offset, etc.)
    provenance: str | None = None
    taxonomy_node_id: str | None = Field(default=None, foreign_key="taxonomynode.id")
    # set when this unit was merged into another (dedupe); points at the survivor
    merged_into_id: str | None = Field(default=None, foreign_key="infounit.id")
    created_at: datetime = Field(default_factory=_now)


class TaxonomyNode(SQLModel, table=True):
    """A node in the (up to) 3-level classification tree for a document."""

    id: str = Field(default_factory=_uuid, primary_key=True)
    document_id: str = Field(foreign_key="document.id", index=True)
    parent_id: str | None = Field(default=None, foreign_key="taxonomynode.id")
    label: str
    level: int = 1  # 1..3
    order: int = 0


class ChecklistItem(SQLModel, table=True):
    """The mandatory, minimal, checkable output. Expandable to its info units."""

    id: str = Field(default_factory=_uuid, primary_key=True)
    document_id: str = Field(foreign_key="document.id", index=True)
    taxonomy_node_id: str | None = Field(default=None, foreign_key="taxonomynode.id")
    text: str
    order: int = 0
    checked: bool = False
    # the info units this item summarises (kept as the source-of-truth link)
    source_unit_ids: str | None = None  # JSON-encoded list of InfoUnit ids


class Conflict(SQLModel, table=True):
    """A contradiction surfaced as a pair, kept out of the main checklist."""

    id: str = Field(default_factory=_uuid, primary_key=True)
    document_id: str = Field(foreign_key="document.id", index=True)
    left_unit_id: str = Field(foreign_key="infounit.id")
    right_unit_id: str = Field(foreign_key="infounit.id")
    summary: str | None = None
    status: ConflictStatus = ConflictStatus.open
    resolution: str | None = None  # which side won / human note
    created_at: datetime = Field(default_factory=_now)


class View(SQLModel, table=True):
    """An optional personalised view (flowchart / mindmap / project board)."""

    id: str = Field(default_factory=_uuid, primary_key=True)
    document_id: str = Field(foreign_key="document.id", index=True)
    kind: ViewKind
    payload: str  # JSON graph (nodes/edges) rendered by React Flow
    created_at: datetime = Field(default_factory=_now)


class CanvasState(SQLModel, table=True):
    """Materialised current canvas (positions, focus/fade). One per document."""

    document_id: str = Field(foreign_key="document.id", primary_key=True)
    state: str  # JSON tldraw snapshot
    updated_at: datetime = Field(default_factory=_now)


class Run(SQLModel, table=True):
    """One agent execution; the unit the Run Timeline displays."""

    id: str = Field(default_factory=_uuid, primary_key=True)
    document_id: str | None = Field(default=None, foreign_key="document.id", index=True)
    kind: str  # e.g. "ingest", "rearrange", "chat"
    status: RunStatus = RunStatus.running
    progress: float = 0.0  # 0..1, drives the real progress bar
    started_at: datetime = Field(default_factory=_now)
    finished_at: datetime | None = None


class AuditEvent(SQLModel, table=True):
    """Append-only event. Never updated or deleted. Source of truth for audit."""

    id: str = Field(default_factory=_uuid, primary_key=True)
    run_id: str | None = Field(default=None, foreign_key="run.id", index=True)
    document_id: str | None = Field(default=None, foreign_key="document.id", index=True)
    actor: str  # "user" | "agent" | "system"
    action: str  # e.g. "drop_field", "propose_merge", "accept", "reject"
    # which provider/model produced this (for agent steps) — audit + A/B + cost
    provider: str | None = None
    model: str | None = None
    payload: str | None = None  # JSON detail / diff
    created_at: datetime = Field(default_factory=_now)


class RuleChunk(SQLModel, table=True):
    """A retrievable rule for the RAG rules engine (structuring/format/templates)."""

    id: str = Field(default_factory=_uuid, primary_key=True)
    kind: str  # "structuring" | "format" | "template" | "fewshot"
    title: str | None = None
    content: str
    # embedding stored via sqlite-vec virtual table in P4; kept nullable for now
    embedding_ref: str | None = None
    created_at: datetime = Field(default_factory=_now)
