/**
 * Audit event log – Phase 6.
 * In-memory ring buffer + optional Postgres table when DB is ready.
 */

import { query, isDbReady } from "../database/db";

export interface AuditEvent {
  id?: string;
  action: string;
  actor: string;
  detail?: Record<string, unknown>;
  at?: string;
}

const ring: AuditEvent[] = [];
const MAX = 2000;

let schemaReady = false;

export async function ensureAuditSchema(): Promise<void> {
  if (!(await isDbReady())) return;
  await query(`
    CREATE TABLE IF NOT EXISTS audit_events (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      action     TEXT NOT NULL,
      actor      TEXT NOT NULL,
      detail     JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  schemaReady = true;
}

export function recordAudit(event: AuditEvent): void {
  const row: AuditEvent = {
    ...event,
    at: event.at || new Date().toISOString(),
  };
  ring.push(row);
  if (ring.length > MAX) ring.shift();

  if (schemaReady) {
    void query(
      `INSERT INTO audit_events (action, actor, detail) VALUES ($1, $2, $3)`,
      [row.action, row.actor, row.detail ? JSON.stringify(row.detail) : null]
    ).catch(() => {
      /* best-effort */
    });
  }
}

export function listAudit(limit = 100): AuditEvent[] {
  return ring.slice(-limit).reverse();
}

/** Redact secrets from strings before logging */
export function redactSecrets(text: string): string {
  if (!text) return text;
  return text
    .replace(/(api[_-]?key|token|authorization|password)\s*[:=]\s*["']?[\w.-]+/gi, "$1=[REDACTED]")
    .replace(/Bearer\s+[\w.-]+/gi, "Bearer [REDACTED]");
}
