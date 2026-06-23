// v1 Responsibility Report — the single-screen result. Summary + aviation
// checklist (middle) + 来源回看 (right). The default, primary view; the canvas is
// an alternate. Reorder and 核对 state persist; the audit timeline records them.

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { getReport, saveReport } from "../lib/api";
import { SIDE_LABEL, type RItem, type Report } from "../lib/responsibility";
import { OutputMenu } from "./OutputMenu";
import { ResponsibilityRow } from "./ResponsibilityRow";

function SummaryBar({ items, filter, setFilter }: {
  items: RItem[];
  filter: boolean;
  setFilter: (v: boolean) => void;
}) {
  const ours = items.filter((i) => i.side === "ours").length;
  const theirs = items.filter((i) => i.side === "theirs").length;
  const need = items.filter((i) => i.exceptions.length > 0).length;
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2 text-[12.5px]">
        <span className="font-semibold text-ink">{items.length} 项</span>
        <span className="text-faint">·</span>
        <span className="text-ink-soft">{ours} 我方承诺</span>
        <span className="text-faint">·</span>
        <span className="text-ink-soft">{theirs} 对方承诺</span>
        <span className="text-faint">·</span>
        <button
          onClick={() => setFilter(!filter)}
          className={`rounded px-1.5 py-0.5 ${filter ? "bg-warn-soft text-warn" : "text-warn"}`}
        >
          {need} 需核验{filter ? " ✕" : ""}
        </button>
      </div>
      <OutputMenu items={items} />
    </div>
  );
}

function SourceReview({ item }: { item: RItem | null }) {
  const [showBasis, setShowBasis] = useState(false);
  if (!item)
    return (
      <div className="rounded-xl border border-line bg-surface/80 p-4 text-[12.5px] text-faint">
        <div className="label mb-2">来源回看</div>
        点击任一事项，这里显示它的聊天原文出处。
      </div>
    );
  return (
    <div className="rounded-xl border border-line bg-surface/90 p-4">
      <div className="label mb-2">来源回看 · {item.name}</div>
      <div className="space-y-2">
        {item.sources.map((s, i) => (
          <div key={i} className="rounded-lg border border-line bg-paper px-3 py-2 text-[12.5px]">
            <div className="mb-0.5 flex items-center justify-between">
              <span className="font-medium text-ink">{s.speaker}</span>
              <span className="font-mono text-[10px] text-faint">第{s.line}行</span>
            </div>
            <div className="text-ink-soft">{s.text}</div>
          </div>
        ))}
      </div>
      <button
        onClick={() => setShowBasis((v) => !v)}
        className="label mt-3 hover:text-accent"
      >
        {showBasis ? "收起判断依据" : "查看判断依据"}
      </button>
      {showBasis && (
        <div className="mt-2 space-y-1 rounded-lg bg-paper px-3 py-2 text-[11.5px] text-ink-soft">
          <div>责任方：{SIDE_LABEL[item.side]}</div>
          <div>
            时间归一：{item.dueRaw ? `“${item.dueRaw}” → ${item.due}` : "原文无明确时间"}
          </div>
          {item.exceptions.length > 0 && (
            <div>异常：{item.exceptions.map((e) => e.label).join("、")}</div>
          )}
        </div>
      )}
    </div>
  );
}

export function ReportView({ documentId }: { documentId: string }) {
  const qc = useQueryClient();
  const { data, isError } = useQuery({
    queryKey: ["report", documentId],
    queryFn: () => getReport(documentId),
  });
  const [report, setReport] = useState<Report | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState(false);

  useEffect(() => {
    if (data) setReport(data);
  }, [data]);

  if (isError)
    return (
      <div className="flex h-full items-center justify-center text-[13px] text-faint">
        责任报告引擎暂仅在 demo 构建中可用。
      </div>
    );
  if (!report) return <div className="flex h-full items-center justify-center"><span className="label">读取报告…</span></div>;

  const persist = (next: Report, action: string, title: string) => {
    setReport(next);
    void saveReport(documentId, next, action, title).then(() =>
      qc.invalidateQueries({ queryKey: ["activity", documentId] }),
    );
  };
  const toggle = (id: string) =>
    persist(
      { ...report, items: report.items.map((it) => (it.id === id ? { ...it, checked: !it.checked } : it)) },
      "check",
      "核对责任事项",
    );
  const move = (id: string, dir: -1 | 1) => {
    const i = report.items.findIndex((x) => x.id === id);
    const j = i + dir;
    if (j < 0 || j >= report.items.length) return;
    const next = [...report.items];
    [next[i], next[j]] = [next[j], next[i]];
    persist({ ...report, items: next }, "reorder", "调整事项顺序");
  };

  const shown = filter ? report.items.filter((i) => i.exceptions.length > 0) : report.items;
  const selected = report.items.find((i) => i.id === selectedId) ?? null;

  return (
    <div className="absolute inset-0 overflow-auto bg-paper">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 pb-28 pt-24 lg:flex-row">
        <main className="min-w-0 flex-1">
          <SummaryBar items={report.items} filter={filter} setFilter={setFilter} />
          <section className="overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            <header className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-[13px] font-semibold text-ink">责任清单</span>
              <span className="label">逐项核对 · 起飞前检查</span>
            </header>
            {shown.length === 0 ? (
              <div className="px-4 py-10 text-center text-[13px] text-faint">
                没有发现明确可追踪的承诺。可补充更多上下文。
              </div>
            ) : (
              <ol>
                {shown.map((it) => (
                  <ResponsibilityRow
                    key={it.id}
                    item={it}
                    index={report.items.indexOf(it)}
                    selected={selectedId === it.id}
                    onSelect={() => setSelectedId(it.id)}
                    onToggle={() => toggle(it.id)}
                    onMove={(d) => move(it.id, d)}
                    canUp={report.items.indexOf(it) > 0}
                    canDown={report.items.indexOf(it) < report.items.length - 1}
                  />
                ))}
              </ol>
            )}
            <footer className="border-t border-line px-4 py-2.5 text-center">
              <span className="label">
                ✓ {report.items.filter((i) => i.checked).length}/{report.items.length} 已核对 · checklist complete
              </span>
            </footer>
          </section>
        </main>
        <aside className="lg:w-80 lg:shrink-0">
          <SourceReview item={selected} />
        </aside>
      </div>
    </div>
  );
}
