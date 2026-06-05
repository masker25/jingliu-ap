import { motion } from "framer-motion";
import { Check } from "lucide-react";
import type { APFlowStage } from "../types/ap";
import { FLOW_STAGES } from "../types/ap";
import { subtleTransition } from "../lib/motion";

type FlowStageStripProps = {
  currentStage: APFlowStage;
};

export function FlowStageStrip({ currentStage }: FlowStageStripProps) {
  const currentIdx = FLOW_STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div className="relative z-10 flex w-full max-w-[760px] items-start justify-between">
      {FLOW_STAGES.map((stage, idx) => {
        const isPast = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isFuture = idx > currentIdx;
        const isLast = idx === FLOW_STAGES.length - 1;

        return (
          <div
            key={stage.id}
            className="relative flex flex-1 flex-col items-center gap-2.5"
          >
            {!isLast && (
              <div
                className="absolute left-1/2 top-[7px] h-0 w-full"
                aria-hidden
              >
                <div
                  className={
                    isFuture
                      ? "h-0 border-t border-dashed border-line-soft"
                      : "h-px bg-ink-faint/70"
                  }
                />
              </div>
            )}

            <motion.div
              initial={false}
              animate={{ scale: isCurrent ? 1.1 : 1 }}
              transition={subtleTransition}
              className={`relative z-10 flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
                isPast
                  ? "border-ink-graphite bg-ink-graphite text-bg-soft"
                  : isCurrent
                    ? "border-accent-gold bg-bg-soft"
                    : "border-line-soft bg-bg-main"
              }`}
            >
              {isPast ? (
                <Check size={8} strokeWidth={2.4} />
              ) : isCurrent ? (
                <span className="h-1.5 w-1.5 rounded-full bg-accent-gold" />
              ) : null}
            </motion.div>

            <span
              className={`text-[11px] tracking-wide ${
                isCurrent
                  ? "font-medium text-ink-main"
                  : isPast
                    ? "text-ink-graphite"
                    : "text-ink-faint"
              }`}
            >
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
