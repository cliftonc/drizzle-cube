window.BENCHMARK_DATA = {
  "lastUpdate": 1781343268121,
  "repoUrl": "https://github.com/cliftonc/drizzle-cube",
  "entries": {
    "drizzle-cube": [
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "distinct": true,
          "id": "15d3c8e936cd50c23d45fcd7fbf2c5099529f644",
          "message": "perf: persist benchmark history to gh-pages branch\n\nEmit a customSmallerIsBetter benchmark.json from the perf suite and add a\ngithub-action-benchmark step that appends each main-branch run to the\ngh-pages data branch (dev/bench/). Trends accumulate outside the code\nbranches — no circular commits to source — and surface as a chart plus a\n2x-regression alert. PR runs are excluded (forks can't push; avoids noise).\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-13T10:26:02+01:00",
          "tree_id": "153ec3faa3fa59110603f8441b6ecd88f0a6d01d",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/15d3c8e936cd50c23d45fcd7fbf2c5099529f644"
        },
        "date": 1781343267352,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 58.76,
            "range": "± 8.6ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 67.3ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.65,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 23.0ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 153.55,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 156.6ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.52,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.9ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 24.25,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 26.4ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 70.43,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 71.5ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 90.8,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 91.2ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 165.47,
            "range": "± 8.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 174.3ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 140.15,
            "range": "± 3.6ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 143.8ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 55.4,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 56.7ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 350.65,
            "range": "± 22.5ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 373.2ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 54.93,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 55.0ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.87,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.1ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.3,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 65.09,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 66.6ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 54.99,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 55.5ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 226.1,
            "range": "± 14.1ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 240.2ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 225.84,
            "range": "± 17.6ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 243.5ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 46.45,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 46.9ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 54.46,
            "range": "± 49.9ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 104.3ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 107.48,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 108.9ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.17,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.6ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 299.32,
            "range": "± 4.0ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 303.3ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.87,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 254.09,
            "range": "± 13.5ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 267.6ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 75.71,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 76.5ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.93,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 20.4ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 36.88,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 39.0ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 134.77,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 135.9ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.36,
            "range": "± 4.2ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 48.5ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 379.75,
            "range": "± 3.3ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 383.1ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.09,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.56,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.79,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 33.3ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.45,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      }
    ]
  }
}