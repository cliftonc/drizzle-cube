---
name: add-chart-type
description: Use when adding a new built-in chart type to drizzle-cube. Covers type definition, component, config, registry entries, lazy loading, icons, and exports.
---

# Adding a Built-In Chart Type

Drizzle-cube uses a registry-based chart architecture. Each chart type needs: a type literal in `BuiltInChartType`, a React component, a config object defining drop zones and display options, entries in three registries (sync config, lazy config, lazy component), an icon, and exports. Follow this checklist in order.

For custom/third-party charts that don't modify the core library, use the plugin system instead (see Alternative: Plugin System below).

## Checklist

- [ ] **1. Add type literal** — In `src/client/types.ts`, add the new string literal to the `BuiltInChartType` union (27 existing members). The broader `ChartType = BuiltInChartType | (string & {})` union auto-includes it. If the chart needs custom axis fields, add them to `ChartAxisConfig` in the same file.

- [ ] **2. Create chart component** — Create `src/client/components/charts/{Name}.tsx`. Accept `ChartProps` (defined in `src/client/types.ts`). Use `memo()` for the default export. Key props: `data`, `chartConfig` (axis mappings), `displayConfig`, `height`, `colorPalette`, `fieldLabels`. Recharts-based charts wrap content in `ResponsiveContainer`; Nivo-based charts use their own responsive wrapper.

- [ ] **3. Create chart config** — Create `src/client/components/charts/{Name}.config.ts` (note: `.config.ts`, not `.config.tsx`). Export a named `{name}ChartConfig` of type `ChartTypeConfig` (from `src/client/charts/chartConfigs.ts`). Define `dropZones` (array of `AxisDropZoneConfig`), `displayOptions` or `displayOptionsConfig`, `icon` (via `getChartTypeIcon`), `description`, `useCase`, and optional `validate` function. Set `skipQuery: true` only for content-only charts (markdown, KPIs). **Always define `isAvailable`** — a function receiving `ChartAvailabilityContext` (`{ measureCount, dimensionCount, timeDimensionCount }`) and returning `ChartAvailability` (`{ available, reason? }`). Use shared i18n reason keys from `chart.availability.*`. `dimensionCount` includes both regular and time dimensions. Omit `isAvailable` only for charts that are always available (table, markdown).

- [ ] **4. Register in sync config registry** — In `src/client/charts/chartConfigRegistry.ts`, import the config and add it to the `chartConfigRegistry` object (type `ChartConfigRegistry`).

- [ ] **5. Register in lazy config registry** — In `src/client/charts/lazyChartConfigRegistry.ts`, add entries to both `configImportMap` (keyed by `BuiltInChartType`, value is a dynamic import) and `configExportNames` (maps the type to the exported config variable name).

- [ ] **6. Register in ChartLoader** — In `src/client/charts/ChartLoader.tsx`, add the chart to `chartImportMap` (dynamic import of the component). If it depends on an external package (recharts, @nivo/*), also add to `chartDependencyMap` with `packageName` and `installCommand`.

- [ ] **7. Add icon** — In `src/client/icons/defaultIcons.ts`, import the icon (Iconify Tabler set or custom from `customIcons.ts`) and add to `DEFAULT_ICONS` with `category: 'chart'` and key pattern `chart{Name}`. In `src/client/icons/registry.tsx`, add the mapping in `getChartTypeIcon`'s `typeMap` object.

- [ ] **8. Export (if needed)** — In `src/client/index.ts`, export any new public types. The chart component and config are consumed internally via registries and don't need explicit re-export.

- [ ] **9. Verify** — Run `npx tsc --noEmit` (typecheck) and `npm run build` to confirm no errors. Manually verify the chart renders in the chart picker, accepts field drops, and displays data correctly.

## File Reference

| File | Action | Key Symbols |
|------|--------|-------------|
| `src/client/types.ts` | Add literal to union; optionally extend axis config | `BuiltInChartType`, `ChartType`, `ChartAxisConfig`, `ChartProps` |
| `src/client/components/charts/{Name}.tsx` | Create | default export (memoized component) |
| `src/client/components/charts/{Name}.config.ts` | Create | `{name}ChartConfig` : `ChartTypeConfig` |
| `src/client/charts/chartConfigRegistry.ts` | Add import + entry | `chartConfigRegistry` : `ChartConfigRegistry` |
| `src/client/charts/lazyChartConfigRegistry.ts` | Add to both maps | `configImportMap`, `configExportNames` |
| `src/client/charts/ChartLoader.tsx` | Add to import map (+ dependency map if needed) | `chartImportMap`, `chartDependencyMap` |
| `src/client/icons/defaultIcons.ts` | Add icon entry | `DEFAULT_ICONS` |
| `src/client/icons/registry.tsx` | Add type→icon mapping | `getChartTypeIcon` |
| `src/client/charts/chartConfigs.ts` | Reference only | `ChartTypeConfig`, `AxisDropZoneConfig`, `ChartConfigRegistry` |
| `src/client/index.ts` | Export new public types if any | — |

## Reference Implementations

Use these existing charts as patterns to follow:

- **Simple Recharts chart:** `BarChart.tsx` + `BarChart.config.ts` — standard drop zones (xAxis, yAxis, series), boolean display options
- **Nivo chart:** `HeatMapChart.tsx` + `HeatMapChart.config.ts` — external @nivo dependency, custom drop zones (xAxis, yAxis, valueField)
- **Complex config:** `CandlestickChart.tsx` + `CandlestickChart.config.ts` — specialized axis fields (open/high/low/close), custom validation

## Alternative: Plugin System

For charts that live outside the core library (third-party or app-specific), use the runtime plugin system instead of modifying the built-in registries:

- Declarative: pass `customCharts` prop to `CubeProvider` with an array of `ChartDefinition` objects (type, label, config, component)
- Imperative: call `chartPluginRegistry.register()` from `src/client/charts/chartPlugin.ts` (exported via `src/client/index.ts`)

Plugin charts use `ChartType = BuiltInChartType | (string & {})` extensibility — any string works as a chart type without modifying `BuiltInChartType`.

## Verification

- `npx tsc --noEmit` — zero type errors
- `npm run build` — successful build
- Chart appears in chart type picker with correct icon
- Drop zones accept correct field types and render data
