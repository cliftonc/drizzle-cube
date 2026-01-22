# Retention Analysis Mode - Design Document

## Overview

Add retention analysis capability to drizzle-cube, enabling cohort-based retention tracking across single or multiple cubes. This follows the established patterns from funnel and flow analysis modes.

## Scope

### Initial Implementation (Phase 1-3)
- **Retention Types**: Classic (bounded) and Rolling (unbounded)
- **Database Support**: PostgreSQL and DuckDB (most capable, similar syntax)
- **Multi-cube Support**: Cohort and activity can come from different cubes

### Future Phases
- MySQL and SQLite adapter support
- Range/bracket retention
- Full/strict retention (streak detection)

## Design Decisions

1. **Multi-cube support**: Cohort definition and activity tracking can use different cubes
2. **Flat result format**: API returns flat array; client transforms to matrix if needed
3. **Standard timeDimension filtering**: Uses existing dateRange string patterns

---

## Phase 1: Backend Foundation

### 1.1 Type Definitions (`src/server/types/retention.ts`)

```typescript
/**
 * Binding key mapping for multi-cube retention
 */
export interface RetentionBindingKeyMapping {
  cube: string
  dimension: string
}

/**
 * Time dimension mapping for multi-cube retention
 */
export interface RetentionTimeDimensionMapping {
  cube: string
  dimension: string
}

/**
 * Retention query configuration
 */
export interface RetentionQueryConfig {
  /**
   * Cohort definition - which cube/dimension defines when users enter cohorts
   * String for single-cube (e.g., 'Users.createdAt')
   */
  cohortTimeDimension: string | RetentionTimeDimensionMapping

  /**
   * Activity definition - which cube/dimension defines user activity
   * String for single-cube (e.g., 'Events.timestamp')
   */
  activityTimeDimension: string | RetentionTimeDimensionMapping

  /**
   * Binding key - dimension that links users across cohort and activity
   * String for single-cube, array for multi-cube
   */
  bindingKey: string | RetentionBindingKeyMapping[]

  /**
   * Cohort granularity - how to group users into cohorts
   */
  cohortGranularity: 'day' | 'week' | 'month'

  /**
   * Period granularity - how to measure retention periods
   */
  periodGranularity: 'day' | 'week' | 'month'

  /**
   * Number of periods to calculate (e.g., 12 for 12 months)
   */
  periods: number

  /**
   * Retention type
   * - 'classic': User returned exactly in period N
   * - 'rolling': User returned in period N or later
   */
  retentionType: 'classic' | 'rolling'

  /**
   * Optional filters on cohort users
   */
  cohortFilters?: Filter | Filter[]

  /**
   * Optional filters on activity events
   */
  activityFilters?: Filter | Filter[]
}

/**
 * Single retention data point in the flat result format
 */
export interface RetentionResultRow {
  /** Cohort identifier (truncated date string, e.g., "2024-01-01") */
  cohortPeriod: string

  /** Period number (0 = cohort entry, 1 = first retention period, etc.) */
  period: number

  /** Number of users in this cohort */
  cohortSize: number

  /** Number of users retained in this period */
  retainedUsers: number

  /** Retention rate as decimal (0-1) */
  retentionRate: number
}

/**
 * Retention capabilities per database engine
 */
export interface RetentionCapabilities {
  supportsDateTrunc: boolean
  supportsDateDiff: boolean
  supportsGenerateSeries: boolean
}
```

### 1.2 Query Builder (`src/server/retention-query-builder.ts`)

**Class Structure:**
```typescript
export class RetentionQueryBuilder {
  constructor(
    private filterBuilder: FilterBuilder,
    private dateTimeBuilder: DateTimeBuilder
  ) {}

  hasRetention(query: SemanticQuery): boolean
  validateConfig(config: RetentionQueryConfig, cubes: Map<string, Cube>): ValidationResult
  buildRetentionQuery(config: RetentionQueryConfig, cubes: Map<string, Cube>, context: QueryContext): DrizzleQueryBuilder
  transformResult(rawResult: unknown[], config: RetentionQueryConfig): RetentionResultRow[]
}
```

**CTE Structure (Classic Retention):**

```sql
WITH
-- 1. Define cohort users with their cohort period
cohort_base AS (
  SELECT
    binding_key,
    DATE_TRUNC('month', MIN(cohort_time)) AS cohort_period
  FROM cohort_table
  WHERE organisation_id = $1  -- Security context
    AND cohort_filters...
  GROUP BY binding_key
),

-- 2. Get all activity with period number relative to cohort
activity_periods AS (
  SELECT DISTINCT
    c.binding_key,
    c.cohort_period,
    DATE_DIFF('month', c.cohort_period, DATE_TRUNC('month', a.activity_time)) AS period_number
  FROM cohort_base c
  INNER JOIN activity_table a ON c.binding_key = a.binding_key
  WHERE a.organisation_id = $1  -- Security context on activity table
    AND a.activity_time >= c.cohort_period
    AND activity_filters...
),

-- 3. Calculate cohort sizes
cohort_sizes AS (
  SELECT cohort_period, COUNT(*) AS cohort_size
  FROM cohort_base
  GROUP BY cohort_period
),

-- 4. Calculate retention counts per cohort/period
retention_counts AS (
  SELECT
    cohort_period,
    period_number,
    COUNT(DISTINCT binding_key) AS retained_users
  FROM activity_periods
  WHERE period_number BETWEEN 0 AND $periods
  GROUP BY cohort_period, period_number
)

-- 5. Final join with retention rate calculation
SELECT
  rc.cohort_period,
  rc.period_number AS period,
  cs.cohort_size,
  rc.retained_users,
  (rc.retained_users::NUMERIC / cs.cohort_size) AS retention_rate
FROM retention_counts rc
JOIN cohort_sizes cs ON rc.cohort_period = cs.cohort_period
ORDER BY rc.cohort_period, rc.period_number
```

### 1.3 Executor Integration (`src/server/executor.ts`)

**Changes:**
1. Add `retentionQueryBuilder` field and initialize in constructor
2. Add routing in `execute()` method for retention queries
3. Add `executeRetentionQueryWithCache()` method
4. Add `executeRetentionQuery()` method
5. Add `dryRunRetention()` method

### 1.4 Compiler Integration (`src/server/compiler.ts`)

**Changes:**
1. Add `dryRunRetention()` public method
2. Update `validateQueryAgainstCubes()` for retention validation

### 1.5 Cache Utils (`src/server/cache-utils.ts`)

**Changes:**
1. Add `normalizeRetentionConfig()` function
2. Update `normalizeQuery()` to include retention

### 1.6 Query Types (`src/server/types/query.ts`)

**Changes:**
1. Add `retention?: RetentionQueryConfig` to `SemanticQuery` interface

---

## Phase 2: Frontend Foundation

### Files to Create/Modify
- `src/client/types/retention.ts` - Frontend types
- `src/client/types/analysisConfig.ts` - Add 'retention' to AnalysisType
- `src/client/adapters/retentionModeAdapter.ts` - Mode adapter
- `src/client/stores/slices/retentionSlice.ts` - Store slice
- `src/client/hooks/queries/useRetentionQuery.ts` - Data fetching hook

---

## Phase 3: UI Components

### Files to Create/Modify
- `src/client/components/AnalysisBuilder/RetentionModeContent.tsx`
- `src/client/components/AnalysisBuilder/RetentionConfigPanel.tsx`
- `src/client/components/AnalysisBuilder/AnalysisTypeSelector.tsx` - Add option
- `src/client/components/AnalysisBuilder/AnalysisQueryPanel.tsx` - Conditional render
- `src/client/icons/customIcons.ts` - Add retention icon

---

## Phase 4: Testing

### Test Files
- `tests/retention-query.test.ts` - Backend tests
- `tests/client/adapters/retentionModeAdapter.test.ts` - Adapter tests

---

## Phase 5: Documentation

### Documentation Files
- `~/work/drizzle-cube-help/src/content/docs/client/retention-analysis.md`
- Update `analysis-config.md` and `analysis-builder.md`

---

## Security Considerations

1. Security context applied to BOTH cohort and activity tables in all CTEs
2. Multi-tenant isolation maintained through all join paths
3. Follows existing patterns from funnel/flow modes

## Performance Considerations

1. Single-pass aggregation via CTEs (no N subqueries for N periods)
2. `DISTINCT` on binding_key prevents double-counting
3. Cache key normalization for query deduplication
4. Proper indexes recommended: `(organisation_id, binding_key, timestamp)`
