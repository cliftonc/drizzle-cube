# Server Architecture

This document describes the core server architecture of drizzle-cube, focusing on patterns and conventions that should be maintained for consistency.

## Overview

The server core is the heart of drizzle-cube's semantic layer, built around a **Drizzle-first** architecture that ensures type safety, security, and performance. All SQL generation flows through Drizzle ORM's query builder to maintain security and type safety.

## Core Architecture Flow

```
SemanticQuery → Compiler → Query Planner → Database Executor → SQL Result
                    ↓
               Cube Registry ← Security Context
```

## Key Components

### 1. SemanticLayerCompiler (`compiler.ts`)

**Purpose**: Central registry and orchestrator for semantic cubes
**Key responsibilities**:
- Cube registration and management
- Query validation and metadata caching
- Database executor integration

**Core Pattern**:
```typescript
const compiler = new SemanticLayerCompiler({
  drizzle: db,
  schema: schema,
  engineType: 'postgres' // or auto-detected
})

// Register cubes with security context requirement
compiler.registerCube(defineCube({
  name: 'Employees',
  sql: (securityContext) => eq(employees.organisationId, securityContext.organisationId),
  measures: { /* ... */ },
  dimensions: { /* ... */ }
}))
```

### 2. Database Executors (`executors/`)

**Purpose**: Database-specific query execution with auto-detection
**Structure**:
- `BaseDatabaseExecutor` - Common functionality
- `PostgresExecutor` - PostgreSQL-specific implementation
- `MySQLExecutor` - MySQL-specific implementation  
- `SQLiteExecutor` - SQLite-specific implementation

**Auto-detection Pattern**:
```typescript
// Automatically detects database type from Drizzle instance
const executor = createDatabaseExecutor(drizzleDb, schema)

// Or explicit type specification
const executor = createDatabaseExecutor(drizzleDb, schema, 'postgres')
```

**Key Pattern**: Each executor contains a database adapter for SQL generation differences.

### 3. Query Planning (`query-planner.ts`)

**Purpose**: Intelligent multi-cube query planning and join optimization
**Key features**:
- Automatic join detection and CTE generation
- Multi-cube query merging
- Security context propagation across all tables

**Core Pattern**:
```typescript
// Handles complex multi-cube scenarios
const planner = new QueryPlanner(cubesMap, databaseExecutor)
const plan = planner.planQuery(semanticQuery, securityContext)
```

### 4. Query Execution (`executor.ts`)

**Purpose**: Execute planned queries with proper SQL generation
**Pattern**: Always delegates to database-specific adapters for SQL differences while maintaining business logic separation.

### 5. Type System (`types/`)

**Modular Type Architecture**:
- `core.ts` - Fundamental interfaces (SecurityContext, QueryResult, etc.)
- `cube.ts` - Cube definition types
- `query.ts` - Query structure types  
- `executor.ts` - Database executor interfaces
- `metadata.ts` - Metadata and annotation types

## Security Architecture

### Mandatory Security Context

**Rule**: Every cube MUST implement security filtering through the `sql` function:

```typescript
defineCube({
  name: 'SensitiveData',
  sql: (securityContext) => {
    // REQUIRED: Filter by organization/tenant
    return eq(table.organisationId, securityContext.organisationId)
  },
  measures: { /* ... */ }
})
```

**Why**: 
- Prevents data leakage between tenants
- Enforced at the query planning level
- Cannot be bypassed in multi-cube queries

### SQL Injection Prevention

**Patterns to ALWAYS follow**:
```typescript
// ✅ CORRECT - Use Drizzle query builder
const query = db.select().from(table).where(eq(table.id, userId))

// ✅ CORRECT - Use parameterized sql template - ONLY WHEN LAST RESORT
const customFilter = sql`${table.status} IN ${[status1, status2]}`

// ❌ WRONG - Never construct SQL strings
const badQuery = sql.raw(`SELECT * FROM ${tableName} WHERE id = ${userId}`)
```

## Database Adapter Integration

### Purpose
Handle SQL generation differences between PostgreSQL, MySQL, and SQLite while keeping business logic database-agnostic.

### Pattern
```typescript
// In query executor
const timeSql = this.databaseAdapter.buildTimeDimension(column, 'day')
const avgSql = this.databaseAdapter.buildAvg(column, 'metric')
```

### What Goes in Adapters
- Time dimension truncation (DATE_TRUNC vs DATE_FORMAT vs date functions)
- String operations (ILIKE vs LOWER+LIKE)
- Type casting (:: vs CAST AS)
- Null handling (COALESCE vs IFNULL)

### What Stays in Core Code
- Basic aggregations (`count()`, `sum()`, `min()`, `max()`)
- Standard WHERE conditions (`eq()`, `gt()`, `lt()`)
- JOINs and basic SQL structure

## Multi-Cube Query Handling

### Join Detection
The system automatically detects when multiple cubes need JOINs and when to use CTEs:

```typescript
// Single cube - direct query
{ measures: ['Employees.count'] }

// Multi-cube with relationship - JOIN
{ measures: ['Employees.count'], dimensions: ['Departments.name'] }

// Multi-cube hasMany - CTE required
{ measures: ['Employees.count', 'Productivity.totalLines'] }
```

### Security Context Propagation
Security filtering is applied to ALL tables in multi-cube queries, preventing data leakage through JOINs.

## Query Validation

### Validation Levels
1. **Structure Validation** - Query format and required fields
2. **Field Existence** - All referenced measures/dimensions exist
3. **Security Context** - Required for all cubes
4. **Type Safety** - Drizzle schema compatibility

## Performance Patterns

### Metadata Caching
```typescript
// Cached for 5 minutes to reduce compilation overhead
private metadataCache?: CubeMetadata[]
private metadataCacheTimestamp?: number
```

### Prepared Statements
All queries use Drizzle's prepared statement system automatically.

### Connection Pooling
Leverages underlying Drizzle database driver pooling.

## Development Patterns

### Adding New Features

1. **Extend Types** - Add interfaces to appropriate `types/*.ts` file
2. **Update Executors** - Implement in base class, override in database-specific classes if needed
3. **Update Compiler** - Add registration/validation logic
4. **Database Adapters** - Only if SQL generation differs between databases
5. **Tests** - Add multi-database test coverage

### Cube Definition Pattern
```typescript
export const employeesCube = defineCube({
  name: 'Employees',
  sql: (securityContext) => eq(employees.organisationId, securityContext.organisationId),
  
  measures: {
    count: {
      type: 'count',
      sql: () => employees.id
    },
    averageSalary: {
      type: 'avg', 
      sql: () => employees.salary
    }
  },
  
  dimensions: {
    name: {
      type: 'string',
      sql: () => employees.name
    },
    createdAt: {
      type: 'time',
      sql: () => employees.createdAt
    }
  }
})
```

### Query Execution Pattern
```typescript
// Create semantic layer with database
const semanticLayer = new SemanticLayerCompiler({ drizzle: db, schema })

// Register cubes
semanticLayer.registerCube(employeesCube)

// Execute queries with security context
const result = await semanticLayer.query({
  measures: ['Employees.count'],
  dimensions: ['Employees.name']
}, securityContext)
```

## Error Handling

### Common Error Categories
- **Validation Errors** - Invalid query structure or missing fields
- **Security Errors** - Missing or invalid security context
- **SQL Errors** - Database-specific execution errors
- **Type Errors** - Schema mismatches

### Error Context
All errors include:
- Query context information
- Security context status
- Database engine type
- Affected cubes

## Key Files Reference

- @src/server/compiler.ts:76 - Cube registration with validation
- @src/server/executor.ts:45 - Multi-cube query coordination  
- @src/server/query-planner.ts:123 - Join detection logic
- @src/server/executors/base-executor.ts:34 - Common executor functionality
- @src/server/types/core.ts:15 - SecurityContext interface
- @src/server/cube-utils.ts:67 - Cube definition utilities

## Integration Points

### With Adapters
Server provides `SemanticLayerCompiler` instances to framework adapters via their constructors.

### With Client
Server generates metadata that client components use for query building and visualization.

### With Database
All database operations flow through Drizzle ORM instances with proper schema typing.

## Guard Rails

1. **Never bypass Drizzle** - All SQL must go through Drizzle query builder
2. **Security context is mandatory** - Cannot execute queries without it
3. **Type safety required** - All cube definitions must match schema types  
4. **Multi-database support** - New features must work across PostgreSQL, MySQL, SQLite
5. **Performance first** - Consider query planning impact for new features