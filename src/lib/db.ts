import postgres from "postgres";

/** A loosely typed database row. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

type Client = ReturnType<typeof postgres>;

declare global {
  // eslint-disable-next-line no-var
  var __sinagSql: Client | undefined;
}

function client(): Client {
  if (!globalThis.__sinagSql) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set. Add it to .env.local (see .env.example).");
    globalThis.__sinagSql = postgres(url, {
      max: process.env.NODE_ENV === "production" ? 3 : 5,
      prepare: false, // works with pooled connections (Neon, Supabase)
      idle_timeout: 20,
      connect_timeout: 15,
    });
  }
  return globalThis.__sinagSql;
}

/**
 * Lazy proxy so importing this file never opens a connection
 * (the build step imports every page without a database).
 */
export const sql: Client = new Proxy(function () {} as unknown as Client, {
  apply(_target, _this, args) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (client() as any)(...args);
  },
  get(_target, prop) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (client() as any)[prop];
    return typeof value === "function" ? value.bind(client()) : value;
  },
});
