import postgres from "postgres";

// Server-only. One pool per process (dev hot reload would otherwise open a new one per edit).
const g = globalThis as unknown as { sql?: postgres.Sql };

export const sql = (g.sql ??= postgres(process.env.DATABASE_URL!, { ssl: "require", max: 5, idle_timeout: 20 }));
