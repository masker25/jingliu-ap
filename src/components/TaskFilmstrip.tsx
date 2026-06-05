import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CornerDownRight,
  GitMerge,
  ScanSearch,
  ArrowUpRight,
} from "lucide-react";
import type { APTask, APTaskStatus } from "../types/ap";
import { STATUS_LABEL } from "../types/ap";
import { fastSubtleTransition } from "../lib/motion";

type TaskFilmstripProps = {
  tasks: APTask[];
  selectedTaskId: string;
  onSelectTask: (id: string) => void;
};

const STATUS_ICON: Record<APTaskStatus, typeof CheckCircle2> = {
  auto_matchable: CheckCircle2,
  need_po: CornerDownRight,
  risk_review: AlertTriangle,
  merge_payment: GitMerge,
  manual_confirm: ScanSearch,
  ready_to_book: ArrowUpRight,
  blocked: AlertTriangle,
  completed: CheckCircle2,
};

const STATUS_TONE: Record<APTaskStatus, string> = {
  auto_matchable: "text-ink-graphite",
  need_po: "text-accent-warn",
  risk_review: "text-accent-warn",
  merge_payment: "text-ink-graphite",
  manual_confirm: "text-accent-warn",
  ready_to_book: "text-ink-graphite",
  blocked: "text-accent-warn",
  completed: "text-ink-muted",
};

export function TaskFilmstrip({
  tasks,
  selectedTaskId,
  onSelectTask,
}: TaskFilmstripProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current?.querySelector<HTMLElement>(
      `[data-task-id="${selectedTaskId}"]`,
    );
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [selectedTaskId]);

  const remaining = tasks.filter((t) => t.status !== "completed").length;

  return (
    <div className="relative flex flex-col gap-3 px-9 pt-4 pb-5">
      <div className="flex items-center justify-between text-[10px] tracking-widest2 text-ink-faint">
        <div className="flex items-center gap-3">
          <span className="h-px w-5 bg-ink-faint" />
          <span>AP PROCESSING QUEUE</span>
          <span className="text-ink-muted">
            待处理 {remaining} / {tasks.length}
          </span>
        </div>
        <div className="flex items-center gap-4 text-ink-muted">
          <button className="transition-colors hover:text-ink-graphite">按到期排序</button>
          <button className="transition-colors hover:text-ink-graphite">按风险排序</button>
        </div>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-[14px] h-px bg-line-soft/70" />

        <div
          ref={containerRef}
          className="filmstrip-scroll relative flex items-start gap-0 overflow-x-auto pb-2 pt-0"
        >
          {tasks.map((task) => {
            const isSelected = task.id === selectedTaskId;
            const isCompleted = task.status === "completed";
            const Icon = STATUS_ICON[task.status];

            return (
              <button
                key={task.id}
                data-task-id={task.id}
                onClick={() => onSelectTask(task.id)}
                className="group relative flex w-[190px] shrink-0 flex-col items-center gap-2.5 px-2 pt-0 text-left"
              >
                <div className="relative flex h-7 items-center justify-center">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isSelected ? 1.15 : 1,
                    }}
                    transition={fastSubtleTransition}
                    className={`relative h-3 w-3 rounded-full border ${
                      isSelected
                        ? "border-accent-gold bg-accent-gold/25"
                        : isCompleted
                          ? "border-ink-ghost bg-ink-ghost/40"
                          : "border-ink-faint bg-bg-main"
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute inset-0 -m-1.5 animate-pulse rounded-full border border-accent-gold/40" />
                    )}
                  </motion.div>
                </div>

                <motion.div
                  initial={false}
                  animate={{ y: isSelected ? -2 : 0 }}
                  transition={fastSubtleTransition}
                  className={`relative flex w-full flex-col gap-1.5 rounded-md px-3 pb-2.5 pt-2 transition-colors duration-300 ease-gentle ${
                    isSelected
                      ? "border border-line-soft bg-bg-soft"
                      : "border border-transparent group-hover:bg-bg-soft/60"
                  } ${isCompleted ? "opacity-55" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-[11px] tracking-wider ${
                        isSelected ? "text-ink-main" : "text-ink-muted"
                      }`}
                    >
                      {task.id}
                    </span>
                    <span className="font-mono text-[10.5px] text-ink-faint">
                      ¥{(task.amount / 1000).toFixed(1)}k
                    </span>
                  </div>

                  <div
                    className={`line-clamp-1 text-[12px] font-medium ${
                      isSelected ? "text-ink-main" : "text-ink-graphite"
                    }`}
                  >
                    {task.supplier}
                  </div>

                  <div className="flex items-center justify-between">
                    <span
                      className={`flex items-center gap-1 text-[10px] tracking-wide ${
                        isCompleted ? "text-ink-faint" : STATUS_TONE[task.status]
                      }`}
                    >
                      <Icon size={9} strokeWidth={1.7} />
                      <span>{STATUS_LABEL[task.status]}</span>
                    </span>
                    <span className="font-mono text-[10px] text-ink-faint">
                      {task.aiJudgment.confidence.toFixed(1)}%
                    </span>
                  </div>
                </motion.div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
