import path from "path";
import dotenv from "dotenv";
import Anthropic from "@anthropic-ai/sdk";
import { buildGenerationPrompt } from "../prompts/generation";
import { GeneratedCode, GenerationResult } from "../types/generation";

// Ensure environment variables are loaded
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function parseGeneratedJson(raw: string): GeneratedCode | null {
  let cleaned = raw.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith("```")) {
    cleaned = cleaned
      .replace(/^```(?:json)?\r?\n?/, "")
      .replace(/\r?\n?```$/, "")
      .trim();
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (
      parsed.language &&
      parsed.filename &&
      parsed.code &&
      Array.isArray(parsed.dependencies)
    ) {
      return parsed;
    }
  } catch {
    // If direct parse fails, try extracting first outermost JSON object
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        if (
          parsed.language &&
          parsed.filename &&
          parsed.code &&
          Array.isArray(parsed.dependencies)
        ) {
          return parsed;
        }
      } catch {
        return null;
      }
    }
  }
  return null;
}

function resolvePrompt(task: string): string {
  if (task.includes("You are an expert Python programmer")) {
    return task;
  }
  return buildGenerationPrompt(task);
}

async function generateWithAnthropic(task: string): Promise<GenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return {
      success: false,
      error: "ANTHROPIC_API_KEY is not set in environment variables",
    };
  }

  const model = process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-sonnet-20241022";
  const anthropic = new Anthropic({ apiKey });
  const prompt = resolvePrompt(task);

  const message = await anthropic.messages.create({
    model,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return {
      success: false,
      error: "No text content returned from Anthropic",
    };
  }

  const raw = textBlock.text.trim();
  const parsed = parseGeneratedJson(raw);
  if (!parsed) {
    return {
      success: false,
      error: "Failed to parse JSON from model response",
      rawResponse: raw,
    };
  }

  return {
    success: true,
    data: {
      language: "python",
      filename: parsed.filename || "main.py",
      code: parsed.code,
      dependencies: parsed.dependencies || [],
      explanation: parsed.explanation || "",
    },
    provider: "anthropic",
    model,
  };
}

async function generateWithGemini(task: string): Promise<GenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return {
      success: false,
      error: "GEMINI_API_KEY is not set in environment variables",
    };
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
  const prompt = resolvePrompt(task);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    return {
      success: false,
      error: `Gemini API error (${response.status}): ${errorBody}`,
    };
  }

  const data: any = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!raw) {
    return {
      success: false,
      error: "No text content returned from Gemini",
    };
  }

  const parsed = parseGeneratedJson(raw);
  if (!parsed) {
    return {
      success: false,
      error: "Failed to parse JSON from model response",
      rawResponse: raw,
    };
  }

  return {
    success: true,
    data: {
      language: "python",
      filename: parsed.filename || "main.py",
      code: parsed.code,
      dependencies: parsed.dependencies || [],
      explanation: parsed.explanation || "",
    },
    provider: "gemini",
    model,
  };
}

function generateWithMock(task: string): GenerationResult {
  const normalized = task.toLowerCase();
  let code = "";
  let explanation = "";

  if (
    normalized.includes("average") &&
    (normalized.includes("1 to 100") || normalized.includes("1-100"))
  ) {
    code = `# Calculate the average of numbers from 1 to 100\nnumbers = list(range(1, 101))\naverage = sum(numbers) / len(numbers)\nprint(f"The average of numbers from 1 to 100 is: {average}")\n`;
    explanation =
      "Calculates the arithmetic mean of integers from 1 to 100 using standard Python list and sum.";
  } else {
    code = `# Task solution\ndef main():\n    print("CodeForge task executed successfully")\n\nif __name__ == "__main__":\n    main()\n`;
    explanation = "Standard runnable Python solution.";
  }

  return {
    success: true,
    data: {
      language: "python",
      filename: "main.py",
      code,
      dependencies: [],
      explanation,
    },
    provider: "mock",
    model: "codeforge-offline-mock",
  };
}

export async function generateCode(task: string): Promise<GenerationResult> {
  if (process.env.USE_MOCK_LLM === "true") {
    return generateWithMock(task);
  }

  // Primary provider: Anthropic Claude
  if (process.env.ANTHROPIC_API_KEY?.trim()) {
    try {
      const result = await generateWithAnthropic(task);
      if (result.success) {
        return result;
      }

      console.warn("Anthropic generation failed:", result.error);

      // Fall back if credit balance is low or billing issue
      const isCreditOrQuota =
        result.error &&
        (result.error.includes("credit balance") ||
          result.error.includes("balance is too low") ||
          result.error.includes("billing") ||
          result.error.includes("rate_limit") ||
          result.error.includes("400") ||
          result.error.includes("429"));

      if (isCreditOrQuota) {
        console.info(
          "Anthropic credit balance is low; falling back to alternative provider..."
        );
        if (process.env.GEMINI_API_KEY?.trim()) {
          const geminiResult = await generateWithGemini(task);
          if (geminiResult.success) {
            return geminiResult;
          }
          console.warn("Gemini fallback failed:", geminiResult.error);
        }
        return generateWithMock(task);
      }

      return result;
    } catch (err: any) {
      console.error("Anthropic call error:", err);
      if (process.env.GEMINI_API_KEY?.trim()) {
        try {
          return await generateWithGemini(task);
        } catch (gErr) {
          console.error("Gemini fallback error:", gErr);
        }
      }
      return generateWithMock(task);
    }
  }

  // Secondary provider: Gemini
  if (process.env.GEMINI_API_KEY?.trim()) {
    return await generateWithGemini(task);
  }

  // Fallback to offline mock generator
  return generateWithMock(task);
}
