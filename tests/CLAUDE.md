# Testing Architecture

Multi-database test infrastructure for drizzle-cube. Tests run against 6 engines (postgres, mysql, sqlite, duckdb, databend, snowflake) using Vitest (server/client) and Playwright (e2e). Docker containers managed via `test:setup`/`test:teardown`.

## Directory Layout

```
tests/
├── helpers/
│   ├── test-database.ts         Unified DB interface, skip helpers, schema loading
│   ├── test-utilities.ts        TestQueryBuilder, TestExecutor, QueryValidator, SecurityTestUtils
│   ├── test-cubes.ts            Test cube definitions (Employees, Departments, Productivity)
│   ├── enhanced-test-data.ts    Sample datasets for all entity types
│   ├── schema.ts                Shared schema references
│   └── databases/               Per-engine schema + setup
│       ├── postgres/             schema.ts, setup.ts, migrations/
│       ├── mysql/                schema.ts, setup.ts, migrations/
│       ├── sqlite/               schema.ts, setup.ts, migrations/
│       ├── duckdb/               schema.ts, setup.ts
│       ├── databend/             schema.ts, setup.ts
│       └── snowflake/            schema.ts, setup.ts
│
├── setup/
│   └── globalSetup.ts           Per-engine Docker container + migration bootstrap
│
├── client-setup/
│   ├── setup.ts                 Browser API mocks + MSW lifecycle
│   ├── msw-handlers.ts          Default Cube API mock handlers
│   ├── msw-server.ts            MSW server instance
│   └── test-utils.tsx           renderWithProviders, createHookWrapper, createQueryClientWrapper
│
├── server/                      Server-side unit/integration tests
│   ├── ai/                      AI discovery, suggestion, validation
│   ├── executors/               Database executor tests
│   ├── explain/                 EXPLAIN plan parser tests
│   └── prompts/                 AI prompt template tests
│
├── agent/                       Agent subsystem tests
│   ├── handler.test.ts          Chat handler tests
│   ├── system-prompt.test.ts    System prompt generation
│   └── tools.test.ts            Tool definition tests
│
├── adapters/                    Framework adapter tests (Express, Fastify, Hono, Next.js, MCP)
│
├── client/                      React component + hook tests (jsdom)
│   ├── hooks/                   useCubeLoadQuery, useDebounce, useFilterValues
│   ├── components/              UI component tests
│   ├── charts/                  Chart rendering tests
│   ├── stores/                  State management tests
│   ├── providers/               CubeProvider tests
│   ├── funnel/                  Funnel visualization tests
│   ├── adapters/                Client adapter tests
│   ├── AnalysisBuilder/         Analysis builder tests
│   └── utils/                   Utility function tests
│
├── e2e/                         Playwright end-to-end tests
│   ├── chart-screenshots.spec.ts  Visual regression for charts
│   └── fixtures/                  Test fixtures
│
└── *.test.ts                    ~60 root-level server integration tests
```

## Vitest Configuration

| Config | Scope | Key settings |
|--------|-------|-------------|
| `vitest.config.ts` | Workspace root | Threads pool for DuckDB/Databend compatibility |
| `vitest.config.server.ts` | Server tests | `globalSetup.ts`, uses `TEST_DB_TYPE` env var |
| `vitest.config.client.ts` | Client tests | jsdom environment, React plugin, MSW setup, 75% coverage threshold |

## Test Helpers

| File | Key exports | Purpose |
|------|-------------|---------|
| `helpers/test-database.ts` | `getTestSchema`, `createTestDatabaseExecutor`, `createTestSemanticLayer`, `createTestDatabaseWithData`, `getTestDatabaseType`, `skipIfDuckDB`, `skipIfDatabend`, `skipIfSnowflake`, `DATABASE_CONFIGS` | Unified multi-engine test database interface |
| `helpers/test-utilities.ts` | `TestQueryBuilder`, `TestExecutor`, `QueryValidator`, `PerformanceMeasurer`, `SecurityTestUtils`, `TestDataGenerator` | Query building, execution, validation, and performance measurement |
| `helpers/test-cubes.ts` | `createTestCubesForCurrentDatabase`, `getTestCubes` | Creates Employees/Departments/Productivity cubes with security context filtering |
| `helpers/enhanced-test-data.ts` | `enhancedEmployees`, `enhancedDepartments`, `generateComprehensiveProductivityData`, `testSecurityContexts`, `edgeCaseTestData` | Sample datasets with multi-org isolation |
| `client-setup/test-utils.tsx` | `renderWithProviders`, `createHookWrapper`, `createQueryClientWrapper`, `server` (MSW) | React Testing Library wrappers with CubeProvider |
| `client-setup/msw-handlers.ts` | `handlers`, `createLoadHandler`, `createErrorHandler`, `mockMeta`, `mockQueryData` | MSW request handlers for Cube API mocking |

## Database Schemas

| Engine | Directory | Notes |
|--------|-----------|-------|
| postgres | `helpers/databases/postgres/` | Schema + migrations, Docker on port 5433 |
| mysql | `helpers/databases/mysql/` | Schema + migrations, Docker on port 3307 |
| sqlite | `helpers/databases/sqlite/` | Schema + migrations, in-memory |
| duckdb | `helpers/databases/duckdb/` | Schema + setup, in-memory, uses sequences |
| databend | `helpers/databases/databend/` | Schema + setup, Docker container |
| snowflake | `helpers/databases/snowflake/` | Schema + setup, cloud or local mock |

`TestDatabaseType` = `'postgres' | 'mysql' | 'sqlite' | 'duckdb' | 'databend' | 'snowflake' | 'both'`

## Test Commands

| Command | What it runs |
|---------|-------------|
| `npm test` | Default server tests (postgres) |
| `npm run test:server` | Server tests via `vitest.config.server.ts` |
| `npm run test:mysql` | Server tests against MySQL |
| `npm run test:sqlite` | Server tests against SQLite |
| `npm run test:duckdb` | Server tests against DuckDB |
| `npm run test:databend` | Server tests against Databend |
| `npm run test:snowflake` | Server tests against Snowflake |
| `npm run test:all` | Sequential run across all engines |
| `npm run test:client` | Client tests (jsdom) |
| `npm run test:e2e` | Playwright screenshot tests |
| `npm run test:setup` | Start Docker containers |
| `npm run test:teardown` | Stop Docker containers |
| `npm run test:watch` | Watch mode (server) |
| `npm run test:client:watch` | Watch mode (client) |
| `npm run test:coverage:complete` | Full coverage across all engines + client |

## Guard Rails

1. **Security context mandatory** — all test cubes define `sql: (securityContext) => ...` row-level filter; tests must validate org isolation
2. **Multi-engine portability** — new server tests must pass across all 6 engines; use `skipIfDuckDB()`, `skipIfDatabend()`, `skipIfSnowflake()` for engine-specific limitations
3. **Database URL safety** — all test URLs must contain "test" substring; separate ports (5433, 3307) prevent production conflicts
4. **Data isolation** — fresh connections and data seeding per test via `createTestDatabaseWithData` or `createTestDatabaseExecutor`
5. **Client tests use MSW** — API mocking via Mock Service Worker at network level; avoid `vi.mock` for fetch/API calls
6. **User-centric queries** — client tests use `getByRole`/`getByText` over `getByTestId`; `userEvent` over `fireEvent`
7. **DuckDB limitations** — single-user OLAP engine; concurrency tests skipped; no `QUANTILE_CONT` in scalar subqueries; non-deterministic row ordering without `ORDER BY`
8. **Naming** — test files use `*.test.ts` (server) / `*.test.tsx` (client) / `*.spec.ts` (Playwright)
9. **i18n key coverage** — `tests/i18n/locales.test.ts` automatically validates that all chart config translation keys exist in `en.json`. Adding a new chart config with missing keys will fail this test. See `src/i18n/CLAUDE.md`.
