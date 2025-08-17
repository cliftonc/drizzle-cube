# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**drizzle-cube** is a Drizzle ORM-first semantic layer with Cube.js compatibility. It provides type-safe analytics and dashboards with SQL injection protection by leveraging Drizzle ORM as its core SQL building engine.

## Essential Commands

### Development
- `npm run dev` - Start concurrent development servers (server, client, examples)
- `npm run dev:server` - Watch server build only  
- `npm run dev:client` - Watch client build only
- `npm run dev:examples` - Start example applications

### Building
- `npm run build` - Build all packages (server, client, adapters)
- `npm run build:server` - Build server only
- `npm run build:client` - Build client only  
- `npm run build:adapters` - Build adapters only

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

**Server Core (`src/server/`)**:
- `compiler.ts` - `SemanticLayerCompiler` class that registers and manages cubes
- `types.ts` - Core type definitions and database executor implementations
- `types-drizzle.ts` - Drizzle-specific type definitions and utilities
- `executor.ts` - Query execution engine for semantic queries
- `executor-drizzle.ts` - Drizzle-specific query executor implementation

**Client (`src/client/`)**:
- React components for building analytics dashboards
- Cube.js-compatible client interface

**Adapters (`src/adapters/`)**:
- `hono/` - Hono web framework adapter with Cube.js API endpoints
- Framework-agnostic adapter pattern for different web frameworks

### Type Safety Flow
1. Drizzle schema defines database structure with full TypeScript types
2. Cubes reference schema columns directly for compile-time validation
3. Query execution uses Drizzle's parameterized queries to prevent SQL injection
4. Results maintain type safety from database to API response

### Database Executors
- `PostgresExecutor` - Handles PostgreSQL via postgres.js/Neon drivers
- `SQLiteExecutor` - Handles SQLite via better-sqlite3
- `MySQLExecutor` - Handles MySQL via mysql2
- Auto-detection factory function `createDatabaseExecutor()`

## Development Workflow

### Adding New Features
1. Start with schema updates in test schema (`tests/helpers/schema.ts`)
2. Update core types in `src/server/types.ts` or `src/server/types-drizzle.ts`
3. Implement in executor classes (`src/server/executor*.ts`)
4. Add to compiler (`src/server/compiler.ts`)
5. Update adapter interfaces (`src/adapters/`)
6. Add tests and ensure they pass

### Testing Strategy
- Uses Vitest with PostgreSQL test database
- Docker Compose provides isolated test environment
- Test schema mirrors production patterns
- Tests cover type safety, SQL generation, and query execution

### Build System
- Multiple Vite configurations for different build targets
- TypeScript compilation with `vite-plugin-dts` for type generation
- Separate builds for server, client, and adapters
- ES modules only (no CommonJS support)

## Security Model

### SQL Injection Prevention
- **Never** construct SQL strings manually
- **Always** use Drizzle query builder or parameterized `sql` templates
- Security context is automatically injected into all cube SQL functions
- All user inputs are parameterized through Drizzle

### Multi-tenant Security
- Every cube should filter by `securityContext.organisationId`
- Use `eq(schema.table.organisationId, securityContext.organisationId)` pattern
- Test security isolation thoroughly

## Common Patterns

### Defining Type-Safe Cubes
```typescript
export const employeesCube = defineCube(schema, {
  name: 'Employees',
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.employees)
      .where(eq(schema.employees.organisationId, securityContext.organisationId)),
  dimensions: {
    name: { sql: schema.employees.name, type: 'string' }
  },
  measures: {
    count: { sql: schema.employees.id, type: 'count' }
  }
})
```

### Creating Database Executors
```typescript
const executor = createDatabaseExecutor(drizzleInstance, schema, 'postgres')
const semanticLayer = new SemanticLayerCompiler({ 
  databaseExecutor: executor 
})
```

### Hono API Integration
```typescript
const app = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (c) => ({
    organisationId: c.get('user')?.organisationId
  })
})
```

## Important Notes

- This is a **TypeScript-only** project with strict type checking enabled
- All database operations must go through Drizzle ORM
- The package exports separate entry points for server, client, and adapters
- Backward compatibility with Cube.js API is maintained for easy migration
- Performance relies on Drizzle's prepared statements and connection pooling