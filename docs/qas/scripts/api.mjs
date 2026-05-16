/**
 * api.mjs — Shared HTTP helper for QA scripts.
 *
 * Exports:
 *   BASE         — base URL string
 *   api(path, opts) — generic fetch wrapper, never throws on HTTP errors
 *   get(path, token)
 *   post(path, body, token)
 *   patch(path, body, token)
 *   del(path, token)
 *
 * CLI: node api.mjs  — hits GET /health and prints the response
 */

export const BASE = 'http://localhost:8085/api/v1';

/**
 * @param {string} path — relative path, e.g. '/auth/register'
 * @param {{ method?: string, body?: unknown, token?: string, headers?: Record<string,string> }} opts
 * @returns {{ status: number, data: unknown, headers: Headers, raw: Response }}
 */
export async function api(path, opts = {}) {
  const { method = 'GET', body, token, headers: extraHeaders = {} } = opts;

  const headers = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const init = { method, headers };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const raw = await fetch(`${BASE}${path}`, init);

  let data;
  const ct = raw.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    data = await raw.json();
  } else {
    data = await raw.text();
  }

  return { status: raw.status, data, headers: raw.headers, raw };
}

export function get(path, token) {
  return api(path, { method: 'GET', token });
}

export function post(path, body, token) {
  return api(path, { method: 'POST', body, token });
}

export function patch(path, body, token) {
  return api(path, { method: 'PATCH', body, token });
}

export function del(path, token) {
  return api(path, { method: 'DELETE', token });
}

// ── CLI entry-point ──────────────────────────────────────────────────────────
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const res = await get('/health');
  console.log(`GET /health → ${res.status}`);
  console.log(JSON.stringify(res.data, null, 2));
}
