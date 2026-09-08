# CodeForge

Autonomous Coding Agent with Sandboxed Execution

**GitHub:** https://github.com/parulgupta-afk/CodeForge

## Current Status: Phase 3 – Local Execution Engine

### What works now
- `POST /api/runs` → Generate Python code with Anthropic/Gemini/Mock → Execute it locally → Return stdout/stderr/exit code
- Timeout protection (15 seconds)
- Temporary file cleanup
- Structured execution result

### Project Structure
```
server/src/
├── agents/codeGenerator.ts
├── sandbox/localExecutor.ts   ← NEW (Phase 3)
├── prompts/
├── types/
│   ├── generation.ts
│   ├── execution.ts           ← NEW
│   └── run.ts                 ← UPDATED
├── controllers/
├── routes/
├── store/
└── server.ts
```

## Setup (Windows CMD)

```cmd
cd codeforge\server
npm install
echo ANTHROPIC_API_KEY=sk-ant-your-key-here > .env
npm run dev
```

> Optional: set `USE_MOCK_LLM=true` in `.env` to test without any API key.

### Test

```cmd
curl -X POST http://localhost:3001/api/runs -H "Content-Type: application/json" -d "{\"task\": \"Calculate the average of numbers from 1 to 100\"}"
```

You should now receive both the generated code **and** the real execution result (stdout).

## Roadmap Progress
- Phase 0 ✅ Environment + Architecture
- Phase 1 ✅ Backend Foundation
- Phase 2 ✅ LLM Code Generation (Anthropic + Gemini + Mock)
- Phase 3 ✅ Local Execution Engine
- Phase 4 → Autonomous Repair Loop
- Phase 5 → Docker Sandbox
