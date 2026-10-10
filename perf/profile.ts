/**
 * Profiling entrypoint: drive a single benchmark in a tight in-process loop and
 * capture CPU / allocation / memory profiles of the query engine. Run from repo root:
 *
 *   npm run perf:profile                                  default bench, all modes
 *   npm run perf:profile -- --bench=compile.complex --mode=cpu   pure SQL-build (dryRun, no DB)
 *   npm run perf:profile -- --bench=join.three-cubes --mode=all
 *   npm run perf:profile -- --bench=cache.hit --mode=mem --snapshot
 *   npm run perf:profile -- --list                        list benchmark ids
 *
 * Flags: --bench=<id> --mode=cpu|alloc|mem|all --iterations=<n> --warmup=<n> --snapshot --top=<n>
 *
 * In-process load drives QueryExecutor directly, so the DB round-trip shows as
 * idle time and the CPU flamegraph is dominated by the actual query-engine JS.
 * Profile a `dryRun` benchmark (compile.*) to isolate plan/SQL-build with no DB;
 * a `cache-hit` benchmark to isolate result transformation.
 *
 * Artifacts land in perf-results/profiles/ — open .cpuprofile/.heapprofile in
 * Chrome DevTools (Performance / Memory → Load profile), VS Code, or speedscope.
 */

import { createPostgresExecutor, MemoryCacheProvider } from '../src/server'
import { QueryExecutor } from '../src/server/executor'
import { testSchema } from '../tests/helpers/databases/postgres/schema'
import { BENCHMARKS } from './benchmarks'
import { connectPerf, ensurePerfDatabase, ensureSeeded } from './database'
import { getPerfCubes } from './perf-cubes'
import { makeRunOnce, resolveSecurityContext, type RunnerContext } from './runner'
import {
  measureMemory,
  measureTiming,
  profileCpu,
  profileHeapAllocations,
  summarizeCpuProfile,
  PROFILES_DIR,
  type RunOnce
} from './profiler'

type ProfileMode = 'cpu' | 'alloc' | 'mem' | 'time' | 'all'

interface CliOptions {
  benchId: string
  mode: ProfileMode
  iterations: number
  warmup: number
  snapshot: boolean
  top: number
  list: boolean
}

const DEFAULT_BENCH = 'join.three-cubes'
const VALID_MODES: ProfileMode[] = ['cpu', 'alloc', 'mem', 'time', 'all']

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    benchId: DEFAULT_BENCH,
    mode: 'all',
    iterations: Number(process.env.PROFILE_ITERATIONS) || 500,
    warmup: Number(process.env.PROFILE_WARMUP) || 20,
    snapshot: argv.includes('--snapshot'),
    top: 20,
    list: argv.includes('--list')
  }
  for (const arg of argv) {
    if (arg.startsWith('--bench=')) options.benchId = arg.slice('--bench='.length)
    if (arg.startsWith('--mode=')) options.mode = arg.slice('--mode='.length) as ProfileMode
    if (arg.startsWith('--iterations=')) options.iterations = Number(arg.slice('--iterations='.length))
    if (arg.startsWith('--warmup=')) options.warmup = Number(arg.slice('--warmup='.length))
    if (arg.startsWith('--top=')) options.top = Number(arg.slice('--top='.length))
  }
  if (!VALID_MODES.includes(options.mode)) {
    throw new Error(`Invalid --mode "${options.mode}" (expected ${VALID_MODES.join('|')})`)
  }
  if (!Number.isFinite(options.iterations) || options.iterations < 1) {
    throw new Error(`Invalid iterations: ${options.iterations}`)
  }
  if (!Number.isFinite(options.warmup) || options.warmup < 0) {
    throw new Error(`Invalid warmup: ${options.warmup}`)
  }
  return options
}

function listBenchmarks(): void {
  let category = ''
  for (const def of BENCHMARKS) {
    if (def.category !== category) {
      category = def.category
      console.log(`\n  ${category}`)
    }
    console.log(`    ${def.id.padEnd(32)} [${def.mode}]  ${def.name}`)
  }
  console.log('')
}

function fmtBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  if (Math.abs(mb) >= 1) return `${mb.toFixed(2)} MB`
  return `${(bytes / 1024).toFixed(1)} KB`
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))

  if (options.list) {
    listBenchmarks()
    return
  }

  const def = BENCHMARKS.find(b => b.id === options.benchId)
  if (!def) {
    throw new Error(`Unknown benchmark "${options.benchId}". Run with --list to see available ids.`)
  }

  await ensurePerfDatabase()
  const { db, close } = await connectPerf()

  try {
    await ensureSeeded(db)

    const dbExecutor = createPostgresExecutor(db, testSchema)
    const ctx: RunnerContext = {
      executor: new QueryExecutor(dbExecutor),
      cachedExecutor: new QueryExecutor(dbExecutor, { provider: new MemoryCacheProvider() }),
      cubes: await getPerfCubes()
    }

    const runOnce: RunOnce = makeRunOnce(def, ctx, resolveSecurityContext(def))
    const label = def.id

    console.log(`\nProfiling "${def.id}" [${def.mode}] — ${def.name}`)
    console.log(`  iterations=${options.iterations}  warmup=${options.warmup}  mode=${options.mode}\n`)

    // Warm the JIT, connection, and any per-process caches before measuring.
    for (let i = 0; i < options.warmup; i++) await runOnce()

    const wantTime = options.mode === 'time'
    const wantCpu = options.mode === 'cpu' || options.mode === 'all'
    const wantAlloc = options.mode === 'alloc' || options.mode === 'all'
    const wantMem = options.mode === 'mem' || options.mode === 'all'

    if (wantTime) {
      const t = await measureTiming(runOnce, options.iterations, options.warmup)
      console.log(`  Timing (${t.iterations} iters): median ${t.medianUs}µs · mean ${t.meanUs}µs · p95 ${t.p95Us}µs · p99 ${t.p99Us}µs · min ${t.minUs}µs · ${t.opsPerSec.toLocaleString()} ops/sec`)
      console.log(`\nDone.`)
      return
    }

    if (wantCpu) {
      const profile = await profileCpu(label, runOnce, options.iterations)
      const { totalMs, idleMs, activeMs, frames } = summarizeCpuProfile(profile, options.top)
      const idlePct = totalMs > 0 ? (idleMs / totalMs) * 100 : 0
      console.log(`  CPU profile → ${PROFILES_DIR}/${label}.cpuprofile  (${totalMs.toFixed(0)}ms wall · ${activeMs.toFixed(0)}ms active CPU · ${idlePct.toFixed(0)}% idle/IO)`)
      if (idlePct > 50) {
        console.log(`  ⚠ mostly idle — this benchmark waits on the DB. Use a dryRun (compile.*) or cache-hit bench to profile pure CPU.`)
      }
      console.log(`\n  Top ${frames.length} frames by self time (share of active CPU):`)
      console.log(`  ${'self'.padStart(9)}  ${'share'.padStart(6)}  frame`)
      console.log(`  ${'-'.repeat(72)}`)
      for (const f of frames) {
        const self = `${f.selfMs.toFixed(1)}ms`.padStart(9)
        const share = `${(f.share * 100).toFixed(1)}%`.padStart(6)
        console.log(`  ${self}  ${share}  ${f.label}`)
      }
      console.log('')
    }

    if (wantAlloc) {
      await profileHeapAllocations(label, runOnce, options.iterations)
      console.log(`  Allocation profile → ${PROFILES_DIR}/${label}.heapprofile  (open in Chrome DevTools → Memory)`)
    }

    if (wantMem) {
      const mem = await measureMemory(label, runOnce, options.iterations, { snapshot: options.snapshot })
      console.log(`  Memory: retained ${fmtBytes(mem.retainedBytes)} total · ${fmtBytes(mem.retainedPerIterationBytes)}/iter · peak heap ${fmtBytes(mem.peakBytes)}${mem.gcAvailable ? '' : ' (no --expose-gc: approximate)'}`)
      if (mem.snapshotPath) console.log(`  Heap snapshot → ${mem.snapshotPath}  (open in Chrome DevTools → Memory → Load)`)
    }

    console.log(`\nDone. Artifacts in ${PROFILES_DIR}/`)
  } finally {
    close()
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Profiling run failed:', error)
    process.exit(1)
  })
