import { useQuery } from "@tanstack/react-query";

import { AgentDock } from "./agent/AgentDock";
import { CommandPalette } from "./agent/CommandPalette";
import { RunTimeline } from "./agent/RunTimeline";
import { getHealth } from "./lib/api";
import { ConflictCard } from "./scene/ConflictCard";
import { DivergentNodes } from "./scene/DivergentNodes";
import { FocalChecklist } from "./scene/FocalChecklist";

// The design pass renders the product's visual identity over a divergent
// dot-grid canvas. The tldraw substrate (src/canvas/Canvas.tsx) becomes the live
// interactive layer in P1; here we present the focus/fade language directly.

function HealthBadge() {
  const { data, isError } = useQuery({ queryKey: ["health"], queryFn: getHealth });
  const ok = !isError && data?.status === "ok";
  return (
    <div className="pointer-events-auto absolute bottom-5 left-4 z-40 flex items-center gap-1.5 rounded-full border border-line bg-surface/90 px-3 py-1.5 shadow-card backdrop-blur">
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-ok" : "bg-faint"}`} />
      <span className="text-[11px] text-ink-soft">backend {ok ? "connected" : "…"}</span>
    </div>
  );
}

function Brand() {
  return (
    <div className="pointer-events-none absolute left-4 top-4 z-40 select-none">
      <div className="text-[15px] font-semibold tracking-tight text-ink">clear teller</div>
      <div className="label mt-0.5">混乱进 · 清单出</div>
    </div>
  );
}

export default function App() {
  return (
    <div className="dot-grid relative h-full w-full overflow-hidden bg-paper">
      {/* divergent, faint raw fragments */}
      <DivergentNodes />

      {/* focal structure brought forward */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-6">
        <FocalChecklist />
        <ConflictCard />
      </div>

      {/* agent + chrome */}
      <Brand />
      <RunTimeline />
      <AgentDock />
      <HealthBadge />
      <CommandPalette />
    </div>
  );
}
