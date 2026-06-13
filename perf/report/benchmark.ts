/**
 * Emits the JSON format consumed by benchmark-action/github-action-benchmark
 * (the `customSmallerIsBetter` tool). The action appends each run to a data
 * branch (gh-pages) and renders a time-series chart per benchmark, so history
 * lives outside the code branches — no circular commits back into source.
 *
 * Format: a flat array of { name, unit, value, range?, extra? }. We key on the
 * stable benchmark `id` so a series stays continuous across renames of `name`,
 * use the median as the tracked value (smaller is better), and stash p95 in
 * `extra` for the chart tooltip. Errored benchmarks are omitted — they have no
 * meaningful timing and would break the series.
 */

import type { PerfReport } from '../types'

interface BenchmarkJsonEntry {
  name: string
  unit: string
  value: number
  range?: string
  extra?: string
}

export function buildBenchmarkJson(report: PerfReport): BenchmarkJsonEntry[] {
  return report.results
    .filter(result => !result.error)
    .map(result => ({
      name: result.id,
      unit: 'ms',
      value: Number(result.stats.median.toFixed(2)),
      range: `± ${(result.stats.p95 - result.stats.median).toFixed(1)}ms p95`,
      extra: `${result.name} · p95 ${result.stats.p95.toFixed(1)}ms · ${result.rows.toLocaleString()} rows`
    }))
}
