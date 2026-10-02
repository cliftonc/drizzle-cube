# Records Table — spec

**Discussion:** [#1007](https://github.com/cliftonc/drizzle-cube/discussions/1007) — _Custom Records Table_ (andrew-hu368)
**Status:** ✅ Complete. The foundation shipped in 0.8.0; the widget and the remaining spec items followed in
[#1197](https://github.com/cliftonc/drizzle-cube/issues/1197).
**Revision:** v4 — records what was actually built, including where reality differed from the plan. v3 superseded
v2's "attributes are global to the deployment" premise; attribute dimensions are generated **per tenant** via cube
sets. See _Revision history_ at the end.

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

~~Because the attribute set is global to a configured drizzle-cube instance (not per-`securityContext`), the
generated model needs no per-tenant compilation.~~ **Retracted in v3.** That premise was never confirmed by the
requester, and per-organisation attributes are the normal case — the whole point of letting an admin define them.
drizzle-cube now has a `COMPILE_CONTEXT` equivalent: **cube sets**, registered per tenant at application boot
(`contextToCubeSetId` + `registerCubeSet`), documented in
[`docs/per-tenant-cube-sets.md`](../per-tenant-cube-sets.md). `/meta` is consequently tenant-scoped and cached
per set, not shared.

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

**Status:** all six are done. Items 1, 2, 3 and 5 shipped in 0.8.0 with the per-tenant cube sets they turned out to
need; items 4 and 6 followed with the widget.

| # | Change | Why | Where |
|---|---|---|---|
| 1 | Expose a `cast` helper (or the adapter) on `QueryContext` | `castToType` exists per engine (`base-adapter.ts:283`) but is unreachable from a cube author's `sql` fn, so generated SQL can't be portable | `server/types/cube.ts`, `executor.ts` |
| 2 | `tryCastToType` on the adapter interface | `::decimal` is strict (`postgres-adapter.ts:143`) — one `n/a` fails the whole query; MySQL/SQLite silently return `0`. `TRY_CAST` on DuckDB/Snowflake/Databend, regex-guarded `CASE` on Postgres | `server/adapters/*` (7 impls) |
| 3 | Honour `shown` | Declared on `Dimension` (`cube.ts:184`) and read **nowhere**; large attribute sets otherwise inflate `/meta`, the field picker and every AI prompt | `compiler-metadata.ts`, AI discovery |
| 4 | Client prunes dead column members | A deleted attribute yields `dimensionNotFound` (`query-validator.ts:211`) and fails the **whole** query, breaking every dashboard that used it. Columns are dropped with a muted note; **dead filters still error**, since dropping one would silently widen the result set | `analyticsPortlet/`, `RecordsTable.tsx` |
| 5 | `buildAttributeDimensions()` helper + docs | Encodes the subquery, security scoping, id/title split, `LIMIT 1` and type resolution so adopters don't re-derive them | `server/` + docs |
| 6 | EAV case in `perf/` + escalation ladder | Filter/sort are O(rows); guidance must be measured, not asserted | `perf/` |

**Performance ladder:** correlated scalar subquery (no DDL, fine at the discussion's scale) → app-side pivoted view
`MAX(CASE WHEN …)` (attributes become indexable columns; fast filter/sort at any size) → materialized view with
refresh.

Measured rather than asserted — the `eav` category in `perf/` runs 2 attributes over a 100k-row base table on
Postgres (`npm run perf -- --filter=eav`), and the shape is clearer than "filter and sort are O(n)":

| Shape | Median | Why |
|---|---|---|
| Project 2 attributes over a 25-row page | ~1.5ms | one indexed lookup per returned row |
| …plus `total: true` | ~9ms | the extra `COUNT(*)` round trip over the base table |
| Filter on a **common** value | ~1.3ms | `LIMIT` is satisfied before the scan gets far |
| Filter on a **selective** value | ~195ms | nothing to stop early on, so the whole base table goes through the subquery |
| `ORDER BY` an attribute | ~244ms | ordering cannot stop early; ~16× the same sort on a real column (~15ms) |

So the honest guidance is: **projection is cheap at any size, ordering by an attribute always costs a full scan, and
filtering costs one only when the predicate is selective.** Pivot into real columns when you need either at scale.

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

## What was built, and where it differed from this plan

| Planned | Built |
|---|---|
| Column widths in `displayConfig` | **localStorage, keyed by column set.** `ChartProps` has no write path back to `displayConfig` and a chart has no portlet id, so an authored `columnWidths` is the default a viewer's own drags layer over — the same shape the data browser already uses. |
| Sort in the table component | **Sort lives with paging in `usePortletPagination`.** With server-side paging, re-ordering the loaded page alone would put the wrong rows on page 1. The component still sorts locally when no host supplies pagination. |
| Badge colours as hex | **Palette indices**, so badges follow the dashboard theme. |
| Locale-derived currency | `currencyCode` added to `AxisFormatConfig`, so a column can be pinned to GBP. Shared by every chart. |
| Client prunes dead members | Needed **structured validation issues** first: the joined error string could not be split back apart, and pruning against `/meta` would have dropped `shown: false` dimensions, which are absent from metadata yet queryable. |
| — | **Drag-to-reorder headers**, persisted next to the widths. |

Also required, and not in the plan: the MCP app and the MCP tool schema enumerate chart types separately from
`chartRegistry`, so a new type is invisible to the AI path until those are updated too.

## Staging (as shipped)

| Stage | Content |
|---|---|
| 1 | `recordsTable` + hand-rolled table: columns, hidden columns, sort headers, column resize and reorder, all five `columnFormats` kinds, `ColumnFormatsEditor`. Client-side paging. |
| 2 | Server `total` + `usePortletPagination` (page, size **and** sort) + `ChartProps.pagination`; `normalizeQuery` cache-key fix. |
| 3 | `rowLink` + `rowLinkUtils` with security tests. |
| 4 | Attribute dimensions: `cast` on `QueryContext`, `tryCastToType`, `buildAttributeDimensions`, `shown`, structured validation issues + client pruning of dead members, perf case + docs. Independently useful — not Records-Table-specific. |

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
- Manual: `npm run dev:setup && npm run dev`, then open the seeded **Employee Records** dashboard. The dev site has
  the EAV tables (`attributes` + `employee_attribute_values`), two seeded tenants with *different* attributes, and
  an org switcher in the header — switching changes the cube set and therefore the table's columns. Cube sets are
  registered at boot, so restart the dev server after seeding.
- `/quality-gate` before the PR.

## Revision history

**v1 → v2.** v1 fetched attribute values in a **second record-grain query** per page (`attributeColumns` config in
Cube's `pivotConfig` vocabulary, spread client-side). It avoided the join fan-out and kept pagination correct, but
because values arrived after the page it could not sort or filter by an attribute server-side. Generated dimensions
supersede it: same correctness, no bespoke query path, and filtering and sorting work.

**v2 → v3.** v2 assumed one attribute set per deployment, so a single global model sufficed. That premise was never
confirmed and does not hold for per-organisation attributes, where it would serve tenant A's columns to tenant B the
moment the sets diverged. v3 makes cube definitions resolvable per tenant:

- `SemanticLayerCompiler` gains **cube sets** — `contextToCubeSetId(securityContext)` selects a set registered at
  boot with `registerCubeSet(setId, cubes)`, merged over the shared base set at registration time.
- `securityContext` became **required** on every cube-resolving method (`getMetadata`, `validateQuery`, `getCube`,
  `getAllCubes(Map)`, `getCubeNames`, `hasCube`), so no request path can reach a cube list without one. Set
  lifecycle is the deliberate exception: registration defines tenancy rather than operating within it.
- `/meta` resolves the security context and is cached per set; the query cache key carries a `setId:generation`
  component, so results can neither cross tenants nor survive a re-registration that changed a definition. Every
  REST response now carries `Cache-Control: private, no-store`, since `/meta` is no longer identical for all callers.
- `buildAttributeDimensions()` and the tolerant `tryCastToType` shipped as part of this, and are useful
  independently of the Records Table.

Full design and the boot loop: [`docs/per-tenant-cube-sets.md`](../per-tenant-cube-sets.md).

**v3 → v4.** Records what shipped. See _What was built, and where it differed from this plan_ above; the
performance ladder now carries measurements from the `eav` benchmarks rather than an asserted complexity claim.

## Answers to the open questions

Decided by the maintainer rather than left blocking:

1. **Attribute types** — the helper takes `attributes[].valueType` or a `types` override map, defaulting to string.
2. **Badge colours** — theme palette only, stored as an index. Currency **is** configurable: `currencyCode` was
   added to `AxisFormatConfig`.
3. **Page sizes** — fixed at 25 / 50 / 100.
4. **Click-through** — row-level only; per-cell links were not built.
5. **Column resize** — in v1, with persisted widths, plus drag-to-reorder.
