/**
 * Optional portfolio API — npm run api
 * Env: GEMINI_API_KEY, PORT (default 8787), CORS_ORIGIN
 * Core static site works without this service.
 */
import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 8787);
const ORIGIN = process.env.CORS_ORIGIN || '*';

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: '256kb' }));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/api/projects', (_req, res) => {
  res.json({
    message: 'Projects are served from the static client (src/data/portfolioData.ts).',
    endpoints: ['GET /api/health', 'POST /api/ai/chat'],
  });
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const message = String(req.body?.message ?? '')
      .slice(0, 2000)
      .trim();
    const context = String(req.body?.context ?? '').slice(0, 100000);
    if (!message) {
      return res.status(400).json({ error: 'message_required' });
    }

    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'MY_GEMINI_API_KEY') {
      return res.status(503).json({
        error: 'gemini_unconfigured',
        hint: 'Set GEMINI_API_KEY or use the client local retriever',
      });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey: key });
    const prompt = `You are PARUL_OS, a portfolio agent for Parul Gupta.
Only use the CONTEXT JSON below. Never invent projects, employers, metrics, or technologies.
If unsure, say you do not have evidence in the portfolio.

CONTEXT:
${context}

USER:
${message}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    const text =
      (response as { text?: string }).text ||
      (
        response as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
      ).candidates?.[0]?.content?.parts
        ?.map((p) => p.text)
        .join('\n') ||
      '';

    const bullets = String(text)
      .split('\n')
      .map((l) => l.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter((l) => l.length > 8)
      .slice(0, 8);

    return res.json({
      intent: 'GEMINI_GROUNDED',
      summary: String(text).slice(0, 1200) || 'No response',
      bullets: bullets.length ? bullets : [String(text).slice(0, 200)],
    });
  } catch (err) {
    console.error('ai_chat_error', err instanceof Error ? err.message : 'unknown');
    return res.status(500).json({ error: 'gemini_failed' });
  }
});

app.use((_req, res) => res.status(404).json({ error: 'not_found' }));

app.listen(PORT, () => {
  console.error(`portfolio-api listening on :${PORT}`);
});
