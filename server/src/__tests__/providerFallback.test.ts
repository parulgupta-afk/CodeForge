/**
 * Provider fallback + JSON parser tests (mocked fetch).
 * Run: npx ts-node --transpile-only src/__tests__/providerFallback.test.ts
 */
import { generateCode } from "../agents/codeGenerator";

let passed = 0;
let failed = 0;

function assert(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.error(`  ✗ ${name}${detail ? " — " + detail : ""}`);
  }
}

const originalFetch = globalThis.fetch;

function mockFetchSequence(responses: Array<{ status: number; body: any }>) {
  let i = 0;
  globalThis.fetch = (async () => {
    const r = responses[Math.min(i, responses.length - 1)];
    i++;
    return {
      ok: r.status >= 200 && r.status < 300,
      status: r.status,
      text: async () => (typeof r.body === "string" ? r.body : JSON.stringify(r.body)),
      json: async () => r.body,
    } as any;
  }) as any;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

async function run() {
  console.log("provider fallback tests\n");

  const prev = { ...process.env };

  // Mock only
  {
    process.env.USE_MOCK_LLM = "true";
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    const r = await generateCode("Calculate the average of numbers from 1 to 100");
    assert("Mock succeeds", r.success === true);
    assert("Mock provider", r.provider === "mock");
    assert("Mock has code", !!r.data?.code);
  }

  // Gemini success → Groq not needed
  {
    process.env.USE_MOCK_LLM = "false";
    process.env.GEMINI_API_KEY = "fake";
    process.env.GROQ_API_KEY = "fake";
    let groqHit = false;
    const restore = mockFetchSequence([
      {
        status: 200,
        body: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      code: "print(1)",
                      filename: "main.py",
                      dependencies: [],
                      explanation: "ok",
                    }),
                  },
                ],
              },
            },
          ],
        },
      },
    ]);
    // Intercept to detect groq URL
    const prevFetch = globalThis.fetch;
    globalThis.fetch = (async (url: any, init?: any) => {
      if (String(url).includes("groq.com")) groqHit = true;
      return prevFetch(url, init);
    }) as any;

    const r = await generateCode("print one");
    restore();
    globalThis.fetch = originalFetch;
    assert("Gemini success", r.success === true && r.provider === "gemini");
    assert("Groq not called", groqHit === false);
  }

  // Gemini fail → Groq success
  {
    process.env.USE_MOCK_LLM = "false";
    process.env.GEMINI_API_KEY = "fake";
    process.env.GROQ_API_KEY = "fake";
    const restore = mockFetchSequence([
      { status: 500, body: "gemini down" },
      {
        status: 200,
        body: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  code: "print(2)",
                  filename: "main.py",
                  dependencies: [],
                  explanation: "from groq",
                }),
              },
            },
          ],
        },
      },
    ]);
    const r = await generateCode("print two");
    restore();
    assert("Fallback to Groq", r.success === true && r.provider === "groq");
  }

  // Both fail → mock
  {
    process.env.USE_MOCK_LLM = "false";
    process.env.GEMINI_API_KEY = "fake";
    process.env.GROQ_API_KEY = "fake";
    const restore = mockFetchSequence([
      { status: 500, body: "down" },
      { status: 500, body: "down" },
    ]);
    const r = await generateCode("Calculate the average of numbers from 1 to 100");
    restore();
    assert("Both fail uses mock", r.success === true && r.provider === "mock");
  }

  // Markdown-fenced JSON still parses via mock path is separate;
  // exercise generate with gemini returning fenced JSON
  {
    process.env.USE_MOCK_LLM = "false";
    process.env.GEMINI_API_KEY = "fake";
    delete process.env.GROQ_API_KEY;
    const fenced =
      '```json\n{"code":"print(9)","filename":"main.py","dependencies":[],"explanation":"x"}\n```';
    const restore = mockFetchSequence([
      {
        status: 200,
        body: { candidates: [{ content: { parts: [{ text: fenced }] } }] },
      },
    ]);
    const r = await generateCode("nine");
    restore();
    assert("Parses fenced JSON", Boolean(r.success === true && r.data?.code.includes("print(9)")));
  }

  // Missing code field
  {
    process.env.USE_MOCK_LLM = "false";
    process.env.GEMINI_API_KEY = "fake";
    delete process.env.GROQ_API_KEY;
    const restore = mockFetchSequence([
      {
        status: 200,
        body: {
          candidates: [
            { content: { parts: [{ text: JSON.stringify({ explanation: "no code" }) }] } },
          ],
        },
      },
    ]);
    // After gemini fails parse, no groq → mock
    const r = await generateCode("missing code field");
    restore();
    // Either parse fail then mock, or success mock — must not crash
    assert("Handles missing code without crash", r.success === true || r.success === false);
  }

  Object.assign(process.env, prev);
  globalThis.fetch = originalFetch;

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
