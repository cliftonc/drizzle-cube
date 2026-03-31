# I18n Bare Strings Phased Plan

## Goal
Eliminate all remaining `no-restricted-syntax` bare JSX text warnings and keep key naming consistent in `src/i18n/locales/en.json`.

## Status (2026-03-31)
- Phase 1: completed (AnalysisBuilder + Dashboard/shared/client utility files).
- Phase 2: completed (all chart runtime files).
- Phase 3: completed (lint + locale coverage checks + key parity checks).
- Current result:
  - `src/client/**/*.{ts,tsx}` lint = `0` warnings, `0` errors, `0` bare string warnings.
  - Full repo still has unrelated test lint backlog (`unused vars` + test-rule errors), but no remaining bare JSX text warnings.
  - Added `src/i18n/locales/nl-NL.json` with full key parity (`1293/1293` keys).

Baseline (2026-03-31):
- `325` bare string warnings
- `25` unused-var warnings (mostly unused `t` imports in chart files)

## Execution Model (Agent-Style)
Use 4 parallel workstreams ("agents"), each owning disjoint file sets to avoid merge conflicts.

Shared rules for all agents:
- Reuse existing keys in `en.json` before adding new keys.
- New keys go only in `src/i18n/locales/en.json` (not `en-US.json`).
- Keep key namespaces aligned to component domain:
  - `chart.runtime.*`
  - `analysis.*`, `results.*`, `flow.*`, `funnel.*`, `retention.*`
  - `dashboardFilter.*`
  - `filter.shared.*`, `common.*`
- If a string has dynamic values, use params: `t('key', { value })`.
- Remove unused `t` imports when no longer needed.

## Phase 0 - Setup (fast)
1. Create a temporary "key staging" section in `en.json` comments/doc notes (outside JSON file) for proposed new keys by each agent.
2. Freeze branch strategy:
   - `codex/i18n-agent-a-analysis`
   - `codex/i18n-agent-b-dashboard`
   - `codex/i18n-agent-c-charts-a`
   - `codex/i18n-agent-d-charts-b`
3. Standard validation command:
   - `npx eslint 'src/**/*.{ts,tsx}' 'tests/**/*.ts'`

Exit criteria:
- Work assignment finalized, no overlapping files.

## Phase 1 - Highest Impact UI Modules

### Agent A (AnalysisBuilder core, 104 bare strings)
- `src/client/components/AnalysisBuilder/AnalysisAxisDropZone.tsx`
- `src/client/components/AnalysisBuilder/AnalysisDisplayConfigPanel.tsx`
- `src/client/components/AnalysisBuilder/AnalysisModeErrorBoundary.tsx`
- `src/client/components/AnalysisBuilder/AnalysisResultsPanel.tsx`
- `src/client/components/AnalysisBuilder/ExecutionPlanPanel.tsx`
- `src/client/components/AnalysisBuilder/ExplainAIPanel.tsx`
- `src/client/components/AnalysisBuilder/FieldSearchModal.tsx`
- `src/client/components/AnalysisBuilder/FlowConfigPanel.tsx`
- `src/client/components/AnalysisBuilder/FlowModeContent.tsx`
- `src/client/components/AnalysisBuilder/FunnelBindingKeySelector.tsx`
- `src/client/components/AnalysisBuilder/FunnelConfigPanel.tsx`
- `src/client/components/AnalysisBuilder/FunnelModeContent.tsx`
- `src/client/components/AnalysisBuilder/FunnelStepCard.tsx`
- `src/client/components/AnalysisBuilder/FunnelStepList.tsx`
- `src/client/components/AnalysisBuilder/RetentionConfigPanel.tsx`
- `src/client/components/AnalysisBuilder/RetentionModeContent.tsx`

### Agent B (Dashboard + shared filter UX, 109 bare strings)
- `src/client/components/DashboardFilters/CompactFilterBar.tsx`
- `src/client/components/DashboardFilters/CustomDateDropdown.tsx`
- `src/client/components/DashboardFilters/DashboardFilterConfigModal.tsx`
- `src/client/components/DashboardFilters/DashboardFilterItem.tsx`
- `src/client/components/DashboardFilters/EditModeFilterList.tsx`
- `src/client/components/DashboardFilters/FilterValuePopover.tsx`
- `src/client/components/DashboardFilters/ReadOnlyFilterList.tsx`
- `src/client/components/AnalyticsPage.tsx`
- `src/client/components/AnalyticsPortlet.tsx`
- `src/client/components/ChartErrorBoundary.tsx`
- `src/client/components/DashboardEditModal.tsx`
- `src/client/components/DashboardGrid.tsx`
- `src/client/components/DataHistogram.tsx`
- `src/client/components/DebugModal.tsx`
- `src/client/components/DrillBreadcrumb.tsx`
- `src/client/components/PortletAnalysisModal.tsx`
- `src/client/components/PortletFilterConfigModal.tsx`
- `src/client/components/TextPortletModal.tsx`
- `src/client/components/shared/DateRangeFilter.tsx`
- `src/client/components/shared/FilterBuilder.tsx`
- `src/client/components/shared/FilterGroup.tsx`
- `src/client/components/shared/FilterItem.tsx`
- `src/client/components/shared/FilterValueSelector.tsx`
- `src/client/shared/components/CodeBlock.tsx`
- `src/client/shared/components/QueryAnalysisPanel.tsx`
- `src/client/charts/ChartLoader.tsx`

Exit criteria:
- Bare-string warnings in AnalysisBuilder + Dashboard/shared groups reduced to zero.
- New keys are namespaced and deduplicated.

## Phase 2 - Charts Runtime Sweep (98 bare strings + 24 unused `t`)

Split charts across two agents to parallelize and reduce conflicts.

### Agent C (Charts set A)
- `src/client/components/charts/ActivityGridChart.tsx`
- `src/client/components/charts/AreaChart.tsx`
- `src/client/components/charts/BarChart.tsx`
- `src/client/components/charts/BoxPlotChart.tsx`
- `src/client/components/charts/BubbleChart.tsx`
- `src/client/components/charts/CandlestickChart.tsx`
- `src/client/components/charts/ChartContainer.tsx`
- `src/client/components/charts/DataTable.tsx`
- `src/client/components/charts/FunnelChart.tsx`
- `src/client/components/charts/GaugeChart.tsx`
- `src/client/components/charts/HeatMapChart.tsx`
- `src/client/components/charts/KpiDelta.tsx`
- `src/client/components/charts/KpiNumber.tsx`
- `src/client/components/charts/KpiText.tsx`

### Agent D (Charts set B)
- `src/client/components/charts/LineChart.tsx`
- `src/client/components/charts/MarkdownChart.tsx`
- `src/client/components/charts/MeasureProfileChart.tsx`
- `src/client/components/charts/MissingDependencyFallback.tsx`
- `src/client/components/charts/PieChart.tsx`
- `src/client/components/charts/RadarChart.tsx`
- `src/client/components/charts/RadialBarChart.tsx`
- `src/client/components/charts/RetentionCombinedChart.tsx`
- `src/client/components/charts/RetentionHeatmap.tsx`
- `src/client/components/charts/SankeyChart.tsx`
- `src/client/components/charts/ScatterChart.tsx`
- `src/client/components/charts/SunburstChart.tsx`
- `src/client/components/charts/TreeMapChart.tsx`
- `src/client/components/charts/WaterfallChart.tsx`

Chart-specific guidance:
- Prefer generic runtime keys when identical text repeats:
  - `chart.runtime.configError`
  - `chart.runtime.invalidAxisConfig`
  - `chart.runtime.missingRequiredAxes`
  - `chart.runtime.noValidData`
  - `chart.runtime.unableToDisplay`
  - `chart.runtime.checkDataConfig`
- Use chart-specific keys only when copy is truly chart-specific.

Exit criteria:
- All chart bare strings removed.
- Unused `t` import warnings in chart files removed.

## Phase 3 - Key Consolidation + Lint Gate
1. Consolidate all newly added keys into logical sections in `en.json`.
2. Remove duplicate/near-duplicate keys introduced across agents.
3. Run final lint.

Exit criteria:
- `no-restricted-syntax` warnings = `0`
- `@typescript-eslint/no-unused-vars` warnings addressed where touched
- No net increase in unrelated warnings

## Phase 4 - Optional Hardening
1. Add a short i18n contribution note in client docs:
   - "No bare JSX text; always use `t()` for user-facing strings."
2. Add a CI check (lint target) if not already enforced in PR workflow.

## Fast Merge Strategy
1. Merge Agent A + Agent B first (largest UX surface, least chart overlap).
2. Rebase Agent C and Agent D on merged result.
3. Merge C and D.
4. Run final lint + smoke check.

## Tracking Template (use per PR)
- Scope:
- Files touched:
- New keys added:
- Existing keys reused:
- Lint before:
- Lint after:
- Notes on contentious phrasing:
