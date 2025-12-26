# Repository Guidelines

## Project Structure & Module Organization
- `src/server/` holds the core semantic layer (compiler, executors, query planning).
- `src/client/` contains React components, charts, hooks, and client utilities.
- `src/adapters/` provides framework adapters (Express, Fastify, Hono, Next.js).
- `tests/` contains multi-database integration tests and helpers.
- `dev/` is the local dev environment (DB setup, sample app).
- `docs/` includes project docs and plans.

## Build, Test, and Development Commands
- `npm run dev` runs server + client in parallel for local development.
- `npm run dev:server` watches the server build (`dev/server/index.ts`).
- `npm run dev:client` runs the client dev server from `dev/client`.
- `npm run build` builds server, client, and adapters.
- `npm run test` runs the Vitest suite (PostgreSQL by default).
- `npm run test:mysql` / `npm run test:sqlite` run DB-specific suites via env vars.
- `npm run test:setup` / `npm run test:teardown` manage Docker DBs for tests.
- `npm run typecheck` and `npm run lint` are required before publishing.

## Coding Style & Naming Conventions
- TypeScript only; ES modules (`"type": "module"`).
- Use ESLint (`npm run lint`) as the primary style gate.
- React components are typically `PascalCase` (e.g., `src/client/client/CubeClient.ts`).
- Tests follow `*.test.ts` naming (e.g., `tests/having-clause-measures.test.ts`).
- SQL must be generated via Drizzle ORM; no manual string concatenation.

## Testing Guidelines
- Framework: Vitest (`vitest.config.ts` and `vitest.config.client.ts`).
- Tests are integration-heavy and use Dockerized databases.
- Add tests for new features and bug fixes, including multi-DB coverage.

## Commit & Pull Request Guidelines
- Commit format:
  ```
  <subject>

  <body>
  ```
  Example: `Add PostgreSQL array support to measures`.
- Commits must be signed before PR submission.
- PR titles follow `[Area]: <subject>` (e.g., `[Server]: Add MySQL JSON support`).
- PRs should include a clear description, tests, and run `npm run typecheck` + `npm run lint`.

## Architecture & Security Notes
- Drizzle-first design: schema, query building, and execution all go through Drizzle.
- Always filter by `securityContext` for multi-tenant isolation.
- Component-specific guidance lives in `src/server/CLAUDE.md`, `src/client/CLAUDE.md`,
  `src/adapters/CLAUDE.md`, and `tests/CLAUDE.md`.
