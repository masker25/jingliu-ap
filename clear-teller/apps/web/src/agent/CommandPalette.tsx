// ⌘K invocation layer — the modern "agent comes to your cursor" pattern. Press
// ⌘K / Ctrl+K anywhere to summon the agent in place, pre-loaded with the current
// selection as context. P0 wires the palette + shortcut; P1 connects it to the
// agent chat/run endpoints.

import { Command } from "cmdk";
import { useEffect, useState } from "react";

export function CommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-32"
      onClick={() => setOpen(false)}
    >
      <Command
        className="w-[560px] overflow-hidden rounded-xl border border-black/10 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command.Input
          autoFocus
          placeholder="问 Agent…  (基于当前选区)"
          className="w-full border-b border-black/5 px-4 py-3 text-sm outline-none"
        />
        <Command.List className="max-h-72 overflow-auto p-2 text-sm">
          <Command.Empty className="px-2 py-6 text-center text-faint">
            P1 接入：整理 / 合并重复 / 标记冲突 / 生成视图
          </Command.Empty>
          <Command.Group heading="Agent" className="text-faint">
            <Command.Item className="cursor-pointer rounded px-2 py-2 hover:bg-black/5">
              整理选中内容
            </Command.Item>
            <Command.Item className="cursor-pointer rounded px-2 py-2 hover:bg-black/5">
              生成清单
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}
