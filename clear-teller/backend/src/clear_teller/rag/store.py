"""RAG rules engine — vector store seam.

Rules (structuring heuristics, format conventions, templates, few-shot examples)
are retrievable knowledge rather than hard-coded prompts. The store hides where
vectors live: P0–P4 use sqlite-vec in the same SQLite file; swapping to pgvector
or Qdrant later only touches this module.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol


@dataclass(frozen=True)
class RuleHit:
    rule_id: str
    content: str
    score: float


class VectorStore(Protocol):
    def query(self, embedding: list[float], k: int = 5) -> list[RuleHit]: ...


class SqliteVecStore:
    """sqlite-vec backed store. Wired in P4; interface fixed in P0."""

    def query(self, embedding: list[float], k: int = 5) -> list[RuleHit]:
        raise NotImplementedError("sqlite-vec retrieval wired in P4")
