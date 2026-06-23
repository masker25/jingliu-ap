"""Agent processing pipeline — the async DAG skeleton.

Steps run as an async DAG: sequential where there is a data dependency, fanned
out in parallel where there is not. The map-reduce shape is:

    extract -> atomize -> classify -> [dedupe || conflict] -> assemble

``dedupe`` and ``conflict`` operate over independent unit clusters, so each fans
out parallel sub-tasks (bounded by the model router's per-provider semaphores)
and the results fan back in for ``assemble``. Every step emits a progress tick so
the frontend progress bar tracks real completion, not a fake animation.

P0 ships the orchestration shape with stubbed steps; P1 fills each step in.
"""

from __future__ import annotations

import asyncio
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, field


@dataclass
class PipelineContext:
    document_id: str
    run_id: str
    progress: float = 0.0
    on_progress: Callable[[float], Awaitable[None]] | None = None
    notes: list[str] = field(default_factory=list)

    async def tick(self, amount: float, note: str) -> None:
        self.progress = min(1.0, self.progress + amount)
        self.notes.append(note)
        if self.on_progress is not None:
            await self.on_progress(self.progress)


async def _extract(ctx: PipelineContext) -> None:
    # P1: parse text/Word/PDF, read PNG via the vision route.
    await ctx.tick(0.15, "extract")


async def _atomize(ctx: PipelineContext) -> None:
    # P1: split into source-anchored InfoUnits.
    await ctx.tick(0.15, "atomize")


async def _classify(ctx: PipelineContext) -> None:
    # P1: find commonality -> up to 3-level taxonomy (degrade to 1 if simple).
    await ctx.tick(0.20, "classify")


async def _dedupe(ctx: PipelineContext) -> None:
    # P1: fan out per-cluster similarity + LLM-confirmed merges.
    await ctx.tick(0.20, "dedupe")


async def _conflict(ctx: PipelineContext) -> None:
    # P1: fan out per-cluster contradiction detection -> Conflict pairs.
    await ctx.tick(0.20, "conflict")


async def _assemble(ctx: PipelineContext) -> None:
    # P1: build checklist (always) + conflict zone + content layer + views.
    await ctx.tick(0.10, "assemble")


async def run_pipeline(ctx: PipelineContext) -> PipelineContext:
    """Execute the DAG. dedupe and conflict run in parallel (fan-out/fan-in)."""
    await _extract(ctx)
    await _atomize(ctx)
    await _classify(ctx)
    async with asyncio.TaskGroup() as tg:
        tg.create_task(_dedupe(ctx))
        tg.create_task(_conflict(ctx))
    await _assemble(ctx)
    return ctx
