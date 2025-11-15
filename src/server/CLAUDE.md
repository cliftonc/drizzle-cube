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

### Cube Joins and Relationships

Cubes can define relationships to other cubes using the `joins` property. Four relationship types are supported:

**Relationship Types:**
- `belongsTo` - Many-to-one (INNER JOIN)
- `hasOne` - One-to-one (LEFT JOIN)
- `hasMany` - One-to-many with pre-aggregation (LEFT JOIN)
- `belongsToMany` - Many-to-many through junction table (LEFT JOIN)

**Basic Join Example:**
```typescript
export const employeesCube = defineCube({
  name: 'Employees',
  sql: (ctx) => ({
    from: employees,
    where: eq(employees.organisationId, ctx.securityContext.organisationId)
  }),

  joins: {
    Departments: {
      targetCube: () => departmentsCube,
      relationship: 'belongsTo',
      on: [
        { source: employees.departmentId, target: departments.id }
      ]
    }
  },

  measures: { /* ... */ },
  dimensions: { /* ... */ }
})
```

**Many-to-Many (belongsToMany) Example:**

Use `belongsToMany` when cubes have a many-to-many relationship through a junction table.

**When to Use belongsToMany vs hasMany:**
- Use `belongsToMany` when a record in cube A can relate to multiple records in cube B, AND a record in cube B can relate to multiple records in cube A (many-to-many)
- Use `hasMany` when a record in cube A can relate to multiple records in cube B, but each record in cube B relates to only one record in cube A (one-to-many)
- Example: An employee can work in multiple departments (via time entries), and each department has multiple employees = `belongsToMany`
- Counter-example: A department has many employees, but each employee belongs to one primary department = `hasMany` from Department, `belongsTo` from Employee

**Implementation:**

```typescript
export const employeesCube = defineCube({
  name: 'Employees',
  sql: (ctx) => ({
    from: employees,
    where: eq(employees.organisationId, ctx.securityContext.organisationId)
  }),

  joins: {
    // Many-to-many relationship through timeEntries junction table
    DepartmentsViaTimeEntries: {
      targetCube: () => departmentsCube,
      relationship: 'belongsToMany',
      on: [], // Not used for belongsToMany
      through: {
        table: timeEntries, // Junction table
        sourceKey: [
          { source: employees.id, target: timeEntries.employeeId }
        ],
        targetKey: [
          { source: timeEntries.departmentId, target: departments.id }
        ],
        // Optional: Security context for junction table
        securitySql: (securityContext) =>
          eq(timeEntries.organisationId, securityContext.organisationId)
      }
    }
  },

  measures: { /* ... */ },
  dimensions: { /* ... */ }
})

// Query across many-to-many relationship
const result = await semanticLayer.execute({
  measures: ['Employees.count'],
  dimensions: ['Departments.name'] // Uses the many-to-many join automatically
}, securityContext)
```

**Key Features:**
- **Automatic Security**: Security context is automatically applied to junction tables when specified
- **Transparent Querying**: Query dimensions from the target cube normally - the system handles the junction table
- **Multi-Column Joins**: Both `sourceKey` and `targetKey` support multiple columns for composite keys
- **Custom Comparators**: Use the `as` property for non-equality joins

**Performance Considerations:**
- Junction tables add an additional JOIN to the query, which may impact performance on large datasets
- Ensure junction tables have proper indexes on both foreign key columns
- Consider adding indexes on frequently filtered columns in the junction table
- Security filtering on junction tables is applied efficiently using parameterized queries
- For optimal performance, ensure the junction table has a composite index on (sourceKey, targetKey)

**Reference Implementation:**
- See @tests/many-to-many-joins.test.ts for comprehensive test examples
- Tests cover security isolation, multi-database compatibility, and edge cases

### Query Execution Pattern
```typescript
// Create semantic layer with database
const semanticLayer = new SemanticLayerCompiler({ drizzle: db, schema })

// Register cubes
semanticLayer.registerCube(employeesCube)

// Execute queries with security context
const result = await semanticLayer.execute({
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

## SQL Object Isolation Pattern

### The Problem: Drizzle SQL Object Mutation

Drizzle ORM's SQL objects are **internally mutable** - their `queryChunks` array can be modified during query construction. When column objects (like `employees.id`) are reused across multiple parts of a query (SELECT, WHERE, GROUP BY), this mutation can cause:
- Duplicate SQL fragments in generated queries
- Incorrect parameter binding order
- Query execution failures

### Evidence from Drizzle Source Code

Investigation of Drizzle ORM revealed:
- SQL objects have a mutable `queryChunks` array (drizzle-orm/src/sql/sql.ts:133)
- The `append()` method directly mutates this array
- No public `clone()` method exists (only internal `SQL.Aliased.clone()`)
- The `sql` template function creates NEW arrays but chunks are pushed by reference

### The Solution: `isolateSqlExpression()` Helper

**Location**: `@src/server/cube-utils.ts`

The `isolateSqlExpression()` function uses **double wrapping** to create complete isolation:

```typescript
export function isolateSqlExpression(expr: AnyColumn | SQL): SQL {
  if (expr && typeof expr === 'object') {
    return sql`${sql`${expr}`}`  // Double wrap
  }
  return expr as SQL
}
```

**Why Double Wrapping?**

- **Single wrap** (`sql`${expr}``): Creates new SQL object but queryChunks contains references to original
- **Double wrap** (`sql`${sql`${expr}`}``): Creates two layers of isolation, completely separating from original object's mutable state

### Usage Guidelines

**ALWAYS use `isolateSqlExpression()` when:**
- SQL expressions may be reused across query contexts
- Column objects are referenced multiple times
- Working with cube SQL definitions

**Example:**
```typescript
export function resolveSqlExpression(
  expr: AnyColumn | SQL | ((ctx: QueryContext) => AnyColumn | SQL),
  ctx: QueryContext
): AnyColumn | SQL {
  const result = typeof expr === 'function' ? expr(ctx) : expr
  return isolateSqlExpression(result)  // Apply isolation
}
```

**Single wrap is OK when:**
- Creating fresh SQL for the first time (e.g., new aggregations)
- Wrapping for grouping/parentheses: `sql`(${filterResult})``
- SQL builder functions already return isolated SQL

### Alternatives Investigated

All alternatives were found to be impractical:

❌ **Use Drizzle's clone()** - Doesn't exist publicly
❌ **Store SQL factory functions** - Still returns same column objects
❌ **Create fresh column references** - Impossible, columns are singletons
❌ **Avoid SQL reuse** - Unavoidable (same dimension in SELECT, WHERE, GROUP BY)

### Performance Impact

- **Memory**: ~200 bytes per wrap (negligible)
- **CPU**: Two function calls during query building (microseconds)
- **No runtime query performance impact** - wrapping happens during build phase

### Testing

Comprehensive tests in `@tests/sql-wrapping.test.ts` verify that:
- Queries with reused dimensions execute correctly
- No SQL corruption occurs across SELECT, WHERE, GROUP BY, ORDER BY
- Complex multi-cube queries handle dimension reuse properly
- Security context isolation works with reused SQL objects

### Future Considerations

If Drizzle ORM adds:
- Immutable SQL objects
- Public `clone()` method
- Different SQL object handling

This pattern may be simplified. Monitor: https://github.com/drizzle-team/drizzle-orm/issues

## Key Files Reference

- @src/server/compiler.ts:76 - Cube registration with validation
- @src/server/executor.ts:45 - Multi-cube query coordination
- @src/server/query-planner.ts:123 - Join detection logic
- @src/server/executors/base-executor.ts:34 - Common executor functionality
- @src/server/types/core.ts:15 - SecurityContext interface
- @src/server/cube-utils.ts:41 - `isolateSqlExpression()` - SQL object isolation pattern
- @src/server/cube-utils.ts:121 - `resolveSqlExpression()` - SQL expression resolver with isolation
- @tests/sql-wrapping.test.ts - Comprehensive tests for SQL object isolation

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