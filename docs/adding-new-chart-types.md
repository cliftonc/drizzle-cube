# Adding New Chart Types to Drizzle-Cube

This document provides a comprehensive checklist for adding new chart types to Drizzle-Cube. Follow each step to ensure complete integration across the frontend architecture.

## Architecture Overview

Drizzle-Cube uses a **registry-based architecture** for charts:

1. **Chart Component** - Renders the visualization (typically using Recharts or Nivo)
2. **Chart Configuration** - Defines drop zones (axis mapping) and display options
3. **Chart Loader** - Lazy loads charts with fallback handling for missing dependencies
4. **Icon Registry** - Provides icons for chart type selection UI

```
┌─────────────────────────────────────────────────────────────┐
│                    Chart Architecture                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  types.ts ──────────────► ChartType union                   │
│       │                                                     │
│       ▼                                                     │
│  chartConfigRegistry.ts ──► Sync config imports             │
│  lazyChartConfigRegistry.ts ► Async config imports          │
│  ChartLoader.tsx ────────► Lazy component imports           │
│       │                                                     │
│       ▼                                                     │
│  {ChartName}.tsx ────────► Chart component                  │
│  {ChartName}.config.tsx ─► Drop zones + display options     │
│       │                                                     │
│       ▼                                                     │
│  defaultIcons.ts ────────► Icon definition                  │
│  registry.tsx ───────────► Icon lookup mapping              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Checklist

### 1. Add Chart Type to Type Definitions

**File:** `src/client/types.ts`

Add the new chart type to the `ChartType` union:

```typescript
export type ChartType =
  | 'line'
  | 'bar'
  // ... existing types
  | 'yourNewChart'  // Add here alphabetically or logically grouped
```

**Also add any chart-specific fields to `ChartAxisConfig` if needed:**

```typescript
export interface ChartAxisConfig {
  // ... existing fields

  // Your chart specific fields (if needed)
  yourField?: string[]
}
```

---

### 2. Create Chart Component

**File:** `src/client/components/charts/{ChartName}.tsx`

Create the chart component that renders the visualization:

```typescript
import { memo } from 'react'
import { ResponsiveContainer } from 'recharts'  // or @nivo/* for Nivo charts
import type { ChartProps } from '../../types'

function YourNewChartComponent({
  data,
  chartConfig,
  displayConfig,
  height = 300,
  colorPalette,
  fieldLabels,
}: ChartProps) {
  // Transform data if needed
  const chartData = transformData(data, chartConfig)

  // Get colors from palette
  const colors = getColors(colorPalette)

  return (
    <ResponsiveContainer width="100%" height={height}>
      {/* Your chart implementation */}
    </ResponsiveContainer>
  )
}

export default memo(YourNewChartComponent)
```

**Key props to handle:**
- `data` - Query result data
- `chartConfig` - Axis mappings (xAxis, yAxis, series, etc.)
- `displayConfig` - Display options (showLegend, colors, etc.)
- `height` - Container height
- `colorPalette` - Color scheme
- `fieldLabels` - Human-readable field labels

---

### 3. Create Chart Configuration

**File:** `src/client/components/charts/{ChartName}.config.tsx`

Define the chart's drop zones and display options:

```typescript
import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

export const yourNewChartConfig: ChartTypeConfig = {
  icon: getChartTypeIcon('yourNewChart'),
  description: 'Brief description of the chart',
  useCase: 'Best for showing X type of data',

  // Define drop zones for axis configuration
  dropZones: [
    {
      key: 'xAxis',
      label: 'X-Axis (Categories)',
      description: 'Dimensions for grouping',
      mandatory: true,
      maxItems: 1,  // or undefined for unlimited
      acceptTypes: ['dimension', 'timeDimension'],
      emptyText: 'Drop dimension here',
    },
    {
      key: 'yAxis',
      label: 'Y-Axis (Values)',
      description: 'Measures for values',
      mandatory: true,
      acceptTypes: ['measure'],
      enableDualAxis: false,  // true for dual Y-axis support
      emptyText: 'Drop measures here',
    },
    {
      key: 'series',
      label: 'Series (Split)',
      description: 'Dimension to split into series',
      mandatory: false,
      maxItems: 1,
      acceptTypes: ['dimension'],
      emptyText: 'Drop dimension for series',
    },
  ],

  // Simple boolean display options
  displayOptions: ['showLegend', 'showGrid', 'showTooltip'],

  // Structured display options with full control
  displayOptionsConfig: [
    {
      key: 'showLabels',
      label: 'Show Labels',
      type: 'boolean',
      defaultValue: true,
      description: 'Display labels on the chart',
    },
    {
      key: 'orientation',
      label: 'Orientation',
      type: 'select',
      defaultValue: 'horizontal',
      options: [
        { value: 'horizontal', label: 'Horizontal' },
        { value: 'vertical', label: 'Vertical' },
      ],
    },
    {
      key: 'xAxisFormat',
      label: 'X-Axis Format',
      type: 'axisFormat',
      description: 'Number formatting for X-axis',
    },
  ],

  // Optional validation function
  validate: (config) => {
    if (!config.xAxis?.length) {
      return { isValid: false, message: 'X-axis required' }
    }
    if (!config.yAxis?.length) {
      return { isValid: false, message: 'Y-axis required' }
    }
    return { isValid: true }
  },

  // Set to true for content-only charts (markdown, KPIs without queries)
  skipQuery: false,
}
```

**Drop Zone Config Options:**
| Property | Type | Description |
|----------|------|-------------|
| `key` | string | Storage key in chartConfig |
| `label` | string | Display label |
| `description` | string | Help text |
| `mandatory` | boolean | Required field |
| `maxItems` | number | Max fields allowed |
| `acceptTypes` | array | 'dimension', 'timeDimension', 'measure' |
| `enableDualAxis` | boolean | Enable L/R axis toggle |
| `emptyText` | string | Placeholder text |

**Display Option Types:**
| Type | Description |
|------|-------------|
| `boolean` | Toggle checkbox |
| `string` | Text input |
| `number` | Number input with min/max/step |
| `select` | Dropdown with options |
| `color` | Color picker |
| `paletteColor` | Color from palette |
| `axisFormat` | Axis formatting controls |
| `stringArray` | Multiple string values |
| `buttonGroup` | Segmented button selection |

---

### 4. Register in Chart Config Registry (Sync)

**File:** `src/client/charts/chartConfigRegistry.ts`

Add the import and registry entry:

```typescript
// Add import
import { yourNewChartConfig } from '../components/charts/YourNewChart.config'

// Add to registry
export const chartConfigRegistry: ChartConfigRegistry = {
  // ... existing entries
  yourNewChart: yourNewChartConfig,
}
```

---

### 5. Register in Lazy Chart Config Registry (Async)

**File:** `src/client/charts/lazyChartConfigRegistry.ts`

Add entries to both maps:

```typescript
// Add to configImportMap
const configImportMap: Record<ChartType, () => Promise<{ [key: string]: ChartTypeConfig }>> = {
  // ... existing entries
  yourNewChart: () => import('../components/charts/YourNewChart.config'),
}

// Add to configExportNames
const configExportNames: Record<ChartType, string> = {
  // ... existing entries
  yourNewChart: 'yourNewChartConfig',
}
```

---

### 6. Register in Chart Loader

**File:** `src/client/charts/ChartLoader.tsx`

Add entries for lazy loading:

```typescript
// Add to chartDependencyMap (if chart has external dependencies)
const chartDependencyMap: Partial<Record<ChartType, { packageName: string; installCommand: string }>> = {
  // ... existing entries
  yourNewChart: {
    packageName: 'recharts',  // or '@nivo/yourChart'
    installCommand: 'npm install recharts'
  },
}

// Add to chartImportMap
const chartImportMap: Record<ChartType, () => Promise<{ default: LazyChartComponent }>> = {
  // ... existing entries
  yourNewChart: () => import('../components/charts/YourNewChart'),
}
```

---

### 7. Add Chart Icon

**File:** `src/client/icons/defaultIcons.ts`

Add the icon import and registry entry:

```typescript
// Add import (use Tabler or custom icon)
import yourChartIcon from '@iconify-icons/tabler/chart-your-type'
// OR create custom icon in customIcons.ts

// Add to DEFAULT_ICONS
export const DEFAULT_ICONS: IconRegistry = {
  // ... existing entries

  // Chart type icons
  chartYourNewChart: { icon: yourChartIcon, category: 'chart' },
}
```

**File:** `src/client/icons/registry.tsx`

Add to the chart type icon mapping:

```typescript
export function getChartTypeIcon(chartType: string): ComponentType<IconProps> {
  const typeMap: Record<string, IconName> = {
    // ... existing entries
    yourNewChart: 'chartYourNewChart',
  }
  // ...
}
```

---

### 8. Add to Exports (if needed)

**File:** `src/client/index.ts`

Export any public types or components:

```typescript
// Export chart-specific types if needed
export type { YourNewChartData } from './types/yourNewChart'
```

---

### 9. Update AI Prompts (Skills)

Update the relevant AI skills to include the new chart type:

**Files to update:**
- `~/.claude/skills/drizzle-cube/dc-chart-config/SKILL.md` - Add chart configuration documentation
- `~/.claude/skills/drizzle-cube/dc-analysis-config/SKILL.md` - Add to available chart types list

Include:
- Chart type name and description
- When to use this chart
- Required and optional axis mappings
- Available display options
- Example configuration

---

### 10. Testing

Create tests for the new chart:

**File:** `src/client/components/charts/{ChartName}.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import YourNewChart from './YourNewChart'

describe('YourNewChart', () => {
  const mockData = [
    { category: 'A', value: 100 },
    { category: 'B', value: 200 },
  ]

  it('renders without crashing', () => {
    render(
      <YourNewChart
        data={mockData}
        chartConfig={{ xAxis: ['category'], yAxis: ['value'] }}
        displayConfig={{}}
        height={300}
      />
    )
    // Add assertions
  })

  it('handles empty data gracefully', () => {
    render(
      <YourNewChart
        data={[]}
        chartConfig={{ xAxis: ['category'], yAxis: ['value'] }}
        displayConfig={{}}
        height={300}
      />
    )
    // Verify empty state handling
  })
})
```

**Manual testing checklist:**
- [ ] Chart renders correctly with sample data
- [ ] Drop zones accept correct field types
- [ ] Display options work as expected
- [ ] Chart handles empty/null data gracefully
- [ ] Lazy loading works (check network tab)
- [ ] Missing dependency shows helpful fallback
- [ ] Chart is responsive to container size
- [ ] Colors from palette are applied correctly
- [ ] Tooltips show correct values
- [ ] Legend displays properly (if enabled)

---

## Quick Reference: Files to Modify

| Step | File | Action |
|------|------|--------|
| 1 | `src/client/types.ts` | Add to ChartType union |
| 2 | `src/client/components/charts/{Name}.tsx` | Create chart component |
| 3 | `src/client/components/charts/{Name}.config.tsx` | Create chart config |
| 4 | `src/client/charts/chartConfigRegistry.ts` | Add sync import |
| 5 | `src/client/charts/lazyChartConfigRegistry.ts` | Add async import (2 places) |
| 6 | `src/client/charts/ChartLoader.tsx` | Add dependency + import map |
| 7a | `src/client/icons/defaultIcons.ts` | Add icon definition |
| 7b | `src/client/icons/registry.tsx` | Add icon mapping |
| 8 | `src/client/index.ts` | Export types (if needed) |
| 9 | AI Skills (dc-chart-config, dc-analysis-config) | Update documentation |
| 10 | `src/client/components/charts/{Name}.test.tsx` | Add tests |

---

## Common Patterns

### Data Transformation

Most charts need to transform query results into chart-specific formats:

```typescript
function transformData(data: Record<string, unknown>[], chartConfig: ChartAxisConfig) {
  const xField = chartConfig.xAxis?.[0]
  const yFields = chartConfig.yAxis || []
  const seriesField = chartConfig.series?.[0]

  // Transform based on chart requirements
  return data.map(row => ({
    name: row[xField],
    ...yFields.reduce((acc, field) => ({
      ...acc,
      [field]: row[field]
    }), {})
  }))
}
```

### Color Handling

Use the color palette system:

```typescript
import { getColorPalette } from '../../utils/colorPalettes'

function YourChart({ colorPalette, ...props }) {
  const colors = getColorPalette(colorPalette || 'default')
  // Use colors[0], colors[1], etc.
}
```

### Responsive Containers

Always wrap charts in ResponsiveContainer for proper sizing:

```typescript
import { ResponsiveContainer } from 'recharts'

<ResponsiveContainer width="100%" height={height}>
  <YourChart {...props} />
</ResponsiveContainer>
```

---

## Example: Adding a Heatmap Chart

For a complete example, see the heatmap implementation:
- `src/client/components/charts/HeatMapChart.tsx`
- `src/client/components/charts/HeatMapChart.config.tsx`

Key aspects:
- Uses `@nivo/heatmap` instead of Recharts
- Has custom drop zones: xAxis, yAxis, valueField
- Custom display options for cell shape, labels, formatting
