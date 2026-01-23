# Retention Analysis Mode - Design Document

## Implementation Status

### Completed
- [x] **Phase 1.1**: Server types (`src/server/types/retention.ts`) - Added `RetentionDateRange` and `cohortDateRange` to `RetentionQueryConfig`
- [x] **Phase 1.2**: Query builder (`src/server/retention-query-builder.ts`) - Date range filtering in `buildCohortBaseCTE()` with WHERE and HAVING clauses
- [x] **Phase 1.3**: Validation - Added `cohortDateRange` validation (required, valid dates, start ≤ end)
- [x] **Phase 1.4**: Cache utils - Updated normalization to include `cohortDateRange`
- [x] **Phase 1 Tests**: Updated all test configs with `cohortDateRange`

### In Progress
- [ ] **Phase 4**: Testing (add date range specific tests)

### Completed (since last update)
- [x] **Phase 2**: Frontend Foundation (date range state, adapter updates)
- [x] **Phase 3**: UI Components (Mixpanel-style V2 panel with RetentionSettingsSection, RetentionEventSection, RetentionConfigPanelV2)
- [x] **Phase 3.5**: Frontend Wiring (connect V2 panel to store actions via useAnalysisBuilderHook and AnalysisBuilder)
- [ ] **Phase 5**: Documentation

---

## Overview

Add retention analysis capability to drizzle-cube, enabling cohort-based retention tracking across single or multiple cubes. This follows the established patterns from funnel and flow analysis modes.

## Key Design Decision: Required Date Range

**Problem**: Without date range bounds, the cohort_base CTE finds MIN(timestamp) for each user's first activity with no bounds on which time period to analyze. If all users first performed an action in a single month, you get only one cohort.

**Solution**: `cohortDateRange` is a **required** field that bounds which time periods can form cohorts. This:
1. Gives users predictable results ("show me cohorts from Jan-Dec 2024")
2. Improves performance by limiting the data scanned
3. Follows Mixpanel's pattern of always having a date range at the report level

---

## Phase 1: Backend Foundation ✅ COMPLETE

### 1.1 Type Definitions (`src/server/types/retention.ts`)

```typescript
/**
 * Date range for cohort analysis (REQUIRED)
 */
export interface RetentionDateRange {
  /** Start date (inclusive), ISO 8601 format (YYYY-MM-DD) */
  start: string
  /** End date (inclusive), ISO 8601 format (YYYY-MM-DD) */
  end: string
}

/**
 * Retention query configuration
 */
export interface RetentionQueryConfig {
  // ... existing fields ...

  /**
   * Date range for cohort inclusion (REQUIRED).
   * Only users who first performed the cohort action within this range are included.
   * This bounds which time periods can form cohorts.
   */
  cohortDateRange: RetentionDateRange

  // ... rest of config ...
}
```

### 1.2 Query Builder Updates

The `buildCohortBaseCTE()` method now:
1. Adds date range filter to WHERE clause (filters raw events)
2. Adds HAVING clause (filters aggregated cohort_period values)

```typescript
// WHERE clause addition
if (config.cohortDateRange) {
  whereConditions.push(
    sql`${cohortConfig.timeExpr} >= ${config.cohortDateRange.start}::date
        AND ${cohortConfig.timeExpr} < (${config.cohortDateRange.end}::date + interval '1 day')`
  )
}

// HAVING clause addition
if (config.cohortDateRange) {
  finalQuery = finalQuery.having(
    sql`MIN(${truncatedCohortDate}) >= ${config.cohortDateRange.start}::date
        AND MIN(${truncatedCohortDate}) < (${config.cohortDateRange.end}::date + interval '1 day')`
  )
}
```

### 1.3 Validation Updates

```typescript
// In validateConfig()
if (!config.cohortDateRange) {
  errors.push('Cohort date range is required')
} else {
  // Validate start and end dates exist and are valid
  // Validate start ≤ end
}
```

---

## Phase 2: Frontend Foundation

### 2.1 Client Types (`src/client/types/retention.ts`)

Add date range to slice state and server query:

```typescript
/** Date range for cohort analysis */
export interface DateRange {
  start: string  // ISO date string (YYYY-MM-DD)
  end: string    // ISO date string (YYYY-MM-DD)
}

/** Preset date range options */
export const RETENTION_DATE_RANGE_PRESETS = [
  { value: 'last_30_days', label: 'Last 30 days' },
  { value: 'last_3_months', label: 'Last 3 months' },  // Default
  { value: 'last_6_months', label: 'Last 6 months' },
  { value: 'last_12_months', label: 'Last 12 months' },
  { value: 'this_year', label: 'This year' },
  { value: 'last_year', label: 'Last year' },
  { value: 'custom', label: 'Custom range' },
] as const

/** Calculate date range from preset */
export function getDateRangeFromPreset(preset: string): DateRange {
  const now = new Date()
  switch (preset) {
    case 'last_3_months':
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0],
        end: new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
      }
    // ... other presets
  }
}

export interface RetentionSliceState {
  // ... existing fields ...

  /** Date range for cohort analysis (REQUIRED) */
  retentionCohortDateRange: DateRange
}
```

### 2.2 Retention Slice (`src/client/stores/slices/retentionSlice.ts`)

Add state and action:

```typescript
// Initial state - default to last 3 months
retentionCohortDateRange: getDateRangeFromPreset('last_3_months')

// Action
setRetentionCohortDateRange: (range: DateRange) => void

// Include in buildRetentionQuery()
cohortDateRange: state.retentionCohortDateRange
```

### 2.3 Retention Mode Adapter (`src/client/adapters/retentionModeAdapter.ts`)

Update validation to require date range:

```typescript
validate(state: RetentionSliceState): ValidationResult {
  const errors: string[] = []

  // Date range is required
  if (!state.retentionCohortDateRange?.start || !state.retentionCohortDateRange?.end) {
    errors.push('Date range is required for retention analysis')
  }

  // ... other validation ...
}
```

Update serialization:

```typescript
// In extractState()
retentionCohortDateRange: storeState.retentionCohortDateRange as DateRange

// In stateToServerQuery()
cohortDateRange: state.retentionCohortDateRange
```

---

## Phase 3: Simplified UI (Mixpanel-style)

### Design Goals

1. **Simpler Mental Model**: "Cohort Event" → "Return Event" with inline filters
2. **Always-Visible Date Range**: Prominent date range picker (required field)
3. **Unified Granularity**: Single granularity setting (applies to both cohort and periods)
4. **Collapsible Advanced Options**: Binding key and time dimensions are secondary

### New UI Layout

```
┌─────────────────────────────────────────────────────────────┐
│  COHORT EVENT                                               │
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │ PREvents ▼   │  │ Event Type equals "created"    [+]  │ │
│  └──────────────┘  └──────────────────────────────────────┘ │
│                                                             │
│  tracked by [employeeId ▼] starting [timestamp ▼]           │
├─────────────────────────────────────────────────────────────┤
│  RETURN EVENT                                               │
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │ PREvents ▼   │  │ Event Type equals "created"    [+]  │ │
│  └──────────────┘  └──────────────────────────────────────┘ │
│                                                             │
│  measured at [timestamp ▼]                                  │
├─────────────────────────────────────────────────────────────┤
│  RETENTION SETTINGS                                         │
│  Date Range: [Last 3 months ▼]  Granularity: [month ▼]     │
│  Periods: [12]  Type: [Classic ▼]                          │
└─────────────────────────────────────────────────────────────┘
```

### 3.1 Create `RetentionSettingsSection.tsx`

Always-visible settings with date range prominent:

```typescript
interface RetentionSettingsSectionProps {
  dateRange: DateRange
  granularity: RetentionGranularity  // Unified: applies to cohort grouping AND periods
  periods: number
  retentionType: RetentionType
  onDateRangeChange: (range: DateRange) => void
  onGranularityChange: (granularity: RetentionGranularity) => void
  onPeriodsChange: (periods: number) => void
  onRetentionTypeChange: (type: RetentionType) => void
}
```

### 3.2 Create `RetentionEventSection.tsx`

Combines cube selector + inline filter:

```typescript
interface RetentionEventSectionProps {
  title: string  // "Cohort Event" or "Return Event"
  description: string
  cube: string | null
  filters: Filter[]
  bindingKey?: FunnelBindingKey | null  // Only for cohort section
  timeDimension: string | null
  schema: CubeMeta | null
  showAdvanced: boolean
  onCubeChange: (cube: string | null) => void
  onFiltersChange: (filters: Filter[]) => void
  onBindingKeyChange?: (key: FunnelBindingKey | null) => void
  onTimeDimensionChange: (dim: string | null) => void
}
```

### 3.3 Create `RetentionConfigPanelV2.tsx`

Simplified Mixpanel-style layout with three sections:

1. **Cohort Event Section** - Cube + filter + binding key + time dimension
2. **Return Event Section** - Cube + filter + time dimension (defaults to cohort cube)
3. **Retention Settings** - Date range (prominent), granularity, periods, type

### 3.4 Update `RetentionModeContent.tsx`

Use V2 panel instead of V1:

```typescript
// Replace RetentionConfigPanel with RetentionConfigPanelV2
import RetentionConfigPanelV2 from './RetentionConfigPanelV2'
```

---

## Phase 3.5: Frontend Wiring

(Unchanged from original design - connects UI to data fetching)

---

## Phase 4: Testing

### Additional Tests for Date Range

```typescript
describe('Retention with date range', () => {
  it('filters cohorts to specified date range', async () => {
    const config = {
      cohortDateRange: { start: '2023-01-01', end: '2023-06-30' },
      // ... other config
    }
    const result = await executeRetention(config)

    // Should only include cohorts from Jan-Jun 2023
    const cohortPeriods = result.map(r => r.cohortPeriod)
    expect(cohortPeriods.every(p => p >= '2023-01-01' && p <= '2023-06-30')).toBe(true)
  })

  it('rejects query without date range', async () => {
    const config = { /* no cohortDateRange */ }
    const validation = builder.validateConfig(config, cubes)
    expect(validation.isValid).toBe(false)
    expect(validation.errors).toContain('Cohort date range is required')
  })
})
```

---

## Files Summary

### Backend (Phase 1) ✅ COMPLETE

| File | Status | Changes |
|------|--------|---------|
| `src/server/types/retention.ts` | ✅ | Added `RetentionDateRange`, `cohortDateRange` to config |
| `src/server/retention-query-builder.ts` | ✅ | Date range filtering in `buildCohortBaseCTE()`, validation |
| `src/server/cache-utils.ts` | ✅ | Added `cohortDateRange` to normalization |
| `tests/retention-query.test.ts` | ✅ | Added `defaultDateRange` to all test configs |

### Frontend (Phase 2) ✅ COMPLETE

| File | Status | Changes |
|------|--------|---------|
| `src/client/types/retention.ts` | ✅ | Added `DateRange`, `DateRangePreset`, presets, helpers, updated `RetentionSliceState` |
| `src/client/stores/slices/retentionSlice.ts` | ✅ | Added `retentionCohortDateRange` state, `setRetentionCohortDateRange` action, validation |
| `src/client/adapters/retentionModeAdapter.ts` | ✅ | Added date range to `extractState()`, `stateToServerQuery()`, `serverQueryToState()`, `validate()` |
| `src/client/stores/analysisBuilderStore.tsx` | ✅ | Added `retentionCohortDateRange` and `setRetentionCohortDateRange` to store types |
| `src/client/types/analysisConfig.ts` | ✅ | Updated default retention config with `cohortDateRange` |
| `tests/client/adapters/retentionModeAdapter.test.ts` | ✅ | Updated all test fixtures with `retentionCohortDateRange` |

### UI Components (Phase 3) ✅ COMPLETE

| File | Status | Changes |
|------|--------|---------|
| `src/client/components/AnalysisBuilder/RetentionSettingsSection.tsx` | ✅ | **NEW**: Date range picker with presets + granularity + periods + type settings |
| `src/client/components/AnalysisBuilder/RetentionEventSection.tsx` | ✅ | **NEW**: Reusable cube + inline filter + time dimension section |
| `src/client/components/AnalysisBuilder/RetentionConfigPanelV2.tsx` | ✅ | **NEW**: Simplified Mixpanel-style panel combining event sections + settings |
| `src/client/components/AnalysisBuilder/RetentionModeContent.tsx` | ✅ | Updated to use V2 panel with unified granularity |
| `src/client/components/AnalysisBuilder/types.ts` | ✅ | Added `retentionCohortDateRange` and `onRetentionCohortDateRangeChange` props |
| `src/client/components/AnalysisBuilder/AnalysisQueryPanel.tsx` | ✅ | Added date range props pass-through to RetentionModeContent |

### Frontend Wiring (Phase 3.5) ✅ COMPLETE

| File | Status | Changes |
|------|--------|---------|
| `src/client/hooks/useAnalysisBuilderHook.ts` | ✅ | Added `retentionCohortDateRange` state, `setRetentionCohortDateRange` action, and included in serverRetentionQuery deps |
| `src/client/components/AnalysisBuilder/index.tsx` | ✅ | Added `retentionCohortDateRange` and `onRetentionCohortDateRangeChange` props pass-through |

---

## Security Considerations

1. Security context applied to BOTH cohort and activity tables in all CTEs
2. Date range parameters are properly parameterized (no SQL injection)
3. Multi-tenant isolation maintained through all join paths

## Performance Considerations

1. Date range filter reduces data scanned significantly
2. WHERE filter applied before GROUP BY for early filtering
3. HAVING filter ensures accurate cohort period bounds
4. Single-pass aggregation via CTEs (no N subqueries for N periods)
