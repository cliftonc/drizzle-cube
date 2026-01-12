# Nivo Heatmap Chart Integration

**Date:** 2026-01-12
**Status:** Approved

## Overview

Add a general matrix heatmap chart type using nivo's `@nivo/heatmap` package. This enables visualization of intensity across two categorical dimensions (e.g., Product × Region, Hour × Day of Week).

This differs from the existing `ActivityGridChart` which is specifically designed for time-series data with cyclical patterns.

## Files to Create

### `src/client/components/charts/HeatMapChart.tsx`

Main component that:
- Accepts standard `ChartProps` interface
- Transforms drizzle-cube query results to nivo format
- Uses `ResponsiveHeatMap` from `@nivo/heatmap`
- Integrates with existing `colorPalette.gradient` system

### `src/client/components/charts/HeatMapChart.config.tsx`

Chart configuration with strict drop zones:

```typescript
export const heatmapChartConfig: ChartTypeConfig = {
  icon: getChartTypeIcon('heatmap'),
  description: 'Visualize intensity across two dimensions',
  useCase: 'Best for showing patterns in matrix data like correlations, schedules, or category comparisons',

  dropZones: [
    {
      key: 'xAxis',
      label: 'Columns (X-Axis)',
      description: 'Dimension for column categories',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop one dimension here'
    },
    {
      key: 'yAxis',
      label: 'Rows (Y-Axis)',
      description: 'Dimension for row categories',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop one dimension here'
    },
    {
      key: 'valueField',
      label: 'Value (Color Intensity)',
      description: 'Measure that determines cell color',
      mandatory: true,
      maxItems: 1,
      acceptTypes: ['measure'],
      emptyText: 'Drop one measure here'
    }
  ],

  displayOptions: ['showLegend', 'showTooltip'],
  displayOptionsConfig: [
    {
      key: 'showLabels',
      label: 'Show Cell Values',
      type: 'boolean',
      defaultValue: false,
      description: 'Display values inside each cell'
    },
    {
      key: 'cellShape',
      label: 'Cell Shape',
      type: 'select',
      defaultValue: 'rect',
      options: [
        { value: 'rect', label: 'Rectangle' },
        { value: 'circle', label: 'Circle' }
      ]
    }
  ],

  validate: (config) => {
    if (!config.xAxis?.length) return { isValid: false, message: 'X-axis dimension required' }
    if (!config.yAxis?.length) return { isValid: false, message: 'Y-axis dimension required' }
    if (!config.valueField?.length) return { isValid: false, message: 'Value measure required' }
    return { isValid: true }
  }
}
```

## Files to Modify

### `src/client/types.ts`

Add `'heatmap'` to `ChartType` union:

```typescript
export type ChartType =
  | 'line'
  | 'bar'
  // ... existing types
  | 'heatmap'  // Add this
```

### `src/client/charts/chartConfigRegistry.ts`

Register the heatmap config:

```typescript
import { heatmapChartConfig } from '../components/charts/HeatMapChart.config'

export const chartConfigRegistry: ChartConfigRegistry = {
  // ... existing entries
  heatmap: heatmapChartConfig,
}
```

### `src/client/charts/ChartLoader.tsx`

Add lazy import:

```typescript
const chartImportMap: Record<ChartType, () => Promise<{ default: LazyChartComponent }>> = {
  // ... existing entries
  heatmap: () => import('../components/charts/HeatMapChart'),
}
```

### `src/client/icons/index.ts`

Add heatmap icon using existing iconify tabler icons (e.g., `tabler:chart-grid-dots` or similar grid icon).

### `package.json`

```json
{
  "peerDependencies": {
    "@nivo/heatmap": "^0.88.0"
  },
  "peerDependenciesMeta": {
    "@nivo/heatmap": {
      "optional": true
    }
  },
  "devDependencies": {
    "@nivo/heatmap": "^0.88.0"
  }
}
```

## Data Transformation

Transform drizzle-cube flat query results to nivo's nested format:

**Input (drizzle-cube):**
```json
[
  { "Region.name": "East", "Product.category": "Electronics", "Sales.total": 1500 },
  { "Region.name": "East", "Product.category": "Clothing", "Sales.total": 800 },
  { "Region.name": "West", "Product.category": "Electronics", "Sales.total": 2100 },
  { "Region.name": "West", "Product.category": "Clothing", "Sales.total": 950 }
]
```

**Output (nivo format):**
```json
[
  {
    "id": "East",
    "data": [
      { "x": "Electronics", "y": 1500 },
      { "x": "Clothing", "y": 800 }
    ]
  },
  {
    "id": "West",
    "data": [
      { "x": "Electronics", "y": 2100 },
      { "x": "Clothing", "y": 950 }
    ]
  }
]
```

**Transformation steps:**
1. Extract field names from `chartConfig` (xAxis[0], yAxis[0], valueField[0])
2. Group input data by Y-axis dimension value
3. For each group, map to `{ x: xAxisValue, y: measureValue }`
4. Handle missing combinations (sparse matrices) with empty cells

## Error Handling

| Scenario | Behavior |
|----------|----------|
| No data | Show "No data available" message |
| Missing config | Show "Configuration required" with specific field |
| Sparse matrix | Render empty cells with neutral color |
| Non-numeric measure | Coerce to number, fallback to 0 |
| Null dimension values | Filter out or show as "(empty)" |

## Color Scale

Uses existing `colorPalette.gradient` system:
- Same palette picker as other charts
- Gradient array maps to nivo's `colors` prop
- Consistent user experience across chart types

## Testing

```typescript
// tests/client/charts/HeatMapChart.test.tsx

describe('HeatMapChart', () => {
  // Rendering
  it('renders heatmap with valid data and config')
  it('shows empty state when no data provided')
  it('shows config required message when fields missing')

  // Data transformation
  it('transforms flat query results to nivo format')
  it('handles sparse matrices')
  it('handles null/undefined dimension values')
  it('coerces string measure values to numbers')

  // Display config
  it('respects showLabels option')
  it('respects cellShape option')
  it('respects showLegend option')
  it('applies colorPalette gradient')

  // Integration
  it('works with LazyChart loader')
  it('registers correctly in chartConfigRegistry')
})
```

## Future Considerations

- Canvas rendering for large matrices (50+ categories)
- Additional nivo charts can be added following this same pattern
- Each new nivo chart = one new peer dependency
