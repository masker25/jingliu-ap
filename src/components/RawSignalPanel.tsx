import { motion, AnimatePresence } from "framer-motion";
import { FileText, Sparkles } from "lucide-react";
import type { APTask } from "../types/ap";
import { fastSubtleTransition } from "../lib/motion";
import { STATUS_LABEL } from "../types/ap";

type RawSignalPanelProps = {
  task: APTask;
};

export function RawSignalPanel({ task }: RawSignalPanelProps) {
  return (
    <aside className="flex h-full w-[260px] shrink-0 flex-col gap-5 border-r border-line-soft/60 px-6 pt-7 pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10.5px] tracking-widest2 text-ink-faint">
          <span className="h-px w-4 bg-ink-faint" />
          <span>RAW SIGNAL</span>
        </div>
        <span className="text-[10.5px] tracking-wider text-ink-faint">
          原始信号
        </span>
      </div>

      <div className="flex items-start gap-3">
        <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-md border border-line-soft bg-bg-soft text-ink-graphite">
          <FileText size={13} strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] tracking-wide text-ink-muted">
            当前对象 · 待处理发票
          </div>
          <div className="mt-1 text-[15px] font-medium tracking-tight text-ink-main">
            {task.id}
          </div>
          <div className="mt-0.5 truncate text-[12px] text-ink-muted">
            {task.category ?? STATUS_LABEL[task.status]}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.dl
          key={task.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -2 }}
          transition={fastSubtleTransition}
          className="flex flex-col"
        >
          {task.rawSignals.map((signal, idx) => (
            <div
              key={`${task.id}-${signal.label}`}
              className={`flex flex-col gap-1 py-3 ${
                idx === 0 ? "" : "border-t border-line-hair"
              }`}
            >
              <dt className="text-[10.5px] tracking-wider text-ink-faint">
                {signal.label}
              </dt>
              <dd className="flex items-baseline justify-between gap-2 text-[13.5px] text-ink-graphite">
                <span className="truncate font-medium">{signal.value}</span>
                {signal.hint && (
                  <span className="shrink-0 text-[10.5px] text-ink-faint">
                    {signal.hint}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </motion.dl>
      </AnimatePresence>

      <div className="mt-auto flex items-center gap-2 text-[11px] text-ink-muted">
        <Sparkles size={11} strokeWidth={1.5} className="text-accent-gold" />
        <span>AI 已读取 {task.rawSignals.length} 项原始字段</span>
      </div>
    </aside>
  );
}
