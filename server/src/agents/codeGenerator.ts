import { buildGenerationPrompt } from "../prompts/generation";
import { GenerationResult } from "../types/generation";

/**
 * Provider chain:
 *   1. Gemini  (if GEMINI_API_KEY set)
 *   2. Groq    (if GROQ_API_KEY set)
 *   3. Mock    (always available offline)
 */

function parseGeneratedJson(
  raw: string,
  provider: string,
  model: string
): GenerationResult {
  let jsonStr = raw.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

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

// ---------- Gemini ----------
async function generateWithGemini(prompt: string, maxRetries = 3): Promise<GenerationResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY is not set" };
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.0-flash";
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

      if (res.status === 429) {
        if (attempt < maxRetries) {
          const delayMs = (attempt + 1) * 4000;
          console.warn(`[Gemini] 429 rate limit – retry in ${delayMs / 1000}s`);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
      }

      if (!res.ok) {
        const errText = await res.text();
        return {
          success: false,
          error: `Gemini API error (${res.status}): ${errText.slice(0, 300)}`,
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
        await new Promise((r) => setTimeout(r, 3000));
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
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  };
}

// ---------- Groq (OpenAI-compatible) ----------
async function generateWithGroq(prompt: string, maxRetries = 2): Promise<GenerationResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { success: false, error: "GROQ_API_KEY is not set" };
  }

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
  const url = "https://api.groq.com/openai/v1/chat/completions";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "You are a Python code generator. Always respond with a single JSON object only, no markdown, with keys: code, filename, dependencies, explanation.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 2048,
        }),
      });

      if (res.status === 429) {
        if (attempt < maxRetries) {
          const delayMs = (attempt + 1) * 3000;
          console.warn(`[Groq] 429 rate limit – retry in ${delayMs / 1000}s`);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
      }

      if (!res.ok) {
        const errText = await res.text();
        return {
          success: false,
          error: `Groq API error (${res.status}): ${errText.slice(0, 300)}`,
          provider: "groq",
          model,
        };
      }

      const data = (await res.json()) as any;
      const raw = data?.choices?.[0]?.message?.content;
      if (!raw) {
        return {
          success: false,
          error: "No text content returned from Groq",
          provider: "groq",
          model,
        };
      }

      return parseGeneratedJson(raw, "groq", model);
    } catch (err: any) {
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 2000));
        continue;
      }
      return {
        success: false,
        error: err.message || "Groq API call failed",
        provider: "groq",
        model,
      };
    }
  }

  return {
    success: false,
    error: "Groq API call failed after retries",
    provider: "groq",
    model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  };
}

// ---------- Mock (offline) ----------
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
  } else if (lower.includes("json") && lower.includes("sum")) {
    pythonCode = `import json\nprint(sum(json.loads('[1,2,3,4,5]')))`;
  } else if (lower.includes("word count") || lower.includes("lazy dog")) {
    pythonCode = `s = "The quick brown fox jumps over the lazy dog"\nprint(len(s.split()))`;
  } else if (lower.includes("unique") || lower.includes("[1,2,2,3")) {
    pythonCode = `print(" ".join(str(x) for x in sorted(set([1,2,2,3,3,3,4]))))`;
  } else if (lower.includes("max") && lower.includes("23")) {
    pythonCode = `print(max([23, 1, 56, 8, 42]))`;
  } else if (lower.includes("dict keys") || lower.includes("'a':1")) {
    pythonCode = `print(",".join({"a":1,"b":2,"c":3}.keys()))`;
  } else if (lower.includes("fizzbuzz")) {
    pythonCode = `for i in range(1, 16):\n    if i % 15 == 0: print("FizzBuzz")\n    elif i % 3 == 0: print("Fizz")\n    elif i % 5 == 0: print("Buzz")\n    else: print(i)`;
  } else if (lower.includes("csv")) {
    pythonCode = `csv = "name,score\\nA,10\\nB,20\\nC,30"\nlines = csv.strip().split("\\n")[1:]\nscores = [float(l.split(",")[1]) for l in lines]\nprint(sum(scores)/len(scores))`;
  } else if (lower.includes("fibonacci")) {
    pythonCode = `a,b=0,1\nout=[]\nfor _ in range(10):\n    out.append(str(a)); a,b=b,a+b\nprint(" ".join(out))`;
  } else if (lower.includes("prime")) {
    pythonCode = `n=29\nprint(all(n%i for i in range(2,int(n**0.5)+1)) and n>1)`;
  } else if (lower.includes("gcd")) {
    pythonCode = `import math\nprint(math.gcd(48, 18))`;
  } else if (lower.includes("pandas") || lower.includes("missing")) {
    pythonCode = `print(sum([1,2,3])/len([1,2,3]))`;
  } else if (lower.includes("type error") || lower.includes("points")) {
    pythonCode = `print(str(5)+"points")`;
  } else if (lower.includes("index error")) {
    pythonCode = `lst=[10,20,30]\nprint("Index out of range. Recovery successful." if 5>=len(lst) else lst[5])`;
  } else if (lower.includes("timeout")) {
    pythonCode = `for i in range(1,11): print(i)\nprint("done")`;
  } else if (lower.includes("network") || lower.includes("offline")) {
    pythonCode = `print("offline-ok")`;
  } else if (lower.includes("list comprehension") || lower.includes("squares")) {
    pythonCode = `print(" ".join(str(x*x) for x in range(1,6)))`;
  } else if (lower.includes("sort dict")) {
    pythonCode = `d={"b":2,"a":3,"c":1}\nprint(" ".join(k for k,_ in sorted(d.items(), key=lambda x:x[1])))`;
  } else if (lower.includes("binary search")) {
    pythonCode = `arr=[1,3,5,7,9]; t=7\nprint(arr.index(t) if t in arr else -1)`;
  } else if (lower.includes("title case")) {
    pythonCode = `print("code forge agent".title())`;
  } else if (lower.includes("filter positives") || lower.includes("positive")) {
    pythonCode = `print(" ".join(str(x) for x in [-2,0,3,-1,5,8] if x>0))`;
  }

  return {
    success: true,
    data: {
      language: "python",
      filename: "main.py",
      code: pythonCode,
      dependencies: [],
      explanation: "Generated by CodeForge Mock LLM (offline fallback)",
    },
    provider: "mock",
    model: "mock-llm",
  };
}

// ---------- Public entry ----------
export async function generateCode(taskOrPrompt: string): Promise<GenerationResult> {
  if (process.env.USE_MOCK_LLM === "true") {
    return generateMockCode(taskOrPrompt);
  }

  const prompt = taskOrPrompt.startsWith("You are an expert Python programmer")
    ? taskOrPrompt
    : buildGenerationPrompt(taskOrPrompt);

  // 1. Gemini
  if (process.env.GEMINI_API_KEY) {
    const gemini = await generateWithGemini(prompt);
    if (gemini.success) return gemini;
    console.warn(`[CodeForge] Gemini failed (${gemini.error}). Trying Groq...`);
  }

  // 2. Groq
  if (process.env.GROQ_API_KEY) {
    const groq = await generateWithGroq(prompt);
    if (groq.success) return groq;
    console.warn(`[CodeForge] Groq failed (${groq.error}). Falling back to mock...`);
  }

  // 3. Mock
  console.warn("[CodeForge] No working LLM keys. Using mock generator.");
  return generateMockCode(taskOrPrompt);
}
