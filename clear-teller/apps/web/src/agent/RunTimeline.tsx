// Run Timeline — the visual form of the audit log. Reads the document's
// append-only audit stream (one data source for timeline + compliance) and
// refreshes as actions happen. Collapsible, and collapsed by default on small
// screens so it doesn't dominate the canvas.

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getActivity, type Activity } from "../lib/api";

const DOT: Record<string, string> = {
  user: "bg-accent",
  agent: "bg-ok",
  system: "bg-faint",
};

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

export function RunTimeline({ documentId }: { documentId: string }) {
  const [open, setOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );
  const { data } = useQuery({
    queryKey: ["activity", documentId],
    queryFn: () => getActivity(documentId),
  });
  const items: Activity[] = data ?? [];

  return (
    <aside
      className={`pointer-events-auto absolute right-3 top-3 z-40 overflow-hidden rounded-xl border border-line bg-surface/90 shadow-card backdrop-blur ${
        open ? "w-[min(280px,74vw)]" : "w-auto"
      }`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 whitespace-nowrap px-3.5 py-2.5"
      >
        <span className="label">Run Timeline</span>
        <span className="label">{open ? "收起" : `审计 (${items.length})`}</span>
      </button>
      {open &&
        (items.length === 0 ? (
          <div className="px-3.5 pb-3 text-[11px] text-faint">暂无活动</div>
        ) : (
          <ul className="max-h-[56vh] overflow-auto p-1.5 pt-0">
            {items.map((e) => (
              <li key={e.id} className="flex gap-2.5 rounded-lg px-2 py-2 hover:bg-paper">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[e.actor] ?? "bg-faint"}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[12.5px] text-ink">{e.title}</span>
                    <span className="font-mono text-[10px] text-faint">{timeOf(e.time)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-faint">
                    {e.model && <span className="font-mono">{e.model}</span>}
                    {e.model && e.detail && <span>·</span>}
                    {e.detail && <span className="truncate">{e.detail}</span>}
                    {!e.model && !e.detail && <span>{e.actor}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ))}
    </aside>
  );
}
