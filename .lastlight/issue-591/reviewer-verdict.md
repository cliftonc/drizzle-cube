# Reviewer Verdict — Issue #591

**Verdict: REQUEST_CHANGES**

## Issues found

1. **Legacy/typeless chart hints can still break initial table rendering**
   - Evidence: `src/mcp-app/mcp-app.tsx:208-213` always routes any incoming hint through `normalizeHint(...)` and marks the config source as `hint`, even when `ChartHint.type` is absent.
   - Evidence: `src/mcp-app/mcp-app.tsx:102-116` then blindly overlays `hint.chartConfig`, `hint.xAxis`, and `hint.yAxis` onto the derived config for the resolved chart type.
   - Impact: if the MCP host sends a backward-compatible hint with only `xAxis`/`yAxis` (or `chartConfig`) and no `type`, an auto-selected `table` still gets the stale chart axes instead of the full derived column list. That reproduces the original failure mode on first render for wide/tabular results.
   - Why this matters: `ChartHint.type` is explicitly optional in the changed interface, so this path is reachable with supported inputs.

## Test results

- `CI=true npx vitest run --config vitest.config.client.ts tests/client/mcp-app/` ✅ passed (2 files, 5 tests)
- Additional ad hoc repro test for a hint without `type` but with legacy `xAxis`/`yAxis` ❌ failed: the table received `xAxis: ['Orders.status']` and `yAxis: ['Orders.count']` instead of the full derived table column set

## Suggestions

- Gate hint axis/config application by chart type, not just by hint presence. In practice, typeless hints should be allowed to contribute metadata like `title`, but not override a derived table config unless the hint explicitly targets that chart type.
- Add a focused regression test covering a hint with no `type` plus legacy `xAxis`/`yAxis` while auto-selection resolves to `table`.
