import "server-only";
import postgres from "postgres";
import { connection } from "next/server";

// One pool per process (dev hot reload would otherwise open a new one per edit).
const g = globalThis as unknown as { sql?: postgres.Sql };

const url = process.env.DATABASE_POOL_URL || process.env.DATABASE_URL;
if (!url) console.error("DATABASE_POOL_URL / DATABASE_URL is not set: database-backed pages won't be prerendered and fail on request.");

// Transaction pooler (port 6543): hands out a server connection per query, so `next build`'s ~11 prerender
// workers and every serverless instance can each keep a small pool. It can't hold prepared statements.
export const sql = (g.sql ??= postgres(url ?? "", {
  ssl: "require",
  prepare: false,
  max: 5,
  idle_timeout: 20,
}));

// Called before every query. Without a database URL (a build whose env vars are missing) postgres would silently
// try localhost:5432 and the build would fail on the first prerendered page; this defers those pages to request
// time instead, so the deploy goes through and the error shows up where the missing variable matters.
export async function whenDatabase() {
  if (!url) await connection();
}
