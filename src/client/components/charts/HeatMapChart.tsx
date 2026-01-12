/**
 * HeatMapChart Component
 *
 * Visualizes intensity across two categorical dimensions using a color matrix.
 * Uses @nivo/heatmap for rendering.
 *
 * The chart displays:
 * - Rows: Y-axis dimension values
 * - Columns: X-axis dimension values
 * - Cell color: Intensity based on measure value
 */

import React, { useMemo } from 'react'
import { ResponsiveHeatMap } from '@nivo/heatmap'
import type { ChartProps } from '../../types'

/**
 * Nivo heatmap data format
 */
interface HeatMapDatum {
  x: string
  y: number | null
}

interface HeatMapSerie {
  id: string
  data: HeatMapDatum[]
}

/**
 * Transform drizzle-cube flat query results to nivo heatmap format
 *
 * Input (drizzle-cube):
 * [
 *   { "Region.name": "East", "Product.category": "Electronics", "Sales.total": 1500 },
 *   { "Region.name": "East", "Product.category": "Clothing", "Sales.total": 800 },
 * ]
 *
 * Output (nivo format):
 * [
 *   { id: "East", data: [{ x: "Electronics", y: 1500 }, { x: "Clothing", y: 800 }] }
 * ]
 */
function transformToHeatMapFormat(
  data: Record<string, unknown>[],
  xAxisField: string | undefined,
  yAxisField: string | undefined,
  valueField: string | undefined
): HeatMapSerie[] {
  if (!xAxisField || !yAxisField || !valueField) {
    return []
  }

  // Group data by Y-axis dimension
  const groupedByY = new Map<string, Map<string, number>>()
  const allXValues = new Set<string>()

  for (const row of data) {
    const yValue = String(row[yAxisField] ?? '(empty)')
    const xValue = String(row[xAxisField] ?? '(empty)')
    const value = Number(row[valueField]) || 0

    allXValues.add(xValue)

    if (!groupedByY.has(yValue)) {
      groupedByY.set(yValue, new Map())
    }
    groupedByY.get(yValue)!.set(xValue, value)
  }

  // Convert to nivo format with all X values for each Y (handle sparse matrices)
  const xValueArray = Array.from(allXValues).sort()

  const result: HeatMapSerie[] = []
  for (const [yValue, xMap] of groupedByY) {
    result.push({
      id: yValue,
      data: xValueArray.map((x) => ({
        x,
        y: xMap.get(x) ?? null,
      })),
    })
  }

  return result
}

/**
 * HeatMapChart Component
 *
 * Renders a heatmap visualization from query results.
 * Shows intensity patterns across two categorical dimensions.
 */
const HeatMapChart = React.memo(function HeatMapChart({
  data,
  height = '100%',
  chartConfig,
  colorPalette,
  displayConfig,
}: ChartProps) {
  // Get display config options
  const displayConfigAny = displayConfig as Record<string, unknown> | undefined
  const showLabels = (displayConfigAny?.showLabels as boolean) ?? false
  const cellShape = (displayConfigAny?.cellShape as 'rect' | 'circle') ?? 'rect'
  const showLegend = (displayConfigAny?.showLegend as boolean) ?? true

  // Extract field names from chartConfig (handle both array and string formats)
  const xAxisField = chartConfig?.xAxis
    ? (Array.isArray(chartConfig.xAxis) ? chartConfig.xAxis[0] : chartConfig.xAxis)
    : undefined
  const yAxisField = chartConfig?.yAxis
    ? (Array.isArray(chartConfig.yAxis) ? chartConfig.yAxis[0] : chartConfig.yAxis)
    : undefined
  const valueField = chartConfig?.valueField
    ? (Array.isArray(chartConfig.valueField) ? chartConfig.valueField[0] : chartConfig.valueField)
    : undefined

  // Transform data to nivo format
  const heatmapData = useMemo(() => {
    if (!data || data.length === 0) return []
    return transformToHeatMapFormat(
      data as Record<string, unknown>[],
      xAxisField,
      yAxisField,
      valueField
    )
  }, [data, xAxisField, yAxisField, valueField])

  // Handle no data or missing config
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-full text-dc-text-muted"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">No data available</div>
          <div className="text-xs text-dc-text-secondary">
            Run a query to see heatmap visualization
          </div>
        </div>
      </div>
    )
  }

  if (!xAxisField || !yAxisField || !valueField) {
    return (
      <div
        className="flex items-center justify-center w-full text-dc-text-muted"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Configuration required</div>
          <div className="text-xs text-dc-text-secondary">
            {!xAxisField && 'X-axis dimension required. '}
            {!yAxisField && 'Y-axis dimension required. '}
            {!valueField && 'Value measure required.'}
          </div>
        </div>
      </div>
    )
  }

  if (heatmapData.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-full text-dc-text-muted"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">No data to display</div>
          <div className="text-xs text-dc-text-secondary">
            The query returned no results for the heatmap
          </div>
        </div>
      </div>
    )
  }

  // Use gradient colors from palette, or default gradient
  const colors = colorPalette?.gradient || colorPalette?.colors || [
    '#e8f5e9',
    '#c8e6c9',
    '#a5d6a7',
    '#81c784',
    '#66bb6a',
    '#4caf50',
    '#43a047',
    '#388e3c',
    '#2e7d32',
    '#1b5e20',
  ]

  return (
    <div className="relative w-full h-full" style={{ height }}>
      <ResponsiveHeatMap
        data={heatmapData}
        margin={{ top: 60, right: showLegend ? 90 : 20, bottom: 60, left: 90 }}
        valueFormat=">-.2s"
        axisTop={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: '',
          legendOffset: 46,
        }}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: xAxisField?.split('.').pop() || 'X Axis',
          legendPosition: 'middle',
          legendOffset: 46,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: yAxisField?.split('.').pop() || 'Y Axis',
          legendPosition: 'middle',
          legendOffset: -72,
        }}
        colors={{
          type: 'sequential',
          scheme: 'greens',
          ...(colors.length > 0 && { colors }),
        }}
        emptyColor="#555555"
        cellComponent={cellShape === 'circle' ? 'circle' : 'rect'}
        enableLabels={showLabels}
        labelTextColor={{
          from: 'color',
          modifiers: [['darker', 2]],
        }}
        legends={
          showLegend
            ? [
                {
                  anchor: 'bottom',
                  translateX: 0,
                  translateY: 30,
                  length: 400,
                  thickness: 8,
                  direction: 'row',
                  tickPosition: 'after',
                  tickSize: 3,
                  tickSpacing: 4,
                  tickOverlap: false,
                  title: valueField?.split('.').pop() || 'Value',
                  titleAlign: 'start',
                  titleOffset: 4,
                },
              ]
            : []
        }
        annotations={[]}
        theme={{
          text: {
            fill: 'var(--dc-text)',
          },
          axis: {
            legend: {
              text: {
                fill: 'var(--dc-text)',
              },
            },
            ticks: {
              text: {
                fill: 'var(--dc-text-secondary)',
              },
            },
          },
          legends: {
            text: {
              fill: 'var(--dc-text-secondary)',
            },
            title: {
              text: {
                fill: 'var(--dc-text)',
              },
            },
          },
          tooltip: {
            container: {
              background: 'var(--dc-surface)',
              color: 'var(--dc-text)',
              borderRadius: '4px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)',
            },
          },
        }}
      />
    </div>
  )
})

export default HeatMapChart
