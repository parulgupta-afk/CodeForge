# CodeForge

> Autonomous coding agent with isolated Docker sandboxing, real-time telemetry, and bounded self-repair.

```text
Task Brief ──► LLM Generation ──► Sandboxed Execution ──► Error Classification ──► Self-Repair (Max 3) ──► Verified Result
```

CodeForge is an autonomous code generation and repair system designed for safe, resilient execution of untrusted AI-generated Python code. Instead of treating code generation as a pure text-completion task, CodeForge executes every script inside an isolated, resource-constrained Docker sandbox, classifies failures using deterministic AST and regex pattern matching, and repairs broken code within a bounded 3-attempt loop.

---

## Architecture

```text
┌────────────────────────────────┐            Socket.IO (Live Events)            ┌────────────────────────────────┐
│      React Studio (Vite)       │ ◄───────────────────────────────────────────► │      Express Orchestrator      │
│  • Task Brief & Config         │                                               │  • State Machine & Lifecycle   │
│  • Live Stepper & Journal      │                                               │  • Prompt Construction         │
│  • Attempt Diff & Outputs      │                                               │  • Real-Time Telemetry Stream  │
└────────────────────────────────┘                                               └───────────────┬────────────────┘
                                                                                                 │
                               ┌─────────────────────────────────┬───────────────────────────────┴───────────────────────────────┐
                               ▼                                 ▼                                                               ▼
                 ┌───────────────────────────┐     ┌───────────────────────────┐                                   ┌───────────────────────────┐
                 │       LLM Providers       │     │     Error Classifier      │                                   │     Execution Sandbox     │
                 │ ───────────────────────── │     │ ───────────────────────── │                                   │ ───────────────────────── │
                 │ • Gemini 2.0 Flash (main) │     │ • SyntaxError             │                                   │ • Docker (USE_DOCKER=true)│
                 │ • Groq Llama 3.3 (backup) │     │ • MissingDependency       │                                   │   CapDrop ALL, non-root   │
                 │ • Deterministic Mock Mode │     │ • Timeout / Security      │                                   │   Network: none, 512MB    │
                 │   (100% offline testing)  │     │ • Fast AST & Regex Match  │                                   │ • Local Subprocess (dev)  │
                 └───────────────────────────┘     └───────────────────────────┘                                   └───────────────────────────┘
```

---

## Core Capabilities

- **Isolated Docker Sandbox**: Executes generated Python in disposable containers with dropped Linux capabilities (`CapDrop: ALL`), unprivileged non-root user (`nobody`), resource quotas (512MB RAM, 1 CPU, 64 PIDs), read-only code mounts, and complete network isolation (`NetworkMode: none`).
- **Deterministic Error Classifier**: Categorizes execution failures into `Timeout`, `MissingDependency`, `SyntaxError`, `PermissionDenied`, `NetworkBlocked`, `RuntimeError`, and `UnknownError` without expensive extra LLM round-trips.
- **Bounded Autonomous Repair**: Injects prior code, compiler diagnostics, and classified error context back into the LLM to synthesize targeted fixes. Bounded to a maximum of 3 attempts, with immediate termination on non-retryable security violations.
- **Dual-Provider Fallback & Mock Mode**: Automatic failover from Google Gemini to Groq. Includes an offline deterministic mock generator (`USE_MOCK_LLM=true`) allowing full test suites and development runs without API keys or paid credentials.
- **Real-Time Studio UI**: React + Vite interface communicating over Socket.IO to render live execution step progress, classified error tags, container duration, stdout/stderr streams, and attempt comparisons.
- **Run Persistence**: Optional PostgreSQL database support storing run traces, attempts, classified errors, and duration metrics.

---

## Quick Start (Docker Compose)

The fastest way to spin up the complete CodeForge stack (Nginx frontend, Node backend, and isolated execution environment):

```bash
# 1. Clone repository
git clone https://github.com/parulgupta-afk/CodeForge.git
cd CodeForge

# 2. Build multi-stage images
docker compose build

# 3. Start services in background
docker compose up -d

# 4. View real-time logs
docker compose logs -f
```

- **Web Studio**: `http://localhost:5173`
- **Backend API & WebSocket**: `http://localhost:3001`
- **Health Check**: `http://localhost:3001/api/health`

To tear down services:

```bash
docker compose down
```

---

## Local Development (Without Docker Compose)

### Prerequisites

- Node.js >= 20
- Python 3.10+ (for local sandbox fallback)
- Docker Desktop or Docker daemon (optional, for secure container sandbox)

### 1. Backend Server Setup

```bash
cd server

# Copy environment configuration
copy .env.example .env

# Install dependencies and start development server
npm install
npm run dev
```

The backend server will run at `http://localhost:3001`.

### 2. Frontend Client Setup

```bash
cd client

# Install dependencies and launch Vite dev server
npm install
npm run dev
```

The studio will be live at `http://localhost:5173`.

---

## Environment Variables

All backend configuration is defined in `server/.env` (refer to [`server/.env.example`](file:///c:/Users/parul/CodeForge/server/.env.example)):

| Variable | Required? | Default | Description |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Optional* | None | Primary LLM provider API key (Google Gemini) |
| `GEMINI_MODEL` | No | `gemini-2.0-flash` | Gemini model override |
| `GROQ_API_KEY` | Optional* | None | Fallback LLM provider API key (Groq) |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | Groq model override |
| `USE_MOCK_LLM` | No | `false` | When `true`, enables offline mock generator (zero API keys needed) |
| `USE_DOCKER` | No | `false` | When `true`, executes code inside isolated Docker containers |
| `SANDBOX_IMAGE` | No | `python:3.12-slim` | Docker image tag for sandbox execution |
| `PORT` | No | `3001` | Express HTTP and Socket.IO server port |
| `CORS_ORIGIN` | No | `http://localhost:5173,http://127.0.0.1:5173` | Allowed frontend origins for CORS |
| `DATABASE_URL` | No | None | PostgreSQL connection URI for persistent run storage |

*\*At least one LLM key is recommended for live generation. Alternatively, set `USE_MOCK_LLM=true` for offline development and testing.*

---

## Sandboxed Execution Details

CodeForge provides two swappable execution backends:

### 1. Docker Sandbox (`USE_DOCKER=true`, Recommended)

Requires Docker Desktop or a host Docker daemon:

- **Network Mode:** `none` (blocks socket creation, DNS lookup, and data exfiltration)
- **Hard Resource Limits:** 512 MB memory ceiling, 1.0 CPU limit (`NanoCpus`), 64 process PID limit (mitigates fork bombs)
- **Privilege Stripping:** Drops `ALL` Linux capabilities, enforces `no-new-privileges`
- **User Isolation:** Executes as unprivileged user `nobody` (UID 65534)
- **Filesystem Constraints:** Read-only bind mount for source code; `/tmp` mounted as size-capped `tmpfs` with `noexec`
- **Output Safeguards:** Hard kill (`SIGKILL`) after timeout, stdout/stderr capped at 256 KB, input code capped at 200 KB

### 2. Local Subprocess (`USE_DOCKER=false`, Dev Default)

- Executes Python via child processes in temporary directories with automated cleanup
- Sanitizes child environment (host API keys and sensitive environment variables are stripped)
- Wall-clock timeout enforcement with process termination
- *Note: Local subprocess execution is intended for dev/demo on single-user workstations and is not a security boundary (see [SECURITY.md](file:///c:/Users/parul/CodeForge/SECURITY.md)).*

---

## Benchmark Suite & Measured Results

CodeForge includes an automated 25-task evaluation suite located in [`benchmark/`](file:///c:/Users/parul/CodeForge/benchmark). Tasks span basic math, string manipulation, algorithm design, data processing, intentional failure recovery, and hostile code attempts:

| Benchmark Metric | Measured Result ([`benchmark/results.json`](file:///c:/Users/parul/CodeForge/benchmark/results.json)) |
| --- | --- |
| **Total Evaluation Tasks** | 25 |
| **Overall Pass Rate** | **100%** |
| **Pass@1 (First-Attempt Success)** | **100%** |
| **Pass@3 (Within 3 Attempts)** | **100%** |
| **Average Attempts per Task** | 1.0 |
| **Average Execution Time** | ~4.5s |

### Running the Benchmark

```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Run benchmark suite
cd benchmark
npm install
npm run bench
```

Results are saved to `benchmark/results.json` and formatted in `benchmark/report.md`.

---

## Testing & Quality Gates

CodeForge maintains zero-dependency backend test suites covering classifier accuracy, orchestrator state flow, provider fallbacks, and sandbox safety:

```bash
cd server

# Run complete test suite (classifier, orchestrator, fallback, sandbox safety)
npm test

# Run Docker container isolation tests (requires running Docker daemon)
npm run test:docker

# Typecheck backend source code
npm run typecheck

# Build production TypeScript bundle
npm run build
```

---

## API Reference

### HTTP Endpoints

- `POST /api/runs`: Create and launch a new code generation/execution task:

  ```json
  {
    "task": "Compute the first 20 Fibonacci numbers and print them as a JSON list"
  }
  ```

- `GET /api/runs/:id`: Fetch execution status, attempt history, code diffs, and classified errors.
- `GET /api/metrics`: Retrieve aggregated operator metrics (total runs, success rate, category distribution).
- `GET /api/health`: Health status endpoint.

### WebSocket Events (Socket.IO)

- `run:started`: Broadcast when an execution run is initialized.
- `run:step`: Emitted when the agent transitions phases (`generating`, `executing`, `classifying`, `repairing`).
- `run:attempt`: Dispatched on each sandbox execution attempt with stdout, stderr, and exit code.
- `run:classified`: Dispatched when an error is classified into an actionable category.
- `run:completed`: Dispatched when code passes verification or reaches max attempts.

---

## Security Model

For threat modeling, implemented mitigations, and honest boundary definitions, please consult [`SECURITY.md`](file:///c:/Users/parul/CodeForge/SECURITY.md).

- Rate limiting via `express-rate-limit` on all API endpoints
- Security response headers via `helmet`
- Strictly single-tenant design recommendations for public demonstration instances
- No secret leakage to child processes

---

## License

Private repository. All rights reserved.
