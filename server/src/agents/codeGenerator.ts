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

  // If there's surrounding text outside markdown code block, extract the JSON object
  const firstBrace = jsonStr.indexOf("{");
  const lastBrace = jsonStr.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
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

  if (!parsed.code) {
    return {
      success: false,
      error: "Model response missing required 'code' field",
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

let anthropicTemporarilyDisabled = false;

async function generateWithAnthropic(prompt: string): Promise<GenerationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { success: false, error: "ANTHROPIC_API_KEY is not set" };
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((block) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return { success: false, error: "No text returned from Anthropic", provider: "anthropic", model };
    }

    return parseGeneratedJson(textBlock.text, "anthropic", model);
  } catch (err: any) {
    const errMsg = err.message || "Anthropic API call failed";
    if (errMsg.includes("credit balance") || err.status === 400 || err.status === 401) {
      anthropicTemporarilyDisabled = true;
    }
    return {
      success: false,
      error: errMsg,
      provider: "anthropic",
      model,
    };
  }
}

async function generateWithGemini(prompt: string, maxRetries = 4): Promise<GenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY is not set" };
  }

  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
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

      // Handle Gemini Rate Limit (429) with exponential backoff
      if (res.status === 429) {
        if (attempt < maxRetries) {
          const delayMs = (attempt + 1) * 5000;
          console.warn(`[Gemini] Rate limit 429 hit. Pausing ${delayMs / 1000}s before retry (${attempt + 1}/${maxRetries})...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
      }

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
      if (attempt < maxRetries) {
        const delayMs = 3000;
        console.warn(`[Gemini] Network error: ${err.message}. Retrying in ${delayMs / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      return {
        success: false,
        error: err.message || "Gemini API call failed",
        provider: "gemini",
        model,
      };
    }
  }

  return {
    success: false,
    error: "Gemini API call failed after retries",
    provider: "gemini",
    model,
  };
}

function generateMockCode(taskOrPrompt: string): GenerationResult {
  const lower = taskOrPrompt.toLowerCase();
  let pythonCode = `print("Task executed successfully")`;

  if (lower.includes("average") && lower.includes("100")) {
    pythonCode = `nums = list(range(1, 101))\nprint(sum(nums) / len(nums))`;
  } else if (lower.includes("sum of evens") || (lower.includes("even") && lower.includes("50"))) {
    pythonCode = `print(sum(x for x in range(1, 51) if x % 2 == 0))`;
  } else if (lower.includes("factorial") && lower.includes("10")) {
    pythonCode = `import math\nprint(math.factorial(10))`;
  } else if (lower.includes("reverse") && lower.includes("codeforge")) {
    pythonCode = `print("CodeForge"[::-1])`;
  } else if (lower.includes("palindrome")) {
    pythonCode = `s = "racecar"\nprint(s == s[::-1])`;
  } else if (lower.includes("json")) {
    pythonCode = `import json\nd = json.loads('{"a": 10, "b": 20, "c": 30}')\nprint(sum(d.values()))`;
  } else if (lower.includes("word count") || lower.includes("lazy dog")) {
    pythonCode = `s = "The quick brown fox jumps over the lazy dog"\nprint(len(s.split()))`;
  } else if (lower.includes("unique sorted") || lower.includes("[5, 2, 8")) {
    pythonCode = `print(sorted(list(set([5, 2, 8, 2, 1, 9, 5, 8]))))`;
  } else if (lower.includes("max value") || lower.includes("[42, 17")) {
    pythonCode = `print(max([42, 17, 89, 33, 95, 12]))`;
  } else if (lower.includes("dict keys") || lower.includes("sorted list of keys")) {
    pythonCode = `d = {"banana": 3, "apple": 5, "cherry": 2}\nprint(sorted(list(d.keys())))`;
  } else if (lower.includes("fizzbuzz")) {
    pythonCode = `out = []\nfor i in range(1, 16):\n    if i % 15 == 0: out.append("FizzBuzz")\n    elif i % 3 == 0: out.append("Fizz")\n    elif i % 5 == 0: out.append("Buzz")\n    else: out.append(str(i))\nprint(" ".join(out))`;
  } else if (lower.includes("csv")) {
    pythonCode = `csv_data = "name,score\\nAlice,85\\nBob,92\\nCharlie,78\\nDiana,95"\nlines = csv_data.strip().split("\\n")[1:]\nscores = [float(line.split(",")[1]) for line in lines]\nprint(sum(scores) / len(scores))`;
  } else if (lower.includes("fibonacci")) {
    pythonCode = `def fib(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\nprint(fib(10))`;
  } else if (lower.includes("prime")) {
    pythonCode = `def is_prime(n):\n    if n < 2: return False\n    for i in range(2, int(n**0.5) + 1):\n        if n % i == 0: return False\n    return True\nprint(is_prime(29))`;
  } else if (lower.includes("gcd")) {
    pythonCode = `import math\nprint(math.gcd(48, 18))`;
  } else if (lower.includes("missing pandas") || lower.includes("pandas")) {
    pythonCode = `data = [10, 20, 30, 40, 50]\nprint(sum(data) / len(data))`;
  } else if (lower.includes("type error") || lower.includes("sum strings")) {
    pythonCode = `items = ["10", "20", "30"]\nprint(sum(int(x) for x in items))`;
  } else if (lower.includes("index error") || lower.includes("safe get")) {
    pythonCode = `items = [1, 2, 3]\nidx = 5\nprint(items[idx] if idx < len(items) else None)`;
  } else if (lower.includes("timeout")) {
    pythonCode = `print(sum(range(1000)))`;
  } else if (lower.includes("network")) {
    pythonCode = `print("offline computation ready")`;
  } else if (lower.includes("list comprehension") || lower.includes("squares of even")) {
    pythonCode = `print([x**2 for x in range(1, 11) if x % 2 == 0])`;
  } else if (lower.includes("sort dict by value")) {
    pythonCode = `d = {"a": 3, "b": 1, "c": 2}\nprint(sorted(d.items(), key=lambda x: x[1]))`;
  } else if (lower.includes("binary search")) {
    pythonCode = `import bisect\nitems = [1, 3, 5, 7, 9, 11]\nidx = bisect.bisect_left(items, 7)\nprint(idx if idx < len(items) and items[idx] == 7 else -1)`;
  } else if (lower.includes("title case")) {
    pythonCode = `print("hello world from codeforge".title())`;
  } else if (lower.includes("filter positives")) {
    pythonCode = `items = [-5, 3, -1, 10, -2, 7]\nprint([x for x in items if x > 0])`;
  }

  return {
    success: true,
    data: {
      language: "python",
      filename: "main.py",
      code: pythonCode,
      dependencies: [],
      explanation: "Generated by CodeForge Mock LLM",
    },
    provider: "mock",
    model: "mock-llm",
  };
}

export async function generateCode(taskOrPrompt: string): Promise<GenerationResult> {
  // Support offline mock mode if configured
  if (process.env.USE_MOCK_LLM === "true") {
    return generateMockCode(taskOrPrompt);
  }

  // Prevent double-wrapping if taskOrPrompt is already a formatted prompt
  const prompt = taskOrPrompt.startsWith("You are an expert Python programmer")
    ? taskOrPrompt
    : buildGenerationPrompt(taskOrPrompt);

  // 1. Try Anthropic first if key is present and not currently disabled
  if (process.env.ANTHROPIC_API_KEY && !anthropicTemporarilyDisabled) {
    const anthropicResult = await generateWithAnthropic(prompt);
    if (anthropicResult.success) {
      return anthropicResult;
    }

    // If Anthropic fails (e.g. credit limit, network, auth), fallback to Gemini
    if (process.env.GEMINI_API_KEY) {
      console.warn(`[CodeForge] Anthropic unavailable (${anthropicResult.error}). Falling back to Gemini...`);
      return await generateWithGemini(prompt);
    }

    return anthropicResult;
  }

  // 2. Try Gemini
  if (process.env.GEMINI_API_KEY) {
    return await generateWithGemini(prompt);
  }

  // 3. Fallback to mock if nothing else works
  console.warn("[CodeForge] No API keys configured or working. Using mock generator.");
  return generateMockCode(taskOrPrompt);
}
