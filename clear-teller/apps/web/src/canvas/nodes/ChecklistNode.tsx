// The focal checklist as a draggable canvas node. Reuses the designed card; a
// selection ring marks it as the agent's current context.

import { type NodeProps } from "@xyflow/react";

import type { ChecklistItem } from "../../lib/api";
import { FocalChecklist } from "../../scene/FocalChecklist";

export function ChecklistNode({ data, selected }: NodeProps) {
  const { items, documentId } = data as { items: ChecklistItem[]; documentId: string };
  return (
    <div className={selected ? "rounded-xl ring-2 ring-accent ring-offset-2 ring-offset-paper" : ""}>
      <FocalChecklist items={items} documentId={documentId} />
    </div>
  );
}
