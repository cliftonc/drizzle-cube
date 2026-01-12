---
name: add-chart
description: Add a new chart/portlet to an existing Drizzle Cube dashboard
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
---

# Add Chart Command

Help me add a new chart to an existing dashboard.

## Arguments
- `$1` - Chart description or type (e.g., "revenue by region bar chart", "monthly trend")

## Instructions

1. **Find existing dashboard configs:**
   - Search for `DashboardConfig` in the codebase
   - Look in `src/dashboards/`, `src/config/`, or similar
   - List available dashboards if multiple found

2. **Ask which dashboard to modify** if not clear

3. **Read the existing dashboard** to understand:
   - Current portlets and their positions
   - Grid configuration
   - Existing filters
   - Color palette

4. **Determine next available position:**
   - Find the maximum y value in existing portlets
   - Calculate where the new chart should go
   - Suggest appropriate width based on chart type

5. **Based on the description ($1), suggest:**

**For "KPI" or "number":**
```typescript
{
  id: 'new-kpi',
  title: 'KPI Title',
  w: 3, h: 2, x: 0, y: nextY,
  analysisConfig: {
    version: 1,
    analysisType: 'query',
    activeView: 'chart',
    charts: {
      query: {
        chartType: 'kpiNumber',
        chartConfig: { yAxis: ['Cube.measure'] },
        displayConfig: { prefix: '', decimals: 0 }
      }
    },
    query: { measures: ['Cube.measure'] }
  }
}
```

**For "bar" or "comparison":**
```typescript
{
  id: 'new-bar',
  title: 'Bar Chart Title',
  w: 6, h: 4, x: 0, y: nextY,
  analysisConfig: {
    version: 1,
    analysisType: 'query',
    activeView: 'chart',
    charts: {
      query: {
        chartType: 'bar',
        chartConfig: { xAxis: ['Cube.dimension'], yAxis: ['Cube.measure'] },
        displayConfig: { showLegend: true }
      }
    },
    query: {
      measures: ['Cube.measure'],
      dimensions: ['Cube.dimension']
    }
  }
}
```

**For "trend" or "line":**
```typescript
{
  id: 'new-line',
  title: 'Trend Chart',
  w: 8, h: 4, x: 0, y: nextY,
  analysisConfig: {
    version: 1,
    analysisType: 'query',
    activeView: 'chart',
    charts: {
      query: {
        chartType: 'line',
        chartConfig: { xAxis: ['Cube.createdAt'], yAxis: ['Cube.measure'] },
        displayConfig: { showLegend: true, showGrid: true }
      }
    },
    query: {
      measures: ['Cube.measure'],
      timeDimensions: [{
        dimension: 'Cube.createdAt',
        granularity: 'month'
      }]
    }
  }
}
```

**For "table":**
```typescript
{
  id: 'new-table',
  title: 'Data Table',
  w: 12, h: 5, x: 0, y: nextY,
  analysisConfig: {
    version: 1,
    analysisType: 'query',
    activeView: 'table',
    charts: {
      query: {
        chartType: 'table',
        chartConfig: {},
        displayConfig: {}
      }
    },
    query: {
      measures: ['Cube.measure1', 'Cube.measure2'],
      dimensions: ['Cube.dimension1', 'Cube.dimension2'],
      limit: 100
    }
  }
}
```

6. **Generate unique ID** based on chart content

7. **Ask about specific cube/measures/dimensions:**
   - Which cube should this query?
   - What measures to show?
   - How to group the data?
   - Any filters needed?

8. **Ask about dashboard filter mapping:**
   - Should this chart respond to dashboard filters?
   - Add `dashboardFilterMapping: ['filterId']` if yes

9. **Update the dashboard file:**
   - Add the new portlet to the `portlets` array
   - Ensure grid positions don't overlap

## Output
- The new portlet configuration
- Updated dashboard file with the new chart
- Confirm the grid position is valid
