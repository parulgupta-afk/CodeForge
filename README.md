# CodeForge

Autonomous coding agent with sandboxed execution.

```
Task → LLM generates Python → execute in sandbox → classify errors → repair (max 3) → result
```

Focus: bounded autonomous repair, isolation of untrusted code, measurable reliability.

## Architecture

```
React Studio (Vite) ──Socket.IO──► Express orchestrator
                                      │
                         ┌────────────┼────────────┐
                         ▼            ▼            ▼
                    Gemini/Groq/Mock  Classifier   Sandbox
                                                   ├─ Docker (USE_DOCKER=true)
                                                   └─ Local subprocess (default)
```

Python-only MVP. Optional PostgreSQL when `DATABASE_URL` is set.

## Local setup (Windows)

```cmd
cd server
copy .env.example .env
notepad .env
npm install
npm run dev

cd ..\client
npm install
npm run dev
```

Open http://localhost:5173

**Canonical env file:** `server/.env` (copy from `server/.env.example`).
Root `.env.example` is documentation only — the backend does not load a root `.env`.

## Environment variables

| Variable | Required? | Purpose |
|----------|-----------|---------|
| `GEMINI_API_KEY` | One of Gemini / Groq / mock | Primary LLM |
| `GEMINI_MODEL` | No | Default `gemini-2.0-flash` |
| `GROQ_API_KEY` | Optional | Fallback LLM |
| `GROQ_MODEL` | No | Default `llama-3.3-70b-versatile` |
| `USE_MOCK_LLM` | No | `true` for CI / offline / no keys |
| `PORT` | No | Default `3001` |
| `USE_DOCKER` | No | `true` = Docker sandbox; `false` = local Python |
| `SANDBOX_IMAGE` | No | Default `python:3.12-slim` |
| `DATABASE_URL` | No | Enables Postgres persistence |

**Mock mode:** set `USE_MOCK_LLM=true` when you have no API keys, for CI, or deterministic runs.

## Execution modes

### Development — local subprocess (`USE_DOCKER=false`, default)

- Runs `python` / `python3` in a temp directory
- Timeout, output size limits, minimal child env (API keys not inherited)
- **Not a security boundary** — solo machine demos only

### Secure execution — Docker (`USE_DOCKER=true`)

Requires Docker Desktop/daemon on the same host as the Node process.

Ephemeral container per run:

- Network disabled
- Memory / CPU / PID limits
- Capabilities dropped, non-root user, no-new-privileges
- Read-only code mount, capped tmpfs
- Wall-clock timeout and forced cleanup

If Docker fails at runtime, the server logs a warning and **falls back to local subprocess**.

### docker-compose.yml

Starts the **API service only**. `USE_DOCKER=false` is intentional (no Docker-in-Docker).
Compose does **not** by itself provide the secure sandbox. Use host process + `USE_DOCKER=true`.

## Tests & CI

```cmd
cd server
npm test
npm run typecheck
npm run build
```

GitHub Actions: install → typecheck → tests (`USE_MOCK_LLM=true`) → build server + client. No real API keys.

Local executor tests cover timeout, oversized code, and structured failures. Docker isolation tests need a Docker daemon and are optional outside CI.

## Benchmark

Committed `benchmark/results.json` (2026-09-09):

| Metric | Value |
|--------|--------|
| Tasks | 25 |
| Success rate | 100% |
| First-attempt success | 100% |
| Average attempts | 1.0 |

Re-run against your own server; treat numbers as one measured run.

## Security

See [SECURITY.md](./SECURITY.md).

- Prefer `USE_DOCKER=true` for any multi-user or exposed host
- Local subprocess is **not** isolation
- Docker is stronger than local, not a microVM

## Production notes

- Choose real keys or mock mode deliberately
- Tighten CORS to your frontend origin
- Never commit `.env`
- Prefer Docker sandbox with a real host daemon
- Add authentication before public exposure (not in this MVP)

## Stack

TypeScript · Express · React · Vite · Socket.IO · Docker · Gemini / Groq · optional PostgreSQL
