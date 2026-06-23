// A small handle on each node for feeding it to the agent. Drag it onto the
// Agent Dock, or click it — both add the node as a context chip. `nodrag` keeps
// React Flow from moving the node while you grab the grip.

import { FEED_MIME, useAgentContext, type ContextChip } from "../lib/store";

export function FeedGrip({ chip, className = "" }: { chip: ContextChip; className?: string }) {
  const feed = useAgentContext((s) => s.feed);
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData(FEED_MIME, JSON.stringify(chip));
        e.dataTransfer.effectAllowed = "copy";
      }}
      onClick={(e) => {
        e.stopPropagation();
        feed(chip);
      }}
      title="拖到下方 Agent 投喂（或点按）"
      className={`nodrag flex h-5 w-5 cursor-grab items-center justify-center rounded text-[12px] leading-none text-faint transition hover:bg-paper hover:text-accent active:cursor-grabbing ${className}`}
    >
      ⠿
    </div>
  );
}
