# Testing drizzle-cube

## Do not run `npm test` — you have no database

drizzle-cube's default test engine is PostgreSQL. `npm test`, `npm run
test:postgres` and `npm run test:mysql` all connect to the databases in
`docker-compose.yml`, and the Vitest `globalSetup` dials that connection
**before a single test runs**. You are executing inside a sandbox with no
Docker daemon, so all three fail instantly at setup.

That failure means "no database". It does **not** mean the test suite is
broken, and it does **not** mean your change regressed anything. Never
report it as a test failure, never open an issue about it, and never edit
code to try to make it pass.

## Run these instead

```bash
npm run test:sqlite    # server suite against in-process SQLite — your main signal
npm run test:client    # client / React component tests
npm run test:cli       # CLI + generator tests
npm run lint
npm run typecheck
```

All five are self-contained: no Docker, no external service, no network.
`.github/workflows/ci.yml` runs each of them with no `services:` block,
which is what proves it.

**Run them ONE AT A TIME, not in parallel.** Each of these is a Node
process that peaks near a gigabyte — `tsc` uses ~1 GB per pass (and
`typecheck` is three sequential passes), and `test:client` runs ~5,900
jsdom tests. Launching them concurrently inside a memory-capped sandbox
gets one of them SIGKILLed by the kernel, which surfaces as **exit code
137** and looks like a broken command rather than what it is. If you see
exit 137 from any of these, that is out-of-memory from too much
concurrency — re-run that command on its own before drawing any
conclusion from it.

`test:sqlite` is not a token subset — it executes the **same** server test
suite as the PostgreSQL run (~2,300 tests), just against a different
engine. Treat green `test:sqlite` + `test:client` + `lint` + `typecheck`
as a full pass for any change that isn't specific to one database engine.

## The one exception

If your change touches a single engine's executor in
`src/server/executors/` (postgres, mysql, duckdb, databend, snowflake,
singlestore), the DB-free suites cannot verify it. Say so plainly in your
summary and leave that verification to CI, which runs every engine on the
PR. Do not claim you verified an engine you could not run.
