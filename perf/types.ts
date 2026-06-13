/**
 * Types for the performance benchmark suite.
 * The JSON report schema (PerfReport) is the contract consumed by the
 * console/HTML/markdown reporters and any future trend tooling — keep it stable.
 */

import type { SemanticQuery, SecurityContext } from '../src/server/types'

export type BenchmarkMode = 'execute' | 'dryRun' | 'cache-hit' | 'cache-miss'

export interface BenchmarkDef {
  /** Stable identifier, e.g. 'baseline.count-1m' — used for filtering and trend tracking */
  id: string
  /** Human-readable label shown in reports */
  name: string
  /** Grouping key, e.g. 'baseline', 'filters', 'joins' */
  category: string
  mode: BenchmarkMode
  query: SemanticQuery
  /** Defaults to org1 (the large benchmarked organisation) */
  securityContext?: SecurityContext
}

export interface BenchmarkStats {
  min: number
  max: number
  mean: number
  median: number
  p95: number
}

export interface BenchmarkResult {
  id: string
  name: string
  category: string
  mode: BenchmarkMode
  iterations: number
  warmup: number
  /** All values in milliseconds */
  stats: BenchmarkStats
  /** Raw measured samples in ms, for future statistical analysis */
  samples: number[]
  /** Rows returned by the query (0 for dryRun) */
  rows: number
  error?: string
}

export interface PerfReport {
  meta: {
    timestamp: string
    gitSha: string
    node: string
    dataVersion: number
    iterations: number
    warmup: number
    totalDurationMs: number
    rowCounts: Record<string, number>
  }
  results: BenchmarkResult[]
}
