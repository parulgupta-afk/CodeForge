# CodeForge

Autonomous Coding Agent with Sandboxed Execution

**GitHub:** https://github.com/parulgupta-afk/CodeForge

## Current Status: Phase 5 – Docker Sandbox

### What works now
- Full autonomous loop (Generate → Execute → Repair)
- **Docker sandbox** with:
  - Network disabled (`--network none`)
  - Memory limit: 512 MB
  - CPU limit: 1 core
  - Timeout protection
  - Automatic container cleanup
- Fallback to local executor if Docker is unavailable

### How to enable Docker

In `server/.env`:
```
USE_DOCKER=true
SANDBOX_IMAGE=python:3.12-slim
```

### Setup (Windows CMD)

```cmd
:: Make sure Docker Desktop is running
cd codeforge\server
npm install
echo USE_DOCKER=true > .env
echo ANTHROPIC_API_KEY=sk-ant-your-key-here >> .env
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
- Phase 5 ✅ Docker Sandbox
- Phase 6 → Error Classifier
