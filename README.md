# CodeForge

Autonomous Coding Agent with Sandboxed Execution

**GitHub:** https://github.com/parulgupta-afk/CodeForge

## Current Status: Phase 1 – Backend Foundation

### Project Structure
```
codeforge/
├── client/          # React frontend (coming in Phase 8)
├── server/          # Express + TypeScript backend ✅
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── store/         # In-memory runs store
│       ├── types/
│       └── server.ts
├── sandbox/         # Docker execution (Phase 5)
├── benchmark/       # Evaluation (Phase 11)
└── docker/
```

## Phase 1 Features
- `POST /api/runs` – Create a new coding task
- `GET  /api/runs` – List all runs
- `GET  /api/runs/:id` – Get a specific run
- `GET  /api/health` – Health check

## Quick Start

```bash
cd server
npm install
npm run dev
```

### Test the API

```bash
# Create a run
curl -X POST http://localhost:3001/api/runs \
  -H "Content-Type: application/json" \
  -d '{"task": "Calculate the average of numbers from 1 to 100"}'

# List runs
curl http://localhost:3001/api/runs
```

## Roadmap
- Phase 0 ✅ Environment + Architecture
- Phase 1 ✅ Backend Foundation
- Phase 2 → LLM Code Generation (Anthropic)
- Phase 3 → Local Execution Engine
- Phase 4 → Autonomous Repair Loop
- Phase 5 → Docker Sandbox
- ... and more
