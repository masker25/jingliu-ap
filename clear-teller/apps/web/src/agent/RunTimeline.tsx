// Run Timeline — the visual form of the audit log. It reads the document's
// append-only audit stream (one data source for both timeline and compliance)
// and refreshes as actions happen.

import { useQuery } from "@tanstack/react-query";

import { getActivity, type Activity } from "../lib/api";

const DOT: Record<string, string> = {
  user: "bg-accent",
  agent: "bg-ok",
  system: "bg-faint",
};

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
}

export function RunTimeline({ documentId }: { documentId: string | null }) {
  const { data } = useQuery({
    queryKey: ["activity", documentId],
    queryFn: () => getActivity(documentId!),
    enabled: !!documentId,
  });
  const items: Activity[] = data ?? [];

  return (
    <aside className="pointer-events-auto absolute right-4 top-4 z-40 w-[280px] rounded-xl border border-line bg-surface/90 shadow-card backdrop-blur">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <span className="label">Run Timeline</span>
        <span className="label">审计 · 可回看</span>
      </div>
      {items.length === 0 ? (
        <div className="px-3.5 py-5 text-[11px] text-faint">
          {documentId ? "暂无活动" : "投喂内容后，这里实时记录每一步操作与审计"}
        </div>
      ) : (
        <ul className="max-h-[60vh] overflow-auto p-1.5">
          {items.map((e) => (
            <li key={e.id} className="flex gap-2.5 rounded-lg px-2 py-2 hover:bg-paper">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[e.actor] ?? "bg-faint"}`} />
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
      )}
    </aside>
  );
}
