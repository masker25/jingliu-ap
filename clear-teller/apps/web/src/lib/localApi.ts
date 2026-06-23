// localStorage-backed implementation of the API, used by the offline demo build
// (VITE_DEMO=1). Mirrors the server endpoints so the rest of the app is unaware
// which mode it runs in.

import { process } from "./demoEngine";
import type {
  Activity,
  CanvasPositions,
  DocumentOut,
  DocumentSummary,
  IngestResponse,
  ProgressEvent,
} from "./api";

const INDEX = "ct.demo.index";
const docKey = (id: string) => `ct.demo.doc.${id}`;
const uid = () => crypto.randomUUID().replace(/-/g, "");

type StoredDoc = DocumentOut & { activity: Activity[]; created_at: string };

function readIndex(): DocumentSummary[] {
  return JSON.parse(localStorage.getItem(INDEX) ?? "[]");
}
function writeIndex(list: DocumentSummary[]) {
  localStorage.setItem(INDEX, JSON.stringify(list));
}
function readDoc(id: string): StoredDoc | null {
  const raw = localStorage.getItem(docKey(id));
  return raw ? JSON.parse(raw) : null;
}
function writeDoc(doc: StoredDoc) {
  localStorage.setItem(docKey(doc.id), JSON.stringify(doc));
}
function logActivity(doc: StoredDoc, action: string, title: string, extra: Partial<Activity> = {}) {
  doc.activity.push({
    id: uid(),
    time: new Date().toISOString(),
    actor: extra.actor ?? "user",
    action,
    title,
    detail: extra.detail ?? null,
    provider: extra.provider ?? null,
    model: extra.model ?? null,
  });
}

export function ingestText(text: string, title?: string): IngestResponse {
  const r = process(text);
  const surfaced = new Set<string>();
  const checklist = r.checklist.map((it) => {
    const srcUnits = it.sourceIdx.map((i) => r.units[i]);
    srcUnits.forEach((u) => surfaced.add(u.id));
    return {
      id: uid(),
      text: it.text,
      checked: false,
      source: srcUnits.map((u) => u.provenance).filter(Boolean),
    };
  });
  const conflicts = r.conflicts.map((c) => {
    const l = r.units[c.leftIdx];
    const rt = r.units[c.rightIdx];
    surfaced.add(l.id);
    surfaced.add(rt.id);
    return {
      id: uid(),
      summary: c.summary,
      left: { label: l.provenance, text: l.text },
      right: { label: rt.provenance, text: rt.text },
    };
  });
  const mergedIdx = new Set(Object.keys(r.merges).map(Number));
  const units = r.units
    .filter((_, i) => !mergedIdx.has(i))
    .map((u) => ({ id: u.id, text: u.text, provenance: u.provenance, surfaced: surfaced.has(u.id) }));

  const id = uid();
  const created = new Date().toISOString();
  const doc: StoredDoc = {
    id,
    status: "ready",
    title: title ?? null,
    checklist,
    conflicts,
    units,
    unit_count: r.units.length,
    canvas: null,
    activity: [],
    created_at: created,
  };
  logActivity(doc, "ingest_text", "投喂内容");
  logActivity(doc, "process_complete", "整理完成", {
    actor: "agent",
    provider: "demo",
    model: "mock-engine",
    detail: `清单 ${checklist.length} · 冲突 ${conflicts.length} · 合并 ${mergedIdx.size}`,
  });
  writeDoc(doc);
  writeIndex([
    { id, title: title ?? null, status: "ready", created_at: created },
    ...readIndex(),
  ]);
  return { document_id: id, run_id: id };
}

export function streamRun(_runId: string, onEvent: (e: ProgressEvent) => void): Promise<void> {
  const phases: ProgressEvent[] = [
    { phase: "atomize", progress: 0.3 },
    { phase: "dedupe+conflict", progress: 0.7 },
    { phase: "assemble", progress: 0.9 },
    { phase: "done", progress: 1.0, final: true },
  ];
  return new Promise((resolve) => {
    let i = 0;
    const tick = () => {
      onEvent(phases[i]);
      if (phases[i].final) return resolve();
      i++;
      setTimeout(tick, 180);
    };
    setTimeout(tick, 120);
  });
}

export function getDocument(id: string): DocumentOut {
  const doc = readDoc(id);
  if (!doc) throw new Error("not found");
  return doc;
}

export function getDocuments(): DocumentSummary[] {
  return readIndex();
}

export function saveCanvas(id: string, positions: CanvasPositions): void {
  const doc = readDoc(id);
  if (!doc) return;
  doc.canvas = positions;
  logActivity(doc, "canvas_update", "调整画布布局");
  writeDoc(doc);
}

export function patchChecklist(itemId: string, checked: boolean): void {
  for (const { id } of readIndex()) {
    const doc = readDoc(id);
    if (!doc) continue;
    const item = doc.checklist.find((c) => c.id === itemId);
    if (item) {
      item.checked = checked;
      logActivity(doc, checked ? "check" : "uncheck", checked ? "勾选清单项" : "取消勾选");
      writeDoc(doc);
      return;
    }
  }
}

export function getActivity(id: string): Activity[] {
  const doc = readDoc(id);
  return doc ? [...doc.activity].reverse() : [];
}
