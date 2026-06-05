import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import type { ReasoningChip } from "../types/ap";
import { subtleTransition } from "../lib/motion";

const ANGLE_PRESETS: Record<number, number[]> = {
  3: [225, 270, 315],
  4: [220, 320, 40, 140],
  5: [210, 260, 320, 50, 130],
  6: [205, 245, 295, 335, 65, 125],
  7: [200, 235, 275, 315, 35, 80, 140],
  8: [200, 230, 270, 310, 30, 70, 110, 150],
};

const FIELD_W = 780;
const FIELD_H = 480;
const CX = FIELD_W / 2;
const CY = FIELD_H / 2;
const RX = 340;
const RY = 200;
const TICK = 14;
const DOT_R = 1.8;

type Item = {
  chip: ReasoningChip;
  x: number;
  y: number;
  tx: number;
  ty: number;
  cos: number;
  i: number;
};

function makeItems(chips: ReasoningChip[]): Item[] {
  const n = Math.min(8, Math.max(3, chips.length));
  const angles = ANGLE_PRESETS[n] ?? ANGLE_PRESETS[6];
  return chips.slice(0, n).map((chip, i) => {
    const rad = (angles[i] * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const x = CX + cos * RX;
    const y = CY + sin * RY;
    const tx = x - cos * TICK;
    const ty = y - sin * TICK;
    return { chip, x, y, tx, ty, cos, i };
  });
}

export function OrbitalReasoningChips({ chips }: { chips: ReasoningChip[] }) {
  const items = makeItems(chips);

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 z-0 -translate-x-1/2 -translate-y-1/2"
      style={{ width: FIELD_W, height: FIELD_H }}
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${FIELD_W} ${FIELD_H}`}
        fill="none"
      >
        {items.map(({ chip, x, y, tx, ty }) => {
          const stroke = chip.passed
            ? "var(--accent-gold)"
            : "var(--accent-warn)";
          const opacity = chip.passed ? 0.75 : 0.9;
          return (
            <g key={chip.id} opacity={opacity}>
              <line
                x1={tx}
                y1={ty}
                x2={x}
                y2={y}
                stroke={stroke}
                strokeWidth={0.9}
                strokeLinecap="round"
              />
              <circle cx={x} cy={y} r={DOT_R} fill={stroke} />
            </g>
          );
        })}
      </svg>

      {items.map(({ chip, x, y, cos, i }) => {
        const side: "left" | "right" | "center" =
          cos < -0.25 ? "left" : cos > 0.25 ? "right" : "center";
        const offsetX = side === "left" ? -18 : side === "right" ? 18 : 0;
        const transformX =
          side === "left" ? "-100%" : side === "right" ? "0%" : "-50%";
        const style: CSSProperties = {
          left: `${x + offsetX}px`,
          top: `${y}px`,
          transform: `translate(${transformX}, -50%)`,
        };
        return (
          <motion.div
            key={chip.id}
            initial={{ opacity: 0, x: side === "left" ? 6 : side === "right" ? -6 : 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...subtleTransition, delay: 0.18 + i * 0.05 }}
            className="absolute whitespace-nowrap"
            style={style}
          >
            <span
              className={`text-[11px] tracking-tight ${
                chip.passed ? "text-ink-graphite" : "text-accent-warn"
              }`}
            >
              {chip.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
