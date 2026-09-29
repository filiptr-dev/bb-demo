import "server-only";
import { connection } from "next/server";
import { apiConfigured, apiFetch, ApiRequestError } from "./client";

// Shared by the server-side data modules (products.ts, catalog.ts). Every response is cached (ISR) under cache tags,
// so POST /api/revalidate can refresh it when the data changes.
export const HOUR = 3600;
export const DAY = 86400;

export const cachedFetch = (revalidate: number, tags: string[]) => apiFetch({ next: { revalidate, tags } });

// Without an API URL (a build whose env vars are missing, e.g. CI) the page is deferred to request time instead of
// failing the build, so the error shows up where the missing variable matters.
export async function whenApi() {
  if (!apiConfigured) await connection();
}

export function required<T>(data: T | undefined, response: Response, path: string): T {
  if (data === undefined) throw new ApiRequestError(response.status, path);
  return data;
}
