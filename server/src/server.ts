import path from "path";
import dotenv from "dotenv";
import http from "http";

// Canonical backend environment file: server/.env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import runsRouter from "./routes/runs";
import repoRouter from "./routes/repo";
import missionsRouter from "./routes/missions";
import { applySecurity } from "./middleware/security";
import metricsRouter from "./routes/metrics";
import { initSocketIO } from "./websocket/io";
import { ensureSchema } from "./database/schema";
import { ensureExperienceSchema } from "./memory/experienceStore";
import { ensureRepoToolsRegistered } from "./tools/repositoryTools";
import { ensureAuditSchema } from "./audit/auditLog";
import { getAuditLog } from "./controllers/evidenceController";
import { requireApiToken, enforceRunQuota } from "./auth/tokens";
import { log } from "./observability/logger";

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Resolves allowed CORS origins.
 */
export function getAllowedOrigins(): string[] | string {
  const envOrigin = process.env.CORS_ORIGIN?.trim();
  if (envOrigin) {
    const list = envOrigin.split(",").map((o) => o.trim()).filter(Boolean);
    return list.length === 1 ? list[0] : list;
  }
  return ["http://localhost:5173", "http://127.0.0.1:5173"];
}

const allowedOrigins = getAllowedOrigins();

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
applySecurity(app);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "CodeForge",
    phase: "evolution-0-6",
    message: "Phases 0–6 complete: truthful core, memory, repo agent, Arena, harden",
    features: {
      sandboxMode: process.env.SANDBOX_MODE || "dev",
      llmMode: process.env.LLM_MODE || "live",
      memoryMode: process.env.MEMORY_MODE || "off",
      allowMockFallback:
        process.env.ALLOW_MOCK_FALLBACK === "true" ||
        process.env.USE_MOCK_LLM === "true",
      repoAgent: true,
      arena: true,
      apiTokensRequired: Boolean(process.env.API_TOKENS?.trim()),
      quotas: process.env.ENFORCE_QUOTAS === "true",
    },
  });
});

app.use("/api/runs", runsRouter);
app.use("/api/repo", requireApiToken, enforceRunQuota, repoRouter);
app.use("/api/missions", missionsRouter);
app.use("/api/metrics", metricsRouter);
app.get("/api/audit", getAuditLog);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  log.error("Unhandled error", { err: err?.message });
  res.status(500).json({ error: "Internal server error" });
});

const httpServer = http.createServer(app);
initSocketIO(httpServer, allowedOrigins);

async function boot() {
  try {
    await ensureSchema();
    await ensureExperienceSchema();
    await ensureAuditSchema();
  } catch (err: any) {
    console.warn("[boot] schema init skipped:", err?.message);
  }
  try {
    ensureRepoToolsRegistered();
  } catch (err: any) {
    console.warn("[boot] repo tools:", err?.message);
  }

  httpServer.listen(PORT, () => {
    log.info("CodeForge Evolution listening", {
      port: PORT,
      phase: "0-6",
      sandboxMode: process.env.SANDBOX_MODE || "dev",
      llmMode: process.env.LLM_MODE || "live",
      memoryMode: process.env.MEMORY_MODE || "off",
    });
    console.log(`🚀 CodeForge Evolution (Phases 0–6) on http://localhost:${PORT}`);
    console.log(`   POST /api/runs · /api/repo · /api/missions · GET /api/runs/:id/evidence`);
  });
}

boot();
