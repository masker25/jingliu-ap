"""Embedding provider seam.

Defaults to a local model (fastembed) for zero external dependency; swap to
Voyage for the quality upgrade via ``settings.embedding_provider``. Kept behind a
Protocol so the RAG store never imports a concrete provider.
"""

from __future__ import annotations

from typing import Protocol

from clear_teller.config import settings


class EmbeddingProvider(Protocol):
    def embed(self, texts: list[str]) -> list[list[float]]: ...


class FastEmbedProvider:
    """Local embeddings (fastembed). Wired in P4; interface fixed in P0."""

    def __init__(self, model: str = settings.embedding_model) -> None:
        self.model = model

    def embed(self, texts: list[str]) -> list[list[float]]:
        raise NotImplementedError("fastembed wired in P4")


def get_embedding_provider() -> EmbeddingProvider:
    if settings.embedding_provider == "fastembed":
        return FastEmbedProvider()
    raise ValueError(f"unknown embedding provider {settings.embedding_provider!r}")
