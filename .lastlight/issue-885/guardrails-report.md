# Guardrails Report for #885

## Summary

Guardrails status: READY

Dependencies were installed with `npm ci` before verification. The initial `npm test` invocation ran but failed because the default PostgreSQL test database was not running on `127.0.0.1:54333`; project docs require `npm run test:setup`/CI services for that path. Non-Docker test paths verified that the configured test framework is functional.

## 1. Test Framework

Status: PRESENT / RUNS

- Framework: Vitest (`vitest.config.ts`, `vitest.config.server.ts`, `vitest.config.client.ts`)
- Test files: present under `tests/` (server and client suites)
- Commands run:
  - `npm test` — ran Vitest, failed due missing local PostgreSQL service (`ECONNREFUSED 127.0.0.1:54333`), not due missing/broken test tooling.
  - `TEST_DB_TYPE=sqlite npm run test:server` — passed: 98 files passed, 1 skipped; 2312 tests passed, 40 skipped.
  - `npm run test:client` — passed: 161 files passed; 5861 tests passed.

## 2. Linting

Status: PRESENT / RUNS

- Linter: ESLint (`eslint.config.mjs`)
- Command run: `npm run lint`
- Result: passed.

## 3. Type Checking

Status: PRESENT / RUNS

- Type checker: TypeScript (`tsconfig.json`, `tsconfig.tests.json`, `tsconfig.client.tests.json`)
- Command run: `npm run typecheck`
- Result: passed.

## 4. CI Pipeline

Status: PRESENT

- Workflows exist under `.github/workflows/`.
- `.github/workflows/ci.yml` includes lint, typecheck, build, and test jobs for PostgreSQL, MySQL, SQLite, Databend, Snowflake, and client tests.
