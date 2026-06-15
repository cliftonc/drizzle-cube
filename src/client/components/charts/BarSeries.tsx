import React from 'react'
import { Bar, Cell } from 'recharts'
import { CHART_COLORS, POSITIVE_COLOR, NEGATIVE_COLOR } from '../../utils/chartConstants'
import type { ColorPalette } from '../../types'
import type { ChartDataPointClickEvent } from '../../types/drill'

interface BarSeriesProps {
  seriesKey: string
  index: number
  /** Original field name backing this series key (for axis assignment + drill). */
  originalField: string | undefined
  axisId: 'left' | 'right'
  stackId: string | undefined
  chartData: Record<string, any>[]
  enhancedChartData: Record<string, any>[]
  colorPalette?: ColorPalette
  hoveredLegend: string | null
  usePositiveNegativeColoring: boolean
  useColorByCategory: boolean
  drillEnabled?: boolean
  onDataPointClick?: (event: ChartDataPointClickEvent) => void
}

/** Opacity for a bar/cell given the currently hovered legend key. */
function hoverOpacity(hoveredLegend: string | null, seriesKey: string): number {
  if (!hoveredLegend) return 1
  return hoveredLegend === seriesKey ? 1 : 0.3
}

/**
 * Single `<Bar>` for a series key.
 *
 * Encapsulates the per-bar colouring modes (positive/negative, colour-by-category)
 * and the drill click handler that were previously inlined in BarChart's render.
 * Returned as a fragment-bearing component so it can be used directly inside the
 * Recharts `<ComposedChart>` children list. Behaviour is identical to the original.
 */
export function BarSeries({
  seriesKey,
  index,
  originalField,
  axisId,
  stackId,
  chartData,
  enhancedChartData,
  colorPalette,
  hoveredLegend,
  usePositiveNegativeColoring,
  useColorByCategory,
  drillEnabled,
  onDataPointClick
}: BarSeriesProps) {
  const baseFill = usePositiveNegativeColoring
    ? POSITIVE_COLOR
    : (colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) ||
      CHART_COLORS[index % CHART_COLORS.length]

  const handleClick = (barData: any, dataIndex: number, event: React.MouseEvent) => {
    if (onDataPointClick && drillEnabled && barData) {
      onDataPointClick({
        dataPoint: enhancedChartData[dataIndex] || barData,
        clickedField: originalField || seriesKey,
        xValue: barData.name,
        position: { x: event.clientX, y: event.clientY },
        nativeEvent: event
      })
    }
  }

  return (
    <Bar
      dataKey={seriesKey}
      yAxisId={axisId}
      stackId={stackId}
      fill={baseFill}
      fillOpacity={hoverOpacity(hoveredLegend, seriesKey)}
      cursor={drillEnabled ? 'pointer' : undefined}
      onClick={handleClick}
    >
      {usePositiveNegativeColoring &&
        chartData.map((entry, entryIndex) => {
          const value = entry[seriesKey]
          const fillColor = typeof value === 'number' && value < 0 ? NEGATIVE_COLOR : POSITIVE_COLOR
          return (
            <Cell
              key={`cell-${entryIndex}`}
              fill={fillColor}
              fillOpacity={hoverOpacity(hoveredLegend, seriesKey)}
            />
          )
        })}
      {useColorByCategory &&
        chartData.map((_entry, entryIndex) => {
          const colors = colorPalette?.colors || CHART_COLORS
          return (
            <Cell
              key={`cat-${entryIndex}`}
              fill={colors[entryIndex % colors.length]}
              fillOpacity={hoverOpacity(hoveredLegend, seriesKey)}
            />
          )
        })}
    </Bar>
  )
}
