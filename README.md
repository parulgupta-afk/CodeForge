# CodeForge

Autonomous coding agent with sandboxed execution, structured error classification, and bounded self-repair.

```text
Task Brief ──► LLM Code Gen ──► Sandboxed Execution ──► Error Classification ──► Self-Repair (Max 3) ──► Verified Result
```

> "CodeForge doesn't just generate code — it runs it in an isolated Docker sandbox, classifies runtime errors, and self-repairs within three bounded attempts."

---

## Architecture

```text
┌─────────────────────────┐          Socket.IO (Live Telemetry)          ┌─────────────────────────┐
│   React Studio (Vite)   │ ◄──────────────────────────────────────────► │  Express Orchestrator   │
└─────────────────────────┘                                              └───────────┬─────────────┘
                                                                                     │
                       ┌───────────────────────────────┬─────────────────────────────┴─────────────────────────────┐
                       ▼                               ▼                                                           ▼
         ┌───────────────────────────┐   ┌───────────────────────────┐                               ┌───────────────────────────┐
         │       LLM Providers       │   │     Error Classifier      │                               │     Execution Sandbox     │
         │ ───────────────────────── │   │ ───────────────────────── │                               │ ───────────────────────── │
         │ • Gemini 2.0 Flash (main) │   │ • Syntax / Runtime        │                               │ • Docker (USE_DOCKER=true)│
         │ • Groq Llama 3.3 (backup) │   │ • MissingDependency       │                               │   Network: none, non-root │
         │ • Deterministic Mock Mode │   │ • Timeout / Security      │                               │ • Local Subprocess (dev)  │
         └───────────────────────────┘   └───────────────────────────┘                               └───────────────────────────┘
```

CodeForge is built around safe execution of untrusted generated code, resilience to model failures, and transparent operator visibility.

---

## Key Features

- **Isolated Docker Sandbox**: Ephemeral container per execution run with dropped Linux capabilities (`CapDrop: ALL`), non-root execution (`nobody`), resource quotas (512MB RAM, 1 CPU, 64 PIDs), read-only code mounts, and complete network isolation (`NetworkMode: none`).
- **Structured Error Classification**: Fast regex and AST-based classification categorizing errors into `Timeout`, `MissingDependency`, `SyntaxError`, `PermissionDenied`, `NetworkBlocked`, `RuntimeError`, and `UnknownError`.
- **Bounded Autonomous Repair**: Self-corrects generated code based on classified error feedback, bounded to at most 3 attempts with early exit on non-retryable security errors.
- **Provider Fallback & Mock Mode**: Automatic failover from Gemini to Groq. Supports `USE_MOCK_LLM=true` for 100% offline development and automated CI without paid credentials or API keys.
- **Real-Time Telemetry**: Real-time Socket.IO event streaming delivering execution steps, classified logs, duration, and diffs to the web studio.
- **Optional Run Persistence**: Stores run traces, attempts, and execution metrics in PostgreSQL when configured, or runs purely in-memory.

---

## Quick Start (Docker)

To run the complete CodeForge stack (Nginx frontend + Node backend):

```bash
# Build container images
docker compose build

# Start services
docker compose up -d

# View real-time logs
docker compose logs -f

# Stop services
docker compose down
```

- **Web Studio**: `http://localhost:5173`
- **Backend API & WebSocket**: `http://localhost:3001`

---

## Local Development (Without Docker Compose)

### 1. Backend Server

```bash
cd server

# Copy environment configuration
cp .env.example .env

# Install dependencies and start development server
npm install
npm run dev
```

The server will start on `http://localhost:3001`.

### 2. Frontend Client

```bash
cd client

# Install dependencies and launch Vite dev server
npm install
npm run dev
```

The studio will be live at `http://localhost:5173`.

---

## Environment Variables

All backend settings are configured in `server/.env` (refer to [`server/.env.example`](file:///c:/Users/parul/CodeForge/server/.env.example)):

| Variable | Required? | Default | Description |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Optional* | None | Primary LLM provider (Google Gemini) |
| `GEMINI_MODEL` | No | `gemini-2.0-flash` | Gemini model identifier |
| `GROQ_API_KEY` | Optional* | None | Automatic fallback LLM provider |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Groq model identifier |
| `USE_MOCK_LLM` | No | `false` | When `true`, uses offline mock generation (no API keys required) |
| `USE_DOCKER` | No | `false` | When `true`, executes code inside isolated Docker containers |
| `SANDBOX_IMAGE` | No | `python:3.12-slim` | Docker image tag used for Python sandbox containers |
| `PORT` | No | `3001` | Backend HTTP & WebSocket port |
| `DATABASE_URL` | No | None | PostgreSQL connection string for persistent run history |

*\*At least one LLM key is needed for live generation. Alternatively, set `USE_MOCK_LLM=true` for testing without API keys.*

---

## Execution Sandboxing

CodeForge supports two execution backends:

### 1. Docker Sandbox (`USE_DOCKER=true`, Recommended)

Requires Docker Desktop or a running Docker daemon on the host:

- **Network Isolation:** `NetworkMode: none` (prevents data exfiltration and external calls)
- **Hard Resource Quotas:** Memory capped at 512 MB, CPU capped at 1.0 core, process count capped at 64 PIDs
- **Privilege Stripping:** `CapDrop: ALL`, `no-new-privileges: true`
- **Unprivileged User:** Executes as `nobody` (UID 65534)
- **Filesystem Constraints:** Read-only code mount; temporary files restricted to a size-capped `tmpfs` at `/tmp`
- **Execution Safeguards:** Enforced wall-clock timeout (`SIGKILL`), 256 KB max stdout/stderr cap, and 200 KB max code input payload

### 2. Local Subprocess (`USE_DOCKER=false`, Dev Default)

- Executes Python via child processes in temporary working directories
- Sanitizes child environment (host API keys and secrets are **not** inherited)
- Enforces wall-clock timeouts and output truncation
- *Note: Local subprocess is not a security boundary; use Docker for multi-tenant or untrusted inputs (see [SECURITY.md](file:///c:/Users/parul/CodeForge/SECURITY.md)).*

---

## Automated Tests

Run the backend verification suite:

```bash
cd server

# Run core unit tests (error classifier, orchestrator, provider fallback, local sandbox safety)
npm test

# Run Docker container isolation tests (requires running Docker daemon)
npm run test:docker

# Typecheck backend code
npm run typecheck

# Compile production bundle
npm run build
```

---

## Benchmark & Evaluation

CodeForge includes a 25-task benchmark suite ([`benchmark/`](file:///c:/Users/parul/CodeForge/benchmark)) evaluating reliability across basic math, algorithms, data processing, intentional failure recovery, and security boundary attacks:

| Metric | Result ([`benchmark/results.json`](file:///c:/Users/parul/CodeForge/benchmark/results.json)) |
| --- | --- |
| **Total Evaluation Tasks** | 25 |
| **Overall Pass Rate** | **100%** |
| **Pass@1 (First-Attempt Success)** | **100%** |
| **Pass@3 (Within 3 Attempts)** | **100%** |
| **Average Attempts** | 1.0 |

To run the benchmark suite against your local server:

```bash
# Terminal 1: Start backend
cd server && npm run dev

# Terminal 2: Run benchmark runner
cd benchmark
npm install
npm run bench
```

---

## Security Model

For full threat modeling and mitigation details, see [`SECURITY.md`](file:///c:/Users/parul/CodeForge/SECURITY.md):

- API rate limiting (`express-rate-limit`) on `/api` and `/api/runs`
- Security response headers via `helmet`
- JSON payload body limit capped at 1 MB
- Strict environment sanitization ensuring LLM API keys are never leaked to child runtimes

---

## License

Private project. All rights reserved.
