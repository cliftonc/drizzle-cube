# Contributing

Welcome! We're glad you're interested in Drizzle Cube and want to help us make it better.

Drizzle Cube is maintained by [Clifton Cunningham](https://github.com/cliftonc) and community contributors. All contributions are reviewed and approved by the maintainer.

---

There are many ways you can contribute to the Drizzle Cube project:

- [Submitting bug reports](#bug-report)
- [Submitting feature request](#feature-request)
- [Providing feedback](#feedback)
- [Contribution guidelines](#contribution-guidelines)

## <a name="bug-report"></a> Submitting bug report

To report a bug or issue, please use our [issue form](https://github.com/cliftonc/drizzle-cube/issues/new) "Bug: ".

## <a name="feature-request"></a> Submitting feature request

To request a feature, please use our [issue form](https://github.com/cliftonc/drizzle-cube/issues/new) and start the title with "Feature Request: ".

## <a name="feedback"></a> Providing feedback

There are several ways you can provide feedback:

- You can add new ticket in [Discussions](https://github.com/cliftonc/drizzle-cube/discussions).
- Mention me on [BlueSky - @cliftonc.nl](https://bsky.app/profile/cliftonc.nl).

## <a name="contribution-guidelines"></a> Contribution guidelines

- [Pre-contribution setup](#pre-contribution)
  - [Installing Node](#installing-node)
  - [Installing npm](#installing-npm)
  - [Installing Docker](#installing-docker)
  - [Cloning the repository](#cloning-the-repository)
  - [Repository structure](#repository-structure)
  - [Building the project](#building-the-project)
- [Commit message guidelines](#commit-message-guidelines)
- [Contributing to the core library](#contributing-core)
  - [Project structure](#project-structure-core)
  - [Running tests](#running-tests-core)
  - [PR guidelines](#pr-guidelines-core)
- [Contributing to examples](#contributing-examples)

## <a name="pre-contribution"></a> Pre-contribution setup

### <a name="installing-node"></a> Installing Node via NVM (if needed)

```bash
# https://github.com/nvm-sh/nvm#install--update-script
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 22
nvm use 22
```

### <a name="installing-npm"></a> Installing npm

Node.js comes with npm by default. We use npm for package management.

### <a name="installing-docker"></a> Installing Docker

```bash
# https://docs.docker.com/get-docker/
# Use Docker's guide to install Docker for your OS.
```

### <a name="cloning-the-repository"></a> Cloning the repository

```bash
git clone https://github.com/cliftonc/drizzle-cube.git
cd drizzle-cube
```

### <a name="repository-structure"></a> Repository structure

- 📂 `src/`

  Core library source code

  - 📂 `server/` - Server-side semantic layer implementation
  - 📂 `client/` - React components and hooks for analytics UI
  - 📂 `adapters/` - Framework adapters (Hono, Express, Fastify, Next.js)

- 📂 `tests/`

  Comprehensive test suite with multi-database support

- 📂 `dev/`

  Development environment with example implementation, so you can test your changes with HMR.

- 📂 `docs/`

  Documentation and implementation plans when using tools like Claude Code (we encourage this).

- 📂 `../drizzle-cube-*/`

  Example projects demonstrating different framework integrations are in separate github repositories.
  - `drizzle-cube-express/` - Express.js example
  - `drizzle-cube-fastify/` - Fastify example
  - `drizzle-cube-hono/` - Hono example
  - `drizzle-cube-nextjs/` - Next.js example
  - `drizzle-cube-try-site/` - Interactive sandbox
  - `drizzle-cube-help-site/` - Main documentation site

### <a name="building-the-project"></a> Building the project

Run the following script from the root folder to build the project:

```bash
npm install && npm run build
```

### Setting up for development

The dev environment uses its own PostgreSQL instance (separate from test databases):

```bash
npm run dev:setup  # Starts dev PostgreSQL (port 54821), runs migrations, seeds sample data
npm run dev        # Starts concurrent dev servers (server + client with HMR)
```

To tear down the dev database:

```bash
npm run dev:db:down
```

### Setting up for testing

Tests require Docker for PostgreSQL and MySQL. SQLite and DuckDB use in-memory databases and don't need Docker.

```bash
npm run test:setup    # Starts test PostgreSQL (port 54333) and MySQL (port 33077) via Docker
npm test              # Run all tests (default: PostgreSQL)
npm run test:teardown # Stop and remove test database containers
```

> [!TIP]
> The dev server and test databases use completely separate Docker containers and ports, so you can run `npm run dev` and `npm test` at the same time. This is useful for observing your changes in the browser while verifying they pass tests.

## <a name="commit-message-guidelines"></a> Commit message guidelines

We have specific rules on how commit messages should be structured.

It's important to make sure your commit messages are clear, concise, and informative to make it easier for others to understand the changes you are making.

All commit messages should follow the pattern below:

```
<subject>
<BLANK LINE>
<body>
```

Example:

```
Add PostgreSQL array support to measures

Enables aggregation functions on PostgreSQL array columns
for more flexible analytics queries
```

> [!WARNING]
> All commits should be signed before submitting a PR. Please check the documentation on [how to sign commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification).

## <a name="contributing-core"></a> Contributing to the core library

### <a name="project-structure-core"></a> Project structure

- 📂 `src/server/`
  
  Server-side semantic layer with type-safe query building, SQL generation, and security

- 📂 `src/client/`

  React components, hooks, and utilities for building analytics dashboards

- 📂 `src/adapters/`

  Framework-specific adapters that integrate the semantic layer with web frameworks

### <a name="running-tests-core"></a> Running tests

Drizzle Cube has integration tests that run against real databases with different queries and responses. Tests use Docker containers for PostgreSQL and MySQL, and in-memory databases for SQLite and DuckDB.

If you have added additional logic to the core library, make sure that all tests complete without any failures.

> [!NOTE]
> If you have added data types, query features, or new functionality, you need to create additional test cases using the new API to ensure it works properly.

**Setup test databases via Docker:**

```bash
npm run test:setup    # Starts PostgreSQL (port 54333) and MySQL (port 33077)
```

**Run server tests (semantic layer, executors, query planning):**

```bash
# PostgreSQL (default)
npm run test:postgres

# MySQL
npm run test:mysql

# SQLite (no Docker needed)
npm run test:sqlite

# DuckDB (no Docker needed)
npm run test:duckdb

# All databases sequentially
npm run test:all
```

**Run client tests (React components, hooks, stores):**

```bash
npm run test:client
```

**Run all tests (server + client):**

```bash
npm test
```

**Watch mode:**

```bash
npm run test:watch          # All tests
npm run test:server:watch   # Server tests only
npm run test:client:watch   # Client tests only
```

**Coverage reports:**

```bash
npm run test:coverage           # Server coverage (default DB)
npm run test:client:coverage    # Client coverage
npm run test:coverage:all       # Server coverage across all databases
npm run test:coverage:complete  # Full coverage (all server DBs + client)
```

**Teardown test databases:**

```bash
npm run test:teardown  # Stop and remove Docker containers
```

**Environment variables:**

| Variable | Default | Description |
|----------|---------|-------------|
| `TEST_DB_TYPE` | `postgres` | Database to test against (`postgres`, `mysql`, `sqlite`, `duckdb`) |
| `TEST_DATABASE_URL` | `postgresql://test:test@localhost:54333/drizzle_cube_test` | PostgreSQL connection URL |
| `MYSQL_TEST_DATABASE_URL` | `mysql://test:test@localhost:33077/drizzle_cube_test` | MySQL connection URL |

> [!WARNING]
> All test database URLs **must contain "test"** as a safety check to prevent accidental use against production databases.

### <a name="pr-guidelines-core"></a> PR guidelines

1. PR titles should follow the pattern below:

   ```
   [<area>]: <subject>
   ```

   Examples:

   ```
   [Server] Add MySQL JSON field support
   [Client] Improve chart type selection UX  
   [Adapters] Add Fastify CORS configuration
   ```

2. PRs should contain a detailed description of everything that was changed.

3. Commit messages should follow the [message style guidelines](#commit-message-guidelines).

4. PRs should implement:
   - Tests for features that were added.
   - Tests for bugs that were fixed.
   - Type checking with `npm run typecheck`
   - Linting with `npm run lint`

> [!NOTE]
> To understand how tests should be created and run, please check the [Running tests](#running-tests-core) section.

## <a name="contributing-examples"></a> Contributing to examples

Example projects are located in separate github repositories and follow the same contribution guidelines:

- [drizzle-cube-express](https://github.com/cliftonc/drizzle-cube-express) - Express.js with React dashboard
- [drizzle-cube-fastify](https://github.com/cliftonc/drizzle-cube-fastify) - Fastify with React dashboard  
- [drizzle-cube-hono](https://github.com/cliftonc/drizzle-cube-hono) - Hono with React dashboard
- [drizzle-cube-nextjs](https://github.com/cliftonc/drizzle-cube-nextjs) - Next.js full-stack application

When contributing to examples:

1. Ensure examples use the latest version of the core library
2. Update documentation if adding new features to examples
3. Test examples work with multiple databases where applicable
4. Keep examples simple and focused on demonstrating specific features

## Development Workflow

1. **Fork and clone** the repository
2. **Create a branch** for your feature/fix
3. **Set up development environment:**
   ```bash
   npm install
   npm run build
   npm run test:setup   # Start test database containers (PostgreSQL + MySQL)
   npm run dev:setup    # Start dev database, run migrations, seed sample data
   ```
4. **Start development servers:**
   ```bash
   npm run dev          # Server + client with HMR
   ```
5. **Make your changes** with appropriate tests
6. **Run the test suite:**
   ```bash
   npm run typecheck
   npm run lint
   npm test             # Server + client tests
   ```
7. **Create a pull request** with a clear description

## Architecture Guidelines

**Drizzle-First Design**: This project is built around Drizzle ORM as the core:
- All SQL generation must use Drizzle query builder
- Never use string concatenation for SQL
- All database operations go through Drizzle
- Type safety is enforced through Drizzle schema definitions

**Security**: SQL injection prevention is paramount:
- Use parameterized queries only
- Leverage Drizzle's type safety
- Include security context in all cube definitions
- Test multi-tenant isolation

**Adding a New Chart Type**: Chart types are used inside the AnalysisBuilder component. When adding a new chart type, verify it works end-to-end within the AnalysisBuilder — select it from the chart type picker, configure axes via the chart config panel, and confirm it renders correctly with real query results. See `src/client/CLAUDE.md` for the full registration steps (chart config, lazy loading, ChartLoader).

## Getting Help

- 📖 Check the [documentation](https://www.drizzle-cube.dev/)
- 🐛 Search [existing issues](https://github.com/cliftonc/drizzle-cube/issues)
- 💬 Start a [discussion](https://github.com/cliftonc/drizzle-cube/discussions)

Thank you for contributing to Drizzle Cube! 🐲