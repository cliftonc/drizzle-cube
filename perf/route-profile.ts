/**
 * Real-route profiling: drive the actual HTTP route handler in-process and
 * profile the FULL request path — Hono routing → security extraction → core
 * load handler → SemanticLayerCompiler → QueryExecutor → SQL build → DB →
 * result mapping → Cube response formatting → JSON serialization.
 *
 * Backed by SQLite (better-sqlite3): synchronous + in-process, so there is NO
 * network idle — every microsecond in the CPU profile is real request work.
 * Zero Docker, fully repeatable. Run from repo root:
 *
 *   npm run perf:route                                    default route, all modes
 *   npm run perf:route -- --route=load.join --mode=cpu
 *   npm run perf:route -- --route=load.timeseries --mode=time --iterations=5000
 *   npm run perf:route -- --mode=time --concurrency=20    throughput under load
 *   npm run perf:route -- --list
 *
 * Flags: --route=<id> --mode=cpu|mem|time|all --iterations=<n> --warmup=<n>
 *        --concurrency=<n> --top=<n>
 *
 * Artifacts land in perf-results/profiles/ — open .cpuprofile in Chrome DevTools.
 */

// SQLite test helpers read TEST_DB_TYPE at call time — set before any of them run.
process.env.TEST_DB_TYPE = 'sqlite'

import type { SemanticQuery } from '../src/server/types'
import { createCubeApp } from '../src/adapters/hono'
import { getTestSchema } from '../tests/helpers/test-database'
import { getTestCubes } from '../tests/helpers/test-cubes'
import { setupSQLiteDatabase } from '../tests/helpers/databases/sqlite/setup'
import { testSecurityContexts } from '../tests/helpers/enhanced-test-data'
import {
  measureMemory,
  measureTiming,
  profileCpu,
  summarizeCpuProfile,
  PROFILES_DIR,
  type RunOnce
} from './profiler'

type RouteMode = 'cpu' | 'mem' | 'time' | 'all'

interface RouteDef {
  id: string
  name: string
  query: SemanticQuery
}

/**
 * Representative load queries over the standard SQLite test cubes
 * (Employees / Departments / Productivity / TimeEntries).
 */
const ROUTES: RouteDef[] = [
  { id: 'load.count', name: 'Single count measure', query: { measures: ['Employees.count'] } },
  {
    id: 'load.groupby',
    name: 'Group by department name',
    query: { measures: ['Employees.count', 'Employees.avgSalary'], dimensions: ['Departments.name'] }
  },
  {
    id: 'load.join',
    name: 'Join employees → departments with filter',
    query: {
      measures: ['Employees.count', 'Employees.avgSalary'],
      dimensions: ['Departments.name'],
      filters: [{ member: 'Employees.salary', operator: 'gt', values: [0] }]
    }
  },
  {
    id: 'load.timeseries',
    name: 'Monthly productivity time series',
    query: {
      measures: ['Productivity.totalLinesOfCode', 'Productivity.recordCount'],
      timeDimensions: [{ dimension: 'Productivity.date', granularity: 'month' }]
    }
  },
  {
    id: 'load.ungrouped',
    name: 'Ungrouped raw rows (serialization-heavy)',
    query: {
      dimensions: ['Productivity.employeeId', 'Productivity.date', 'Productivity.linesOfCode'],
      measures: ['Productivity.totalLinesOfCode'],
      ungrouped: true,
      limit: 5000
    }
  }
]

/**
 * A pool of DISTINCT query shapes (different measure/dimension/filter/limit
 * combinations → different generated SQL strings). Cycling these instead of one
 * fixed query stresses any per-shape cache (compiler metadata/plan caches, the
 * driver's prepared-statement cache): if such a cache is unbounded, retained
 * heap climbs with the number of distinct shapes seen rather than plateauing.
 */
function variedQueries(): SemanticQuery[] {
  const measureSets = [
    ['Employees.count'],
    ['Employees.count', 'Employees.avgSalary'],
    ['Productivity.recordCount', 'Productivity.totalLinesOfCode'],
    ['TimeEntries.count', 'TimeEntries.totalHours']
  ]
  const dimensionSets = [
    undefined,
    ['Departments.name'],
    ['TimeEntries.allocationType'],
    ['Productivity.employeeId']
  ]
  const queries: SemanticQuery[] = []
  for (let m = 0; m < measureSets.length; m++) {
    for (let d = 0; d < dimensionSets.length; d++) {
      const dims = dimensionSets[d]
      // Skip combinations whose cubes don't line up with the measures.
      const cube = measureSets[m][0].split('.')[0]
      const dimCube = dims?.[0]?.split('.')[0]
      if (dims && dimCube !== cube && dimCube !== 'Departments') continue
      for (let lim = 0; lim < 6; lim++) {
        queries.push({
          measures: measureSets[m],
          dimensions: dims,
          filters: [{ member: `${cube}.id`, operator: 'gt', values: [lim * 3] }],
          limit: 50 + lim * 25
        })
      }
    }
  }
  return queries
}

const DEFAULT_ROUTE = 'load.join'
const VALID_MODES: RouteMode[] = ['cpu', 'mem', 'time', 'all']
const BASE_PATH = '/cubejs-api/v1'

interface CliOptions {
  routeId: string
  mode: RouteMode
  iterations: number
  warmup: number
  concurrency: number
  top: number
  list: boolean
  vary: boolean
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    routeId: DEFAULT_ROUTE,
    mode: 'all',
    iterations: 2000,
    warmup: 200,
    concurrency: 1,
    top: 25,
    list: argv.includes('--list'),
    vary: argv.includes('--vary')
  }
  for (const arg of argv) {
    if (arg.startsWith('--route=')) options.routeId = arg.slice('--route='.length)
    if (arg.startsWith('--mode=')) options.mode = arg.slice('--mode='.length) as RouteMode
    if (arg.startsWith('--iterations=')) options.iterations = Number(arg.slice('--iterations='.length))
    if (arg.startsWith('--warmup=')) options.warmup = Number(arg.slice('--warmup='.length))
    if (arg.startsWith('--concurrency=')) options.concurrency = Number(arg.slice('--concurrency='.length))
    if (arg.startsWith('--top=')) options.top = Number(arg.slice('--top='.length))
  }
  if (!VALID_MODES.includes(options.mode)) {
    throw new Error(`Invalid --mode "${options.mode}" (expected ${VALID_MODES.join('|')})`)
  }
  for (const [k, v] of [['iterations', options.iterations], ['warmup', options.warmup], ['concurrency', options.concurrency]] as const) {
    if (!Number.isFinite(v) || v < (k === 'warmup' ? 0 : 1)) throw new Error(`Invalid ${k}: ${v}`)
  }
  return options
}

function fmtBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return Math.abs(mb) >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2))

  if (options.list) {
    for (const r of ROUTES) console.log(`  ${r.id.padEnd(18)} ${r.name}`)
    return
  }

  const route = ROUTES.find(r => r.id === options.routeId)
  if (!route) {
    throw new Error(`Unknown route "${options.routeId}". Run with --list to see ids.`)
  }

  console.log('Booting SQLite + cube app (in-process)...')
  const { db, close } = await setupSQLiteDatabase()

  try {
    const schema = (await getTestSchema()).schema
    const cubes = await getTestCubes()

    const app = createCubeApp({
      cubes: [...cubes.values()],
      drizzle: db,
      schema,
      engineType: 'sqlite',
      extractSecurityContext: () => testSecurityContexts.org1,
      mcp: { enabled: false }
    })

    // Bodies to drive the route with. Default: one fixed query. With --vary:
    // a pool of distinct query shapes, round-robined, to stress per-shape caches.
    const queries = options.vary ? variedQueries() : [route.query]
    const bodies = queries.map(q => JSON.stringify({ query: q }))
    const headers = { 'Content-Type': 'application/json' }
    let cursor = 0

    const requestLoadRoute = async (): Promise<Response> => {
      const body = bodies[cursor++ % bodies.length]
      const res = await app.request(`${BASE_PATH}/load`, { method: 'POST', headers, body })
      if (res.status !== 200) {
        throw new Error(`Route returned ${res.status}: ${await res.text()}`)
      }
      return res
    }

    const countRowsFromPayload = (payload: unknown): number => {
      if (typeof payload !== 'object' || payload === null || !('results' in payload) || !Array.isArray(payload.results)) {
        return 0
      }
      const [firstResult] = payload.results
      if (typeof firstResult !== 'object' || firstResult === null || !('data' in firstResult) || !Array.isArray(firstResult.data)) {
        return 0
      }
      return firstResult.data.length
    }

    // Parse once outside the measured loop so profiler output excludes client-side
    // Response.json()/JSON.parse work. The measured run still consumes the body to
    // force response serialization, but only validates status and byte payload size.
    const validateSample = async (): Promise<number> => {
      const text = await (await requestLoadRoute()).text()
      return countRowsFromPayload(JSON.parse(text))
    }

    const runOnce: RunOnce = async () => {
      const text = await (await requestLoadRoute()).text()
      return text.length
    }

    if (options.vary) console.log(`Varying ${queries.length} distinct query shapes (stresses per-shape caches).`)

    // Confirm the route works and report the payload size once.
    const sampleRows = await validateSample()
    console.log(`\nRoute POST ${BASE_PATH}/load  "${route.id}" — ${route.name}`)
    console.log(`  returns ${sampleRows} rows · iterations=${options.iterations} warmup=${options.warmup} concurrency=${options.concurrency} mode=${options.mode}\n`)

    const label = `route.${route.id}`
    const wantTime = options.mode === 'time' || options.mode === 'all'
    const wantCpu = options.mode === 'cpu' || options.mode === 'all'
    const wantMem = options.mode === 'mem' || options.mode === 'all'

    if (wantTime) {
      if (options.concurrency > 1) {
        // Throughput: keep `concurrency` requests in flight, measure wall time.
        for (let i = 0; i < options.warmup; i++) await runOnce()
        const start = process.hrtime.bigint()
        let dispatched = 0
        await Promise.all(
          Array.from({ length: options.concurrency }, async () => {
            while (dispatched < options.iterations) {
              dispatched++
              await runOnce()
            }
          })
        )
        const elapsedMs = Number(process.hrtime.bigint() - start) / 1e6
        const rps = Math.round((options.iterations / elapsedMs) * 1000)
        console.log(`  Throughput (@${options.concurrency} concurrent): ${rps.toLocaleString()} req/s · ${options.iterations} reqs in ${elapsedMs.toFixed(0)}ms · ${(elapsedMs / options.iterations).toFixed(3)}ms avg`)
      } else {
        const t = await measureTiming(runOnce, options.iterations, options.warmup)
        const ms = (us: number) => (us / 1000).toFixed(3)
        console.log(`  Response time (${t.iterations} reqs): median ${ms(t.medianUs)}ms · mean ${ms(t.meanUs)}ms · p95 ${ms(t.p95Us)}ms · p99 ${ms(t.p99Us)}ms · ${t.opsPerSec.toLocaleString()} req/s`)
      }
    }

    if (wantCpu) {
      for (let i = 0; i < options.warmup; i++) await runOnce()
      const profile = await profileCpu(label, runOnce, options.iterations)
      const { totalMs, idleMs, activeMs, frames } = summarizeCpuProfile(profile, options.top)
      const idlePct = totalMs > 0 ? (idleMs / totalMs) * 100 : 0
      console.log(`\n  CPU profile → ${PROFILES_DIR}/${label}.cpuprofile  (${totalMs.toFixed(0)}ms wall · ${activeMs.toFixed(0)}ms active CPU · ${idlePct.toFixed(0)}% idle)`)
      console.log(`  Top ${frames.length} frames by self time (share of active CPU):`)
      console.log(`  ${'self'.padStart(9)}  ${'share'.padStart(6)}  frame`)
      console.log(`  ${'-'.repeat(72)}`)
      for (const f of frames) {
        console.log(`  ${`${f.selfMs.toFixed(1)}ms`.padStart(9)}  ${`${(f.share * 100).toFixed(1)}%`.padStart(6)}  ${f.label}`)
      }
    }

    if (wantMem) {
      for (let i = 0; i < options.warmup; i++) await runOnce()
      const mem = await measureMemory(label, runOnce, options.iterations)
      console.log(`\n  Memory: retained ${fmtBytes(mem.retainedBytes)} total · peak heap ${fmtBytes(mem.peakBytes)}${mem.gcAvailable ? '' : ' (no --expose-gc)'}`)
      console.log(`  Growth curve (post-GC retained vs baseline):`)
      for (const c of mem.checkpoints) {
        console.log(`    after ${String(c.atIteration).padStart(6)} reqs: ${fmtBytes(c.retainedBytes).padStart(9)}`)
      }
      const slope = mem.steadyStatePerIterationBytes
      // A few bytes/req is GC jitter; flag a sustained climb in the back half.
      const leaking = slope > 64
      console.log(`  Steady-state slope (2nd half): ${slope >= 0 ? '+' : ''}${slope.toFixed(1)} B/req → ${leaking ? '⚠ GROWING (possible leak)' : 'stable (warmup only, no leak)'}`)
    }

    console.log(`\nDone.`)
  } finally {
    close()
  }
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Route profiling failed:', error)
    process.exit(1)
  })
