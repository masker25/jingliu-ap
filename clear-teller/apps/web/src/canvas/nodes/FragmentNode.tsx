// A raw info-unit that wasn't surfaced into the checklist — the "若隐若现"
// divergent content. Faint and draggable; brightens on hover/select so you can
// still pull it back into focus or feed it to the agent.

import { type NodeProps } from "@xyflow/react";

import { FeedGrip } from "../FeedGrip";

export function FragmentNode({ id, data, selected }: NodeProps) {
  const { text, provenance } = data as { text: string; provenance: string | null };
  return (
    <div
      className={`group flex max-w-[240px] items-start gap-1 rounded-lg border bg-surface/70 px-3 py-1.5 text-[12px] shadow-sm backdrop-blur-[1px] transition
        ${
          selected
            ? "border-accent text-ink opacity-100"
            : "border-line text-faint opacity-60 hover:opacity-100 hover:text-ink-soft"
        }`}
    >
      <span className="flex-1">
        {text}
        {provenance && (
          <span className="ml-1.5 font-mono text-[10px] text-faint">· {provenance}</span>
        )}
      </span>
      <FeedGrip
        chip={{ id, kind: "fragment", label: text.slice(0, 12) + (text.length > 12 ? "…" : "") }}
        className="opacity-0 group-hover:opacity-100"
      />
    </div>
  );
}
