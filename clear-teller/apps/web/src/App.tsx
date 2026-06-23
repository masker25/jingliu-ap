import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { AgentDock } from "./agent/AgentDock";
import { CommandPalette } from "./agent/CommandPalette";
import { RunTimeline } from "./agent/RunTimeline";
import { FlowCanvas } from "./canvas/FlowCanvas";
import { getDocument, getHealth } from "./lib/api";
import { Composer } from "./scene/Composer";
import { DivergentNodes } from "./scene/DivergentNodes";
import { DocumentList } from "./scene/DocumentList";

// Two states over the divergent dot-grid canvas:
//  · idle    — the Composer invites a messy blob.
//  · ready   — the focal checklist + separate conflict zone, from real data.
// The tldraw substrate (src/canvas/Canvas.tsx) becomes the live interactive
// layer in P1.5; here the focus/fade language is presented directly.

function HealthBadge() {
  const { data, isError } = useQuery({ queryKey: ["health"], queryFn: getHealth });
  const ok = !isError && data?.status === "ok";
  return (
    <div className="pointer-events-auto absolute bottom-5 left-4 z-40 flex items-center gap-1.5 rounded-full border border-line bg-surface/90 px-3 py-1.5 shadow-card backdrop-blur">
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-ok" : "bg-faint"}`} />
      <span className="text-[11px] text-ink-soft">backend {ok ? "connected" : "…"}</span>
    </div>
  );
}

function Brand({ onReset, showReset }: { onReset: () => void; showReset: boolean }) {
  return (
    <div className="absolute left-4 top-4 z-40 select-none">
      <div className="text-[15px] font-semibold tracking-tight text-ink">clear teller</div>
      <div className="label mt-0.5">混乱进 · 清单出</div>
      {showReset && (
        <button onClick={onReset} className="label pointer-events-auto mt-2 hover:text-accent">
          ＋ 新建
        </button>
      )}
    </div>
  );
}

const LS_KEY = "ct.documentId";

export default function App() {
  // remember the open document across reloads so persisted state is restored
  const [documentId, setDocumentIdState] = useState<string | null>(
    () => localStorage.getItem(LS_KEY),
  );
  const setDocumentId = (id: string | null) => {
    if (id) localStorage.setItem(LS_KEY, id);
    else localStorage.removeItem(LS_KEY);
    setDocumentIdState(id);
  };
  const qc = useQueryClient();
  const { data: doc } = useQuery({
    queryKey: ["document", documentId],
    queryFn: () => getDocument(documentId!),
    enabled: !!documentId,
  });

  const openDocument = (id: string) => {
    setDocumentId(id);
    qc.invalidateQueries({ queryKey: ["documents"] });
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-paper">
      {!documentId ? (
        <div className="dot-grid absolute inset-0">
          <DivergentNodes />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Composer onDone={openDocument} />
          </div>
        </div>
      ) : doc ? (
        <FlowCanvas key={doc.id} doc={doc} />
      ) : (
        <div className="dot-grid absolute inset-0 flex items-center justify-center">
          <span className="label">读取结果…</span>
        </div>
      )}

      <Brand onReset={() => setDocumentId(null)} showReset={!!documentId} />
      <DocumentList
        currentId={documentId}
        onOpen={openDocument}
        onNew={() => setDocumentId(null)}
      />
      <RunTimeline documentId={documentId} />
      <AgentDock />
      <HealthBadge />
      <CommandPalette />
    </div>
  );
}
