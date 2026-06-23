import { useQuery } from "@tanstack/react-query";

import { CommandPalette } from "./agent/CommandPalette";
import { RunTimeline } from "./agent/RunTimeline";
import { Canvas } from "./canvas/Canvas";
import { getHealth } from "./lib/api";

function HealthBadge() {
  const { data, isError } = useQuery({ queryKey: ["health"], queryFn: getHealth });
  const ok = !isError && data?.status === "ok";
  return (
    <div className="absolute bottom-3 left-3 z-40 rounded-full border border-black/10 bg-white/90 px-3 py-1 text-xs shadow backdrop-blur">
      <span className={ok ? "text-emerald-600" : "text-faint"}>●</span>{" "}
      <span className="text-ink">backend {ok ? "connected" : "…"}</span>
    </div>
  );
}

export default function App() {
  return (
    <div className="relative h-full w-full">
      <Canvas />
      <RunTimeline />
      <CommandPalette />
      <HealthBadge />
      <div className="absolute left-3 top-3 z-40 select-none text-sm font-medium text-ink/70">
        clear teller <span className="text-faint">· ⌘K 唤起 Agent</span>
      </div>
    </div>
  );
}
