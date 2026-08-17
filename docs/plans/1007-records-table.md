# Records Table — spec

**Discussion:** [#1007](https://github.com/cliftonc/drizzle-cube/discussions/1007) — _Custom Records Table_ (andrew-hu368)
**Status:** 📝 Spec, awaiting confirmation from the requester. No code written.
**Scope:** a new `recordsTable` chart type + the small amount of surface area it needs (per-column config,
Cube-compatible `total`, portlet-owned pagination). The existing `table` chart is untouched.

---

## What was asked for

A dashboard widget that lists **records** (not aggregates):

1. **Server-side paginated** — dashboards point at tens of thousands of rows.
2. **Formatted per column** — text, colored badge, or progress bar, chosen per column in the chart editor
   (not stored on or inferred from the data).
3. **Extended by user-defined attributes** — extra columns come from admin-defined attributes held in a junction
   table, joined per record; the header is the attribute's name, so a rename propagates.
4. **Hidden columns** — fetched for row context (e.g. ids), never displayed.
5. **Click-through** — a row can link to a URL template with tokens filled from the row's values, including hidden
   ones; relative and `http(s)` only.

## Why a plugin couldn't do it

Both blockers the requester hit are real and confirmed in the code:

1. **No per-column configuration.** `ChartDisplayConfig` (`src/client/types.ts:165`) is a flat bag of scalars, and
   every renderer in `DisplayOptionControl.tsx` writes `{ ...displayConfig, [key]: value }`. There is no renderer
   for a keyed structure, and `ChartTypeConfig` (`src/client/charts/chartConfigs.ts:120`) gives a chart type no way
   to contribute its own config panel. The closest existing thing is `yAxisAssignment` — and that lives in
   `chartConfig`, edited by an L/R toggle inside the drop zone, not in the display panel.
2. **No workable attribute join.** One query across `projects → project_attribute_values → attributes` fans out:
   every project row is duplicated once per attribute. Both the payload *and* `LIMIT` then sit on the wrong grain —
   `LIMIT 25` with three attributes returns roughly eight projects.

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Table implementation | **Hand-rolled** | No new dependency (recharts/@nivo are optional peers, and a table shouldn't add one). `components/DataBrowser/DataBrowserTable.tsx` already has click-to-sort headers, drag column resize and `<colgroup>` widths to copy. Badge / progress / link cells are bespoke rendering regardless. |
| Row count | **Cube-compatible `total: true`** | `total` is a real top-level key in Cube's query format — "run a total query and return the total number of rows as if no row limit or offset are set". Cube also runs it as a separate query, so the cost model matches. |
| Attribute columns | **Cube `pivotConfig` vocabulary, two record-grain queries** | Cube has **no** server-side pivot in its query format; `pivotConfig` (`x` / `y` / `fillMissingDates` / `aliasSeries`) is a client-side `ResultSet.tablePivot()` transform — i.e. precisely the fan-out model that failed here. Borrowing the vocabulary keeps saved widget config Cube-shaped and lets a future SQL cross-tab back the same config with no migration. |
| Chart type | **New `recordsTable`** | `table` keeps its time-dimension pivot (`utils/pivotUtils.ts`) and its simple contract. |

---

## Design

### 1. The chart type

Follows `.claude/skills/add-chart-type/SKILL.md`:

- `BuiltInChartType` gains `'recordsTable'`; `ChartAxisConfig` gains `columns?: string[]` and
  `hiddenColumns?: string[]` (`src/client/types.ts`).
- `src/client/components/charts/RecordsTable.tsx` + `RecordsTable.config.ts`.
- One `chartRegistry` entry, one `baseConfigs` line in `chartConfigRegistry.ts`, one `chartImportMap` line in
  `ChartLoader.tsx`, one icon (`icons/types.ts` + `defaultIcons.ts`).
- Drop zones: **Columns** (dimension / timeDimension / measure, ordered — order is column order) and
  **Hidden fields** (fetched, never rendered, available to link tokens). `clickableElements: { row: true }`.
- i18n: `chart.recordsTable.*`, `chart.option.columnFormats.*`, `chart.option.rowLink.*` in
  `src/i18n/locales/en.json` + `nl-NL.json` (+ `en-US.json` where spelling differs). Configs store keys; components
  resolve at render. `tests/i18n/locales.test.ts` enforces coverage.

### 2. Per-column formats

Numeric and date formatting delegate to what already exists rather than duplicating it: `AxisFormatConfig`
(`src/client/types.ts:127`) models `unit: 'currency' | 'percent' | 'number' | 'custom'` plus `abbreviate` (K/M/B),
`decimals` and `customPrefix`/`customSuffix`; `formatAxisValue` (`utils/chartUtils.ts:43`) implements it and
`charts/AxisFormatControls.tsx` is a ready-made editor for it. `formatTimeValue(value, granularity)`
(`utils/chartUtils.ts:114`) handles dates.

```ts
export type ColumnFormatKind = 'text' | 'number' | 'date' | 'badge' | 'progress'

export interface ColumnFormatConfig {
  kind: ColumnFormatKind
  /** number: currency / percent / plain / custom prefix+suffix, abbreviate, decimals. */
  numberFormat?: AxisFormatConfig
  /** date: rendered via formatTimeValue(value, granularity). */
  dateGranularity?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
  /** badge: explicit value → color. Unmapped values render neutral — never a guessed colour. */
  badgeColors?: Array<{ value: string; color: string }>
  /** progress: defaults to 0–100, clamped both ends; non-numeric falls back to text. */
  progressMin?: number
  progressMax?: number
  label?: string                 // header override (author text, not an i18n key)
  align?: 'left' | 'right'
}
```

`ChartDisplayConfig` gains `columnFormats?: Record<string, ColumnFormatConfig>` — the first `Record`-shaped entry in
`displayConfig`. The existing flat setter handles it unchanged, because it writes whole values.

**Currency is `number` + `unit: 'currency'`**, not its own kind — one code path, and it is what `table` already does
globally via `leftYAxisFormat`, made per-column. A first-class "Currency" entry in the picker, if wanted, is a
preset writing the same config.

> **Known gap.** `formatCurrency` (`utils/axisValueFormatting.ts:107`) derives the currency code from the viewer's
> locale via `getCurrencyCodeForLocale`; it is not configurable. A table showing GBP renders `$` to a US viewer.
> Fixing it means adding `currencyCode` to `AxisFormatConfig`, which every chart's axis formatting shares — so it is
> raised as a question rather than assumed.

**Editor.** A new `DisplayOptionConfig['type'] = 'columnFormats'` plus a `ColumnFormatsOption` entry in
`OPTION_RENDERERS`, backed by `AnalysisBuilder/ColumnFormatsEditor.tsx`: one collapsible row per assigned column —
kind as a button group, then kind-specific controls. `number` embeds `AxisFormatControls` verbatim; `badge` rows are
value + swatch, reusing the palette-swatch markup from `PaletteColorOption` and the `colorPalette` prop the control
already receives, so themes still apply.

The renderer needs the assigned column list, so an optional `chartConfig?: ChartAxisConfig` is threaded through
`AnalysisDisplayConfigPanel` → `DisplayOptionControl` and passed at the five mount points
(`AnalysisQueryPanelParts.tsx`, `Funnel/Flow/RetentionModeContent.tsx`, `TextPortletModal.tsx`). Only the new
renderer reads it; no existing option changes.

### 3. Pagination

**Server**

- `SemanticQuery.total?: boolean` (`server/types/query.ts`); `QueryResult.total?: number` (`server/types/core.ts`).
- When `total` is set on a regular-mode query, re-run the *same* physical plan with limit/offset/order stripped,
  wrapped as `SELECT COUNT(*) FROM (<inner>) t`. The subquery wrapper is required so grouped queries count
  **groups**, not fact rows. Seam: a `buildCountQuery` variant in `physical-plan/drizzle-plan-builder.ts` that skips
  the single existing `DrizzleSqlBuilder.applyLimitAndOffset` (`drizzle-sql-builder.ts:606`). One path, all 7 engines.
- `cache-utils.ts` `normalizeQuery` must include `total` in the key. It also currently **omits `ungrouped`**, so a
  grouped result can be served for an ungrouped query — a pre-existing bug that a records table hits immediately.
  Fixed in the same PR as its own commit, with a regression test.
- `adapters/utils.ts` `formatCubeResponse` emits `total` on `results[0]`, where Cube puts it.

**Client**

- `CubeQuery.total?: boolean`; `ResultSet.total()` in `client/CubeClient.ts`.
- `components/analyticsPortlet/usePortletPagination.ts` — a new hook mirroring `usePortletDrillState.ts` (same
  reset-when-the-base-query-changes pattern). Holds `{ page, pageSize }`, merges
  `limit: pageSize, offset: page * pageSize, total: true` into `activeQuery`, returns the pagination object.
  Enabled only for `recordsTable`, so no other portlet's query shape changes.
- `ChartProps.pagination?: { page, pageSize, pageSizeOptions, total?, onPageChange, onPageSizeChange }`, supplied by
  `analyticsPortlet/PortletChart.tsx`.
- **Degradation:** with no `pagination` prop (AnalysisBuilder preview, notebook, plugin hosts) the table pages
  client-side over the rows it has, so the component stays renderable and unit-testable standalone.

### 4. Click-through

`displayConfig.rowLink?: { urlTemplate: string; target?: 'self' | 'blank' }`. Tokens `{Cube.field}` are filled from
the row — hidden columns included — and `encodeURIComponent`'d. New `client/utils/rowLinkUtils.ts`:

- `buildRowUrl(template, row): string | null` — resolve tokens, then validate: allow **only** same-origin relative
  paths (`/…`, rejecting `//` and `\`) or absolute `http:` / `https:`. Reject `javascript:`, `data:`, `vbscript:`
  and protocol-relative URLs, checking `protocol` via `new URL(url, origin)`.
- Rendered as a real `<a>` (`rel="noopener noreferrer"` for `target: 'blank'`) so modifier-clicks behave normally.
- Unit tests include the hostile inputs.
- Precedence: `rowLink` set → link cell; otherwise the existing drill path via `onDataPointClick`.

### 5. Attribute columns

Config uses Cube's vocabulary:

```ts
displayConfig.attributeColumns?: {
  x: string[]      // record identity field(s), already in the query
  y: string        // the attribute-name dimension
  value: string    // the attribute-value dimension
}
```

Fetch is one dependent query per page — `hooks/queries/useAttributeColumnsQuery.ts`, a `useCubeLoadQuery` skipped
until page rows exist:

```js
{ dimensions: [xKey, y, value], ungrouped: true,
  filters: [{ member: xKey, operator: 'equals', values: pageKeys }] }   // ≤ pageSize keys
```

For a 25-row page with three attributes that is 75 narrow rows. Results are grouped by `xKey` and spread onto
`attr:<name>` keys; the column set is the distinct `y` values and headers are the raw attribute names, so an admin
rename propagates with no widget change. `columnFormats` keys attribute columns identically, so badge and progress
apply to them too.

Worked example, matching the discussion:

| Query | Grain | Rows |
|---|---|---|
| `{ dimensions: ['Projects.id','Projects.name','Projects.status'], ungrouped: true, order: {'Projects.name':'asc'}, limit: 25, offset: 0, total: true }` | one row per project | 25 |
| `{ dimensions: ['ProjectAttributeValues.projectId','Attributes.name','ProjectAttributeValues.value'], ungrouped: true, filters: [{ member: 'ProjectAttributeValues.projectId', operator: 'equals', values: [25 ids] }] }` | one row per (project, attribute) | ≤ 75 |

**Limitation.** Because attribute values arrive *after* the record page, you cannot sort or filter by an attribute
column server-side — only within the loaded page. If that is required, the server-side cross-tab below stops being
a follow-up and becomes a prerequisite.

### 6. Follow-ups, deliberately out of scope

- **Server-side cross-tab** (`pivot` on `SemanticQuery` → `MAX(CASE WHEN attr = 'x' THEN value END)`): the eventual
  one-query backing for the *same* `attributeColumns` config, and the only way to sort/filter by an attribute
  server-side. Costs a security-scoped discovery query for the attribute list, annotations for columns that exist in
  no cube (the metadata layer, MCP/AI tooling and the client field picker all assume a static dimension set), and
  verification on all 7 engines — plus it diverges from Cube's query format. Own issue.
- **`ResultSet.tablePivot` / `chartPivot`** for Cube parity (`pivotQuery` is already echoed in `/load`). Own issue.
- Column resize with persisted widths — copy `DataBrowserTable.tsx` + `dataBrowserStore.columnWidths`.
- A dev-schema EAV example (`attributes` + `employee_attribute_values`, seeded) to demo attribute columns;
  `dev/server/schema.ts` has no attribute tables today.

---

## Staging

| Stage | Content |
|---|---|
| 1 | `recordsTable` chart type + hand-rolled table: columns, hidden columns, sort headers, `columnFormats` (all five kinds) and the `ColumnFormatsEditor`. Client-side paging only. |
| 2 | Server `total` + `usePortletPagination` + `ChartProps.pagination`; the `normalizeQuery` `ungrouped`/`total` cache-key fix. |
| 3 | `rowLink` + `rowLinkUtils` with its security tests. |
| 4 | `attributeColumns` + `useAttributeColumnsQuery`, and the dev-schema EAV example to demo it. |

## Files

| Area | Files |
|---|---|
| Chart wiring | `src/client/types.ts`, `charts/chartRegistry.ts`, `charts/chartConfigRegistry.ts`, `charts/ChartLoader.tsx`, `charts/chartConfigs.ts`, `icons/{types.ts,defaultIcons.ts}` |
| Component | `components/charts/RecordsTable.{tsx,config.ts}` + cell renderers; patterns from `components/DataBrowser/DataBrowserTable.tsx` |
| Config UI | `AnalysisBuilder/{AnalysisDisplayConfigPanel,DisplayOptionControl,ColumnFormatsEditor}.tsx` + the 5 mount points |
| Paging | `components/analyticsPortlet/{usePortletPagination.ts,PortletChart.tsx}`, `client/CubeClient.ts`, `hooks/queries/useAttributeColumnsQuery.ts` |
| Server | `server/types/{query.ts,core.ts}`, `physical-plan/drizzle-plan-builder.ts`, `server/cache-utils.ts`, `adapters/utils.ts` |
| Links | `client/utils/rowLinkUtils.ts` |
| i18n | `src/i18n/locales/{en.json,nl-NL.json,en-US.json}` |

## Verification

- DB-free signal, run one at a time: `npm run test:sqlite`, `npm run test:client`, `npm run lint`,
  `npm run typecheck`. The parametrized `tests/client/charts/chartRegistry.test.ts` asserts the new type is wired
  through every derivation site; `tests/i18n/locales.test.ts` catches missing keys.
- New tests: `total` on grouped and ungrouped paths; the `normalizeQuery` cache-key regression; `RecordsTable`
  (formats, hidden columns, paging with and without the `pagination` prop); `rowLinkUtils` including hostile URLs;
  `ColumnFormatsEditor`.
- `total` emits new SQL, so engines matter: `npm run test:setup` then `test:postgres` / `test:mysql` locally;
  DuckDB / Databend / Snowflake left to CI and stated as such rather than assumed.
- Manual: `npm run dev:setup && npm run dev`, add a records-table portlet to the dev dashboard.
- `/quality-gate` before the PR — multi-file change.

## Open questions for the requester

1. Is a second round trip per page acceptable for attribute values — and do you need to **sort or filter by an
   attribute column**? (The two-query model can only do that within the loaded page.)
2. Badge colours: theme swatches, or free hex entry? And for `number` columns, is locale-derived currency enough, or
   do you need a fixed per-column currency code?
3. Page sizes: 25 / 50 / 100 fixed, or author-configurable?
4. Click-through: row-level only, or per-cell links too?
5. Column resize and persisted widths in v1, or later?
