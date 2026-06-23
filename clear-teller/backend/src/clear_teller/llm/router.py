"""Model router — the provider-agnostic seam.

Each pipeline step asks the router for a completion; the router maps the step to
a configured provider/model (see ``settings.model_routes``), applies fallback and
per-provider concurrency limits, and records which model produced each result.

P0 ships the interface and config-driven mapping. Real provider calls (via
Pydantic AI / LiteLLM) land in P1 — until then ``complete`` raises so nothing
silently fakes output.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass

from clear_teller.config import ModelRoute, settings


@dataclass(frozen=True)
class Completion:
    text: str
    provider: str
    model: str


class ModelRouter:
    """Routes a pipeline step to its configured model, with per-provider limits."""

    def __init__(self, routes: dict[str, ModelRoute] | None = None) -> None:
        self._routes = routes or settings.model_routes
        # one semaphore per provider so we saturate throughput without tripping
        # each provider's rate limit (matters most when mixing providers).
        self._limits: dict[str, asyncio.Semaphore] = {}

    def route_for(self, step: str) -> ModelRoute:
        try:
            return self._routes[step]
        except KeyError as exc:  # pragma: no cover - config error
            raise KeyError(f"no model route configured for step {step!r}") from exc

    def _semaphore(self, provider: str) -> asyncio.Semaphore:
        return self._limits.setdefault(provider, asyncio.Semaphore(8))

    async def complete(self, step: str, prompt: str) -> Completion:
        route = self.route_for(step)
        async with self._semaphore(route.provider):
            # P1: dispatch through Pydantic AI / LiteLLM by route.provider.
            raise NotImplementedError(
                f"provider call not wired yet (step={step}, "
                f"provider={route.provider}, model={route.model})"
            )


router = ModelRouter()
