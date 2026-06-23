// Thin typed API client. Types come from the backend's OpenAPI schema via
// openapi-typescript (packages/shared-types/api.d.ts), so the client stays in
// sync with the server from one source of truth.

import type { paths } from "@ct/shared-types/api.d.ts";

const BASE = "/api"; // Vite proxies /api -> http://localhost:8000

type Json<T> = T extends { content: { "application/json": infer J } } ? J : never;

export type Health =
  Json<paths["/health"]["get"]["responses"][200]>;
export type IngestResponse =
  Json<paths["/ingest"]["post"]["responses"][200]>;
export type DocumentOut =
  Json<paths["/documents/{document_id}"]["get"]["responses"][200]>;
export type ChecklistItem = DocumentOut["checklist"][number];
export type Conflict = DocumentOut["conflicts"][number];
export type Activity =
  Json<paths["/documents/{document_id}/activity"]["get"]["responses"][200]>[number];
export type CanvasPositions = NonNullable<DocumentOut["canvas"]>;

export async function getHealth(): Promise<Health> {
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw new Error(`health ${res.status}`);
  return res.json();
}

export async function ingestText(text: string, title?: string): Promise<IngestResponse> {
  const res = await fetch(`${BASE}/ingest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, title }),
  });
  if (!res.ok) throw new Error(`ingest ${res.status}`);
  return res.json();
}

export async function getDocument(id: string): Promise<DocumentOut> {
  const res = await fetch(`${BASE}/documents/${id}`);
  if (!res.ok) throw new Error(`document ${res.status}`);
  return res.json();
}

export async function saveCanvas(documentId: string, positions: CanvasPositions): Promise<void> {
  await fetch(`${BASE}/documents/${documentId}/canvas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ positions }),
  });
}

export async function patchChecklist(itemId: string, checked: boolean): Promise<void> {
  await fetch(`${BASE}/checklist/${itemId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ checked }),
  });
}

export async function getActivity(documentId: string): Promise<Activity[]> {
  const res = await fetch(`${BASE}/documents/${documentId}/activity`);
  if (!res.ok) throw new Error(`activity ${res.status}`);
  return res.json();
}

export type ProgressEvent = { phase: string; progress: number; final?: boolean; error?: string };

// Subscribe to a run's SSE progress feed. Resolves when the run reaches a
// terminal (final) event.
export function streamRun(runId: string, onEvent: (e: ProgressEvent) => void): Promise<void> {
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
