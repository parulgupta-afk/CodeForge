# Phase 5 – Engineering Arena

Built on Phases 0–4. **README.md was not modified**; this file documents the Arena.

## What landed

| Piece | Path |
|-------|------|
| 4 missions (YAML) | `missions/*.yaml` |
| Mission loader (no YAML npm dep) | `server/src/missions/loader.ts` |
| Visible/hidden test runner | `server/src/missions/runner.ts` |
| Transparent scoring + XP + next-mission hint | `server/src/missions/scoring.ts` |
| API | `GET/POST /api/missions…` |
| Arena UI | `client/src/pages/ArenaPage.tsx` |
| Studio ↔ Arena switch | `client/src/App.tsx` (Arena button only) |

## Missions

1. **The Broken Login** – inverted password check  
2. **The Vanishing Transaction** – missing ledger credit  
3. **The Silent Frontend** – query-string drops last pair  
4. **The Regression Trap** – mean uses `len-1`

## Modes

- **Solo** – you edit starter files, submit, evaluator runs visible + hidden tests  
- **AI Partner** – same submission path (agent assist can be extended)  
- **Agent Arena** – server may invoke repo agent before scoring; you still submit root-cause guess

## Scoring (no model judge)

| Check | Points |
|-------|--------|
| Root-cause file + line overlap vs known defect | up to 40 |
| Visible tests | 25 |
| Hidden tests | 25 |
| Verified regression (optional) | 10 |

XP = total points. Progress keyed by `X-Profile-Id` (anonymous localStorage id).

## API

```bash
GET  /api/missions
GET  /api/missions/:id
POST /api/missions/:id/submit
     body: { mode, files, rootCause: { file, lines } }
     header: X-Profile-Id
GET  /api/missions/progress
```

## Not in this slice

- Monaco editor (textarea used to avoid new client deps)  
- Boss mission / human leaderboard  
- Playwright e2e  
- README rewrite (explicitly deferred)

## Gate

- [x] Four missions loadable and submittable  
- [x] Hidden tests only full verifier for clear  
- [x] Root-cause scoring against known defect lines  
- [x] Arena reachable from Studio without replacing existing UI
