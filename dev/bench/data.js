window.BENCHMARK_DATA = {
  "lastUpdate": 1781665990941,
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
      }
    ]
  }
}