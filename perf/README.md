# Performance harness

In-process load + profiling for the server query engine. Both tools drive
`QueryExecutor` directly against a deterministic ~1M-row Postgres dataset (seeded
once, version-stamped), so results are repeatable and isolated from HTTP/framework
noise. Requires the test Postgres running (`npm run test:setup`).

## Timing suite — *which queries are slow*

```bash
npm run perf                              # all benchmarks, median/p95 per query
npm run perf -- --filter=joins           # subset by id/category substring
npm run perf -- --iterations=10 --warmup=3
npm run perf -- --force-reseed           # rebuild the dataset
```

Reports land in `perf-results/` (`index.html`, `summary.md`, `results.json`,
`benchmark.json`). Catalog lives in `benchmarks.ts`.

## Profiler — *which functions are hot / where memory goes*

```bash
npm run perf:profile                                   # default bench, all modes
npm run perf:profile -- --list                         # list benchmark ids
npm run perf:profile -- --bench=compile.complex --mode=cpu    # pure SQL-build (dryRun, no DB)
npm run perf:profile -- --bench=join.three-cubes --mode=all --snapshot
npm run perf:profile -- --bench=cache.hit --mode=mem   # result-transform retained heap
```

Flags: `--bench=<id>` `--mode=cpu|alloc|mem|all` `--iterations=<n>` `--warmup=<n>`
`--snapshot` `--top=<n>`.

**Pick the right benchmark for CPU work.** `execute` benchmarks wait on the DB, so
their CPU profile is mostly `(idle)` — the profiler warns and reports shares
against *active* CPU. To see the query engine working, profile a `dryRun`
benchmark (`compile.*`, pure plan + SQL build, no DB) or a `cache-hit` benchmark
(pure result transformation).

### Artifacts (`perf-results/profiles/`)

| File | What | Open in |
|------|------|---------|
| `<id>.cpuprofile`  | CPU flamegraph — where CPU time goes        | Chrome DevTools → Performance → Load profile · VS Code · speedscope |
| `<id>.heapprofile` | allocation flamegraph — where bytes are born | Chrome DevTools → Memory → Load profile |
| `<id>.heapsnapshot`| full heap — retention drill-down (`--snapshot`) | Chrome DevTools → Memory → Load |

The terminal also prints the top-N hottest frames by self time, so first-pass
hot-path triage needs no DevTools. `--mode=mem` needs `--expose-gc` (the npm
script supplies it) for accurate retained-heap deltas — a steady positive
`KB/iter` signals a leak.

## Real-route profiler — *the full HTTP request path*

Drives the actual Cube load route (`POST /cubejs-api/v1/load`) in-process via the
Hono adapter over **SQLite** (`better-sqlite3` — synchronous + in-process, so the
CPU profile has 0% idle: every frame is real request work — routing, security,
execute, SQL build, DB, result mapping, JSON serialization). No Docker.

```bash
npm run perf:route                                      # default route, all modes
npm run perf:route -- --list
npm run perf:route -- --route=load.ungrouped --mode=cpu    # 5000-row payload, where response time lives
npm run perf:route -- --mode=time --concurrency=20         # throughput under load
npm run perf:route -- --mode=mem --iterations=8000         # leak check w/ growth curve
npm run perf:route -- --vary --mode=mem --iterations=10000 # cycle 96 distinct shapes — stresses per-shape caches
```

Flags: `--route=<id>` `--mode=cpu|mem|time|all` `--iterations` `--warmup`
`--concurrency` `--vary` `--top`.

**Memory mode** samples the post-GC heap at checkpoints across the run and reports
a growth curve plus a second-half least-squares slope (B/req), so a real leak
(heap climbs linearly to the end) is distinguishable from one-time warmup (rises
then plateaus). `--vary` round-robins distinct query shapes to expose caches that
grow unboundedly with query variety. `--snapshot` writes a `.heapsnapshot`.

## Layout

`run.ts` timing entry · `profile.ts` in-process profiling entry · `route-profile.ts`
real-route (HTTP) profiling entry · `profiler.ts` inspector wrappers (CPU /
allocation / memory-growth / timing) · `runner.ts` shared per-iteration execution (`makeRunOnce`) ·
`benchmarks.ts` catalog · `database.ts` seed/connect · `perf-cubes.ts` cubes ·
`perf-data.ts` deterministic generator · `report/` timing reporters.
