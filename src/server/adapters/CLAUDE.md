# Database Adapter Architecture

This document provides comprehensive guidance for understanding and extending the database adapter system in drizzle-cube. The adapter pattern enables support for multiple database engines while maintaining type safety and clean separation of concerns.

## Overview

The database adapter system allows drizzle-cube to support multiple database engines (PostgreSQL, MySQL, and SQLite) by abstracting **only truly database-specific** SQL generation from the core business logic. Adapters should NOT duplicate functionality that Drizzle ORM already provides in a database-agnostic way.

### Key Principle: Minimize Adapter Responsibilities

**Adapters should ONLY handle operations that differ between databases**. If Drizzle ORM provides a database-agnostic function (like `count()`, `sum()`, `eq()`, etc.), use it directly in the main code rather than wrapping it in an adapter method.

### Design Principles

1. **Clean Separation**: Business logic is completely separated from database-specific SQL generation
2. **Type Safety**: Full TypeScript support with Drizzle ORM integration maintained
3. **Extensibility**: New databases can be added by implementing the adapter interface
4. **Security**: All SQL generation goes through parameterized Drizzle queries
5. **Auto-Detection**: Intelligent database type detection based on available methods

## Architecture

### Core Components

**Base Adapter** (`base-adapter.ts`):
- `DatabaseAdapter` interface defines the contract for all adapters
- `BaseDatabaseAdapter` abstract class provides common functionality
- Type definitions for database engines and adapter operations

**Concrete Adapters**:
- `PostgresAdapter` - PostgreSQL-specific implementations
- `MySQLAdapter` - MySQL-specific implementations  
- SQLite adapter (planned)

**Integration Points**:
- `DatabaseExecutor` classes contain adapter instances
- `QueryExecutor` and `MultiCubeBuilder` use adapters for SQL generation
- Factory functions handle adapter creation and selection

### Adapter Interface (Simplified)

The `DatabaseAdapter` interface should ONLY contain truly database-specific operations:

**What SHOULD be in adapters:**
- `buildTimeDimension()` - Date truncation varies significantly (DATE_TRUNC vs DATE_FORMAT vs datetime modifiers)
- `buildStringCondition()` - Case-insensitive matching differs (ILIKE vs LOWER+LIKE)
- `castToType()` - Type casting syntax differs (::type vs CAST AS type)
- `buildAvg()` - Null handling functions differ (COALESCE vs IFNULL)
- `buildBooleanLiteral()` - Boolean representation differs (TRUE/FALSE vs 1/0)
- `buildCaseWhen()` - Until Drizzle adds native CASE support

**What should NOT be in adapters (use Drizzle functions directly):**
- ~~`buildCount()`~~ → Use `count()` from drizzle-orm
- ~~`buildCountDistinct()`~~ → Use `countDistinct()` from drizzle-orm  
- ~~`buildSum()`~~ → Use `sum()` from drizzle-orm
- ~~`buildMin()`~~ → Use `min()` from drizzle-orm
- ~~`buildMax()`~~ → Use `max()` from drizzle-orm
- ~~`buildArithmetic()`~~ → Use native operators with Drizzle
- ~~`buildNegation()`~~ → Use `not()` from drizzle-orm

### Database Engine Types

```typescript
type DatabaseEngine = 'postgres' | 'mysql' | 'sqlite';
```

## Current Implementations

### PostgreSQL Adapter

**Time Dimensions**:
- Uses `DATE_TRUNC` with explicit casting: `DATE_TRUNC('day', ${column}::timestamp)`
- Supports all granularities: second, minute, hour, day, week, month, quarter, year

**String Operations**:
- Leverages PostgreSQL's `ILIKE` for case-insensitive matching
- Direct regex support with `~*` operator

**Aggregations**:
- Uses `COALESCE(AVG(...), 0)` for null handling in averages
- PostgreSQL-specific casting syntax with `::` operator

**Type Casting**:
```typescript
castToType(column: SQL<any>, targetType: string): SQL<any> {
  return sql`${column}::${sql.raw(targetType)}`;
}
```

### MySQL Adapter

**Time Dimensions**:
- Complex handling using `DATE_FORMAT`, `QUARTER()`, and `MAKEDATE()`
- Special quarter calculation: `CONCAT(YEAR(${column}), '-Q', QUARTER(${column}))`
- Week handling: `YEARWEEK(${column}, 1)` for ISO week numbers

**String Operations**:
- Uses `LOWER()` + `LIKE` combination for guaranteed case-insensitive matching
- Pattern escaping for special characters

**Aggregations**:
- Uses `IFNULL(AVG(...), 0)` instead of `COALESCE`
- `CAST()` function syntax instead of `::` operator

**Type Casting**:
```typescript
castToType(column: SQL<any>, targetType: string): SQL<any> {
  return sql`CAST(${column} AS ${sql.raw(targetType)})`;
}
```

### Key Differences Between Adapters

| Feature | PostgreSQL | MySQL |
|---------|------------|-------|
| Time Truncation | `DATE_TRUNC()` | `DATE_FORMAT()`, `QUARTER()` |
| Case-insensitive | `ILIKE` | `LOWER()` + `LIKE` |
| Casting | `column::type` | `CAST(column AS type)` |
| Null Handling | `COALESCE()` | `IFNULL()` |
| Quarter Format | `2023-Q1` | `2023-Q1` (computed) |

## Creating New Adapters

### Step 1: Implement the Interface

Create a new adapter class extending `BaseDatabaseAdapter`:

```typescript
export class SQLiteAdapter extends BaseDatabaseAdapter {
  getEngineType(): DatabaseEngine {
    return 'sqlite';
  }

  buildTimeDimension(column: SQL<any>, granularity: TimeGranularity): SQL<any> {
    switch (granularity) {
      case 'day':
        return sql`DATE(${column})`;
      case 'month':  
        return sql`DATE(${column}, 'start of month')`;
      // ... other granularities
      default:
        throw new Error(`Unsupported granularity: ${granularity}`);
    }
  }

  buildStringCondition(column: SQL<any>, operator: StringOperator, value: string): SQL<any> {
    switch (operator) {
      case 'contains':
        return sql`LOWER(${column}) LIKE ${'%' + value.toLowerCase() + '%'}`;
      // ... other operators
    }
  }

  // Implement other required methods...
}
```

### Step 2: Register in Factory

Update `database-utils.ts`:

```typescript
export function createDatabaseAdapter(engineType: DatabaseEngine): DatabaseAdapter {
  switch (engineType) {
    case 'postgres':
      return new PostgresAdapter();
    case 'mysql':
      return new MySQLAdapter();
    case 'sqlite':
      return new SQLiteAdapter(); // Add this
    default:
      throw new Error(`Unsupported database engine: ${engineType}`);
  }
}

export function getSupportedEngines(): DatabaseEngine[] {
  return ['postgres', 'mysql', 'sqlite']; // Add 'sqlite'
}
```

### Step 3: Update Auto-Detection

Modify the executor factory in `types.ts` if needed for database detection:

```typescript
export function createDatabaseExecutor<TSchema extends Record<string, unknown>>(
  db: DrizzleDb,
  schema: TSchema,
  engineType?: DatabaseEngine
): DatabaseExecutor<TSchema> {
  if (engineType) {
    // Use provided engine type
  } else {
    // Auto-detection logic
    if ('all' in db && 'run' in db) {
      return new SQLiteExecutor(db as any, schema);
    }
    // ... existing logic
  }
}
```

### Step 4: Add Testing Support

1. **Test Schema**: Create database-specific schema in test helpers
2. **Test Configuration**: Add to environment variable handling
3. **Docker Setup**: Add service to docker-compose if needed
4. **Test Commands**: Add npm scripts for the new database

## Testing Architecture

### Multi-Database Testing

The testing system supports running tests against multiple databases:

**Environment Control**:
- `TEST_DB_TYPE`: Controls which database to test ('postgres' | 'mysql' | 'both')
- Database-specific connection URLs with safety checks

**Test Commands**:
```bash
npm test                    # PostgreSQL only (default)
npm run test:mysql         # MySQL only  
npm run test:all           # Both databases sequentially
TEST_DB_TYPE=mysql npm test # Explicit database selection
```

### Test Database Setup

**PostgreSQL**:
- URL: `TEST_DATABASE_URL` (default: `postgres://test:test@localhost:5433/test`)
- Docker: `postgres:15` on port 5433

**MySQL**:
- URL: `MYSQL_TEST_DATABASE_URL` (default: `mysql://test:test@localhost:3307/test`)
- Docker: `mysql:8.0` on port 3307

### Safety Mechanisms

- All test database URLs must contain "test" substring
- Separate ports prevent conflicts with production databases
- Fresh connections and data seeding per test for isolation

### Adding Database to Tests

1. **Add Schema**: Create schema file in `tests/helpers/schema-{database}.ts`
2. **Add Setup**: Create setup utility in `tests/helpers/setup-{database}.ts`
3. **Update Global Setup**: Add to `tests/setup-global.ts`
4. **Environment Variables**: Add URL configuration
5. **Docker Compose**: Add service definition if needed

## Configuration

### Environment Variables

**Database URLs**:
- `TEST_DATABASE_URL` - PostgreSQL test database
- `MYSQL_TEST_DATABASE_URL` - MySQL test database
- Additional URLs can be added for new databases

**Test Control**:
- `TEST_DB_TYPE` - Controls which database(s) to test against

### Database Selection

**Automatic Detection**:
```typescript
const executor = createDatabaseExecutor(drizzleInstance, schema);
// Auto-detects based on drizzle instance methods
```

**Explicit Selection**:
```typescript
const executor = createDatabaseExecutor(drizzleInstance, schema, 'mysql');
// Forces specific adapter
```

**Factory Pattern**:
```typescript
const adapter = createDatabaseAdapter('postgres');
const executor = new PostgresExecutor(db, schema, adapter);
```

## Integration with Core System

### Executor Integration

Each `DatabaseExecutor` contains an adapter instance:

```typescript
export abstract class BaseDatabaseExecutor<TSchema extends Record<string, unknown>> {
  protected databaseAdapter: DatabaseAdapter;
  
  constructor(
    protected db: DrizzleDb,
    protected schema: TSchema,
    databaseAdapter?: DatabaseAdapter
  ) {
    this.databaseAdapter = databaseAdapter || createDatabaseAdapter(this.getEngineType());
  }
}
```

### Query Builder Integration

The `QueryExecutor` and `MultiCubeBuilder` receive adapters for SQL generation:

```typescript
export class QueryExecutor<TSchema extends Record<string, unknown>> {
  constructor(
    private databaseExecutor: DatabaseExecutor<TSchema>,
    private databaseAdapter: DatabaseAdapter
  ) {}
  
  private buildTimeDimension(column: SQL<any>, granularity: TimeGranularity): SQL<any> {
    return this.databaseAdapter.buildTimeDimension(column, granularity);
  }
}
```

### SQL Generation Flow

1. **Business Logic**: Determines what needs to be generated (time dimension, aggregation, etc.)
2. **Adapter Call**: Delegates to appropriate adapter method
3. **Database-Specific SQL**: Adapter generates SQL using Drizzle `sql` template
4. **Query Execution**: Drizzle executes with proper parameterization

## Best Practices

### Adapter Implementation

1. **Always use Drizzle `sql` templates** for SQL generation
2. **Parameterize all values** - never concatenate strings
3. **Handle null values** appropriately for aggregations
4. **Test extensively** with real database instances
5. **Document database-specific behaviors** and limitations

### SQL Generation

```typescript
// Good - parameterized with Drizzle sql template
buildStringCondition(column: SQL<any>, operator: StringOperator, value: string): SQL<any> {
  return sql`LOWER(${column}) LIKE ${`%${value.toLowerCase()}%`}`;
}

// Bad - string concatenation (security risk)
buildStringCondition(column: SQL<any>, operator: StringOperator, value: string): SQL<any> {
  return sql.raw(`LOWER(${column}) LIKE '%${value.toLowerCase()}%'`);
}
```

### Error Handling

```typescript
buildTimeDimension(column: SQL<any>, granularity: TimeGranularity): SQL<any> {
  switch (granularity) {
    case 'day':
      return sql`DATE_TRUNC('day', ${column}::timestamp)`;
    // ... other cases
    default:
      throw new Error(`Unsupported time granularity '${granularity}' for PostgreSQL`);
  }
}
```

### Testing

1. **Test each adapter independently** with its target database
2. **Verify SQL generation** produces correct syntax
3. **Test edge cases** like null values, special characters
4. **Performance test** with realistic data volumes
5. **Cross-database consistency** - ensure same logical results

## Future Enhancements

### Planned Features

1. **SQLite Adapter**: Complete implementation for embedded use cases
2. **Query Optimization**: Database-specific optimization hints
3. **Connection Pooling**: Adapter-level pooling configuration
4. **Custom Functions**: Support for database-specific functions
5. **Migration Tools**: Schema migration utilities per database

### Extension Points

1. **Custom Aggregations**: New aggregation functions
2. **Time Zone Handling**: Database-specific time zone support  
3. **JSON Operations**: Database-specific JSON query support
4. **Full-Text Search**: Database-specific search capabilities
5. **Spatial Data**: GIS and spatial query support

## Troubleshooting

### Common Issues

**Adapter Not Found**:
- Ensure adapter is registered in `createDatabaseAdapter` factory
- Check `getSupportedEngines()` includes your database

**SQL Syntax Errors**:
- Verify adapter generates valid SQL for target database
- Test SQL manually in database console
- Check parameterization is correct

**Test Failures**:
- Ensure test database is running and accessible
- Check environment variables are set correctly
- Verify schema matches between databases

**Auto-Detection Issues**:
- Check Drizzle instance has expected methods
- Consider explicit engine type in executor creation
- Verify database connection is established

### Debug Tips

1. **Log generated SQL** to see what adapters produce
2. **Run tests individually** to isolate issues
3. **Use database console** to verify SQL syntax
4. **Check connection strings** for test environments
5. **Monitor Docker containers** for database availability