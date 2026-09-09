# CodeForge – 60 Second Demo Script

Use this when recording a GIF or live demo for recruiters.

## Setup before recording
- Server running (`npm run dev` in `server`)
- Client open at http://localhost:5173
- Prefer a task that fails once then succeeds (shows repair)

## Suggested task
```
Calculate the average of numbers from 1 to 100 and print only the result
```

Or to force a repair path (if your model sometimes invents a bad import):
```
Use pandas to compute the mean of [1,2,3,4,5] and print it
```

## Timeline

| Time | What to show |
|------|----------------|
| 0:00 | Studio UI – Task Brief card |
| 0:05 | Type task → click **Forge Run** |
| 0:08 | Stepper moves to Generate; Journal: “code generated” |
| 0:12 | Execution starts (sandbox) |
| 0:15 | If fail: Journal shows classified error (e.g. MissingDependency) |
| 0:20 | Repair attempt starts |
| 0:28 | Second execution succeeds |
| 0:32 | Final output + Attempt cards |
| 0:40 | Scroll Metrics card (success rate / categories) |
| 0:50 | Optional: show `benchmark/results.json` summary |
| 0:60 | End on architecture one-liner |

## One sentence to say on camera
“CodeForge doesn’t just generate code — it runs it in an isolated Docker sandbox, classifies the failure, and self-repairs within three attempts.”

## Resume bullets (pick 1–2)

- Built an autonomous coding agent that generates, executes, and self-repairs Python inside resource-limited Docker sandboxes with network isolation and structured error classification.
- Evaluated reliability on a fixed 25-task benchmark; report first-attempt and three-attempt success rates plus failure-category distribution.
- Implemented live WebSocket agent logs, PostgreSQL run history, and a metrics dashboard for operator visibility.
