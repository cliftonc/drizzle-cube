---
name: add-chart-type
description: Use when adding a new built-in chart type to drizzle-cube. Covers type definition, component, config, the unified chartRegistry entry, lazy loading, icons, and exports.
---

# Adding a Built-In Chart Type

Drizzle-cube has a **unified chart registry**: each chart's DOM-free metadata lives in one `chartRegistry` entry (`src/client/charts/chartRegistry.ts`), and the eager config registry, lazy config registry, icon lookup, and dependency lookup all **derive** from it. Adding a chart is now: a type literal, a component, a `.config.ts` (drop zones / display options only), **one `chartRegistry` entry**, one `baseConfigs` static import (so the server agent can read drop zones synchronously), one `ChartLoader` component import, and an icon.

For custom/third-party charts that don't modify the core library, use the plugin system instead (see Alternative: Plugin System below) — plugins flow through the *same* entry shape via `chartPluginRegistry.register()`.

## Documentation Context

Before designing or updating a built-in chart type, review https://www.drizzle-cube.dev/llms.txt for the current documentation map and public chart/plugin guidance. Use repository source and the checklist below as the implementation source of truth when docs and code differ.

## The split: entry vs config file

- **`chartRegistry` entry** owns the eager, DOM-free metadata — `label`, `icon`, `description`, `useCase`, `isAvailable`, `dependencies` — plus the lazy `config` thunk. This is the single source of truth.
- **`{Name}.config.ts`** owns the lazy-loaded shape — `dropZones`, `displayOptions`, `displayOptionsConfig`, `clickableElements`, `skipQuery`, `validate`. It must **not** carry `label`/`description`/`useCase`/`isAvailable` (those live on the entry; `composeChartConfig` lays the entry's metadata over this shape).
- The React **component** thunk is NOT on the entry (it pulls recharts / DOM globals). It stays in `ChartLoader`'s client-only `chartImportMap`.

## Checklist

- [ ] **1. Add type literal** — In `src/client/types.ts`, add the new string literal to the `BuiltInChartType` union. The broader `ChartType = BuiltInChartType | (string & {})` union auto-includes it. If the chart needs custom axis fields, add them to `ChartAxisConfig` in the same file.

- [ ] **2. Create chart component** — Create `src/client/components/charts/{Name}.tsx`. Accept `ChartProps` (from `src/client/types.ts`). Use `memo()` for the default export. Key props: `data`, `chartConfig` (axis mappings), `displayConfig`, `height`, `colorPalette`, `fieldLabels`. Recharts-based charts wrap content in `ResponsiveContainer`; Nivo-based charts use their own responsive wrapper.

- [ ] **3. Create chart config** — Create `src/client/components/charts/{Name}.config.ts` (note: `.config.ts`). Export a named `{name}ChartConfig` (or `{name}Config`) of type `ChartTypeConfig` (from `src/client/charts/chartConfigs.ts`). Define ONLY the lazy shape: `dropZones` (array of `AxisDropZoneConfig`), `displayOptions`/`displayOptionsConfig`, `clickableElements`, optional `validate`, and `skipQuery: true` for content-only charts (markdown, KPIs). **Do NOT** put `label`, `description`, `useCase`, or `isAvailable` here — those go on the registry entry. Use `BarChart.config.ts` as the canonical shape.

- [ ] **4. Add the `chartRegistry` entry** — In `src/client/charts/chartRegistry.ts`, add one entry to `chartRegistry` keyed by the new type. Set:
  - `label`, `description`, `useCase` — i18n keys (`chart.{name}.*`).
  - `icon` — an `IconName` (see step 7).
  - `isAvailable` — a fn taking `ChartAvailabilityContext` (`{ measureCount, dimensionCount, timeDimensionCount }`) returning `ChartAvailability` (`{ available, reason? }`), using `chart.availability.*` reason keys. Reuse `requiresMeasure` / `requiresMeasureAndDimension` from `chartConfigHelpers` where they fit, or inline an arrow fn. Omit for always-available charts (table, markdown).
  - `dependencies` — `{ packageName, installCommand }` for charts needing recharts/@nivo/etc. (`RECHARTS_DEP` is a shared constant in the file). Omit for dependency-free charts.
  - `config` — `async () => (await import('../components/charts/{Name}.config.js')).{name}ChartConfig`.

- [ ] **5. Add the eager base config** — In `src/client/charts/chartConfigRegistry.ts`, statically import the config and add it to the `baseConfigs` record. This is the server/full source: the server agent reads `dropZones` from here **synchronously** for mandatory-zone validation and tool guidance, so it cannot be lazy. The eager registry is composed automatically — no per-chart entry needed beyond the `baseConfigs` line.

- [ ] **6. Register the component in ChartLoader** — In `src/client/charts/ChartLoader.tsx`, add the chart to `chartImportMap` (dynamic import of the `.tsx` component). This is the only place the component import path lives.

- [ ] **7. Add icon** — If no existing chart icon fits, in `src/client/icons/types.ts` add `chart{Name}: IconDefinition` to the `IconRegistry` interface, and in `src/client/icons/defaultIcons.ts` import an Iconify icon (Tabler set or custom from `customIcons.ts`) and add `chart{Name}: { icon, category: 'chart' }` to `DEFAULT_ICONS`. Then reference that `IconName` on the entry. There is **no** `getChartTypeIcon` `typeMap` to edit — the icon is resolved from the entry.

- [ ] **8. Export (if needed)** — In `src/client/index.ts`, export any new public types. The component and config are consumed internally via the registry and don't need explicit re-export.

- [ ] **9. Verify** — `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:client` (the parametrized `chartRegistry.test.ts` will assert your chart is wired through all derivation sites; `tests/i18n/locales.test.ts` will fail if any config i18n key is missing from the locale files). Manually confirm it renders in the picker, accepts field drops, and shows data.

## File Reference

| File | Action | Key Symbols |
|------|--------|-------------|
| `src/client/types.ts` | Add literal to union; optionally extend axis config | `BuiltInChartType`, `ChartType`, `ChartAxisConfig`, `ChartProps` |
| `src/client/components/charts/{Name}.tsx` | Create | default export (memoized component) |
| `src/client/components/charts/{Name}.config.ts` | Create — lazy shape ONLY | `{name}ChartConfig` : `ChartTypeConfig` |
| `src/client/charts/chartRegistry.ts` | **Add one entry** (single source of truth) | `chartRegistry`, `ChartRegistryEntry` |
| `src/client/charts/chartConfigRegistry.ts` | Add static import + `baseConfigs` line | `baseConfigs` |
| `src/client/charts/ChartLoader.tsx` | Add to component import map | `chartImportMap` |
| `src/client/icons/types.ts` + `defaultIcons.ts` | Add icon (only if no existing fit) | `IconRegistry`, `DEFAULT_ICONS` |
| `src/client/index.ts` | Export new public types if any | — |

## Reference Implementations

- **Simple Recharts chart:** `BarChart.tsx` + `BarChart.config.ts` + the `bar` entry — standard drop zones (xAxis, yAxis, series), `requiresMeasureAndDimension`, `RECHARTS_DEP`.
- **Nivo chart:** `HeatMapChart.tsx` + `HeatMapChart.config.ts` + the `heatmap` entry — `@nivo/heatmap` dependency, inline `isAvailable`, custom drop zones.
- **Complex config:** `CandlestickChart.tsx` + `CandlestickChart.config.ts` + the `candlestick` entry — specialized axis fields, custom validation, inline `isAvailable`.

## Alternative: Plugin System

For charts that live outside the core library (third-party or app-specific), use the runtime plugin system instead of modifying the built-in registries:

- Declarative: pass `customCharts` prop to `CubeProvider` with an array of `ChartDefinition` objects (`type`, `label`, `config`, `component`, optional `icon`/`dependencies`).
- Imperative: call `chartPluginRegistry.register()` from `src/client/charts/chartPlugin.ts` (exported via `src/client/index.ts`).

`register()` maps each `ChartDefinition` onto the same `ChartRegistryEntry` shape built-ins use (`chartDefinitionToEntry`), stored in a custom-entries map that the unified `getChartEntry()` lookup reads **ahead of** built-ins — so a plugin can override a built-in type and still flow through one path. Plugin charts use the `ChartType = BuiltInChartType | (string & {})` extensibility, so any string works without touching `BuiltInChartType`.

## Verification

- `npm run typecheck` — zero type errors
- `npm run lint` — clean
- `npm run build` — successful
- `npm run test:client` — `chartRegistry.test.ts` + i18n key coverage pass
- Chart appears in the picker with the correct icon; drop zones accept the right field types and render data
