---
name: query
description: Build a semantic query interactively for Drizzle Cube
allowed-tools:
  - Read
  - Glob
  - Grep
---

# Query Command

Help me build a semantic query for Drizzle Cube.

## Arguments
- `$ARGUMENTS` - Natural language description of what to query (optional)

## Instructions

1. **Find available cubes:**
   - Search for `defineCube` in the codebase
   - List all registered cubes with their measures and dimensions
   - Or check if there's a running Drizzle Cube API to fetch `/meta`

2. **If user provided a description**, analyze it:
   - "Count of orders by region" → measures: count, dimensions: region
   - "Revenue trend over time" → measures: revenue, timeDimension with granularity
   - "Top 10 customers by spend" → measures: spend, dimensions: customer, order: desc, limit: 10

3. **Ask clarifying questions:**
   - Which cube(s) should I query?
   - What metrics (measures) do you want to see?
   - How should the data be grouped (dimensions)?
   - Any filters to apply?
   - Time period or granularity needed?

4. **Build the CubeQuery:**

```typescript
const query: CubeQuery = {
  measures: ['CubeName.measureName'],
  dimensions: ['CubeName.dimensionName'],
  timeDimensions: [{
    dimension: 'CubeName.createdAt',
    granularity: 'month',
    dateRange: ['2024-01-01', '2024-12-31']
  }],
  filters: [{
    member: 'CubeName.status',
    operator: 'equals',
    values: ['active']
  }],
  order: {
    'CubeName.measureName': 'desc'
  },
  limit: 100
}
```

5. **Validate the query:**
   - All referenced fields exist in the cubes
   - Filter operators match field types
   - Date formats are correct (YYYY-MM-DD)

6. **Offer output options:**
   - Just the query object (for code)
   - Full AnalysisConfig (for dashboard portlets)
   - cURL command to test the API

**Query Object:**
```typescript
{
  measures: ['Sales.totalRevenue'],
  dimensions: ['Products.category'],
  order: { 'Sales.totalRevenue': 'desc' },
  limit: 10
}
```

**As AnalysisConfig:**
```typescript
{
  version: 1,
  analysisType: 'query',
  activeView: 'chart',
  charts: {
    query: {
      chartType: 'bar',
      chartConfig: { xAxis: ['Products.category'], yAxis: ['Sales.totalRevenue'] },
      displayConfig: { showLegend: false }
    }
  },
  query: {
    measures: ['Sales.totalRevenue'],
    dimensions: ['Products.category'],
    order: { 'Sales.totalRevenue': 'desc' },
    limit: 10
  }
}
```

**As cURL:**
```bash
curl -X POST http://localhost:4000/cubejs-api/v1/load \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"measures":["Sales.totalRevenue"],"dimensions":["Products.category"]}'
```

## Output
- The complete CubeQuery object
- Explanation of what the query does
- Suggested chart type for visualization
- Optional: AnalysisConfig wrapper
