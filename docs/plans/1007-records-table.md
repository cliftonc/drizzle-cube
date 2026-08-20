# Records Table — spec

**Discussion:** [#1007](https://github.com/cliftonc/drizzle-cube/discussions/1007) — _Custom Records Table_ (andrew-hu368)
**Status:** 📝 Spec, awaiting confirmation. No code written.
**Revision:** v2 — supersedes the two-query `attributeColumns` design. See _Superseded approach_ at the end.

---

## What was asked for

A dashboard widget that lists **records** (not aggregates):

1. **Server-side paginated** — dashboards point at tens of thousands of rows.
2. **Formatted per column** — text, badge or progress bar, chosen per column in the chart editor.
3. **Extended by user-defined attributes** — extra columns from admin-defined attributes in a junction table;
   the header is the attribute's name, so a rename propagates.
4. **Hidden columns** — fetched for row context (e.g. ids), never displayed.
5. **Click-through** — a row links to a URL template with tokens from the row, including hidden ones;
   relative and `http(s)` only.

## The key finding

**Attribute columns should be ordinary dimensions, generated at cube-definition time.** This is Cube's own answer to
EAV — [dynamic data models](https://docs.cube.dev/docs/data-modeling/dynamic), where Jinja/Python loops or JS
`asyncModule()` generate the model, explicitly for _"generating models from a remote source"_. Cube has no
server-side pivot and no EXISTS filter primitive; `pivotConfig` is client-side `ResultSet` reshaping only.

Because the attribute set is **global to a configured drizzle-cube instance** (not per-`securityContext`), the
generated model needs no per-tenant compilation — so drizzle-cube does not need Cube's `COMPILE_CONTEXT` equivalent,
and `/meta` stays a shared cache.

Once attributes are dimensions, everything downstream works through paths that already exist:

```js
columns: ['Projects.name', 'Projects.attr_a1', 'Projects.attr_a2'],
filters: [
  { member: 'Projects.attr_a1', operator: 'equals', values: ['At risk'] },
  { member: 'Projects.attr_a2', operator: 'gt', values: [50] }      // composes correctly
],
order: { 'Projects.attr_a2': 'desc' }
```

Multi-predicate filtering, sorting, projection, drill-down, export and `columnFormats` all come for free. **No new
query-model concept is required** — no EXISTS filter node, no cube aliasing, no server-side cross-tab.

### Why the alternatives were rejected

| Alternative | Why not |
|---|---|
| Filter on the junction cube directly (`Attributes.name` + `…Values.value`) | Works for exactly one attribute. Two predicates become `a.name='Health' AND a.name='Completion'` — no row satisfies both, so it **silently returns zero rows**. |
| Multi-instance cube aliasing | Cube identity is name-keyed throughout: `analyzeCubeUsage` returns `Set<string>` (`logical-plan-builder.ts:87`), aliases derive from the name (`join-planner.ts:145`), and `Cube.field` is the member syntax, annotation key, drop-zone value and dashboard-filter mapping key. Renaming the addressing scheme to solve EAV is disproportionate. |
| Correlated EXISTS filter node | Solves filtering but not sorting or projection — you cannot `ORDER BY` a value inside an `EXISTS`. Generated dimensions solve all three with one concept. |
| Two record-grain queries (v1 of this spec) | No fan-out and correct pagination, but attribute values arrive *after* the page, so sorting and filtering by an attribute are impossible server-side. |

## The pattern

```ts
const attrs = await db.select().from(attributes)          // id, name, type?

defineCube('Projects', {
  sql: (ctx) => ({ from: projects, where: eq(projects.organisationId, ctx.securityContext.organisationId) }),
  dimensions: {
    ...baseDimensions,
    ...buildAttributeDimensions({
      attributes: attrs,
      valueTable: projectAttributeValues,
      recordKey: projects.id,
      foreignKey: projectAttributeValues.projectId,
      keyRef: projectAttributeValues.attributeId,
      valueColumn: projectAttributeValues.value,
      types: { a2: 'number' },                            // override; wins over attrs[].type
      security: (ctx) => eq(projectAttributeValues.organisationId, ctx.securityContext.organisationId),
    }),
  },
})
```

Each generated dimension:

```ts
attr_a1: {
  name: 'attr_a1',                 // stable — derived from the attribute id
  title: 'Health',                 // renamable — the client reads title for headers
  type: 'string',
  sql: (ctx) => sql`(SELECT v.value FROM project_attribute_values v
                     WHERE v.project_id = ${projects.id}
                       AND v.attribute_id = 'a1'
                       AND ${security(ctx)}
                     LIMIT 1)`,
}
```

Design invariants:

- **Identity vs label.** `name` comes from the attribute **id**, `title` from its name. The client resolves headers
  via `labelMap[dimension.name] = dimension.title || …` (`useCubeMetaQuery.ts:36`), so a rename updates every header
  while saved dashboards, drill state and share URLs keep resolving. Slugifying the *name* into the member id would
  silently break every saved widget on rename — the exact scenario the discussion calls out as a requirement.
- **Security inside the subquery.** `QueryContext` carries `securityContext` into every dimension `sql`
  (`cube.ts:59-79`), so the junction lookup is tenant-scoped. Omitting it leaks other tenants' values; the helper
  makes it a required parameter rather than an easy oversight.
- **`LIMIT 1`.** EAV tables rarely carry a unique constraint on `(record, attribute)`; without it a duplicate row
  raises _"more than one row returned by a subquery"_ on Postgres.
- **Type resolution order:** explicit override → `attributes.type` → opt-in sampling → `string`.
- **Regeneration is the app's job.** `registerCube()` re-registers and invalidates the metadata cache
  (`compiler.ts:161-174`); the client refetches `/meta` within its 5-minute `staleTime` (`useCubeMetaQuery.ts:89`).
  Multi-process deployments must signal each process — documented, not solved.

### Why typing is mandatory, not cosmetic

Filtering and sorting run in SQL over the whole table **before** the page reaches the browser, so client-side
conversion cannot repair them:

```
sort by Completion desc, as text:   '99', '98', '9', '85', '68', '100'   ← page 1 is wrong
as number:                          100, 99, 98, 85, 68, 9
```

`gt` passes values straight to Drizzle with no cast (`filter-operators.ts:83`), so `Completion > 50` over `text`
either errors (Postgres: `text > integer`) or compares lexicographically, where `'9'` passes and `'100'` fails.

## Core changes required

| # | Change | Why | Where |
|---|---|---|---|
| 1 | Expose a `cast` helper (or the adapter) on `QueryContext` | `castToType` exists per engine (`base-adapter.ts:283`) but is unreachable from a cube author's `sql` fn, so generated SQL can't be portable | `server/types/cube.ts`, `executor.ts` |
| 2 | `tryCastToType` on the adapter interface | `::decimal` is strict (`postgres-adapter.ts:143`) — one `n/a` fails the whole query; MySQL/SQLite silently return `0`. `TRY_CAST` on DuckDB/Snowflake/Databend, regex-guarded `CASE` on Postgres | `server/adapters/*` (7 impls) |
| 3 | Honour `shown` | Declared on `Dimension` (`cube.ts:184`) and read **nowhere**; large attribute sets otherwise inflate `/meta`, the field picker and every AI prompt | `compiler-metadata.ts`, AI discovery |
| 4 | Client prunes dead column members | A deleted attribute yields `dimensionNotFound` (`query-validator.ts:211`) and fails the **whole** query, breaking every dashboard that used it. Columns are dropped with a muted note; **dead filters still error**, since dropping one would silently widen the result set | `analyticsPortlet/`, `RecordsTable.tsx` |
| 5 | `buildAttributeDimensions()` helper + docs | Encodes the subquery, security scoping, id/title split, `LIMIT 1` and type resolution so adopters don't re-derive them | `server/` + docs |
| 6 | EAV case in `perf/` + escalation ladder | Filter/sort are O(rows); guidance must be measured, not asserted | `perf/` |

**Performance ladder to document:** correlated scalar subquery (no DDL, fine at the discussion's scale) → app-side
pivoted view `MAX(CASE WHEN …)` (attributes become indexable columns; fast filter/sort at any size) → materialized
view with refresh. Projection is cheap (25 rows × N attributes = indexed lookups); `ORDER BY (SELECT …)` and
`WHERE (SELECT …) = …` are O(rows in the base table) because no index can serve them.

---

## The Records Table itself

With attributes reduced to ordinary dimensions, the widget is just a rich table.

### Chart type

Per `.claude/skills/add-chart-type/SKILL.md`: `BuiltInChartType` gains `'recordsTable'`; `ChartAxisConfig` gains
`columns?: string[]` and `hiddenColumns?: string[]`; component + `.config.ts`; one `chartRegistry` entry, one
`baseConfigs` line, one `chartImportMap` line, one icon. Drop zones: **Columns** (ordered) and **Hidden fields**.
`clickableElements: { row: true }`. i18n keys under `chart.recordsTable.*` in `en.json` / `nl-NL.json`.

Hand-rolled, not `@tanstack/react-table`: no new dependency (recharts/@nivo are optional peers), and
`components/DataBrowser/DataBrowserTable.tsx` already has click-to-sort headers, drag column resize and `<colgroup>`
widths to reuse.

### Per-column formats

Numeric and date formatting delegate to existing code: `AxisFormatConfig` (`types.ts:127`) already models
`currency | percent | number | custom` plus `abbreviate`, `decimals` and custom affixes, implemented by
`formatAxisValue` (`chartUtils.ts:43`) with `AxisFormatControls.tsx` as its editor; `formatTimeValue` handles dates.

```ts
export type ColumnFormatKind = 'text' | 'number' | 'date' | 'badge' | 'progress'

export interface ColumnFormatConfig {
  kind: ColumnFormatKind
  numberFormat?: AxisFormatConfig
  dateGranularity?: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
  badgeColors?: Array<{ value: string; color: string }>   // unmapped → neutral, never guessed
  progressMin?: number
  progressMax?: number
  label?: string
  align?: 'left' | 'right'
}
```

`ChartDisplayConfig` gains `columnFormats?: Record<string, ColumnFormatConfig>` — the first `Record`-shaped display
option; the existing flat setter handles it because it writes whole values. Currency is `number` + `unit: 'currency'`,
not a separate kind.

> **Known gap.** `formatCurrency` (`axisValueFormatting.ts:107`) derives the currency code from the viewer's locale
> and is not configurable, so a GBP column renders `$` to a US viewer. Fixing it means adding `currencyCode` to
> `AxisFormatConfig`, shared by every chart — raised as a question, not assumed.

**Editor:** a new `DisplayOptionConfig['type'] = 'columnFormats'` plus a `ColumnFormatsOption` in `OPTION_RENDERERS`,
backed by `AnalysisBuilder/ColumnFormatsEditor.tsx` — one collapsible row per assigned column. `number` embeds
`AxisFormatControls`; `badge` rows reuse the palette-swatch markup from `PaletteColorOption`. Needs an optional
`chartConfig?: ChartAxisConfig` threaded through `AnalysisDisplayConfigPanel` → `DisplayOptionControl` and passed at
its five mount points.

### Pagination

**Server.** `SemanticQuery.total?: boolean` and `QueryResult.total?: number`, matching Cube, where `total` means
"the number of rows as if no limit or offset are set". Implemented as a `buildCountQuery` variant of the same
physical plan with pagination stripped, wrapped `SELECT COUNT(*) FROM (<inner>) t` — the wrapper is required so
grouped queries count **groups**. `normalizeQuery` must include `total` in the cache key; it also currently **omits
`ungrouped`**, so a grouped result can be served for an ungrouped query — a pre-existing bug fixed here as its own
commit. `formatCubeResponse` emits `total` on `results[0]`.

**Client.** `CubeQuery.total?: boolean`, `ResultSet.total()`, and
`components/analyticsPortlet/usePortletPagination.ts` mirroring `usePortletDrillState.ts` — holds `{ page, pageSize }`,
merges `limit`/`offset`/`total` into `activeQuery`, enabled only for `recordsTable`. Surfaced to the chart as
`ChartProps.pagination`. With no `pagination` prop (AnalysisBuilder preview, notebook, plugin hosts) the table pages
client-side over the rows it has.

### Click-through

`displayConfig.rowLink?: { urlTemplate: string; target?: 'self' | 'blank' }`; `{Cube.field}` tokens filled from the
row including hidden columns and `encodeURIComponent`'d. `client/utils/rowLinkUtils.ts` → `buildRowUrl()` allows only
same-origin relative paths (rejecting `//` and `\`) or absolute `http:`/`https:`, rejecting `javascript:`, `data:`,
`vbscript:` and protocol-relative URLs via `new URL(url, origin).protocol`. Rendered as a real `<a>`
(`rel="noopener noreferrer"` when `target: 'blank'`) so modifier-clicks work. Hostile inputs are unit-tested.
Precedence: `rowLink` wins; otherwise the existing drill path.

## Staging

| Stage | Content |
|---|---|
| 1 | `recordsTable` + hand-rolled table: columns, hidden columns, sort headers, all five `columnFormats` kinds, `ColumnFormatsEditor`. Client-side paging. |
| 2 | Server `total` + `usePortletPagination` + `ChartProps.pagination`; `normalizeQuery` cache-key fix. |
| 3 | `rowLink` + `rowLinkUtils` with security tests. |
| 4 | Attribute dimensions: `cast` on `QueryContext`, `tryCastToType`, `buildAttributeDimensions`, `shown`, client pruning of dead members, perf case + docs. Independently useful — not Records-Table-specific. |

## Files

| Area | Files |
|---|---|
| Chart wiring | `src/client/types.ts`, `charts/{chartRegistry,chartConfigRegistry,ChartLoader,chartConfigs}`, `icons/{types,defaultIcons}` |
| Component | `components/charts/RecordsTable.{tsx,config.ts}`; patterns from `components/DataBrowser/DataBrowserTable.tsx` |
| Config UI | `AnalysisBuilder/{AnalysisDisplayConfigPanel,DisplayOptionControl,ColumnFormatsEditor}.tsx` + 5 mount points |
| Paging | `components/analyticsPortlet/{usePortletPagination.ts,PortletChart.tsx}`, `client/CubeClient.ts` |
| Attributes | `server/types/cube.ts` (`QueryContext.cast`), `server/adapters/*` (`tryCastToType`), `server/attribute-dimensions.ts`, `compiler-metadata.ts` (`shown`) |
| Server paging | `server/types/{query,core}.ts`, `physical-plan/drizzle-plan-builder.ts`, `server/cache-utils.ts`, `adapters/utils.ts` |
| Links | `client/utils/rowLinkUtils.ts` |
| i18n | `src/i18n/locales/{en.json,nl-NL.json,en-US.json}` |

## Verification

- DB-free, one at a time: `npm run test:sqlite`, `npm run test:client`, `npm run lint`, `npm run typecheck`. The
  parametrized `chartRegistry.test.ts` asserts the new chart type is wired through every derivation site;
  `tests/i18n/locales.test.ts` catches missing keys.
- New tests: `total` on grouped and ungrouped paths; the `normalizeQuery` cache-key regression;
  `buildAttributeDimensions` (security scoping present, id/title split, type resolution order, `LIMIT 1`);
  `tryCastToType` per engine including unparseable input; `shown` omission from metadata; `RecordsTable`;
  `rowLinkUtils` hostile URLs; `ColumnFormatsEditor`.
- `total` and `tryCastToType` emit new SQL, so engines matter: `npm run test:setup` then `test:postgres` /
  `test:mysql` locally; DuckDB / Databend / Snowflake left to CI and stated as such.
- Perf: add an EAV case to `perf/` measuring projection, filter and sort at 10k and 100k rows to ground the ladder.
- Manual: `npm run dev:setup && npm run dev`; needs an EAV example in `dev/server/schema.ts` (`attributes` +
  `employee_attribute_values`, seeded), which does not exist today.
- `/quality-gate` before the PR.

## Superseded approach

v1 of this spec fetched attribute values in a **second record-grain query** per page (`attributeColumns` config in
Cube's `pivotConfig` vocabulary, spread client-side). It avoided the join fan-out and kept pagination correct, but
because values arrived after the page it could not sort or filter by an attribute server-side. Generated dimensions
supersede it: same correctness, no bespoke query path, and filtering and sorting work. It remains the fallback for
deployments that cannot regenerate cube definitions at boot.

## Open questions for the requester

1. Does your `attributes` table carry a data type, or should the helper take an override map / sample values?
2. Badge colours: theme swatches or free hex? And is locale-derived currency enough, or do you need a fixed
   per-column currency code?
3. Page sizes: 25 / 50 / 100 fixed, or author-configurable?
4. Click-through: row-level only, or per-cell links too?
5. Column resize with persisted widths in v1, or later?
