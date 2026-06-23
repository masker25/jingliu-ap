// The focal element: the checklist. It is always present and visually dominant —
// crisp, numbered, monospace ticks, aviation-checklist rigour. Each row links
// back to full source content (content-complete), surfaced on expand.

import { useState } from "react";

type Item = { id: string; text: string; source: string };

const SAMPLE: Item[] = [
  { id: "1", text: "确认上线时间已与各方对齐", source: "来自纪要 · 第2段" },
  { id: "2", text: "导出对账单并核对金额", source: "来自 budget.xlsx" },
  { id: "3", text: "通知客服更新话术", source: "来自聊天 · 14:07" },
  { id: "4", text: "灰度 10% 流量并观察 30 分钟", source: "来自纪要 · 第5段" },
];

function Row({ item, index }: { item: Item; index: number }) {
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <li className="group border-b border-line last:border-0">
      <div className="flex items-start gap-3 px-4 py-3">
        <button
          onClick={() => setChecked((v) => !v)}
          aria-pressed={checked}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border font-mono text-[11px] transition
            ${checked ? "border-ok bg-ok-soft text-ok" : "border-line text-transparent hover:border-accent"}`}
        >
          ✓
        </button>
        <div className="min-w-0 flex-1">
          <div
            className={`text-[13.5px] leading-snug ${checked ? "text-faint line-through" : "text-ink"}`}
          >
            <span className="mr-2 font-mono text-[11px] text-faint">
              {String(index + 1).padStart(2, "0")}
            </span>
            {item.text}
          </div>
          {open && (
            <div className="mt-1.5 rounded-md bg-paper px-2.5 py-1.5 text-[12px] text-ink-soft">
              {item.source}
            </div>
          )}
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="label mt-1 shrink-0 opacity-0 transition group-hover:opacity-100"
        >
          {open ? "收起" : "原文"}
        </button>
      </div>
    </li>
  );
}

export function FocalChecklist() {
  const done = 0;
  return (
    <section className="pointer-events-auto w-[420px] overflow-hidden rounded-xl border border-line bg-surface shadow-focal">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="label">Checklist</span>
          <span className="text-[13px] font-semibold text-ink">执行清单</span>
        </div>
        <span className="font-mono text-[11px] text-faint">
          {done}/{SAMPLE.length}
        </span>
      </header>
      <ol>
        {SAMPLE.map((it, i) => (
          <Row key={it.id} item={it} index={i} />
        ))}
      </ol>
      <footer className="border-t border-line px-4 py-2.5 text-center">
        <span className="label">逐条核对 · 无需动脑</span>
      </footer>
    </section>
  );
}
