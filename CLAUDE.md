# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**drizzle-cube** is a Drizzle ORM-first semantic layer with Cube.js compatibility. It provides type-safe analytics and dashboards with SQL injection protection by leveraging Drizzle ORM as its core SQL building engine.

### Project Structure
```
src/
├── server/          # Core semantic layer (compiler, executors, query planning)
├── client/          # React components for analytics dashboards
└── adapters/        # Framework adapters (Express, Fastify, Hono, Next.js)
tests/               # Multi-database testing infrastructure
```

## Essential Commands

### Development
- `npm run dev` - Start concurrent development servers (server, client, examples, help)
- `npm run dev:server` - Watch server build only  
- `npm run dev:client` - Watch client build only
- `npm run dev:examples` - Start example applications
- `npm run dev:help` - Start help site development server

### Building
- `npm run build` - Build all packages (server, client, adapters)
- `npm run build:server` - Build server only
- `npm run build:client` - Build client only  
- `npm run build:adapters` - Build adapters only
- `npm run build:help` - Build help site to /dist-help
- `npm run build:all` - Build everything including help site

### Testing
- `npm test` - Run all tests using Vitest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:postgres` - Run tests with PostgreSQL (starts/stops Docker)
- `npm run test:setup` - Start PostgreSQL container for testing
- `npm run test:teardown` - Stop PostgreSQL container

### Code Quality
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint on TypeScript files
- `npm run lint:fix` - Fix ESLint issues automatically

## Core Architecture

### Drizzle-First Design
This project is **Drizzle ORM-first**. The entire architecture revolves around Drizzle:
- All SQL generation uses Drizzle query builder for type safety
- Schema definitions use Drizzle table definitions  
- Security is enforced through Drizzle's parameterized queries
- Database executors wrap Drizzle instances for different engines (PostgreSQL, MySQL, SQLite)

### Key Components

**Server Core (`src/server/`)** - See @src/server/CLAUDE.md
- Semantic layer compiler and cube registration
- Database executors with multi-engine support (PostgreSQL, MySQL, SQLite)
- Query planning and SQL generation
- Type-safe modular architecture

**Client Components (`src/client/`)** - See @src/client/CLAUDE.md
- React analytics dashboard components
- Chart system with Recharts integration
- Query builder and data visualization tools

**Framework Adapters (`src/adapters/`)** - See @src/adapters/CLAUDE.md
- Express, Fastify, Hono, Next.js adapters
- Cube.js-compatible API endpoints
- Security context integration

### Type Safety Flow
1. Drizzle schema defines database structure with full TypeScript types
2. Cubes reference schema columns directly for compile-time validation
3. Query execution uses Drizzle's parameterized queries to prevent SQL injection
4. Results maintain type safety from database to API response

### Database Support
- **PostgreSQL** - Production-ready with full feature support
- **MySQL** - Full compatibility with MySQL 8.0+
- **SQLite** - Embedded database support
- **DuckDB** - Embedded OLAP database (optional peer dependency: @duckdb/node-api, @leonardovida-md/drizzle-neo-duckdb)
- **Auto-detection** - Automatic database type detection from Drizzle instance

## Development Workflow

### Adding New Features
1. **Server changes** - Update types, executors, and core logic
2. **Client changes** - Add components following the modular pattern
3. **Adapter changes** - Maintain API consistency across all frameworks
4. **Testing** - Add multi-database tests with security validation
5. **Type safety** - Ensure full TypeScript coverage

### Testing - See @tests/CLAUDE.md
- Multi-database testing (PostgreSQL, MySQL, SQLite)
- Docker-based test isolation
- Comprehensive security and performance testing

### Build System
- **Vite-based** - Separate configs for server, client, adapters
- **ES modules only** - No CommonJS support
- **Type generation** - Full TypeScript declarations

## Security Model

### SQL Injection Prevention
- **Never** construct SQL strings manually
- **Always** use Drizzle query builder or parameterized `sql` templates
- All user inputs are parameterized through Drizzle

### Multi-tenant Security
- **Every cube MUST filter by `securityContext`**
- Use `sql` function with security context: `sql: (securityContext) => ...`
- Pattern: `eq(table.organisationId, securityContext.organisationId)`
- Security isolation is tested in all multi-database scenarios

## Core Principles

- **Drizzle-first** - All SQL generation uses Drizzle ORM exclusively
- **TypeScript-only** - Strict type checking throughout
- **Security-first** - Multi-tenant isolation is mandatory, not optional
- **Modular architecture** - Separate entry points for different use cases
- **Cube.js compatibility** - Maintain API compatibility for easy migration
- **Performance** - Leverage Drizzle's prepared statements and connection pooling

## Architecture Documentation

For detailed information about specific areas:
- **Server**: @src/server/CLAUDE.md
- **Client**: @src/client/CLAUDE.md  
- **Adapters**: @src/adapters/CLAUDE.md
- **Testing**: @tests/CLAUDE.md