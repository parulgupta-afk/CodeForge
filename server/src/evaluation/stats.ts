/**
 * Statistical helpers for Evaluation Lab – Wilson intervals & paired bootstrap.
 * Phase 3 of CodeForge Evolution.
 */

/** Wilson score interval for a binomial proportion (95% by default). */
export function wilsonInterval(
  successes: number,
  total: number,
  z = 1.96
): { low: number; high: number; rate: number } {
  if (total <= 0) return { low: 0, high: 0, rate: 0 };
  const p = successes / total;
  const denom = 1 + (z * z) / total;
  const centre = p + (z * z) / (2 * total);
  const margin =
    z * Math.sqrt((p * (1 - p) + (z * z) / (4 * total)) / total);
  return {
    rate: p,
    low: Math.max(0, (centre - margin) / denom),
    high: Math.min(1, (centre + margin) / denom),
  };
}

/**
 * Paired bootstrap on per-task differences (condition A vs C, etc.).
 * Returns 95% CI for mean difference and whether it excludes 0.
 */
export function pairedBootstrap(
  diffs: number[],
  iterations = 2000,
  seed = 42
): { mean: number; low: number; high: number; excludesZero: boolean } {
  if (diffs.length === 0) {
    return { mean: 0, low: 0, high: 0, excludesZero: false };
  }

  // Simple LCG for reproducibility
  let s = seed;
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };

  const n = diffs.length;
  const means: number[] = [];
  for (let i = 0; i < iterations; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) {
      const idx = Math.floor(rand() * n);
      sum += diffs[idx];
    }
    means.push(sum / n);
  }
  means.sort((a, b) => a - b);
  const mean = diffs.reduce((a, b) => a + b, 0) / n;
  const low = means[Math.floor(0.025 * iterations)];
  const high = means[Math.floor(0.975 * iterations)];
  return {
    mean,
    low,
    high,
    excludesZero: low > 0 || high < 0,
  };
}

export function formatRate(successes: number, total: number): string {
  const w = wilsonInterval(successes, total);
  return `${(w.rate * 100).toFixed(1)}% [${(w.low * 100).toFixed(1)}%, ${(w.high * 100).toFixed(1)}%] (n=${total})`;
}
