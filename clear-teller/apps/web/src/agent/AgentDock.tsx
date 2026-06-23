// Agent entry + drop target. Drag a node's grip here (or click it) to feed it as
// context; fed fields show as removable chips. ⌘K then carries this context.
// P1.5 wires the actual agent call once a model key exists.

import { useState } from "react";

import { FEED_MIME, useAgentContext, type ContextChip } from "../lib/store";

export function AgentDock() {
  const fed = useAgentContext((s) => s.fed);
  const feed = useAgentContext((s) => s.feed);
  const unfeed = useAgentContext((s) => s.unfeed);
  const [over, setOver] = useState(false);

  return (
    <div className="pointer-events-auto absolute bottom-5 left-1/2 z-40 -translate-x-1/2">
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes(FEED_MIME)) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
            setOver(true);
          }
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const raw = e.dataTransfer.getData(FEED_MIME);
          if (raw) feed(JSON.parse(raw) as ContextChip);
        }}
        className={`flex max-w-[94vw] flex-col items-stretch gap-2 rounded-2xl border bg-surface/95 p-2 shadow-card backdrop-blur transition
          ${over ? "border-accent ring-2 ring-accent/30" : "border-line"}`}
      >
        {fed.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-1 pt-1">
            <span className="label mr-0.5">已投喂</span>
            {fed.map((c) => (
              <span
                key={c.id}
                className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] ${
                  c.kind === "conflict" ? "bg-warn-soft text-warn" : "bg-accent-soft text-accent"
                }`}
              >
                {c.label}
                <button onClick={() => unfeed(c.id)} className="text-faint hover:text-ink">
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
        <button className="flex min-w-0 items-center gap-2.5 rounded-full py-1.5 pl-2 pr-1">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-[12px] text-accent">
            ✦
          </span>
          <span className="truncate text-[13px] text-ink-soft">
            {over ? "松手投喂给 Agent" : fed.length ? "已带上下文，⌘K 提问" : "问 Agent，或把字段拖到这里"}
          </span>
          <kbd className="rounded-md border border-line bg-paper px-1.5 py-0.5 font-mono text-[11px] text-faint">
            ⌘K
          </kbd>
        </button>
      </div>
    </div>
  );
}
