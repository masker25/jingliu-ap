// Run Timeline — the visual form of the audit log. Each agent run shows what it
// did, which provider/model it used, what it changed, and accept/reject state.
// One data source (audit_events grouped by run_id) serves both the user-facing
// timeline and compliance audit. P0 is a static shell; P3 streams real runs.

export function RunTimeline() {
  return (
    <aside className="absolute right-3 top-3 z-40 w-72 rounded-xl border border-black/10 bg-white/90 p-3 text-xs shadow-lg backdrop-blur">
      <div className="mb-2 font-medium text-ink">Run Timeline</div>
      <div className="text-faint">
        运行轨迹 = 审计日志的可视化形态。
        <br />
        P3 接入后，这里实时显示每次 Agent 运行、所用模型、改动节点与进度。
      </div>
    </aside>
  );
}
