// Run Timeline — the visual form of the audit log. Each run shows what the agent
// did, which provider/model it used, what changed, and accept/reject state. One
// data source (audit_events grouped by run_id) serves both timeline and audit.
// P0 renders a representative shell; P3 streams real runs.

type Run = {
  time: string;
  title: string;
  model: string;
  meta: string;
  state: "done" | "running" | "review";
  progress?: number;
};

const RUNS: Run[] = [
  { time: "14:02", title: "重整理「会议纪要」", model: "opus-4.8 · haiku", meta: "改了 6 个节点", state: "done" },
  { time: "13:47", title: "拖入「预算字段」追问", model: "deepseek-chat", meta: "新增 1 项", state: "review" },
  { time: "13:45", title: "处理 PDF…", model: "opus-4.8", meta: "抽取 3 并行", state: "running", progress: 0.71 },
];

const DOT: Record<Run["state"], string> = {
  done: "bg-ok",
  running: "bg-accent animate-pulse",
  review: "bg-warn",
};

export function RunTimeline() {
  return (
    <aside className="pointer-events-auto absolute right-4 top-4 z-40 w-[280px] rounded-xl border border-line bg-surface/90 shadow-card backdrop-blur">
      <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <span className="label">Run Timeline</span>
        <span className="label">审计 · 可回看</span>
      </div>
      <ul className="p-1.5">
        {RUNS.map((r, i) => (
          <li key={i} className="flex gap-2.5 rounded-lg px-2 py-2 hover:bg-paper">
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[r.state]}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[12.5px] text-ink">{r.title}</span>
                <span className="font-mono text-[10px] text-faint">{r.time}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-faint">
                <span className="font-mono">{r.model}</span>
                <span>·</span>
                <span>{r.meta}</span>
              </div>
              {r.state === "running" && (
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-line">
                  <div className="h-full bg-accent" style={{ width: `${(r.progress ?? 0) * 100}%` }} />
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </aside>
  );
}
