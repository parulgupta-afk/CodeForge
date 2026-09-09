import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { Express } from "express";

export function applySecurity(app: Express) {
  // Basic security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // keep simple for API
      crossOriginEmbedderPolicy: false,
    })
  );

  // Rate limit: 60 requests per minute per IP on API routes
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });

  // Limit on creating runs (allowing enough throughput for benchmark suite)
  const runLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Number(process.env.RUN_RATE_LIMIT || 100),
    message: { error: "Run rate limit exceeded. Max 100 runs per minute." },
  });

  app.use("/api/", apiLimiter);
  app.use("/api/runs", runLimiter);
}
