# Phase 6 – Harden, document, launch

## What landed

| Item | Location |
|------|----------|
| API token gate (`API_TOKENS`) | `server/src/auth/tokens.ts` |
| Optional daily run quota (`ENFORCE_QUOTAS`) | same |
| Audit ring + optional `audit_events` table | `server/src/audit/auditLog.ts` |
| Structured JSON logs + secret redaction | `server/src/observability/logger.ts` |
| Evidence bundle HTML exporter | `server/src/evaluation/evidenceBundle.ts` |
| `GET /api/runs/:id/evidence` | routes/controller |
| `GET /api/audit` (dev) | routes |
| Boss mission | `missions/production-outage.yaml` |
| Second repo fixture | `fixtures/sample-python-bug-2/`, `benchmark/cases/repo-02/` |
| Security abuse unit tests | `server/src/__tests__/securityAbuse.test.ts` |
| Static public results page | `docs/results/index.html` |
| ADRs | `docs/adr/` |

## Env (append to server/.env)

```
# Phase 6
# API_TOKENS=demo-token-one,demo-token-two   # if set, Bearer required
# ENFORCE_QUOTAS=true
# QUOTA_RUNS_PER_DAY=50
```

## Intentionally deferred (ops scale)

- Full OpenTelemetry/Jaeger containers
- CodeQL/Trivy workflows (add when CI minutes allow)
- GitHub OAuth accounts
- Live public Docker VM (replay-only remains valid)

## README

Existing README body preserved. A short **Evolution** appendix may be appended at the end only.
