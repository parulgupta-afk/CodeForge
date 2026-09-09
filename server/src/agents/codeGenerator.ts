import Anthropic from "@anthropic-ai/sdk";
import { buildGenerationPrompt } from "../prompts/generation";
import { GeneratedCode, GenerationResult } from "../types/generation";

function parseGeneratedJson(
  raw: string,
  provider: string,
  model: string
): GenerationResult {
  let jsonStr = raw.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return {
      success: false,
      error: "Failed to parse JSON from model response",
      rawResponse: raw,
      provider,
      model,
    };
  }

  if (!parsed.language || !parsed.filename || !parsed.code) {
    return {
      success: false,
      error: "Model response missing required fields (language, filename, code)",
      rawResponse: raw,
      provider,
      model,
    };
  }

  return {
    success: true,
    data: {
      language: "python",
      filename: parsed.filename || "main.py",
      code: parsed.code,
      dependencies: Array.isArray(parsed.dependencies) ? parsed.dependencies : [],
      explanation: parsed.explanation || "",
    },
    provider,
    model,
  };
}

async function generateWithAnthropic(prompt: string): Promise<GenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { success: false, error: "ANTHROPIC_API_KEY is not set" };
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";
  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { success: false, error: "No text returned from Anthropic" };
    }

    return parseGeneratedJson(textBlock.text, "anthropic", model);
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Anthropic API call failed",
      provider: "anthropic",
      model,
    };
  }
}

async function generateWithGemini(prompt: string): Promise<GenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY is not set" };
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        error: `Gemini API error (${res.status}): ${errText}`,
        provider: "gemini",
        model,
      };
    }

    const data = (await res.json()) as any;
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) {
      return {
        success: false,
        error: "No text content returned from Gemini",
        provider: "gemini",
        model,
      };
    }

    return parseGeneratedJson(raw, "gemini", model);
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gemini API call failed",
      provider: "gemini",
      model,
    };
  }
}

export async function generateCode(task: string): Promise<GenerationResult> {
  const prompt = buildGenerationPrompt(task);

  // If Gemini is explicitly preferred or Anthropic fails/has no credits, try Gemini
  if (process.env.ANTHROPIC_API_KEY) {
    const anthropicResult = await generateWithAnthropic(prompt);
    if (anthropicResult.success) {
      return anthropicResult;
    }
    // If Anthropic fails (e.g. credit limit, network, auth), fallback to Gemini if available
    if (process.env.GEMINI_API_KEY) {
      console.warn(`Anthropic error (${anthropicResult.error}). Falling back to Gemini...`);
      return await generateWithGemini(prompt);
    }
    return anthropicResult;
  }

  if (process.env.GEMINI_API_KEY) {
    return await generateWithGemini(prompt);
  }

  return {
    success: false,
    error: "No LLM API keys configured. Set ANTHROPIC_API_KEY or GEMINI_API_KEY in .env",
  };
}
