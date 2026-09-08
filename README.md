# CodeForge

Autonomous Coding Agent with Sandboxed Execution

**GitHub:** https://github.com/parulgupta-afk/CodeForge

## Current Status: Phase 2 – LLM Code Generation

### What works now
- `POST /api/runs` → sends task to Anthropic Claude → returns structured Python code
- In-memory run tracking
- Health endpoint

### Project Structure
```
server/src/
├── agents/codeGenerator.ts   ← NEW
├── prompts/generation.ts     ← NEW
├── types/generation.ts       ← NEW
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

### Test

```cmd
curl -X POST http://localhost:3001/api/runs -H "Content-Type: application/json" -d "{\"task\": \"Calculate the average of numbers from 1 to 100\"}"
```

## Roadmap Progress
- Phase 0 ✅ Environment + Architecture
- Phase 1 ✅ Backend Foundation
- Phase 2 ✅ LLM Code Generation (Anthropic)
- Phase 3 → Local Execution Engine
- Phase 4 → Autonomous Repair Loop
- Phase 5 → Docker Sandbox
