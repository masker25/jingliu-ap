// One responsibility item, rendered as an aviation-checklist line: checkbox
// (核对/完成 only), plain number (1, not 01), name, the five fixed fields with
// concrete Chinese exceptions shown in-field, and manual reorder. Selecting the
// row drives the 来源回看 panel.

import { useState } from "react";

import { SIDE_LABEL, type Exception, type RItem } from "../lib/responsibility";

function exFor(item: RItem, field: Exception["field"]) {
  return item.exceptions.find((e) => e.field === field)?.label;
}

const SIDE_TONE: Record<RItem["side"], string> = {
  ours: "bg-accent-soft text-accent",
  theirs: "bg-paper text-ink-soft",
  unclear_side: "bg-warn-soft text-warn",
};

function Field({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex gap-2 py-1 text-[12.5px]">
      <span className="w-16 shrink-0 text-faint">{label}</span>
      <span className={warn ? "text-warn" : "text-ink"}>{value}</span>
    </div>
  );
}

export function ResponsibilityRow({
  item,
  index,
  selected,
  onSelect,
  onToggle,
  onMove,
  canUp,
  canDown,
}: {
  item: RItem;
  index: number;
  selected: boolean;
  onSelect: () => void;
  onToggle: () => void;
  onMove: (dir: -1 | 1) => void;
  canUp: boolean;
  canDown: boolean;
}) {
  const [open, setOpen] = useState(false);
  const dueEx = exFor(item, "due");
  const dueValue = dueEx ?? item.due ?? "缺截止日期";

  return (
    <li className={`border-b border-line last:border-0 ${selected ? "bg-accent-soft/40" : ""}`}>
      <div className="flex items-start gap-3 px-4 py-3">
        <button
          onClick={onToggle}
          aria-pressed={item.checked}
          title="已核对 / 已完成"
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border font-mono text-[11px] transition
            ${item.checked ? "border-ok bg-ok-soft text-ok" : "border-line text-transparent hover:border-accent"}`}
        >
          ✓
        </button>
        <span className="mt-0.5 w-5 shrink-0 text-center font-mono text-[13px] text-faint">
          {index + 1}
        </span>
        <button onClick={onSelect} className="min-w-0 flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className={`text-[14px] ${item.checked ? "text-faint line-through" : "text-ink"}`}>
              {item.name}
            </span>
            <span className={`rounded px-1.5 py-0.5 text-[10px] ${SIDE_TONE[item.side]}`}>
              {SIDE_LABEL[item.side]}
            </span>
          </div>
          <div className="mt-0.5 text-[12px]">
            <span className="text-faint">截止</span>{" "}
            <span className={dueEx ? "text-warn" : "text-ink-soft"}>{dueValue}</span>
          </div>
        </button>
        <div className="flex shrink-0 flex-col items-center gap-0.5">
          <button
            onClick={() => setOpen((v) => !v)}
            className="px-1 text-[11px] text-faint hover:text-accent"
          >
            {open ? "收起" : "展开"}
          </button>
          <div className="flex gap-0.5">
            <button
              disabled={!canUp}
              onClick={() => onMove(-1)}
              className="px-1 text-faint hover:text-accent disabled:opacity-20"
            >
              ↑
            </button>
            <button
              disabled={!canDown}
              onClick={() => onMove(1)}
              className="px-1 text-faint hover:text-accent disabled:opacity-20"
            >
              ↓
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-paper/60 px-4 py-2 pl-12">
          <Field label="责任方" value={SIDE_LABEL[item.side]} warn={item.side === "unclear_side"} />
          <Field label="承诺动作" value={item.action} warn={!!exFor(item, "action")} />
          <Field label="交付物" value={item.deliverable ?? "缺交付物"} warn={!item.deliverable} />
          <Field label="截止日期" value={dueValue} warn={!!dueEx} />
          <Field label="下一步" value={item.next} />
          {item.exceptions.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {item.exceptions.map((e, i) => (
                <span key={i} className="rounded bg-warn-soft px-1.5 py-0.5 text-[10px] text-warn">
                  {e.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </li>
  );
}
