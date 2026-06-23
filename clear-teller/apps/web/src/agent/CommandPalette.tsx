// ⌘K invocation layer — the agent comes to your cursor, pre-loaded with the
// current selection. P0 wires the palette + shortcut; P1 connects the actions
// to the agent run/chat endpoints.

import { Command } from "cmdk";
import { useEffect, useState } from "react";

import { useAgentContext } from "../lib/store";

const ACTIONS = [
  { icon: "✦", label: "整理选中内容", hint: "去重 · 分级 · 抽离矛盾" },
  { icon: "☑", label: "生成执行清单", hint: "航空检查单级严谨" },
  { icon: "⚠", label: "标记为冲突", hint: "送入待确认区" },
  { icon: "❏", label: "生成流程图 / 思维导图", hint: "个性化视图" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const selected = useAgentContext((s) => s.selected);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-ink/10 pt-[22vh] backdrop-blur-[2px]"
      onClick={() => setOpen(false)}
    >
      <Command
        className="w-[560px] overflow-hidden rounded-xl border border-line bg-surface shadow-focal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-line px-4">
          <span className="font-mono text-[12px] text-accent">⌘K</span>
          <Command.Input
            autoFocus
            placeholder={selected.length ? "问 Agent…  关于选中内容" : "问 Agent…  先在画布上选中节点"}
            className="w-full bg-transparent py-3.5 text-[14px] text-ink outline-none placeholder:text-faint"
          />
        </div>
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-paper px-3 py-2">
            <span className="label mr-1">上下文</span>
            {selected.map((c) => (
              <span
                key={c.id}
                className={`rounded-md px-1.5 py-0.5 text-[11px] ${
                  c.kind === "conflict" ? "bg-warn-soft text-warn" : "bg-accent-soft text-accent"
                }`}
              >
                {c.label}
              </span>
            ))}
          </div>
        )}
        <Command.List className="max-h-80 overflow-auto p-1.5">
          <Command.Empty className="px-3 py-8 text-center text-[13px] text-faint">
            没有匹配的动作
          </Command.Empty>
          <Command.Group
            heading="Agent"
            className="px-2 py-1 [&_[cmdk-group-heading]]:px-1 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-label [&_[cmdk-group-heading]]:text-faint"
          >
            {ACTIONS.map((a) => (
              <Command.Item
                key={a.label}
                className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-2.5 text-[13.5px] text-ink data-[selected=true]:bg-accent-soft"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-paper font-mono text-[13px] text-accent">
                  {a.icon}
                </span>
                <span className="flex-1">{a.label}</span>
                <span className="text-[11px] text-faint">{a.hint}</span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
