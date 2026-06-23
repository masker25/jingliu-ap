// Multi-document history. Lists past inputs; click to reopen one (its checklist,
// conflicts, canvas layout, and audit all restore). A collapsible left rail.

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { getDocuments } from "../lib/api";

function when(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function DocumentList({
  currentId,
  onOpen,
  onNew,
}: {
  currentId: string | null;
  onOpen: (id: string) => void;
  onNew: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { data } = useQuery({ queryKey: ["documents"], queryFn: getDocuments });
  const docs = data ?? [];

  return (
    <div className="absolute left-4 top-20 z-40">
      <button
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto label flex items-center gap-1.5 hover:text-accent"
      >
        ☰ 历史 {docs.length > 0 && <span className="text-faint">({docs.length})</span>}
      </button>
      {open && (
        <div className="pointer-events-auto mt-2 w-60 overflow-hidden rounded-xl border border-line bg-surface/95 shadow-card backdrop-blur">
          <button
            onClick={() => {
              onNew();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 border-b border-line px-3 py-2.5 text-[13px] text-accent hover:bg-accent-soft"
          >
            ＋ 新建
          </button>
          <ul className="max-h-[55vh] overflow-auto">
            {docs.length === 0 ? (
              <li className="px-3 py-4 text-[12px] text-faint">还没有记录</li>
            ) : (
              docs.map((d) => (
                <li key={d.id}>
                  <button
                    onClick={() => {
                      onOpen(d.id);
                      setOpen(false);
                    }}
                    className={`block w-full border-b border-line px-3 py-2.5 text-left last:border-0 hover:bg-paper ${
                      d.id === currentId ? "bg-accent-soft" : ""
                    }`}
                  >
                    <div className="truncate text-[13px] text-ink">{d.title || "未命名输入"}</div>
                    <div className="mt-0.5 font-mono text-[10px] text-faint">{when(d.created_at)}</div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
