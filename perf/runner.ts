/**
 * Benchmark runner: sequential warmup + measured iterations per benchmark.
 *
 * Methodology: queries run sequentially (keeps connection and buffer cache
 * consistently warm); the headline number reporters use is the median, which
 * tolerates the 2-3x run-to-run variance of shared CI runners far better than
 * the mean. Errors are captured per-benchmark so one broken query never
 * aborts the suite.
 */

import { performance } from 'node:perf_hooks'
import type { Cube, SecurityContext } from '../src/server/types'
import type { QueryExecutor } from '../src/server/executor'
import { testSecurityContexts } from '../tests/helpers/enhanced-test-data'
import { computeStats } from './stats'
import type { BenchmarkDef, BenchmarkResult } from './types'

export interface RunnerContext {
  /** Executor without result caching — used for execute/dryRun benchmarks */
  executor: QueryExecutor
  /** Executor with an in-memory result cache — used for cache-hit/miss benchmarks */
  cachedExecutor: QueryExecutor
  cubes: Map<string, Cube>
}

export interface RunnerOptions {
  warmup: number
  iterations: number
}

export async function runBenchmark(
  def: BenchmarkDef,
  ctx: RunnerContext,
  options: RunnerOptions
): Promise<BenchmarkResult> {
  const securityContext: SecurityContext = def.securityContext ?? testSecurityContexts.org1
  const base: Omit<BenchmarkResult, 'stats' | 'samples' | 'rows'> = {
    id: def.id,
    name: def.name,
    category: def.category,
    mode: def.mode,
    iterations: options.iterations,
    warmup: options.warmup
  }

  const runOnce = async (): Promise<number> => {
    switch (def.mode) {
      case 'dryRun': {
        await ctx.executor.dryRunSQL(ctx.cubes, def.query, securityContext)
        return 0
      }
      case 'cache-miss': {
        const result = await ctx.cachedExecutor.execute(ctx.cubes, def.query, securityContext, { skipCache: true })
        return result.data.length
      }
      case 'cache-hit': {
        const result = await ctx.cachedExecutor.execute(ctx.cubes, def.query, securityContext)
        return result.data.length
      }
      default: {
        const result = await ctx.executor.execute(ctx.cubes, def.query, securityContext)
        return result.data.length
      }
    }
  }

  try {
    let rows = 0
    for (let i = 0; i < options.warmup; i++) {
      rows = await runOnce()
    }

    const samples: number[] = []
    for (let i = 0; i < options.iterations; i++) {
      const start = performance.now()
      rows = await runOnce()
      samples.push(performance.now() - start)
    }

    return { ...base, stats: computeStats(samples), samples: samples.map(s => Math.round(s * 100) / 100), rows }
  } catch (error) {
    return {
      ...base,
      stats: computeStats([]),
      samples: [],
      rows: 0,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}
