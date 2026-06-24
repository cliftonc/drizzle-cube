# Guardrails Check — #936 (DBT Sync to Cubes v4)

Branch: `lastlight/936-dbt-sync-to-cubes-v4`
Date: 2026-06-20

## Verdict: READY

All foundational tooling is present and functional. This is a normal feature
build (adding a `drizzle-cube dbt generate` CLI command under `src/cli/`), not a
bootstrap task — the test harness, linter, and type checker already exist and
the executor can rely on them.

## 1. Test Framework — PASS

- Runner: **Vitest** (`vitest`), configured via `vitest.config.*` files.
- Test files exist across `tests/` (server, `tests/cli/`, `tests/client/`, `tests/e2e/`).
- `npm run test:cli` (the project this feature targets) **runs and passes**: 1 file / 1 test, exit 0.
- `npm test` (full suite) fails only because the server project requires live DB
  containers (Postgres on `127.0.0.1:54333`, MySQL, etc.) which are not running in
  this sandbox. This is an **environment limitation, not a missing framework** —
  CI starts these containers via `docker-compose` (`npm run test:setup`). The
  new dbt generator work is pure-Node (JSON artifact parsing + TS emission) and
  will be covered by `tests/cli/**` which runs without containers.

## 2. Linting — PASS

- Linter: **ESLint** (`eslint`).
- `npm run lint` runs clean, exit 0.

## 3. Type Checking — PASS

- Type checker: **TypeScript** (`tsc --noEmit`) against `tsconfig.json`,
  `tsconfig.tests.json`, `tsconfig.client.tests.json`.
- `npm run typecheck` passes, exit 0.

## 4. Build (CLI) — PASS

- `npm run build:cli` (Vite build of the CLI bundle) succeeds, exit 0.
  This is the build target the new dbt command will be added to.

## 5. CI Pipeline — PASS (informational)

- `.github/workflows/` contains `ci.yml`, `codeql.yml`, `npm-publish.yml`,
  `performance.yml`, `release-notify.yml`, `security-scan.yml`.
- `ci.yml` runs: lint, typecheck, build (server/client/adapters/cli), export
  checks, and DB-backed test jobs (Postgres/MySQL/etc. with container wait steps).

## Notes for the executor

- New code lives under `src/cli/` and `tests/cli/`; verify with
  `npm run test:cli`, `npm run lint`, `npm run typecheck`, `npm run build:cli`.
- Server/container tests need not run for this feature, but keep the full
  `npm test` green in CI where containers are available.
- Dependencies were installed via `npm install` (node_modules was absent on this
  fresh clone); `package-lock.json` is unchanged.
