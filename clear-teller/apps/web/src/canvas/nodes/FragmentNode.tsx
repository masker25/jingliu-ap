// A raw info-unit that wasn't surfaced into the checklist — the "若隐若现"
// divergent content. Faint and draggable; brightens on hover/select so you can
// still pull it back into focus or feed it to the agent.

import { type NodeProps } from "@xyflow/react";

export function FragmentNode({ data, selected }: NodeProps) {
  const { text, provenance } = data as { text: string; provenance: string | null };
  return (
    <div
      className={`max-w-[220px] rounded-lg border bg-surface/70 px-3 py-1.5 text-[12px] shadow-sm backdrop-blur-[1px] transition
        ${
          selected
            ? "border-accent text-ink opacity-100"
            : "border-line text-faint opacity-60 hover:opacity-100 hover:text-ink-soft"
        }`}
    >
      {text}
      {provenance && <span className="ml-1.5 font-mono text-[10px] text-faint">· {provenance}</span>}
    </div>
  );
}
