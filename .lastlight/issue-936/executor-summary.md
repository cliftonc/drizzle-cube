# Executor Summary — #936

## What changed

Implemented the dbt artifact generator pipeline and CLI wiring:

- `src/cli/index.ts` routes `drizzle-cube dbt generate` through async top-level error handling.
- `src/cli/commands/dbt.ts` parses CLI flags, validates dialect/security mode, supports prompt/no-security/dry-run/check/force flows, and prints warnings + summaries.
- `src/cli/dbt/*` adds typed artifact parsing, naming helpers, Postgres type mapping, normalization, schema/cube emitters, write/check/dry-run ownership handling, and orchestration.
- `tests/cli/dbt/*` adds DB-free Vitest coverage for naming, type mapping, parsing, normalization, emitters, writer behavior, and command validation.
- `tests/fixtures/dbt/postgres-simple/**` adds manifest/catalog fixtures plus byte-for-byte expected generated output.
- `README.md` and `docs/dbt-generate.md` document usage, security modes, drift checks, type support, and v1 limitations.
- `vite.config.cli.ts` externalizes new Node builtins used by the CLI bundle.
- `tsconfig.json` adds a self-reference path for fixture generated code importing `drizzle-cube/server` during tests typechecking.

## Verification

### Failing test first

```text
$ npm run test:cli -- tests/cli/dbt/naming.test.ts
FAIL  |cli| tests/cli/dbt/naming.test.ts
Error: Cannot find module '../../../src/cli/dbt/naming' imported from /home/agent/workspace/drizzle-cube/tests/cli/dbt/naming.test.ts
Command exited with code 1
```

### Targeted checks

```text
$ npm run test:cli
> drizzle-cube@0.6.4 test:cli
> vitest run --project cli

Test Files  8 passed (8)
Tests  23 passed (23)
```

```text
$ npm run build:cli
> drizzle-cube@0.6.4 build:cli
> vite build --config vite.config.cli.ts

✓ built in 119ms
```

### Guardrail commands

```text
$ npm run test
> drizzle-cube@0.6.4 test
> vitest run

Setting up PostgreSQL test database...
Failed to setup test databases: DrizzleQueryError: Failed query: delete from "productivity"
Caused by: Error: connect ECONNREFUSED 127.0.0.1:54333
Command exited with code 1
```

`npm run test:setup` was attempted to satisfy the DB-backed full suite, but Docker Compose is unavailable in this sandbox:

```text
$ npm run test:setup
> drizzle-cube@0.6.4 test:setup
> docker-compose up -d

sh: 1: docker-compose: not found
Command exited with code 127
```

```text
$ npm run lint
> drizzle-cube@0.6.4 lint
> eslint 'src/**/*.{ts,tsx}' 'tests/**/*.ts' 'perf/**/*.ts'

# passed with no output
```

```text
$ npm run typecheck
> drizzle-cube@0.6.4 typecheck
> tsc --noEmit && tsc --noEmit -p tsconfig.tests.json && tsc --noEmit -p tsconfig.client.tests.json

# passed with no output
```

## Deviations / known issues

- The full `npm run test` gate could not pass because the DB-backed server project requires PostgreSQL on `127.0.0.1:54333`, and Docker Compose is not installed in the sandbox. The new dbt generator path is covered by DB-free CLI tests using in-memory/fixture artifacts.
