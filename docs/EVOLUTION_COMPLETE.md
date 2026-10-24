# CodeForge Evolution – Phases 0–6 complete

## Summary

| Phase | Status | Headline |
|-------|--------|----------|
| 0 | Done | Persistence write-through, fail-closed sandbox/mock, budgets, LlmClient modes |
| 1 | Done | Evaluator (verified / partial / failed), expected + hidden checks |
| 2 | Done | Experience memory, MEMORY_MODE A–D |
| 3 | Done | Stats helpers, EVALUATION.md hypotheses |
| 4 | Done | Workspace, tool registry, repo agent, POST /api/repo/runs |
| 5 | Done | 5 missions (incl. boss), Arena UI, scoring |
| 6 | Done | Tokens, quotas, audit, evidence HTML, security tests, ADRs, results page |

## API surface

- `POST /api/runs` — classic agent (token + quota when configured)
- `GET /api/runs/:id/evidence` — HTML evidence bundle
- `POST /api/repo/runs` — repository agent
- `GET/POST /api/missions…` — Arena
- `GET /api/audit` — dev audit log
- `GET /api/health` — `phase: evolution-0-6`

## Still optional / scale

- Live OTEL/Jaeger, CodeQL/Trivy in CI
- Monaco + Playwright
- Full 15 repo cases + held-out experiment numbers
- Public Docker VM (replay-only is valid)

## Claim discipline

No success-rate marketing without committed results + Wilson intervals.
EOF
