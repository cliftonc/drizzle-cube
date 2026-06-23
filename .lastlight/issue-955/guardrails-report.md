# Guardrails pre-flight report for issue #955

Issue: Add a helper function to calculate the time since a specific date
Bootstrap: NO (this is feature work, not tooling/toolchain setup)

## 1. Test framework

- Tooling: Vitest via the `npm test` script (`"test": "vitest run"` in `package.json`).
- Test files: present under `tests/` (server, client, CLI, and e2e test projects).
- Command executed: `npm test`
- Result: **FAILED in this sandbox** because the PostgreSQL test database at `127.0.0.1:54333` was not running.
  - Vitest global setup attempted to run migrations and seed test data and hit:
    - `DrizzleQueryError: Failed query: delete from "productivity" ...`
    - Root cause: `connect ECONNREFUSED 127.0.0.1:54333`.
  - This matches the documented flow in `CONTRIBUTING.md`, which expects `npm run test:setup` (Docker-based databases) before running the full PostgreSQL/MySQL-backed test suite.
- Assessment: The test runner and suites are correctly configured and rely on Docker-based test databases. In this environment, `npm test` fails without `npm run test:setup`, but this is an expected prerequisite rather than a broken test framework.

**Guardrail verdict (tests): PRESENT — Vitest test infrastructure is in place and wired into npm scripts/CI. Executors should run `npm run test:setup` (or use DB-free `npm run test:cli` where appropriate) before running the full suite.**

## 2. Linting

- Tooling: ESLint, configured via `eslint.config.mjs` and used across `src`, `tests`, and `perf`.
- Script: `"lint": "eslint 'src/**/*.{ts,tsx}' 'tests/**/*.ts' 'perf/**/*.ts'"` in `package.json`.
- Command executed: `npm run lint`.
- Result: **PASS** — command completed successfully with no reported errors.

**Guardrail verdict (lint): PRESENT AND PASSING — ESLint is configured and working.**

## 3. Type checking

- Tooling: TypeScript (`tsc`), using multiple configs.
- Script: `"typecheck": "tsc --noEmit && tsc --noEmit -p tsconfig.tests.json && tsc --noEmit -p tsconfig.client.tests.json"` in `package.json`.
- Command executed: `npm run typecheck`.
- Result: **FAILED in this sandbox** — the process was killed with exit code 137 (`Killed`), likely due to container memory limits while running three full `tsc --noEmit` passes.
- Assessment: Type checking is fully configured and integrated into npm scripts and CI. The failure appears to be resource-related in this environment, not a missing or miswired typecheck pipeline.

**Guardrail verdict (typecheck): PRESENT — configuration exists and the command is defined, but it could not complete here due to resource limits (exit code 137). Executors should still run `npm run typecheck` locally as part of the pre-merge gate.**

## 4. CI pipeline (informational)

- `.github/workflows/` contains:
  - `ci.yml`
  - `codeql.yml`
  - `npm-publish.yml`
  - `performance.yml`
  - `release-notify.yml`
  - `security-scan.yml`
- `ci.yml` includes:
  - A `lint-and-typecheck` job that runs `npm ci`, then `npm run lint` and `npm run typecheck` on pushes/PRs to `main`.
  - A `build` job that runs `npm ci`, builds server/client/adapters/CLI, and verifies exports via `npm run check:exports`.
  - Multiple test jobs (gated behind a `detect-changes` step) for:
    - PostgreSQL tests via `npm run test:server` with a PostgreSQL service container.
    - MySQL tests via `npm run test:server` with a MySQL service container.
    - SQLite tests via `npm run test:server` with `TEST_DB_TYPE=sqlite`.
    - Databend tests (conditional on repo vars) via `npm run test:server` with a Databend service container.
    - Snowflake tests (conditional on secrets) via `npm run test:server` with Snowflake credentials.
    - Client tests via `npm run test:client`.

**Guardrail verdict (CI): PRESENT — CI runs lint, typecheck, builds, and a comprehensive multi-database/server/client test matrix.**

## Overall assessment for issue #955

- This issue is **normal feature work** (adding a helper to calculate a human-readable "time since" string) and is **not** a tooling/bootstrap request.
- Core guardrails are in place:
  - Test framework and suites are configured (Vitest + multi-DB tests), albeit requiring `npm run test:setup` or service containers to pass.
  - Linting is configured and currently passing.
  - Type checking is configured, though the full `npm run typecheck` command exceeds this sandbox's likely memory limits.
  - CI is wired to enforce lint, typecheck, build, and tests on `main` pushes and pull requests.

**Guardrails status for issue #955: READY** — no separate guardrails/bootstrap issue is needed; the executor can rely on the existing test, lint, typecheck, and CI tooling when implementing the helper function.