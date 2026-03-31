# CLAUDE.md

Drizzle ORM-first semantic layer with Cube.js compatibility. Type-safe analytics and dashboards with SQL injection protection.

## Project Structure

```
src/server/      # Core semantic layer — compiler, executors, query planning  → src/server/CLAUDE.md
src/client/      # React analytics dashboard components                       → src/client/CLAUDE.md
src/adapters/    # Framework adapters (Express, Fastify, Hono, Next.js)       → src/adapters/CLAUDE.md
src/cli/         # CLI tool — `npx drizzle-cube charts init|list`
src/shared/      # Shared utilities (date-range parsing)
tests/           # Multi-database testing infrastructure                      → tests/CLAUDE.md
dev/             # Development environment: example server, Docker Compose, migrations, seed
.claude/         # Agent skills
```

## Database Support

PostgreSQL · MySQL · SQLite · DuckDB · Snowflake · Databend · SingleStore

Each engine has a dedicated executor in `src/server/executors/`. Auto-detection resolves the engine from the Drizzle instance.

## Essential Commands

| Category | Command | Description |
|----------|---------|-------------|
| Dev | `npm run dev` | Start dev servers (server + client) |
| Dev | `npm run dev:server` | Watch server (tsx) |
| Dev | `npm run dev:client` | Watch client (Vite) |
| Dev | `npm run dev:setup` | Start Docker DBs, run migrations + seed |
| Build | `npm run build` | Build all (server, client, adapters, CLI) |
| Build | `npm run build:server` | Build server only |
| Build | `npm run build:client` | Build client only |
| Build | `npm run build:adapters` | Build adapters only |
| Build | `npm run build:cli` | Build CLI only |
| Test | `npm test` | Run all tests (Vitest) |
| Test | `npm run test:watch` | Tests in watch mode |
| Test | `npm run test:postgres` | Run server tests (PostgreSQL, default engine) |
| Test | `npm run test:mysql` | Run server tests against MySQL |
| Test | `npm run test:sqlite` | Run server tests against SQLite |
| Test | `npm run test:client` | Run client component tests |
| Test | `npm run test:e2e` | Run Playwright end-to-end tests |
| Test | `npm run test:setup` | Start test containers (docker-compose up) |
| Test | `npm run test:teardown` | Stop test containers (docker-compose down) |
| Quality | `npm run typecheck` | TypeScript type checking |
| Quality | `npm run lint` | ESLint |
| Quality | `npm run lint:fix` | ESLint with auto-fix |

## Security Model

- **Never** construct SQL strings manually — always use Drizzle query builder or parameterized `sql` templates
- **Every cube MUST filter by `securityContext`** for multi-tenant isolation
- Pattern: `sql: (securityContext) => eq(table.orgId, securityContext.orgId)`

## Core Principles

- **Drizzle-first** — all SQL generation uses Drizzle ORM exclusively
- **TypeScript-only** — strict type checking throughout
- **Security-first** — multi-tenant isolation is mandatory
- **Modular** — separate entry points: `drizzle-cube/server`, `drizzle-cube/client`, `drizzle-cube/adapters/*`
- **Cube.js compatible** — API compatibility for easy migration

## Internationalization Policy

All user-visible text must be translatable.

- **NEVER add bare user-facing strings** in client or server code.
- **ALWAYS use `t('...')`** for labels, descriptions, button text, tooltips, errors, warnings, empty states, hints, and API messages shown to users.
- This rule applies to both:
  - **Client UI** (`src/client/**`, `dev/client/**`)
  - **Server-originated user messages** (`src/server/**`, adapters, validation and error responses that surface in UI/logs for users)

### Allowed bare strings (exceptions)

Bare strings are allowed only when they are not user-visible copy, for example:

- object keys / JSON keys / translation keys
- IDs, enum values, database field names, protocol/header names
- route paths, query parameters, CSS class names
- hidden/internal diagnostics not exposed to users
- test-only fixtures/assertions

### Implementation Guidance

- Add new default English strings to `src/i18n/locales/en.json`.
- Add corresponding translations in other locale files (for example `src/i18n/locales/nl-NL.json`).
- Prefer reusing existing translation keys before introducing new ones.
- When adding new configurable chart text (for example in `*.config.ts`), use translation keys for every `label` and `description`.

### PR Checklist (i18n)

- No new bare user-facing strings were introduced.
- New keys exist in `en.json`.
- Non-English locale files were updated (or explicitly noted as follow-up).
