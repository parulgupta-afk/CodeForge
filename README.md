# CodeForge

Autonomous Coding Agent with Sandboxed Execution

## Project Structure (Phase 0)

```
codeforge/
├── client/          # React + Vite frontend (Phase 8+)
├── server/          # Express + TypeScript backend
├── sandbox/         # Docker execution layer (Phase 5+)
├── benchmark/       # Evaluation tasks (Phase 11+)
├── docker/          # Dockerfiles
├── package.json
└── README.md
```

## Phase 0 Goal
- Monorepo layout
- TypeScript + Express foundation
- Health endpoint

## Quick Start (Phase 0)

```bash
cd server
npm install
npm run dev
```

Then open: http://localhost:3001/api/health
"# CodeForge" 
