# Guardrails Check — cliftonc/drizzle-cube#936 (v3)

Branch: `lastlight/936-dbt-sync-to-cubes-v3`
Date: 2026-06-20

## Issue context

Issue #936 ("DBT Sync to Cubes v3") is a normal feature/enhancement build:
add a `drizzle-cube dbt generate` CLI command that reads local dbt
`manifest.json`/`catalog.json` artifacts and emits Drizzle Postgres schema +
Drizzle Cube TypeScript files. This is **not** a bootstrap task — the repo
already has tests, lint, typecheck, and CI. The executor should rely on the
existing tooling and follow the project conventions in `CLAUDE.md`.

## 1. Test Framework — PASS

- Runner: **Vitest** (`vitest ^4.0.0`, installed v4.1.9).
- Configs: `vitest.config.ts`, `vitest.config.server.ts`,
  `vitest.config.client.ts`; CLI tests run via `--project cli`.
- Test files exist under `tests/` (server, client, adapters, cli, fixtures).
- `npm run test:cli` / `vitest run --project cli` executed: **1 file, 1 test passed**.
- Note for executor: DB-backed server tests require Docker containers
  (`npm run test:setup`); pure unit tests (parser/mapper/emitter) do not.
  The dbt generator should be covered by container-free Vitest unit tests +
  fixtures, matching the spec's testing strategy.

## 2. Linting — PASS

- Linter: **ESLint** (flat config `eslint.config.mjs` + legacy
  `.eslintrc.json`).
- `npm run lint` targets `src/**/*.{ts,tsx}`, `tests/**/*.ts`, `perf/**/*.ts`.
- Scoped run (`eslint src/cli/**/*.ts tests/cli/**/*.ts`) exited **0**.

## 3. Type Checking — PASS

- **TypeScript** strict config: `tsconfig.json` + `tsconfig.tests.json` +
  `tsconfig.client.tests.json`.
- `npm run typecheck` (`tsc --noEmit` across all three projects) executed
  with **no errors**.

## 4. CI Pipeline — PASS (informational)

`.github/workflows/` contains `ci.yml`, `codeql.yml`, `npm-publish.yml`,
`performance.yml`, `release-notify.yml`, `security-scan.yml`.

`ci.yml` runs: `npm run lint`, `npm run typecheck`, build steps
(`build:server/client/adapters/cli`), `check:exports`, and matrixed
`test:server` (postgres/mysql/sqlite/duckdb/databend/snowflake) + `test:client`.

## Environment notes

- `npm install` succeeded after setting a writable cache (`npm_config_cache`);
  the default `/cache/npm` had root-owned files. The executor may need the
  same workaround if a fresh install is required.
- `npx` invokes hit the same cache-permission error; use
  `node_modules/.bin/<tool>` directly or set `npm_config_cache=/tmp/npm-cache`.

## Verdict

All critical guardrails (tests, lint, typecheck) are present and functional.
CI is configured. No blocking issues. **READY**.
