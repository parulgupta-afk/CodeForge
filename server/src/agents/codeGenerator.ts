import Anthropic from "@anthropic-ai/sdk";
import { buildGenerationPrompt } from "../prompts/generation";
import { GeneratedCode, GenerationResult } from "../types/generation";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateCode(task: string): Promise<GenerationResult> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      success: false,
      error: "ANTHROPIC_API_KEY is not set in environment variables",
    };
  }

  try {
    const prompt = buildGenerationPrompt(task);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514", // You can change this later
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    // Extract text content
    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return {
        success: false,
        error: "No text content returned from Anthropic",
      };
    }

    const raw = textBlock.text.trim();

    // Try to parse JSON (sometimes the model wraps it in ```json)
    let jsonStr = raw;
    if (raw.startsWith("```")) {
      jsonStr = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed: GeneratedCode;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (err) {
      return {
        success: false,
        error: "Failed to parse JSON from model response",
        rawResponse: raw,
      };
    }

    // Basic validation
    if (
      !parsed.language ||
      !parsed.filename ||
      !parsed.code ||
      !Array.isArray(parsed.dependencies)
    ) {
      return {
        success: false,
        error: "Model response missing required fields",
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
    };
  } catch (err: any) {
    console.error("generateCode error:", err);
    return {
      success: false,
      error: err.message || "Unknown error calling Anthropic API",
    };
  }
}
