import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS guard_decisions (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  phone TEXT,
  action TEXT NOT NULL,
  decision TEXT NOT NULL,
  reason TEXT NOT NULL,
  summary TEXT,
  sim_swap_recent BOOLEAN,
  sim_swap_hours_ago DOUBLE PRECISION,
  location_result TEXT,
  location_match BOOLEAN,
  location_match_rate INTEGER,
  number_verified BOOLEAN,
  nac_mode TEXT,
  frozen_at TIMESTAMPTZ,
  traces JSONB,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS guard_decisions_email_created_idx
  ON guard_decisions (email, created_at DESC);

CREATE INDEX IF NOT EXISTS guard_decisions_decision_created_idx
  ON guard_decisions (decision, created_at DESC);
`;

let pool: Pool | null = null;
let schemaReady = false;
let downUntil = 0;

export function databaseUrl() {
  return (process.env.DATABASE_URL || "").trim();
}

export function postgresConfigured() {
  return Boolean(databaseUrl());
}

export function getPool() {
  const url = databaseUrl();
  if (!url) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 1500,
    });
  }
  return pool;
}

export async function ensureGuardSchema(client?: Pool | PoolClient) {
  const target = client ?? getPool();
  if (!target) return false;
  if (schemaReady && !client) return true;
  await target.query(SCHEMA_SQL);
  schemaReady = true;
  return true;
}

export async function queryPostgres<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<QueryResult<T> | null> {
  if (Date.now() < downUntil) return null;
  const current = getPool();
  if (!current) return null;
  try {
    await ensureGuardSchema(current);
    const result = await current.query<T>(text, values);
    downUntil = 0;
    return result;
  } catch (error) {
    downUntil = Date.now() + 30_000;
    console.warn("[smart-guard] PostgreSQL unavailable; using server file log until it recovers.", error);
    return null;
  }
}
