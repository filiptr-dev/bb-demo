import createClient from "openapi-fetch";
import type { paths } from "./schema";

// The B&B Unikoop API (backend/). Server renders use API_URL; the browser calls NEXT_PUBLIC_API_URL directly (CORS),
// so searches don't pass through a Vercel function.
const baseUrl = ((typeof window === "undefined" && process.env.API_URL) || process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

export const apiConfigured = baseUrl !== "";

const TIMEOUT_MS = 10_000;
const RETRY_STATUSES = new Set([502, 503, 504]); // a restarting or waking instance

// fetch for openapi-fetch: a timeout, and one retry after a network error or a 502/503/504. `init` carries Next's
// cache options (`next: { revalidate, tags }`), which a Request object can't hold.
export function apiFetch(init?: RequestInit): (req: Request) => Promise<Response> {
  return async (req) => {
    for (let attempt = 0; ; attempt++) {
      const signal = AbortSignal.any([req.signal, AbortSignal.timeout(TIMEOUT_MS)]);
      try {
        const res = await fetch(req.clone(), { ...init, signal });
        if (attempt === 0 && RETRY_STATUSES.has(res.status)) continue;
        return res;
      } catch (e) {
        if (attempt > 0 || req.signal.aborted) throw e;
      }
    }
  };
}

export const api = createClient<paths>({ baseUrl, fetch: apiFetch() });

export class ApiRequestError extends Error {
  constructor(readonly status: number, path: string) {
    super(`API ${path} answered ${status}`);
  }
}
