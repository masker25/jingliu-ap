import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import type { RiskLevel } from "../types/ap";
import { stageTransition, subtleTransition } from "../lib/motion";
import { OrbitalReasoningChips } from "./ReasoningChips";
import { AnalyticalTraceLayer } from "./AnalyticalTraceLayer";
import type { APTask } from "../types/ap";

type JudgmentSurfaceProps = {
  task: APTask;
  onConfirm: () => void;
};

const RISK_META: Record<
  RiskLevel,
  { label: string; tone: string; Icon: typeof Shield }
> = {
  low: { label: "低风险", tone: "text-ink-graphite", Icon: ShieldCheck },
  medium: { label: "中风险", tone: "text-accent-warn", Icon: Shield },
  high: { label: "高风险", tone: "text-accent-warn", Icon: ShieldAlert },
};

function ConfidenceMark({ value }: { value: number }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-baseline gap-1">
        <span className="font-mono text-[40px] font-medium leading-none tracking-tight text-ink-main">
          {value.toFixed(1)}
        </span>
        <span className="font-mono text-[18px] font-medium leading-none text-ink-graphite">
          %
        </span>
      </div>
      <span className="text-[10px] tracking-widest2 text-ink-faint">
        置信度
      </span>
    </div>
  );
}

function MetaItem({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: string;
  align?: "left" | "center" | "right";
}) {
  const alignClass =
    align === "right" ? "items-end" : align === "center" ? "items-center" : "items-start";
  return (
    <div className={`flex flex-col gap-0.5 ${alignClass}`}>
      <span className="text-[9.5px] tracking-widest2 text-ink-faint">
        {label}
      </span>
      <span className="text-[12px] font-medium text-ink-graphite">{value}</span>
    </div>
  );
}

export function JudgmentSurface({ task, onConfirm }: JudgmentSurfaceProps) {
  const { aiJudgment, reasoningChips } = task;
  const risk = RISK_META[aiJudgment.riskLevel];
  const RiskIcon = risk.Icon;

  return (
    <section className="relative flex h-full min-w-0 flex-1 flex-col">
      <AnalyticalTraceLayer />

      <div className="relative z-10 flex items-center justify-between px-12 pt-7 text-[10px] tracking-widest2 text-ink-faint">
        <div className="flex items-center gap-2">
          <span className="h-px w-5 bg-ink-faint" />
          <span>AI JUDGMENT SURFACE</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{task.id} · {task.type.toUpperCase().replace("_", " ")}</span>
          <span className="h-px w-5 bg-ink-faint" />
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        <OrbitalReasoningChips chips={reasoningChips} />

        <AnimatePresence mode="wait">
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={stageTransition}
            className="relative z-10 flex w-[420px] flex-col items-center gap-5 text-center"
          >
            <ConfidenceMark value={aiJudgment.confidence} />

            <h1 className="text-balance text-[60px] font-medium leading-[1.04] tracking-tightest text-ink-main">
              {aiJudgment.result}
            </h1>

            <div className="flex max-w-[360px] flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-[10px] tracking-widest2 text-ink-faint">
                <span className="h-px w-3 bg-ink-faint" />
                <span>建议动作</span>
                <span className="h-px w-3 bg-ink-faint" />
              </div>
              <p className="text-balance text-[13px] leading-relaxed text-ink-graphite">
                {aiJudgment.suggestedAction}
              </p>
            </div>

            <div className="flex items-center gap-2.5 text-[11px] text-ink-muted">
              <span className={`flex items-center gap-1 ${risk.tone}`}>
                <RiskIcon size={11} strokeWidth={1.6} />
                <span>{risk.label}</span>
              </span>
              <span className="text-line-soft">·</span>
              <span>{aiJudgment.statusLine}</span>
            </div>

            <div className="mt-2 flex items-center gap-5 text-[12px]">
              <button
                onClick={onConfirm}
                className="group flex items-center gap-1.5 border-b border-ink-graphite/70 pb-0.5 font-medium text-ink-main transition-colors hover:border-accent-gold hover:text-accent-warn"
              >
                <span>确认并处理下一项</span>
                <ArrowRight
                  size={12}
                  strokeWidth={1.6}
                  className="transition-transform duration-300 ease-gentle group-hover:translate-x-0.5"
                />
              </button>
              <span className="h-3 w-px bg-line-soft" />
              <button className="text-ink-muted transition-colors hover:text-ink-graphite">
                驳回判断
              </button>
              <button className="text-ink-muted transition-colors hover:text-ink-graphite">
                人工接管
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        key={`${task.id}-meta`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...subtleTransition, delay: 0.18 }}
        className="relative z-10 flex items-end justify-between px-12 pb-5"
      >
        <MetaItem label="主体" value={task.entity} />
        <MetaItem
          label="对账金额"
          value={`¥${task.amount.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}`}
          align="center"
        />
        <MetaItem
          label={task.dueDate ? "到期" : "类型"}
          value={task.dueDate ?? task.type}
          align="right"
        />
      </motion.div>
    </section>
  );
}
