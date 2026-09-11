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
| `CORS_ORIGIN` | No | Allowed frontend origin(s) for Express & Socket.IO CORS (default: `http://localhost:5173,http://127.0.0.1:5173`) |
| `USE_DOCKER` | No | `true` = Docker sandbox; `false` = local Python |
| `SANDBOX_IMAGE` | No | Default `python:3.12-slim` |
| `DATABASE_URL` | No | Enables Postgres persistence |

**Mock mode:** set `USE_MOCK_LLM=true` when you have no API keys, for CI, or deterministic runs.

## Execution modes

### Development — local subprocess (`USE_DOCKER=false`, default)

- Runs `python` / `python3` in a temp directory
- Enforces timeout, code size, output limits, and minimal child env (API keys not inherited)
- **Important:** Local subprocess execution is **not** a security boundary — intended for local dev and solo demos only

### Secure execution — Docker (`USE_DOCKER=true`)

Requires Docker Desktop or a Docker daemon on the same host as the Node process.
Docker provides the intended isolation layer:

- **Network disabled:** `NetworkMode: none`
- **Resource limits:** Memory (512MB), CPU (1 core), PID limit (64)
- **Non-root user:** Runs as `nobody` (UID 65534)
- **Capability restrictions:** Drops `ALL` Linux capabilities, `no-new-privileges`
- **Filesystem isolation:** Read-only code mount, size-capped tmpfs for `/tmp`
- **Timeout:** Wall-clock timeout with automatic SIGKILL and container cleanup

*Note: While Docker provides strong container isolation, it is not claimed to be an absolute security guarantee (see [SECURITY.md](./SECURITY.md)).*

If Docker fails at runtime, the server logs a warning and **falls back to local subprocess**.

### docker-compose.yml

Starts the **API service only**. `USE_DOCKER=false` is intentional (no Docker-in-Docker).
Compose does **not** by itself provide the secure sandbox. Use host process + `USE_DOCKER=true`.

## Tests & CI

```cmd
cd server
npm test              # runs classifier, orchestrator, provider fallback & local sandbox safety tests
npm run typecheck     # typechecks all files including tests
npm run build         # compiles production dist (excludes test files)
npm run test:docker   # runs Docker container security tests (requires running Docker daemon)
```

GitHub Actions: install → typecheck → tests (`USE_MOCK_LLM=true`) → build server + client. No real API keys.

Local executor tests cover timeout, oversized code, and structured failures. Docker integration tests require a local Docker daemon and are separated cleanly so standard CI does not depend on them.

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
