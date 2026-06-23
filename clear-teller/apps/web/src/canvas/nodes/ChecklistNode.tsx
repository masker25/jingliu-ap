// The focal checklist as a draggable canvas node. Reuses the designed card; a
// selection ring marks it as the agent's current context.

import { type NodeProps } from "@xyflow/react";

import type { ChecklistItem } from "../../lib/api";
import { FocalChecklist } from "../../scene/FocalChecklist";
import { FeedGrip } from "../FeedGrip";

export function ChecklistNode({ id, data, selected }: NodeProps) {
  const { items, documentId } = data as { items: ChecklistItem[]; documentId: string };
  return (
    <div
      className={`group relative ${selected ? "rounded-xl ring-2 ring-accent ring-offset-2 ring-offset-paper" : ""}`}
    >
      <FeedGrip
        chip={{ id, kind: "checklist", label: "执行清单" }}
        className="absolute right-2 top-2.5 z-10 opacity-0 group-hover:opacity-100"
      />
      <FocalChecklist items={items} documentId={documentId} />
    </div>
  );
}
