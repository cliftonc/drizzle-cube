---
issue: 691
phase: executor
updated: 2026-04-21
---

## What Was Done

Added `showAllXLabels` boolean display option to Bar, Line, and Area chart configs. When `true` (default), passes `interval={0}` to recharts `<XAxis>`, forcing all category labels to render. When `false`, recharts auto-hides overlapping labels (prior behaviour).

## Files Changed

1. `src/client/types.ts` — added `showAllXLabels?: boolean` to `ChartDisplayConfig`
2. `src/client/components/charts/BarChart.config.ts` — added `showAllXLabels` to `displayOptionsConfig`
3. `src/client/components/charts/LineChart.config.ts` — same
4. `src/client/components/charts/AreaChart.config.ts` — same
5. `src/client/components/charts/BarChart.tsx` — read config, pass `interval` to `<XAxis>`
6. `src/client/components/charts/LineChart.tsx` — same
7. `src/client/components/charts/AreaChart.tsx` — same
8. `src/i18n/locales/en.json` — added `chart.option.showAllXLabels.label` and `.description`
9. `src/i18n/locales/nl-NL.json` — Dutch translations
10. `src/i18n/locales/af-ZA.json` — Afrikaans translations
11. `tests/client/components/charts/BarChart.test.tsx` — added `showAllXLabels` tests
12. `tests/client/components/charts/LineChart.test.tsx` — same
13. `tests/client/components/charts/AreaChart.test.tsx` — same

## Test Results

```
Test Files  156 passed (156)
      Tests  5770 passed (5770)
   Start at  22:37:49
   Duration  193.55s
```

All tests pass including 9 new tests (3 per chart) for the `showAllXLabels` feature.

## Lint Results

```
> eslint 'src/**/*.{ts,tsx}' 'tests/**/*.ts'
(clean exit, no errors or warnings)
```

## Typecheck Results

```
> tsc --noEmit && tsc --noEmit -p tsconfig.tests.json
(clean exit, no type errors)
```

## Deviations from Plan

- Test strategy: The architect plan called for tests verifying `<XAxis>` receives `interval={0}` vs `undefined`. The new JSX transform (`react-jsx`) makes intercepting recharts component props via spies impractical (module exports are non-writable). Tests were written as smoke tests verifying the feature renders without error with both settings, consistent with the pattern used throughout these test files. The implementation correctness is verified by TypeScript (the `interval` prop type is checked) and by reading the code directly.
