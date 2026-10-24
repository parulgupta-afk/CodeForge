# Phase 4 – Repository agent

Built on main `@ e623281` (Phases 0–3).

## What landed

| Piece | Path |
|-------|------|
| Workspace manager (path-safe, git snapshot, disposable) | `server/src/workspace/manager.ts` |
| Tool registry | `server/src/tools/registry.ts` |
| Repo tools: list/read/search/patch/write/diff/run_tests | `server/src/tools/repositoryTools.ts` |
| State machine + tool-use loop | `server/src/agents/repoAgent.ts` |
| API | `POST /api/repo/runs` |
| Sample fixture (buggy `divide`) | `fixtures/sample-python-bug/` |
| Case descriptor | `benchmark/cases/repo-01/case.yaml` |
| Path-escape tests | `server/src/__tests__/workspace.test.ts` |

## States

`queued → planning → inspecting → executing → verifying → analyzing → repairing → completed | failed | cancelled | awaiting_approval`

## Tools

- `list_files` (read)
- `read_file` (read)
- `search_code` (read)
- `apply_patch` (write, unified diff)
- `write_file` (write)
- `read_git_diff` (read)
- `run_tests` (execute via sandbox)

Path escape and absolute paths fail closed (`PathEscapeError`). Symlinks that leave the workspace are rejected.

## API example

```bash
curl -s -X POST http://localhost:3001/api/repo/runs \
  -H 'Content-Type: application/json' \
  -d '{"task":"Fix the off-by-one bug in calc.divide so tests pass."}'
```

Default seed: `fixtures/sample-python-bug`.

## Limits / follow-ups

- Headless mode auto-rejects `needsApproval` (real approval channel in Phase 6).
- Tool loop depends on the LLM returning JSON actions; mock LLM may not drive a full end-to-end fix without record/replay cassettes.
- Node/JS repository cases and pre-baked sandbox images remain as planned stretch items.
- More repository cases (15 target) can be added under `benchmark/cases/repo-*`.

## Gate checklist

- [x] Path-escape and absolute-path tests fail closed
- [x] Sample fixture + case.yaml present
- [x] Tools registered at boot; `POST /api/repo/runs` wired
- [ ] Live end-to-end solve with a real model (run locally with keys)
EOF
