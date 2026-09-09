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

  // Stricter limit on creating runs (expensive: LLM + sandbox)
  const runLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: { error: "Run rate limit exceeded. Max 10 runs per minute." },
  });

  app.use("/api/", apiLimiter);
  app.use("/api/runs", runLimiter);
}
