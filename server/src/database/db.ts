import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn(
    "⚠️  DATABASE_URL is not set. Falling back to in-memory store. " +
      "Set DATABASE_URL to enable PostgreSQL persistence."
  );
}

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    })
  : null;

export async function query(text: string, params?: any[]) {
  if (!pool) {
    throw new Error("PostgreSQL is not configured (DATABASE_URL missing)");
  }
  return pool.query(text, params);
}

export async function isDbReady(): Promise<boolean> {
  if (!pool) return false;
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
