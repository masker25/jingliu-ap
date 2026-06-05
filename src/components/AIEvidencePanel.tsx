import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Quote } from "lucide-react";
import type { APTask } from "../types/ap";
import { subtleTransition } from "../lib/motion";

type AIEvidencePanelProps = {
  task: APTask;
};

const STRENGTH_LABEL = {
  high: "强证据",
  medium: "中证据",
  low: "弱证据",
} as const;

export function AIEvidencePanel({ task }: AIEvidencePanelProps) {
  return (
    <aside className="flex h-full w-[280px] shrink-0 flex-col gap-5 border-l border-line-soft/60 px-6 pt-7 pb-6">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] tracking-wider text-ink-faint">AI 证据</span>
        <div className="flex items-center gap-2 text-[10.5px] tracking-widest2 text-ink-faint">
          <span>EVIDENCE</span>
          <span className="h-px w-4 bg-ink-faint" />
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-md border border-line-soft bg-bg-soft text-ink-graphite">
          <Quote size={12} strokeWidth={1.5} />
        </div>
        <div className="flex-1">
          <div className="text-[11px] tracking-wide text-ink-muted">
            系统为什么这样判断
          </div>
          <div className="mt-0.5 text-[12.5px] leading-snug text-ink-graphite">
            共 {task.evidences.length} 条证据支持当前判断
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.ul
          key={task.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={subtleTransition}
          className="flex flex-1 flex-col"
        >
          {task.evidences.map((ev, idx) => (
            <motion.li
              key={ev.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...subtleTransition, delay: 0.06 + idx * 0.05 }}
              className={`group flex flex-col gap-1.5 py-3.5 ${
                idx === 0 ? "" : "border-t border-line-hair"
              }`}
            >
              <div className="flex items-center justify-between gap-2 text-[10.5px] tracking-wider text-ink-faint">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`h-1 w-1 rounded-full ${
                      ev.strength === "high"
                        ? "bg-accent-gold"
                        : ev.strength === "medium"
                          ? "bg-accent-dot"
                          : "bg-ink-ghost"
                    }`}
                  />
                  <span>{STRENGTH_LABEL[ev.strength]}</span>
                </span>
                {ev.source && <span>{ev.source}</span>}
              </div>
              <div className="text-[13px] font-medium leading-snug text-ink-main">
                {ev.title}
              </div>
              <p className="text-[12px] leading-relaxed text-ink-muted">
                {ev.description}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </AnimatePresence>

      <button className="mt-auto flex items-center justify-between border-t border-line-soft/70 pt-4 text-[12px] text-ink-graphite transition-colors hover:text-ink-main">
        <span>查看完整依据链</span>
        <ArrowUpRight size={13} strokeWidth={1.6} className="text-ink-muted" />
      </button>
    </aside>
  );
}
