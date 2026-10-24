/**
 * Lightweight structured logger – Phase 6.
 * Avoids hard dependency on pino; shape is compatible if you swap later.
 */

import { redactSecrets } from "../audit/auditLog";

type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, msg: string, fields?: Record<string, unknown>) {
  const line = {
    level,
    time: new Date().toISOString(),
    msg: redactSecrets(msg),
    ...sanitize(fields),
  };
  const s = JSON.stringify(line);
  if (level === "error") console.error(s);
  else if (level === "warn") console.warn(s);
  else console.log(s);
}

function sanitize(fields?: Record<string, unknown>): Record<string, unknown> {
  if (!fields) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v === "string") out[k] = redactSecrets(v);
    else out[k] = v;
  }
  return out;
}

export const log = {
  debug: (msg: string, fields?: Record<string, unknown>) => emit("debug", msg, fields),
  info: (msg: string, fields?: Record<string, unknown>) => emit("info", msg, fields),
  warn: (msg: string, fields?: Record<string, unknown>) => emit("warn", msg, fields),
  error: (msg: string, fields?: Record<string, unknown>) => emit("error", msg, fields),
};
