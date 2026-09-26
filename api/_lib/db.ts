// Shared helpers for the Vercel serverless functions in api/. This file lives in an
// underscore-prefixed folder so Vercel does NOT deploy it as its own endpoint - it's only
// ever imported by the real endpoints.
export interface ApiRequest {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
}
export interface ApiResponse {
  status: (code: number) => ApiResponse;
  json: (data: unknown) => void;
  setHeader: (name: string, value: string) => void;
  send: (data: string) => void;
}

export function q(req: ApiRequest, key: string): string | undefined {
  const v = req.query?.[key];
  return Array.isArray(v) ? v[0] : v;
}

function header(req: ApiRequest, key: string): string | undefined {
  const v = req.headers?.[key];
  return Array.isArray(v) ? v[0] : v;
}

// Strips surrounding straight/curly quotes, in case the password was pasted into Vercel's
// dashboard (or a notes app) wrapped in quotes.
function unquote(s: string): string {
  return s.replace(/^["'\u201c\u201d\u2018\u2019]+/, "").replace(/["'\u201c\u201d\u2018\u2019]+$/, "");
}

// Shared admin password check, used by every admin-only endpoint (api/admin.ts, upload-image.ts).
// Trimmed and unquoted on both sides: a stray trailing space, newline, or wrapping quote pasted
// into the Vercel dashboard (or into the login box) is a common, invisible cause of "incorrect
// password".
export function checkAdminPassword(req: ApiRequest): boolean {
  const expected = process.env.ADMIN_PASSWORD ? unquote(process.env.ADMIN_PASSWORD.trim()) : undefined;
  const provided = header(req, "x-admin-password") ? unquote(header(req, "x-admin-password")!.trim()) : undefined;
  return Boolean(expected) && provided === expected;
}

export function getEnv(): { supabaseUrl: string; serviceKey: string } | null {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  return { supabaseUrl, serviceKey };
}

export function dbHeaders(serviceKey: string, extra?: Record<string, string>): Record<string, string> {
  return { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json", ...extra };
}

export async function dbFetch(supabaseUrl: string, serviceKey: string, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: { ...dbHeaders(serviceKey), ...((init?.headers as Record<string, string> | undefined) ?? {}) },
  });
}

// Reads the total row count for a filtered query without transferring any rows.
export async function countRows(supabaseUrl: string, serviceKey: string, path: string): Promise<number> {
  const r = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    headers: { ...dbHeaders(serviceKey), Prefer: "count=exact", Range: "0-0" },
  });
  const range = r.headers.get("content-range");
  const total = range?.split("/")[1];
  return total ? parseInt(total, 10) || 0 : 0;
}

// Confirms the Supabase sign-in token (a customer, never the admin) and returns their user id.
export async function getUserId(req: ApiRequest, supabaseUrl: string, serviceKey: string): Promise<string | null> {
  const authHeader = header(req, "authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: { apikey: serviceKey, Authorization: authHeader } });
  if (!res.ok) return null;
  const user = (await res.json()) as { id?: string };
  return user.id ?? null;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
