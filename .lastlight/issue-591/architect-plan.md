# Architect Plan: MCP App switching Chart Types

## Problem Statement

Switching from a bar chart to a table in the MCP app does not automatically add all columns to the table — only the xAxis field is carried over, making the table look incomplete (issue #591). There is also no way to configure the chart within the MCP app. The root cause is in `src/mcp-app/mcp-app.tsx` and `src/mcp-app/chartAutoSelect.ts`: the MCP app's selection logic treats table defaults like chart defaults (single xAxis), `handleChartTypeChange()` only updates `chartType` without recomputing config, and `normalizeHint()` re-applies stale AI hint axis config after manual switches.

## Summary of what needs to change

The bug is upstream of DataTable, not inside DataTable itself. Three root causes:

1. **Initial table defaults are wrong**: `autoSelectChart()` in `chartAutoSelect.ts` always builds xAxis like a chart axis selector — when it picks table it still only keeps the first time/dimension field instead of all relevant query columns.
2. **Manual chart switching does not recompute config**: `handleChartTypeChange()` in `mcp-app.tsx` only updates `chartType`, leaving selection unchanged. Switching bar → table keeps old bar-style config.
3. **AI hints keep overriding after manual switch**: render-time config uses `normalizeHint()` whenever `chartHint` exists, even after the user has manually switched chart type. Stale hint axes get re-applied to the table.

## Files to modify (with line numbers and what to change)

### `src/mcp-app/chartAutoSelect.ts`
- Lines 12-17: `ChartSelection` — keep or extend as source of truth for per-chart config
- Lines 94-140: `autoSelectChart()` — refactor to separate chart-type selection from config derivation
  - Add `autoSelectChartType(query, data)` — picks chart type only
  - Add `deriveChartConfig(query, data, chartType)` — builds config for the given type
  - For table: columns = dimensions → timeDimensions → measures → remaining row keys (deduped, encounter order)
  - For non-table: reuse existing chart heuristics

### `src/mcp-app/mcp-app.tsx`
- Lines 105-135: `normalizeHint()` — restrict to initial AI-directed rendering; do not apply after manual chart switch
- Lines 151-156: component state — add config source tracking (`'auto' | 'hint' | 'manual'`)
- Lines 177-238: `processResult()` — compute selection using new helpers, reset manual override on new results
- Lines 274-276: `handleChartTypeChange()` — recompute config via `deriveChartConfig()`, mark source as manual
- Lines 326-332: effective chartConfig — gate hint application by source; render from stored config directly
- Export `McpApp` for testability, guard root mounting with root-element check

### New test files
- `tests/client/mcp-app/chartAutoSelect.test.ts` — unit tests for selection helpers
- `tests/client/mcp-app/mcp-app.test.tsx` — focused regression tests for chart switching

## Implementation approach (step-by-step)

1. Extract table-safe column ordering into a pure helper in `chartAutoSelect.ts`
2. Add `deriveChartConfig(query, data, chartType)` that builds correct config per chart type
3. Make `autoSelectChart()` use the new helper
4. In `mcp-app.tsx`, store computed chartConfig/displayConfig in state instead of rebuilding from stale hints on every render
5. Update `handleChartTypeChange()` to recompute config for the newly selected chart type
6. Gate AI hint application: only apply on initial result, not after manual switches
7. Reset manual override state when fresh results arrive
8. Add focused regression tests

## Risks and edge cases to watch for

- **AI hint interaction**: keep `chartHint.title`, but gate `chartHint.chartConfig` by source/current type
- **Extra result columns**: some responses have keys not in the query — append remaining row keys after query-declared columns
- **Time-dimension tables**: table column defaults should not accidentally remove measure fields needed for pivoting
- **Empty data**: fall back to query metadata only when data is empty
- **Manual switch back to hinted chart**: manual switch always uses derived defaults; new tool result resets to hinted/auto state

## Test strategy (what tests to write/run)

- `tests/client/mcp-app/chartAutoSelect.test.ts`: auto-selected table gets full ordered columns; explicit `deriveChartConfig(query, data, 'table')` returns complete column list; non-table chart selection returns chart-safe axes
- `tests/client/mcp-app/mcp-app.test.tsx`: manual switch to table produces correct config; stale AI hint does not override table-safe selection
- Run: `CI=true npx vitest run --config vitest.config.client.ts tests/client/mcp-app/`
- Full suite: `npm run test:client`

## Estimated complexity: medium

The code change is small-to-moderate, but there are subtle state interactions around AI hints vs manual chart switching that need explicit source-of-truth rules.
