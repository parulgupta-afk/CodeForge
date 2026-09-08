import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import runsRouter from "./routes/runs";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "CodeForge",
    phase: 6,
    message: "Error Classifier ready",
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

app.listen(PORT, () => {
  console.log(`🚀 CodeForge server (Phase 6) running on http://localhost:${PORT}`);
  console.log(`   POST /api/runs`);
  console.log(`   GET  /api/runs`);
  console.log(`   GET  /api/runs/:id`);
});
