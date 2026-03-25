# Query Builders

Modular SQL construction classes for query clauses and dedicated analysis modes. Each builder encapsulates one aspect of SQL generation: clause-level builders (filter, measure, group-by, date-time, CTE) compose into the main query pipeline, while analysis builders (comparison, funnel, flow, retention) produce complete standalone queries that bypass the logical plan.

## Directory Layout

```
src/server/builders/
├── index.ts                       Barrel re-exports all builders
├── cte-builder.ts                 CTEBuilder — CTE/subquery SQL construction
├── comparison-query-builder.ts    ComparisonQueryBuilder — period-over-period comparison
├── funnel-query-builder.ts        FunnelQueryBuilder — multi-step conversion funnels
├── flow-query-builder.ts          FlowQueryBuilder — user path/journey analysis
├── retention-query-builder.ts     RetentionQueryBuilder — cohort retention analysis
├── filter-builder.ts              FilterBuilder — WHERE clause generation
├── measure-builder.ts             MeasureBuilder — SELECT aggregate expressions
├── group-by-builder.ts            GroupByBuilder — GROUP BY clause generation
└── date-time-builder.ts           DateTimeBuilder — time bucketing and date filters
```

## Key Components

| Component | Purpose |
|-----------|---------|
| `CTEBuilder` | Builds CTE (WITH clause) subqueries for pre-aggregation patterns |
| `ComparisonQueryBuilder` | Generates side-by-side period comparison queries (e.g. this week vs last week) |
| `FunnelQueryBuilder` | Multi-step funnel SQL with window functions for conversion analysis |
| `FlowQueryBuilder` | User journey path SQL with LAG/LEAD window functions |
| `RetentionQueryBuilder` | Cohort-based retention SQL with configurable granularity |
| `FilterBuilder` | Translates semantic filter definitions into SQL WHERE predicates |
| `MeasureBuilder` | Resolves measure definitions into SELECT expressions (count, sum, avg, custom SQL) |
| `GroupByBuilder` | Builds GROUP BY clauses from dimension references |
| `DateTimeBuilder` | Time-bucketing expressions and date range filters, engine-aware |

## Architecture Notes

- **Clause builders** (Filter, Measure, GroupBy, DateTime, CTE) are used by `DrizzleSqlBuilder` in the physical-plan pipeline
- **Analysis builders** (Comparison, Funnel, Flow, Retention) are invoked directly by `QueryExecutor` — they produce complete SQL without going through the logical plan
- All builders receive a database adapter to produce engine-specific SQL (date functions, window syntax, etc.)
- Builder classes are stateless — they take inputs and return SQL fragments or complete queries

## Guard Rails

1. All SQL output uses Drizzle query builder — no raw string concatenation
2. Engine-specific date/time handling is delegated to the database adapter
3. Analysis builders must handle all 7 supported database engines
