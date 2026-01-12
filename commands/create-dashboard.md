---
name: create-dashboard
description: Create a new Drizzle Cube dashboard configuration
allowed-tools:
  - Read
  - Write
  - Glob
---

# Create Dashboard Command

Help me create a new dashboard configuration for Drizzle Cube.

## Arguments
- `$1` - Dashboard name/title (e.g., "Sales Overview", "HR Dashboard")

## Instructions

1. **Create the DashboardConfig structure:**

```typescript
import type { DashboardConfig } from 'drizzle-cube/client'

export const ${dashboardName}Dashboard: DashboardConfig = {
  layoutMode: 'grid',

  grid: {
    cols: 12,
    rowHeight: 80,
    minW: 2,
    minH: 2
  },

  colorPalette: 'default',

  filters: [
    // Dashboard-level filters (optional)
  ],

  portlets: [
    // Chart widgets go here
  ]
}
```

2. **Ask about dashboard content:**
   - What data should this dashboard show?
   - What metrics are most important (KPIs)?
   - What trends should be visualized?
   - What comparisons are needed?

3. **Suggest a layout based on common patterns:**

**Executive Dashboard:**
- Row 1: 4 KPI numbers (w:3 each)
- Row 2: Main trend line chart (w:8) + pie chart (w:4)
- Row 3: Data table (w:12)

**Sales Dashboard:**
- Row 1: Revenue KPI (w:3), Orders KPI (w:3), AOV KPI (w:3), Conversion KPI (w:3)
- Row 2: Revenue trend (w:6) + Revenue by region (w:6)
- Row 3: Top products table (w:6) + Top customers table (w:6)

**Operations Dashboard:**
- Row 1: Status summary (w:12)
- Row 2: Activity timeline (w:8) + Distribution pie (w:4)
- Row 3: Detailed metrics table (w:12)

4. **For each portlet, generate proper config:**

```typescript
{
  id: 'unique-id',
  title: 'Chart Title',
  w: 6,  // Grid width (1-12)
  h: 4,  // Grid height
  x: 0,  // X position (0-11)
  y: 0,  // Y position (row)
  analysisConfig: {
    version: 1,
    analysisType: 'query',
    activeView: 'chart',
    charts: {
      query: {
        chartType: 'bar',  // or line, pie, kpiNumber, etc.
        chartConfig: {
          xAxis: ['Cube.dimension'],
          yAxis: ['Cube.measure']
        },
        displayConfig: {
          showLegend: true
        }
      }
    },
    query: {
      measures: ['Cube.measure'],
      dimensions: ['Cube.dimension']
    }
  }
}
```

5. **Ask about filters:**
   - Should there be a global date filter?
   - Any dimension filters (region, category, etc.)?
   - Create `DashboardFilter` objects and map to portlets

6. **Write the dashboard file** to `src/dashboards/${dashboardName}.ts` or similar

## Output
Provide:
- Complete DashboardConfig with all portlets
- Appropriate chart types for each metric
- Logical grid layout
- Any suggested dashboard filters
