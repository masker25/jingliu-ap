// The infinite canvas (React Flow): focal checklist + separate conflict zone as
// draggable nodes, surrounded by the faint raw fragments. Selecting nodes feeds
// the ⌘K agent context. Pan/zoom/drag are real; positions are local for now
// (persisting to canvas_state + audit is P3).

import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  useNodesState,
  type Node,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";

import { saveCanvas, type DocumentOut } from "../lib/api";
import { useAgentContext, type ContextChip } from "../lib/store";
import { ChecklistNode } from "./nodes/ChecklistNode";
import { ConflictNode } from "./nodes/ConflictNode";
import { FragmentNode } from "./nodes/FragmentNode";

const nodeTypes: NodeTypes = {
  checklist: ChecklistNode,
  conflict: ConflictNode,
  fragment: FragmentNode,
};

const FOCAL = { x: 0, y: 0 };
const CONFLICT = { x: 560, y: 0 };
const MAX_FRAGMENTS = 12;

function buildNodes(doc: DocumentOut): Node[] {
  // restore saved positions when present, else use the computed layout
  const saved = doc.canvas ?? {};
  const at = (id: string, fallback: { x: number; y: number }) => {
    const p = saved[id];
    return p ? { x: p.x, y: p.y } : fallback;
  };

  const nodes: Node[] = [
    {
      id: "checklist",
      type: "checklist",
      position: at("checklist", FOCAL),
      data: { items: doc.checklist, documentId: doc.id },
    },
  ];
  if (doc.conflicts.length > 0) {
    nodes.push({
      id: "conflict",
      type: "conflict",
      position: at("conflict", CONFLICT),
      data: { conflicts: doc.conflicts },
    });
  }
  // scatter unsurfaced fragments around the focal cluster (golden-angle spiral)
  const fragments = doc.units.filter((u) => !u.surfaced).slice(0, MAX_FRAGMENTS);
  fragments.forEach((u, i) => {
    const angle = i * 2.399; // golden angle in radians
    const radius = 380 + (i % 3) * 130;
    const id = `frag-${u.id}`;
    nodes.push({
      id,
      type: "fragment",
      position: at(id, { x: 280 + radius * Math.cos(angle), y: 120 + radius * Math.sin(angle) }),
      data: { text: u.text, provenance: u.provenance },
    });
  });
  return nodes;
}

function chipFor(n: Node): ContextChip {
  if (n.type === "checklist") return { id: n.id, kind: "checklist", label: "执行清单" };
  if (n.type === "conflict") return { id: n.id, kind: "conflict", label: "冲突区" };
  const text = (n.data as { text?: string }).text ?? "";
  return { id: n.id, kind: "fragment", label: text.slice(0, 12) + (text.length > 12 ? "…" : "") };
}

export function FlowCanvas({ doc }: { doc: DocumentOut }) {
  const initial = useMemo(() => buildNodes(doc), [doc]);
  const [nodes, , onNodesChange] = useNodesState(initial);
  const setSelected = useAgentContext((s) => s.setSelected);
  const qc = useQueryClient();

  // persist positions when a drag ends; refresh the audit-backed timeline
  const persist = (current: Node[]) => {
    const positions = Object.fromEntries(
      current.map((n) => [n.id, { x: Math.round(n.position.x), y: Math.round(n.position.y) }]),
    );
    void saveCanvas(doc.id, positions).then(() =>
      qc.invalidateQueries({ queryKey: ["activity", doc.id] }),
    );
  };

  return (
    <ReactFlow
      nodes={nodes}
      onNodesChange={onNodesChange}
      onNodeDragStop={() => persist(nodes)}
      nodeTypes={nodeTypes}
      onSelectionChange={({ nodes: sel }) => setSelected(sel.map(chipFor))}
      fitView
      fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
      minZoom={0.3}
      maxZoom={1.5}
      panOnScroll
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="#e3e3df" />
      <Controls showInteractive={false} className="!shadow-card" />
    </ReactFlow>
  );
}
