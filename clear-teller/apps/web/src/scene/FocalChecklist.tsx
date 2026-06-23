// The focal element: the checklist. Always present and visually dominant —
// crisp, numbered, monospace ticks, aviation-checklist rigour. Each row links
// back to its source provenance (content-complete), revealed on hover.

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { patchChecklist, type ChecklistItem } from "../lib/api";

function Row({ item, index, documentId }: { item: ChecklistItem; index: number; documentId?: string }) {
  const [checked, setChecked] = useState(item.checked);
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const toggle = () => {
    const next = !checked;
    setChecked(next); // optimistic
    void patchChecklist(item.id, next).then(() => {
      if (documentId) qc.invalidateQueries({ queryKey: ["activity", documentId] });
    });
  };

  return (
    <li className="group border-b border-line last:border-0">
      <div className="flex items-start gap-3 px-4 py-3">
        <button
          onClick={toggle}
          aria-pressed={checked}
          className={`nodrag mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border font-mono text-[11px] transition
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
          {open && item.source.length > 0 && (
            <div className="mt-1.5 rounded-md bg-paper px-2.5 py-1.5 text-[12px] text-ink-soft">
              来源 · {item.source.join("、")}
            </div>
          )}
        </div>
        {item.source.length > 0 && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="nodrag label mt-1 shrink-0 opacity-0 transition group-hover:opacity-100"
          >
            {open ? "收起" : "原文"}
          </button>
        )}
      </div>
    </li>
  );
}

export function FocalChecklist({
  items,
  documentId,
}: {
  items: ChecklistItem[];
  documentId?: string;
}) {
  const done = items.filter((i) => i.checked).length;
  return (
    <section className="pointer-events-auto w-[420px] overflow-hidden rounded-xl border border-line bg-surface shadow-focal">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="label">Checklist</span>
          <span className="text-[13px] font-semibold text-ink">执行清单</span>
        </div>
        <span className="font-mono text-[11px] text-faint">
          {done}/{items.length}
        </span>
      </header>
      {items.length === 0 ? (
        <div className="px-4 py-8 text-center text-[13px] text-faint">没有可执行项</div>
      ) : (
        <ol>
          {items.map((it, i) => (
            <Row key={it.id} item={it} index={i} documentId={documentId} />
          ))}
        </ol>
      )}
      <footer className="border-t border-line px-4 py-2.5 text-center">
        <span className="label">逐条核对 · 无需动脑</span>
      </footer>
    </section>
  );
}
