---
name: add-chart-type
description: Use when adding a new built-in chart type to drizzle-cube. Covers type definition, component, config, the unified chartRegistry entry, lazy loading, icons, exports, and the deliberately-separate chart-type lists in the MCP app, agent tools and CLI.
---

# Adding a Built-In Chart Type

Drizzle-cube has a **unified chart registry**: each chart's DOM-free metadata lives in one `chartRegistry` entry (`src/client/charts/chartRegistry.ts`), and the eager config registry, lazy config registry, icon lookup, and dependency lookup all **derive** from it. Adding a chart is now: a type literal, a component, a `.config.ts` (drop zones / display options only), **one `chartRegistry` entry**, one `baseConfigs` static import (so the server agent can read drop zones synchronously), one `ChartLoader` component import, and an icon.

The registry is the single source of truth for the **main client app**. Three consumers outside it keep their own list on purpose — the MCP App (a single inlined bundle that can't lazy-load), the dashboard agent (a curated subset), and the CLI (a standalone bundle with no runtime access to the registry). Each is typed against `BuiltInChartType` so the duplication is compiler-checked rather than hoped-for; step 9 is where you decide about them.

For custom/third-party charts that don't modify the core library, use the plugin system instead (see Alternative: Plugin System below) — plugins flow through the *same* entry shape via `chartPluginRegistry.register()`.

## Documentation Context

Before designing or updating a built-in chart type, review https://www.drizzle-cube.dev/llms.txt for the current documentation map and public chart/plugin guidance. Use repository source and the checklist below as the implementation source of truth when docs and code differ.

## The split: entry vs config file

- **`chartRegistry` entry** owns the eager, DOM-free metadata — `label`, `icon`, `description`, `useCase`, `isAvailable`, `dependencies` — plus the lazy `config` thunk. This is the single source of truth.
- **`{Name}.config.ts`** owns the lazy-loaded shape — `dropZones`, `displayOptions`, `displayOptionsConfig`, `clickableElements`, `skipQuery`, `validate`. It must **not** carry `label`/`description`/`useCase`/`isAvailable` (those live on the entry; `composeChartConfig` lays the entry's metadata over this shape).
- The React **component** thunk is NOT on the entry (it pulls recharts / DOM globals). It stays in `ChartLoader`'s client-only `chartImportMap`.

## Checklist

- [ ] **1. Add type literal** — In `src/client/types.ts`, add the new string literal to the `BuiltInChartType` union. The broader `ChartType = BuiltInChartType | (string & {})` union auto-includes it. If the chart needs custom axis fields, add them to `ChartAxisConfig` in the same file.

- [ ] **2. Create chart component** — Create `src/client/components/charts/{Name}.tsx`. Accept `ChartProps` (from `src/client/types.ts`). Use `memo()` for the default export. Key props: `data`, `chartConfig` (axis mappings), `displayConfig`, `queryObject`, `height`, `colorPalette`, `pagination`. There is **no** `fieldLabels` prop — human-readable field labels come from the `useCubeFieldLabel()` hook (`src/client/hooks/useCubeFieldLabel.js`), called inside the component; see `BarChart.tsx`. Recharts-based charts wrap content in `ResponsiveContainer`; Nivo-based charts use their own responsive wrapper.

- [ ] **3. Create chart config** — Create `src/client/components/charts/{Name}.config.ts` (note: `.config.ts`). Export a named `{name}ChartConfig` (or `{name}Config`) of type `ChartTypeConfig` (from `src/client/charts/chartConfigs.ts`). Define ONLY the lazy shape: `dropZones` (array of `AxisDropZoneConfig`), `displayOptions`/`displayOptionsConfig`, `clickableElements`, optional `validate`, and `skipQuery: true` for content-only charts (markdown, KPIs). Two flags drive server behaviour from here rather than from a chart-type switch: `recordGrain: true` if the chart lists records (the agent then requires `ungrouped: true` on the query), and `excludeFromInference: true` on any drop zone that must not be auto-filled from the query — zones whose meaning is subtractive or opt-in, like the records table's hidden columns. **Do NOT** put `label`, `description`, `useCase`, or `isAvailable` here — those go on the registry entry. Use `BarChart.config.ts` as the canonical shape.

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

- [ ] **9. Decide about the three non-registry lists** — These are the only places that still name chart types by hand. Each is duplicated for a stated reason, documented in the file's header comment, and each is typed so drift is a compile error rather than a silent gap. "Add everywhere" is the wrong instinct — decide per list:

  - **MCP App** (`src/mcp-app/chartTypes.ts` → `MCP_APP_CHART_TYPES`) — the app is bundled by `vite-plugin-singlefile` into one inlined HTML document, so it cannot use `ChartLoader`'s dynamic imports: every renderable chart must be statically imported. To make a chart available there, add the type to this array **and** its component to `chartComponentMap` in `mcp-app.tsx` **and** a rule to `CHART_RULES` in `chartAvailability.ts` — both are exhaustive `Record<McpAppChartType, …>`, so doing one without the others fails `npm run typecheck`. The switcher (`McpChartSwitcher`), the `chart` tool's schema `enum` and its description list (`src/adapters/mcp-transport.ts`) all derive from the array; leave those alone. But if the chart reads config fields the `chart` tool's schema doesn't yet describe — as the records table's `columns` / `columnFormats` did — add them to that tool's `chartConfig` / `displayConfig` properties too, or the model can render the chart but never configure it. If the chart needs bespoke field mapping, add a branch to `deriveChartConfig` in `chartAutoSelect.ts`. Skipping the MCP App entirely is fine — just don't list the type here.
  - **Dashboard agent** (`src/server/agent/tools.ts` → `AGENT_ALLOWED_CHART_TYPES`) — a curated subset of what the agent may create, typed `BuiltInChartType[]`. Add only if the model can configure the chart from a query alone. If it can't, the fix is usually to describe the missing shape rather than to omit the chart: per-chart `chartConfig` / `displayConfig` properties live in `src/server/ai/chart-schema.ts`, shared by `add_portlet`, `save_as_dashboard` and the MCP `chart` tool. Requirements text (drop zones, description, `recordGrain`) is generated from the chart's config by `buildChartRequirementsDescription`, so it needs no per-chart edit. The prose type lists in `src/server/prompts/single-step-prompt.ts` and `step2-complete-prompt.ts` are guidance in the same spirit.
  - **CLI** (`src/cli/commands/charts.ts` → `BUILT_IN_CHARTS`) — an exhaustive `Record<BuiltInChartType, ScaffoldableChart | null>` behind both `charts list` and `charts init --from`, kept local because the CLI ships as a standalone bundle with only a *type* import of the union. **This one fails `npm run typecheck` until you decide**: give the type `{ file, description }` (`file` = the component basename, e.g. `RecordsTable`) or `null` with a one-line reason.

- [ ] **10. Verify** — `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:client` (the parametrized `chartRegistry.test.ts` asserts your chart is wired through the sites that *derive* from the registry; `tests/i18n/locales.test.ts` will fail if any config i18n key is missing from the locale files). If you touched `src/mcp-app/`, run `npm run build:mcp-app` — it regenerates the checked-in `src/mcp-app/generated-html.ts`, which must be committed. Manually confirm the chart renders in the picker, accepts field drops, and shows data.

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
| `src/mcp-app/chartTypes.ts` | Only if the MCP App should render it | `MCP_APP_CHART_TYPES` |
| `src/mcp-app/mcp-app.tsx` | Static import + map entry (forced by the above) | `chartComponentMap` |
| `src/mcp-app/chartAvailability.ts` | Availability rule (forced by the above) | `CHART_RULES` |
| `src/mcp-app/chartAutoSelect.ts` | Only if it needs bespoke field mapping | `deriveChartConfig` |
| `src/server/agent/tools.ts` | Only if the agent may create it | `AGENT_ALLOWED_CHART_TYPES` |
| `src/cli/commands/charts.ts` | **Required** — entry or explicit `null` | `BUILT_IN_CHARTS` |

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
- The CLI record forces a decision at typecheck time; the MCP App and agent lists are opt-in, so confirm by hand that you meant to include or omit the chart there
- `npm run build:mcp-app` if `src/mcp-app/` changed — commit the regenerated `generated-html.ts`
