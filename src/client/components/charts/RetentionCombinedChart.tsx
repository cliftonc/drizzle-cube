/**
 * RetentionCombinedChart Component
 *
 * Combined visualization for retention analysis data.
 * Supports multiple display modes: heatmap, line chart, or combined view.
 *
 * Features:
 * - X-axis: Period numbers (P0, P1, P2...)
 * - Y-axis: Retention % (0-100%)
 * - Lines: One per breakdown value (or single if no breakdown)
 * - Display modes: 'heatmap' | 'line' | 'combined'
 * - Heatmap shows color-coded retention matrix
 * - Line chart shows retention curves over periods
 */

import React, { useMemo, useState } from 'react'
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import ChartContainer from './ChartContainer'
import ChartTooltip from './ChartTooltip'
import { CHART_COLORS, CHART_MARGINS } from '../../utils/chartConstants'
import type { ChartProps } from '../../types'
import type { RetentionChartData, RetentionResultRow, RetentionGranularity } from '../../types/retention'
import { isRetentionData } from '../../types/retention'

/**
 * Retention display mode
 * - 'heatmap': Show retention as color-coded bars
 * - 'line': Show retention as line curves
 * - 'combined': Show both heatmap background and line overlay
 */
export type RetentionDisplayMode = 'heatmap' | 'line' | 'combined'

/**
 * Get color with opacity based on retention rate for heatmap cells
 * Uses a green gradient: higher retention = more saturated green
 */
function getRetentionColor(rate: number): string {
  const clampedRate = Math.max(0, Math.min(1, rate))
  const alpha = 0.1 + clampedRate * 0.7
  return `rgba(34, 197, 94, ${alpha})`
}

/**
 * Format percentage for display
 */
function formatPercentage(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

/**
 * Format period label based on granularity
 * Period 0 shows "< 1 Day" / "< 1 Week" etc. to indicate the initial cohort
 * e.g., Period 0 with 'week' granularity → "< 1 Week", Period 1 → "Week 1"
 */
function formatPeriodLabel(period: number, granularity?: RetentionGranularity): string {
  const prefix = granularity === 'day' ? 'Day'
    : granularity === 'week' ? 'Week'
    : granularity === 'month' ? 'Month'
    : 'P' // Fallback to P0, P1, etc.

  // Period 0 is special - shows "< 1 Day" / "< 1 Week" etc.
  if (period === 0) {
    return granularity ? `< 1 ${prefix}` : 'P0'
  }

  return granularity ? `${prefix} ${period}` : `P${period}`
}

/**
 * Get display label for the cohort total column
 * Shows "Total" regardless of binding key - it's the cohort size count
 */
function getCohortLabel(_bindingKeyLabel?: string): string {
  return 'Total'
}

/**
 * Get default series name based on binding key
 * e.g., "userId" → "userId Retention", null → "Retention"
 */
function getDefaultSeriesName(bindingKeyLabel?: string): string {
  if (!bindingKeyLabel) return 'Retention'
  return `${bindingKeyLabel} Retention`
}

/**
 * Transform retention data for chart display
 * Groups data by period with breakdown values as series
 */
function transformRetentionData(
  rows: RetentionResultRow[],
  periods: number[],
  breakdownValues?: string[],
  granularity?: RetentionGranularity,
  bindingKeyLabel?: string
): { chartData: any[]; seriesKeys: string[]; defaultSeriesName: string } {
  const defaultSeriesName = getDefaultSeriesName(bindingKeyLabel)

  // If no breakdown, single series
  if (!breakdownValues || breakdownValues.length === 0) {
    const chartData = periods.map((period) => {
      const row = rows.find((r) => r.period === period && !r.breakdownValue)
      return {
        period,
        periodLabel: formatPeriodLabel(period, granularity),
        [defaultSeriesName]: row ? row.retentionRate : null,
        cohortSize: row?.cohortSize ?? 0,
        retainedUsers: row?.retainedUsers ?? 0,
      }
    })
    return { chartData, seriesKeys: [defaultSeriesName], defaultSeriesName }
  }

  // With breakdown, create series per breakdown value
  const chartData = periods.map((period) => {
    const dataPoint: any = {
      period,
      periodLabel: formatPeriodLabel(period, granularity),
    }

    breakdownValues.forEach((bv) => {
      const row = rows.find((r) => r.period === period && r.breakdownValue === bv)
      dataPoint[bv] = row ? row.retentionRate : null
      dataPoint[`${bv}_cohortSize`] = row?.cohortSize ?? 0
      dataPoint[`${bv}_retainedUsers`] = row?.retainedUsers ?? 0
    })

    return dataPoint
  })

  return { chartData, seriesKeys: breakdownValues, defaultSeriesName }
}

interface TooltipData {
  period: number
  breakdownValue?: string | null
  cohortSize: number
  retainedUsers: number
  retentionRate: number
  x: number
  y: number
}

/**
 * RetentionCombinedChart Component
 */
const RetentionCombinedChart = React.memo(function RetentionCombinedChart({
  data,
  height = '100%',
  displayConfig,
  colorPalette,
}: ChartProps) {
  const [hoveredLegend, setHoveredLegend] = useState<string | null>(null)
  const [heatmapTooltip, setHeatmapTooltip] = useState<TooltipData | null>(null)

  // Parse retention data
  const retentionData = useMemo<RetentionChartData | null>(() => {
    if (!data) return null

    // Check if data is already in RetentionChartData format
    if (isRetentionData(data)) {
      return data
    }

    // If data is an array of RetentionResultRow, convert it
    if (Array.isArray(data) && data.length > 0) {
      const rows = data as RetentionResultRow[]
      const periods = [...new Set(rows.map((r) => r.period))].sort((a, b) => a - b)
      const breakdownValues = [
        ...new Set(rows.filter((r) => r.breakdownValue).map((r) => r.breakdownValue!)),
      ]

      return {
        rows,
        periods,
        breakdownValues: breakdownValues.length > 0 ? breakdownValues : undefined,
      }
    }

    return null
  }, [data])

  // Transform data for chart
  const { chartData, seriesKeys, defaultSeriesName } = useMemo(() => {
    if (!retentionData) {
      return { chartData: [], seriesKeys: [], defaultSeriesName: 'Retention' }
    }
    return transformRetentionData(
      retentionData.rows,
      retentionData.periods,
      retentionData.breakdownValues,
      retentionData.granularity,
      retentionData.bindingKeyLabel
    )
  }, [retentionData])

  // Get cohort label for heatmap column header
  const cohortLabel = getCohortLabel(retentionData?.bindingKeyLabel)

  // Display mode from config
  const displayMode: RetentionDisplayMode =
    (displayConfig as any)?.retentionDisplayMode || 'line'

  const showLegend = displayConfig?.showLegend ?? true
  const showGrid = displayConfig?.showGrid ?? true
  const showTooltip = displayConfig?.showTooltip ?? true

  // Handle empty/loading states
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div
        className="flex items-center justify-center w-full text-dc-text-muted"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">No data available</div>
          <div className="text-xs text-dc-text-secondary">
            Configure retention analysis to see results
          </div>
        </div>
      </div>
    )
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-full text-dc-text-muted"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Unable to render retention data</div>
          <div className="text-xs text-dc-text-secondary">Data format may be incorrect</div>
        </div>
      </div>
    )
  }

  // Render line chart component (reused in line and combined modes)
  const renderLineChart = (chartHeight: string | number) => {
    const chartMargins = {
      ...CHART_MARGINS,
      left: 50,
      right: 20,
    }

    return (
      <ChartContainer height={chartHeight}>
        <ComposedChart data={chartData} margin={chartMargins}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis
            dataKey="periodLabel"
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: 'var(--dc-border)' }}
            tickLine={{ stroke: 'var(--dc-border)' }}
          />
          <YAxis
            domain={[0, 1]}
            tickFormatter={(value) => formatPercentage(value)}
            tick={{ fontSize: 12 }}
            axisLine={{ stroke: 'var(--dc-border)' }}
            tickLine={{ stroke: 'var(--dc-border)' }}
            label={{
              value: 'Retention %',
              angle: -90,
              position: 'insideLeft',
              style: { textAnchor: 'middle', fontSize: '12px', fill: 'var(--dc-text-secondary)' },
            }}
          />
          {showTooltip && (
            <ChartTooltip
              formatter={(value: any, name: string) => {
                if (value === null || value === undefined) {
                  return ['No data', name]
                }
                return [formatPercentage(value), name]
              }}
              labelFormatter={(label: string) => label}
            />
          )}
          {showLegend && (
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="line"
              iconSize={8}
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              onMouseEnter={(o) => setHoveredLegend(String(o.dataKey || ''))}
              onMouseLeave={() => setHoveredLegend(null)}
            />
          )}

          {/* Render lines */}
          {seriesKeys.map((seriesKey, index) => (
            <Line
              key={seriesKey}
              type="monotone"
              dataKey={seriesKey}
              stroke={
                (colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) ||
                CHART_COLORS[index % CHART_COLORS.length]
              }
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              strokeOpacity={hoveredLegend ? (hoveredLegend === seriesKey ? 1 : 0.3) : 1}
              connectNulls={false}
            />
          ))}
        </ComposedChart>
      </ChartContainer>
    )
  }

  // Render heatmap table component (reused in heatmap and combined modes)
  const renderHeatmapTable = () => (
    <table className="w-full border-collapse text-sm">
      <thead className="sticky top-0 bg-dc-bg z-10">
        <tr>
          <th className="text-left p-2 font-medium text-dc-text border-b border-dc-border min-w-[100px] whitespace-nowrap">
            {retentionData?.breakdownValues?.length ? 'Segment' : 'Cohort'}
          </th>
          <th className="text-right p-2 font-medium text-dc-text border-b border-dc-border min-w-[60px] whitespace-nowrap">
            {cohortLabel}
          </th>
          {retentionData?.periods.map((period) => (
            <th
              key={period}
              className="text-center p-2 font-medium text-dc-text border-b border-dc-border min-w-[70px] whitespace-nowrap"
            >
              {formatPeriodLabel(period, retentionData?.granularity)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {seriesKeys.map((seriesKey, rowIndex) => {
          const period0Data = chartData.find((d) => d.period === 0)
          const isDefaultSeries = seriesKey === defaultSeriesName
          const cohortSize = isDefaultSeries
            ? period0Data?.cohortSize ?? 0
            : period0Data?.[`${seriesKey}_cohortSize`] ?? 0

          return (
            <tr
              key={seriesKey}
              className={rowIndex % 2 === 0 ? 'bg-dc-bg' : 'bg-dc-surface-secondary'}
            >
              <td className="p-2 font-medium text-dc-text border-b border-dc-border whitespace-nowrap">
                {seriesKey}
              </td>
              <td className="p-2 text-right text-dc-text-secondary border-b border-dc-border">
                {cohortSize.toLocaleString()}
              </td>
              {retentionData?.periods.map((period) => {
                const dataPoint = chartData.find((d) => d.period === period)
                const rate = dataPoint?.[seriesKey] ?? 0
                const bgColor = rate > 0 ? getRetentionColor(rate) : 'transparent'
                const textColor = rate > 0.5 ? '#ffffff' : 'var(--dc-text)'

                return (
                  <td
                    key={period}
                    className="p-2 text-center border-b border-dc-border cursor-default transition-opacity hover:opacity-80"
                    style={{ backgroundColor: bgColor, color: textColor }}
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect()
                      const retainedUsers = isDefaultSeries
                        ? dataPoint?.retainedUsers ?? 0
                        : dataPoint?.[`${seriesKey}_retainedUsers`] ?? 0
                      setHeatmapTooltip({
                        period,
                        breakdownValue: isDefaultSeries ? null : seriesKey,
                        cohortSize,
                        retainedUsers,
                        retentionRate: rate,
                        x: rect.left + rect.width / 2,
                        y: rect.top,
                      })
                    }}
                    onMouseLeave={() => setHeatmapTooltip(null)}
                  >
                    {rate > 0 ? formatPercentage(rate) : '-'}
                  </td>
                )
              })}
            </tr>
          )
        })}
      </tbody>
    </table>
  )

  // Render heatmap tooltip (shared between heatmap and combined modes)
  const renderHeatmapTooltip = () =>
    heatmapTooltip && (
      <div
        className="fixed z-50 px-3 py-2 bg-dc-surface border border-dc-border rounded shadow-lg text-sm pointer-events-none"
        style={{
          left: heatmapTooltip.x,
          top: heatmapTooltip.y - 10,
          transform: 'translate(-50%, -100%)',
        }}
      >
        <div className="font-medium text-dc-text mb-1">
          {heatmapTooltip.breakdownValue
            ? `${heatmapTooltip.breakdownValue} - ${formatPeriodLabel(heatmapTooltip.period, retentionData?.granularity)}`
            : formatPeriodLabel(heatmapTooltip.period, retentionData?.granularity)}
        </div>
        <div className="text-dc-text-secondary space-y-0.5">
          <div>Cohort Size: {heatmapTooltip.cohortSize.toLocaleString()}</div>
          <div>Retained: {heatmapTooltip.retainedUsers.toLocaleString()}</div>
          <div className="font-medium text-dc-text">
            Rate: {formatPercentage(heatmapTooltip.retentionRate)}
          </div>
        </div>
      </div>
    )

  // Render heatmap mode (table-based only)
  if (displayMode === 'heatmap') {
    return (
      <div className="relative w-full h-full overflow-auto" style={{ height }}>
        {renderHeatmapTable()}
        {renderHeatmapTooltip()}
      </div>
    )
  }

  // Combined mode: line chart on top, heatmap table below
  if (displayMode === 'combined') {
    return (
      <div className="flex flex-col w-full h-full" style={{ height }}>
        {/* Line chart - takes remaining space after heatmap */}
        <div className="flex-1 min-h-[200px]">
          {renderLineChart('100%')}
        </div>
        {/* Heatmap table - auto-height based on content, scrolls if needed */}
        <div className="flex-shrink-0 max-h-[40%] overflow-auto border-t border-dc-border">
          {renderHeatmapTable()}
        </div>
        {/* Shared heatmap tooltip */}
        {renderHeatmapTooltip()}
      </div>
    )
  }

  // Line mode: just the line chart
  return renderLineChart(height)
})

export default RetentionCombinedChart
