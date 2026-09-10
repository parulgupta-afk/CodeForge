# CodeForge

**Autonomous coding agent with sandboxed execution**

CodeForge turns a plain-English task into working Python: it generates code with an LLM, runs it in an isolated sandbox, classifies failures, and self-repairs — up to three attempts.

This is not “AI writes code.” The engineering focus is **safe execution of untrusted generated code**, structured recovery, and **measured reliability**.

---

## Demo flow

```
User task
  → Generate Python (Gemini / Groq / mock)
  → Execute in sandbox (Docker or local fallback)
  → On failure: classify error → repair prompt → retry
  → Max 3 attempts → success or exhausted
```

Live WebSocket events stream into the Studio Working Journal while the agent runs.

---

## Why CodeForge?

Running LLM-generated code on a host is unsafe (filesystem, network, resource exhaustion). Most demos skip isolation. CodeForge treats the sandbox, classifier, and bounded repair loop as first-class engineering problems — and evaluates them on a fixed task suite.

---

## Key features

- **Autonomous loop** — generate → execute → classify → repair (max 3)
- **Docker sandbox** — network disabled, 512MB RAM, 1 CPU, PID limit, dropped capabilities, non-root user, read-only code mount
- **Structured error classification** — SyntaxError, MissingDependency, Timeout, PermissionDenied, NetworkBlocked, RuntimeException
- **Live logs** — Socket.IO agent events in the UI
- **Persistence** — optional PostgreSQL run/attempt history
- **Metrics dashboard** — success rate, first-attempt rate, failure categories
- **Benchmark suite** — 25 fixed tasks with reproducible reporting

---

## Architecture

```
User → React Studio UI
         │  HTTP POST /api/runs
         │  WebSocket agent:event
         ▼
       Express Orchestrator
         ├─ Code Generator (LLM)
         ├─ Sandbox (Docker / local)
         ├─ Error Classifier
         └─ Repair Agent
         ▼
       PostgreSQL (optional) + in-memory store
```

---

## Evaluation (actual results)

From `benchmark/results.json` (generated 2026-09-09):

| Metric | Value |
|--------|-------|
| Total tasks | **25** |
| Success rate | **100%** |
| First-attempt success | **100%** |
| Within 3 attempts | **100%** |
| Average attempts | **1.0** |

These numbers come from a real run against the live API, not placeholders. Re-run with:

```cmd
cd server && npm run dev
cd ..\benchmark && set BENCH_DELAY_MS=2000 && npm run bench
```

---

## Security (sandbox)

**Controls in place (Docker mode):**

| Control | Setting |
|---------|---------|
| Network | `--network none` |
| Memory | 512 MB |
| CPU | 1 core |
| PIDs | 64 |
| Capabilities | CapDrop ALL |
| Privileges | no-new-privileges |
| User | nobody (65534) |
| Code mount | read-only |
| /tmp | tmpfs 16MB, noexec |
| Timeout | wall-clock kill |
| Output | truncated at 256KB |
| Secrets | not passed into container env |

**Honest limitations:**

- Isolation depends on the host Docker daemon and Linux namespaces — not a dedicated microVM (gVisor/Firecracker).
- Local executor (`USE_DOCKER=false`) is **not** a security boundary; it only provides timeouts and temp-dir cleanup.
- Do not expose an open CodeForge API to the public internet without auth and stricter rate limits.

---

## Tech stack

| Layer | Choice | Role |
|-------|--------|------|
| Frontend | React + TypeScript + Vite | Studio UI, live journal |
| Backend | Node.js + Express + TypeScript | Orchestrator, API |
| Realtime | Socket.IO | Agent event stream |
| LLM | Google Gemini + Groq (mock fallback) | Code generation & repair |
| Sandbox | Docker (dockerode) / local subprocess | Isolated execution |
| DB | PostgreSQL (optional) | Run history |
| Security | Helmet + express-rate-limit | Headers, abuse limits |

---

## Project structure

```
codeforge/
├── client/           # React Studio UI
├── server/
│   ├── src/agents/   # generator, repair, orchestrator
│   ├── src/sandbox/  # docker + local executors
│   ├── src/classifier/
│   ├── src/database/
│   └── src/websocket/
├── benchmark/        # 25 tasks + runner + results.json
├── docker/
├── DEMO.md
├── DEPLOY.md
└── RESUME.md
```

---

## Setup (Windows CMD)

```cmd
:: Backend
cd server
copy .env.example .env
notepad .env
npm install
npm run dev

:: Frontend
cd client
npm install
npm run dev
```

Open http://localhost:5173

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GEMINI_API_KEY` | Optional* | Primary LLM (Google Gemini) |
| `GEMINI_MODEL` | No | Gemini model (default `gemini-3.5-flash-lite`) |
| `GROQ_API_KEY` | Optional* | Fallback LLM (Groq) |
| `GROQ_MODEL` | No | Groq model (e.g. `llama-3.3-70b-versatile` / `groq/compound-mini`) |
| `USE_MOCK_LLM` | No | `true` for offline mock generator |
| `USE_DOCKER` | No | `true` to use Docker sandbox |
| `SANDBOX_IMAGE` | No | Default `python:3.12-slim` |
| `DATABASE_URL` | No | PostgreSQL connection string |
| `RUN_RATE_LIMIT` | No | Max runs/min (default 100) |

*Either Gemini, Groq, or `USE_MOCK_LLM=true` is used.

### Tests

```cmd
cd server
npm test
```

---

## API / WebSocket

**HTTP**

- `POST /api/runs` `{ "task": "..." }` → full agent result + attempts  
- `GET /api/runs` / `GET /api/runs/:id`  
- `GET /api/metrics`  
- `GET /api/health`

**WebSocket events (`agent:event`)**

`run:started` → `attempt:started` → `code:generated` → `execution:started` → `execution:output` | `execution:error` → `error:classified` → `repair:started` → `attempt:completed` → `run:completed` | `run:failed`

---

## Future improvements (realistic)

- Auth on the public API
- E2B (or similar) as an alternate managed sandbox
- Stronger stdout/stderr demux and disk quotas
- Critic pass before accepting a repair
- CI that runs classifier unit tests + mock-LLM smoke bench

---

## License

MIT
