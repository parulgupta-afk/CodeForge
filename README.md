# CodeForge

Autonomous coding agent with sandboxed execution.

Natural-language task → LLM generates Python → isolated execution → structured error classification → bounded self-repair (max 3 attempts).

**Engineering focus:** safe execution of untrusted generated code, failure recovery, and measured reliability — not “chat that writes code.”

## Quick start (Windows)

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

## LLM providers

```
Gemini → Groq → Mock
```

Set in `server/.env`:

```env
GEMINI_API_KEY=
GROQ_API_KEY=
USE_MOCK_LLM=false
```

Offline: `USE_MOCK_LLM=true`

## Architecture

```
User → React Studio (Socket.IO live logs)
         → Express orchestrator
              → LLM (Gemini/Groq/Mock)
              → Sandbox (Docker or local)
              → Error classifier
              → Repair (max 3)
```

## Evaluation (committed results)

From `benchmark/results.json` (2026-09-09):

| Metric | Value |
|--------|-------|
| Tasks | 25 |
| Success rate | **100%** |
| First-attempt success | **100%** |
| Average attempts | **1.0** |

Re-run:

```cmd
cd server && npm run dev
cd ..\benchmark && set BENCH_DELAY_MS=2000 && npm run bench
```

## Security

See [SECURITY.md](./SECURITY.md).

- Docker: network none, memory/CPU/PID limits, CapDrop ALL, non-root, timeouts, output caps
- **Local subprocess is not a security boundary**

## Testing & CI

```cmd
cd server
npm test
npm run typecheck
npm run build
```

GitHub Actions runs typecheck, mocked tests (no API keys), and builds on push/PR to `main`.

## Stack

React · TypeScript · Vite · Express · Socket.IO · Docker · PostgreSQL (optional) · Gemini/Groq
