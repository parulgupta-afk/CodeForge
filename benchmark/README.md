# CodeForge Benchmark (Phase 11)

25 fixed tasks across basic, data, algo, intentional-failure, and security categories.

## Run (Windows CMD)

```cmd
:: Terminal 1 – start the server
cd codeforge\server
npm run dev

:: Terminal 2 – run the benchmark
cd codeforge\benchmark
npm install
npm run bench
```

Results are written to `results.json`.

## Metrics produced
- Success rate
- First-attempt success rate
- Within-3-attempts success rate
- Average attempts
- Failure category breakdown
