import postgres from "postgres";

// Server-only. One pool per process (dev hot reload would otherwise open a new one per edit).
const g = globalThis as unknown as { sql?: postgres.Sql };

// `next build` prerenders in ~11 worker processes, and the Supabase session pooler allows 15 clients in total.
const building = process.env.NEXT_PHASE === "phase-production-build";

export const sql = (g.sql ??= postgres(process.env.DATABASE_URL!, { ssl: "require", max: building ? 1 : 5, idle_timeout: 20 }));
