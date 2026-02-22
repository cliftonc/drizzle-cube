# Drizzle-Cube vs Cube.js SQL Planner: Architectural Comparison

This document provides a detailed comparison between drizzle-cube's query planner and Cube.js's SQL planners (both the legacy JS planner in `BaseQuery.js` and the newer Rust "Tesseract" planner). The goal is to identify architectural differences, feature gaps, correctness concerns, and areas where drizzle-cube has advantages.

---

## 1. Overall Architecture & Pipeline

### Cube.js: Multi-Phase Compiler Pipeline

```
Query → QueryProperties (classify) → Logical Plan → Optimization → Physical Plan → SQL String
```

Cube.js (Rust planner) uses a proper compiler pipeline with distinct phases:

1. **Symbol compilation** — Measures/dimensions become `MemberSymbol` objects with full metadata (type, rolling window config, filters, dependencies)
2. **Logical planning** — Produces a tree of composable plan nodes (`Query`, `FullKeyAggregate`, `ResolveMultipliedMeasures`, `MultiStageLeafMeasure`, etc.)
3. **Optimization** — Pre-aggregation optimizer rewrites the logical plan to use materialized tables
4. **Physical planning** — Converts logical nodes to `Select`/`From`/`Join`/`Cte` SQL structures via strategy pattern
5. **SQL rendering** — `to_sql()` on physical plan produces the final string using `PlanSqlTemplates`

The legacy JS planner (`BaseQuery.js`, ~5000 lines) uses a simpler direct approach but still separates measure classification from SQL generation.

### Drizzle-Cube: Direct Plan-to-SQL

```
Query → QueryPlanner (analyze) → QueryPlan → buildUnifiedQuery() → Drizzle SQL → Execute
```

Drizzle-cube uses a single-pass approach:

1. **Query analysis** — `QueryPlanner.analyzeCubeUsage()` + `buildJoinPlan()` + `planPreAggregationCTEs()`
2. **SQL assembly** — `buildUnifiedQuery()` directly constructs the Drizzle ORM query
3. **Execution** — Drizzle ORM renders and parameterizes the SQL

**Key difference**: Drizzle-cube has no intermediate logical plan. The `QueryPlan` is a flat data structure (`primaryCube`, `joinCubes`, `cteCubes`) rather than a tree of composable plan nodes. This makes the system simpler but limits optimization opportunities and makes complex query strategies harder to implement.

### Comparison Table

| Aspect | Cube.js (Rust) | Drizzle-Cube |
|--------|----------------|--------------|
| Pipeline stages | 5 (symbol → logical → optimize → physical → SQL) | 2 (analyze → SQL) |
| Plan representation | Composable tree of typed nodes | Flat struct with arrays |
| Optimization passes | Pre-aggregation rewriting | None |
| Strategy selection | 3 physical strategies per node type | Single code path |
| Extensibility | Add new node types + processors | Modify `buildUnifiedQuery()` |
| Testability | Each phase testable independently | Integration-test only |

---

## 2. The Multiplied Measures Problem

This is the most critical architectural difference. When a JOIN creates row duplication (fan-out), aggregate measures like SUM and COUNT produce incorrect inflated results.

**Example scenario:**
```
Orders (1) ──hasMany──> LineItems (3 per order)
```
Querying `Orders.totalRevenue` (SUM of order amount) with a JOIN to LineItems triples each order row, tripling the SUM.

### How Cube.js Handles It

Cube.js uses a sophisticated multi-strategy approach:

1. **Detection**: `JoinGraph.findMultiplicationFactorFor()` computes a per-cube `multiplication_factor: HashMap<String, bool>` by walking the join tree. `hasMany` from cube A to B means A is multiplied; `belongsTo` from A to B means B is multiplied.

2. **Classification** (in `query_properties.rs:893`):
   - **Regular** — not affected by multiplication
   - **Multiplied** — cube has `multiplication_factor = true`
   - **Multi-stage** — rolling windows, calculated measures referencing other cubes

3. **Special exemption**: `countDistinct` and bare `count(*)` are treated as "additive in multiplied" context because `COUNT(DISTINCT ...)` is immune to row duplication.

4. **Resolution via Keys-Based Subqueries**:
   ```sql
   -- Step 1: Get unique dimension+PK combinations from the full join
   SELECT DISTINCT pk_cols, dimension_cols FROM full_join WHERE filters

   -- Step 2: Aggregate the multiplied cube independently
   SELECT pk_cols, SUM(measure) FROM cube GROUP BY pk_cols

   -- Step 3: Join keys to aggregated measures
   SELECT dims, measures FROM keys LEFT JOIN aggregated ON pk
   ```

5. **Three physical merge strategies** (chosen per-query):
   - `InnerJoinStrategy` — no dimensions (scalar aggregates only)
   - `FullJoinStrategy` — FULL OUTER JOIN between subqueries (best correctness)
   - `KeysStrategy` — UNION-based keys + LEFT JOINs (for DBs without FULL JOIN)

### How Drizzle-Cube Handles It

Drizzle-cube uses CTE pre-aggregation:

1. **Detection**: `detectHasManyInQuery()` searches ALL registered cubes for hasMany relationships involving query cubes.

2. **CTE Classification** (`getCTEReason()`):
   - `'hasMany'` — target of hasMany; CTE aggregates with original function, outer query re-aggregates with SUM
   - `'fanOutPrevention'` — affected by hasMany elsewhere; CTE aggregates, outer re-aggregates with MAX
   - `null` — no CTE needed

3. **CTE Structure**:
   ```sql
   WITH cte_cube AS (
     SELECT join_keys, AGG(measures), dimensions
     FROM cube WHERE security_filter AND propagating_filters
     GROUP BY join_keys, dimensions
   )
   SELECT ... FROM primary LEFT JOIN cte_cube ON join_key
   ```

4. **Re-aggregation optimization**: `shouldUseMaxForHasManyAtJoinKeyGrain()` uses MAX instead of SUM when the outer query groups by exactly the CTE's join key.

### Gap Analysis

| Aspect | Cube.js | Drizzle-Cube | Gap Severity |
|--------|---------|--------------|--------------|
| Detection precision | Per-cube multiplication factor from join tree | Scans ALL registered cubes for hasMany | Medium |
| countDistinct exemption | Exempt from multiplied treatment | No special handling (pushed to CTE) | Low |
| Multi-fact support | Separate subqueries per join tree | Single join tree only | **HIGH** |
| Primary key awareness | PKs used for keys deduplication | PKs not used in query planning | Medium |
| Re-aggregation correctness | Keys-based = exact deduplication | CTE SUM/MAX re-aggregation has edge cases | **HIGH** |
| Mixed measure sources | Regular + multiplied + multi-stage combined | All-or-nothing CTE per cube | Medium |

### Correctness Concern: SUM Re-aggregation

When a hasMany CTE is joined to the main query and the outer query has GROUP BY on dimensions beyond the join key, the LEFT JOIN can produce multiple rows per CTE row. The outer SUM would then double-count.

**Example**:
```
Departments (1) ──hasMany──> Employees (many)
Employees ──belongsTo──> Teams (1)
```

Query: `Employees.count`, `Departments.totalBudget`, grouped by `Teams.name`

The Departments CTE groups by `department_id` (join key). But if an employee belongs to multiple teams via another join, the LEFT JOIN produces multiple CTE rows, and `SUM(Departments.totalBudget)` gives incorrect results.

Cube.js avoids this entirely by using PK-based keys deduplication, guaranteeing one-to-one matching.

---

## 3. Join Resolution

### Cube.js
- **Algorithm**: Dijkstra's shortest path (via `node-dijkstra`)
- **Graph construction**: Built from all cube join definitions during schema compilation (`JoinGraph.ts`)
- **Multiplication tracking**: `findMultiplicationFactorFor()` recursively walks the join tree
- **Join hints**: Each member contributes "join hints" (cube paths); the system calls `join_tree_for_hints()` via JS bridge
- **Multi-fact groups**: Different measures with incompatible join trees get separate subqueries

### Drizzle-Cube
- **Algorithm**: BFS with scoring heuristics (`JoinPathResolver`)
- **Graph construction**: Built on-the-fly from registered cube join definitions
- **Unique features**:
  - `preferredFor` hints on joins to bias path selection toward specific targets
  - Query-aware scoring (+10 for preferredFor, +1 for preferred cubes, -(length-1) penalty)
  - `belongsToMany` expansion through junction tables (not found in Cube.js)
- **Limitation**: Single join tree for the entire query

### Comparison

| Aspect | Cube.js | Drizzle-Cube |
|--------|---------|--------------|
| Algorithm | Dijkstra (shortest path) | BFS with scoring |
| Path selection | Shortest path only | Multi-criteria scoring |
| belongsToMany | Not supported | Native junction table expansion |
| Multi-fact groups | Per-measure join trees | Single shared join tree |
| Caching | Graph compiled once at startup | Path cache per resolver instance |
| Query-aware routing | Via join hints | Via preferredFor + preferred cubes |

---

## 4. Query Classification & Strategy Selection

### Cube.js Decision Tree

```
is_simple_query? (no multiplied, no multi-stage, no multi-fact)
  |-- YES --> SimpleQueryPlanner (direct join + aggregate)
  |-- NO  --> Complex path:
       |-- MultipliedMeasuresQueryPlanner (keys-based subqueries per cube)
       |-- MultiStageQueryPlanner (CTE pipeline for rolling windows)
       |-- FullKeyAggregateQueryPlanner (merge all subqueries via FULL JOIN)
```

### Drizzle-Cube Decision Tree

```
analyzeCubeUsage() --> detectHasManyInQuery()
  |-- No hasMany --> direct join + aggregate (simple path)
  |-- Has hasMany --> CTE pre-aggregation path:
       |-- hasMany cubes --> CTE with GROUP BY, outer re-agg SUM
       |-- fanOutPrevention cubes --> CTE with GROUP BY, outer re-agg MAX
       |-- Outer query LEFT JOINs to CTEs
```

### Gap: Multi-Stage Measures

Cube.js has dedicated handling for:
- **Rolling windows** — `TimeSeries` CTE + leaf measure CTE + rolling window CTE
- **Calculated measures referencing other cubes** — dependency DAG with CTE chain
- **Rank/row_number** — window function measures with partition/order by

Drizzle-cube handles calculated measures (template substitution) and post-aggregation window functions (`lag`, `lead`, `rank`), but lacks the multi-stage CTE pipeline for rolling windows or cross-cube calculated measures.

---

## 5. Filter Handling

### Similarities
Both systems support the same filter operators (equals, notEquals, contains, gt/lt, inDateRange, set/notSet, etc.) with AND/OR nesting. Both place dimension filters in WHERE and measure filters in HAVING.

### Differences

| Aspect | Cube.js | Drizzle-Cube |
|--------|---------|--------------|
| Segments | Predefined filter sets (`segments: { activeUsers: { sql: ... } }`) | No segment concept |
| CTE filter propagation | Filters included in keys subquery | `FK IN (SELECT PK FROM source WHERE filter)` subquery |
| Static filters | Applied to member SQL at symbol compilation | Resolved at query time via Drizzle |
| Null byte rejection | Not found | Yes — security hardening against `\0` injection |
| Filter caching | N/A | `FilterCacheManager` for parameter deduplication across CTEs |

### Drizzle-Cube's Propagating Filters

Drizzle-cube's `buildPropagatingFilterSubquery()` handles a subtle case: when a filter on cube A should constrain CTE cube B's results. It generates `WHERE fk IN (SELECT pk FROM A WHERE filter)` inside the CTE. This ensures filters on joined cubes still reduce CTE result sets. Cube.js handles the equivalent by including filters in the keys subquery.

---

## 6. Time Dimension Handling

### Similarities
Both support granularity-based truncation (day, week, month, quarter, year) with database-specific SQL generation.

### Differences

| Aspect | Cube.js | Drizzle-Cube |
|--------|---------|--------------|
| Custom granularities | Yes — `GranularityHelper` with calendar SQL, origin, timezone | No |
| Rolling windows | `rollingWindow: { trailing: '7 days' }` with time series CTE | Not supported |
| Relative date parsing | Handled in JS before planner | `parseRelativeDateRange()` with "last N days/months/etc." |
| Gap filling | SQL-level `generate_series()` CTE | Post-execution JavaScript gap fill |
| Timezone handling | Granularity-aware timezone conversion | Basic — relies on database timezone |

### Gap: SQL-Level Gap Filling

Cube.js generates a `TimeSeries` CTE:
```sql
WITH time_series AS (
  SELECT generate_series('2024-01-01', '2024-03-31', interval '1 day') AS date
)
SELECT ts.date, COALESCE(SUM(measure), 0)
FROM time_series ts LEFT JOIN data ON ts.date = data.date
```

Drizzle-cube fills gaps in JavaScript after query execution. This works but:
- Can't participate in SQL-level window functions that depend on contiguous dates
- Less efficient for large date ranges with sparse data
- Requires fetching all data before gap-filling

---

## 7. Security Model

### Drizzle-Cube (Stronger)
- **Mandatory security context** — every cube MUST define `sql: (ctx) => ({ where: ... })`
- **JOIN-type aware placement** — security goes in ON clause for LEFT/RIGHT JOINs, WHERE for INNER
- **CTE isolation** — security applied independently within each CTE
- **Junction table security** — `through.securitySql` on belongsToMany joins
- **Validation** — `validateSecurityContext()` checks all cubes produce WHERE conditions
- **Null byte rejection** — prevents `\0` injection in filter values
- **Parameterized queries** — all SQL goes through Drizzle ORM's parameterized builder

### Cube.js (Weaker)
- **Optional security** — `queryTransformer` middleware, not enforced at cube level
- **No per-cube enforcement** — security applied at the API layer, not the query planner
- **Row-level security via segments** — can define security segments, but not mandatory
- **String-based SQL** — templates build SQL strings; parameterization is separate

**Verdict**: Drizzle-cube has a significantly stronger security model. This is a genuine advantage worth preserving.

---

## 8. SQL Generation

### Cube.js
- Template-based SQL generation via `PlanSqlTemplates` (passed from JS)
- Database-specific templates for quoting, aliasing, function names
- String-based SQL building (concatenation)
- No parameterization at the planner level (parameters injected separately)

### Drizzle-Cube
- **Drizzle ORM query builder** — type-safe, parameterized by default
- SQL injection protection built into the foundation
- `isolateSqlExpression()` double-wrapping prevents Drizzle SQL object mutation
- Database adapters for dialect differences (PostgreSQL, MySQL, SQLite, DuckDB)

**Verdict**: Drizzle-cube's approach is inherently safer. SQL injection is prevented by construction, not convention. The `isolateSqlExpression()` pattern (see `src/server/cube-utils.ts`) handles Drizzle's mutable SQL object edge case.

---

## 9. Primary Key Awareness

### Cube.js
Cubes define primary keys (`primaryKey: true` on dimensions). These are used for:
- Keys subquery deduplication (`SELECT DISTINCT pk_cols`)
- Multiplied measure resolution (JOIN back on PKs)
- Pre-aggregation matching

### Drizzle-Cube
Primary keys are defined on dimensions (`primaryKey: true`) but used mainly for:
- Dimension metadata/annotations
- **Not used in query planning or deduplication**

**Gap**: The lack of PK-based deduplication in query planning means drizzle-cube can't implement the keys-based strategy for multiplied measures. Adding PK awareness to the planner is a prerequisite for the multiplied measures improvement.

---

## 10. Pre-Aggregation / Materialization

### Cube.js
Full pre-aggregation system:
- Define materialized rollups in cube definitions
- Automatic matching: optimizer checks if query measures/dimensions/filters match
- Partial matching: additive measures can be re-aggregated from coarser pre-aggregations
- Refresh scheduling and external storage

### Drizzle-Cube
No pre-aggregation system. Queries always run against raw tables.

**Assessment**: This is an intentional scope difference. Pre-aggregations are a major performance feature for large-scale deployments, but drizzle-cube targets Drizzle ORM-first embedded analytics where raw table performance is typically sufficient.

---

## 11. Potential Correctness Issues in Drizzle-Cube

### Issue 1: CTE Re-aggregation (HIGH)

When a hasMany CTE is joined to the main query and the outer query has GROUP BY on dimensions beyond the join key, the LEFT JOIN can produce multiple rows per CTE row. The outer SUM would double-count.

**See**: Section 2, "Correctness Concern: SUM Re-aggregation"

### Issue 2: Fan-Out Detection Completeness (MEDIUM)

`detectHasManyInQuery()` searches ALL registered cubes for hasMany relationships, not just cubes in the current query's join tree. This could:
- Over-eagerly create CTEs (performance impact)
- Miss indirect fan-out through cubes not directly in the query

Cube.js computes multiplication factors from the actual join tree, which is more precise.

### Issue 3: Single Join Tree Limitation (MEDIUM-HIGH)

All measures must fit a single join plan. When measures come from cubes requiring different join paths, the single-tree approach may produce suboptimal or incorrect results.

### Issue 4: No Rolling Window Support (LOW-MEDIUM)

Rolling windows (7-day moving average, etc.) require time series expansion and multi-stage CTEs. This is a feature gap, not a correctness issue.

---

## 12. Drizzle-Cube Advantages

| Advantage | Description |
|-----------|-------------|
| **Mandatory security** | Per-cube security context is enforced, not optional |
| **SQL injection immunity** | All SQL goes through Drizzle ORM parameterized builder |
| **belongsToMany** | Native many-to-many junction table support |
| **Type safety** | Full TypeScript from schema to API response |
| **Query-aware path scoring** | `preferredFor` hints guide join path selection |
| **Filter propagation** | Subquery-based filter pushing into CTEs |
| **Junction table security** | Security context on many-to-many intermediary tables |
| **Multi-database via Drizzle** | PostgreSQL, MySQL, SQLite, DuckDB with deep ORM integration |

---

## Summary Matrix

| Feature | Cube.js | Drizzle-Cube | Notes |
|---------|---------|--------------|-------|
| Query pipeline | Logical → Physical → SQL | Direct plan → SQL | Cube.js more extensible |
| Multiplied measures | Keys-based deduplication | CTE pre-aggregation | **Correctness gap** |
| Multi-fact joins | Full support | Single join tree | **Feature gap** |
| Join algorithm | Dijkstra shortest path | BFS with scoring | Both adequate |
| Security model | Optional middleware | **Mandatory per-cube** | DC stronger |
| SQL safety | String building | **Parameterized (Drizzle ORM)** | DC stronger |
| Pre-aggregations | Full system | None | Intentional scope difference |
| Rolling windows | Multi-stage CTE pipeline | Not supported | Feature gap |
| Time gap filling | SQL-level time series | Post-execution JS | DC simpler but limited |
| Custom granularities | Yes | No | Feature gap |
| belongsToMany | Not found | **Yes (junction tables)** | DC advantage |
| Filter propagation | Via keys subquery | Subquery IN/EXISTS | Both work |
| Database support | Many (via templates) | PG, MySQL, SQLite, DuckDB | DC has deeper Drizzle integration |
| Type safety | Rust types (internal) | **Full TypeScript end-to-end** | DC stronger for consumers |

---

## Proposed Improvements

Based on this comparison, the following improvements are proposed in priority order:

| Priority | Design Doc | Description |
|----------|-----------|-------------|
| P0 | [Multi-Stage Pipeline](design-multi-stage-pipeline.md) | Logical Plan → Optimize → Drizzle ORM pipeline (foundational) |
| P1 | [Multiplied Measures](design-multiplied-measures.md) | PK-aware keys-based deduplication (critical correctness) |
| P2 | [Multi-Fact Groups](design-multi-fact-groups.md) | Support measures from different join trees |
| P3 | [Multiplication Factor](design-multiplication-factor.md) | Precise per-cube multiplication detection |
| P4 | [SQL Gap Filling](design-sql-gap-filling.md) | SQL-level time series gap filling |
| P5 | [Custom Granularities](design-custom-granularities.md) | Custom granularity support |

Each design doc details the problem, how Cube.js solves it, drizzle-cube's current behavior, and a proposed implementation approach.
