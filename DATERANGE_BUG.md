# Date Range Filter Bug Report

## Bug Description

The `dateRange` filter in `timeDimensions` is being completely ignored when querying data, resulting in charts showing ALL data instead of the filtered time range.

## Reproduction

**Query:**
```json
{
  "measures": ["Issues.count", "Issues.closedCount"],
  "timeDimensions": [
    {
      "dimension": "Issues.createdAt",
      "granularity": "week",
      "dateRange": "last 12 weeks"
    }
  ],
  "order": { "Issues.createdAt": "asc" }
}
```

**Expected Result:**
- Chart shows data for the last 12 weeks (84 days)
- Date range: approximately 2025-08-26 to 2025-11-17 (if today is 2025-11-17)

**Actual Result:**
- Chart shows data for the entire dataset (365 days in this case)
- Date range: 2024-11-18 to 2025-11-17 (full year!)
- The `dateRange: "last 12 weeks"` filter is completely ignored

## Impact

**Severity**: CRITICAL

This bug affects:
1. **All time-based charts** - showing incorrect data ranges
2. **Performance** - queries return way more data than needed
3. **User experience** - chart titles say "Last 3 Months" but show a full year
4. **Data accuracy** - KPIs and aggregations are calculated over wrong time periods

## Environment

- **drizzle-cube version**: 0.1.41
- **Database**: PostgreSQL (Neon serverless)
- **Frontend**: React with AnalyticsPortlet component

## Additional Context

The query syntax is correct according to your documentation example:
```json
{
  "timeDimensions": [
    {
      "dimension": "Employees.createdAt",
      "granularity": "month",
      "dateRange": "last 15 weeks"
    }
  ]
}
```

But in practice, the filter doesn't work.

## Potential Causes

1. The `buildDateRangeCondition()` method in `query-builder.ts` might not be called
2. The WHERE clause with date conditions isn't being added to the SQL
3. The `parseRelativeDateRange()` might not handle "last N weeks" pattern
4. The date filter might only work with `granularity: "week"` but not with other granularities

## Workaround Needed

For now, we can try:
- Using `"last 84 days"` instead of `"last 12 weeks"`
- Using explicit date arrays: `["2025-08-26", "2025-11-17"]`

But this defeats the purpose of relative date ranges!

## Test Case

**Setup:**
1. Create a cube with a date dimension
2. Seed data spanning 365 days
3. Query with `dateRange: "last 12 weeks"`
4. Check the SQL generated and the WHERE clause

**Expected SQL** (simplified):
```sql
SELECT ...
FROM issues
WHERE created_at >= '2025-08-27' AND created_at <= '2025-11-20'
GROUP BY ...
```

**Actual SQL** (suspected):
```sql
SELECT ...
FROM issues
-- NO WHERE CLAUSE FOR DATE FILTERING!
GROUP BY ...
```

## Confirmed Evidence

**API Request/Response captured on 2025-11-20:**

Query sent:
```json
{
  "measures": ["Issues.count", "Issues.closedCount"],
  "timeDimensions": [{
    "dimension": "Issues.createdAt",
    "granularity": "week",
    "dateRange": "last 12 weeks"
  }]
}
```

Data returned: **51 data points** spanning from `2024-11-18` to `2025-11-17` (52 weeks!)

Expected: **12 data points** spanning from `2025-08-27` to `2025-11-20` (12 weeks)

**Conclusion:**
- The `dateRange` parameter IS being sent correctly
- The `transformedQuery` preserves the `dateRange` field
- BUT the SQL query is NOT filtering the data
- The WHERE clause for date filtering is missing or incorrect

## Root Cause

The bug is in `src/server/query-builder.ts`:
- The `buildDateRangeCondition()` method at line ~858
- The `parseRelativeDateRange()` method at line ~967

One of these is not handling "last N weeks" correctly, despite the code appearing to support days and months.

## Request

Please investigate why the `dateRange` filter isn't being applied to the generated SQL queries. This is blocking production deployment of analytics dashboards.

**Priority**: CRITICAL - affects all time-based analytics
