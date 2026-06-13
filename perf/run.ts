/**
 * Performance benchmark suite entry point. Run from the repo root:
 *
 *   npm run perf                       run everything (seeds on first run)
 *   npm run perf:seed                  create/seed the perf database only
 *   npm run perf -- --filter=joins     run benchmarks matching a substring
 *   npm run perf -- --force-reseed     rebuild the dataset from scratch
 *   npm run perf -- --iterations=10 --warmup=3
 *
 * Environment: TEST_DATABASE_URL (base postgres), PERF_DATABASE_URL (override),
 * PERF_ITERATIONS, PERF_WARMUP.
 *
 * Results land in perf-results/{results.json,index.html,summary.md}.
 * Exit code is 0 whenever the suite ran (report-only — individual benchmark
 * errors are reported, never fatal); non-zero only for infrastructure failures.
 */

import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createPostgresExecutor, MemoryCacheProvider } from '../src/server'
import { QueryExecutor } from '../src/server/executor'
import { testSchema } from '../tests/helpers/databases/postgres/schema'
import { BENCHMARKS } from './benchmarks'
import { connectPerf, ensurePerfDatabase, ensureSeeded } from './database'
import { PERF_DATA_VERSION } from './perf-data'
import { getPerfCubes } from './perf-cubes'
import { buildHtmlReport } from './report/html'
import { buildMarkdownSummary } from './report/markdown'
import { printConsoleSummary } from './report/console'
import { runBenchmark } from './runner'
import type { BenchmarkResult, PerfReport } from './types'

const OUTPUT_DIR = 'perf-results'

interface CliOptions {
  seedOnly: boolean
  forceReseed: boolean
  filter?: string
  iterations: number
  warmup: number
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    seedOnly: argv.includes('--seed-only'),
    forceReseed: argv.includes('--force-reseed'),
    iterations: Number(process.env.PERF_ITERATIONS) || 7,
    warmup: Number(process.env.PERF_WARMUP) || 2
  }
  for (const arg of argv) {
    if (arg.startsWith('--filter=')) options.filter = arg.slice('--filter='.length)
    if (arg.startsWith('--iterations=')) options.iterations = Number(arg.slice('--iterations='.length))
    if (arg.startsWith('--warmup=')) options.warmup = Number(arg.slice('--warmup='.length))
  }
  if (!Number.isFinite(options.iterations) || options.iterations < 1) {
    throw new Error(`Invalid iterations: ${options.iterations}`)
  }
  if (!Number.isFinite(options.warmup) || options.warmup < 0) {
    throw new Error(`Invalid warmup: ${options.warmup}`)
  }
  return options
}

function resolveGitSha(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch {
    return 'local'
  }
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))

  await ensurePerfDatabase()
  const { db, close } = await connectPerf()

  try {
    const rowCounts = await ensureSeeded(db, { force: options.forceReseed })
    if (options.seedOnly) {
      console.log('Seed-only run complete.')
      return
    }

    const dbExecutor = createPostgresExecutor(db, testSchema)
    const executor = new QueryExecutor(dbExecutor)
    const cachedExecutor = new QueryExecutor(dbExecutor, { provider: new MemoryCacheProvider() })
    const cubes = await getPerfCubes()
    const ctx = { executor, cachedExecutor, cubes }

    const selected = options.filter
      ? BENCHMARKS.filter(b => b.id.includes(options.filter!) || b.category.includes(options.filter!))
      : BENCHMARKS
    if (selected.length === 0) {
      throw new Error(`No benchmarks match filter "${options.filter}"`)
    }

    console.log(`Running ${selected.length} benchmarks (${options.iterations} iterations, ${options.warmup} warmup)...`)
    const startedAt = Date.now()
    const results: BenchmarkResult[] = []
    for (const def of selected) {
      const result = await runBenchmark(def, ctx, options)
      results.push(result)
      const status = result.error ? `ERROR: ${result.error}` : `${result.stats.median.toFixed(1)}ms median`
      console.log(`  [${results.length}/${selected.length}] ${def.id} — ${status}`)
    }

    const report: PerfReport = {
      meta: {
        timestamp: new Date().toISOString(),
        gitSha: resolveGitSha(),
        node: process.version,
        dataVersion: PERF_DATA_VERSION,
        iterations: options.iterations,
        warmup: options.warmup,
        totalDurationMs: Date.now() - startedAt,
        rowCounts
      },
      results
    }

    mkdirSync(OUTPUT_DIR, { recursive: true })
    writeFileSync(join(OUTPUT_DIR, 'results.json'), JSON.stringify(report, null, 2))
    writeFileSync(join(OUTPUT_DIR, 'index.html'), buildHtmlReport(report))
    writeFileSync(join(OUTPUT_DIR, 'summary.md'), buildMarkdownSummary(report))

    printConsoleSummary(report)
    console.log(`Reports written to ${OUTPUT_DIR}/ (index.html, summary.md, results.json)`)
  } finally {
    close()
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Performance suite failed:', error)
    process.exit(1)
  })
