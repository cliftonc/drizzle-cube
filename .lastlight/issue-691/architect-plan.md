# Architect Plan — Issue #691

## Problem Statement

Bar, Line, and Area charts use recharts `<XAxis>` without an explicit `interval` prop (`BarChart.tsx:209-214`, `LineChart.tsx:221-238`, `AreaChart.tsx:165`). By default, recharts auto-hides labels when they overlap, which means some X-axis categories are silently dropped. There is no user-facing option to force all labels to display. The issue requests a configurable display option — ideally defaulting to "show all" — that sets `interval={0}` on the recharts `<XAxis>` component, ensuring every category label is rendered.

## Summary of Changes

Add a new `showAllXLabels` boolean display option to Bar, Line, and Area chart configs. When enabled (default: `true`), pass `interval={0}` to the `<XAxis>` component. When disabled, let recharts auto-hide overlapping labels (the current behaviour). This uses the existing `displayOptionsConfig` pattern — no new UI components needed.

## Files to Modify

### 1. `src/client/types.ts` ~line 165 (ChartDisplayConfig interface)
- Add `showAllXLabels?: boolean` property

### 2. `src/client/components/charts/BarChart.config.ts` lines 44-76
- Add `showAllXLabels` entry to `displayOptionsConfig` array

### 3. `src/client/components/charts/LineChart.config.ts` lines 44-93
- Add `showAllXLabels` entry to `displayOptionsConfig` array

### 4. `src/client/components/charts/AreaChart.config.ts` lines 43-82
- Add `showAllXLabels` entry to `displayOptionsConfig` array

### 5. `src/client/components/charts/BarChart.tsx` lines 209-214
- Read `displayConfig?.showAllXLabels` (default `true`)
- Pass `interval={showAllXLabels ? 0 : undefined}` to `<XAxis>`

### 6. `src/client/components/charts/LineChart.tsx` lines 221-238
- Same pattern: read config, pass `interval` prop to `<XAxis>`

### 7. `src/client/components/charts/AreaChart.tsx` line 165
- Same pattern: read config, pass `interval` prop to `<XAxis>`

### 8. i18n locale files (4 files)
- `src/i18n/locales/en.json` — add `chart.option.showAllXLabels.label` and `chart.option.showAllXLabels.description`
- `src/i18n/locales/en-US.json` — same keys
- `src/i18n/locales/nl-NL.json` — same keys (Dutch translation)
- `src/i18n/locales/af-ZA.json` — same keys (Afrikaans translation)

## Implementation Approach

1. **Add type** — extend `ChartDisplayConfig` with `showAllXLabels?: boolean`
2. **Add i18n keys** — `chart.option.showAllXLabels.label` = "Show All X Labels", `chart.option.showAllXLabels.description` = "Display every label on the X-axis instead of auto-hiding overlapping labels"
3. **Add config entries** — add to each chart's `displayOptionsConfig`:
   ```ts
   {
     key: 'showAllXLabels',
     label: 'chart.option.showAllXLabels.label',
     type: 'boolean',
     defaultValue: true,
     description: 'chart.option.showAllXLabels.description'
   }
   ```
4. **Wire up in chart components** — in each chart's render, read the option and pass to `<XAxis>`:
   ```tsx
   const showAllXLabels = displayConfig?.showAllXLabels ?? true
   // ...
   <XAxis
     dataKey="name"
     type="category"
     tick={<AngledXAxisTick />}
     height={60}
     interval={showAllXLabels ? 0 : undefined}
   />
   ```
5. **Run checks** — `npm run typecheck`, `npm run lint`, `npm run test:client`

## Risks and Edge Cases

- **Overflow with many categories**: When `interval={0}` is set and there are many data points (50+), angled labels may overlap or extend outside the chart area. This is acceptable — the user explicitly opted in, and the existing `-45°` angle in `AngledXAxisTick` mitigates most overlap. Users can toggle the option off if labels become unreadable.
- **Performance**: No concern — recharts handles `interval={0}` efficiently even with hundreds of ticks.
- **Existing dashboards**: Defaulting to `true` changes behaviour for existing charts (labels that were auto-hidden will now show). This is the desired outcome per the issue. If a conservative approach is preferred, default could be `false`, but the issue explicitly asks for "ideally as default".
- **Pie chart**: The issue mentions pie charts, but pie charts don't have an X-axis — their labels are handled differently (slice labels). No change needed for pie charts; this is a recharts XAxis feature only.

## Test Strategy

- **Unit tests**: Add test cases in existing chart test files to verify:
  1. `<XAxis>` receives `interval={0}` when `showAllXLabels` is `true` (default)
  2. `<XAxis>` receives no `interval` prop when `showAllXLabels` is `false`
- **Type checking**: `npm run typecheck` passes with new property
- **Linting**: `npm run lint` passes
- **Client tests**: `npm run test:client` — all existing tests pass

## Estimated Complexity

**Simple** — follows an established pattern (`displayOptionsConfig` + reading in component). No new components, no architectural changes, no migrations needed. ~8 files touched with small, repetitive changes.
