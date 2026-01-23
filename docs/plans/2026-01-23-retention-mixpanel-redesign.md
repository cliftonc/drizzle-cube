# Retention Analysis Redesign - Mixpanel Style

## Goal

Simplify retention analysis UI to follow Mixpanel's pattern: single global configuration, filter-only event sections, single cohort with breakdown support, and combined heatmap+line chart.

## Current Problems (Pre-redesign)

1. **Duplicate selectors**: Cohort Event and Return Event each have their own cube, binding key, timestamp
2. **Cohort explosion**: 6 months + day granularity = 180+ cohorts instead of one
3. **No breakdown**: Cannot segment a single cohort by dimension (country, plan type)
4. **Complex state**: 12+ retention-specific fields with redundancy

## Proposed UI Layout

```
+-------------------------------------------------------------------------+
|  GLOBAL CONFIGURATION                                                    |
|  [Cube ▼]  [User ID ▼]  [Timestamp ▼]  [Date Range: Last 3 months ▼]    |
+-------------------------------------------------------------------------+
|  COHORT FILTER (who enters the cohort)                                   |
|  [Event Type = "signup"] [Plan = "pro"]                          [+ Add] |
+-------------------------------------------------------------------------+
|  RETURN FILTER (what counts as a return)                                 |
|  [Event Type = "login"]                                          [+ Add] |
+-------------------------------------------------------------------------+
|  BREAKDOWN (optional)                                                    |
|  [No breakdown ▼] or [Country ▼]                                        |
+-------------------------------------------------------------------------+
|  SETTINGS                                                                |
|  [View: Week ▼]  [Periods: 12]  [Type: Classic ▼]                       |
+-------------------------------------------------------------------------+
```

## Key Conceptual Changes

| Current | Proposed |
|---------|----------|
| Separate cube per event | Single cube for all |
| Separate timestamp per event | Single timestamp |
| Multiple cohorts (per granularity) | Single cohort (date range) |
| Granularity = cohort grouping | Granularity = viewing periods |
| No segmentation | Breakdown dimension support |

---

## Implementation Status

### ✅ Phase 1: Client State Simplification - COMPLETE (REVISED)

**File: `src/client/types/retention.ts`** ✅
- Consolidated state from ~12 fields to ~10:
  - `retentionCube` (was: retentionCohortCube + retentionActivityCube)
  - `retentionTimeDimension` (was: retentionCohortTimeDimension + retentionActivityTimeDimension)
  - `retentionDateRange` (was: retentionCohortDateRange)
  - `retentionViewGranularity` (was: retentionCohortGranularity + retentionPeriodGranularity)
  - `retentionBreakdowns: RetentionBreakdownItem[]` (NEW - array for multiple breakdowns)
- Updated `RetentionQueryConfig` for server format with `breakdownDimensions?: string[]`
- Updated `RetentionResultRow` with `breakdownValue`
- Updated `RetentionChartData` (removed `cohorts`, added `breakdownValues`)

**File: `src/client/stores/slices/retentionSlice.ts`** ✅
- Consolidated actions:
  - `setRetentionCube` (was: setRetentionCohortCube + setRetentionActivityCube)
  - `setRetentionTimeDimension` (was: setRetentionCohortTimeDimension + setRetentionActivityTimeDimension)
  - `setRetentionDateRange` (was: setRetentionCohortDateRange)
  - `setRetentionViewGranularity` (was: setRetentionCohortGranularity + retentionPeriodGranularity)
  - `setRetentionBreakdowns` / `addRetentionBreakdown` / `removeRetentionBreakdown` (NEW - array support)
- Updated `buildRetentionQuery()` for new format
- Updated `getRetentionValidation()`

**File: `src/client/stores/analysisBuilderStore.tsx`** ✅
- Updated `AnalysisBuilderStoreState` interface with `retentionBreakdowns: RetentionBreakdownItem[]`
- Updated `AnalysisBuilderStoreActions` interface with array-based breakdown actions

### ✅ Phase 2: UI Components - COMPLETE (REVISED FOR FLOW PATTERN)

**Deleted Components:**
- `RetentionGlobalConfigSection.tsx` - DELETED (replaced by RetentionConfigPanel)
- `RetentionFilterSection.tsx` - DELETED (now uses AnalysisFilterSection directly)
- `RetentionBreakdownSection.tsx` - DELETED (now uses BreakdownSection directly)
- `RetentionSettingsSection.tsx` - DELETED (inline in RetentionModeContent)
- `RetentionConfigPanelV2.tsx` - DELETED (replaced by RetentionConfigPanel)
- `RetentionEventSection.tsx` - DELETED (not needed in simplified design)

**File: `src/client/components/AnalysisBuilder/RetentionConfigPanel.tsx`** ✅ NEW
- Collapsible configuration panel (matches FlowConfigPanel pattern)
- Contains: Cube selector, Binding Key selector, Timestamp selector, Date Range picker
- Auto-collapses when config is complete
- Shows summary when collapsed

**File: `src/client/components/AnalysisBuilder/RetentionModeContent.tsx`** ✅ REWRITTEN
- Pattern matches FlowModeContent for consistency:
  - Tab bar: Retention | Display
  - RetentionConfigPanel (collapsible at top)
  - Flat sections in scrollable area:
    1. Cohort Filter (using AnalysisFilterSection directly)
    2. Return Filter (using AnalysisFilterSection directly)
    3. Breakdown (using BreakdownSection - reused from Query mode)
    4. Settings (granularity, periods, type - inline)
  - Display tab with AnalysisDisplayConfigPanel
- Props updated for simplified state structure with array breakdowns

### ⏳ Phase 3: Server Updates - PENDING

**File: `src/server/types/retention.ts`**
- Add `breakdownDimension?: string` to `RetentionQueryConfig`
- Add `breakdownValue?: string | null` to `RetentionResultRow`

**File: `src/server/retention-query-builder.ts`**
- Add breakdownDimension to SELECT clause in cohort CTE
- Add GROUP BY breakdown in aggregation
- Include breakdown value in result transformation

### ✅ Phase 4: Combined Chart - COMPLETE

**File: `src/client/components/charts/RetentionCombinedChart.tsx`** ✅ NEW
- Combined heatmap + line visualization
- X-axis: Period numbers (P0, P1, P2...)
- Y-axis: Retention % (0-100%)
- Lines: One per breakdown value (or single if no breakdown)
- Display modes: 'heatmap' | 'line' | 'combined'

**File: `src/client/components/charts/RetentionCombinedChart.config.ts`** ✅ NEW
- Chart config with retentionDisplayMode selector
- Display options: showLegend, showGrid, showTooltip

**File: `src/client/types.ts`** ✅
- Added chart type: `'retentionCombined'`

**File: `src/client/charts/lazyChartConfigRegistry.ts`** ✅
- Registered new chart lazy loader

**File: `src/client/charts/ChartLoader.tsx`** ✅
- Added chart to import map

**File: `src/client/components/ChartTypeSelector.tsx`** ✅
- Added label: 'Retention Chart'

**File: `src/client/components/AnalysisBuilder/AnalysisChartConfigPanel.tsx`** ✅
- Excluded retention charts from query mode selector

### ⏳ Phase 5: Wiring & Adapter - PENDING

**File: `src/client/adapters/retentionModeAdapter.ts`**
- Update `extractState()` for new field names
- Update `stateToServerQuery()` for new query format
- Update `serverQueryToState()` for loading
- Update `validate()` for new required fields
- NO backward compatibility (fresh start)

**File: `src/client/hooks/useAnalysisBuilderHook.ts`**
- Map new store state to component props
- Update retention-specific selectors

**File: `src/client/components/AnalysisBuilder/AnalysisQueryPanel.tsx`**
- Wire new retention props

### ⏳ Phase 6: Cleanup - PENDING

**Files to update for type errors:**
- `src/client/hooks/queries/useRetentionQuery.ts` - Update for new result format
- `src/client/components/charts/RetentionHeatmap.tsx` - Update for new data format
- `src/client/components/AnalysisBuilder/AnalysisResultsPanel.tsx` - Update retention data handling
- `src/client/hooks/useAnalysisQueryExecution.ts` - Update retention result processing
- `src/client/types/analysisConfig.ts` - Update default example
- `tests/client/adapters/retentionModeAdapter.test.ts` - Update all test fixtures

---

## Files to Modify (Summary)

### Core State (Phase 1) ✅
- `src/client/types/retention.ts` ✅ (updated for array breakdowns)
- `src/client/stores/slices/retentionSlice.ts` ✅ (updated for array breakdowns)
- `src/client/stores/analysisBuilderStore.tsx` ✅ (updated for array breakdowns)

### UI Components (Phase 2) ✅ - REVISED
- `src/client/components/AnalysisBuilder/RetentionConfigPanel.tsx` ✅ NEW (collapsible, FlowConfigPanel pattern)
- `src/client/components/AnalysisBuilder/RetentionModeContent.tsx` ✅ REWRITTEN (FlowModeContent pattern)
- Deleted: RetentionGlobalConfigSection, RetentionFilterSection, RetentionBreakdownSection, RetentionSettingsSection, RetentionConfigPanelV2, RetentionEventSection

### Server (Phase 3)
- `src/server/types/retention.ts` ⏳
- `src/server/retention-query-builder.ts` ⏳

### Chart (Phase 4) ✅
- `src/client/components/charts/RetentionCombinedChart.tsx` ✅ NEW
- `src/client/components/charts/RetentionCombinedChart.config.ts` ✅ NEW
- `src/client/types.ts` ✅
- `src/client/charts/lazyChartConfigRegistry.ts` ✅
- `src/client/charts/ChartLoader.tsx` ✅
- `src/client/components/ChartTypeSelector.tsx` ✅
- `src/client/components/AnalysisBuilder/AnalysisChartConfigPanel.tsx` ✅

### Wiring (Phase 5)
- `src/client/adapters/retentionModeAdapter.ts` ⏳
- `src/client/hooks/useAnalysisBuilderHook.ts` ⏳
- `src/client/components/AnalysisBuilder/AnalysisQueryPanel.tsx` ⏳

---

## Reference Patterns

| Feature | Reference File | Notes |
|---------|---------------|-------|
| Collapsible config | `FlowConfigPanel.tsx` | RetentionConfigPanel follows this pattern exactly |
| Mode content structure | `FlowModeContent.tsx` | Tabs, scrollable sections, flat layout |
| Filter section | `AnalysisFilterSection.tsx` | Reused directly (not wrapped) |
| Breakdown selection | `BreakdownSection.tsx` | Reused with RetentionBreakdownItem→BreakdownItem conversion |
| ComposedChart (heatmap+line) | `AreaChart.tsx` | For future RetentionCombinedChart |

---

## Design Decisions (Confirmed)

1. **Breakdown**: Multiple dimensions supported (array, using BreakdownSection from Query mode)
2. **Migration**: No backward compatibility - start fresh with new config format
3. **Chart**: New `retentionCombined` type with display config for heatmap/line/combined toggle
4. **UI Pattern**: Matches FlowModeContent with collapsible config and flat sections
5. **Component Reuse**: Uses existing AnalysisFilterSection and BreakdownSection for consistency

---

## Verification

1. **Build**: `npm run build:client` passes
2. **Typecheck**: `npm run typecheck` passes
3. **Test**: `npm test` passes
4. **Visual**: Dev server shows new compact layout
5. **Functional**: Single cohort + breakdown produces correct chart with display mode toggle

---

## Current Type Errors (~80)

After Phase 1 completion, there are type errors in files that still reference old field names:
- `retentionModeAdapter.ts` - ~45 errors (Phase 5)
- `useAnalysisBuilderHook.ts` - ~12 errors (Phase 5)
- `useRetentionQuery.ts` - ~6 errors (Phase 6)
- `RetentionHeatmap.tsx` - ~6 errors (Phase 6)
- `AnalysisResultsPanel.tsx` - ~1 error (Phase 6)
- `useAnalysisQueryExecution.ts` - ~1 error (Phase 6)
- `analysisConfig.ts` - ~1 error (Phase 6)
- `retentionModeAdapter.test.ts` - ~20 errors (Phase 6)

These will be resolved as each phase is completed.
