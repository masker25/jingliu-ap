// Input as canvas, not a form box: paste a messy blob, watch it get "erased"
// (absorbed) while a real progress bar tracks the pipeline, then the structured
// result surfaces. Progress is driven by the run's SSE feed, not a fake timer.

import { useState } from "react";

import { ingestText, streamRun, type ProgressEvent } from "../lib/api";

const PHASE_LABEL: Record<string, string> = {
  atomize: "识别 · 原子化",
  "dedupe+conflict": "合并重复 · 抽离矛盾",
  assemble: "组装清单",
  done: "完成",
};

const SAMPLE = `会议纪要
要确认上线时间已经和各方对齐
上线时间定在周四
导出对账单并核对金额
通知客服更新话术
通知客服更新话术
其实上线时间改到下周一
灰度10%流量并观察30分钟
今天天气不错`;

export function Composer({ onDone }: { onDone: (documentId: string) => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");

  async function run() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setProgress(0.05);
    try {
      const { document_id, run_id } = await ingestText(text);
      await streamRun(run_id, (e: ProgressEvent) => {
        setProgress(Math.max(0.05, e.progress));
        setPhase(PHASE_LABEL[e.phase] ?? e.phase);
      });
      onDone(document_id);
    } catch {
      setBusy(false);
    }
  }

  return (
    <section className="pointer-events-auto w-[min(560px,92vw)] overflow-hidden rounded-xl border border-line bg-surface shadow-focal">
      <header className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="label">Input</span>
          <span className="text-[13px] font-semibold text-ink">投喂内容</span>
        </div>
        <button
          onClick={() => setText(SAMPLE)}
          className="label transition hover:text-accent"
          disabled={busy}
        >
          填入示例
        </button>
      </header>

      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          placeholder="把混乱的聊天记录、纪要、一大段话粘到这里…"
          className={`h-56 w-full resize-none px-4 py-3 text-[13.5px] leading-relaxed text-ink outline-none transition-all duration-700 placeholder:text-faint
            ${busy ? "scale-[0.99] opacity-0 blur-sm" : "opacity-100"}`}
        />
        {busy && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8">
            <div className="label">{phase || "处理中"}</div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div
                className="h-full bg-accent transition-all duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <div className="font-mono text-[11px] text-faint">{Math.round(progress * 100)}%</div>
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between border-t border-line px-4 py-2.5">
        <span className="label">无框 · 内容即输入</span>
        <button
          onClick={run}
          disabled={busy || !text.trim()}
          className="rounded-lg bg-ink px-4 py-1.5 text-[13px] font-medium text-paper transition hover:bg-accent disabled:opacity-30"
        >
          {busy ? "消化中…" : "整理成清单"}
        </button>
      </footer>
    </section>
  );
}
