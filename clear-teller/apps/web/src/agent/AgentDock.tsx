// Agent entry — a calm, always-available affordance at the bottom. Clicking (or
// ⌘K) summons the agent; fields can be dragged here to feed it as context.
// P0 is the visual entry; P1 wires chat + drop.

export function AgentDock() {
  return (
    <div className="pointer-events-auto absolute bottom-5 left-1/2 z-40 -translate-x-1/2">
      <button className="flex items-center gap-2.5 rounded-full border border-line bg-surface/95 py-2 pl-3 pr-2 shadow-card backdrop-blur transition hover:shadow-focal">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-soft font-mono text-[12px] text-accent">
          ✦
        </span>
        <span className="text-[13px] text-ink-soft">问 Agent，或把字段拖到这里</span>
        <kbd className="rounded-md border border-line bg-paper px-1.5 py-0.5 font-mono text-[11px] text-faint">
          ⌘K
        </kbd>
      </button>
    </div>
  );
}
