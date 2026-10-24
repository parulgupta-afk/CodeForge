# CodeForge Evolution – Phases 0–3 Implementation Summary

Implemented against `parulgupta-afk/CodeForge` (main, Sep 2026 baseline).

## Phase 0 – Make it truthful

| Change | File(s) |
|--------|---------|
| Write-through `runsStore` → `saveRun` / `saveAttempt` | `server/src/store/runsStore.ts` |
| Call `ensureSchema` + experience schema at boot | `server/src/server.ts` |
| `SANDBOX_MODE=strict` refuses host fallback | `server/src/sandbox/index.ts` |
| `ALLOW_MOCK_FALLBACK` gates mock; else `provider_unavailable` | `server/src/agents/codeGenerator.ts` |
| `RunBudget` (attempts, wall time, exec timeout) | `server/src/config/budget.ts` |
| LlmClient live/record/replay + cassettes dir | `server/src/llm/LlmClient.ts`, `benchmark/cassettes/` |
| Agent failure returns HTTP 200 with `status:failed` (not 500) | `server/src/controllers/runsController.ts` |
| GET run can fall back to DB | `runsController` + `runsStore.getAsync` |

## Phase 1 – Evaluator

| Change | File(s) |
|--------|---------|
| Structured verdict: verified / partial / failed | `server/src/evaluation/evaluator.ts` |
| Checks: exit, expected output, visible/hidden tests, fail-before/pass-after | same |
| Orchestrator success = evaluator verified | `server/src/agents/orchestrator.ts` |
| Optional `expectedOutput` on agent deps for benchmarks | same |

## Phase 2 – Experience memory

| Change | File(s) |
|--------|---------|
| `experiences` + `experience_uses` tables | `server/src/memory/experienceStore.ts` |
| Lifecycle: candidate → verified (evaluator only) → invalidated | same |
| `MEMORY_MODE=off\|raw\|verified\|random` (conditions A–D) | same |
| Retrieve before generate; inject as labelled evidence | `orchestrator.ts` |
| Promote on verified success | same |

## Phase 3 – Evaluation Lab scaffolding

| Change | File(s) |
|--------|---------|
| Wilson intervals + paired bootstrap | `server/src/evaluation/stats.ts` |
| Hypotheses + protocol locked before runs | `docs/EVALUATION.md` |
| Health endpoint reports evolution features | `server.ts` |

## New env vars

```
SANDBOX_MODE=strict|dev          # default dev
ALLOW_MOCK_FALLBACK=true|false   # default false outside test/USE_MOCK_LLM
LLM_MODE=live|record|replay      # default live
MEMORY_MODE=off|raw|verified|random  # default off
MAX_ATTEMPTS / WALL_TIME_MS / EXECUTION_TIMEOUT_MS
DATABASE_URL                     # enables persistence + memory
```

## Not in this package (Phases 4–6)

Repository tools, Arena UI, auth, OpenTelemetry, full 30+ case YAML suite, Playwright.  
Those stay on the original plan timeline after this foundation is merged and the honest baseline is re-run.

## How to verify quickly

```bash
cd server && npm install && npm test
# With Postgres:
# DATABASE_URL=... npm run dev
# Restart server → prior runs still listed via GET /api/runs
```
