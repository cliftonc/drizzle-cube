# Phase 6: Chart Data Preparation (Optional)

**Priority**: LOW
**Estimated Tests**: ~20
**Dependencies**: None
**Status**: COMPLETED (2026-01-28)

## Overview

This phase focuses on testing **data transformation logic** extracted from chart components - NOT the React components themselves. Chart rendering is handled by Recharts; we test the data preparation that happens before Recharts receives data.

**Important**: Only pursue this phase if you identify significant data transformation logic that warrants testing. If charts are thin wrappers around Recharts with minimal logic, skip this phase.

---

## Assessment Results

### Chart Component Analysis

| Chart | Data Logic Lines | Location | Decision | Notes |
|-------|------------------|----------|----------|-------|
| BarChart | ~15 | useMemo + external utils | **SKIP** | Delegates to `transformChartDataWithSeries()` |
| LineChart | ~30 | useMemo + external utils | **SKIP** | Delegates to chartUtils + comparisonUtils |
| AreaChart | ~15 | useMemo + external utils | **SKIP** | Same pattern as BarChart |
| PieChart | ~40 | Inline useMemo | **SKIP** | Simple field mapping + boolean labels |
| FunnelChart | ~45 | useMemo | **SKIP** | Mostly format detection + mapping |
| BubbleChart | ~50 | D3 scales | **SKIP** | D3 setup, simple field mapping |
| ScatterChart | ~30 | Inline grouping | **SKIP** | Simple series grouping |

### Key Finding: Data Transformation Logic Already Extracted

The drizzle-cube codebase **already follows best practices** - meaningful data transformation logic has been extracted into utility files:

| Utility File | Functions | Already Tested? |
|--------------|-----------|-----------------|
| `chartUtils.ts` | `transformChartDataWithSeries()`, `formatTimeValue()`, `parseNumericValue()`, etc. | **YES** - 337 lines in `chartUtils.test.ts` |
| `targetUtils.ts` | `parseTargetValues()`, `spreadTargetValues()`, `calculateVariance()`, `formatVariance()` | **NOW YES** - 41 tests added |
| `comparisonUtils.ts` | `transformForOverlayMode()`, `isComparisonData()`, `isPriorPeriodSeries()` | **NOW YES** - 37 tests added |
| `funnelExecution.ts` | `transformServerFunnelResult()`, `formatDuration()` | Partial (funnel tests exist) |

---

## Tests Written

### 1. Target Utilities (`tests/client/utils/targetUtils.test.ts`)

**41 tests** covering:

- `parseTargetValues`:
  - Single and multiple comma-separated values
  - Decimal and negative values
  - Whitespace trimming
  - Empty/null/undefined handling
  - Invalid numeric values
  - Leading/trailing comma handling

- `spreadTargetValues`:
  - Single value repeated across data points
  - Even and uneven distribution
  - Multiple targets spread proportionally
  - Edge cases (more targets than data, empty arrays)

- `calculateVariance`:
  - Positive/negative variance calculation
  - Zero handling (both actual and target)
  - Decimal values
  - Negative targets

- `formatVariance`:
  - Plus/minus sign formatting
  - Custom decimal places
  - Large values

- `getUniqueTargets`:
  - Deduplication and sorting

### 2. Comparison Utilities (`tests/client/utils/comparisonUtils.test.ts`)

**37 tests** covering:

- `isComparisonData`:
  - Detection of `__periodIndex` metadata
  - Empty array handling

- `getPeriodLabels` / `getPeriodIndices`:
  - Extraction of unique period labels/indices
  - Sorting of indices

- `generatePeriodShortLabel`:
  - "Current" for index 0, "Prior" for others

- `transformForSeparateMode`:
  - Series key generation per measure + period
  - Multiple measures handling
  - Non-comparison data passthrough

- `transformForOverlayMode`:
  - Pivoting by period day index
  - Period-labeled column creation
  - Display date preservation
  - Field label function integration
  - **With dimensions**: dimension-prefixed series keys

- `formatPeriodDayIndex`:
  - Day number format
  - Date formatting (short/long)
  - Invalid date fallback

- `isPriorPeriodSeries`:
  - Prior period detection in series keys
  - Single period handling

- `getPriorPeriodStrokeDashArray`:
  - Dash patterns for solid/dashed/dotted

---

## Skipped (Chart Components)

All chart components were skipped because they are **thin wrappers** that:
1. Parse configuration (5-15 lines)
2. Delegate data transformation to utility functions
3. Compose Recharts/D3 components
4. Handle rendering and error states

Testing these components would:
- Require complex mocking of Recharts internals
- Provide low value (rendering is already tested by Recharts)
- Be brittle (break on any Recharts API change)
- Duplicate existing utility tests

---

## Philosophy

Chart components typically:
1. Receive raw data from the API
2. Transform data for the charting library (grouping, pivoting, calculating)
3. Pass to Recharts

We test step 2 - the transformation logic - as **pure functions**, not as React components.

---

## Acceptance Criteria

- [x] Only test **extracted utility functions**, not React components
- [x] Each tested function is a pure function (no side effects)
- [x] Tests cover edge cases (null, empty, zero)
- [x] No tests that render Recharts components
- [x] Document findings for skipped items

---

## Test Files Created

```
tests/client/utils/targetUtils.test.ts      (41 tests)
tests/client/utils/comparisonUtils.test.ts  (37 tests)
```

**Total**: 78 new tests

---

## Running Tests

```bash
# Run just the Phase 6 tests
npm run test:client -- --run tests/client/utils/targetUtils.test.ts tests/client/utils/comparisonUtils.test.ts

# Run all client tests
npm run test:client
```

---

## Summary

Phase 6 was **partially executed** with a strategic pivot:

1. **Assessment completed**: All 7 chart components audited
2. **Finding**: Data transformation logic already extracted to utilities
3. **Action**: Instead of testing chart components, added tests for **untested utility files**
4. **Result**: 78 new tests covering `targetUtils.ts` and `comparisonUtils.ts`

This approach provides higher value than testing React chart wrappers, as the utility functions contain the actual business logic used across multiple chart types.
