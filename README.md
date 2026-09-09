# CodeForge

**Autonomous coding agent with sandboxed execution**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)]()
[![React](https://img.shields.io/badge/React-18-61dafb)]()
[![Docker](https://img.shields.io/badge/Sandbox-Docker-2496ED)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

CodeForge takes a plain-English task, generates Python with an LLM, executes it inside an isolated sandbox (CPU/memory limits, no network), classifies failures, and self-repairs — up to 3 attempts.

> **Not** just “AI writes code.” The engineering focus is **safe execution, structured error recovery, and measured reliability.**

---

## Demo (60 seconds)

1. Open the Studio UI → enter a task  
2. Watch Generate → Execute → (optional) Classify → Repair  
3. See live journal events over WebSocket  
4. Open Metrics for success rate / failure categories  

See [DEMO.md](./DEMO.md) for a scripted walkthrough.

---

## Architecture

```
React Studio UI  ──WebSocket──►  Express Agent Orchestrator
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
              Code Generator    Error Classifier   Sandbox
              (Anthropic/         (structured)     (Docker or
               Gemini/Mock)                         local)
                    │                                   │
                    └────────── PostgreSQL ◄────────────┘
                         (run + attempt history)
```

---

## Features

| Feature | Detail |
|---------|--------|
| Autonomous loop | Generate → Execute → Classify → Repair (max 3) |
| Sandbox | Docker: network off, 512MB RAM, 1 CPU, timeout |
| Error classifier | Syntax / MissingDependency / Timeout / … |
| Live logs | Socket.IO events into the Working Journal |
| Metrics | Success rate, first-attempt %, failure breakdown |
| Benchmark | Fixed 25-task suite with reproducible metrics |

---

## Quick Start (Windows)

```cmd
:: Backend
cd server
copy .env.example .env
notepad .env
npm install
npm run dev

:: Frontend (new terminal)
cd client
npm install
npm run dev
```

Open → http://localhost:5173

Required in `.env`:
```
ANTHROPIC_API_KEY=sk-ant-...
# optional
DATABASE_URL=postgresql://...
USE_DOCKER=true
```

---

## Benchmark

```cmd
cd server
npm run dev

cd ..\benchmark
npm install
set BENCH_DELAY_MS=3000
npm run bench
```

Results → `benchmark/results.json`

**Target resume line (fill in after your run):**

> Built CodeForge, an autonomous coding agent that executes LLM-generated Python in ephemeral Docker sandboxes with resource limits and network isolation; resolved **X%** of tasks within three self-correction attempts across a 25-task benchmark.

---

## Project structure

```
codeforge/
├── client/          # React + Vite Studio UI
├── server/          # Express + agents + sandbox + WebSocket
├── benchmark/       # 25-task evaluation suite
├── docker/          # Backend + sandbox Dockerfiles
├── DEPLOY.md        # Vercel / Render / Fly notes
└── DEMO.md          # 60-second demo script
```

---

## Tech stack

- **Frontend:** React, TypeScript, Vite, Socket.IO client  
- **Backend:** Node.js, Express, TypeScript, Socket.IO  
- **LLM:** Anthropic Claude (Gemini + offline mock fallback)  
- **Sandbox:** Docker via dockerode (local subprocess fallback)  
- **DB:** PostgreSQL (Neon / Supabase / local)  
- **Security:** Helmet, rate limiting, env-based secrets  

---

## License

MIT
