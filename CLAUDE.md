# CLAUDE.md

Drizzle ORM-first semantic layer with Cube.js compatibility. Type-safe analytics and dashboards with SQL injection protection.

## Project Structure

```
src/server/      # Core semantic layer — compiler, executors, query planning  → src/server/CLAUDE.md
src/client/      # React analytics dashboard components                       → src/client/CLAUDE.md
src/adapters/    # Framework adapters (Express, Fastify, Hono, Next.js)       → src/adapters/CLAUDE.md
src/i18n/        # Internationalization runtime and locale files               → src/i18n/CLAUDE.md
src/cli/         # CLI tool — `npx drizzle-cube charts init|list`            → src/cli/CLAUDE.md
src/shared/      # Shared utilities (date-range parsing)
tests/           # Multi-database testing infrastructure                      → tests/CLAUDE.md
dev/             # Development environment: example server, Docker Compose, migrations, seed
.claude/         # Agent skills
```

## Agent Documentation Context

Before planning non-trivial changes, review the LLM-optimized documentation index at https://www.drizzle-cube.dev/llms.txt for current public docs, examples, and API context. Use it as supplementary context alongside this repository's `CLAUDE.md` files and source code; repository files remain the source of truth for implementation details.

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
| Test | `npm test` | Run all tests (Vitest) — **needs Docker**, see below |
| Test | `npm run test:watch` | Tests in watch mode |
| Test | `npm run test:postgres` | Run server tests (PostgreSQL, default engine) — **needs Docker** |
| Test | `npm run test:mysql` | Run server tests against MySQL — **needs Docker** |
| Test | `npm run test:sqlite` | Run server tests against SQLite — no Docker |
| Test | `npm run test:cli` | Run CLI / generator tests — no Docker |
| Test | `npm run test:client` | Run client component tests — no Docker |
| Test | `npm run test:e2e` | Run Playwright end-to-end tests |
| Test | `npm run test:setup` | Start test containers (docker-compose up) |
| Test | `npm run test:teardown` | Stop test containers (docker-compose down) |
| Quality | `npm run typecheck` | TypeScript type checking |
| Quality | `npm run lint` | ESLint |
| Quality | `npm run lint:fix` | ESLint with auto-fix |

### Testing in a constrained environment (CI sandboxes, agents, containers)

**`npm test` is NOT the command to run when Docker is unavailable.** The default engine is PostgreSQL, so the root Vitest config's `globalSetup` tries to connect to the `docker-compose.yml` Postgres and the whole run fails before a single test executes. The same applies to `npm run test:postgres` and `npm run test:mysql`. A failure from these commands means "no database", not "the code is broken" — do not report it as a test failure, and do not try to fix the code in response to it.

If you are running inside a container, a sandbox, or any environment where you cannot start Docker (`docker-compose up` unavailable or nested-Docker denied), **use the DB-free suites instead** — they are the full verification signal available to you:

```bash
npm run test:sqlite    # server tests against in-process SQLite — the widest DB-free coverage
npm run test:client    # client/React component tests
npm run test:cli       # CLI / generator tests
npm run lint
npm run typecheck
```

`test:sqlite` uses an in-process SQLite database with no external service, and it exercises the same server test suite as the Postgres run — so it is the primary correctness signal here, not a token subset. CI proves all three are self-contained: `.github/workflows/ci.yml` runs `test-sqlite`, `test-client` and the lint/typecheck job with **no** `services:` block.

Treat green `test:sqlite` + `test:client` + `lint` + `typecheck` as a passing verification for any change that isn't engine-specific. Only reach for Postgres/MySQL/DuckDB/Databend/Snowflake when your change touches that engine's executor in `src/server/executors/` — and if you can't run them, say so explicitly and leave the engine-specific verification to CI, which covers every engine on the PR.

## Security Model

- **Never** construct SQL strings manually — always use Drizzle query builder or parameterized `sql` templates
- **Every cube MUST filter by `securityContext`** for multi-tenant isolation
- Pattern: `sql: (securityContext) => eq(table.orgId, securityContext.orgId)`
- **Nothing resolves cubes without a `securityContext`** — cube *shape* is tenant-scoped too, via per-tenant cube sets (`contextToCubeSetId` + `registerCubeSet`), so `getMetadata`, `validateQuery`, `getCube` and friends all require one. `/meta` is tenant-scoped and not publicly cacheable. See `docs/per-tenant-cube-sets.md`.

## Core Principles

- **Drizzle-first** — all SQL generation uses Drizzle ORM exclusively
- **TypeScript-only** — strict type checking throughout. A passing `npm run typecheck` is **necessary, not sufficient**: never use `as any`, and never use a type assertion to bypass a local validator or type guard. If a validator exists for a config/artifact shape, route values through it rather than casting around it to silence the compiler.
- **Security-first** — multi-tenant isolation is mandatory
- **Modular** — separate entry points: `drizzle-cube/server`, `drizzle-cube/client`, `drizzle-cube/adapters/*`
- **Cube.js compatible** — API compatibility for easy migration

## Internationalization (i18n)

**NEVER add bare user-facing strings.** All user-visible text must use translation keys. Full details in `src/i18n/CLAUDE.md`.

- Use `t('key')` via `useTranslation()` in React components
- **Configs store keys, components resolve** — chart configs hold translation key strings, NOT resolved text
- Add new keys to `en.json`, `nl-NL.json`, and `en-US.json` (if British spelling differs)
- PR checklist: no new bare strings, keys exist in all locale files

## Release Dance

From a clean, up-to-date `main`:

1. Validate the publish gate locally: `npm run lint && npm run typecheck && npm run build && npm run check:exports` (the `prepublishOnly` chain — must be green).
2. `npm version patch|minor|major` — bumps `package.json`, commits as the bare version (e.g. `0.6.2`), tags `v0.6.2`.
3. `git push origin main && git push origin v0.6.2`.
4. `gh release create v0.6.2 --title v0.6.2 --notes "…"` — creating the release triggers `.github/workflows/npm-publish.yml`, which waits for CI to pass on the commit then runs `npm publish`.
5. Verify: `npm view drizzle-cube version` shows the new version.

Version-only commits skip tests in CI but still run lint/typecheck/build so the publish gate reports success.

## Agent skills

Per-repo configuration for the engineering skills (`to-issues`, `triage`, `to-prd`, `qa`, `improve-codebase-architecture`, `diagnosing-bugs`, `tdd`).

### Issue tracker

Issues live as GitHub issues in `cliftonc/drizzle-cube` (the `origin` remote), managed via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles map to repo labels of the same name (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`); categories are `bug` / `enhancement`. See `docs/agents/triage-labels.md`.

### Domain docs

Multi-context: `CONTEXT-MAP.md` at the root indexes per-area glossaries (`src/server/`, `src/client/`, `src/adapters/CONTEXT.md`), created lazily by `/domain-modeling`. See `docs/agents/domain.md`.
