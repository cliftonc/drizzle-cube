# Server Architecture

The server core implements drizzle-cube's semantic layer: a Drizzle-first query engine that compiles semantic queries into type-safe, security-scoped SQL across seven database engines.

## Query Pipeline

```
SemanticQuery
  → SemanticLayerCompiler        (cube registry, validation, metadata cache)
  → QueryExecutor                (mode routing: regular | comparison | funnel | flow | retention)
  → LogicalPlanBuilder           (cube usage, primary-cube selection, joins, CTE decisions)
  → LogicalPlanner               (planning phases)
  → OptimiserPipeline            (optional plan transformations)
  → DrizzlePlanBuilder           (logical → physical plan conversion)
  → DrizzleSqlBuilder            (SQL clause assembly)
  → DatabaseExecutor             (engine-specific execution via adapter)
  → SQL Result
```

Comparison/funnel/flow/retention queries use dedicated builders that bypass the logical plan and go directly through their own SQL generation.

## Directory Layout

```
src/server/
├── compiler.ts              SemanticLayerCompiler (re-exports validateQueryAgainstCubes)
├── executor.ts              QueryExecutor — unified query orchestrator
├── query-validator.ts       validateQueryAgainstCubes (standalone; breaks compiler↔executor cycle)
├── execution/               Execution-phase helpers extracted from QueryExecutor
│   ├── mode-router.ts          ModeRouter — resolve + validate query mode
│   ├── query-result-cache.ts   QueryResultCache — key/lookup/store
│   ├── filter-cache-preloader.ts FilterCachePreloader — pre-build filter SQL
│   ├── annotation-builder.ts   buildAnnotations — UI metadata
│   └── result-post-processor.ts postProcessResultRows — time-dim normalise + gap fill
├── cube-utils.ts            defineCube, isolateSqlExpression, resolveSqlExpression
├── database-utils.ts        createDatabaseAdapter, getSupportedEngines
├── cache-utils.ts           generateCacheKey, normalizeQuery, fnv1aHash
├── filter-cache.ts          FilterCacheManager, flattenFilters
├── gap-filler.ts            generateTimeBuckets, fillTimeSeriesGaps, applyGapFilling
├── template-substitution.ts substituteTemplate, validateTemplateSyntax
├── index.ts                 Public API re-exports
│
├── types/                   Modular type system (12 files)
│   ├── core.ts              SecurityContext, QueryResult, QueryContext
│   ├── cube.ts              Cube definition types
│   ├── query.ts             SemanticQuery, Filter, TimeDimension
│   ├── executor.ts          DatabaseExecutor interface
│   ├── metadata.ts          CubeMetadata, MeasureAnnotation, DimensionAnnotation
│   ├── flow.ts              Flow analysis types
│   ├── funnel.ts            Funnel analysis types
│   ├── retention.ts         Retention analysis types
│   ├── analysis.ts          Analysis mode types
│   ├── cache.ts             CacheConfig, CacheProvider
│   ├── utils.ts             Utility types
│   └── index.ts             Barrel re-exports
│
├── adapters/                Database-specific SQL generation (see adapters/CLAUDE.md)
├── executors/               Database-specific query execution (see adapters/CLAUDE.md)
│
├── logical-plan/            Semantic → logical plan
│   ├── logical-planner.ts   LogicalPlanner — planning phases
│   ├── logical-plan-builder.ts  LogicalPlanBuilder — plan composition + analysis
│   ├── optimiser.ts         PlanOptimiser, OptimiserPipeline, IdentityOptimiser
│   └── types.ts             LogicalNode variants (QueryNode, SimpleSource, CTEPreAggregate, etc.)
│
├── physical-plan/           Logical → Drizzle SQL
│   ├── drizzle-plan-builder.ts  DrizzlePlanBuilder — physical plan from logical plan
│   ├── drizzle-sql-builder.ts   DrizzleSqlBuilder — SQL clause construction
│   └── processors/          Modular physical-plan processors
│       ├── cte-processor.ts      buildCTEState
│       ├── joins-processor.ts    applyJoins
│       ├── predicates-processor.ts  applyPredicatesAndFinalize
│       ├── selection-processor.ts   buildModifiedSelections
│       ├── window-processor.ts      applyPostAggregationWindows
│       └── shared.ts               PhysicalBuildDependencies, getCubesFromPlan
│
├── builders/                Dedicated query builders
│   ├── cte-builder.ts       CTEBuilder
│   ├── comparison-query-builder.ts  ComparisonQueryBuilder
│   ├── funnel-query-builder.ts      FunnelQueryBuilder
│   ├── flow-query-builder.ts        FlowQueryBuilder
│   ├── retention-query-builder.ts   RetentionQueryBuilder
│   ├── filter-builder.ts            FilterBuilder
│   ├── measure-builder.ts           MeasureBuilder
│   ├── group-by-builder.ts          GroupByBuilder
│   └── date-time-builder.ts         DateTimeBuilder
│
├── resolvers/               Cross-cube resolution
│   ├── join-path-resolver.ts          JoinPathResolver
│   ├── calculated-measure-resolver.ts CalculatedMeasureResolver
│   └── index.ts
│
├── cache-providers/         Cache backend implementations
│   └── memory.ts            MemoryCacheProvider
│
├── explain/                 EXPLAIN plan parsers per engine
│   ├── postgres-parser.ts, mysql-parser.ts, sqlite-parser.ts
│   ├── duckdb-parser.ts, databend-parser.ts, snowflake-parser.ts
│   └── index.ts
│
├── prompts/                 AI prompt templates for natural-language query building
│   ├── step0-validation-prompt.ts, step1-shape-prompt.ts, step2-complete-prompt.ts
│   ├── single-step-prompt.ts, explain-analysis-prompt.ts
│   └── types.ts
│
├── agent/                   Agent tool definitions and chat handler
│   └── index.ts             handleAgentChat, getToolDefinitions, createToolExecutor
│
└── ai/                      AI discovery and validation
    ├── discovery.ts, suggestion.ts, validation.ts
    ├── mcp-prompts.ts, schemas.ts
    └── index.ts
```

## Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `SemanticLayerCompiler` | `compiler.ts` | Cube registry, query validation, metadata caching, executor integration |
| `QueryExecutor` | `executor.ts` | Unified query orchestrator — routes to regular/comparison/funnel/flow/retention paths |
| `LogicalPlanBuilder` | `logical-plan/logical-plan-builder.ts` | Builds logical plan with analysis trace |
| `LogicalPlanner` | `logical-plan/logical-planner.ts` | Planning phases: cube usage, primary cube, joins, CTE decisions |
| `DrizzlePlanBuilder` | `physical-plan/drizzle-plan-builder.ts` | Converts logical plan to physical Drizzle query |
| `DrizzleSqlBuilder` | `physical-plan/drizzle-sql-builder.ts` | Assembles SQL clauses (SELECT, WHERE, GROUP BY, ORDER BY) |
| `JoinPathResolver` | `resolvers/join-path-resolver.ts` | Multi-cube join path discovery with query-aware scoring |
| `CalculatedMeasureResolver` | `resolvers/calculated-measure-resolver.ts` | Resolves template-based calculated measures |
| `defineCube` | `cube-utils.ts` | Cube definition helper |
| `isolateSqlExpression` | `cube-utils.ts` | SQL object isolation (prevents Drizzle mutation bugs) |
| `createDatabaseAdapter` | `database-utils.ts` | Adapter factory for all 7 engines |
| `createDatabaseExecutor` | `executors/index.ts` | Executor factory with auto-detection |
| `FilterCacheManager` | `filter-cache.ts` | Caches resolved filter SQL expressions |
| `generateCacheKey` / `fnv1aHash` | `cache-utils.ts` | Query result cache key generation |

## Guard Rails

1. **Drizzle-only SQL** — all SQL goes through Drizzle's query builder; no raw string construction
2. **Mandatory security context** — every cube defines `sql: (securityContext) => ...` row-level filter; enforced at plan time; propagated to all joined tables
3. **Type safety** — cube definitions are validated against Drizzle schema types
4. **Multi-database** — features must work across all 7 engines: postgres, mysql, sqlite, singlestore, duckdb, databend, snowflake
5. **SQL object isolation** — reused column/SQL expressions are double-wrapped via `isolateSqlExpression` to prevent Drizzle's mutable `queryChunks` from causing corruption across SELECT/WHERE/GROUP BY

## SQL Object Isolation

Drizzle SQL objects have a mutable `queryChunks` array. When the same column is reused across query clauses, mutation can corrupt the generated SQL. The `isolateSqlExpression` function in `cube-utils.ts` applies double wrapping (`sql\`${sql\`${expr}\`}\``) to create full isolation. Always use it when SQL expressions are reused across contexts. See tests in `tests/sql-wrapping.test.ts`.

## Multi-Cube Joins

The `JoinPathResolver` traverses cube join definitions to find paths between cubes. Key behaviors:
- Star schema (fact → dimension → fact) requires `hasMany` back-references on dimension cubes
- `belongsToMany` uses junction tables with optional security filtering
- Join-path scoring uses `preferredFor` hints and query-member cube hints
- Path decisions are surfaced in dry-run analysis metadata

## Supported Engines

postgres · mysql · sqlite · singlestore · duckdb · databend · snowflake

All adapter and executor implementations live under `adapters/` and `executors/` respectively. See `adapters/CLAUDE.md` for details.
