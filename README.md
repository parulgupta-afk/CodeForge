# CodeForge

Autonomous Coding Agent with Sandboxed Execution

**GitHub:** https://github.com/parulgupta-afk/CodeForge

## Current Status: Phase 6 – Error Classifier

### What works now
- Full autonomous loop: Generate → Execute → **Classify Error** → Repair → Execute
- Structured error categories:
  - SyntaxError
  - MissingDependency
  - RuntimeException
  - Timeout
  - PermissionDenied
  - NetworkBlocked
  - Unknown
- Smarter repair prompts that use the classified error instead of raw traceback

### Project Structure
```
server/src/
├── agents/
│   ├── codeGenerator.ts
│   ├── repairAgent.ts
│   └── orchestrator.ts
├── classifier/
│   └── errorClassifier.ts     ← NEW
├── prompts/
│   ├── generation.ts
│   └── repair.ts              ← UPDATED
├── sandbox/
└── types/
    └── error.ts               ← NEW
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
- Phase 2 ✅ LLM Code Generation
- Phase 3 ✅ Local Execution Engine
- Phase 4 ✅ Autonomous Repair Loop
- Phase 5 → Docker Sandbox (push when ready)
- Phase 6 ✅ Error Classifier
- Phase 7 → PostgreSQL Persistence
