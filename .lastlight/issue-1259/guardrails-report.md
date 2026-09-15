# Guardrails report for issue #1259

## Summary
- Dependency install: **passed** (`npm ci`)
- Test framework: **present** (Vitest via `npm test`, `npm run test:server`, `npm run test:client`, `npm run test:cli`, etc.)
- Linting: **configured and passing** (`npm run lint`)
- Type checking: **configured and passing** (`npm run typecheck`)
- CI workflows: **present** (see `.github/workflows/ci.yml`)

## Commands run in guardrails check
- Install: `npm ci`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`

All commands above completed with exit code 0.

Per guardrails instructions, no test suite commands were executed in this phase.

## Test framework
- Test runner: **Vitest** (see `vitest.config*.ts` and `package.json` scripts)
- Example commands:
  - `npm test` — runs the default Vitest projects
  - `npm run test:server` — server tests (DB-backed / engine-specific)
  - `npm run test:client` — client tests (React components)
  - `npm run test:cli` — CLI / generator tests (DB-free)
  - `npm run test:sqlite` — server tests against in-process SQLite (DB-free)

## Linting
- Tool: **ESLint** (`eslint.config.mjs`)
- Command: `npm run lint`
- Status: **pass** (exit code 0)

## Type checking
- Tool: **TypeScript (tsc)** with multiple configs (`tsconfig.json`, `tsconfig.tests.json`, `tsconfig.client.tests.json`)
- Command: `npm run typecheck`
- Status: **pass** (exit code 0)

## CI pipeline
- CI workflow: `.github/workflows/ci.yml`
  - Jobs:
    - `lint-and-typecheck`: `npm run lint`, `npm run typecheck`
    - `build`: `npm run build:*`, `npm run check:exports`
    - `test-postgres`, `test-mysql`, `test-sqlite`, `test-duckdb`, `test-databend`, `test-snowflake`: `npm run test:server` with appropriate `TEST_DB_TYPE` and services
    - `test-client`: `npm run test:client`

## Full test command for gate script
For the Last Light gate in this sandbox (no Docker / external DB services), the "full" verification suite is the DB-free set recommended in `CLAUDE.md`:

```bash
npm run test:sqlite && npm run test:client && npm run test:cli && npm run lint && npm run typecheck
```

This command has been written to `.git/lastlight-gate.sh` and will be executed by the harness after this guardrails phase.
