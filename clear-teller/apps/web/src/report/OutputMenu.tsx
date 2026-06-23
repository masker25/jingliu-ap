// 输出结果 ▼ — the single result exit. Copy internal list (markdown), export PDF
// (print), or generate a neutral external-confirmation draft. Selection here is
// independent of the row checkboxes (which mean 核对/完成 only).

import { useState } from "react";

import { SIDE_LABEL, type RItem } from "../lib/responsibility";

function copyInternal(items: RItem[]) {
  const head = "| # | 事项 | 责任方 | 承诺动作 | 交付物 | 截止日期 | 下一步 |\n|---|---|---|---|---|---|---|";
  const rows = items.map((it, i) =>
    `| ${i + 1} | ${it.name} | ${SIDE_LABEL[it.side]} | ${it.action} | ${it.deliverable ?? "缺交付物"} | ${it.due ?? "缺截止日期"} | ${it.next} |`,
  );
  navigator.clipboard.writeText([head, ...rows].join("\n"));
}

function cleanAction(text: string): string {
  return text
    .replace(/^(你好|您好|好的|收到|这边|那边|我方|贵司|我们|你们|麻烦|请|，|,|、)+/g, "")
    .replace(/(下周|本周|这周)?[周礼拜][一二三四五六日天](之?前)?|明天|后天|今天|\d{1,2}\s*月\s*\d{1,2}\s*日?/g, "")
    .trim();
}

// build a neutral line from the structured fields, not the raw sentence
function externalLine(it: RItem): string {
  const who = it.side === "ours" ? "我方" : it.side === "theirs" ? "贵司" : "（待确认方）";
  const when = it.due ? `于 ${it.due} 前` : "";
  let what: string;
  if (it.deliverable === "付款") what = "完成付款";
  else if (it.deliverable) what = `提供${it.deliverable}`;
  else what = cleanAction(it.action) || "完成相关事项";
  return `${who}${when}${what}`;
}

function ExternalModal({ items, onClose }: { items: RItem[]; onClose: () => void }) {
  // suitable for外发: no exceptions and a clear side; the rest need caution
  const suitable = items.filter((it) => it.exceptions.length === 0 && it.side !== "unclear_side");
  const caution = items.filter((it) => !suitable.includes(it));
  const [picked, setPicked] = useState<Set<string>>(new Set(suitable.map((i) => i.id)));
  const toggle = (id: string) =>
    setPicked((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const chosen = items.filter((i) => picked.has(i.id));
  const text =
    chosen.length === 0
      ? "（请至少选择一项）"
      : `您好，关于刚才沟通的内容，我整理了几点确认要点：\n` +
        chosen.map((it, i) => `${i + 1} ${externalLine(it)}`).join("；\n") +
        `。\n如以上信息无误，请回复确认；如有调整也请随时告知。`;

  function Group({ title, list }: { title: string; list: RItem[] }) {
    if (list.length === 0) return null;
    return (
      <div className="mb-2">
        <div className="label mb-1">{title}</div>
        {list.map((it) => (
          <label key={it.id} className="flex cursor-pointer items-center gap-2 py-1 text-[13px]">
            <input type="checkbox" checked={picked.has(it.id)} onChange={() => toggle(it.id)} />
            <span className="text-ink">{it.name}</span>
            <span className="text-faint">· {SIDE_LABEL[it.side]}</span>
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/20 p-4" onClick={onClose}>
      <div
        className="flex max-h-[86vh] w-[min(560px,94vw)] flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-focal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-line px-4 py-3 text-[14px] font-semibold text-ink">
          生成对外确认文本
        </div>
        <div className="overflow-auto px-4 py-3">
          <Group title="适合外发" list={suitable} />
          <Group title="需谨慎确认" list={caution} />
          <textarea
            readOnly
            value={text}
            className="mt-2 h-40 w-full resize-none rounded-lg border border-line bg-paper p-3 text-[13px] leading-relaxed text-ink"
          />
        </div>
        <div className="flex justify-end gap-2 border-t border-line px-4 py-2.5">
          <button onClick={onClose} className="rounded-lg px-3 py-1.5 text-[13px] text-ink-soft">
            关闭
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(text)}
            className="rounded-lg bg-ink px-4 py-1.5 text-[13px] font-medium text-paper hover:bg-accent"
          >
            复制草稿
          </button>
        </div>
      </div>
    </div>
  );
}

export function OutputMenu({ items }: { items: RItem[] }) {
  const [open, setOpen] = useState(false);
  const [modal, setModal] = useState(false);
  const [copied, setCopied] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg bg-ink px-3 py-1.5 text-[13px] font-medium text-paper hover:bg-accent"
      >
        输出结果 ▾
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-1 w-48 overflow-hidden rounded-lg border border-line bg-surface py-1 shadow-card">
            <button
              onClick={() => {
                copyInternal(items);
                setCopied(true);
                setOpen(false);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="block w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-paper"
            >
              复制内部清单
            </button>
            <button
              onClick={() => {
                setOpen(false);
                window.print();
              }}
              className="block w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-paper"
            >
              导出 PDF
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setModal(true);
              }}
              className="block w-full px-3 py-2 text-left text-[13px] text-ink hover:bg-paper"
            >
              生成对外确认文本…
            </button>
          </div>
        </>
      )}
      {copied && (
        <span className="absolute right-0 top-full mt-1 rounded bg-ok-soft px-2 py-1 text-[11px] text-ok">
          已复制
        </span>
      )}
      {modal && <ExternalModal items={items} onClose={() => setModal(false)} />}
    </div>
  );
}
