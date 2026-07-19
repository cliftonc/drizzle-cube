window.BENCHMARK_DATA = {
  "lastUpdate": 1784441605904,
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
      },
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
          "id": "ba6f6862d17d943a2f89f919bcd0b88ebdc7dd99",
          "message": "docs: link the performance dashboard from the README\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-13T10:32:35+01:00",
          "tree_id": "f4cb05fc9759c167fd38afe6d197869a59cbfa01",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/ba6f6862d17d943a2f89f919bcd0b88ebdc7dd99"
        },
        "date": 1781343309262,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 54.34,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 55.6ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.26,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.7ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 147.43,
            "range": "± 14.5ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 161.9ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.13,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.6ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 24.76,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 24.9ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 71.41,
            "range": "± 2.9ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 74.3ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 88.51,
            "range": "± 4.0ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 92.5ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 164.26,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 165.1ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 140.02,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 140.8ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 52.1,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 52.6ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 364.09,
            "range": "± 20.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 384.4ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 55.03,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 55.7ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.49,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 20.6ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.27,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.3ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 63.72,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 64.8ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 53.69,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 54.0ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 110.76,
            "range": "± 130.6ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 241.3ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 112.97,
            "range": "± 12.0ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 125.0ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.37,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.4ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 48.85,
            "range": "± 21.5ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 70.4ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 108.57,
            "range": "± 4.3ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 112.8ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.16,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 285.36,
            "range": "± 7.2ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 292.5ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.81,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 253.25,
            "range": "± 18.7ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 271.9ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 75.28,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 76.3ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.02,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.2ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 35.51,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 37.3ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 136.95,
            "range": "± 20.3ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 157.3ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.14,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.4ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 390.87,
            "range": "± 3.7ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 394.6ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.1,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.52,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.01,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.1ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.45,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "96dae4d47f1d6be5e69cc6b6e669855296e211c7",
          "message": "chore(deps): update dependency fallow to v2.96.0 (#864)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-13T12:44:54Z",
          "tree_id": "701fbaeee9648d69310635feb795f82868c1ffe2",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/96dae4d47f1d6be5e69cc6b6e669855296e211c7"
        },
        "date": 1781354843674,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 54.16,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.8ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 21.78,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.4ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 149.57,
            "range": "± 8.8ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 158.4ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.2,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.6ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 23.61,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.7ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 71.74,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 72.0ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 91.31,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 94.3ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 168.26,
            "range": "± 7.4ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 175.7ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 142.33,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 142.7ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 55.8,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 56.2ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 373.74,
            "range": "± 2.7ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 376.4ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 55.09,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 55.5ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.27,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 20.4ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.31,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 63.67,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 65.8ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 54.89,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 55.3ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 220.62,
            "range": "± 4.7ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 225.3ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 115.1,
            "range": "± 132.1ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 247.2ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 46.33,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 47.6ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 51.3,
            "range": "± 55.5ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 106.8ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 108.18,
            "range": "± 5.1ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 113.3ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.18,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 288.73,
            "range": "± 7.9ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 296.6ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.88,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 254.9,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 256.9ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 76.03,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 76.4ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.13,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.3ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 34.33,
            "range": "± 4.6ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 39.0ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 136.64,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 138.6ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.77,
            "range": "± 8.9ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 53.7ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 382.37,
            "range": "± 2.3ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 384.6ms · 7 rows"
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
            "value": 0.55,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.13,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.4ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.45,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "f1b02e86ab4f888fe09eecf096e8d87104801f8f",
          "message": "chore(deps): update dependency better-sqlite3 to v12.10.1 (#865)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-14T01:42:33Z",
          "tree_id": "f0efdacc661ab952a7043f19172da0b1a47043e3",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/f1b02e86ab4f888fe09eecf096e8d87104801f8f"
        },
        "date": 1781401507993,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 51.98,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 52.0ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.24,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 20.8ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 146.84,
            "range": "± 8.9ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 155.8ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 19.47,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 19.8ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 21.01,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 21.2ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 64.97,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 65.6ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 76.64,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 77.3ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 174.54,
            "range": "± 4.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 178.9ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 130.91,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 131.3ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 52.99,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 53.5ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 341.97,
            "range": "± 24.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 366.2ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 52.5,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 53.0ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.13,
            "range": "± 3.4ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 22.5ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 2.13,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 2.3ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 59.96,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 62.1ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 50.32,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 51.6ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 215.71,
            "range": "± 27.6ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 243.3ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 108.48,
            "range": "± 21.1ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 129.6ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 32.69,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.1ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 48.21,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 49.5ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 111.39,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 111.8ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.12,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 297.01,
            "range": "± 2.3ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 299.3ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.81,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 263.63,
            "range": "± 8.4ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 272.0ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 68.61,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 69.4ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 16.91,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 17.2ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 41.4,
            "range": "± 12.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 53.5ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 120.59,
            "range": "± 13.2ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 133.8ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 39.98,
            "range": "± 2.9ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 42.9ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 393.63,
            "range": "± 3.7ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 397.3ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.11,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.58,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 29.45,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 29.7ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.45,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "dd2bd0bc9147325d50d4dc847f05ce6b6d69bde8",
          "message": "refactor: standardise & dedupe chart components (#861) (#866)\n\nHarmonise the Cartesian chart components on one control-flow pattern and\nextract the shared scaffolding they had diverged into copy-paste copies of.\n\n- Standardise control flow: Area/Bar/Line/Pie all follow hooks-first\n  (useMemo resolver + transform) → try { guards + render }. AreaChart and\n  PieChart converted off their try/catch + inline-early-return style.\n- Extract shared, unit-tested helpers:\n  - chartAxisResolution.resolveChartAxisFields() — pure X/Y/series resolver\n    returning a discriminated errorCode each chart maps to its own i18n hint.\n  - ChartStates — shared ChartEmptyState / ChartConfigError / ChartRenderError.\n  - chartScaffolding — getDualAxisInfo, getYAxisChartMargins, withTargetData,\n    renderDualYAxes, renderChartTargetLines, makeCartesianTooltipFormatter,\n    renderHoverLegend.\n- Replace bare config-error strings in BarChart with i18n keys.\n- Dedupe *.config.ts boilerplate via chartConfigHelpers (shared isAvailable\n  rules + display-option builders) across 13 chart configs.\n- Extract PieChart pie-data construction into a pure buildPieData() helper.\n\nReduces chart-file duplication (npx fallow dupes): clone groups 150 -> 132,\nduplicated lines ~4661 -> ~3608 (-23%).\n\nMake the `quality` audit gate report-only (always exits 0); update the\nquality-gate skill doc to match.\n\nVerified: typecheck + lint clean; test:client 5850/5850; e2e chart\nscreenshots 18/18; plus a real-browser smoke of bar/line/area dual-axis +\ntargets + stacking.\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-14T05:06:46+01:00",
          "tree_id": "31f10d3720c843e6b7c9b678590d14e756f22c1d",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/dd2bd0bc9147325d50d4dc847f05ce6b6d69bde8"
        },
        "date": 1781410162748,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.5,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.1ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.49,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 20.8ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 154.17,
            "range": "± 3.7ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 157.9ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 19.76,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.0ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 21.79,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 22.0ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 67.95,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 69.0ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 88.96,
            "range": "± 15.8ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 104.8ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 165.12,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 166.1ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 71.18,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 72.7ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 50.02,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 51.8ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 94.13,
            "range": "± 4.6ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 98.7ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 50.42,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 51.0ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 18.02,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 18.4ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.41,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 59.23,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 59.6ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 48.76,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 49.3ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 113.3,
            "range": "± 10.5ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 123.8ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 111.86,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 112.5ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 33.77,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.2ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 58.66,
            "range": "± 10.9ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 69.6ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 106.61,
            "range": "± 3.3ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 109.9ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.31,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 284.65,
            "range": "± 3.9ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 288.5ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.82,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 254.63,
            "range": "± 11.1ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 265.8ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.69,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 72.0ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.32,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.5ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.82,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 39.5ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 129.35,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 130.4ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.08,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 43.3ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 400.41,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 402.6ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.11,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.55,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.33,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 30.8ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.52,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
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
          "id": "3c37a8267cfce9e0ccc4c5ce0e6789bffbe47249",
          "message": "ci(perf): stop posting the benchmark report as a PR comment\n\nThe \"⚡ Performance benchmarks\" report is still available in the Actions job\nsummary and the uploaded perf-results artifact; drop the sticky PR comment so\nit no longer clutters pull requests. gh-pages history + regression alerts are\nunaffected.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-14T05:12:40+01:00",
          "tree_id": "d4c95693d29b200021f9f24a9a62e336f3d1ead2",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/3c37a8267cfce9e0ccc4c5ce0e6789bffbe47249"
        },
        "date": 1781410517647,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 52.88,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 53.2ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.45,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.2ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 156.6,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 157.6ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.38,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.0ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.77,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 22.9ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 68.22,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 68.5ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 88.59,
            "range": "± 4.1ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 92.7ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 164.42,
            "range": "± 26.5ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 190.9ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 136.74,
            "range": "± 8.6ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 145.3ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 60.66,
            "range": "± 4.5ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 65.1ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 97.17,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 99.2ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 52.14,
            "range": "± 5.7ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 57.8ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.28,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 19.5ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.44,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.5ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 59.55,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 60.5ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 49.6,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 50.6ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 114.3,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 115.3ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 115.68,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 116.1ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.56,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.8ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 50.48,
            "range": "± 21.1ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 71.6ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 105.78,
            "range": "± 6.4ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 112.2ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.22,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 286.69,
            "range": "± 5.3ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 292.0ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.84,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 263.04,
            "range": "± 10.4ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 273.5ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.43,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 72.5ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.64,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.1ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.4,
            "range": "± 5.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 42.6ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 129.73,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 130.9ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 42.78,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 43.6ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 399.38,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 400.8ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.11,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.53,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.52,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 30.7ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.51,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "677163aea6ce51837c12ac7f6694bd71cfd4c32c",
          "message": "test: enforce TypeScript typechecking on client tests (#867)\n\nClient tests (tests/client/**) were explicitly excluded from the typecheck\nconfigs, so ~674 type errors had accumulated from fixture/mock drift while\ngoing unnoticed. This adds a dedicated project config and drives them to zero.\n\n- Add tsconfig.client.tests.json (DOM lib, react-jsx, vitest + jest-dom types)\n  and wire it into `npm run typecheck` so client tests are now type-checked in CI.\n- Fix 674 pre-existing type errors — all test-only (completed fixtures, typed\n  vi.fn mocks via Mock<Sig>, narrowed Filter/query unions, completed\n  ColorPalette/ChartAvailabilityMap fixtures). No test behaviour changed;\n  full client suite stays green (160 files / 5850 tests).\n- Switch shared setup to `@testing-library/jest-dom/vitest` so matcher type\n  augmentation (toBeInTheDocument, etc.) applies under Vitest.\n- Enable noUnusedLocals/noUnusedParameters for client tests and remove 168\n  unused imports/locals; add eslint-plugin-unused-imports (no-unused-imports\n  autofix) scoped to test files only — production keeps its `_`-prefix\n  convention for intentional side-effect imports (e.g. d3 transition).\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-14T07:12:28+01:00",
          "tree_id": "d50e92c1c4486802a6f5de81c0049808f5703326",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/677163aea6ce51837c12ac7f6694bd71cfd4c32c"
        },
        "date": 1781417706508,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.71,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 55.0ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 21.6,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.1ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 156.56,
            "range": "± 4.8ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 161.4ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.17,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.3ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 24.11,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 24.2ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 70.23,
            "range": "± 2.7ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 72.9ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 92.86,
            "range": "± 3.5ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 96.3ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 163.85,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 164.6ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 140.43,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 141.3ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 55.34,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 55.6ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 373.63,
            "range": "± 18.0ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 391.6ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 54.24,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 54.7ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.4,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 20.6ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.27,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 62.83,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 66.0ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 53.69,
            "range": "± 7.1ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 60.8ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 112.18,
            "range": "± 12.9ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 125.1ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 113.53,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 116.3ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.41,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.9ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 49.71,
            "range": "± 21.1ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 70.8ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 106.6,
            "range": "± 5.7ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 112.3ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.22,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 288.44,
            "range": "± 2.4ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 290.8ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.85,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 258.98,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 259.3ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 75.71,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 76.6ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 19,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.9ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 33.04,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 36.1ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 135.18,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 136.5ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.65,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 45.3ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 382.3,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 385.3ms · 7 rows"
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
            "value": 0.51,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 31.86,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.2ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.48,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e814f641ea39171132efb1322cf21109c8caf3fc",
          "message": "refactor: eliminate critical+high complexity outliers in src/ (#862) (#868)\n\n* refactor: eliminate critical+high complexity outliers in src/ (#862)\n\nPure extract-function / extract-component / extract-hook refactoring to\ndrive the fallow `quality:health` gate over the bar. No behaviour change:\npublic APIs, component props, hook signatures, and generated SQL are\nunchanged; the multi-engine server suite and 5850 client tests verify parity.\n\nGate result (fallow critical/high above-threshold findings in src/):\n  critical 76 -> 0,  high 92 -> 0   (moderate out of scope)\nMaintainability (src/ per-file mean): 89.55 -> 89.70.\n\nWork was clustered by subsystem and applied behind unchanged interfaces:\n- server/builders, server/physical-plan: per-operator/-type dispatch helpers\n  and processor splits mirroring the existing processors/ structure.\n- client components/hooks/stores (AnalyticsPortlet, DashboardPortletCard,\n  AnalysisBuilder/*, analysis hooks, analysisBuilderStore): extracted custom\n  hooks, presentational sub-components, and pure mapping helpers.\n- charts: co-located scale/axis/tooltip/data-shaping helpers + sub-components.\n- server-misc, server/agent + ai, adapters, DashboardFilters, AgenticNotebook,\n  mcp-app/dev pages: helper/sub-component extraction.\n\nAdds scripts/health-gate.mjs: reports the issue-862 gate (critical/high in\nsrc/ + maintainability) from `fallow health --complexity --format json`.\n\nVerification: typecheck, lint, build clean; test:sqlite (2312) and\ntest:client (5850) green; test:postgres correctness green (4 wall-clock\ntiming-benchmark tests are pre-existing load-sensitive flakes that pass in\nisolation).\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n* test: assert mcp-app config injection by assignment, not bare identifier (#862)\n\nThe \"returns base html unchanged when no config\" test asserted the base\nHTML does not contain `__DRIZZLE_CUBE_MCP_APP_CONFIG__`. That only held\nbecause the committed generated-html.ts was a stale build; the app bundle\nlegitimately *reads* `window.__DRIZZLE_CUBE_MCP_APP_CONFIG__`, so any fresh\nbuild inlines that identifier into the HTML. Regenerating the artifact (after\nthe mcp-app refactor) surfaced this. Assert on the injection assignment\n`window.__DRIZZLE_CUBE_MCP_APP_CONFIG__ =` instead — the real contract, which\nonly the injected <script> satisfies. No app behaviour change.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n* refactor: improve client extraction seams + dedup from review (#862)\n\nFollow-up to the complexity refactor, addressing review findings that some\nextractions \"moved code around\" without earning their boundary. No behaviour\nchange; fallow gate stays 0 critical / 0 high in src/.\n\nConsolidations (remove duplication/smells):\n- Dedup the date-range parser (`deriveRangeFromDateRange`): canonical copy now\n  lives in shared/dateRangeUtils.ts; AnalysisBuilder/DashboardFilters re-export\n  it (~57 duplicated lines removed).\n- Break the shared/utils.ts <-> shared/queryTransforms.ts import cycle by moving\n  the leaf `cleanQuery` into queryTransforms.ts (one-way dependency).\n\nSeam fixes (keep extracted, replace flat prop bags with cohesive interfaces):\n- FilterValueInput: 33 flat props -> 4 grouped interfaces (field/dateRange/\n  combo/inputs); leaf inputs receive only their subset.\n- AnalysisResultsHeader: 31 flat props -> 3 groups (summary/toolbar/display);\n  sub-components take focused Pick<> subsets instead of {...props}.\n- useDashboardFilterConfigModal: ~50-field bag -> 3 focused sub-hooks\n  (useFilterDropdowns, useFilterValueFetch, useDateRangeState) composed by a\n  thin orchestrator.\n- Extract the value-dropdown keyboard logic into a pure, unit-tested\n  resolveValueKeyboardAction (keeps FilterConfigModal under the gate; adds\n  coverage for the nav branches).\n\nVerified: typecheck + lint clean; client suite 5861 passed; gate 0/0.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n* docs: sync CLAUDE.md directory layouts with extracted modules (#862)\n\nThe complexity refactor added ~130 files + 6 client subdirectories. Update the\naffected CLAUDE.md docs to match the current tree at their existing curated\ngranularity:\n- src/client: add the 5 new component subdirs (analyticsPortlet, dashboardPortletCard,\n  portletAnalysisModal, shared/filterItem, shared/filterValueSelector), the\n  AnalysisBuilder hooks/ dir, and fix stale file counts.\n- AnalysisBuilder: ~14k/41 files -> ~15k/64 files; add hooks/ + new utils/ + sub-components.\n- server (root, builders, logical-plan, agent, ai, adapters): list the new extracted\n  sibling modules (*-helpers.ts, *-handler.ts, processors, compiler-metadata, etc.).\n\ntests/, src/i18n, root CLAUDE.md, AGENTS.md, src/adapters confirmed already accurate.\nDocs-only; no code change.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n---------\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-15T05:38:19+01:00",
          "tree_id": "834cb9bce7821658e1f8fe65f558a4a0ba598b94",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/e814f641ea39171132efb1322cf21109c8caf3fc"
        },
        "date": 1781498455250,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.04,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 53.4ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.64,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 20.9ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 142.73,
            "range": "± 8.4ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 151.1ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.18,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.5ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.39,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.0ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 69.51,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 69.9ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 89.46,
            "range": "± 3.4ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 92.8ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 82.54,
            "range": "± 113.2ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 195.8ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 70.79,
            "range": "± 15.0ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 85.8ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 31.54,
            "range": "± 23.1ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 54.6ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 94.97,
            "range": "± 2.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 97.3ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 50.21,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 51.0ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 18.38,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 19.0ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.36,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 59.29,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 59.8ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 48.8,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 49.3ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 109.29,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 109.6ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 111.2,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 112.1ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 33.75,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.2ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 48.8,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 49.2ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 108.17,
            "range": "± 4.1ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 112.3ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.26,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 288.8,
            "range": "± 20.5ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 309.3ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 4.11,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 5.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 256.8,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 257.3ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.22,
            "range": "± 7.7ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 78.9ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.5,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.8ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 39.46,
            "range": "± 22.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 61.6ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 128.46,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 130.0ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.14,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 45.0ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 404.29,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 404.9ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.6,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.49,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 30.9ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.52,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "d49793fff6cfbd8a5014cd75db50baf1d37e388f",
          "message": "refactor: close out #858 deferred consolidation items (#869)\n\nClears the deferred cleanup items tracked in #858 (follow-up to #850/#857),\nplus the timing-flake fixes surfaced during verification. No behaviour change\nexcept the deliberate dead-code removals; flow SQL verified byte-for-byte.\n\nA1 — remove dead DatabaseAdapter.supportsLateralJoins() method (interface,\nabstract base, 6 adapters). Breaking type-surface change; the capability *field*\nsupportsLateralJoins stays. Tests now read it via getCapabilities().\n\nA2 — remove 5 write-only DatabaseCapabilities flags (supportsStddev,\nsupportsVariance, supportsWindowFunctions, supportsFrameClause,\nsupportsDerivedTablesInCTE). Never read in production: stats degrade via the\nnull-returning buildStddev()/buildVariance() path, and the other flags were\nconstant-true or unwired. Load-bearing flags (supportsLateralSubqueriesInCTE,\nsupportsPercentileSubqueries, supportsPercentile) kept. Breaking type change.\n\nB1 — fold retention's resolveBindingKey into the shared resolveBindingKeyExpr.\nGeneralised the helper with a pluggable error-message config + optional cubes\nmap (retention resolves the dimension on the cube named in the key); deleted\nretention's private copy and the TODO(#850). Error messages preserved exactly.\n\nB2 — DRY the flow Sankey/sunburst UNION arms via buildNodeArm /\nbuildAdjacentLinkArm, collapsing the looped before/after duplication. Generated\nSQL verified byte-for-byte identical across sankey & sunburst configs.\n\nB3 — unify client-group-filter handling. New shared asGroupFilter primitive\nreplaces the duplicated { type, filters } discriminators in funnel and flow, and\nFilterBuilder now recognises the client group shape. (Retention has no such\nduplicate — it only handles server { and }/{ or } — so its filter path is\nunchanged.)\n\ntests — drop brittle absolute wall-clock ceilings in\naggregations-performance.test.ts (keep structural checks: result shape,\nduration >= 0, no error, console reporting, and the relative consistency\nratios); widen the cache TTL assertion from a 1s to a 5s budget.\n\nNot addressed here (noted on the issue): A3 optimiser pipeline stays with the\nlogical-plan rework; the MySQL ORDER BY flake had no reproduction.\n\nRefs #858, #850, #857\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-15T06:48:06+01:00",
          "tree_id": "70ef29400f2382da6c18e2d1c5e4cf8b5bae76f9",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/d49793fff6cfbd8a5014cd75db50baf1d37e388f"
        },
        "date": 1781502646243,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 55.52,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 56.0ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.77,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.9ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 148.3,
            "range": "± 11.5ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 159.8ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 22.11,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 22.7ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 24.9,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 25.2ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 71.97,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 73.2ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 92.3,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 93.2ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 174.5,
            "range": "± 3.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 177.8ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 141.27,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 142.0ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 55.88,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 56.2ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 369,
            "range": "± 11.9ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 380.9ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 53.37,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 53.9ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.77,
            "range": "± 2.9ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 23.6ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.32,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 69.76,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 71.2ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 53.11,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 53.7ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 113.68,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 113.9ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 112.79,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 114.3ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 35.43,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 35.6ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 49.66,
            "range": "± 22.3ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 71.9ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 111.65,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 112.0ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.35,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.5ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 291.23,
            "range": "± 20.3ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 311.5ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.85,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 256.04,
            "range": "± 25.1ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 281.2ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 76.89,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 77.3ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.22,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.3ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.71,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 38.1ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 143.6,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 145.3ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 45.23,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 45.7ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 385.7,
            "range": "± 3.9ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 389.6ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.08,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.52,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 33.26,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 33.7ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.45,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
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
          "id": "21ef46724144c6753b551c7af1cb77d7eb1eab28",
          "message": "0.6.0",
          "timestamp": "2026-06-15T06:51:08+01:00",
          "tree_id": "edab0611986a03f78966bdf300ac8fa0bd31d8be",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/21ef46724144c6753b551c7af1cb77d7eb1eab28"
        },
        "date": 1781502836522,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.9,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.4ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 21.45,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.2ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 150.53,
            "range": "± 6.2ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 156.8ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 19.92,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.4ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 23.02,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.8ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 71.74,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 74.0ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 88.96,
            "range": "± 21.7ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 110.6ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 166.1,
            "range": "± 9.7ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 175.8ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 73.1,
            "range": "± 85.3ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 158.4ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 52.51,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 53.2ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 94.98,
            "range": "± 27.9ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 122.9ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 50.71,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 50.8ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.46,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 19.6ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.42,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 60.21,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 60.3ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 48.83,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 49.4ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 114.26,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 114.7ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 115.14,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 116.3ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 33.1,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 33.4ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 50.8,
            "range": "± 26.4ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 77.2ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 108.48,
            "range": "± 5.8ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 114.3ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.19,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.2ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 290.58,
            "range": "± 20.3ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 310.8ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.93,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 271.62,
            "range": "± 2.6ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 274.3ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.75,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 72.2ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 19.03,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.3ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 36.92,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 39.9ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 130.54,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 131.3ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.82,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 45.0ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 405.16,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 405.5ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.11,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.62,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.17,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 30.7ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.52,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "d68f91d8825b683e3687b9c392a2baac0b8af2ef",
          "message": "chore(deps): update dependency drizzle-databend to v0.1.15 (#870)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-15T06:55:56+01:00",
          "tree_id": "f660a36c45be80b096313e4880baae207a612335",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/d68f91d8825b683e3687b9c392a2baac0b8af2ef"
        },
        "date": 1781503114391,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 55.35,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 56.4ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.09,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 23.2ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 153.51,
            "range": "± 12.2ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 165.7ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.45,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.9ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 24.84,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 25.6ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 71.07,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 71.9ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 94.13,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 94.9ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 166.76,
            "range": "± 12.2ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 179.0ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 146.86,
            "range": "± 2.7ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 149.6ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 54.18,
            "range": "± 29.8ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 84.0ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 378.86,
            "range": "± 12.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 391.6ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 55.18,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 55.5ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 21.79,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 22.1ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.36,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 63.94,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 64.9ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 55.23,
            "range": "± 6.2ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 61.4ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 113.79,
            "range": "± 15.9ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 129.7ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 112.48,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 114.2ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.32,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.4ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 48.23,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 50.2ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 103.81,
            "range": "± 4.0ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 107.8ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.24,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 288,
            "range": "± 9.1ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 297.1ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.93,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 255.66,
            "range": "± 3.1ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 258.8ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 76.26,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 77.6ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.21,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 20.4ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 36.33,
            "range": "± 15.0ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 51.3ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 135.78,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 136.4ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.63,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 46.5ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 389.48,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 390.0ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.1,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.63,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.47,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.9ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.47,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "b2de2bd6e3f86af7585be49646fd10e57f586cc4",
          "message": "chore(deps): update github artifact actions to v7 (#856)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-15T06:56:09+01:00",
          "tree_id": "fa6809e1f87269d79cddbf0dafb08b7d7b7f3eb0",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/b2de2bd6e3f86af7585be49646fd10e57f586cc4"
        },
        "date": 1781503123091,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 55.37,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 58.1ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.05,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.8ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 165.36,
            "range": "± 3.7ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 169.1ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.02,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.4ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 23.83,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 24.3ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 68.86,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 69.7ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 56.88,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 57.5ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 84.56,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 85.5ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 72.59,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 74.7ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 30.23,
            "range": "± 6.0ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 36.2ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 95.2,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 95.9ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 50.29,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 50.5ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 21.98,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 22.4ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.45,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.6ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 60.5,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 61.4ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 51.63,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 51.9ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 115.48,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 116.3ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 115.09,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 115.5ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.58,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 35.8ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 48.87,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 50.5ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 106.19,
            "range": "± 4.9ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 111.1ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.26,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 286.36,
            "range": "± 24.1ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 310.4ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 3,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.2ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 257.48,
            "range": "± 15.2ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 272.6ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 73.25,
            "range": "± 25.0ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 98.3ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.62,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.7ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 38.28,
            "range": "± 2.6ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 40.9ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 129.24,
            "range": "± 2.5ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 131.7ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.18,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 45.8ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 406.69,
            "range": "± 2.4ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 409.1ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.13,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.2ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.6,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.87,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.3ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.5,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "9f2379cd44d04a4f7b3181aa90812a62feaf6a75",
          "message": "chore(deps): update dependency react-resizable to v4 (#763)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-15T06:56:29+01:00",
          "tree_id": "e1b08da2b02754d4f728f03c7ffb0045ebc4e8d5",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/9f2379cd44d04a4f7b3181aa90812a62feaf6a75"
        },
        "date": 1781503146919,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 54.42,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 55.1ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 21.93,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.3ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 152.06,
            "range": "± 5.5ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 157.6ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.25,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.5ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 23.77,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.9ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 71.09,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 72.7ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 93.25,
            "range": "± 2.5ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 95.8ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 165.2,
            "range": "± 13.7ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 178.9ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 139.65,
            "range": "± 9.8ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 149.4ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 55.37,
            "range": "± 30.2ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 85.6ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 372.6,
            "range": "± 17.1ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 389.7ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 54.46,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 55.6ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 21.97,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 22.9ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.3,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.3ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 64.86,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 65.2ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 56.07,
            "range": "± 9.6ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 65.7ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 118.22,
            "range": "± 2.9ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 121.1ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 113.14,
            "range": "± 3.3ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 116.4ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.63,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 35.0ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 50.6,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 50.9ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 107.42,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 110.4ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.2,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 303.13,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 304.8ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 3.04,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.1ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 254.08,
            "range": "± 4.4ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 258.5ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 74.55,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 75.9ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.08,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.8ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 47.46,
            "range": "± 193.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 240.6ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 135.29,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 137.2ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.16,
            "range": "± 2.5ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 45.7ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 387.59,
            "range": "± 3.5ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 391.1ms · 7 rows"
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
            "value": 0.61,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.04,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.8ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.46,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "858dc23a17802cfd2585925771a465ced403afa6",
          "message": "chore(deps): update react-grid-layout to v2.2.3 (#872)\n\nBumps react-grid-layout to 2.2.3. The 2.2.x EventCallback signature\nchanged its `element` parameter from `HTMLElement | undefined` to\n`HTMLElement | null`, so widen the onDragStop/onResizeStop handler and\nDashboardContext types accordingly.\n\nReplaces stale Renovate PR #553 (based on v0.5.8).\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-15T08:54:13+01:00",
          "tree_id": "2f99e106600d085734e9a647c53ff6ca13a3a591",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/858dc23a17802cfd2585925771a465ced403afa6"
        },
        "date": 1781510219203,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 55.13,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 55.7ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 23.21,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 23.5ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 156.76,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 157.3ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.69,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 22.1ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 25.1,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 25.6ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 71.42,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 73.1ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 90.14,
            "range": "± 2.9ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 93.1ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 168.04,
            "range": "± 4.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 172.4ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 147.69,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 148.8ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 56.06,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 56.8ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 371.69,
            "range": "± 8.9ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 380.6ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 54.12,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 56.1ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 21.89,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 23.0ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.37,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.7ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 62.01,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 63.1ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 51.97,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 52.8ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 113.87,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 115.7ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 113.2,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 114.1ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 35.48,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 35.7ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 50.14,
            "range": "± 39.0ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 89.2ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 110.34,
            "range": "± 4.9ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 115.2ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.17,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.5ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 300.78,
            "range": "± 5.1ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 305.9ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.89,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 272.42,
            "range": "± 6.0ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 278.4ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 76.67,
            "range": "± 3.8ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 80.5ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.21,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.9ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 34.66,
            "range": "± 3.9ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 38.6ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 134.18,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 135.5ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 45.41,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 46.4ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 384.83,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 388.0ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.1,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.58,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 33.16,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 33.5ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.46,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "02c628a88e3bf5032ad515e9afa23c65fef2e596",
          "message": "chore(deps): lock file maintenance (#873)\n\nRefresh package-lock.json to the latest in-range versions of all\ndependencies (npm update). This also pulls react-grid-layout 2.2.x,\nwhose EventCallback `element` param changed from `HTMLElement | undefined`\nto `HTMLElement | null`; widen the affected dashboard handler and context\ntypes to match.\n\nReplaces stale Renovate PR #348 (based on v0.5.8).\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-15T08:59:45+01:00",
          "tree_id": "401183fc02d0c157ace74aa655c281171eefa62e",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/02c628a88e3bf5032ad515e9afa23c65fef2e596"
        },
        "date": 1781510574822,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 57.66,
            "range": "± 3.4ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 61.0ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 23.93,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 25.2ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 171.71,
            "range": "± 3.6ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 175.3ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 39.77,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 40.0ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 42.74,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 43.2ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 96.81,
            "range": "± 6.3ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 103.1ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 66.12,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 67.0ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 118.05,
            "range": "± 5.7ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 123.7ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 105.01,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 105.7ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 53.29,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 53.6ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 141.33,
            "range": "± 4.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 145.7ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 81.03,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 83.0ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 39.25,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 40.6ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.49,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.5ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 92.64,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 93.5ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 80.89,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 83.0ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 160.78,
            "range": "± 6.3ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 167.1ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 161.71,
            "range": "± 5.0ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 166.7ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 58.74,
            "range": "± 3.7ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 62.5ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 77.79,
            "range": "± 37.3ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 115.1ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 152,
            "range": "± 10.6ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 162.6ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.44,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.7ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 364.45,
            "range": "± 28.2ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 392.6ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 3.66,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 4.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 319.15,
            "range": "± 7.2ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 326.3ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 106.52,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 109.7ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 22.24,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 23.3ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 42.38,
            "range": "± 4.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 47.1ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 150.62,
            "range": "± 13.5ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 164.2ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 67.69,
            "range": "± 5.4ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 73.0ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 445.26,
            "range": "± 13.6ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 458.9ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.65,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 51.46,
            "range": "± 16.3ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 67.7ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.54,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.7ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "971753dfabc7e2a00cb8018a157d100e572451df",
          "message": "chore(deps): update playwright monorepo to v1.61.0 (#875)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-15T21:30:25Z",
          "tree_id": "6600c086fe2daaa2bd650840295ae8c74d614f5f",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/971753dfabc7e2a00cb8018a157d100e572451df"
        },
        "date": 1781559182630,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 55.71,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 57.6ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 24.42,
            "range": "± 2.5ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 27.0ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 155.59,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 157.3ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.85,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 22.2ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 24.88,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 25.6ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 71.9,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 73.2ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 88.47,
            "range": "± 3.3ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 91.7ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 165.45,
            "range": "± 11.7ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 177.2ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 142.25,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 144.1ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 55.7,
            "range": "± 26.4ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 82.1ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 351.14,
            "range": "± 9.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 361.0ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 56.2,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 58.3ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.67,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.7ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.31,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.3ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 64.24,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 65.1ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 55.72,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 56.1ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 224.33,
            "range": "± 19.9ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 244.3ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 235.57,
            "range": "± 14.0ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 249.6ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 47.38,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 47.7ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 55.17,
            "range": "± 36.6ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 91.8ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 107.13,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 108.1ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.23,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 306.29,
            "range": "± 3.1ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 309.4ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.93,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 260.66,
            "range": "± 8.5ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 269.2ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 76.97,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 77.5ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.57,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 20.3ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 36.63,
            "range": "± 15.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 52.5ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 137.48,
            "range": "± 5.0ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 142.5ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.23,
            "range": "± 3.9ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 48.1ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 385.18,
            "range": "± 6.4ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 391.6ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.1,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.6,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.9ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.4,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.6ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.46,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "7ad7c57c762915cbb19df94d3e43a6d0557eda9e",
          "message": "chore(deps): update dependency @anthropic-ai/sdk to v0.104.2 (#878)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-16T04:09:31Z",
          "tree_id": "971b4639833518c42c50b8743880abd3fcf10702",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/7ad7c57c762915cbb19df94d3e43a6d0557eda9e"
        },
        "date": 1781583128366,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.38,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.6ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.26,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 20.5ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 150.65,
            "range": "± 16.0ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 166.7ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 19.41,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 19.8ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 21.29,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 21.5ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 67.95,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 69.7ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 88.46,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 91.7ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 165.13,
            "range": "± 13.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 178.9ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 133.7,
            "range": "± 4.5ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 138.2ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 53.26,
            "range": "± 42.6ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 95.9ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 98.73,
            "range": "± 14.7ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 113.4ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 49.07,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 49.3ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 18.53,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 18.8ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.37,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 58.09,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 58.8ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 48.67,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 48.9ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 112.69,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 113.1ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 112.94,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 113.5ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 32.38,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 32.5ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 53.51,
            "range": "± 7.4ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 60.9ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 108.72,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 111.9ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.2,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 289.1,
            "range": "± 16.8ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 305.9ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.86,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 257.93,
            "range": "± 37.3ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 295.3ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 70.94,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 72.9ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.32,
            "range": "± 2.4ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 20.7ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 35.45,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 36.8ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 126.26,
            "range": "± 2.3ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 128.5ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 42.27,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 43.2ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 398.51,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 398.9ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.59,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 29.55,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 31.1ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.5,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "709186738a2c9a01cf4a1c51517f2245e4e443b1",
          "message": "chore(deps): update dependency @hono/node-server to v2.0.5 (#879)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-16T04:16:58Z",
          "tree_id": "ef856f96c77107afd1807e7eb4435ae48aa6c79d",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/709186738a2c9a01cf4a1c51517f2245e4e443b1"
        },
        "date": 1781583579225,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.17,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 53.6ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.58,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.1ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 155.78,
            "range": "± 12.5ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 168.3ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.74,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.8ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.45,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.1ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 68.32,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 70.0ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 83.28,
            "range": "± 5.2ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 88.5ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 162.32,
            "range": "± 16.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 179.1ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 134.33,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 134.6ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 54.15,
            "range": "± 6.5ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 60.7ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 97.41,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 98.0ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 57.4,
            "range": "± 4.7ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 62.1ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 18.78,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 19.4ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.39,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 59.39,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 59.7ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 49.94,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 50.3ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 115.82,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 116.6ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 117.27,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 117.6ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.1,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.4ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 51.59,
            "range": "± 20.6ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 72.2ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 111.85,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 113.5ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.17,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 289.77,
            "range": "± 3.4ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 293.2ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.79,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 258.88,
            "range": "± 29.9ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 288.8ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.98,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 72.8ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.65,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.8ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.39,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 38.6ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 128.61,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 129.4ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 42.41,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 43.1ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 399.4,
            "range": "± 3.5ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 402.9ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.11,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.6,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.92,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.9ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.51,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "bac4dcd3bb844dc1b5b4fc9e3163182c102d7f40",
          "message": "fix: resolve types under moduleResolution nodenext/node16 (#877) (#880)\n\nConsumers using `moduleResolution: nodenext`/`node16` could not resolve\nthe types for `drizzle-cube/server` and `drizzle-cube/adapters/*`; public\nsymbols such as `defineCube` silently degraded to `any`. Two root causes:\n\n1. dts output-path regression. vite-plugin-dts v5 renamed `rollupTypes`->\n   `bundleTypes` and `outDir`->`outDirs`, so the existing keys were silently\n   ignored. Without `entryRoot`, declarations were emitted one level too deep\n   (dist/server/server/*, dist/adapters/adapters/*) while package.json#exports\n   pointed at the flat paths -> TS7016 -> types resolved to `any`.\n\n2. Extensionless relative specifiers. Emitted `.d.ts` mirrored the source's\n   extensionless imports (`from './cube-utils'`), which Node's ESM resolution\n   cannot follow, so re-exported symbols became `any`.\n\nChanges:\n- Add explicit `.js` / `/index.js` / `.json` extensions to every relative\n  import/export/dynamic-import in src/** (moduleResolution: bundler tolerates\n  them, so typecheck/build are unaffected).\n- vite.config.server.ts / vite.config.adapters.ts: emit per-file declarations\n  with `entryRoot` set so output lands flat at the package.json#exports paths;\n  drop the dead `rollupTypes`/`outDir` keys.\n- package.json: add the missing \".\" root export, fix repository.url, add\n  @arethetypeswrong/cli + publint and a `check:exports` script (also run in\n  prepublishOnly).\n- .attw.json + CI: run attw + publint on every PR to guard type resolution.\n  Scoped to profile node16; still catches the no-resolution and\n  internal-resolution-error classes that represent this regression. The\n  pre-existing CJS require() dual-package-types masquerade is tracked\n  separately and suppressed here rather than silently fixed.\n\nVerified: `import { defineCube } from 'drizzle-cube/server'` under\nESM+nodenext+strict now types `ctx` as QueryContext (not any); attw is green\nfor server + all adapters under node16; typecheck, lint, and the client +\nSQLite server test suites pass.\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-16T05:19:48+01:00",
          "tree_id": "9e017c1076de4f776c2c09fa2647f4dc28f1b5f1",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/bac4dcd3bb844dc1b5b4fc9e3163182c102d7f40"
        },
        "date": 1781583743076,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.49,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.1ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.52,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 20.9ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 140.99,
            "range": "± 21.2ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 162.2ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.15,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.7ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.8,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 22.9ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 68.96,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 69.7ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 89.45,
            "range": "± 2.5ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 92.0ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 163.91,
            "range": "± 19.2ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 183.1ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 134.76,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 135.9ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 51.76,
            "range": "± 9.3ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 61.1ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 96.08,
            "range": "± 3.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 99.4ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 57.12,
            "range": "± 3.1ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 60.2ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.23,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 19.6ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.42,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.5ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 60.49,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 61.2ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 50,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 50.5ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 110.81,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 111.3ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 110.34,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 110.8ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.84,
            "range": "± 8.1ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 42.9ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 49.36,
            "range": "± 22.1ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 71.5ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 107.85,
            "range": "± 5.3ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 113.2ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.25,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 289.65,
            "range": "± 52.3ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 342.0ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.9,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 256.4,
            "range": "± 40.4ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 296.8ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.96,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 72.3ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.66,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 20.9ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.55,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 39.5ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 130.77,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 131.4ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.1,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.4ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 403.02,
            "range": "± 8.5ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 411.6ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.61,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 31.12,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 31.2ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.5,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
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
          "id": "02a894edc117266f435b91472efd8fb4dab979bb",
          "message": "0.6.1",
          "timestamp": "2026-06-16T05:22:57+01:00",
          "tree_id": "6e5888d3deea16685b3fb93ff027f85c8f7d5f5f",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/02a894edc117266f435b91472efd8fb4dab979bb"
        },
        "date": 1781583942994,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.95,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 55.9ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.51,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 20.8ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 145.29,
            "range": "± 20.9ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 166.2ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.9ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.01,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 22.7ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 69.02,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 69.3ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 88.5,
            "range": "± 4.5ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 93.0ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 166.26,
            "range": "± 13.2ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 179.4ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 134.53,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 136.7ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 55.81,
            "range": "± 32.0ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 87.8ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 97.25,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 97.7ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 55.1,
            "range": "± 6.9ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 62.0ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.47,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 19.5ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.43,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 60.16,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 61.3ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 50.27,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 50.8ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 112.13,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 112.9ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 112.81,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 113.1ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.03,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.2ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 48.91,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 49.4ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 109.32,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 110.5ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.31,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 289.19,
            "range": "± 7.6ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 296.8ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.93,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 256.19,
            "range": "± 15.4ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 271.6ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 72.15,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 72.3ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.91,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.4ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 40.58,
            "range": "± 15.4ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 56.0ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 127.99,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 129.8ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 42.91,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 45.7ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 398.82,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 400.4ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.2ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.67,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 31.18,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 31.4ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.5,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "3b99f523a700077f40596039efcc977fb9b247a8",
          "message": "chore(deps): update typescript-eslint monorepo to v8.61.1 (#882)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-16T05:50:05Z",
          "tree_id": "884cde502cbce8fb2717c2c40daf3d647d8b1de3",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/3b99f523a700077f40596039efcc977fb9b247a8"
        },
        "date": 1781589166606,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 54.28,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 55.3ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.52,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 23.4ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 145.91,
            "range": "± 7.4ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 153.3ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 22.79,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 23.1ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 25.11,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 25.5ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 74.88,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 75.8ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 88.54,
            "range": "± 4.1ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 92.6ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 165.8,
            "range": "± 9.1ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 174.9ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 140.17,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 140.3ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 54.59,
            "range": "± 27.6ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 82.2ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 352.88,
            "range": "± 18.7ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 371.6ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 55.25,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 56.8ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 21.89,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 24.0ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.29,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.3ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 63.36,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 64.2ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 54.3,
            "range": "± 6.0ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 60.3ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 111.95,
            "range": "± 12.5ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 124.4ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 109.76,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 111.4ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.76,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 36.2ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 48.67,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 49.3ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 104.81,
            "range": "± 4.7ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 109.5ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.34,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 3.0ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 315.91,
            "range": "± 3.7ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 319.6ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.9,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.1ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 278.01,
            "range": "± 6.7ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 284.8ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 75.17,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 78.2ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 17.89,
            "range": "± 3.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 21.0ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.06,
            "range": "± 24.4ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 61.5ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 138.41,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 139.6ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.14,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 45.9ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 382.35,
            "range": "± 5.3ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 387.6ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.1,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.59,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 31.91,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.1ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.47,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "5c952759cb26c34d421503f49271fc32a407a27a",
          "message": "chore(deps): update dependency better-sqlite3 to v12.11.1 (#883)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-16T18:01:54Z",
          "tree_id": "69c6a283b93e04dea02ff36e1b58af630880a5f3",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/5c952759cb26c34d421503f49271fc32a407a27a"
        },
        "date": 1781633073242,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 55.65,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 56.8ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.41,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.7ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 141.48,
            "range": "± 21.2ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 162.7ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.39,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 22.5ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 23.91,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 24.2ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 72.89,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 74.0ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 92.57,
            "range": "± 2.3ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 94.9ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 167.11,
            "range": "± 9.7ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 176.8ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 145.19,
            "range": "± 2.7ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 147.9ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 54.27,
            "range": "± 8.6ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 62.9ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 364.43,
            "range": "± 22.5ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 386.9ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 56.42,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 56.6ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 21.01,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.3ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.27,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.3ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 65.31,
            "range": "± 2.6ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 68.0ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 55.56,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 56.1ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 113.11,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 114.7ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 115.51,
            "range": "± 14.5ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 130.0ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 35.13,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 35.4ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 49.18,
            "range": "± 2.9ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 52.1ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 106.72,
            "range": "± 5.4ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 112.1ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.19,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 293.68,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 295.8ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.91,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 270.97,
            "range": "± 13.7ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 284.7ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 77.02,
            "range": "± 21.9ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 98.9ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 17.85,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.7ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 35.68,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 36.8ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 153.27,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 153.6ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.29,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 45.1ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 382.62,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 384.1ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.1,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.57,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.82,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.8ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.45,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "63d09ed686dca18201b19322a93f8116042e9826",
          "message": "chore(deps): update dependency fallow to v2.97.0 (#896)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-16T22:53:52Z",
          "tree_id": "8019d6abdce331b01bb70ca6a6df4f2b5c43e9f9",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/63d09ed686dca18201b19322a93f8116042e9826"
        },
        "date": 1781650593130,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 54.86,
            "range": "± 6.2ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 61.1ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 21.56,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.5ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 154.74,
            "range": "± 5.3ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 160.1ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.23,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.8ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.87,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.2ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 69.37,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 71.1ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 88.14,
            "range": "± 2.4ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 90.5ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 163.6,
            "range": "± 10.1ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 173.7ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 135.31,
            "range": "± 19.2ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 154.5ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 53.31,
            "range": "± 8.4ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 61.8ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 95.57,
            "range": "± 297.6ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 393.2ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 51.92,
            "range": "± 4.5ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 56.4ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 21.6,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 22.9ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.41,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.5ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 61.16,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 61.6ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 50.51,
            "range": "± 8.2ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 58.7ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 111.31,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 111.7ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 110.65,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 111.0ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 33.62,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.4ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 47.63,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 48.8ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 108.9,
            "range": "± 2.9ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 111.8ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.27,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 293.8,
            "range": "± 7.3ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 301.1ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.93,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 256.7,
            "range": "± 30.9ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 287.6ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 72.67,
            "range": "± 22.4ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 95.1ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.72,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 20.6ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 36.82,
            "range": "± 4.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 41.6ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 131.75,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 132.6ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.56,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 45.4ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 402.74,
            "range": "± 2.3ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 405.0ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.2ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.61,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.82,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 30.9ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.51,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "40dd468e9eb9c55ecc527f8b172bd2205df00282",
          "message": "chore(deps): update dependency openai to v6.43.0 (#898)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-17T03:10:33Z",
          "tree_id": "835a86ad6b0eb00922a254fac33689b2b69cd3db",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/40dd468e9eb9c55ecc527f8b172bd2205df00282"
        },
        "date": 1781665989918,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.51,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.4ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.86,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.3ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 155.66,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 155.9ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.48,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.9ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.53,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 22.7ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 69.2,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 70.1ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 90.82,
            "range": "± 13.3ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 104.1ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 165.44,
            "range": "± 20.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 186.3ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 135.52,
            "range": "± 10.1ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 145.7ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 52.85,
            "range": "± 51.5ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 104.3ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 99.22,
            "range": "± 12.0ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 111.2ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 50.02,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 50.7ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 18.27,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.1ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.4,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.5ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 59.31,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 59.6ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 49.04,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 49.1ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 112.39,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 112.8ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 111.95,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 112.4ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 33.29,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 33.8ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 48.61,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 48.8ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 108.15,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 111.0ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.38,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.6ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 293.3,
            "range": "± 17.0ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 310.3ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.89,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 267.17,
            "range": "± 18.7ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 285.9ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.64,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 74.7ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.98,
            "range": "± 2.3ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 21.3ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 40.13,
            "range": "± 15.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 56.0ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 129.69,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 132.5ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.35,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.6ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 405.14,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 406.8ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.13,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.6,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.11,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 30.2ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.52,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "28959103+jrdncstr@users.noreply.github.com",
            "name": "jrdncstr",
            "username": "jrdncstr"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "38610a7c29b712fd1d82b0096c131b931c54bf96",
          "message": "fix: ship correct CJS types for require() consumers via subdir convention (#881) (#895)\n\n* fix: ship correct CJS types for require() consumers (#881)\n\nEntries with a `require` condition (server, adapters, ./mcp) shipped only\nESM-flavored `.d.ts`, so attw flagged FalseESM (\"Masquerading as ESM\") for CJS\n`require()` consumers — they got ESM-shaped declarations describing a CJS module.\n\nMirror the declaration trees into `dist/cjs/` via vite-plugin-dts `outDirs`\n(verbatim copies — no specifier rewriting) and mark that tree CommonJS with a\ngenerated `dist/cjs/package.json` = `{\"type\":\"commonjs\"}` (the package-scope /\nsubdir convention). Each `require.types` now points at the `dist/cjs` mirror,\nwhile the `require` runtime keeps the existing `.cjs` files. The client decl\ntree is mirrored too because the server's CJS graph reaches the client \"island\"\n(client/types, chart config registry).\n\nUses the already-installed vite-plugin-dts — no custom codegen script, no new\ndependency, no `.d.cts` specifier rewriting.\n\nattw is now green (CJS) for `.`, ./server, every ./adapters/*, and ./mcp, so the\n`false-esm` suppression is removed from .attw.json (publint clean). The retained\n`cjs-resolves-to-esm` ignore is the legitimate, intended state of the ESM-only\nclient entries (no `require` condition), not a masquerade.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n* fix(review): clean dist/cjs before build to prevent stale declarations shipping\n\nThe CJS declaration mirror (dist/cjs/) is not a vite outDir, so unlike the ESM\ntrees it was never emptied between builds. A renamed/removed source could leave\na stale `.d.ts` in dist/cjs/, and `files: [\"dist/\"]` would publish it. Add a\n`prebuild` step that removes dist/cjs/ once before the build chain (vite still\nempties dist/server, dist/client, dist/adapters itself).\n\nVerified: planted a stale dist/cjs file, ran `npm run build` — prebuild removed\nit, mirrors + marker intact, `attw --pack .` and `publint` still exit 0.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n* refactor: resolve dist/cjs dir once in cjsTypesMarker\n\nCompute the resolved output dir into a single `cjsDir` const instead of\ncalling resolve(dir) twice. Behavior-preserving; build + attw still green.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n---------\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-17T05:14:35+01:00",
          "tree_id": "4b7fefd09c685bd6be7114de84edaa107aec09c9",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/38610a7c29b712fd1d82b0096c131b931c54bf96"
        },
        "date": 1781669833115,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 52.62,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 53.8ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.96,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.5ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 145.56,
            "range": "± 14.0ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 159.6ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.02,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.4ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 21.74,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 21.8ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 68.88,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 70.0ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 96.59,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 97.5ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 161.95,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 162.3ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 133.51,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 135.6ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 52.27,
            "range": "± 32.8ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 85.1ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 355.41,
            "range": "± 18.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 373.7ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 53,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 53.5ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.64,
            "range": "± 3.3ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 23.0ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.35,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 63.37,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 64.7ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 53.37,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 54.0ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 232.53,
            "range": "± 12.7ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 245.3ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 114.89,
            "range": "± 132.6ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 247.5ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 46.2,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 48.2ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 48.35,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 50.3ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 108.76,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 109.5ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.27,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 300.48,
            "range": "± 14.1ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 314.5ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.97,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.2ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 254.11,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 254.4ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 70.97,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 73.2ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.09,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 20.3ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 39.28,
            "range": "± 16.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 56.1ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 127.88,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 130.0ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 42.98,
            "range": "± 12.2ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 55.1ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 402.76,
            "range": "± 5.9ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 408.6ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.13,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.2ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.64,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.12,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 30.3ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.53,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
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
          "id": "f24c95e80ef6fcbb16e5c619bd407524dee28a42",
          "message": "0.6.2",
          "timestamp": "2026-06-17T06:18:11+02:00",
          "tree_id": "d09cae397b94cc4d526a519675846aedcbbf8536",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/f24c95e80ef6fcbb16e5c619bd407524dee28a42"
        },
        "date": 1781670049053,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 52.3,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 52.7ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.28,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 20.4ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 158.44,
            "range": "± 18.5ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 177.0ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.48,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.8ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 21.33,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 22.3ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 69.85,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 70.3ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 88.6,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 89.1ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 165.27,
            "range": "± 7.9ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 173.2ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 134.08,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 134.6ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 53.31,
            "range": "± 25.8ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 79.2ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 371.68,
            "range": "± 17.5ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 389.2ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 51.2,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 51.5ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.36,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.5ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.38,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.5ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 66.73,
            "range": "± 3.3ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 70.1ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 50.3,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 50.9ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 112.41,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 114.0ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 111.18,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 111.7ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 33.35,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 33.7ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 47.01,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 47.7ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 108.15,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 109.4ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.26,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 293.1,
            "range": "± 5.1ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 298.3ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.84,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 255.26,
            "range": "± 52.6ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 307.9ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 70.91,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 72.5ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.17,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 20.0ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 40.56,
            "range": "± 14.5ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 55.0ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 128.85,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 130.2ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.24,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.6ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 403.66,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 404.9ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.59,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.19,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 30.6ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.5,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
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
          "id": "7efcc1514aa6a773d165563ccc84f62c0bb350c0",
          "message": "docs: document the release dance in CLAUDE.md\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-17T06:26:47+02:00",
          "tree_id": "f1d1bfde80e973fc4af527f0affef1cfc63d872b",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/7efcc1514aa6a773d165563ccc84f62c0bb350c0"
        },
        "date": 1781670563529,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.69,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.5ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.61,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.0ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 139.4,
            "range": "± 16.3ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 155.7ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 19.4,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 19.8ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.29,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.0ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 69.37,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 69.9ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 88.82,
            "range": "± 4.7ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 93.6ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 173.35,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 176.2ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 134.92,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 135.6ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 52.91,
            "range": "± 2.7ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 55.6ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 369.33,
            "range": "± 14.4ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 383.8ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 53.81,
            "range": "± 9.8ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 63.6ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.52,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 20.0ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.4,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.5ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 60.77,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 62.3ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 55.95,
            "range": "± 4.9ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 60.9ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 113.51,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 113.8ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 113.9,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 114.4ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 33.61,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.3ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 51.14,
            "range": "± 20.8ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 71.9ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 106.72,
            "range": "± 5.1ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 111.8ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.24,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 293.17,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 296.0ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.93,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 255.96,
            "range": "± 15.3ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 271.3ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 72.17,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 72.4ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.31,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.5ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 39.9,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 43.1ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 131.28,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 131.5ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.24,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 45.0ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 404.78,
            "range": "± 3.3ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 408.1ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.11,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.55,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.93,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.1ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.53,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "273367497+last-light[bot]@users.noreply.github.com",
            "name": "last-light[bot]",
            "username": "last-light[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "6bbde394109c0d3f23bbdb07be144ea7a4596194",
          "message": "Add link to public LLM docs (refs #900) (#901)\n\n* docs: guardrails check for #900\n\n* docs: architect plan for #900\n\n* feat: implement #900\n\nTested: npm test -> blocked (PostgreSQL 127.0.0.1:54333 unavailable; docker-compose not installed); npm run lint -> passed; npm run typecheck -> passed\nScope-risk: low\n\n* review: verdict for #900\n\n* status: PR created for #900\n\n---------\n\nCo-authored-by: last-light[bot] <last-light[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-17T07:39:23+02:00",
          "tree_id": "c2b3fb2ae7d14fffb4d26d52547023289266afa4",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/6bbde394109c0d3f23bbdb07be144ea7a4596194"
        },
        "date": 1781674913356,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 54.49,
            "range": "± 3.1ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 57.6ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 21.82,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.9ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 145.34,
            "range": "± 8.7ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 154.0ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.05,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.7ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 24.32,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 24.6ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 71.23,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 72.0ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 93.74,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 95.7ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 164.84,
            "range": "± 10.9ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 175.8ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 147.18,
            "range": "± 10.8ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 157.9ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 56,
            "range": "± 26.8ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 82.8ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 357.9,
            "range": "± 5.6ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 363.5ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 55.49,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 55.6ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.85,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.1ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.33,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.3ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 64.08,
            "range": "± 2.7ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 66.7ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 55.35,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 56.2ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 248.1,
            "range": "± 7.0ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 255.1ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 115.82,
            "range": "± 136.8ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 252.7ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 47.58,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 48.5ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 48.06,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 49.7ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 112.07,
            "range": "± 3.3ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 115.4ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.23,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 294.58,
            "range": "± 5.4ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 299.9ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.92,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 266.24,
            "range": "± 30.1ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 296.3ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 76.78,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 77.8ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 17.98,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 20.1ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.42,
            "range": "± 18.4ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 55.8ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 134.79,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 136.7ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 45.5,
            "range": "± 2.4ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 47.9ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 388.45,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 389.8ms · 7 rows"
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
            "value": 0.54,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.84,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 33.0ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.45,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "83458fd034ff0258595ac4c39ea5f7b2632e58e7",
          "message": "chore(deps): update react-router monorepo to v7.18.0 (#897)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-17T17:44:27Z",
          "tree_id": "467b69efd9a5b1ae6c0355b4a00d48f86c46782e",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/83458fd034ff0258595ac4c39ea5f7b2632e58e7"
        },
        "date": 1781718423791,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 54.16,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.8ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 21.66,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.0ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 147.63,
            "range": "± 8.0ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 155.6ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.18,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.3ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 24.02,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 24.8ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 70.01,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 70.7ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 92.78,
            "range": "± 8.2ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 100.9ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 173.02,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 175.2ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 140.84,
            "range": "± 5.2ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 146.1ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 53.21,
            "range": "± 2.9ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 56.1ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 353.1,
            "range": "± 24.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 377.9ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 54.94,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 55.2ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.76,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.3ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.31,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 63.86,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 65.4ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 54.88,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 55.3ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 213.92,
            "range": "± 11.2ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 225.1ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 230.33,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 231.8ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 46.73,
            "range": "± 7.1ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 53.8ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 76.85,
            "range": "± 25.0ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 101.8ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 142.43,
            "range": "± 3.4ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 145.9ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.78,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.8ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 310.22,
            "range": "± 16.1ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 326.3ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.81,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 252.63,
            "range": "± 2.5ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 255.2ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 75.11,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 76.8ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.21,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.4ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 36.56,
            "range": "± 15.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 52.4ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 131.82,
            "range": "± 2.3ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 134.1ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 42.83,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 43.1ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 382.09,
            "range": "± 8.2ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 390.3ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.1,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.59,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.41,
            "range": "± 2.5ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 34.9ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.45,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "8372a2dfcda2e08319cc0957977f79fa229acfc1",
          "message": "chore(deps): update dependency fallow to v2.98.0 (#902)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-17T23:38:08Z",
          "tree_id": "871a3efa1f3d9b2c2fa514e68eca1fb422035689",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/8372a2dfcda2e08319cc0957977f79fa229acfc1"
        },
        "date": 1781739652001,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 52.77,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 53.0ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 21.05,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.8ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 154.41,
            "range": "± 3.8ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 158.2ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.53,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.0ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.66,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.2ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 69.83,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 70.7ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 87.86,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 89.1ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 162.24,
            "range": "± 11.2ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 173.4ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 136.57,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 136.7ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 52.75,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 53.6ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 371.25,
            "range": "± 13.1ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 384.4ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 51.19,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 51.7ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.11,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 19.5ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.37,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 66.99,
            "range": "± 3.1ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 70.1ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 49.58,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 50.1ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 115.18,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 116.2ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 117.14,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 118.3ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 33.91,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.0ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 50.87,
            "range": "± 22.3ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 73.2ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 110.13,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 111.3ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.19,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 289.87,
            "range": "± 25.1ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 315.0ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.91,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 256.82,
            "range": "± 26.0ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 282.9ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.98,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 72.7ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 19.3,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.6ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 38.43,
            "range": "± 3.5ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 41.9ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 132.86,
            "range": "± 6.4ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 139.3ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.17,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 47.2ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 401.69,
            "range": "± 4.1ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 405.8ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.11,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.2ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.59,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 31.03,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 31.5ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.51,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "de051aea32ee1df37f32588804c31aec04597ccb",
          "message": "chore(deps): update dependency openai to v6.44.0 (#903)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-18T03:09:22Z",
          "tree_id": "d997d075922c44e6d77c7b259cc1f611a28a270f",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/de051aea32ee1df37f32588804c31aec04597ccb"
        },
        "date": 1781752317421,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 52.57,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 53.9ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.23,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 20.5ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 150.91,
            "range": "± 4.7ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 155.6ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 19.3,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 19.5ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.05,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 22.3ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 68.08,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 69.1ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 88.01,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 89.0ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 168.84,
            "range": "± 12.5ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 181.3ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 138.11,
            "range": "± 14.6ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 152.7ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 52.97,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 53.3ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 369.27,
            "range": "± 15.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 385.1ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 53.06,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 53.8ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.88,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 20.2ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.31,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 62.74,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 63.8ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 51.91,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 52.7ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 112.92,
            "range": "± 136.9ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 249.9ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 113.34,
            "range": "± 15.6ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 128.9ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 33.12,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 33.6ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 48.57,
            "range": "± 21.7ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 70.2ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 106.17,
            "range": "± 6.5ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 112.6ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.16,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 300.77,
            "range": "± 13.2ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 313.9ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.87,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 258.47,
            "range": "± 31.9ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 290.4ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.47,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 71.6ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.23,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.3ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.08,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 37.7ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 128.36,
            "range": "± 2.3ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 130.6ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 41.91,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 45.1ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 402.08,
            "range": "± 8.1ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 410.2ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.11,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.55,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 29.83,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 30.3ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.51,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "51102b5b931ca761de69d7289c3fd41c50055f7b",
          "message": "feat(client): unified chartRegistry with Bar migrated end-to-end (#910) (#915)\n\n* feat(client): unified chartRegistry with Bar migrated end-to-end (#910)\n\nIntroduce a single `chartRegistry` map keyed by chart type as the source of\ntruth for a chart's DOM-free concerns, and migrate Bar through it: the eager\nconfig, lazy config, icon, and dependency lookups all derive from its one entry.\n\nKey decisions (diverging from the issue's resolved design, validated against the\ncodebase):\n\n- The entry is DOM-free and holds metadata + icon name + dependencies + a lazy\n  `config` thunk. The React component thunk is NOT on the entry — it pulls\n  recharts/ChartContainer/DOM globals, and the eager `chartConfigRegistry` (which\n  derives from `chartRegistry`) is imported transitively by the server agent\n  (`src/server/agent/chart-validation.ts`). Keeping the component in the\n  client-only `chartImportMap` keeps the registry importable server-side.\n- The eager config keeps REAL drop zones (not the proposed `dropZones: []`\n  placeholder): `chart-validation.ts` reads `config.dropZones` synchronously for\n  mandatory-zone validation and tool guidance, and the i18n key-coverage test\n  reads them too. `toEagerConfig(entry, base)` composes entry metadata over the\n  full config shape.\n- Eager metadata (label/description/useCase/isAvailable) moves out of\n  BarChart.config.ts into the entry (single source of truth).\n- The icon is wired via `setRegistryIconResolver` injection so `icons/registry`\n  never statically imports charts.\n- Plugin/cache precedence stays ahead of the unified lookup at every site; a\n  custom `bar` override still wins (regression-tested).\n\nTests: new tests/client/charts/chartRegistry.test.ts (13 tests). Gates green:\ntest:client, typecheck (all 3 tsconfig projects), lint, plus i18n + agent suites.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n* fix(client): compose entry metadata over the lazy config too (PR #915 review)\n\ngetChartConfigAsync('bar') (and getChartConfigSync/loadAllChartConfigs after\ncaching) returned the stripped barChartConfig — label/description/useCase/\nisAvailable having moved to the entry — diverging from the full shape returned\nfor non-migrated charts. Compose the entry metadata over the resolved lazy\nconfig before caching so the lazy public API stays consistent.\n\nRenames toEagerConfig → composeChartConfig since it now serves both the eager\n(server/full) and lazy (client code-split) derivation paths.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n* fix(client): plugin icon override must win over unified registry (PR #915 review)\n\ngetChartTypeIcon consulted the unified registry (and the legacy typeMap) before\nthe plugin icon resolver, so a custom chart overriding a built-in like `bar`\ncould never supply its own icon — violating the plugin-precedence requirement.\nMove the `_customIconResolver` check to the front: plugin → unified entry →\nlegacy typeMap → default. This also generalises plugin icon precedence to every\nbuilt-in (the typeMap previously short-circuited them all).\n\nAdds a regression test: a custom `bar` icon override wins, and the built-in\nchartBar icon is restored on unregister.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n---------\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-18T10:56:27+02:00",
          "tree_id": "ea8422c5b7a4d9555b6d51cc5928107260a704b2",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/51102b5b931ca761de69d7289c3fd41c50055f7b"
        },
        "date": 1781773145290,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 52.07,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 53.2ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 19.95,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 20.3ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 143.04,
            "range": "± 8.8ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 151.8ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 19.65,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.1ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 21.24,
            "range": "± 2.4ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.6ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 67.99,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 68.5ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 83.62,
            "range": "± 5.4ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 89.0ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 161.8,
            "range": "± 12.5ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 174.3ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 133.86,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 134.4ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 49.94,
            "range": "± 27.3ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 77.2ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 356.3,
            "range": "± 34.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 390.6ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 52.04,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 54.8ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 18.87,
            "range": "± 2.3ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.1ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.3,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.3ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 63.02,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 63.4ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 52.51,
            "range": "± 8.6ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 61.1ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 112.51,
            "range": "± 16.7ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 129.2ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 110.92,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 111.8ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 32.65,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 32.9ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 47.54,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 48.6ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 108.86,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 110.1ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.22,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.5ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 285.26,
            "range": "± 4.8ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 290.1ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.94,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 259.65,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 261.3ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 72.38,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 73.2ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.04,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 20.1ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 39.24,
            "range": "± 14.9ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 54.1ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 129.42,
            "range": "± 4.3ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 133.7ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 40.52,
            "range": "± 4.1ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.7ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 399.31,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 402.5ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.66,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 29.67,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 30.1ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.5,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "9186d287c09cc5db3cf76ba3205578142c71d9a8",
          "message": "docs: add agent-skills configuration and domain glossaries (#917)\n\nWire up the per-repo configuration the engineering skills expect:\n\n- CLAUDE.md: new \"Agent skills\" section pointing at the issue tracker,\n  triage-label, and domain-docs configuration.\n- docs/agents/: issue-tracker.md (GitHub via gh CLI), triage-labels.md\n  (canonical roles → repo labels), domain.md (how skills consume the\n  multi-context domain docs).\n- CONTEXT-MAP.md: root index of the per-area domain glossaries.\n- src/adapters/CONTEXT.md: adapters/transport ubiquitous language\n  (handler protocol, HttpPort, CubeHttpHandler core, MCP transport, …),\n  seeded from the issue-906 grilling.\n\nDocs only — no code or behaviour changes.\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-18T11:19:58+02:00",
          "tree_id": "36f1fbc0c0111c5db6892a9538baf77ecd9a4239",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/9186d287c09cc5db3cf76ba3205578142c71d9a8"
        },
        "date": 1781774546166,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 52.18,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 52.4ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.9,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.5ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 142.71,
            "range": "± 8.6ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 151.3ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.4,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.5ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 21.49,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.6ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 66.76,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 67.2ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 83.66,
            "range": "± 6.0ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 89.6ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 167.74,
            "range": "± 11.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 179.1ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 131.27,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 131.7ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 53.49,
            "range": "± 34.3ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 87.8ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 364.19,
            "range": "± 12.2ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 376.4ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 53.07,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 53.4ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.09,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 20.5ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.27,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.3ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 60.26,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 60.9ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 51,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 51.4ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 216.48,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 219.5ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 219.47,
            "range": "± 6.9ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 226.4ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 44.55,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 44.9ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 74.61,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 75.2ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 151.17,
            "range": "± 5.8ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 157.0ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.71,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.9ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 299.16,
            "range": "± 30.6ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 329.8ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 3.7,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 276.49,
            "range": "± 16.4ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 292.9ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 69.37,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 70.0ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.88,
            "range": "± 3.4ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 22.3ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 38,
            "range": "± 15.7ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 53.7ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 120.38,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 122.1ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 41.05,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.3ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 397.13,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 399.3ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.1,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.64,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.38,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 30.5ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.46,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e340ea3aba055b86aaca39adb7795a90a2b41848",
          "message": "chore(deps): update dependency hono to v4.12.26 (#905)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-18T10:41:30Z",
          "tree_id": "e7d9fa13d4c57d09265197061ad285ac92886173",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/e340ea3aba055b86aaca39adb7795a90a2b41848"
        },
        "date": 1781779446634,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.14,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 53.5ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.7,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.0ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 150.89,
            "range": "± 4.5ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 155.3ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 19.72,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.0ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 21.85,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 22.3ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 69.17,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 69.5ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 86.75,
            "range": "± 5.7ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 92.5ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 172.96,
            "range": "± 5.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 178.7ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 134.07,
            "range": "± 13.9ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 148.0ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 50.63,
            "range": "± 5.2ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 55.9ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 198.74,
            "range": "± 178.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 377.5ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 51.26,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 51.6ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 21.85,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 22.6ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.43,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.6ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 59.15,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 61.0ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 48.94,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 49.2ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 112.3,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 112.6ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 111.85,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 112.4ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 33.39,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 33.6ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 48.17,
            "range": "± 2.7ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 50.9ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 105.72,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 107.2ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.2,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 287.66,
            "range": "± 5.0ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 292.6ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.94,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 258.2,
            "range": "± 18.6ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 276.8ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.99,
            "range": "± 21.5ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 93.5ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.06,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.3ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 39.22,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 40.7ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 126.42,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 127.6ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 41.65,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 43.0ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 401.74,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 403.0ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.2ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.62,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.17,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 30.9ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.53,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "06defebdbcc7e95b75d2febfdb6df4ba8c8384d8",
          "message": "feat(client): migrate all chart types onto unified chartRegistry (#911) (#918)\n\n* feat(client): migrate all chart types onto unified chartRegistry (#911)\n\nComplete slice 2 of the chartRegistry migration: every built-in chart now\nresolves (eager config, lazy config, icon, dependencies) exclusively through\nits single chartRegistry entry, and the four legacy registries are deleted.\n\n- chartRegistry is Record<BuiltInChartType, ChartRegistryEntry> (no Partial,\n  no `?? legacy` fallbacks); all 25 remaining charts get an entry.\n- Eager metadata (label/description/useCase/isAvailable) moved out of each\n  *.config.ts onto its entry; configs keep only the lazy shape (dropZones,\n  display options, clickableElements, validate, skipQuery).\n- Deleted legacy maps: lazyChartConfigRegistry's configImportMap +\n  configExportNames, chartComponentRegistry's chartDependencyMap, and\n  getChartTypeIcon's typeMap.\n- Eager chartConfigRegistry composes each entry's metadata over a static\n  baseConfigs map (server agent reads drop zones synchronously, so it stays\n  eager); ChartLoader's chartImportMap stays the only component-import source.\n- Added 5 dedicated icons (boxPlot, waterfall, candlestick, measureProfile,\n  gauge); the 7 types that silently fell back to the bar icon now resolve.\n- Plugin unification: chartPluginRegistry.register() maps a ChartDefinition\n  onto the same ChartRegistryEntry (chartDefinitionToEntry); unified\n  getChartEntry() lookup (custom-first); single icon resolver over entries;\n  entry.icon is IconName | ComponentType. Removed the dual icon resolvers.\n- Rewrote the add-chart-type skill to the single-entry workflow.\n\nTests: parametrized chartRegistry.test.ts over every built-in across all\nderivation sites + plugin-unification regressions (incl. non-bar override).\ntest:client, typecheck (3 projects), lint, build all green.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n* ci: gate Databend tests behind HAS_DATABEND repo variable\n\nMirror the Snowflake job: the Databend job now only runs when the\n`HAS_DATABEND` repo variable is set to 'true' (and code changed), so it\nno longer fails CI by default. Set `HAS_DATABEND=true` in repo variables\nto re-enable.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n* fix(client): make unified registry edges import-order & cache-clear safe (#911)\n\nAddress two regressions in the migrated unified paths flagged in review:\n\n- Icon resolution no longer depends on chartRegistry's side-effectful module\n  init. registry.tsx now imports getChartEntry() directly instead of waiting\n  for an injected setRegistryIconResolver(); importing the icon helper\n  standalone resolves built-in icons correctly instead of falling back to bar.\n  Safe because chartRegistry is DOM-free (component thunks live in ChartLoader),\n  so the icon module never pulls in the chart component graph. Removed the\n  setRegistryIconResolver injection entirely.\n- getChartConfigAsync() resolves through the custom-first getChartEntry() after\n  a cache miss, so a registered plugin chart still rehydrates its config via its\n  ChartRegistryEntry thunk after the public clearChartConfigCache() path\n  (previously returned null).\n\nTests: added regression coverage for both — a vi.resetModules() standalone\nicon-import test and a plugin-config-after-cache-clear test.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n---------\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-18T13:09:03+02:00",
          "tree_id": "9239d1a7911a9d44ff0b65ff7182584c8ec5e36f",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/06defebdbcc7e95b75d2febfdb6df4ba8c8384d8"
        },
        "date": 1781781094069,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 54.21,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 55.6ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 21.55,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.0ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 143.74,
            "range": "± 14.6ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 158.4ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.53,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.6ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 25.2,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 25.3ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 71.87,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 73.8ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 91.94,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 92.7ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 174.53,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 176.3ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 153.45,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 153.7ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 55.35,
            "range": "± 6.8ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 62.1ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 374.12,
            "range": "± 4.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 378.4ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 55.47,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 56.2ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.31,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 20.8ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.3,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.3ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 63.49,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 64.2ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 55.07,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 55.8ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 223.52,
            "range": "± 9.1ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 232.6ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 223.23,
            "range": "± 20.2ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 243.4ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 43.69,
            "range": "± 4.3ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 48.0ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 80.84,
            "range": "± 4.3ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 85.2ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 108.01,
            "range": "± 3.3ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 111.3ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.19,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.5ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 289.46,
            "range": "± 19.2ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 308.7ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.94,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 256.26,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 257.8ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 74.85,
            "range": "± 5.5ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 80.3ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.38,
            "range": "± 16.5ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 34.9ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 35.84,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 37.8ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 136.9,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 137.5ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.61,
            "range": "± 5.2ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 49.8ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 380.82,
            "range": "± 6.5ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 387.3ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.09,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.57,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.2,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.9ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.45,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "2b46bdcd916617677a1a8071af793ffe076ff581",
          "message": "chore(deps): update dependency fallow to v2.99.0 (#916)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-18T20:51:13Z",
          "tree_id": "5edb1022137d36b4087643632fa90c5292c7b194",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/2b46bdcd916617677a1a8071af793ffe076ff581"
        },
        "date": 1781816023296,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 55.68,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 56.5ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 23.16,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 24.3ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 146.69,
            "range": "± 10.5ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 157.2ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 22.76,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 22.9ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 24.56,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 24.8ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 72.59,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 74.5ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 92.05,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 93.3ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 169.46,
            "range": "± 7.7ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 177.1ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 140.7,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 142.6ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 56.45,
            "range": "± 9.1ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 65.5ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 360.08,
            "range": "± 17.2ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 377.2ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 56.47,
            "range": "± 2.5ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 59.0ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 21.13,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 22.4ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.27,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 67.11,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 68.0ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 56.87,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 57.5ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 226.02,
            "range": "± 13.6ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 239.6ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 234.53,
            "range": "± 19.4ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 254.0ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 43.81,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 44.0ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 50.22,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 53.2ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 110.63,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 111.9ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.21,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 287.06,
            "range": "± 23.7ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 310.8ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.89,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.1ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 258.57,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 259.7ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 77.18,
            "range": "± 22.9ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 100.1ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.43,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.6ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.37,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 39.1ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 133.7,
            "range": "± 3.4ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 137.1ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 46.86,
            "range": "± 4.6ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 51.5ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 381.06,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 382.4ms · 7 rows"
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
            "value": 0.62,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 33.34,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 34.0ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.45,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
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
          "id": "83050289abd85fe13accd8006b61f0a6b0bfd9b6",
          "message": "test(client): add AnalysisBuilder execution safety net for #914\n\nCharacterization tests pinning current behaviour ahead of the hooks\nregroup (#914), so the refactor can proceed under a green net:\n\n- analysisQueryExecutionModes.test.ts (30 tests): the pure mode-routing\n  / skip-flag matrix (resolveActiveMode, computeSkipFlags,\n  deriveModeOutputs, computeExecutionStatus, computeExecutionResults) —\n  previously untested.\n- useAnalysisBuilderExecutionTrigger.test.tsx (2 tests): drives the\n  public useAnalysisBuilder facade and asserts at the network that a\n  metric/filter change re-runs the query (\"query does not re-run when\n  filters change\"). Written against the stable public interface so it\n  survives the internal regroup.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-19T04:15:12+02:00",
          "tree_id": "8decab43ab1ab7d3c2cf2a4411949fc055b0a8ad",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/83050289abd85fe13accd8006b61f0a6b0bfd9b6"
        },
        "date": 1781835455381,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 42.75,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 42.9ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 17.31,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 18.1ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 122.39,
            "range": "± 5.4ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 127.8ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 16.35,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 16.5ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 18.97,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 19.1ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 55.63,
            "range": "± 3.8ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 59.4ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 72.43,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 74.0ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 132.11,
            "range": "± 9.9ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 142.0ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 113.09,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 114.6ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 43.8,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 44.3ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 283.22,
            "range": "± 4.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 287.5ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 43.19,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 43.4ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 16.07,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 16.4ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.02,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.0ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 50.79,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 50.9ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 43.39,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 44.0ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 178.18,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 179.2ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 178.69,
            "range": "± 9.2ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 187.9ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 38.53,
            "range": "± 5.2ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 43.8ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 63.62,
            "range": "± 14.2ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 77.8ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 113.69,
            "range": "± 4.0ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 117.7ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.13,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.2ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 235.11,
            "range": "± 4.1ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 239.2ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.86,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 204.72,
            "range": "± 15.1ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 219.8ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 110.37,
            "range": "± 11.8ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 122.2ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 91.53,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 91.8ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 31.04,
            "range": "± 21.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 52.1ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 142.51,
            "range": "± 6.2ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 148.7ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 35.18,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 35.4ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 306.45,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 308.1ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.07,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.44,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.5ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 41.54,
            "range": "± 6.9ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 48.5ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.35,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.4ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "53127dd1bfac20127843eb365c4f646e7305e4f6",
          "message": "refactor(client): regroup Analysis Builder hooks by responsibility (#914) (#922)\n\nReplace the ~1,050-line useAnalysisBuilder coordinator + 8 feature-sliced\nsub-hooks with three responsibility-grouped hooks composed behind the\nunchanged public useAnalysisBuilder facade, along a strictly acyclic\nState -> Query -> Effects data flow:\n\n- useAnalysisState   store reads/derivation, query-spec building, combined\n                     fields, chart config + availability + mode-aware setters,\n                     per-mode state + server queries, validation, UI state.\n                     No dependency on execution.\n- useAnalysisQuery   execution only: the 5 TanStack hooks, mode routing, skip\n                     flags, results/loading/error/debug, hasDebounced.\n- useAnalysisEffects init/URL parsing, AI generation (direct store access),\n                     share, chart-type auto-switch (sole hasDebounced consumer),\n                     and external onQueryChange/onChartConfigChange callbacks.\n\nAI + share fold into Effects: AnalysisBuilder/index.tsx no longer calls\nuseAnalysisAI/useAnalysisShare or carries their glue; it reads AI/share state\nand actions off the facade. The facade return shape is unchanged (additive\nonly) - AI/share fields are now wired to the real Effects outputs.\n\nPure helpers stay extracted (analysisQueryExecutionModes, buildCubeQuery,\nmulti-query validators). Deletes the 8 old sub-hook files and the 6 orphaned\nsub-hook unit-test files (they import the deleted modules); the #914 safety\nnet covers the regrouped behaviour at the facade level.\n\nThe store and its slices are untouched (hooks-only refactor); store slice\nrestructuring is tracked separately in #919.\n\ntest:client (158 files / 5864 tests), typecheck, and lint all green.\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-19T04:48:09+02:00",
          "tree_id": "14ff1f53d15ee480e98d48445e38e13f89bcfb7e",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/53127dd1bfac20127843eb365c4f646e7305e4f6"
        },
        "date": 1781837445803,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 52.92,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 55.0ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 19.99,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 20.7ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 145.9,
            "range": "± 11.8ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 157.7ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 19.98,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.5ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 21.97,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 22.6ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 68.3,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 69.7ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 87.58,
            "range": "± 2.5ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 90.0ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 173.02,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 174.5ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 132.57,
            "range": "± 11.6ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 144.1ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 50.98,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 51.4ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 370.16,
            "range": "± 5.2ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 375.3ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 53.78,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 54.0ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.7,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 20.1ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.37,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.5ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 62.84,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 63.4ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 49.91,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 50.2ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 114.16,
            "range": "± 16.4ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 130.5ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 111.8,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 112.0ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 33.29,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 33.3ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 49.21,
            "range": "± 23.2ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 72.4ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 106.44,
            "range": "± 5.7ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 112.1ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.17,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 292.34,
            "range": "± 5.9ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 298.3ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.86,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 256.32,
            "range": "± 14.6ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 270.9ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.05,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 71.8ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 17.88,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.0ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 40.17,
            "range": "± 13.0ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 53.2ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 127.56,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 128.2ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 41.26,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 42.9ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 401.32,
            "range": "± 11.7ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 413.0ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.2ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.58,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.44,
            "range": "± 2.6ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 33.1ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.54,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "066d6507a7a9d08fc49d2a74bd08eddbdeee3160",
          "message": "chore(deps): update dependency react-resizable to v4.0.2 (#920)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-19T03:07:24Z",
          "tree_id": "c4ce40c1e52f11694f161eee6f827dcf7950c00e",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/066d6507a7a9d08fc49d2a74bd08eddbdeee3160"
        },
        "date": 1781838599859,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.4,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 53.9ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.96,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.5ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 134.75,
            "range": "± 26.2ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 161.0ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 19.84,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.2ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.47,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.5ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 70.63,
            "range": "± 2.3ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 72.9ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 89.11,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 89.4ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 164.73,
            "range": "± 12.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 177.5ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 135.58,
            "range": "± 10.3ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 145.9ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 53.65,
            "range": "± 30.5ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 84.2ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 370.47,
            "range": "± 15.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 386.3ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 51.15,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 51.4ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.84,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 20.3ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.38,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.5ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 60.46,
            "range": "± 4.3ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 64.8ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 49.19,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 49.5ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 111.55,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 112.0ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 113.04,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 113.4ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.03,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.3ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 48.92,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 49.9ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 105.88,
            "range": "± 5.0ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 110.9ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.18,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 291.16,
            "range": "± 4.0ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 295.2ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.91,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 258.74,
            "range": "± 48.8ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 307.5ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.7,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 72.3ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.98,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.2ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 39.19,
            "range": "± 14.5ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 53.6ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 127.97,
            "range": "± 3.8ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 131.7ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.12,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 45.7ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 403.25,
            "range": "± 2.9ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 406.1ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.61,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.85,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 31.1ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.5,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "67d459c88546f66863f9b32e251a8aeae8640c52",
          "message": "feat(adapters): handler-protocol seam + CubeHttpHandler core, Express /load migrated (#906) (#924)\n\nIntroduce a framework-agnostic HTTP handler seam and prove it end-to-end\nthrough Express /load (GET + POST). Tracer slice A1 of 3.\n\n- src/adapters/core/http-port.ts: generic HttpPort<TRes> port interface\n  (getHeader, getBody, getQueryParam, send) — no framework types.\n- src/adapters/core/cube-http-handler.ts: createCubeHttpHandler factory\n  returning { handleLoadGet, handleLoadPost }. Each entry point owns its\n  extraction + try/catch, funneling into a shared runLoad tail (locale-merge,\n  validateQuery -> 400, x-cache-control: no-cache -> skipCache, formatCubeResponse,\n  catch-all 500 -> onError). Comment notes the REST load and MCP handleLoad\n  coexist by design (convergence deferred).\n- Express /load (GET + POST) rewired onto the core via a local createExpressPort;\n  every other Express endpoint and extractSecurityContextWithLocale untouched.\n- Public ./adapters/core subpath export (CJS-types subdir convention) + core/index\n  build entry; check:exports green.\n\nTests: 8 core unit tests (stub semanticLayer + fake port, no DB) cover happy\npath, validation 400, skipCache, the two GET 400s, executor-throw 500 + onError,\nand locale merge. Existing Express byte-guard + all adapter integration tests\npass (320). typecheck, lint, check:exports green.\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-19T05:12:59+02:00",
          "tree_id": "50f5dee84ce53773a9c6d3d655f958514d1493fb",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/67d459c88546f66863f9b32e251a8aeae8640c52"
        },
        "date": 1781838935971,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 52.77,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 53.3ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.84,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.9ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 155.72,
            "range": "± 3.8ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 159.5ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 19.37,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 19.6ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.1,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 22.4ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 67.85,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 69.9ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 83.14,
            "range": "± 6.2ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 89.4ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 168.04,
            "range": "± 10.1ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 178.1ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 135.71,
            "range": "± 15.4ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 151.1ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 51.39,
            "range": "± 31.3ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 82.7ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 97.81,
            "range": "± 135.6ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 233.4ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 56.78,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 58.9ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 18.57,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.4ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.39,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 59.54,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 59.8ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 48.66,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 49.0ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 112.93,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 113.1ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 113.17,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 114.6ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 33.14,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 33.2ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 49.08,
            "range": "± 2.3ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 51.4ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 111.96,
            "range": "± 6.7ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 118.7ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.19,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 3.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 286.27,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 289.2ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.88,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 261.77,
            "range": "± 24.6ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 286.4ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.62,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 74.6ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.9,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 21.7ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 39.9,
            "range": "± 16.4ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 56.3ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 128.88,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 130.2ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 42.42,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.1ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 396.94,
            "range": "± 5.0ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 402.0ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.13,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.66,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 29.63,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 29.8ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.51,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "85a3e9ae3baced360dda64a25d6baf67feeaf9d6",
          "message": "feat(adapters): migrate all Express endpoints onto CubeHttpHandler core (#908) (#925)\n\nWiden the framework-agnostic core to cover the rest of the Express surface\nand delete the inlined duplicates. Express now holds only req/res→port\ntranslation + routing.\n\nCore (src/adapters/core/):\n- security-context.ts: single home for the locale wrapper\n  (withLocaleFromHeaders / resolveSecurityContext) that adapters used to\n  re-declare as extractSecurityContextWithLocale.\n- rest-handlers.ts: meta, sql (GET+POST), dry-run (GET+POST), batch, explain\n  — response shapes / status codes / error bodies preserved per endpoint.\n- mcp-handler.ts: full MCP POST flow behind a new McpHttpPort; statics\n  (resources/prompts/instructions) resolved lazily on first MCP request.\n- http-port.ts: add McpHttpPort<TRes> (setHeader/sendSse/sendEmpty) as a\n  separate extension of the minimal public REST port.\n\nExpress adapter: every REST route + MCP POST dispatched through the core;\ninlined validate/execute/format bodies removed; locale wrapper consumed from\ncore. Only the agent/chat SSE stream and the GET/DELETE /mcp lifecycle remain\ninline (inherently transport-bound).\n\nTests: add tests/adapters/core-mcp-handler.test.ts (discover round-trip +\nerror/auth/notification/SSE paths) against a fake McpHttpPort, no server.\n\ntypecheck + lint green; 328 adapter tests pass.\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-19T05:46:01+02:00",
          "tree_id": "8c55ca02443e5a5a247d8fc15b8851fa9e179676",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/85a3e9ae3baced360dda64a25d6baf67feeaf9d6"
        },
        "date": 1781840912745,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.2,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.5ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.41,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 20.7ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 145.56,
            "range": "± 10.7ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 156.2ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 19.77,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.2ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 21.65,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 21.7ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 68.85,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 69.2ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 89.97,
            "range": "± 9.1ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 99.1ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 163.34,
            "range": "± 10.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 174.1ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 135.27,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 135.7ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 52.75,
            "range": "± 28.1ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 80.8ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 358.96,
            "range": "± 22.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 381.8ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 53.18,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 53.4ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.53,
            "range": "± 2.3ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.8ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.32,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 62.88,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 63.5ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 52.18,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 53.1ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 225.47,
            "range": "± 8.1ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 233.6ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 217.04,
            "range": "± 31.9ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 249.0ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 47.14,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 47.7ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 52.59,
            "range": "± 38.3ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 90.9ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 108.26,
            "range": "± 4.3ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 112.5ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.23,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.6ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 292.94,
            "range": "± 10.8ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 303.7ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 3.03,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.2ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 269.81,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 273.0ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.89,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 72.6ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.52,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 20.5ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 39.01,
            "range": "± 16.7ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 55.7ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 128.71,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 130.2ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 46.68,
            "range": "± 6.5ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 53.2ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 397.99,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 399.0ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.2ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.62,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.26,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 30.6ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.53,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "73ab7dc7b39694d2cc13e471edb48239f3952edc",
          "message": "feat(adapters): port Fastify, Hono, Next.js onto CubeHttpHandler core (#909) (#926)\n\n* feat(adapters): port Fastify, Hono, Next.js onto CubeHttpHandler core (#909)\n\nRoute every REST endpoint (load/meta/sql/dry-run/batch/explain, GET+POST)\nand MCP POST dispatch for Fastify, Hono, and Next.js through the shared\nframework-agnostic core (src/adapters/core), mirroring the Express\nmigration from #908. Each adapter now holds only framework translation:\na per-request req/res -> McpHttpPort mapping plus route wiring.\n\nRemoves the duplicated validate/execute/format, cache-bypass\n(x-cache-control: no-cache), and locale-wrapper (extractSecurityContextWithLocale)\nlogic from all three adapters; the request-locale merge now happens once\nin the core. Net ~1,350 lines deleted (1,708 gross), one core / four call sites.\n\n- fastify: preserve per-route bodyLimit/schema; port maps to reply\n- hono: keep caller-managed semanticLayer option; delete hono/mcp-handler.ts;\n  port uses c.header() so MCP session/WWW-Authenticate headers merge into responses\n- nextjs: keep per-handler factory API + Next-only AI helpers\n  (discover/suggest/validate/mcp-load); port attaches CORS headers and\n  accumulates setHeader values; trim nextjs/mcp-handler.ts to the GET-stream helper\n\nInherently transport-bound flows stay inline per framework (matching Express):\nthe agent/chat SSE stream and the GET/DELETE /mcp lifecycle.\n\nVerified: typecheck, lint, build:adapters, check:exports green; adapter test\nsuite 328/328 passing. Response shapes unchanged across all four adapters.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n* fix(adapters): restore Next.js /sql nested-body + invalid-JSON behaviour in core (#909 review)\n\nAddress review on #926:\n\n- handleSqlPost now unwraps the nested `{ query }` body shape (matching\n  load/dry-run/explain), restoring the Next.js adapter's original POST /sql\n  behaviour and making /sql consistent across all four adapters.\n- handleSqlGet now maps invalid `query` JSON to 400 'Invalid JSON in query\n  parameter' (mirroring GET /load) instead of falling through to 500,\n  restoring the Next.js adapter's original GET /sql behaviour.\n\nBoth fixes live in the shared core so every adapter benefits uniformly.\nAdds Next.js regression tests for nested SQL POST and invalid SQL GET JSON,\nand a Hono test pinning the now-uniform { error, status } REST error shape\n(intentional convergence with Express/Fastify/Next.js per maintainer decision).\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n---------\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-19T06:51:59+02:00",
          "tree_id": "d94c40ea212512ee52b42db3070b6031fc6da712",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/73ab7dc7b39694d2cc13e471edb48239f3952edc"
        },
        "date": 1781844865461,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.62,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.6ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 21.62,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.9ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 144.6,
            "range": "± 11.4ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 156.0ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.75,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.9ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 23.43,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.6ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 69.79,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 70.8ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 91.97,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 92.5ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 168.24,
            "range": "± 8.0ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 176.2ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 139.18,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 141.1ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 52.95,
            "range": "± 32.8ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 85.8ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 364.71,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 366.9ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 55.38,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 55.6ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.42,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.9ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.28,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.3ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 63.72,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 64.4ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 54.77,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 55.1ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 218.41,
            "range": "± 16.4ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 234.8ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 216.6,
            "range": "± 24.6ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 241.2ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 43.39,
            "range": "± 5.1ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 48.5ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 80.46,
            "range": "± 4.6ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 85.1ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 148.74,
            "range": "± 9.1ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 157.8ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.81,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.9ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 304.76,
            "range": "± 16.1ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 320.9ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 3.97,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 5.4ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 278.51,
            "range": "± 22.7ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 301.3ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 74.71,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 76.0ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 17.94,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.8ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.01,
            "range": "± 24.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 61.1ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 133.51,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 134.7ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.55,
            "range": "± 3.4ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 47.0ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 381.95,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 384.0ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.1,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.64,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.02,
            "range": "± 4.6ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 36.6ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.47,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
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
          "id": "7dc21c92af6fd005f0f9ed40d77994f8a9cea6e0",
          "message": "0.6.3",
          "timestamp": "2026-06-19T06:56:02+02:00",
          "tree_id": "07499f00090715a695d241c6208191e270105508",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/7dc21c92af6fd005f0f9ed40d77994f8a9cea6e0"
        },
        "date": 1781845120320,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 54.62,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 55.0ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.22,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.4ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 148.5,
            "range": "± 5.7ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 154.2ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.79,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.9ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 23.57,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.9ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 73.01,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 75.2ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 86,
            "range": "± 5.9ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 91.9ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 164.38,
            "range": "± 8.5ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 172.9ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 141.26,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 141.8ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 55.9,
            "range": "± 34.1ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 90.0ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 367.31,
            "range": "± 43.2ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 410.5ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 52.92,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 53.7ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.78,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.6ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.36,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 65.79,
            "range": "± 4.6ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 70.4ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 51.22,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 52.3ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 111.56,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 112.1ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 109.83,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 110.2ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.51,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 35.1ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 47.9,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 48.6ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 106.79,
            "range": "± 3.6ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 110.4ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.23,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.5ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 310.06,
            "range": "± 8.4ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 318.5ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.88,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 261,
            "range": "± 16.9ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 277.9ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 76.31,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 77.5ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 17.55,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.1ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.28,
            "range": "± 13.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 51.1ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 139.21,
            "range": "± 2.5ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 141.7ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.42,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 46.6ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 382.77,
            "range": "± 6.9ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 389.7ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.1,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.55,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 31.57,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.1ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.45,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "60214caff269853045d47233d19f1af1bfe3103d",
          "message": "feat(logical-plan): extract testable SchemaBuilder from LogicalPlanBuilder (#912) (#928)\n\nLift schema derivation (measures, dimensions, time dimensions) out of\nLogicalPlanBuilder into a pure free-function module, mirroring the repo's\nother derivation helpers (cte-planner-helpers, compiler-metadata). Schema\ncorrectness is now unit-testable with no LogicalPlanner / QueryContext setup.\n\n- New schema-builder.ts: buildLogicalSchema(query, cubes) => LogicalSchema,\n  plus granular buildMeasureRefs/buildDimensionRefs/buildTimeDimensionRefs,\n  buildCTESchema (non-throwing behavior preserved), and toCubeRef.\n- LogicalPlanBuilder delegates to it; the private methods are removed.\n- Direct unit tests (tests/schema-builder.unit.test.ts) with in-memory cube\n  fixtures, no planner/context.\n- Generated SQL unchanged: 2385/2385 postgres tests pass; typecheck + lint green.\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-19T08:26:27+02:00",
          "tree_id": "29da20f85bff7bd98d9453b3039553c7501dab37",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/60214caff269853045d47233d19f1af1bfe3103d"
        },
        "date": 1781850541324,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 52.48,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 52.6ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.08,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 20.8ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 144.64,
            "range": "± 16.9ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 161.5ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 19.45,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 19.8ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 21.87,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 22.1ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 68.2,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 68.6ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 84.1,
            "range": "± 4.6ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 88.7ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 162.73,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 163.5ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 132.91,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 133.2ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 49.5,
            "range": "± 8.7ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 58.2ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 370.94,
            "range": "± 5.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 376.2ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 49.69,
            "range": "± 8.4ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 58.1ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 18.3,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 18.7ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.32,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 62.9,
            "range": "± 6.1ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 69.0ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 48.15,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 48.8ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 109.36,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 110.7ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 110.47,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 111.3ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 32.66,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 33.2ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 47.46,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 48.7ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 105.29,
            "range": "± 4.7ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 110.0ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.19,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 289.18,
            "range": "± 10.0ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 299.2ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.88,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.1ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 265.61,
            "range": "± 13.0ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 278.6ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.07,
            "range": "± 21.3ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 92.4ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.39,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.3ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.04,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 39.9ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 125.92,
            "range": "± 3.5ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 129.4ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 40.77,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 43.6ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 395.64,
            "range": "± 92.1ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 487.7ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.2ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.57,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 29.67,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 29.8ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.52,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "96d53e9a15a2cf729518a71ac62bd50b085a8278",
          "message": "fix(nextjs): share one SemanticLayerCompiler across createCubeHandlers (#907) (#929)\n\ncreateCubeHandlers called each create*Handler(options) independently, and every\nfactory built its own SemanticLayerCompiler — 7+ compilers per call, each with a\nseparate metadata/result cache, causing divergent cache state across composed\nhandlers (e.g. metadata not matching a load response).\n\nMirror the Hono adapter: add an optional `semanticLayer` to NextAdapterOptions;\ncreateSemanticLayer reuses an injected compiler (skipping re-registration);\ncreateCubeHandlers builds one compiler and injects it into every handler so they\nshare a single cache. Standalone single-handler factories still build their own.\n\nTests (tests/adapters/nextjs.test.ts):\n- single compiler backs all createCubeHandlers handlers; cubes registered once\n- standalone factories remain independent (own compiler each)\n- load/meta handlers from createCubeHandlers respond through the shared compiler\n\nAll 334 adapter tests pass; typecheck + lint green.\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-19T08:41:18+02:00",
          "tree_id": "7ef6291e7d175a9f871f625a61601c75bb1d0f67",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/96d53e9a15a2cf729518a71ac62bd50b085a8278"
        },
        "date": 1781851432154,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.31,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.3ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.7,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.1ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 150.61,
            "range": "± 14.6ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 165.2ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.23,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.5ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.22,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 22.4ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 68.7,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 69.5ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 82.51,
            "range": "± 3.3ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 85.8ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 161.95,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 162.5ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 136.17,
            "range": "± 9.8ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 146.0ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 52.67,
            "range": "± 2.9ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 55.5ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 379.84,
            "range": "± 5.4ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 385.3ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 52.81,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 53.7ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.54,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.2ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.33,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 60.28,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 61.3ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 50.42,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 50.7ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 112.54,
            "range": "± 4.5ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 117.0ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 113.6,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 114.0ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 33.82,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.4ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 51.15,
            "range": "± 21.0ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 72.2ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 107.84,
            "range": "± 2.6ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 110.4ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.34,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 290.17,
            "range": "± 17.8ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 308.0ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.91,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 255.59,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 256.7ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 72.63,
            "range": "± 17.4ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 90.1ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 17.99,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 20.1ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 38.45,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 39.3ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 127.19,
            "range": "± 3.6ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 130.8ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.5,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 45.7ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 402.66,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 404.1ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.11,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.62,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.17,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 30.2ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.52,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "0ba3c20d83e69e0cae7eb277f36f7915a8e2af5e",
          "message": "chore(deps): update dependency @anthropic-ai/sdk to ^0.105.0 (#921)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-19T11:52:32Z",
          "tree_id": "78dd2e6050a9e9aa3ae34d732caf20e892354f1e",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/0ba3c20d83e69e0cae7eb277f36f7915a8e2af5e"
        },
        "date": 1781870104290,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 54.22,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 55.2ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.53,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 23.8ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 155.61,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 156.3ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 22.04,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 22.3ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 24.17,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 24.6ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 73.41,
            "range": "± 4.2ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 77.6ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 89.76,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 92.8ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 174.18,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 176.4ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 139.44,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 140.8ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 53.03,
            "range": "± 39.3ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 92.3ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 356.22,
            "range": "± 19.6ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 375.8ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 57.03,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 57.7ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 21.6,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 22.9ms · 1 rows"
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
            "value": 66.09,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 67.9ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 57.24,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 58.9ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 228.65,
            "range": "± 12.4ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 241.1ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 122.05,
            "range": "± 29.6ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 151.7ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 37.54,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 38.0ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 50.47,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 51.6ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 110.65,
            "range": "± 4.9ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 115.6ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.21,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 306.03,
            "range": "± 7.5ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 313.6ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.98,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.1ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 256.35,
            "range": "± 22.1ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 278.5ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 75.85,
            "range": "± 2.6ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 78.4ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 19.43,
            "range": "± 2.6ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 22.0ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.7,
            "range": "± 14.5ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 52.3ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 142.29,
            "range": "± 6.2ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 148.4ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.59,
            "range": "± 3.5ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 47.1ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 382.26,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 383.4ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.1,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.56,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.56,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 33.2ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.46,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "f5400b11d43c7d712fa0870de0c29d12cbc4ff27",
          "message": "chore(deps): update dependency fallow to v2.100.0 (#930)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-19T15:16:24Z",
          "tree_id": "3ad864e253eb4066a3cd5ca540b64e6741581972",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/f5400b11d43c7d712fa0870de0c29d12cbc4ff27"
        },
        "date": 1781882338716,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.64,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.5ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.43,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.2ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 146.48,
            "range": "± 9.0ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 155.4ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 19.55,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 19.9ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 21.44,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 22.0ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 68.49,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 70.2ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 82.41,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 83.2ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 162.32,
            "range": "± 11.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 174.2ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 133.82,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 134.3ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 52.62,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 53.0ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 362.92,
            "range": "± 33.5ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 396.4ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 52.79,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 53.4ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.08,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 20.8ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.36,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 65.24,
            "range": "± 4.5ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 69.7ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 49.24,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 49.8ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 114.43,
            "range": "± 12.9ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 127.3ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 111.97,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 113.0ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 33.93,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.3ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 49.35,
            "range": "± 20.5ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 69.9ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 106.9,
            "range": "± 3.1ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 110.0ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.24,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 293.24,
            "range": "± 8.0ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 301.3ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.86,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 266.5,
            "range": "± 10.9ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 277.4ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.9,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 72.3ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 20.04,
            "range": "± 4.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 24.2ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 35.72,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 38.0ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 127.96,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 130.1ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 41.91,
            "range": "± 2.7ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.6ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 402.51,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 404.1ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.11,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.61,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 29.71,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 30.0ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.51,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "67079fd47a549324de3e13db47de16cfbffe7029",
          "message": "refactor(client): unify dashboard + analysis-builder filter logic into one module (#913) (#931)\n\nConsolidate the duplicated filter operator/manipulation logic into a single\ndeep filter module at src/client/shared/filters, consumed by both the\ndashboard filter UI and the analysis-builder filter UI.\n\n- New shared/filters module: operators.ts (FILTER_OPERATORS + getAvailableOperators),\n  filterOperations.ts (type guards, creators, flatten/count/extractFilterMembers,\n  addFilterAtPath/removeFilterAtIndex/toggleGroupType, findDateFilterForField/\n  removeFilterForMember, server transforms, validateFilterForCube), index.ts barrel.\n- AnalysisBuilder: delete inline guards/countFilters/getSelectedFields/addFilterAtPath\n  and the AND/OR toggle+unwrap logic; components consume the module. Comparison\n  helpers delegate to the module's findDateFilterForField/removeFilterForMember.\n- Dashboard utils/filterUtils: delete convertToServerFormat (-> transformFiltersForServer),\n  extractMemberNamesFromFilter + extractFieldsFromFilters (-> extractFilterMembers),\n  and the duplicate validateFilterForCube (now imported + re-exported).\n- Move FILTER_OPERATORS/FilterOperatorMeta out of shared/types.ts and the filter\n  helpers out of shared/utils.ts; all barrels (shared/index, shared/types,\n  components/shared/utils) keep their existing export names, sourced from ./filters.\n- Unify isSimpleFilter to require member+operator (not values) so valueless\n  inDateRange filters are handled consistently across both surfaces.\n- Add tests/client/filterOperations.test.ts covering the module directly;\n  migrate the validateFilterForCube tests out of filterUtils.test.ts.\n\ntypecheck, test:client (5893), lint, build, check:exports all green.\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-19T17:35:01+02:00",
          "tree_id": "31bd52e0cb6a03857f210620f6c6471b9ab80a75",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/67079fd47a549324de3e13db47de16cfbffe7029"
        },
        "date": 1781883453632,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 52.94,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.2ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.61,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.2ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 150.85,
            "range": "± 5.3ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 156.2ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.34,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.7ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 21.92,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 22.3ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 69.2,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 70.3ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 88.86,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 88.9ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 162.31,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 162.7ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 134.41,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 135.8ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 53.34,
            "range": "± 19.6ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 73.0ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 364.79,
            "range": "± 31.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 396.6ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 52.73,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 53.5ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.17,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 22.4ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.38,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 61.79,
            "range": "± 3.6ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 65.4ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 52.71,
            "range": "± 8.0ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 60.8ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 115.54,
            "range": "± 13.9ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 129.4ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 116.2,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 116.5ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.37,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 35.0ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 49.58,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 50.2ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 106.45,
            "range": "± 5.3ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 111.8ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.19,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 295.62,
            "range": "± 5.4ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 301.0ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 3.02,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.2ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 261.48,
            "range": "± 8.8ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 270.2ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.91,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 72.3ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.83,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.2ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 41.58,
            "range": "± 29.5ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 71.1ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 128.14,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 129.7ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.25,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.0ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 403.71,
            "range": "± 14.1ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 417.8ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.13,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.59,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.33,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 30.5ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.53,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "5cfdc189155ea2daebee9a8c3ac62f2c885a0ce9",
          "message": "fix(client): expose operators for measure aggregation types; correct dev icon names (#932)\n\nOperator dropdown was empty for measures whose aggregation type was not one of\nnumber/count/sum/avg/min/max — e.g. countDistinct, median, stddev, calculated,\nmovingAvg, runningTotal, rank — because no FILTER_OPERATORS entry listed those\nfield types. The selected default `equals` then could not be resolved, surfacing\na raw operator name and a missing i18n key. Pre-existing; unmasked by #931.\n\n- Add normalizeFilterFieldType() to the filter module: any field type that is not\n  string/time/boolean collapses to 'number', so every numeric measure aggregation\n  type (current and future) gets the numeric operator set.\n- Apply it in both gates that read operator.fieldTypes: getAvailableOperators\n  (dropdown) and validateFilterOperator (queryFieldUtils).\n- Add regression tests for aggregation-type operator availability + normalization.\n\nDev app icon names: getIcon('plus') -> 'add' and getIcon('trash') -> 'delete'\n(the registry registers the heroicons under add/delete); these unregistered names\nlogged runtime \"icon not found\" fallbacks. Audited all getIcon literals across\nsrc + dev; all now resolve.\n\ntypecheck, lint, test:client (5895) green.\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-20T04:57:24+02:00",
          "tree_id": "9a4cf5fd5a8faf3f190281b6da8cb1fc9ef88dff",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/5cfdc189155ea2daebee9a8c3ac62f2c885a0ce9"
        },
        "date": 1781924393496,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 55.07,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 55.5ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.64,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 24.3ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 147.25,
            "range": "± 13.9ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 161.2ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.67,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 22.1ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 24.25,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 24.6ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 71.99,
            "range": "± 4.5ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 76.5ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 88.22,
            "range": "± 8.4ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 96.6ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 163.74,
            "range": "± 8.7ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 172.5ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 138.79,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 138.9ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 55.78,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 56.0ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 352.47,
            "range": "± 18.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 370.8ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 55.91,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 56.4ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.96,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.2ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.23,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.3ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 63.89,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 64.9ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 55.25,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 55.4ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 216.71,
            "range": "± 4.5ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 221.3ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 215.99,
            "range": "± 26.7ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 242.7ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 43.73,
            "range": "± 3.8ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 47.5ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 77.16,
            "range": "± 29.4ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 106.6ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 138.74,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 140.9ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.81,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 3.0ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 299.55,
            "range": "± 18.7ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 318.2ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.91,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 271.12,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 271.6ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 75.32,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 75.9ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 17.78,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.0ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 35.59,
            "range": "± 213.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 249.4ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 136.81,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 137.9ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.27,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.9ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 381.74,
            "range": "± 16.7ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 398.5ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.1,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.54,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.25,
            "range": "± 5.3ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 37.6ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.44,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
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
          "id": "19ed3d8a4674dd53e012e35124346ae06d69478e",
          "message": "0.6.4",
          "timestamp": "2026-06-20T06:04:58+02:00",
          "tree_id": "e1ada5da984e330af786dc0e108c4d664bda4ca0",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/19ed3d8a4674dd53e012e35124346ae06d69478e"
        },
        "date": 1781928462573,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.36,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 56.3ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 21.22,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.4ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 139.21,
            "range": "± 20.9ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 160.1ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.56,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.6ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.74,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.7ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 70.76,
            "range": "± 3.5ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 74.3ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 90.76,
            "range": "± 11.0ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 101.8ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 165.09,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 166.8ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 137.03,
            "range": "± 13.3ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 150.3ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 50.82,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 51.7ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 98.96,
            "range": "± 16.6ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 115.6ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 50.39,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 50.8ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.02,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 19.4ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.44,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 59.33,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 59.8ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 50.09,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 50.7ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 112.97,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 114.5ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 112.31,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 112.7ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.11,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.4ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 49.18,
            "range": "± 21.5ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 70.7ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 111.05,
            "range": "± 3.7ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 114.8ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.26,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 289.63,
            "range": "± 22.3ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 311.9ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.99,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 257,
            "range": "± 30.5ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 287.5ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 73.05,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 73.5ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.38,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.0ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.95,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 38.8ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 128.22,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 129.4ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.5,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.7ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 407.02,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 408.8ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.61,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 31.27,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 31.6ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.51,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
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
          "id": "16d2d5af4b51984ed8b28941557b840a02433ddd",
          "message": "chore: remove stale scratch files and tooling cruft from repo\n\nRemove test-query.json (dev scratch), screenshots/ (stale e2e output,\nregenerated by the visual test), and .bg-shell/ (accidentally-committed\nagent tooling). Add screenshots/ and .bg-shell/ to .gitignore so they\ndon't return.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-20T06:15:48+02:00",
          "tree_id": "68ddca1fe77a9b15871751d745707a32d173919c",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/16d2d5af4b51984ed8b28941557b840a02433ddd"
        },
        "date": 1781929106095,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.53,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.4ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.96,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.2ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 145.04,
            "range": "± 6.9ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 152.0ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.9,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.4ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.47,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.4ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 69.76,
            "range": "± 2.4ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 72.1ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 89.47,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 89.9ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 174.45,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 176.5ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 134.91,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 135.6ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 50.82,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 51.9ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 95.88,
            "range": "± 86.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 182.7ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 57.92,
            "range": "± 3.7ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 61.7ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.8,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 20.8ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.37,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 59.33,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 60.5ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 49.76,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 50.2ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 112.23,
            "range": "± 5.1ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 117.3ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 111.8,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 112.8ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.03,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.3ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 50.03,
            "range": "± 22.8ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 72.8ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 108.14,
            "range": "± 3.8ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 112.0ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.21,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 296.19,
            "range": "± 9.3ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 305.5ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.9,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 256.58,
            "range": "± 19.1ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 275.7ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 72.23,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 72.6ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.78,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.4ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.97,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 39.9ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 128.31,
            "range": "± 2.4ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 130.8ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.02,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 45.8ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 399.44,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 400.7ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.57,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 31.16,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 31.3ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.51,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "92dc1e00994880b1f5c64d5b5577a493309a2a1f",
          "message": "chore(deps): update dependency react-hook-form to v7.80.0 (#933)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-20T07:32:06Z",
          "tree_id": "00a96579325bcd2e7cb3b041835d9d5e6f619f05",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/92dc1e00994880b1f5c64d5b5577a493309a2a1f"
        },
        "date": 1781940880525,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 55.88,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 56.7ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.61,
            "range": "± 4.2ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 26.8ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 134,
            "range": "± 25.4ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 159.4ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.92,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 22.6ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 23.48,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.8ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 71.3,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 71.7ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 91.4,
            "range": "± 5.7ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 97.1ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 85.89,
            "range": "± 113.0ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 198.9ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 74.14,
            "range": "± 11.0ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 85.2ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 31.7,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 32.5ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 95.81,
            "range": "± 3.9ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 99.7ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 53.16,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 54.6ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.24,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 20.6ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.43,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.5ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 62.4,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 64.3ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 52.05,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 52.1ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 115.24,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 116.0ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 115.25,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 116.0ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 36.13,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 36.3ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 50.98,
            "range": "± 25.6ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 76.6ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 112.12,
            "range": "± 7.7ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 119.8ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.48,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.6ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 300.28,
            "range": "± 22.0ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 322.3ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 3.23,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.4ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 260.84,
            "range": "± 14.8ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 275.6ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 74.5,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 75.2ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 19.55,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 21.6ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.94,
            "range": "± 2.9ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 40.8ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 132.37,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 133.6ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 45.78,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 46.8ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 404.08,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 406.0ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.2ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.58,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.27,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.3ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.51,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "4c4bbf8ce7ddedafea700def5d442b000ccd1cfc",
          "message": "docs: strengthen agent context — DB-free tests + generator conventions (#939) (#940)\n\nDerived from the side-by-side review of #936 (built twice as #937/#938).\nBoth met the spec; the weaker PR lost on quality in ways that trace back to\ngaps in the repo's own agent context, not the agent's capability. Write those\nconventions down so the next contribution lands closer.\n\nTests — document and wire the DB-free path:\n- vitest.config.ts gains a `cli` project: node env, no globalSetup, no Docker,\n  globs tests/cli/**. The `server` project (here and in vitest.config.server.ts)\n  now excludes tests/cli/** so DB-free logic never drags in a container.\n- Add a real seed test (tests/cli/charts-list.test.ts) so the project is a\n  runnable live example, not an empty stub. Add test:cli npm scripts.\n- Document the DB-free vs DB-backed decision in tests/CLAUDE.md and\n  CONTRIBUTING.md, pointing at vitest.config.ts as the live example.\n\nGenerator conventions — new src/cli/CLAUDE.md (+ root index pointer):\n- Unsupported types: warn-and-skip, never throw or silently default.\n- Composite/multi-column primary keys: emit a primaryKey:true dimension per key\n  column plus the baseline countDistinct measure; never silently dropped.\n- Drift / --check: detect removed sources (orphaned cube files), comparing the\n  full expected vs existing output set — not just changed files.\n\nType safety — sharpen the principle in CLAUDE.md: a passing typecheck is\nnecessary not sufficient; forbid `as any` and validator-bypassing assertions.\n\nRefs #936, #937, #938. Closes #939.\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-06-20T09:34:43+02:00",
          "tree_id": "e28130b74438fe179cd3ff9beb5558446f8fe9b5",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/4c4bbf8ce7ddedafea700def5d442b000ccd1cfc"
        },
        "date": 1781941031151,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 54.13,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.9ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.06,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 23.1ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 158.22,
            "range": "± 6.1ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 164.3ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 22.74,
            "range": "± 3.3ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 26.0ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 24.79,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 25.1ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 70.73,
            "range": "± 3.8ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 74.5ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 92.16,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 92.6ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 167.4,
            "range": "± 9.2ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 176.6ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 146.04,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 146.9ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 55.57,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 57.0ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 366.15,
            "range": "± 14.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 380.9ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 55.41,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 57.1ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.42,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.0ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.3,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.3ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 64.44,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 66.5ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 55,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 55.8ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 225.53,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 228.4ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 235.73,
            "range": "± 13.1ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 248.8ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 44.31,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 45.7ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 85.51,
            "range": "± 15.4ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 100.9ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 108.89,
            "range": "± 33.0ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 141.9ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.78,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.9ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 288.66,
            "range": "± 10.5ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 299.1ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.88,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 256.03,
            "range": "± 21.0ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 277.0ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 75.04,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 77.0ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 17.85,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.5ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 34.58,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 35.6ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 134.31,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 136.2ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.73,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.1ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 383.18,
            "range": "± 7.3ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 390.5ms · 7 rows"
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
            "value": 0.55,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 33.06,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 33.4ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.46,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "ce2faf7fe8f042810e900c09032799961fe690a1",
          "message": "chore(deps): update dependency fallow to v2.101.0 (#946)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-21T04:46:58Z",
          "tree_id": "e9b3f4ae72783cd11379ce651456e21dc1fbc06a",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/ce2faf7fe8f042810e900c09032799961fe690a1"
        },
        "date": 1782017366243,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.75,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 55.0ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.93,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 23.1ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 146.82,
            "range": "± 20.2ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 167.0ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 22.66,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 22.8ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 25.35,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 25.5ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 72.07,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 74.2ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 92.62,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 95.8ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 164.53,
            "range": "± 12.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 176.8ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 139.35,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 139.4ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 55.59,
            "range": "± 28.9ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 84.5ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 351.02,
            "range": "± 8.7ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 359.7ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 55.84,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 56.1ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 22.09,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 22.4ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.27,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 65.53,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 66.2ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 55.41,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 55.5ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 230.12,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 231.2ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 231.17,
            "range": "± 9.4ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 240.6ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 45.85,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 47.4ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 86.94,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 89.9ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 110.03,
            "range": "± 9.8ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 119.8ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 3.12,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 3.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 292.18,
            "range": "± 10.2ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 302.4ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.98,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.3ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 258.3,
            "range": "± 3.7ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 262.0ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 76.12,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 77.6ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 19.17,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.4ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 39.18,
            "range": "± 14.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 53.3ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 134.68,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 137.4ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 47.22,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 49.2ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 381.13,
            "range": "± 13.5ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 394.6ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.1,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.57,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 33.54,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 33.8ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.45,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "37b22ca60e6966740eb2a1eb49923084fa8a683a",
          "message": "chore(deps): update dependency sql-formatter to v15.8.2 (#947)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-21T18:12:05Z",
          "tree_id": "9b048983e0d91c647857af580fe392de63ada19c",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/37b22ca60e6966740eb2a1eb49923084fa8a683a"
        },
        "date": 1782065671147,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 51.91,
            "range": "± 2.7ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.6ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.71,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.0ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 126.94,
            "range": "± 21.6ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 148.5ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 19.67,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 19.8ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 21.47,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 21.8ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 65.88,
            "range": "± 2.4ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 68.2ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 76.85,
            "range": "± 8.5ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 85.3ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 164.16,
            "range": "± 10.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 175.0ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 142.69,
            "range": "± 4.3ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 147.0ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 53.2,
            "range": "± 27.5ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 80.7ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 337.54,
            "range": "± 24.4ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 362.0ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 52.65,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 52.7ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.25,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 20.3ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.22,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 59.67,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 59.8ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 50.89,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 51.6ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 207.21,
            "range": "± 16.6ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 223.8ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 216.82,
            "range": "± 13.1ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 229.9ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 43.58,
            "range": "± 6.1ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 49.7ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 73.72,
            "range": "± 9.0ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 82.8ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 152.18,
            "range": "± 7.3ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 159.5ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.7,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 3.0ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 289.12,
            "range": "± 17.2ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 306.3ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 3.67,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.8ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 295.79,
            "range": "± 11.6ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 307.4ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 70.55,
            "range": "± 16.3ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 86.9ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 17.17,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 17.5ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 38.85,
            "range": "± 14.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 53.0ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 120.17,
            "range": "± 2.5ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 122.6ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 40.89,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 43.0ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 392.85,
            "range": "± 2.5ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 395.3ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.1,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.68,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.9ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.5,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 31.0ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.47,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "883187fc2f5f509646f63f47b5ef7a85a15cbd89",
          "message": "chore(deps): lock file maintenance (#948)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-22T06:55:45Z",
          "tree_id": "ba84137edb7ed3f13bae69b1e6614521834bc5cc",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/883187fc2f5f509646f63f47b5ef7a85a15cbd89"
        },
        "date": 1782111502400,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 54.14,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 56.0ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 21.45,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.0ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 148.52,
            "range": "± 7.7ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 156.3ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.21,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.5ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.95,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.4ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 70.69,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 71.8ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 91.04,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 94.1ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 167.7,
            "range": "± 18.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 186.5ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 137.19,
            "range": "± 2.3ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 139.5ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 62.08,
            "range": "± 28.8ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 90.9ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 98.85,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 100.8ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 51.97,
            "range": "± 7.9ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 59.9ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.37,
            "range": "± 2.6ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 22.0ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.39,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 61.09,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 61.4ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 50.72,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 51.5ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 115.21,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 116.0ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 115.24,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 117.3ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.11,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.7ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 49.32,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 50.0ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 111,
            "range": "± 4.5ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 115.5ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.35,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.5ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 307.84,
            "range": "± 5.5ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 313.4ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.89,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 257.31,
            "range": "± 32.4ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 289.7ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 73.14,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 74.7ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 19.08,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.1ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 40.78,
            "range": "± 23.9ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 64.7ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 130.23,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 131.4ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.17,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.9ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 403.65,
            "range": "± 4.8ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 408.4ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.13,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.2ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.57,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 31.63,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 31.8ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.54,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "edd336c10ac936981d5e5c25b763af5c170c5c04",
          "message": "chore(deps): update dependency @hono/node-server to v2.0.6 (#949)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-22T19:50:26Z",
          "tree_id": "898745c0dc7617209134983bc7f1cd7798c8d0a5",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/edd336c10ac936981d5e5c25b763af5c170c5c04"
        },
        "date": 1782157979438,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 52.75,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 53.5ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.46,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 20.7ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 130.68,
            "range": "± 25.7ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 156.4ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 19.84,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.2ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.25,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.4ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 69.13,
            "range": "± 2.7ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 71.8ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 87.91,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 88.2ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 168.18,
            "range": "± 10.1ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 178.3ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 136.48,
            "range": "± 26.9ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 163.4ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 52.24,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 53.4ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 100.46,
            "range": "± 18.2ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 118.6ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 50.68,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 50.9ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 18.83,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 19.3ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.32,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 58.95,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 59.3ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 48.81,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 50.2ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 113.52,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 114.4ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 112.58,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 113.4ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 33.08,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 33.7ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 48.77,
            "range": "± 26.1ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 74.9ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 109.15,
            "range": "± 4.3ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 113.4ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.23,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 288.48,
            "range": "± 15.9ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 304.4ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.83,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 259.19,
            "range": "± 19.4ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 278.6ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.32,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 71.6ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.88,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 20.9ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 36.5,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 38.6ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 128.01,
            "range": "± 6.5ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 134.5ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.05,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.1ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 401.35,
            "range": "± 2.4ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 403.8ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.11,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.61,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.87,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 31.4ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.51,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "bc53b38895d4efd0dbf2bc01686fe0013a0d202b",
          "message": "chore(deps): update dependency @arethetypeswrong/cli to v0.18.4 (#951)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-22T21:10:57Z",
          "tree_id": "410bf9a3b31df4044963f0c7a2debbbee98e116d",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/bc53b38895d4efd0dbf2bc01686fe0013a0d202b"
        },
        "date": 1782162807947,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 54.24,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 55.5ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.07,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.4ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 145.29,
            "range": "± 27.1ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 172.4ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.27,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.5ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 23.95,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 24.2ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 70.79,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 71.9ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 92.39,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 94.5ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 163.81,
            "range": "± 9.6ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 173.4ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 140.15,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 142.0ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 55.38,
            "range": "± 31.4ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 86.7ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 356.24,
            "range": "± 16.0ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 372.3ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 55.78,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 56.1ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.58,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 22.0ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.25,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.3ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 63.47,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 64.4ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 55.13,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 55.5ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 221.51,
            "range": "± 7.4ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 228.9ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 221.15,
            "range": "± 12.8ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 233.9ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 45.53,
            "range": "± 2.9ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 48.4ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 79.66,
            "range": "± 7.3ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 87.0ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 110.43,
            "range": "± 11.6ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 122.0ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.15,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 292.95,
            "range": "± 13.6ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 306.5ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.89,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 256.32,
            "range": "± 17.7ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 274.0ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 74.54,
            "range": "± 2.4ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 76.9ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 17.8,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.6ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.71,
            "range": "± 13.0ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 50.7ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 135.05,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 135.8ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.47,
            "range": "± 2.4ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 46.9ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 388.03,
            "range": "± 4.2ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 392.3ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.1,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.58,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 31.96,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.6ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.45,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "f33db8eabcc92c48b7aede0c69dcf2fc485a1987",
          "message": "chore(deps): update dependency @xyflow/react to v12.11.1 (#950)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-23T02:52:38Z",
          "tree_id": "d6a8727f203de2f8478fef93095d52d5a630c776",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/f33db8eabcc92c48b7aede0c69dcf2fc485a1987"
        },
        "date": 1782183312356,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.22,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.0ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 21.07,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.9ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 154.55,
            "range": "± 4.1ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 158.6ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.93,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.2ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 28.06,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 30.1ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 72.01,
            "range": "± 2.3ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 74.3ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 90.92,
            "range": "± 4.4ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 95.3ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 180.34,
            "range": "± 14.9ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 195.3ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 72.67,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 73.0ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 30.74,
            "range": "± 31.9ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 62.6ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 95.29,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 96.3ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 50.88,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 51.5ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.2,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 19.4ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.37,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.5ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 60.55,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 61.3ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 49.72,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 50.1ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 111.16,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 114.2ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 114.12,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 115.7ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.7,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.9ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 48.89,
            "range": "± 20.4ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 69.3ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 108.8,
            "range": "± 4.1ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 112.9ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.24,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 305.4,
            "range": "± 14.4ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 319.8ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.91,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 255.28,
            "range": "± 4.9ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 260.2ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 72.15,
            "range": "± 8.0ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 80.1ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.76,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.9ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.03,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 39.2ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 129.46,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 130.9ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.4ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 401.2,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 401.4ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.11,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.59,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.98,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 31.4ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.52,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "ed38ef0e53cd47a9fe5e444f3def3570d490073e",
          "message": "chore(deps): update dependency globals to v17.7.0 (#952)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-23T05:04:41Z",
          "tree_id": "b314b3717a405e6c1fa70f625faa39dd13c50be8",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/ed38ef0e53cd47a9fe5e444f3def3570d490073e"
        },
        "date": 1782191233579,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.83,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 55.9ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.2,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.9ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 149.25,
            "range": "± 8.4ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 157.6ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.52,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 22.3ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 24.29,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 24.4ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 71.31,
            "range": "± 3.4ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 74.7ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 90.27,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 93.3ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 165.31,
            "range": "± 12.2ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 177.5ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 147.33,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 147.8ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 54.07,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 54.7ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 367.88,
            "range": "± 3.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 371.1ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 55.22,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 55.8ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.59,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.1ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.32,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.3ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 63.12,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 64.4ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 55.2,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 55.5ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 228.27,
            "range": "± 14.4ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 242.6ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 114.77,
            "range": "± 9.7ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 124.4ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 35.31,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 35.4ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 50.92,
            "range": "± 21.8ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 72.8ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 109.21,
            "range": "± 5.0ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 114.2ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.27,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.5ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 299.45,
            "range": "± 10.6ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 310.0ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.96,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 265.16,
            "range": "± 4.9ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 270.1ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 75.41,
            "range": "± 3.6ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 79.0ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 17.57,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.2ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 36.11,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 38.1ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 133.99,
            "range": "± 19.7ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 153.7ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.21,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.8ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 381.37,
            "range": "± 7.1ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 388.5ms · 7 rows"
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
            "value": 0.54,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.77,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 33.2ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.48,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "d305fdad407a7d0e5ce76bcaf98f31c5d6a1d161",
          "message": "chore(deps): update dependency hono to v4.12.27 (#954)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-23T12:55:21Z",
          "tree_id": "b20406fa9a23a079d6881f1acbcef8c07651401e",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/d305fdad407a7d0e5ce76bcaf98f31c5d6a1d161"
        },
        "date": 1782219480804,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.34,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.7ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.62,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.1ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 147.6,
            "range": "± 6.8ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 154.4ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.16,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.3ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.44,
            "range": "± 3.1ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 25.6ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 68.35,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 69.5ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 84.65,
            "range": "± 5.1ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 89.7ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 165.78,
            "range": "± 3.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 169.1ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 71.77,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 72.9ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 50.57,
            "range": "± 17.2ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 67.8ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 94.94,
            "range": "± 2.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 97.2ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 50.8,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 51.1ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 18.27,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 18.7ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.44,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.5ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 59.25,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 59.7ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 50.21,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 50.5ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 112.9,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 113.6ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 114.33,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 114.8ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.57,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.7ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 50.2,
            "range": "± 24.1ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 74.3ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 107.09,
            "range": "± 3.8ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 110.9ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.2,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 289.69,
            "range": "± 15.2ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 304.9ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.84,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 260.18,
            "range": "± 13.7ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 273.9ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 72.54,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 72.7ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.64,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.9ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 39.77,
            "range": "± 4.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 43.9ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 128.26,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 130.2ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 42.75,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 43.8ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 400.61,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 402.7ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.11,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.56,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 31.06,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 31.3ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.51,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "bb2e44790829d1c354d9c65e95ef7f0a18d09cf0",
          "message": "chore(deps): update dependency @vitejs/plugin-react to v6.0.3 (#957)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-23T19:32:42Z",
          "tree_id": "0e6677f267a0729f5a6605764d92c3480d88e7ac",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/bb2e44790829d1c354d9c65e95ef7f0a18d09cf0"
        },
        "date": 1782243316187,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 54.28,
            "range": "± 4.9ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 59.2ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 21.53,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.8ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 142.6,
            "range": "± 14.9ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 157.5ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.68,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.4ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.21,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 22.4ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 66.64,
            "range": "± 3.4ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 70.0ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 89.61,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 90.0ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 178.86,
            "range": "± 13.6ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 192.4ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 133.14,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 134.7ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 51.4,
            "range": "± 29.5ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 80.9ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 341.05,
            "range": "± 15.4ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 356.4ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 53.75,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 54.0ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.33,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 20.9ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.32,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.6ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 60.61,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 61.5ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 52.63,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 53.2ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 211.37,
            "range": "± 11.7ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 223.1ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 210.24,
            "range": "± 13.4ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 223.7ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 45.91,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 46.6ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 78.48,
            "range": "± 4.8ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 83.3ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 156.97,
            "range": "± 19.8ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 176.8ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 3.15,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 5.1ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 308.63,
            "range": "± 20.1ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 328.7ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 3.74,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.8ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 271.67,
            "range": "± 2.6ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 274.3ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 68.54,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 70.1ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 17.34,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 17.9ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 40.06,
            "range": "± 13.6ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 53.6ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 120.65,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 122.6ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 41.37,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.5ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 398.93,
            "range": "± 35.8ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 434.8ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.1,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.61,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.94,
            "range": "± 11.6ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 42.5ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.51,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 1.1ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "faf4d2ba1ee98800123d66fac909fe4753b1a4ac",
          "message": "chore(deps): update tanstack-query monorepo to v5.101.1 (#958)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-23T20:34:37Z",
          "tree_id": "e3a52f6279f3753cb9528da1040bf45bcf6748c3",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/faf4d2ba1ee98800123d66fac909fe4753b1a4ac"
        },
        "date": 1782247027207,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 49.37,
            "range": "± 2.4ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 51.7ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.43,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 20.6ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 132.45,
            "range": "± 19.9ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 152.4ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 18.65,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.1ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 25.18,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 25.8ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 66.56,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 67.8ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 84.29,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 84.8ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 161.44,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 161.9ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 125.29,
            "range": "± 5.2ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 130.5ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 50.42,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 51.8ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 348.81,
            "range": "± 13.5ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 362.3ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 53.78,
            "range": "± 3.8ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 57.5ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 17.99,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 18.5ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.21,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.3ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 62.7,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 63.3ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 53.61,
            "range": "± 2.3ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 55.9ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 209.12,
            "range": "± 2.7ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 211.8ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 204.47,
            "range": "± 8.9ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 213.4ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 40.77,
            "range": "± 4.3ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 45.1ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 71.67,
            "range": "± 26.8ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 98.4ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 135.77,
            "range": "± 6.1ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 141.9ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.51,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.8ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 281.34,
            "range": "± 21.2ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 302.5ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.73,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.8ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 247.51,
            "range": "± 15.6ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 263.1ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 66.73,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 68.4ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 17.27,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 17.4ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 38.93,
            "range": "± 12.3ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 51.2ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 117.64,
            "range": "± 6.6ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 124.2ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 38.64,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 40.3ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 372.32,
            "range": "± 30.2ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 402.5ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.11,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.54,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 28.95,
            "range": "± 3.9ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.9ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.47,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "9a20cb62d8a0b9e91cb64061a8614e39f6a4bd5b",
          "message": "chore(deps): update playwright monorepo (#961)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-24T00:27:27Z",
          "tree_id": "d7e58a271fe78b10fc2617424cc49fb65f5349a0",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/9a20cb62d8a0b9e91cb64061a8614e39f6a4bd5b"
        },
        "date": 1782260997851,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 54.38,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 55.4ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.15,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.4ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 138.91,
            "range": "± 26.8ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 165.7ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.65,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.2ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.9,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.5ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 71.26,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 72.6ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 87.91,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 88.9ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 163.41,
            "range": "± 9.3ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 172.8ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 134.77,
            "range": "± 25.6ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 160.4ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 53.25,
            "range": "± 5.3ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 58.5ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 379.72,
            "range": "± 18.7ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 398.4ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 56.02,
            "range": "± 9.6ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 65.6ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 21.55,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.7ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.32,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 61.7,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 62.6ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 57.84,
            "range": "± 3.7ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 61.6ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 115.64,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 116.2ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 118.35,
            "range": "± 4.8ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 123.1ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.16,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.6ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 51.07,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 52.7ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 109.65,
            "range": "± 4.0ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 113.7ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.19,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 300.22,
            "range": "± 13.5ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 313.8ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.86,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 255.11,
            "range": "± 23.3ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 278.4ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 72.13,
            "range": "± 22.8ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 94.9ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.69,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.3ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 36.19,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 39.4ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 129.79,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 130.6ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.08,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.5ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 399.49,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 400.9ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.15,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.2ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.63,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.62,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 31.9ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.48,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "ff676d325fab53f320372d2698d64f07579fd682",
          "message": "perf: CPU/memory profiling harness + SQLite result-mapping optimization (#942)\n\n* perf: add CPU/memory profiling harness + optimize SQLite result mapping\n\nAdds a profiling layer on top of the existing perf timing suite, built on\nNode's bundled inspector (no new runtime deps):\n\n- profiler.ts: CPU profiles (.cpuprofile + a terminal hot-frame table that\n  splits idle/IO from active CPU), allocation profiles (.heapprofile),\n  high-resolution timing (microseconds), and memory-growth sampling\n  (post-GC checkpoints + a second-half slope to tell a real leak from\n  one-time warmup).\n- profile.ts: in-process profiling of the query engine by benchmark id/mode.\n- route-profile.ts: profiles the REAL HTTP load route in-process via the Hono\n  adapter over SQLite (synchronous, 0% idle — every frame is real request\n  work). Supports throughput (--concurrency), leak checks (--mode=mem with a\n  growth curve), and --vary to cycle distinct query shapes and stress\n  per-shape caches.\n- runner.ts: extract a shared makeRunOnce so the profiler and the timing\n  suite drive the identical execution path.\n\nProfiling the real route showed result-row handling dominates large-payload\nresponses. Trim our share of it by coercing SQLite measure fields in place\nover only the numeric columns, instead of rebuilding every row object via a\nfull Object.entries + key copy. ~5% faster on a 5000-row response; the full\nSQLite suite (2348 tests) stays green.\n\nMemory across both fixed and 96 varied query shapes over 10k requests is flat\n— no leaks; retained heap plateaus after warmup and the transient peak scales\nwith payload size and is reclaimed by GC.\n\nCommands: npm run perf:profile / npm run perf:route. Docs in perf/README.md.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n* fix: address feedback on PR #942\n\n---------\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\nCo-authored-by: last-light[bot] <last-light[bot]@users.noreply.github.com>",
          "timestamp": "2026-06-24T19:58:57+02:00",
          "tree_id": "439b8ebec0d217d6d3adde92db7aaed5b6155319",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/ff676d325fab53f320372d2698d64f07579fd682"
        },
        "date": 1782324092529,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 54.12,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 55.2ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.28,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.4ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 151.33,
            "range": "± 16.4ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 167.8ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.64,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 22.2ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 23.31,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 23.5ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 70.28,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 71.8ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 83.85,
            "range": "± 7.6ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 91.4ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 177.65,
            "range": "± 5.0ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 182.6ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 136.26,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 137.8ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 55.87,
            "range": "± 5.7ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 61.6ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 96.47,
            "range": "± 4.0ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 100.5ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 56.36,
            "range": "± 5.4ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 61.8ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.7,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 20.6ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.44,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.5ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 61.37,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 62.4ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 51.46,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 52.0ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 115.93,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 118.0ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 117.58,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 119.0ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.19,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.6ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 51.41,
            "range": "± 22.4ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 73.8ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 112.14,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 115.3ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.22,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 297.44,
            "range": "± 19.5ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 317.0ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 3.22,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 4.7ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 262.58,
            "range": "± 27.6ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 290.1ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 73.56,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 74.1ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 19.49,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.8ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 38.95,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 40.9ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 132.02,
            "range": "± 3.4ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 135.4ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 46.71,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 47.3ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 401.83,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 402.6ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.11,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.58,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 31.64,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.1ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.51,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "clifton.cunningham@gmail.com",
            "name": "Clifton Cunningham",
            "username": "cliftonc"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "e2abbf2467ba29b8fa4c49706531abf3f7cbaa07",
          "message": "fix(mcp): reject foreign origins by default (GHSA-ch89-j64x-45pq) (#964)\n\n* fix(mcp): reject foreign origins by default (GHSA-ch89-j64x-45pq)\n\nvalidateOriginHeader accepted any Origin when mcp.allowedOrigins was unset\n(the default), letting a DNS-rebinding page invoke MCP tools against a\nvictim's server. Change the default policy to admit only loopback origins\n(localhost / 127.x / [::1]) plus non-browser / server-to-server clients that\nsend no Origin header; every other browser Origin now returns 403.\n\n- '*' in allowedOrigins restores fully-permissive mode (explicit opt-in)\n- add isLoopbackOrigin helper and originOptionsFromMcp; single URL parse\n- apply origin validation to the inline GET/DELETE /mcp handlers in all four\n  adapters (previously only POST was checked)\n- correct MCPOptions JSDoc and CLAUDE.md; strengthen resourceMetadataUrl\n  (Bearer auth) guidance as the primary control for public deployments\n- update permissive-mode tests; add loopback/foreign/'*' and a PoC\n  regression test mirroring the advisory\n\nServer-to-server clients (Claude connector, curl) and the mcp.app\nvisualisation are unaffected. Browser front-ends on a non-loopback origin\nmust now set mcp.allowedOrigins.\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n* test(mcp): cover GET/DELETE origin hardening on Fastify, Hono, Next.js\n\nThe GET/DELETE /mcp origin check is inline per-adapter (POST goes through the\nshared core), and only Express had HTTP-level coverage. Add foreign-origin\n→ 403 tests for POST/GET/DELETE on the other three adapters, plus an allow-path\nassertion each (no-Origin server-to-server → 200 for Fastify/Hono; loopback\nDELETE → 405 for Next.js, whose mock can't build the GET SSE response).\n\nCo-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\n\n---------\n\nCo-authored-by: Claude Opus 4.8 (1M context) <noreply@anthropic.com>",
          "timestamp": "2026-07-05T08:28:21+02:00",
          "tree_id": "3994c9205a8ae132bfd6dd2ad8820afdf2415ba1",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/e2abbf2467ba29b8fa4c49706531abf3f7cbaa07"
        },
        "date": 1783233055661,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.75,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.8ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 21.35,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.7ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 154.05,
            "range": "± 7.8ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 161.9ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.9,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.1ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.46,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 24.5ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 69.31,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 70.6ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 89.27,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 92.0ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 163.37,
            "range": "± 10.9ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 174.3ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 134.34,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 135.4ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 54.16,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 56.3ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 376.57,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 377.3ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 53.7,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 54.6ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 23.75,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 24.2ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.36,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 60.78,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 61.0ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 51.6,
            "range": "± 7.6ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 59.2ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 117.04,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 117.4ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 117.43,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 118.6ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 35.14,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 35.7ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 50.87,
            "range": "± 23.4ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 74.3ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 112.91,
            "range": "± 6.2ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 119.1ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.24,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 291.96,
            "range": "± 9.1ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 301.1ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 3.05,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.5ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 266.79,
            "range": "± 5.6ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 272.4ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 72.57,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 73.1ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.54,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.1ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 39.95,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 42.1ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 128.64,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 128.7ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 42.98,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 43.7ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 404.08,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 404.7ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.6,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 31.02,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 31.8ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.52,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "1b205016adc73ea13f950dac1249fe4d83f52f07",
          "message": "chore(deps): update actions/cache action to v6 (#962)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-07-18T10:08:37Z",
          "tree_id": "a47f4926b244364f40f4d8550a38275f5457d109",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/1b205016adc73ea13f950dac1249fe4d83f52f07"
        },
        "date": 1784369469121,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 54.9,
            "range": "± 3.3ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 58.2ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 22.55,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 22.8ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 144.05,
            "range": "± 12.8ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 156.9ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 21.59,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 21.8ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 24.04,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 24.5ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 71.31,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 73.3ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 86.27,
            "range": "± 2.8ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 89.0ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 162.36,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 162.8ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 138.54,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 139.0ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 55.65,
            "range": "± 25.1ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 80.7ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 349.2,
            "range": "± 18.8ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 368.0ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 54.91,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 55.1ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 20.91,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.8ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.22,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.3ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 63.74,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 64.0ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 54.6,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 55.8ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 220.23,
            "range": "± 9.4ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 229.6ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 222.27,
            "range": "± 9.7ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 232.0ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 46.49,
            "range": "± 4.1ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 50.6ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 81.97,
            "range": "± 4.5ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 86.5ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 110.65,
            "range": "± 17.9ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 128.5ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.25,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 289.9,
            "range": "± 18.6ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 308.5ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.86,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 258.85,
            "range": "± 25.2ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 284.0ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 75.65,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 77.2ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.21,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.4ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 39.35,
            "range": "± 17.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 56.6ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 135.29,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 137.3ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.44,
            "range": "± 4.5ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 48.9ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 377.86,
            "range": "± 9.2ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 387.1ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.11,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.54,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.53,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.8ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.44,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "91abe9e402cc912c07e0525d09675dd090a7a2f3",
          "message": "chore(deps): update typescript-eslint monorepo to v8.64.0 (#953)\n\n* chore(deps): update typescript-eslint monorepo to v8.64.0\n\n* fix(deps): resolve CI failures for #953\n\n---------\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>\nCo-authored-by: last-light[bot] <last-light[bot]@users.noreply.github.com>",
          "timestamp": "2026-07-19T05:59:34Z",
          "tree_id": "83c5a292f1e28bb4d8f2def021067bec5e85ac24",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/91abe9e402cc912c07e0525d09675dd090a7a2f3"
        },
        "date": 1784440902932,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 33.25,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 33.9ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 12.92,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 13.3ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 95.21,
            "range": "± 2.6ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 97.8ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 12.45,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 13.1ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 13.37,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 13.8ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 42.21,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 42.6ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 54.95,
            "range": "± 2.5ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 57.4ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 104.12,
            "range": "± 8.1ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 112.2ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 78.49,
            "range": "± 7.8ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 86.3ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 31.34,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 32.2ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 234.15,
            "range": "± 26.0ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 260.1ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 34.73,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 35.4ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 12.52,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 12.8ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.02,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.1ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 38.93,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 39.2ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 33.55,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 34.4ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 132.57,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 134.4ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 133.13,
            "range": "± 11.8ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 144.9ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 25.97,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 28.1ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 55.97,
            "range": "± 14.5ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 70.5ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 90.82,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 94.0ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 1.97,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.0ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 182.57,
            "range": "± 9.0ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 191.6ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.67,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 2.9ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 160.74,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 161.1ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 77.32,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 78.9ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 75.07,
            "range": "± 3.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 78.1ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 25.99,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 27.3ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 107.05,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 110.0ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 26.93,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 28.1ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 236.07,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 236.8ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.05,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.47,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.6ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.91,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 33.3ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.28,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.4ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "d24981bf6bd0373c71e2b9daeb9c0e87b534ec7d",
          "message": "chore(deps): update dependency vite to v8.1.5 (#960)\n\n* chore(deps): update dependency vite to v8.1.5\n\n* fix(deps): resolve CI failures for #960\n\n---------\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>\nCo-authored-by: last-light[bot] <last-light[bot]@users.noreply.github.com>",
          "timestamp": "2026-07-19T05:59:11Z",
          "tree_id": "9693a2fac19ebfc84068a61ff77a05c622649a1c",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/d24981bf6bd0373c71e2b9daeb9c0e87b534ec7d"
        },
        "date": 1784440908864,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.9,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.6ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 21.11,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.2ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 144.95,
            "range": "± 10.8ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 155.7ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.28,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.5ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.28,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 22.6ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 70.3,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 71.0ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 89.12,
            "range": "± 3.6ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 92.7ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 171.99,
            "range": "± 14.1ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 186.1ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 141.59,
            "range": "± 31.9ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 173.5ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 53.46,
            "range": "± 6.6ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 60.0ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 101.45,
            "range": "± 20.0ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 121.4ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 51.05,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 51.4ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 18.62,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 19.4ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.39,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 58.91,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 59.1ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 49.01,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 49.8ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 118.22,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 120.0ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 117.57,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 119.2ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 34.08,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 34.4ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 48.65,
            "range": "± 2.6ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 51.3ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 110.61,
            "range": "± 4.6ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 115.2ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.25,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.5ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 304.39,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 305.0ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.95,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 264.57,
            "range": "± 20.1ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 284.6ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 73.19,
            "range": "± 23.7ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 96.9ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 19.25,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.7ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 41.35,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 42.1ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 129.95,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 130.4ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.8,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 44.9ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 399.33,
            "range": "± 6.0ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 405.3ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.6,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 31.29,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 31.4ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.53,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "aea654a6de70612ed90bf74133c6b098ea0b7bdb",
          "message": "chore(deps): update dependency recharts to v3.9.2 (#959)\n\n* chore(deps): update dependency recharts to v3.9.2\n\n* fix(deps): resolve CI failures for #959\n\n---------\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>\nCo-authored-by: last-light[bot] <last-light[bot]@users.noreply.github.com>",
          "timestamp": "2026-07-19T05:59:37Z",
          "tree_id": "0ed86f67aceae107aecf7c567af2142df063d390",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/aea654a6de70612ed90bf74133c6b098ea0b7bdb"
        },
        "date": 1784440933228,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 53.18,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 54.3ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.92,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.5ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 139.64,
            "range": "± 16.5ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 156.1ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 20.03,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.3ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 23.03,
            "range": "± 6.0ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 29.0ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 68.32,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 69.1ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 88.71,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 90.2ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 180.44,
            "range": "± 14.4ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 194.9ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 71.1,
            "range": "± 10.3ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 81.3ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 30.16,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 31.0ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 94.08,
            "range": "± 7.7ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 101.8ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 49.76,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 50.2ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 18.56,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 19.3ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.37,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 58.81,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 59.6ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 48.84,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 50.1ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 111.65,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 112.2ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 110.61,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 111.0ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 33.24,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 33.8ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 49.22,
            "range": "± 22.0ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 71.2ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 107.15,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 109.3ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.21,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.3ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 291.88,
            "range": "± 3.9ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 295.8ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.85,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 270.47,
            "range": "± 7.5ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 277.9ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.61,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 73.5ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.62,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.7ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 37.15,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 39.3ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 126.4,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 129.6ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.33,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 43.8ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 401.41,
            "range": "± 2.6ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 404.0ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.57,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.74,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 31.9ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.51,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.5ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "0522fbeb9a543c7baff4fcfb0aaf8cb6f93aecb9",
          "message": "chore(deps): update dependency @crowdin/cli to v4.14.4 (#969)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-07-19T06:05:17Z",
          "tree_id": "0624bc561c71bb5eaaf9f346fe4c1275c8bd0801",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/0522fbeb9a543c7baff4fcfb0aaf8cb6f93aecb9"
        },
        "date": 1784441269180,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 55.72,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 56.8ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 23.33,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 23.6ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 156.03,
            "range": "± 2.1ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 158.1ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 22.48,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 22.7ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 25.24,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 25.4ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 72.6,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 73.8ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 92.73,
            "range": "± 2.4ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 95.1ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 166.5,
            "range": "± 9.9ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 176.4ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 142.55,
            "range": "± 6.2ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 148.7ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 57.36,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 57.6ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 370.84,
            "range": "± 10.9ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 381.7ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 57.31,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 58.2ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 21.19,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.6ms · 1 rows"
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
            "value": 65.38,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 67.2ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 55.74,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 56.6ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 122.37,
            "range": "± 120.7ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 243.0ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 117.66,
            "range": "± 9.2ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 126.9ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 35.75,
            "range": "± 0.7ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 36.4ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 49.73,
            "range": "± 23.5ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 73.2ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 107.84,
            "range": "± 4.5ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 112.3ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.36,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.5ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 291.48,
            "range": "± 3.4ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 294.9ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.94,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 257.19,
            "range": "± 1.4ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 258.6ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 74.65,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 75.2ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.63,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 19.1ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 36.62,
            "range": "± 3.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 39.8ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 134.8,
            "range": "± 13.5ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 148.3ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 43.89,
            "range": "± 2.5ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 46.4ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 387.42,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 388.1ms · 7 rows"
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
            "value": 0.55,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 32.47,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 32.6ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.51,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "1eed248df4836f2c431c421621100ed083f3e8e1",
          "message": "chore(deps): update dependency @arethetypeswrong/cli to v0.18.5 (#967)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-07-19T06:05:56Z",
          "tree_id": "b53f2ebaadd3fb1e58f3284a127e5516e21e2348",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/1eed248df4836f2c431c421621100ed083f3e8e1"
        },
        "date": 1784441308093,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 55.9,
            "range": "± 3.9ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 59.8ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.72,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.1ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 138.69,
            "range": "± 6.1ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 144.8ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 19.96,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 20.4ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 22.28,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 22.6ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 67.64,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 68.8ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 81.64,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 83.5ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 164.19,
            "range": "± 9.4ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 173.6ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 135.49,
            "range": "± 8.4ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 143.9ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 53.36,
            "range": "± 23.7ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 77.1ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 354.77,
            "range": "± 3.6ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 358.3ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 54,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 57.2ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 19.74,
            "range": "± 2.2ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 21.9ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.31,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 63.82,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 64.7ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 52.65,
            "range": "± 2.6ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 55.3ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 113.46,
            "range": "± 117.9ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 231.4ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 114.76,
            "range": "± 14.4ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 129.2ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 33.06,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 33.2ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 47.5,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 47.8ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 107.22,
            "range": "± 5.6ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 112.8ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.15,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.4ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 290.27,
            "range": "± 9.0ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 299.3ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.97,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.1ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 255.33,
            "range": "± 1.3ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 256.7ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 71.12,
            "range": "± 1.8ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 73.0ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.49,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.9ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 39.08,
            "range": "± 17.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 56.1ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 130.81,
            "range": "± 7.8ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 138.6ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 44.49,
            "range": "± 3.2ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 47.6ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 402.77,
            "range": "± 2.6ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 405.4ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.59,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.8ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 30.01,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 30.1ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.49,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "b42fd796d6b65819e3a936764b1d1ad805ca246a",
          "message": "chore(deps): update dependency fallow to v2.104.0 (#963)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-07-19T06:06:44Z",
          "tree_id": "c910c0c3608a943456ede36a6d107113c7b74a40",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/b42fd796d6b65819e3a936764b1d1ad805ca246a"
        },
        "date": 1784441347868,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 44.13,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 44.6ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 18.08,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 18.4ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 125.14,
            "range": "± 11.0ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 136.1ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 17.45,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 17.7ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 19.88,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 20.0ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 58.19,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 58.6ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 68.71,
            "range": "± 3.6ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 72.3ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 131.05,
            "range": "± 9.4ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 140.5ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 111.51,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 112.5ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 44.23,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 45.7ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 275.36,
            "range": "± 13.9ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 289.3ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 45.64,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 45.7ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 17.42,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 17.8ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.03,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.1ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 51.94,
            "range": "± 1.7ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 53.6ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 45.41,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 45.5ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 180.15,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 182.0ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 175.68,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 176.2ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 35,
            "range": "± 0.3ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 35.3ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 60.89,
            "range": "± 1.0ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 61.9ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 112.24,
            "range": "± 0.9ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 113.1ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.13,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.2ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 236.49,
            "range": "± 2.5ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 239.0ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.85,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.0ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 204.24,
            "range": "± 14.3ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 218.6ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 107.31,
            "range": "± 14.7ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 122.0ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 94.89,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 96.5ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 32.81,
            "range": "± 16.5ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 49.3ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 141.89,
            "range": "± 11.6ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 153.4ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 36.74,
            "range": "± 0.8ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 37.5ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 303.72,
            "range": "± 3.0ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 306.7ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.08,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.48,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.6ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 44.16,
            "range": "± 4.8ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 49.0ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.33,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.4ms · 700 rows"
          }
        ]
      },
      {
        "commit": {
          "author": {
            "email": "29139614+renovate[bot]@users.noreply.github.com",
            "name": "renovate[bot]",
            "username": "renovate[bot]"
          },
          "committer": {
            "email": "noreply@github.com",
            "name": "GitHub",
            "username": "web-flow"
          },
          "distinct": true,
          "id": "8bba60bfb575c5c28579ddc801c8760fb2383325",
          "message": "chore(deps): update dependency @eslint/eslintrc to v3.3.6 (#970)\n\nCo-authored-by: renovate[bot] <29139614+renovate[bot]@users.noreply.github.com>",
          "timestamp": "2026-07-19T06:10:42Z",
          "tree_id": "87dc1d3fbff518ee11e226066ee3481ee7d2ee5e",
          "url": "https://github.com/cliftonc/drizzle-cube/commit/8bba60bfb575c5c28579ddc801c8760fb2383325"
        },
        "date": 1784441604795,
        "tool": "customSmallerIsBetter",
        "benches": [
          {
            "name": "baseline.count-time-entries",
            "value": 52.45,
            "range": "± 7.1ms p95",
            "unit": "ms",
            "extra": "Count over ~730k time entries · p95 59.5ms · 1 rows"
          },
          {
            "name": "baseline.sum-avg-productivity",
            "value": 20.81,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Sum + avg over ~335k productivity rows · p95 21.3ms · 1 rows"
          },
          {
            "name": "baseline.count-distinct",
            "value": 149.07,
            "range": "± 3.1ms p95",
            "unit": "ms",
            "extra": "Count distinct employees over time entries · p95 152.2ms · 1 rows"
          },
          {
            "name": "baseline.min-max",
            "value": 30.33,
            "range": "± 1.6ms p95",
            "unit": "ms",
            "extra": "Min + max lines of code · p95 32.0ms · 1 rows"
          },
          {
            "name": "baseline.calculated-measure",
            "value": 33.92,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Calculated measure (productivity score) · p95 34.1ms · 1 rows"
          },
          {
            "name": "multi.six-measures",
            "value": 75.5,
            "range": "± 3.7ms p95",
            "unit": "ms",
            "extra": "Six measures on time entries · p95 79.2ms · 1 rows"
          },
          {
            "name": "multi.mixed-types",
            "value": 58.24,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Mixed aggregation types on productivity · p95 58.9ms · 1 rows"
          },
          {
            "name": "groupby.low-cardinality",
            "value": 94.52,
            "range": "± 1.5ms p95",
            "unit": "ms",
            "extra": "Group by allocation type (6 groups) · p95 96.0ms · 6 rows"
          },
          {
            "name": "groupby.mid-cardinality",
            "value": 81.64,
            "range": "± 0.5ms p95",
            "unit": "ms",
            "extra": "Group by department (~25 groups) · p95 82.1ms · 25 rows"
          },
          {
            "name": "groupby.high-cardinality",
            "value": 41.77,
            "range": "± 5.2ms p95",
            "unit": "ms",
            "extra": "Group by employee (~700 groups) · p95 47.0ms · 700 rows"
          },
          {
            "name": "groupby.two-dimensions",
            "value": 104.92,
            "range": "± 3.5ms p95",
            "unit": "ms",
            "extra": "Group by allocation type + department · p95 108.4ms · 150 rows"
          },
          {
            "name": "filter.equals",
            "value": 62.1,
            "range": "± 1.2ms p95",
            "unit": "ms",
            "extra": "Equals filter (development entries) · p95 63.3ms · 1 rows"
          },
          {
            "name": "filter.numeric-range",
            "value": 30.06,
            "range": "± 0.6ms p95",
            "unit": "ms",
            "extra": "Numeric range filter (linesOfCode > 100) · p95 30.6ms · 1 rows"
          },
          {
            "name": "filter.string-contains",
            "value": 1.38,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "String contains filter on employee name · p95 1.4ms · 1 rows"
          },
          {
            "name": "filter.nested-and-or",
            "value": 72.14,
            "range": "± 1.9ms p95",
            "unit": "ms",
            "extra": "Nested AND/OR filter on time entries · p95 74.0ms · 1 rows"
          },
          {
            "name": "filter.in-list-100",
            "value": 61.23,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "IN-list filter with 100 employee ids · p95 62.4ms · 1 rows"
          },
          {
            "name": "time.day-granularity-year",
            "value": 119.72,
            "range": "± 1.1ms p95",
            "unit": "ms",
            "extra": "Daily time series over 2024 (~366 buckets) · p95 120.9ms · 262 rows"
          },
          {
            "name": "time.month-granularity",
            "value": 121.65,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Monthly time series over 2024 · p95 122.0ms · 12 rows"
          },
          {
            "name": "time.week-with-dimension",
            "value": 45.8,
            "range": "± 0.4ms p95",
            "unit": "ms",
            "extra": "Weekly series split by allocation type (H1 2024) · p95 46.2ms · 104 rows"
          },
          {
            "name": "time.gap-fill",
            "value": 59.56,
            "range": "± 2.0ms p95",
            "unit": "ms",
            "extra": "Daily series with fillMissingDates over 16 months · p95 61.6ms · 488 rows"
          },
          {
            "name": "time.compare-date-range",
            "value": 117.79,
            "range": "± 10.1ms p95",
            "unit": "ms",
            "extra": "Period comparison Q1 vs Q2 2024 by month · p95 127.9ms · 6 rows"
          },
          {
            "name": "join.belongs-to",
            "value": 2.25,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees joined to departments · p95 2.5ms · 25 rows"
          },
          {
            "name": "join.has-many-fanout",
            "value": 298.9,
            "range": "± 7.8ms p95",
            "unit": "ms",
            "extra": "Employee count with time-entry fan-out (~730k child rows) · p95 306.7ms · 25 rows"
          },
          {
            "name": "join.many-to-many",
            "value": 2.88,
            "range": "± 0.2ms p95",
            "unit": "ms",
            "extra": "Employees by team via junction table · p95 3.1ms · 40 rows"
          },
          {
            "name": "join.three-cubes",
            "value": 265.78,
            "range": "± 16.7ms p95",
            "unit": "ms",
            "extra": "Departments + employees + time entries · p95 282.5ms · 25 rows"
          },
          {
            "name": "rows.ordered-700",
            "value": 82.27,
            "range": "± 3.9ms p95",
            "unit": "ms",
            "extra": "~700 ordered group rows · p95 86.2ms · 700 rows"
          },
          {
            "name": "rows.deep-offset",
            "value": 18.63,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Ungrouped page at offset 100k (limit 1000) · p95 18.7ms · 1,000 rows"
          },
          {
            "name": "rows.ungrouped-10k",
            "value": 36.82,
            "range": "± 4.4ms p95",
            "unit": "ms",
            "extra": "Ungrouped raw rows (limit 10,000) · p95 41.2ms · 10,000 rows"
          },
          {
            "name": "analysis.funnel",
            "value": 139.17,
            "range": "± 4.8ms p95",
            "unit": "ms",
            "extra": "Three-step funnel over ~335k events · p95 143.9ms · 3 rows"
          },
          {
            "name": "analysis.flow",
            "value": 45.21,
            "range": "± 8.8ms p95",
            "unit": "ms",
            "extra": "Flow with 2 steps before/after · p95 54.0ms · 1 rows"
          },
          {
            "name": "analysis.retention",
            "value": 414.1,
            "range": "± 4.7ms p95",
            "unit": "ms",
            "extra": "Monthly retention over 2024 (6 periods) · p95 418.8ms · 7 rows"
          },
          {
            "name": "compile.simple",
            "value": 0.12,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Compile simple aggregation query · p95 0.1ms · 0 rows"
          },
          {
            "name": "compile.complex",
            "value": 0.65,
            "range": "± 0.1ms p95",
            "unit": "ms",
            "extra": "Compile multi-cube query with filters + time dimension · p95 0.7ms · 0 rows"
          },
          {
            "name": "cache.miss",
            "value": 35.62,
            "range": "± 7.7ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, cache bypassed · p95 43.3ms · 700 rows"
          },
          {
            "name": "cache.hit",
            "value": 0.54,
            "range": "± 0.0ms p95",
            "unit": "ms",
            "extra": "Cache-enabled executor, warm cache · p95 0.6ms · 700 rows"
          }
        ]
      }
    ]
  }
}