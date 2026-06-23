// The conflict zone as a draggable canvas node, kept visually separate.

import { type NodeProps } from "@xyflow/react";

import type { Conflict } from "../../lib/api";
import { ConflictCard } from "../../scene/ConflictCard";

export function ConflictNode({ data, selected }: NodeProps) {
  const conflicts = (data as { conflicts: Conflict[] }).conflicts;
  return (
    <div className={selected ? "rounded-xl ring-2 ring-warn ring-offset-2 ring-offset-paper" : ""}>
      <ConflictCard conflicts={conflicts} />
    </div>
  );
}
