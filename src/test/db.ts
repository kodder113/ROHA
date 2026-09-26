/**
 * Database integration test harness.
 *
 * Creates a throwaway PostgreSQL database, applies the Supabase shim, all ROHA
 * migrations and the demo seed, and provides helpers to run SQL as the
 * `anon`, `authenticated` (with a given user id) or `service_role` roles, which
 * is how Supabase evaluates Row Level Security.
 *
 * Configure with TEST_DATABASE_ADMIN_URL (default:
 * postgres://postgres:postgres@localhost:5432/postgres). If the server is not
 * reachable the integration suites are skipped.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

const ROOT = path.resolve(import.meta.dirname, "../..");
export const ADMIN_URL = process.env.TEST_DATABASE_ADMIN_URL ?? "postgres://postgres:postgres@localhost:5432/postgres";

export async function databaseAvailable(): Promise<boolean> {
  const c = new Client({ connectionString: ADMIN_URL, connectionTimeoutMillis: 2000 });
  try {
    await c.connect();
    await c.end();
    return true;
  } catch {
    return false;
  }
}

export interface TestDb {
  client: Client;
  name: string;
  drop: () => Promise<void>;
}

export async function createTestDatabase(options: { seed?: boolean } = {}): Promise<TestDb> {
  const name = `roha_test_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const admin = new Client({ connectionString: ADMIN_URL });
  await admin.connect();
  await admin.query(`create database ${name}`);
  await admin.end();

  const url = new URL(ADMIN_URL);
  url.pathname = `/${name}`;
  const client = new Client({ connectionString: url.toString() });
  await client.connect();
  await client.query(readFileSync(path.join(ROOT, "supabase/tests/supabase_shim.sql"), "utf8"));
  const migrationsDir = path.join(ROOT, "supabase/migrations");
  for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort()) {
    await client.query(readFileSync(path.join(migrationsDir, file), "utf8"));
  }
  if (options.seed) {
    await client.query(readFileSync(path.join(ROOT, "supabase/seed.sql"), "utf8"));
  }

  return {
    client,
    name,
    drop: async () => {
      await client.end();
      const a = new Client({ connectionString: ADMIN_URL });
      await a.connect();
      await a.query(`drop database if exists ${name} with (force)`);
      await a.end();
    },
  };
}

type Role = "anon" | "authenticated" | "service_role";

/**
 * Runs `fn` inside a transaction as the given role (and user), then rolls back
 * so tests do not interfere with one another.
 */
export async function asRole<T>(
  client: Client,
  role: Role,
  userId: string | null,
  fn: (q: Client["query"]) => Promise<T>,
  opts: { commit?: boolean } = {},
): Promise<T> {
  await client.query("begin");
  try {
    await client.query(`set local role ${role}`);
    const claims = JSON.stringify(userId ? { sub: userId, role } : { role });
    await client.query("select set_config('request.jwt.claims', $1, true)", [claims]);
    const result = await fn(client.query.bind(client) as Client["query"]);
    await client.query(opts.commit ? "commit" : "rollback");
    return result;
  } catch (err) {
    await client.query("rollback");
    throw err;
  }
}

/** Runs `fn` and returns the thrown error message (or null). */
export async function errorOf(fn: () => Promise<unknown>): Promise<string | null> {
  try {
    await fn();
    return null;
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}
