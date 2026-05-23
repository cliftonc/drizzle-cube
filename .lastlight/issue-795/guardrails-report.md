# Guardrails Report for #795

## Summary

guardrails_status: READY

The repository has configured and exercised test, lint, and typecheck guardrails. The aggregate test command starts Vitest but cannot complete in this sandbox because the documented PostgreSQL/docker-compose test services are unavailable; the client Vitest suite passes, and CI provisions database services for server tests.

## Test Framework

Status: PRESENT / READY

- Framework: Vitest (`vitest.config.ts`, `vitest.config.server.ts`, `vitest.config.client.ts`).
- Test files: present under `tests/`, including server and client suites.
- Commands:
- `npm test`: starts Vitest, then fails during PostgreSQL global setup with `connect ECONNREFUSED 127.0.0.1:54333` because local PostgreSQL is not running.
- `npm run test:setup`: fails in this sandbox because `docker-compose` is not installed.
- `npm run test:client`: passes (`156` test files, `5770` tests).

## Linting

Status: PRESENT / READY

- Linter: ESLint (`eslint.config.mjs`).
- Command: `npm run lint`.
- Result: passes.

## Type Checking

Status: PRESENT / READY

- Type checker: TypeScript (`tsconfig.json`, `tsconfig.tests.json`).
- Command: `npm run typecheck`.
- Result: passes.

## CI Pipeline

Status: PRESENT

- Workflow: `.github/workflows/ci.yml`.
- CI runs `npm ci`, `npm run lint`, `npm run typecheck`, build jobs, and server test jobs with PostgreSQL/MySQL/SQLite/Databend services where needed.

## Environment Notes

- Repository expects Node 24 (`.nvmrc`, CI uses Node 24); sandbox Node is 20.20.2.
- Plain `npm ci` failed because `better-sqlite3` needed native compilation and `make` is not installed in this sandbox.
- `npm ci --ignore-scripts` completed and was used to run lint, typecheck, and client tests.
