// The conflict zone — kept separate from the checklist. Contradictions are shown
// as pairs for the human to adjudicate; never silently merged into the list.

import type { Conflict } from "../lib/api";

export function ConflictCard({ conflicts }: { conflicts: Conflict[] }) {
  if (conflicts.length === 0) return null;
  return (
    <section className="pointer-events-auto w-[300px] overflow-hidden rounded-xl border border-warn/30 bg-surface shadow-card">
      <header className="flex items-center justify-between border-b border-line bg-warn-soft px-3.5 py-2.5">
        <span className="label !text-warn">⚠ Conflict · 待确认</span>
        <span className="font-mono text-[10px] text-warn">{conflicts.length}</span>
      </header>
      <div className="max-h-[60vh] divide-y divide-line overflow-auto">
        {conflicts.map((c) => (
          <div key={c.id} className="space-y-2 p-3 text-[12.5px]">
            <div className="rounded-md border border-line px-2.5 py-2">
              <div className="label mb-1">A · {c.left.label}</div>
              <div className="text-ink">{c.left.text}</div>
            </div>
            <div className="text-center font-mono text-[10px] text-faint">⇅ 相互矛盾</div>
            <div className="rounded-md border border-line px-2.5 py-2">
              <div className="label mb-1">B · {c.right.label}</div>
              <div className="text-ink">{c.right.text}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
