# Nivo Heatmap Chart Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a general matrix heatmap chart type using nivo's `@nivo/heatmap` package.

**Architecture:** Transform drizzle-cube flat query results to nivo's nested format, integrate with existing palette system, and follow established chart component patterns.

**Tech Stack:** React, @nivo/heatmap, TypeScript, Vitest for testing

---

## Task 1: Add @nivo/heatmap Dependency

**Files:**
- Modify: `package.json`

**Step 1: Add the dependency**

```bash
cd /Users/cliftonc/.config/superpowers/worktrees/drizzle-cube/feature-nivo-heatmap
npm install @nivo/heatmap --save-dev
```

**Step 2: Update package.json peer dependencies**

Add to `peerDependencies` section (after `recharts`):
```json
"@nivo/heatmap": "^0.88.0"
```

Add to `peerDependenciesMeta` section:
```json
"@nivo/heatmap": {
  "optional": true
}
```

**Step 3: Verify installation**

```bash
npm ls @nivo/heatmap
```

Expected: Shows @nivo/heatmap installed

**Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @nivo/heatmap dependency

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Add 'heatmap' to ChartType Union

**Files:**
- Modify: `src/client/types.ts:55-74`

**Step 1: Add heatmap to ChartType union**

Find the `ChartType` union (around line 55) and add `'heatmap'` after `'sunburst'`:

```typescript
export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'table'
  | 'area'
  | 'scatter'
  | 'radar'
  | 'radialBar'
  | 'treemap'
  | 'bubble'
  | 'activityGrid'
  | 'kpiNumber'
  | 'kpiDelta'
  | 'kpiText'
  | 'markdown'
  | 'funnel'
  | 'sankey'
  | 'sunburst'
  | 'heatmap'
```

**Step 2: Verify typecheck passes**

```bash
npm run typecheck
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/client/types.ts
git commit -m "feat(client): add heatmap to ChartType union

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Add Heatmap Icon

**Files:**
- Modify: `src/client/icons/defaultIcons.ts`
- Modify: `src/client/icons/registry.tsx`

**Step 1: Import heatmap icon in defaultIcons.ts**

Add import after other tabler imports (around line 79):
```typescript
import chartGridDots from '@iconify-icons/tabler/chart-grid-dots'
```

Add to DEFAULT_ICONS chart section (after chartSunburst, around line 143):
```typescript
chartHeatmap: { icon: chartGridDots, category: 'chart' },
```

**Step 2: Add to getChartTypeIcon in registry.tsx**

Find `getChartTypeIcon` function (line 166) and add to the typeMap (after sunburst):
```typescript
heatmap: 'chartHeatmap',
```

**Step 3: Verify build passes**

```bash
npm run build:client
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/client/icons/defaultIcons.ts src/client/icons/registry.tsx
git commit -m "feat(client): add heatmap chart icon

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Create HeatMapChart.config.tsx

**Files:**
- Create: `src/client/components/charts/HeatMapChart.config.tsx`

**Step 1: Create the config file**

```typescript
import type { ChartTypeConfig } from '../../charts/chartConfigs'
import { getChartTypeIcon } from '../../icons'

/**
 * Configuration for the heatmap chart type
 */
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

**Step 2: Verify typecheck**

```bash
npm run typecheck
```

Expected: No errors

**Step 3: Commit**

```bash
git add src/client/components/charts/HeatMapChart.config.tsx
git commit -m "feat(client): add heatmap chart configuration

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Create HeatMapChart Test File

**Files:**
- Create: `tests/client/charts/HeatMapChart.test.tsx`

**Step 1: Create test file with failing tests**

```typescript
/**
 * Tests for HeatMapChart component
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import HeatMapChart from '../../../src/client/components/charts/HeatMapChart'

// Mock the icon system
vi.mock('../../../src/client/icons', () => ({
  getIcon: () => null,
}))

// Mock nivo heatmap to avoid canvas issues in tests
vi.mock('@nivo/heatmap', () => ({
  ResponsiveHeatMap: ({ data }: { data: unknown[] }) => (
    <div data-testid="nivo-heatmap">
      {data.map((row: any, i: number) => (
        <div key={i} data-testid={`heatmap-row-${row.id}`}>
          {row.id}: {row.data.length} cells
        </div>
      ))}
    </div>
  ),
}))

// Sample heatmap data (drizzle-cube format)
const sampleData = [
  { 'Region.name': 'East', 'Product.category': 'Electronics', 'Sales.total': 1500 },
  { 'Region.name': 'East', 'Product.category': 'Clothing', 'Sales.total': 800 },
  { 'Region.name': 'West', 'Product.category': 'Electronics', 'Sales.total': 2100 },
  { 'Region.name': 'West', 'Product.category': 'Clothing', 'Sales.total': 950 },
]

const sampleChartConfig = {
  xAxis: ['Product.category'],
  yAxis: ['Region.name'],
  valueField: ['Sales.total'],
}

describe('HeatMapChart', () => {
  describe('empty state', () => {
    it('should render empty state message when data is null', () => {
      render(<HeatMapChart data={null as unknown as unknown[]} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should render empty state message when data is empty array', () => {
      render(<HeatMapChart data={[]} />)
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })
  })

  describe('configuration required state', () => {
    it('should show config required when xAxis is missing', () => {
      render(
        <HeatMapChart
          data={sampleData}
          chartConfig={{ yAxis: ['Region.name'], valueField: ['Sales.total'] }}
        />
      )
      expect(screen.getByText('Configuration Required')).toBeInTheDocument()
    })

    it('should show config required when yAxis is missing', () => {
      render(
        <HeatMapChart
          data={sampleData}
          chartConfig={{ xAxis: ['Product.category'], valueField: ['Sales.total'] }}
        />
      )
      expect(screen.getByText('Configuration Required')).toBeInTheDocument()
    })

    it('should show config required when valueField is missing', () => {
      render(
        <HeatMapChart
          data={sampleData}
          chartConfig={{ xAxis: ['Product.category'], yAxis: ['Region.name'] }}
        />
      )
      expect(screen.getByText('Configuration Required')).toBeInTheDocument()
    })
  })

  describe('rendering with valid config', () => {
    it('should render heatmap with valid data and config', () => {
      render(
        <HeatMapChart
          data={sampleData}
          chartConfig={sampleChartConfig}
        />
      )
      expect(screen.getByTestId('nivo-heatmap')).toBeInTheDocument()
    })

    it('should transform data correctly - creates rows for each Y value', () => {
      render(
        <HeatMapChart
          data={sampleData}
          chartConfig={sampleChartConfig}
        />
      )
      expect(screen.getByTestId('heatmap-row-East')).toBeInTheDocument()
      expect(screen.getByTestId('heatmap-row-West')).toBeInTheDocument()
    })
  })

  describe('data transformation', () => {
    it('should handle sparse matrices', () => {
      const sparseData = [
        { 'Region.name': 'East', 'Product.category': 'Electronics', 'Sales.total': 1500 },
        { 'Region.name': 'West', 'Product.category': 'Clothing', 'Sales.total': 950 },
      ]
      render(
        <HeatMapChart
          data={sparseData}
          chartConfig={sampleChartConfig}
        />
      )
      expect(screen.getByTestId('nivo-heatmap')).toBeInTheDocument()
    })

    it('should coerce string measure values to numbers', () => {
      const stringValueData = [
        { 'Region.name': 'East', 'Product.category': 'Electronics', 'Sales.total': '1500' },
      ]
      render(
        <HeatMapChart
          data={stringValueData}
          chartConfig={sampleChartConfig}
        />
      )
      expect(screen.getByTestId('nivo-heatmap')).toBeInTheDocument()
    })

    it('should filter out null dimension values', () => {
      const nullData = [
        { 'Region.name': null, 'Product.category': 'Electronics', 'Sales.total': 1500 },
        { 'Region.name': 'East', 'Product.category': 'Electronics', 'Sales.total': 800 },
      ]
      render(
        <HeatMapChart
          data={nullData}
          chartConfig={sampleChartConfig}
        />
      )
      // Should only have East row, not null
      expect(screen.queryByTestId('heatmap-row-null')).not.toBeInTheDocument()
      expect(screen.getByTestId('heatmap-row-East')).toBeInTheDocument()
    })
  })

  describe('height prop', () => {
    it('should apply custom height', () => {
      const { container } = render(
        <HeatMapChart
          data={sampleData}
          chartConfig={sampleChartConfig}
          height="500px"
        />
      )
      const chartContainer = container.firstChild
      expect(chartContainer).toHaveStyle({ height: '500px' })
    })

    it('should use 100% height by default', () => {
      const { container } = render(
        <HeatMapChart
          data={sampleData}
          chartConfig={sampleChartConfig}
        />
      )
      const chartContainer = container.firstChild
      expect(chartContainer).toHaveStyle({ height: '100%' })
    })
  })
})
```

**Step 2: Run tests to verify they fail**

```bash
npm run test:client -- tests/client/charts/HeatMapChart.test.tsx
```

Expected: Tests fail because HeatMapChart doesn't exist yet

**Step 3: Commit failing tests**

```bash
mkdir -p tests/client/charts
git add tests/client/charts/HeatMapChart.test.tsx
git commit -m "test(client): add failing tests for HeatMapChart

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Create HeatMapChart Component

**Files:**
- Create: `src/client/components/charts/HeatMapChart.tsx`

**Step 1: Create the component**

```typescript
import React, { useMemo } from 'react'
import { ResponsiveHeatMap } from '@nivo/heatmap'
import { CHART_COLORS_GRADIENT } from '../../utils/chartConstants'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel'
import type { ChartProps } from '../../types'

interface HeatMapDatum {
  x: string
  y: number | null
}

interface HeatMapSerieData {
  id: string
  data: HeatMapDatum[]
}

const HeatMapChart = React.memo(function HeatMapChart({
  data,
  chartConfig,
  displayConfig = {},
  height = '100%',
  colorPalette
}: ChartProps) {
  const getFieldLabel = useCubeFieldLabel()

  const safeDisplayConfig = useMemo(() => ({
    showTooltip: displayConfig?.showTooltip ?? true,
    showLegend: displayConfig?.showLegend ?? true,
    showLabels: displayConfig?.showLabels ?? false,
    cellShape: (displayConfig?.cellShape as 'rect' | 'circle') ?? 'rect'
  }), [displayConfig?.showTooltip, displayConfig?.showLegend, displayConfig?.showLabels, displayConfig?.cellShape])

  // Validate data
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-full text-dc-text-muted"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">No data available</div>
          <div className="text-xs text-dc-text-secondary">No data points to display in heatmap</div>
        </div>
      </div>
    )
  }

  // Validate config
  const xAxisField = Array.isArray(chartConfig?.xAxis) ? chartConfig.xAxis[0] : chartConfig?.xAxis
  const yAxisField = Array.isArray(chartConfig?.yAxis) ? chartConfig.yAxis[0] : chartConfig?.yAxis
  const valueField = Array.isArray(chartConfig?.valueField) ? chartConfig.valueField[0] : chartConfig?.valueField

  if (!xAxisField || !yAxisField || !valueField) {
    return (
      <div
        className="flex items-center justify-center w-full text-dc-text-muted"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Configuration Required</div>
          <div className="text-xs text-dc-text-secondary">
            Heatmap requires X-axis dimension, Y-axis dimension, and a value measure
          </div>
        </div>
      </div>
    )
  }

  // Transform data to nivo format
  // Input: flat array of { xDim: val, yDim: val, measure: val }
  // Output: { id: yVal, data: [{ x: xVal, y: measureVal }, ...] }
  const transformedData = useMemo((): HeatMapSerieData[] => {
    // Get unique X and Y values
    const xValues = new Set<string>()
    const yValues = new Set<string>()

    // Filter out null/undefined dimensions and collect unique values
    const validData = data.filter(item => {
      const xVal = item[xAxisField]
      const yVal = item[yAxisField]
      return xVal != null && yVal != null
    })

    validData.forEach(item => {
      xValues.add(String(item[xAxisField]))
      yValues.add(String(item[yAxisField]))
    })

    // Create a map for quick lookup
    const dataMap = new Map<string, number>()
    validData.forEach(item => {
      const key = `${item[yAxisField]}|${item[xAxisField]}`
      const value = typeof item[valueField] === 'string'
        ? parseFloat(item[valueField])
        : (item[valueField] ?? 0)
      dataMap.set(key, value)
    })

    // Build nivo format: one series per Y value
    const result: HeatMapSerieData[] = []
    const sortedYValues = Array.from(yValues).sort()
    const sortedXValues = Array.from(xValues).sort()

    for (const yVal of sortedYValues) {
      const rowData: HeatMapDatum[] = []
      for (const xVal of sortedXValues) {
        const key = `${yVal}|${xVal}`
        const value = dataMap.get(key) ?? null
        rowData.push({ x: xVal, y: value })
      }
      result.push({ id: yVal, data: rowData })
    }

    return result
  }, [data, xAxisField, yAxisField, valueField])

  if (transformedData.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-full text-dc-text-muted"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">No valid data</div>
          <div className="text-xs text-dc-text-secondary">No valid data points after transformation</div>
        </div>
      </div>
    )
  }

  // Use palette gradient or default
  const colors = colorPalette?.gradient || CHART_COLORS_GRADIENT

  return (
    <div className="w-full" style={{ height, minHeight: '200px' }}>
      <ResponsiveHeatMap
        data={transformedData}
        margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
        valueFormat=">-.2s"
        axisTop={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: getFieldLabel(xAxisField),
          legendOffset: -40
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: getFieldLabel(yAxisField),
          legendPosition: 'middle',
          legendOffset: -72
        }}
        colors={{
          type: 'sequential',
          scheme: 'blues',
          ...(colors.length > 0 && { colors })
        }}
        emptyColor="#f0f0f0"
        cellComponent={safeDisplayConfig.cellShape === 'circle' ? 'circle' : 'rect'}
        labelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
        enableLabels={safeDisplayConfig.showLabels}
        legends={safeDisplayConfig.showLegend ? [
          {
            anchor: 'bottom',
            translateX: 0,
            translateY: 36,
            length: 400,
            thickness: 8,
            direction: 'row',
            tickPosition: 'after',
            tickSize: 3,
            tickSpacing: 4,
            tickOverlap: false,
            title: getFieldLabel(valueField) + ' →',
            titleAlign: 'start',
            titleOffset: 4
          }
        ] : []}
        isInteractive={safeDisplayConfig.showTooltip}
        hoverTarget="cell"
        animate={true}
      />
    </div>
  )
})

export default HeatMapChart
```

**Step 2: Run tests to verify they pass**

```bash
npm run test:client -- tests/client/charts/HeatMapChart.test.tsx
```

Expected: All tests pass

**Step 3: Commit**

```bash
git add src/client/components/charts/HeatMapChart.tsx
git commit -m "feat(client): implement HeatMapChart component

Transforms drizzle-cube flat query results to nivo heatmap format.
Supports configurable cell shape, labels, legend, and tooltips.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Register Heatmap in Chart Config Registry

**Files:**
- Modify: `src/client/charts/chartConfigRegistry.ts`

**Step 1: Add import**

Add after sunburstChartConfig import:
```typescript
import { heatmapChartConfig } from '../components/charts/HeatMapChart.config'
```

**Step 2: Add to registry**

Add after sunburst entry:
```typescript
heatmap: heatmapChartConfig,
```

**Step 3: Verify build**

```bash
npm run build:client
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/client/charts/chartConfigRegistry.ts
git commit -m "feat(client): register heatmap in chart config registry

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Add Heatmap to ChartLoader

**Files:**
- Modify: `src/client/charts/ChartLoader.tsx`

**Step 1: Add lazy import to chartImportMap**

Add after sunburst entry (around line 36):
```typescript
heatmap: () => import('../components/charts/HeatMapChart'),
```

**Step 2: Verify build and tests**

```bash
npm run build:client && npm run test:client
```

Expected: Build succeeds and all tests pass

**Step 3: Commit**

```bash
git add src/client/charts/ChartLoader.tsx
git commit -m "feat(client): add heatmap to lazy chart loader

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Run Full Test Suite

**Step 1: Run all client tests**

```bash
npm run test:client
```

Expected: All tests pass

**Step 2: Run typecheck**

```bash
npm run typecheck
```

Expected: No errors

**Step 3: Run lint**

```bash
npm run lint
```

Expected: No errors (or only pre-existing warnings)

---

## Task 10: Final Verification and Commit

**Step 1: Build everything**

```bash
npm run build
```

Expected: All builds succeed

**Step 2: Verify heatmap is available**

Create a quick manual test (don't commit):
```bash
npm run dev
```

Navigate to dashboard, add new chart, verify "Heatmap" appears in chart type selector.

**Step 3: Create summary commit if any fixes were needed**

If any fixes were made during verification, commit them.

---

## Summary

After completing all tasks, the feature branch will have:

1. `@nivo/heatmap` as a peer/dev dependency
2. `'heatmap'` added to `ChartType` union
3. Heatmap icon in the icon registry
4. `HeatMapChart.config.tsx` with drop zone configuration
5. `HeatMapChart.tsx` component with data transformation
6. `HeatMapChart.test.tsx` with comprehensive tests
7. Heatmap registered in `chartConfigRegistry`
8. Heatmap available via `ChartLoader` lazy loading

Ready for PR to main branch.
