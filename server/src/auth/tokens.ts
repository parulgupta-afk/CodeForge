/**
 * Simple signed API token + quota gate – Phase 6.
 * Production demos: set API_TOKENS=token1,token2 or require Authorization: Bearer <token>
 * When API_TOKENS is unset, auth is open (local/dev).
 */

import { Request, Response, NextFunction } from "express";
import { recordAudit } from "../audit/auditLog";

const quotas = new Map<string, { runs: number; windowStart: number }>();

function configuredTokens(): Set<string> | null {
  const raw = process.env.API_TOKENS?.trim();
  if (!raw) return null;
  return new Set(
    raw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
  );
}

export function extractToken(req: Request): string | null {
  const h = req.header("authorization") || "";
  if (h.toLowerCase().startsWith("bearer ")) {
    return h.slice(7).trim() || null;
  }
  const x = req.header("x-api-token");
  return x?.trim() || null;
}

export function identityFromRequest(req: Request): string {
  return extractToken(req) || req.header("x-profile-id") || req.ip || "anonymous";
}

/**
 * If API_TOKENS is set, require a matching Bearer / X-API-Token.
 * Otherwise allow (dev mode).
 */
export function requireApiToken(req: Request, res: Response, next: NextFunction) {
  const allowed = configuredTokens();
  if (!allowed) return next();

  const token = extractToken(req);
  if (!token || !allowed.has(token)) {
    recordAudit({
      action: "auth.denied",
      actor: req.ip || "unknown",
      detail: { path: req.path },
    });
    return res.status(401).json({ error: "unauthorized: valid API token required" });
  }
  (req as any).apiToken = token;
  next();
}

const DEFAULT_RUNS_PER_DAY = Number(process.env.QUOTA_RUNS_PER_DAY) || 50;
const WINDOW_MS = 24 * 60 * 60 * 1000;

export function enforceRunQuota(req: Request, res: Response, next: NextFunction) {
  if (process.env.ENFORCE_QUOTAS !== "true") return next();

  const id = identityFromRequest(req);
  const now = Date.now();
  let entry = quotas.get(id);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    entry = { runs: 0, windowStart: now };
    quotas.set(id, entry);
  }
  if (entry.runs >= DEFAULT_RUNS_PER_DAY) {
    recordAudit({
      action: "quota.exceeded",
      actor: id,
      detail: { limit: DEFAULT_RUNS_PER_DAY },
    });
    return res.status(429).json({
      error: "quota_exceeded",
      limit: DEFAULT_RUNS_PER_DAY,
      window: "24h",
    });
  }
  entry.runs += 1;
  next();
}
