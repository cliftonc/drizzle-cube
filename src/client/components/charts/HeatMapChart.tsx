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
import { formatTimeValue, getFieldGranularity, formatAxisValue } from '../../utils/chartUtils'
import type { AxisFormatConfig } from '../../types'
import type { ChartProps } from '../../types'

/**
 * Parse color string (hex or rgb) to RGB values
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    }
  }

  // Handle rgb/rgba colors
  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    }
  }

  return null
}

/**
 * Calculate relative luminance of a color
 * Returns value between 0 (black) and 1 (white)
 */
function getLuminance(color: string): number {
  const rgb = parseColor(color)
  if (!rgb) return 0.5 // Default to mid-gray if parsing fails

  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  // Apply gamma correction
  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)

  // Calculate luminance using WCAG formula
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

/**
 * Get contrasting text color (white or dark) based on background color
 */
function getContrastingTextColor(bgColor: string): string {
  const luminance = getLuminance(bgColor)
  // Use white text on dark backgrounds, dark text on light backgrounds
  return luminance < 0.4 ? '#ffffff' : '#1f2937'
}

/**
 * Maximum dimensions for heatmap to prevent browser lockup
 * 50x50 = 2500 cells max
 */
const MAX_HEATMAP_ROWS = 50
const MAX_HEATMAP_COLS = 50

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
 * Result of heatmap transformation including truncation info
 */
interface HeatMapTransformResult {
  data: HeatMapSerie[]
  truncated: boolean
  originalRows: number
  originalCols: number
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
 *
 * Data is truncated to MAX_HEATMAP_ROWS x MAX_HEATMAP_COLS to prevent browser lockup
 */
function transformToHeatMapFormat(
  data: Record<string, unknown>[],
  xAxisField: string | undefined,
  yAxisField: string | undefined,
  valueField: string | undefined,
  xGranularity?: string,
  yGranularity?: string
): HeatMapTransformResult {
  if (!xAxisField || !yAxisField || !valueField) {
    return { data: [], truncated: false, originalRows: 0, originalCols: 0 }
  }

  // Group data by Y-axis dimension
  const groupedByY = new Map<string, Map<string, number>>()
  const allXValues = new Set<string>()
  // Keep original values for sorting timestamps correctly
  const xValueOriginals = new Map<string, unknown>()

  for (const row of data) {
    const rawYValue = row[yAxisField]
    const rawXValue = row[xAxisField]

    // Format time values based on granularity
    const yValue = formatTimeValue(rawYValue, yGranularity) || String(rawYValue ?? '(empty)')
    const xValue = formatTimeValue(rawXValue, xGranularity) || String(rawXValue ?? '(empty)')
    const value = Number(row[valueField]) || 0

    allXValues.add(xValue)
    // Store original for sorting
    if (!xValueOriginals.has(xValue)) {
      xValueOriginals.set(xValue, rawXValue)
    }

    if (!groupedByY.has(yValue)) {
      groupedByY.set(yValue, new Map())
    }
    groupedByY.get(yValue)!.set(xValue, value)
  }

  // Sort X values - try to sort by original timestamp if available
  const xValueArray = Array.from(allXValues).sort((a, b) => {
    const origA = xValueOriginals.get(a)
    const origB = xValueOriginals.get(b)
    // If both are date strings, sort chronologically
    if (typeof origA === 'string' && typeof origB === 'string' &&
        origA.match(/^\d{4}-\d{2}-\d{2}/) && origB.match(/^\d{4}-\d{2}-\d{2}/)) {
      return origA.localeCompare(origB)
    }
    // Otherwise sort alphabetically by formatted value
    return a.localeCompare(b)
  })

  // Track original dimensions for truncation warning
  const originalRows = groupedByY.size
  const originalCols = xValueArray.length
  const truncated = originalRows > MAX_HEATMAP_ROWS || originalCols > MAX_HEATMAP_COLS

  // Truncate X values if needed
  const limitedXValues = xValueArray.slice(0, MAX_HEATMAP_COLS)

  // Build result with truncation
  const result: HeatMapSerie[] = []
  let rowCount = 0
  for (const [yValue, xMap] of groupedByY) {
    if (rowCount >= MAX_HEATMAP_ROWS) break
    result.push({
      id: yValue,
      data: limitedXValues.map((x) => ({
        x,
        y: xMap.get(x) ?? null,
      })),
    })
    rowCount++
  }

  return { data: result, truncated, originalRows, originalCols }
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
  queryObject,
}: ChartProps) {
  // Get display config options
  const displayConfigAny = displayConfig as Record<string, unknown> | undefined
  const showLabels = (displayConfigAny?.showLabels as boolean) ?? false
  const cellShape = (displayConfigAny?.cellShape as 'rect' | 'circle') ?? 'rect'
  const showLegend = (displayConfigAny?.showLegend as boolean) ?? true
  const xAxisFormat = displayConfigAny?.xAxisFormat as AxisFormatConfig | undefined
  const yAxisFormat = displayConfigAny?.yAxisFormat as AxisFormatConfig | undefined
  const valueFormat = displayConfigAny?.valueFormat as AxisFormatConfig | undefined

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

  // Get granularity for time dimensions (only if field is defined)
  const xGranularity = xAxisField ? getFieldGranularity(queryObject, xAxisField) : undefined
  const yGranularity = yAxisField ? getFieldGranularity(queryObject, yAxisField) : undefined

  // Transform data to nivo format
  const { data: heatmapData, truncated, originalRows, originalCols } = useMemo(() => {
    if (!data || data.length === 0) {
      return { data: [], truncated: false, originalRows: 0, originalCols: 0 }
    }
    return transformToHeatMapFormat(
      data as Record<string, unknown>[],
      xAxisField,
      yAxisField,
      valueField,
      xGranularity,
      yGranularity
    )
  }, [data, xAxisField, yAxisField, valueField, xGranularity, yGranularity])

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

  // Use gradient colors from palette, or default sequential blue gradient
  // Sequential single-hue gradients are ideal for heatmaps showing magnitude/intensity
  const colors = colorPalette?.gradient || [
    '#eff3ff', // lightest blue
    '#c6dbef',
    '#9ecae1',
    '#6baed6',
    '#3182bd',
    '#08519c', // darkest blue
  ]

  return (
    <div className="relative w-full h-full" style={{ height }}>
      {truncated && (
        <div className="absolute top-0 left-0 right-0 z-10 px-3 py-1.5 text-xs bg-dc-warning-bg text-dc-warning border-b border-dc-border">
          Data truncated to {MAX_HEATMAP_ROWS}x{MAX_HEATMAP_COLS} cells (original: {originalRows}x{originalCols}). Add filters to reduce dimensions.
        </div>
      )}
      <ResponsiveHeatMap
        data={heatmapData}
        margin={{ top: truncated ? 40 : 20, right: 20, bottom: 120, left: 120 }}
        valueFormat={valueFormat ? (v) => formatAxisValue(v, valueFormat) : '>-.2s'}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: xAxisFormat?.label || xAxisField?.split('.').pop() || 'X Axis',
          legendPosition: 'middle',
          legendOffset: 70,
          format: xAxisFormat
            ? (v) => {
                const num = parseFloat(String(v))
                return isNaN(num) ? String(v) : formatAxisValue(num, xAxisFormat)
              }
            : undefined,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: yAxisFormat?.label || yAxisField?.split('.').pop() || 'Y Axis',
          legendPosition: 'middle',
          legendOffset: -80,
          format: yAxisFormat
            ? (v) => {
                const num = parseFloat(String(v))
                return isNaN(num) ? String(v) : formatAxisValue(num, yAxisFormat)
              }
            : undefined,
        }}
        colors={{
          type: 'sequential',
          scheme: 'greens',
          ...(colors.length > 0 && { colors }),
        }}
        emptyColor="var(--dc-surface-tertiary)"
        cellComponent={cellShape === 'circle' ? 'circle' : 'rect'}
        enableLabels={showLabels}
        labelTextColor={({ color }) => getContrastingTextColor(color)}
        legends={
          showLegend
            ? [
                {
                  anchor: 'bottom',
                  translateX: 0,
                  translateY: 95,
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
