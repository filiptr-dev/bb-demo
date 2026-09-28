import "server-only";
import postgres from "postgres";

// One pool per process (dev hot reload would otherwise open a new one per edit).
const g = globalThis as unknown as { sql?: postgres.Sql };

// Transaction pooler (port 6543): hands out a server connection per query, so `next build`'s ~11 prerender
// workers and every serverless instance can each keep a small pool. It can't hold prepared statements.
export const sql = (g.sql ??= postgres(process.env.DATABASE_POOL_URL ?? process.env.DATABASE_URL!, {
  ssl: "require",
  prepare: false,
  max: 5,
  idle_timeout: 20,
}));
