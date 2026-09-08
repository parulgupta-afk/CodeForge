import path from "path";
import dotenv from "dotenv";
import http from "http";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import express from "express";
import cors from "cors";
import runsRouter from "./routes/runs";
import { initSocketIO } from "./websocket/io";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "CodeForge",
    phase: 9,
    message: "Live WebSocket logs ready",
  });
});

app.use("/api/runs", runsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

const httpServer = http.createServer(app);
initSocketIO(httpServer);

httpServer.listen(PORT, () => {
  console.log(`🚀 CodeForge server (Phase 9) running on http://localhost:${PORT}`);
  console.log(`   WebSocket ready`);
  console.log(`   POST /api/runs`);
});
