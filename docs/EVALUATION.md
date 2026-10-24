# CodeForge Evaluation Protocol

**Status:** Phases 0–3 scaffolding in place. Hypotheses written *before* held-out runs.

## Hypotheses (locked)

- **H1:** Retrieving verified experiences (condition C) raises the hidden-test pass rate or lowers repair attempts versus baseline (A).
- **H2:** The gain comes from relevance, not prompt length: C beats the random-experience control (D).
- **H3:** Any gain survives cost: cost per solved task does not rise enough to erase it.

## Conditions

| Condition | Retrieval | Verification gate | Feedback | Purpose |
|-----------|-----------|-------------------|----------|---------|
| A: Baseline | None | n/a | n/a | Reference |
| B: Raw memory | Past runs, unfiltered | None | Off | Does naive memory help or hurt |
| C: Adaptive | Verified experiences only | Evaluator-gated | On | Proposed system |
| D: Control | Random verified experiences | Evaluator-gated | On | Isolates relevance from extra prompt text |

Set via `MEMORY_MODE=off|raw|verified|random`.

## Metrics

| Metric | Role |
|--------|------|
| Hidden-test pass rate within budget | Primary |
| First-attempt pass rate | Secondary |
| Mean repair attempts (solved only) | Secondary |
| Tokens / estimated cost per solved task | Cost |

Report rates with **95% Wilson intervals**. Compare conditions with **paired bootstrap** on per-task differences.

## Procedure (when running the full experiment)

1. Split cases ~60/40 train / held-out, stratified by category. Held-out never writes to memory.
2. Freeze model, temperature, prompt version, budget.
3. Seed memory from training split once; snapshot DB.
4. Run every condition × every held-out case × ≥5 trials from a fresh snapshot.
5. Commit raw results JSON with git SHA, model ids, prompt version.

## Current baseline (pre-Evolution)

Committed `benchmark/results.json` (exit-code success criterion): 25/25, 100%.  
**This is not evidence under the new evaluator.** Re-run with expected-output checks and record as `benchmark/results/results-v0-exit-code.json`.

## Threats to validity

- Small n on held-out set
- Model nondeterminism (trials measure it)
- Possible training-data contamination on classic tasks
- Prompt overfitting if tuned on held-out cases

## Commands

```bash
# Strict sandbox, no mock success
export SANDBOX_MODE=strict
export ALLOW_MOCK_FALLBACK=false

# Condition C
export MEMORY_MODE=verified
export DATABASE_URL=postgres://...

# Replay CI without keys
export LLM_MODE=replay
```

## Results

Place committed experiment outputs under `benchmark/results/` and link every README number to a file + git SHA. A negative result is still a valid demonstration of measurement discipline.
