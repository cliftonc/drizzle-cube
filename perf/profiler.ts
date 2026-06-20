/**
 * Profiling primitives built on Node's bundled inspector (no extra deps).
 *
 * Each helper wraps ONLY the measured loop in an inspector session so the
 * surrounding seed/connect/warmup work never lands in the profile. Artifacts
 * are written under `perf-results/profiles/` and open as flamegraphs in Chrome
 * DevTools (Performance / Memory → Load profile), VS Code, or speedscope.
 *
 *   .cpuprofile    CPU flamegraph — where wall-clock CPU time is spent
 *   .heapprofile   allocation flamegraph — where bytes are allocated
 *   .heapsnapshot  full heap — retention drill-down for leak hunting
 */

import { Session } from 'node:inspector'
import { writeHeapSnapshot } from 'node:v8'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'

export const PROFILES_DIR = join('perf-results', 'profiles')

/** One run-the-loop thunk: executes a single benchmark iteration. */
export type RunOnce = () => Promise<unknown>

/** A node from a V8 .cpuprofile, plus the per-node sample counts/timings. */
interface CpuProfileNode {
  id: number
  callFrame: { functionName: string; url: string; lineNumber: number }
  hitCount?: number
  children?: number[]
}

export interface CpuProfile {
  nodes: CpuProfileNode[]
  startTime: number
  endTime: number
  samples?: number[]
  timeDeltas?: number[]
}

export interface HotFrame {
  /** `functionName (url:line)` — `(anonymous)` and native frames kept as-is */
  label: string
  /** Self CPU time attributed to this frame, in milliseconds */
  selfMs: number
  /** Share of total profiled CPU time, 0..1 */
  share: number
}

function ensureProfilesDir(): void {
  mkdirSync(PROFILES_DIR, { recursive: true })
}

async function withSession<T>(fn: (post: <R = unknown>(method: string, params?: object) => Promise<R>) => Promise<T>): Promise<T> {
  const session = new Session()
  session.connect()
  const rawPost = promisify(session.post.bind(session)) as (method: string, params?: object) => Promise<unknown>
  const post = <R = unknown>(method: string, params?: object) => rawPost(method, params) as Promise<R>
  try {
    return await fn(post)
  } finally {
    session.disconnect()
  }
}

async function runLoop(runOnce: RunOnce, iterations: number): Promise<void> {
  for (let i = 0; i < iterations; i++) {
    await runOnce()
  }
}

/**
 * Capture a CPU profile of `iterations` runs and write `<label>.cpuprofile`.
 * Returns the parsed profile so the caller can print a terminal hot-frame
 * summary without opening DevTools.
 */
export async function profileCpu(label: string, runOnce: RunOnce, iterations: number): Promise<CpuProfile> {
  ensureProfilesDir()
  const profile = await withSession(async post => {
    await post('Profiler.enable')
    // 100µs sampling — finer than the 1ms default so short query-engine frames register.
    await post('Profiler.setSamplingInterval', { interval: 100 })
    await post('Profiler.start')
    await runLoop(runOnce, iterations)
    const { profile } = await post<{ profile: CpuProfile }>('Profiler.stop')
    return profile
  })
  const path = join(PROFILES_DIR, `${label}.cpuprofile`)
  writeFileSync(path, JSON.stringify(profile))
  return profile
}

/**
 * Capture a sampling allocation profile of `iterations` runs and write
 * `<label>.heapprofile` (open under Chrome DevTools → Memory → Load profile).
 */
export async function profileHeapAllocations(label: string, runOnce: RunOnce, iterations: number): Promise<void> {
  ensureProfilesDir()
  const profile = await withSession(async post => {
    await post('HeapProfiler.enable')
    await post('HeapProfiler.startSampling', { samplingInterval: 16384 })
    await runLoop(runOnce, iterations)
    const { profile } = await post<{ profile: unknown }>('HeapProfiler.stopSampling')
    return profile
  })
  writeFileSync(join(PROFILES_DIR, `${label}.heapprofile`), JSON.stringify(profile))
}

export interface TimingResult {
  iterations: number
  /** All in microseconds. */
  medianUs: number
  meanUs: number
  p95Us: number
  p99Us: number
  minUs: number
  /** Iterations per second derived from the median. */
  opsPerSec: number
}

/**
 * High-resolution timing of the compile/CPU path — finer than the timing suite's
 * 2-decimal millisecond reporting, so sub-millisecond improvements are visible.
 * Uses `process.hrtime.bigint()` (nanosecond clock); reports microseconds.
 * This is the objective KPI for the optimization loop.
 */
export async function measureTiming(runOnce: RunOnce, iterations: number, warmup: number): Promise<TimingResult> {
  for (let i = 0; i < warmup; i++) await runOnce()

  const samplesNs = new Array<number>(iterations)
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint()
    await runOnce()
    samplesNs[i] = Number(process.hrtime.bigint() - start)
  }

  samplesNs.sort((a, b) => a - b)
  const n = samplesNs.length
  const pct = (p: number) => samplesNs[Math.min(n - 1, Math.ceil((p / 100) * n) - 1)]
  const median = n % 2 === 0 ? (samplesNs[n / 2 - 1] + samplesNs[n / 2]) / 2 : samplesNs[(n - 1) / 2]
  const meanNs = samplesNs.reduce((s, v) => s + v, 0) / n

  const toUs = (ns: number) => Math.round((ns / 1000) * 100) / 100
  return {
    iterations,
    medianUs: toUs(median),
    meanUs: toUs(meanNs),
    p95Us: toUs(pct(95)),
    p99Us: toUs(pct(99)),
    minUs: toUs(samplesNs[0]),
    opsPerSec: Math.round(1_000_000_000 / median)
  }
}

export interface MemoryCheckpoint {
  /** Iterations completed at this checkpoint. */
  atIteration: number
  /** Post-GC heapUsed minus the pre-loop baseline, in bytes. */
  retainedBytes: number
}

export interface MemoryResult {
  /** Net retained heap growth across the whole loop, in bytes (post-GC). */
  retainedBytes: number
  /** retainedBytes / iterations — a steady positive value signals a leak. */
  retainedPerIterationBytes: number
  /** Peak heapUsed observed mid-loop, in bytes. */
  peakBytes: number
  iterations: number
  /** Post-GC retained heap sampled at evenly-spaced checkpoints (growth curve). */
  checkpoints: MemoryCheckpoint[]
  /**
   * Per-request slope (bytes) over the SECOND HALF of the run, where one-time
   * warmup (cache fills, JIT) has settled. ~0 ⇒ stable; steadily positive ⇒ leak.
   */
  steadyStatePerIterationBytes: number
  /** False when run without --expose-gc; deltas then include uncollected garbage. */
  gcAvailable: boolean
  /** Path to the written heap snapshot, when requested. */
  snapshotPath?: string
}

/**
 * Measure retained-heap growth across `iterations` runs, sampling the post-GC
 * heap at evenly-spaced checkpoints so a true leak (heap climbs linearly to the
 * end) is distinguishable from one-time warmup (heap rises then plateaus).
 *
 * Forces GC at every checkpoint (requires `--expose-gc`) so each sample reflects
 * RETAINED memory, not uncollected garbage. The steady-state slope is fit over
 * the second half of the run, after warmup has settled. When `snapshot` is set,
 * also writes `<label>.heapsnapshot` for retention drill-down in DevTools.
 */
export async function measureMemory(
  label: string,
  runOnce: RunOnce,
  iterations: number,
  options: { snapshot?: boolean; segments?: number } = {}
): Promise<MemoryResult> {
  const gc = (globalThis as { gc?: () => void }).gc
  const gcAvailable = typeof gc === 'function'
  if (!gcAvailable) {
    console.warn('  ⚠ global.gc unavailable — run via `npm run perf:route`/`perf:profile` (node --expose-gc) for accurate retained-heap deltas')
  }

  const segments = Math.max(2, Math.min(options.segments ?? 10, iterations))
  const segmentSize = Math.floor(iterations / segments)

  gc?.()
  const before = process.memoryUsage().heapUsed
  let peak = before
  const checkpoints: MemoryCheckpoint[] = []

  let done = 0
  for (let s = 0; s < segments; s++) {
    const target = s === segments - 1 ? iterations : done + segmentSize
    for (; done < target; done++) {
      await runOnce()
      const used = process.memoryUsage().heapUsed
      if (used > peak) peak = used
    }
    gc?.()
    checkpoints.push({ atIteration: done, retainedBytes: process.memoryUsage().heapUsed - before })
  }

  let snapshotPath: string | undefined
  if (options.snapshot) {
    ensureProfilesDir()
    snapshotPath = join(PROFILES_DIR, `${label}.heapsnapshot`)
    writeHeapSnapshot(snapshotPath)
  }

  const retainedBytes = checkpoints[checkpoints.length - 1].retainedBytes
  return {
    retainedBytes,
    retainedPerIterationBytes: retainedBytes / iterations,
    peakBytes: peak,
    iterations,
    checkpoints,
    steadyStatePerIterationBytes: secondHalfSlope(checkpoints),
    gcAvailable,
    snapshotPath
  }
}

/**
 * Least-squares slope (bytes per iteration) over the checkpoints in the second
 * half of the run — the window where one-time warmup has settled, so a positive
 * slope here is the real leak signal.
 */
function secondHalfSlope(checkpoints: MemoryCheckpoint[]): number {
  const half = checkpoints.slice(Math.floor(checkpoints.length / 2))
  if (half.length < 2) return 0
  const n = half.length
  let sx = 0, sy = 0, sxy = 0, sxx = 0
  for (const c of half) {
    sx += c.atIteration
    sy += c.retainedBytes
    sxy += c.atIteration * c.retainedBytes
    sxx += c.atIteration * c.atIteration
  }
  const denom = n * sxx - sx * sx
  return denom === 0 ? 0 : (n * sxy - sx * sy) / denom
}

export interface CpuSummary {
  /** Total profiled wall time, ms. */
  totalMs: number
  /** Time the sampler caught the process idle (waiting on I/O — e.g. the DB), ms. */
  idleMs: number
  /** totalMs - idleMs: time actually running JS/native CPU work, ms. */
  activeMs: number
  /** Hottest frames by self time, EXCLUDING the synthetic `(idle)` node. Shares are of activeMs. */
  frames: HotFrame[]
}

/**
 * Aggregate a .cpuprofile down to the top-N frames by self time. Self time per
 * node is `hitCount × averageSampleInterval`; we sum across nodes that share a
 * `functionName (url:line)` identity so recursive/re-entrant frames collapse.
 *
 * V8's synthetic `(idle)` node (CPU parked waiting on I/O, e.g. the DB
 * round-trip in `execute` mode) is split out separately so it never crowds the
 * table — frame shares are taken against active CPU time, not wall time.
 */
export function summarizeCpuProfile(profile: CpuProfile, topN = 20): CpuSummary {
  const totalMs = (profile.endTime - profile.startTime) / 1000
  const totalHits = profile.nodes.reduce((sum, n) => sum + (n.hitCount ?? 0), 0)
  const msPerHit = totalHits > 0 ? totalMs / totalHits : 0

  let idleMs = 0
  const byFrame = new Map<string, number>()
  for (const node of profile.nodes) {
    const hits = node.hitCount ?? 0
    if (hits === 0) continue
    const { functionName, url, lineNumber } = node.callFrame
    const name = functionName || '(anonymous)'
    if (name === '(idle)') {
      idleMs += hits * msPerHit
      continue
    }
    const location = url ? `${shorten(url)}:${lineNumber + 1}` : '(native)'
    const label = `${name} (${location})`
    byFrame.set(label, (byFrame.get(label) ?? 0) + hits * msPerHit)
  }

  const activeMs = totalMs - idleMs
  const frames: HotFrame[] = [...byFrame.entries()]
    .map(([label, selfMs]) => ({ label, selfMs, share: activeMs > 0 ? selfMs / activeMs : 0 }))
    .sort((a, b) => b.selfMs - a.selfMs)
    .slice(0, topN)

  return { totalMs, idleMs, activeMs, frames }
}

/** Trim absolute/file URLs to a repo-relative-ish tail for readable tables. */
function shorten(url: string): string {
  const clean = url.replace(/^file:\/\//, '')
  const marker = clean.lastIndexOf('/src/')
  if (marker !== -1) return clean.slice(marker + 1)
  const perfMarker = clean.lastIndexOf('/perf/')
  if (perfMarker !== -1) return clean.slice(perfMarker + 1)
  const parts = clean.split('/')
  return parts.slice(-2).join('/')
}
