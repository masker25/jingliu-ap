// Shared UI state.
//  · selected — what's currently selected on the canvas (drives ⌘K context).
//  · fed      — fields explicitly dragged into the Agent Dock to feed the agent.
// Both feed the agent's context; "fed" is the deliberate, sticky set.

import { create } from "zustand";

export type ContextChip = { id: string; kind: "checklist" | "conflict" | "fragment"; label: string };

// the dataTransfer mime used when dragging a field onto the dock
export const FEED_MIME = "application/clear-teller";

type AgentContext = {
  selected: ContextChip[];
  fed: ContextChip[];
  setSelected: (chips: ContextChip[]) => void;
  feed: (chip: ContextChip) => void;
  unfeed: (id: string) => void;
  clearFed: () => void;
};

export const useAgentContext = create<AgentContext>((set) => ({
  selected: [],
  fed: [],
  setSelected: (chips) => set({ selected: chips }),
  feed: (chip) =>
    set((s) => (s.fed.some((c) => c.id === chip.id) ? s : { fed: [...s.fed, chip] })),
  unfeed: (id) => set((s) => ({ fed: s.fed.filter((c) => c.id !== id) })),
  clearFed: () => set({ fed: [] }),
}));
