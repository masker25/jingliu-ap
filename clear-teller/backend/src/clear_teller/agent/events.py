"""In-memory pub/sub for run progress, consumed by the SSE endpoint.

Good enough for single-process P1. When we scale to multiple workers (arq +
Redis), only this module changes.
"""

from __future__ import annotations

import asyncio
from collections import defaultdict


class ProgressBroker:
    def __init__(self) -> None:
        self._subs: dict[str, set[asyncio.Queue[dict]]] = defaultdict(set)

    def subscribe(self, run_id: str) -> asyncio.Queue[dict]:
        q: asyncio.Queue[dict] = asyncio.Queue()
        self._subs[run_id].add(q)
        return q

    def unsubscribe(self, run_id: str, q: asyncio.Queue[dict]) -> None:
        self._subs[run_id].discard(q)
        if not self._subs[run_id]:
            self._subs.pop(run_id, None)

    async def publish(self, run_id: str, event: dict) -> None:
        for q in list(self._subs.get(run_id, ())):
            await q.put(event)


broker = ProgressBroker()
