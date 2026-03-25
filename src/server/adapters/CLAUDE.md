# Database Adapters & Executors

Adapters handle SQL dialect differences; executors handle database-specific query execution. Both follow a base-class + per-engine pattern.

## Engines (7)

| Engine | Adapter | Executor | Notes |
|--------|---------|----------|-------|
| PostgreSQL | `PostgresAdapter` | `PostgresExecutor` | `DATE_TRUNC`, `ILIKE`, `::` casting |
| MySQL | `MySQLAdapter` | `MySQLExecutor` | `DATE_FORMAT`, `LOWER()+LIKE`, `CAST()` |
| SQLite | `SQLiteAdapter` | `SQLiteExecutor` | `date()` modifiers, `LOWER()+LIKE`, `CAST()` |
| SingleStore | `SingleStoreAdapter` (extends `MySQLAdapter`) | `SingleStoreExecutor` (extends `MySQLExecutor`) | MySQL-compatible with overrides |
| DuckDB | `DuckDBAdapter` | `DuckDBExecutor` | `DATE_TRUNC`, `ILIKE`, `::` casting |
| Databend | `DatabendAdapter` | `DatabendExecutor` | `DATE_TRUNC`-style, `CAST()` |
| Snowflake | `SnowflakeAdapter` | `SnowflakeExecutor` | `DATE_TRUNC`, `ILIKE`, `::` casting |

## Architecture

```
DatabaseAdapter (interface)  ← base-adapter.ts
  └── BaseDatabaseAdapter (abstract)
        ├── PostgresAdapter
        ├── MySQLAdapter
        │     └── SingleStoreAdapter
        ├── SQLiteAdapter
        ├── DuckDBAdapter
        ├── DatabendAdapter
        └── SnowflakeAdapter

DatabaseExecutor (interface)  ← types/executor.ts
  └── BaseDatabaseExecutor (abstract)  ← executors/base-executor.ts
        ├── PostgresExecutor
        ├── MySQLExecutor
        │     └── SingleStoreExecutor
        ├── SQLiteExecutor
        ├── DuckDBExecutor
        ├── DatabendExecutor
        └── SnowflakeExecutor
```

## Adapter Responsibilities

Adapters handle **only** operations that differ between databases:

| Method | What varies |
|--------|------------|
| `buildTimeDimension` | `DATE_TRUNC` vs `DATE_FORMAT` vs `date()` modifiers |
| `buildStringCondition` | `ILIKE` vs `LOWER()+LIKE` |
| `castToType` | `::type` vs `CAST(x AS type)` |
| `buildAvg` | `COALESCE` vs `IFNULL` for null handling |
| `buildBooleanLiteral` | `TRUE/FALSE` vs `1/0` |
| `buildCaseWhen` | Until Drizzle adds native CASE support |

Standard aggregations (`count`, `sum`, `min`, `max`) use Drizzle functions directly — they are **not** adapter methods.

## Factories

- `createDatabaseAdapter(engineType)` — in `database-utils.ts`, returns the correct adapter
- `createDatabaseExecutor(db, schema, engineType?)` — in `executors/index.ts`, returns the correct executor with auto-detection if `engineType` is omitted
- `getSupportedEngines()` — returns all 7 engine type strings

## Executor–Adapter Relationship

Each `BaseDatabaseExecutor` holds an adapter instance. The `QueryExecutor` (in `executor.ts`) receives both a `DatabaseExecutor` (runs queries) and a `DatabaseAdapter` (generates engine-specific SQL) and delegates SQL generation to the adapter.

## Key Interfaces

- `DatabaseAdapter` — defined in `base-adapter.ts`; declares all adapter methods
- `DatabaseCapabilities` — feature flags per engine (window functions, CTEs, etc.)
- `DatabaseExecutor` — defined in `types/executor.ts`; declares query execution contract
- `BaseDatabaseExecutor` — abstract base in `executors/base-executor.ts`

## File Layout

```
adapters/
├── base-adapter.ts           DatabaseAdapter interface, BaseDatabaseAdapter, DatabaseCapabilities
├── postgres-adapter.ts       PostgresAdapter
├── mysql-adapter.ts          MySQLAdapter
├── sqlite-adapter.ts         SQLiteAdapter
├── singlestore-adapter.ts    SingleStoreAdapter (extends MySQLAdapter)
├── duckdb-adapter.ts         DuckDBAdapter
├── databend-adapter.ts       DatabendAdapter
└── snowflake-adapter.ts      SnowflakeAdapter

executors/
├── base-executor.ts          BaseDatabaseExecutor
├── postgres-executor.ts      PostgresExecutor
├── mysql-executor.ts         MySQLExecutor
├── sqlite-executor.ts        SQLiteExecutor
├── singlestore-executor.ts   SingleStoreExecutor (extends MySQLExecutor)
├── duckdb-executor.ts        DuckDBExecutor
├── databend-executor.ts      DatabendExecutor
├── snowflake-executor.ts     SnowflakeExecutor
└── index.ts                  createDatabaseExecutor factory
```
