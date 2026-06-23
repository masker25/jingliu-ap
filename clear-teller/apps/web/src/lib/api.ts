// Thin typed API client. Types come from the backend's OpenAPI schema via
// openapi-typescript (packages/shared-types/api.d.ts), so the client stays in
// sync with the server from one source of truth.

import type { paths } from "@ct/shared-types/api.d.ts";

type HealthResponse =
  paths["/health"]["get"]["responses"][200]["content"]["application/json"];

const BASE = "/api"; // Vite proxies /api -> http://localhost:8000

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE}/health`);
  if (!res.ok) throw new Error(`health ${res.status}`);
  return res.json();
}
