# Gap filling — missing time buckets

A time-series query with a `granularity` and a date range can have buckets with
no rows, e.g. a day with no orders. **Gap filling** adds a row for each missing
bucket, with every measure set to a fill value (`0` by default).

From 0.11, drizzle-cube fills gaps the way Cube.js does: **the server returns
observed rows only, and charts fill the gaps** (issue
[#1368](https://github.com/cliftonc/drizzle-cube/issues/1368)). Before 0.11 the
server filled every query unless it set `fillMissingDates: false`.

## Who decides

**Server (`/load`, `/batch`, MCP `load`)** — per time dimension, the first that is set:

1. the query's `timeDimensions[].fillMissingDates`
2. the cube time dimension's `fillMissingDates`
3. `false` — observed rows only

**Charts (dashboards, Analysis Builder, MCP app)** — per time dimension, the first that is set:

1. the query's `timeDimensions[].fillMissingDates` (drill-downs set `false`)
2. the chart's **Fill Missing Dates** option (`displayConfig.fillMissingDates`: `true`, `false`, or `'auto'`)
3. the cube time dimension's `fillMissingDates`
4. `true` — fill, as Cube.js charts do

Filling always needs a `granularity` and a date range, taken from the time
dimension's `dateRange` or a matching `inDateRange` filter. The fill value is
the query's `fillMissingDatesValue` (`0` by default; `null` is allowed).
Ungrouped queries are never filled. `compareDateRange` queries are still filled
on the server so periods line up.

## Cube setting

Set `fillMissingDates` on a time dimension when its missing buckets have a
fixed meaning. For a daily snapshot table, a missing day means "no snapshot",
not zero:

```ts
dimensions: {
  snapshotDate: {
    name: 'snapshotDate',
    type: 'time',
    sql: snapshots.date,
    fillMissingDates: false // charts show gaps; the API returns observed rows
  }
}
```

`fillMissingDates: true` makes the server fill queries that don't set the
option. That's useful for API consumers that expect continuous series.

`/meta` exposes the setting on the dimension, and `/load` returns it in
`annotation.timeDimensions[member].fillMissingDates`. The client reads it from
the annotation, so it needs no extra metadata fetch.

## Migrating from 0.10

- **API consumers** that relied on zero rows for missing buckets now receive
  observed rows only. To restore the old output, set `fillMissingDates: true` on
  the query's time dimension, or on the cube time dimension to cover every
  query.
- **Built-in charts look the same.** They now fill gaps themselves, unless the
  chart's Fill Missing Dates option or the cube time dimension turns it off.
- **`useCubeLoadQuery` / `useMultiCubeLoadQuery`** return raw rows by default.
  Pass `gapFill: {}` (or `gapFill: { fillMissingDates }`) to get chart-filled
  rows, as the dashboard and Analysis Builder do. `withChartGapFilling(resultSet)`
  wraps a result set you already have.
- **Queries that set `fillMissingDates: false`** behave as before.
