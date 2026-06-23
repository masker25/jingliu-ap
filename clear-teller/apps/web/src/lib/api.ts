// Thin typed API client. Types come from the backend's OpenAPI schema via
// openapi-typescript (packages/shared-types/api.d.ts), so the client stays in
// sync with the server from one source of truth.
//
// In the offline demo build (VITE_DEMO=1) every call is served by an in-browser
// localStorage implementation (./localApi), so the hosted demo needs no server.

import type { paths } from "@ct/shared-types/api.d.ts";

import * as local from "./localApi";
import type { Report } from "./responsibility";

const BASE = "/api"; // Vite proxies /api -> http://localhost:8000
const DEMO = import.meta.env.VITE_DEMO === "1";

type Json<T> = T extends { content: { "application/json": infer J } } ? J : never;

export type Health = Json<paths["/health"]["get"]["responses"][200]>;
export type IngestResponse = Json<paths["/ingest"]["post"]["responses"][200]>;
export type DocumentOut = Json<paths["/documents/{document_id}"]["get"]["responses"][200]>;
export type ChecklistItem = DocumentOut["checklist"][number];
export type Conflict = DocumentOut["conflicts"][number];
export type Activity =
  Json<paths["/documents/{document_id}/activity"]["get"]["responses"][200]>[number];
export type CanvasPositions = NonNullable<DocumentOut["canvas"]>;
export type DocumentSummary = {
  id: string;
  title: string | null;
  status: string;
  created_at: string;
};

export type ProgressEvent = { phase: string; progress: number; final?: boolean; error?: string };

export async function getHealth(): Promise<Health> {
  if (DEMO) return { status: "ok", app: "clear teller", version: "demo" };
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw new Error(`health ${res.status}`);
  return res.json();
}

export async function ingestText(text: string, title?: string): Promise<IngestResponse> {
  if (DEMO) return local.ingestText(text, title);
  const res = await fetch(`${BASE}/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, title }),
  });
  if (!res.ok) throw new Error(`ingest ${res.status}`);
  return res.json();
}

export async function getDocument(id: string): Promise<DocumentOut> {
  if (DEMO) return local.getDocument(id);
  const res = await fetch(`${BASE}/documents/${id}`);
  if (!res.ok) throw new Error(`document ${res.status}`);
  return res.json();
}

export async function getDocuments(): Promise<DocumentSummary[]> {
  if (DEMO) return local.getDocuments();
  const res = await fetch(`${BASE}/documents`);
  if (!res.ok) throw new Error(`documents ${res.status}`);
  return res.json();
}

export async function saveCanvas(documentId: string, positions: CanvasPositions): Promise<void> {
  if (DEMO) return local.saveCanvas(documentId, positions);
  await fetch(`${BASE}/documents/${documentId}/canvas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ positions }),
  });
}

export async function patchChecklist(itemId: string, checked: boolean): Promise<void> {
  if (DEMO) return local.patchChecklist(itemId, checked);
  await fetch(`${BASE}/checklist/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checked }),
  });
}

export async function getReport(documentId: string): Promise<Report> {
  if (DEMO) return local.getReport(documentId);
  throw new Error("责任报告引擎暂仅在 demo 构建中可用（后端真实引擎待接入 key）");
}

export async function saveReport(
  documentId: string,
  report: Report,
  action?: string,
  title?: string,
): Promise<void> {
  if (DEMO) return local.saveReport(documentId, report, action, title);
}

export async function getActivity(documentId: string): Promise<Activity[]> {
  if (DEMO) return local.getActivity(documentId);
  const res = await fetch(`${BASE}/documents/${documentId}/activity`);
  if (!res.ok) throw new Error(`activity ${res.status}`);
  return res.json();
}

// Subscribe to a run's SSE progress feed. Resolves on a terminal (final) event.
export function streamRun(runId: string, onEvent: (e: ProgressEvent) => void): Promise<void> {
  if (DEMO) return local.streamRun(runId, onEvent);
  return new Promise((resolve) => {
    const es = new EventSource(`${BASE}/runs/${runId}/stream`);
    es.onmessage = (m) => {
      const e = JSON.parse(m.data) as ProgressEvent;
      onEvent(e);
      if (e.final) {
        es.close();
        resolve();
      }
    };
    es.onerror = () => {
      es.close();
      resolve();
    };
  });
}
