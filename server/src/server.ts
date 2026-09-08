import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ 
    status: "ok", 
    service: "CodeForge", 
    phase: 0,
    message: "Phase 0 foundation is alive"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 CodeForge server (Phase 0) running on http://localhost:${PORT}`);
});
