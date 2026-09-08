import path from "path";
import dotenv from "dotenv";

// Load environment variables from multiple possible locations
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import express from "express";
import cors from "cors";
import runsRouter from "./routes/runs";
import { ensureSchema } from "./database/schema";
import { isDbReady } from "./database/db";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", async (_req, res) => {
  const dbReady = await isDbReady();
  res.json({
    status: "ok",
    service: "CodeForge",
    phase: 7,
    message: "PostgreSQL Persistence ready",
    database: dbReady ? "connected" : "not configured (using in-memory)",
  });
});

// Runs API
app.use("/api/runs", runsRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

async function start() {
  try {
    await ensureSchema();
  } catch (err) {
    console.warn("Could not ensure database schema:", err);
  }

  app.listen(PORT, () => {
    console.log(`🚀 CodeForge server (Phase 7) running on http://localhost:${PORT}`);
    console.log(`   POST /api/runs`);
    console.log(`   GET  /api/runs`);
    console.log(`   GET  /api/runs/:id`);
  });
}

start();
