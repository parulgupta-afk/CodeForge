import path from "path";
import dotenv from "dotenv";
import http from "http";

// Canonical backend environment file: server/.env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

import express from "express";
import cors from "cors";
import runsRouter from "./routes/runs";
import { applySecurity } from "./middleware/security";
import metricsRouter from "./routes/metrics";
import { initSocketIO } from "./websocket/io";
import { ensureSchema } from "./database/schema";
import { ensureExperienceSchema } from "./memory/experienceStore";

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
    phase: "evolution-0-3",
    message: "Truthful persistence, evaluator, experience memory, evaluation lab",
    features: {
      sandboxMode: process.env.SANDBOX_MODE || "dev",
      llmMode: process.env.LLM_MODE || "live",
      memoryMode: process.env.MEMORY_MODE || "off",
      allowMockFallback: process.env.ALLOW_MOCK_FALLBACK === "true" || process.env.USE_MOCK_LLM === "true",
    },
  });
});

app.use("/api/runs", runsRouter);
app.use("/api/metrics", metricsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const httpServer = http.createServer(app);
initSocketIO(httpServer, allowedOrigins);

async function boot() {
  // Phase 0: ensure schema at boot so persistence is real when DATABASE_URL is set
  try {
    await ensureSchema();
    await ensureExperienceSchema();
  } catch (err: any) {
    console.warn("[boot] schema init skipped:", err?.message);
  }

  httpServer.listen(PORT, () => {
    console.log(`🚀 CodeForge Evolution (Phases 0–3) on http://localhost:${PORT}`);
    console.log(`   WebSocket ready · POST /api/runs`);
    console.log(`   SANDBOX_MODE=${process.env.SANDBOX_MODE || "dev"} LLM_MODE=${process.env.LLM_MODE || "live"} MEMORY_MODE=${process.env.MEMORY_MODE || "off"}`);
  });
}

boot();
