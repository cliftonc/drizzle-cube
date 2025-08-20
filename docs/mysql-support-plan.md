# MySQL Support Implementation Plan - Database Adapter Extraction Pattern

## Overview
Add MySQL support to drizzle-cube by first extracting existing PostgreSQL-specific logic into proper adapters, then creating parallel MySQL adapters. This approach ensures zero code duplication and clean separation of database-specific concerns.

## Architecture Design

### Current State Problem
- PostgreSQL-specific logic is **embedded directly** in shared code (`executor.ts`, `multi-cube-builder.ts`)
- Hardcoded `DATE_TRUNC`, `ILIKE`, `::timestamp` in shared query building logic
- The existing `PostgresExecutor` class only handles connection/result conversion, not SQL dialect differences

### Proposed Solution  
- **Extract PostgreSQL logic first** into proper `PostgresAdapter`
- **Create parallel `MySQLAdapter`** following same pattern
- **Database adapters handle SQL generation**, executors handle connection/results
- **Shared code uses adapter interface**, no database-specific logic

## Implementation Phases

### Phase 1: Extract PostgreSQL Logic (REFACTOR FIRST)
**Goal**: Move hardcoded PostgreSQL SQL from shared code into dedicated adapter

1. **Create adapter structure**:
   - `src/server/adapters/base-adapter.ts` - Interface definition
   - `src/server/adapters/postgres-adapter.ts` - PostgreSQL SQL generation
   
2. **Extract from shared code**:
   - Move `DATE_TRUNC` logic from `executor.ts:649-670` to PostgresAdapter
   - Move `ILIKE` logic from `executor.ts:807-813` to PostgresAdapter  
   - Move `::timestamp` casting logic to PostgresAdapter
   - Move equivalent logic from `multi-cube-builder.ts:306-320, 468-474`

3. **Update shared code**:
   - Replace hardcoded SQL in `executor.ts` with `this.databaseAdapter.buildTimeDimension()`
   - Replace hardcoded SQL in `multi-cube-builder.ts` with adapter method calls
   - Inject adapter into query building classes

### Phase 2: Create MySQL Adapter (NEW)
**Goal**: Implement MySQL-specific SQL generation following PostgreSQL adapter pattern

1. **Create `src/server/adapters/mysql-adapter.ts`**:
   - Implement same interface as PostgresAdapter
   - MySQL equivalents: `DATE_FORMAT()`, `LIKE`, `CAST()` functions
   - Handle MySQL-specific time granularity formatting
   
2. **MySQL-specific implementations**:
   ```typescript
   // PostgreSQL: DATE_TRUNC('day', field::timestamp)
   // MySQL: DATE_FORMAT(field, '%Y-%m-%d')
   buildTimeDimension(granularity, expr) {
     const formatMap = { 
       day: '%Y-%m-%d', 
       month: '%Y-%m-01',
       year: '%Y-01-01'
     }
     return sql`DATE_FORMAT(${expr}, ${formatMap[granularity]})`
   }
   ```

### Phase 3: Database Adapter Factory
**Goal**: Clean dependency injection of appropriate adapters

1. **Create `src/server/database-utils.ts`** (factory pattern):
   ```typescript
   export function createDatabaseAdapter(engineType: 'postgres' | 'mysql' | 'sqlite') {
     switch(engineType) {
       case 'postgres': return new PostgresAdapter()
       case 'mysql': return new MySQLAdapter()
       case 'sqlite': return new SQLiteAdapter()
     }
   }
   ```

2. **Update executor constructors** to inject adapters:
   - `PostgresExecutor` gets `PostgresAdapter` instance
   - `MySQLExecutor` gets `MySQLAdapter` instance (enhanced)
   - `SQLiteExecutor` gets `SQLiteAdapter` instance

### Phase 4: MySQL Test Infrastructure
**Goal**: Enable testing MySQL alongside PostgreSQL with same test suite

1. **Docker setup**:
   - Add MySQL 8.0 service to `docker-compose.yml`
   - Configure port 3306, proper credentials and networking
   
2. **Test utilities**:
   - Extend `tests/helpers/test-database.ts` with MySQL support
   - Add `createMySQLTestDatabase()` function
   - Parameterize tests to run against both databases
   
3. **Test scripts**:
   - Add `test:mysql` and `test:multi-db` npm scripts
   - Update CI to test both database types

## File Structure After Implementation
```
src/server/
├── adapters/
│   ├── base-adapter.ts        # DatabaseAdapter interface
│   ├── postgres-adapter.ts    # Extracted PostgreSQL SQL logic
│   ├── mysql-adapter.ts       # New MySQL SQL logic
│   └── sqlite-adapter.ts      # Future SQLite support
├── database-utils.ts          # Adapter factory
├── executor.ts                # Uses this.databaseAdapter methods
├── multi-cube-builder.ts      # Uses this.databaseAdapter methods  
└── types.ts                   # Enhanced executors with adapter injection

tests/
├── helpers/
│   └── test-database.ts       # Multi-database test utilities
└── docker-compose.yml         # PostgreSQL + MySQL services
```

## Success Criteria
1. **Clean extraction**: All PostgreSQL-specific SQL moved to PostgresAdapter
2. **Zero duplication**: Shared code has no hardcoded database-specific logic
3. **Parallel implementation**: MySQLAdapter implements same interface as PostgresAdapter
4. **Test coverage**: Same test suite passes on both PostgreSQL and MySQL
5. **Backward compatibility**: All existing PostgreSQL functionality unchanged
6. **Extensibility**: Framework ready for additional database support (SQLite, etc.)

## Key Benefits
- **Maintainability**: Database differences isolated to small, focused adapters
- **Testability**: Adapters can be unit tested independently  
- **Performance**: No runtime overhead, adapters resolved at executor creation
- **Extensibility**: Adding new databases requires only new adapter implementation
- **Code Quality**: Eliminates hardcoded SQL scattered throughout shared code

This extraction-first approach ensures we properly separate concerns before adding MySQL support, resulting in a clean, maintainable architecture.