// The conflict zone as a draggable canvas node, kept visually separate.

import { type NodeProps } from "@xyflow/react";

import type { Conflict } from "../../lib/api";
import { ConflictCard } from "../../scene/ConflictCard";
import { FeedGrip } from "../FeedGrip";

export function ConflictNode({ id, data, selected }: NodeProps) {
  const conflicts = (data as { conflicts: Conflict[] }).conflicts;
  return (
    <div
      className={`group relative ${selected ? "rounded-xl ring-2 ring-warn ring-offset-2 ring-offset-paper" : ""}`}
    >
      <FeedGrip
        chip={{ id, kind: "conflict", label: "冲突区" }}
        className="absolute right-2 top-2.5 z-10 opacity-0 group-hover:opacity-100"
      />
      <ConflictCard conflicts={conflicts} />
    </div>
  );
}
