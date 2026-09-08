# CodeForge

Autonomous Coding Agent with Sandboxed Execution

**GitHub:** https://github.com/parulgupta-afk/CodeForge

## Current Status: Phase 4 – Autonomous Repair Loop

### What works now
- Full autonomous loop: **Generate → Execute → Repair → Execute** (up to 3 attempts)
- Structured attempt history returned to the client
- Works with your existing Anthropic / Gemini / Mock providers

### Project Structure
```
server/src/
├── agents/
│   ├── codeGenerator.ts      ← keep your improved version
│   ├── repairAgent.ts        ← NEW
│   └── orchestrator.ts       ← NEW (the brain)
├── prompts/
│   ├── generation.ts
│   └── repair.ts             ← NEW
├── sandbox/localExecutor.ts
├── types/
│   ├── attempt.ts            ← NEW
│   └── ...
└── controllers/runsController.ts
```

## Setup (Windows CMD)

```cmd
cd codeforge\server
npm install
echo ANTHROPIC_API_KEY=sk-ant-your-key-here > .env
npm run dev
```

### Test the repair loop

```cmd
curl -X POST http://localhost:3001/api/runs -H "Content-Type: application/json" -d "{\"task\": \"Calculate the average of numbers from 1 to 100\"}"
```

Try a task that is likely to fail on the first attempt to see the repair in action.

## Roadmap Progress
- Phase 0 ✅ Environment + Architecture
- Phase 1 ✅ Backend Foundation
- Phase 2 ✅ LLM Code Generation
- Phase 3 ✅ Local Execution Engine
- Phase 4 ✅ Autonomous Repair Loop
- Phase 5 → Docker Sandbox
- Phase 6 → Error Classifier
