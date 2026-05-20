# Architect Plan: Add Choropleth Maps — Issue #275

## Problem Statement

Users cannot visualize geographic data on maps. The issue requests choropleth maps (color-coded regions), geo-scatter plots, and geo heat maps. This PR delivers **ChoroplethChart** as the first geographic chart type.

## Files to Modify

### New Files
1. `src/client/components/charts/ChoroplethChart.tsx` — chart component using `@nivo/geo`
2. `src/client/components/charts/ChoroplethChart.config.ts` — chart drop zone config
3. `tests/client/charts/ChoroplethChart.test.tsx` — unit tests

### Modified Files
4. `package.json` — add `@nivo/geo` to devDependencies
5. `src/client/charts/chartConfigRegistry.ts` — register `choropleth`
6. `src/client/charts/lazyChartConfigRegistry.ts` — add lazy config import
7. `src/client/charts/ChartLoader.tsx` — add lazy component import + dependency entry
8. `src/client/types.ts` — add `'choropleth'` to `BuiltInChartType`, add geo display options to `ChartDisplayConfig`
9. `src/i18n/locales/en.json` — translation keys
10. `src/i18n/locales/nl-NL.json` — Dutch translations
11. `src/i18n/locales/en-US.json` — US English (no British spelling differences)
12. `src/i18n/locales/af-ZA.json` — Afrikaans (add keys)

## Implementation Steps

### Step 1: ChoroplethChart.config.ts
Drop zones:
- `xAxis` (mandatory, maxItems:1, dimension) — region code field (country code, state code, etc.)
- `valueField` (mandatory, maxItems:1, measure) — value to colour by

DisplayOptionsConfig:
- `geoProjection`: select — 'mercator' | 'naturalEarth1' | 'equalEarth'
- `colorScale`: select — 'sequential' | 'diverging'
- `unknownColor`: string — colour for unmatched features
- `showGraticule`: boolean
- `showLegend`: boolean
- `geoIdProperty`: string — feature property to match against data (default: 'id')

### Step 2: ChoroplethChart.tsx
- Uses `ResponsiveChoropleth` from `@nivo/geo`
- Props: `data`, `chartConfig`, `displayConfig`, `colorPalette`, `height`, `onDataPointClick`, `drillEnabled`
- Geographic features from `displayConfig.geoFeatures` (JSON string of GeoJSON Feature[])
  or fetched from `displayConfig.geoFeaturesUrl` (URL string)
- Show meaningful empty/setup state when no features configured
- Transform flat query rows `[{ 'Sales.country': 'US', 'Sales.total': 1000 }]` → `[{ id: 'US', value: 1000 }]`
- Compute domain from data min/max
- Use `colorPalette.gradient` for sequential color scale

### Step 3: Registration
- `chartConfigRegistry.ts`: add `choropleth: choroplethChartConfig`
- `lazyChartConfigRegistry.ts`: add `choropleth` to both `configImportMap` and `configExportNames`
- `ChartLoader.tsx`: add `choropleth` to `chartImportMap` and `chartDependencyMap` with `@nivo/geo`

### Step 4: Types
- `BuiltInChartType`: add `'choropleth'`
- `ChartDisplayConfig`: add geo-specific fields:
  - `geoFeatures?: string` — JSON string of GeoJSON Feature array
  - `geoFeaturesUrl?: string` — URL to fetch GeoJSON
  - `geoProjection?: 'mercator' | 'naturalEarth1' | 'equalEarth'`
  - `geoIdProperty?: string` — feature property for matching
  - `unknownColor?: string` — colour for regions with no data
  - `showGraticule?: boolean`

### Step 5: i18n
Add keys:
- `chart.choropleth.label`, `.description`, `.useCase`
- `chart.choropleth.dropZone.xAxis.empty`, `.valueField.empty`
- `chart.choropleth.validation.regionRequired`, `.valueRequired`
- `chart.runtime.noDataHint.choropleth`
- `chart.runtime.choroplethConfigRequired`
- `chart.runtime.choroplethFeaturesRequired`
- `chart.option.geoProjection.*`, `chart.option.unknownColor.*`
- `chart.option.geoIdProperty.*`, `chart.option.showGraticule.*`

### Step 6: Tests
- Empty state tests (no data, no config)
- Features-required state (when geoFeatures not set)
- Data transformation tests (flat rows → {id, value})
- Render with mock @nivo/geo (same pattern as HeatMapChart tests)

## Risks
- `@nivo/geo` peer dep: chart degrades gracefully via existing `MissingDependencyFallback` if not installed
- Feature matching: if user dimension values don't match feature IDs, regions show `unknownColor` — clear doc
- URL fetching: async state management with loading/error states

## Test Strategy
- Unit tests using vitest + React Testing Library
- Mock `@nivo/geo` (same pattern as `@nivo/heatmap` in HeatMapChart.test.tsx)
- Mock `fetch` for URL loading tests
- Test transformation logic independently

## Complexity
Medium — follows existing heatmap pattern closely; geographic data loading adds async complexity.
