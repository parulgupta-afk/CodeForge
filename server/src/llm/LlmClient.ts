/**
 * LlmClient – live / record / replay modes for deterministic CI and demos.
 * Phase 0 of CodeForge Evolution.
 *
 * Modes:
 *   live   – call real providers
 *   record – call live and write cassettes to disk
 *   replay – serve from cassettes only (no API keys needed)
 */

import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

export type LlmMode = "live" | "record" | "replay";

export interface LlmRequest {
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface LlmResponse {
  text: string;
  provider: string;
  model: string;
  promptTokens?: number;
  completionTokens?: number;
}

export interface Cassette {
  promptHash: string;
  request: LlmRequest;
  response: LlmResponse;
  recordedAt: string;
}

const CASSETTE_DIR =
  process.env.CASSETTE_DIR ||
  path.resolve(__dirname, "../../../benchmark/cassettes");

function promptHash(req: LlmRequest): string {
  const key = JSON.stringify({
    prompt: req.prompt,
    system: req.system || "",
    temperature: req.temperature ?? 0.2,
  });
  return crypto.createHash("sha256").update(key).digest("hex").slice(0, 16);
}

function cassettePath(hash: string): string {
  return path.join(CASSETTE_DIR, `${hash}.json`);
}

function ensureCassetteDir() {
  if (!fs.existsSync(CASSETTE_DIR)) {
    fs.mkdirSync(CASSETTE_DIR, { recursive: true });
  }
}

function loadCassette(hash: string): Cassette | null {
  const p = cassettePath(hash);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8")) as Cassette;
  } catch {
    return null;
  }
}

function saveCassette(c: Cassette) {
  ensureCassetteDir();
  fs.writeFileSync(cassettePath(c.promptHash), JSON.stringify(c, null, 2));
}

export function getLlmMode(): LlmMode {
  const m = (process.env.LLM_MODE || "live").toLowerCase();
  if (m === "record" || m === "replay") return m;
  return "live";
}

/**
 * Whether mock fallback is allowed.
 * Off outside tests unless ALLOW_MOCK_FALLBACK=true.
 */
export function allowMockFallback(): boolean {
  if (process.env.ALLOW_MOCK_FALLBACK === "true") return true;
  if (process.env.NODE_ENV === "test" || process.env.USE_MOCK_LLM === "true") return true;
  return false;
}

/**
 * High-level call: resolves mode, may return cassette or signal live path.
 */
export async function resolveLlmCall(
  req: LlmRequest,
  liveCall: () => Promise<LlmResponse>
): Promise<LlmResponse> {
  const mode = getLlmMode();
  const hash = promptHash(req);

  if (mode === "replay") {
    const c = loadCassette(hash);
    if (!c) {
      throw new Error(
        `provider_unavailable: no cassette for hash ${hash} (LLM_MODE=replay)`
      );
    }
    return c.response;
  }

  const response = await liveCall();

  if (mode === "record") {
    saveCassette({
      promptHash: hash,
      request: req,
      response,
      recordedAt: new Date().toISOString(),
    });
  }

  return response;
}
