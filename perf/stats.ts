import type { BenchmarkStats } from './types'

export function computeStats(samples: number[]): BenchmarkStats {
  if (samples.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, p95: 0 }
  }
  const sorted = [...samples].sort((a, b) => a - b)
  const n = sorted.length
  const mid = Math.floor(n / 2)
  const median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  const p95 = sorted[Math.min(n - 1, Math.ceil(0.95 * n) - 1)]
  const mean = sorted.reduce((sum, v) => sum + v, 0) / n
  return {
    min: round(sorted[0]),
    max: round(sorted[n - 1]),
    mean: round(mean),
    median: round(median),
    p95: round(p95)
  }
}

function round(ms: number): number {
  return Math.round(ms * 100) / 100
}
