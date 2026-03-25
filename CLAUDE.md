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
