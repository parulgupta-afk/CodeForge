# CodeForge Audit & Hardening Report

## 1. What was wrong (from live repo inspection)

### Architecture (understood, preserved)
- React Studio UI → Express orchestrator → LLM → sandbox → classifier → repair (max 3)
- Socket.IO live events; optional PostgreSQL; Docker or local executor
- Benchmark: 25 tasks; **results.json shows 100% / 25/25 first-attempt**

### Major weaknesses found
1. **Docker sandbox incomplete** — CapDrop, non-root user, PidsLimit, no-new-privileges commented or missing; stderr demux weak; no output size cap
2. **Local executor leaked env** — `...process.env` passed API keys into the Python child
3. **Repair loop retried non-retryable errors** — PermissionDenied / NetworkBlocked still burned attempts
4. **No automated tests** — classifier untested despite being a core differentiator
5. **README** — did not surface the actual 100% benchmark from `results.json`; security limitations under-documented
6. **Stdout unbounded** — large prints could stress the Node process

### What was already solid
- MAX_ATTEMPTS = 3 enforced
- Rate limiting + Helmet present
- Classifier categories match PRD
- Benchmark suite + real results.json on GitHub
- WebSocket event model clear

---

## 2. Files changed

| File | Change |
|------|--------|
| `server/src/sandbox/dockerExecutor.ts` | CapDrop ALL, User nobody, PidsLimit 64, no-new-privileges, tmpfs /tmp, code size limit, output truncate, better stream type demux |
| `server/src/sandbox/localExecutor.ts` | Minimal env (no secret leak), output truncate, code size limit |
| `server/src/agents/orchestrator.ts` | Early exit on non-retryable classified errors |
| `server/src/__tests__/errorClassifier.test.ts` | **New** unit tests for classifier |
| `server/package.json` | `npm test` script |
| `README.md` | Architecture, **actual 100% results**, honest security section, setup |

---

## 3. Security improvements
- Docker: dropped all capabilities, non-root, PID limit, no-new-privileges
- Local: secrets no longer inherited by child Python
- Output/code size limits reduce DoS surface
- Documented that local mode is **not** a security boundary

## 4. Testing improvements
- Zero-dep classifier tests covering Timeout, MissingDependency, Syntax, Permission, Network, Runtime, Unknown

## 5. Benchmark
- **Not fabricated.** Used committed `benchmark/results.json`: 25/25, 100% first-attempt
- README now states those numbers and how to re-run

## 6. Remaining weaknesses (honest)
- No auth on API (fine for local/portfolio; needed before public deploy)
- Docker isolation ≠ microVM
- No CI pipeline yet
- Persistence still best-effort if DATABASE_URL missing
- Frontend WebSocket reconnect could be stronger
- Full integration tests for orchestrator not added (would need mock LLM + mock sandbox)

## 7. Commands to run locally

```cmd
cd server
npm install
npm test
npm run dev

cd ..\client
npm install
npm run dev

cd ..\benchmark
set BENCH_DELAY_MS=2000
npm run bench
```

## 8. Recommended commit message

```
harden: Docker sandbox controls, secret-safe local exec, non-retryable early exit, classifier tests, README with real 100% bench
```
