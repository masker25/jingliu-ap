// The conflict zone — kept separate from the checklist. Contradictions are shown
// as pairs for the human to adjudicate; never silently merged into the list.

export function ConflictCard() {
  return (
    <section className="pointer-events-auto w-[300px] overflow-hidden rounded-xl border border-warn/30 bg-surface shadow-card">
      <header className="flex items-center gap-2 border-b border-line bg-warn-soft px-3.5 py-2.5">
        <span className="text-warn">⚠</span>
        <span className="label !text-warn">Conflict · 待确认</span>
      </header>
      <div className="space-y-2 p-3 text-[12.5px]">
        <div className="rounded-md border border-line px-2.5 py-2">
          <div className="label mb-1">A · 纪要</div>
          <div className="text-ink">上线时间定在<strong>周四</strong></div>
        </div>
        <div className="text-center font-mono text-[10px] text-faint">⇅ 相互矛盾</div>
        <div className="rounded-md border border-line px-2.5 py-2">
          <div className="label mb-1">B · 聊天 16:20</div>
          <div className="text-ink">上线时间改到<strong>下周一</strong></div>
        </div>
      </div>
    </section>
  );
}
