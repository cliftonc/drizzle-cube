window.BENCHMARK_DATA = {
  "lastUpdate": 1781417706931,
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
      }
    ]
  }
}