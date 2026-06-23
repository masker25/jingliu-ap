// Shared UI state. The agent-context store lets the ⌘K palette read whatever is
// currently selected on the canvas, so invoking the agent carries that context.

import { create } from "zustand";

export type ContextChip = { id: string; kind: "checklist" | "conflict" | "fragment"; label: string };

type AgentContext = {
  selected: ContextChip[];
  setSelected: (chips: ContextChip[]) => void;
};

export const useAgentContext = create<AgentContext>((set) => ({
  selected: [],
  setSelected: (chips) => set({ selected: chips }),
}));
