// The "若隐若现" divergent layer: raw, scattered fragments that fade into the
// canvas. Decorative and non-interactive — they convey that messy input has been
// absorbed, with only the focal structure brought forward.

const FRAGMENTS: { text: string; top: string; left: string; opacity: number; rotate: number }[] = [
  { text: "“先把预算敲定…”", top: "16%", left: "12%", opacity: 0.5, rotate: -4 },
  { text: "客服话术 v2", top: "28%", left: "78%", opacity: 0.42, rotate: 3 },
  { text: "灰度？10%还是5%", top: "70%", left: "16%", opacity: 0.35, rotate: 2 },
  { text: "📷 截图：流程草图", top: "20%", left: "46%", opacity: 0.28, rotate: -2 },
  { text: "“周四还是下周一”", top: "76%", left: "70%", opacity: 0.46, rotate: 4 },
  { text: "对账单 budget.xlsx", top: "60%", left: "84%", opacity: 0.3, rotate: -3 },
  { text: "“记得通知运营”", top: "12%", left: "64%", opacity: 0.32, rotate: 2 },
];

export function DivergentNodes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {FRAGMENTS.map((f, i) => (
        <div
          key={i}
          className="absolute select-none rounded-lg border border-line bg-surface/70 px-3 py-1.5 text-[12px] text-faint shadow-sm backdrop-blur-[1px]"
          style={{
            top: f.top,
            left: f.left,
            opacity: f.opacity,
            transform: `rotate(${f.rotate}deg)`,
          }}
        >
          {f.text}
        </div>
      ))}
    </div>
  );
}
