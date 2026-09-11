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

const app = express();
const PORT = process.env.PORT || 3001;

/**
 * Resolves allowed CORS origins.
 * Reads CORS_ORIGIN (supports single origin or comma-separated list).
 * Defaults to local development frontend origins if unset.
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
    phase: 12,
    message: "Production security + deployment ready",
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

httpServer.listen(PORT, () => {
  console.log(`🚀 CodeForge server (Phase 9) running on http://localhost:${PORT}`);
  console.log(`   WebSocket ready`);
  console.log(`   POST /api/runs`);
});
