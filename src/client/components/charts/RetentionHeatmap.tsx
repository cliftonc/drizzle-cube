/**
 * RetentionHeatmap Component
 *
 * Visualizes retention analysis data as a cohort × period matrix.
 * Displays retention rates with color intensity based on percentage.
 *
 * Features:
 * - Cohort labels in first column (e.g., "2024-01", "2024-02")
 * - Cohort size in second column
 * - Period columns (P0, P1, P2, ... PN)
 * - Cell background color intensity based on retention rate
 * - Hover tooltip with detailed stats
 */

import React, { useMemo, useState } from 'react'
import type { ChartProps } from '../../types'
import type { RetentionChartData, RetentionResultRow } from '../../types/retention'
import { isRetentionData } from '../../types/retention'

/**
 * Get color with opacity based on retention rate
 * Uses a green gradient: higher retention = more saturated green
 */
function getRetentionColor(rate: number): string {
  // Clamp rate between 0 and 1
  const clampedRate = Math.max(0, Math.min(1, rate))

  // Use CSS variable for theming support
  // Fallback to a green color if CSS var not available
  const alpha = 0.1 + clampedRate * 0.7 // Range from 0.1 to 0.8 opacity

  // Green color (success color)
  return `rgba(34, 197, 94, ${alpha})`
}

/**
 * Get text color that contrasts with background
 */
function getTextColor(rate: number): string {
  // Use dark text for lower rates, light text for higher rates
  return rate > 0.5 ? '#ffffff' : 'var(--dc-text)'
}

/**
 * Format cohort period for display
 * Converts date strings to readable format
 */
function formatCohortPeriod(cohort: string): string {
  // If it's already in YYYY-MM format, return as-is
  if (/^\d{4}-\d{2}$/.test(cohort)) {
    return cohort
  }

  // Try to parse as date
  const date = new Date(cohort)
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
  }

  return cohort
}

/**
 * Format percentage for display
 */
function formatPercentage(rate: number): string {
  return `${Math.round(rate * 100)}%`
}

interface TooltipData {
  cohort: string
  period: number
  cohortSize: number
  retainedUsers: number
  retentionRate: number
  x: number
  y: number
}

/**
 * RetentionHeatmap Component
 */
const RetentionHeatmap = React.memo(function RetentionHeatmap({
  data,
  height = '100%',
  displayConfig,
}: ChartProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

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
      const breakdownValues = [...new Set(rows.map(r => r.breakdownValue || 'All Users'))].sort()
      const periods = [...new Set(rows.map(r => r.period))].sort((a, b) => a - b)

      return {
        rows,
        breakdownValues: breakdownValues.length > 1 || breakdownValues[0] !== 'All Users' ? breakdownValues : undefined,
        periods,
      }
    }

    return null
  }, [data])

  // Build matrix for display
  // In the new simplified format, rows are grouped by breakdownValue (or 'All Users' if no breakdown)
  const matrix = useMemo(() => {
    if (!retentionData) return null

    const { rows, breakdownValues, periods } = retentionData

    // Determine segments: use breakdownValues if available, otherwise single 'All Users' segment
    const segments = breakdownValues || ['All Users']

    // Create a lookup map for quick access: segment:period -> row
    const lookup = new Map<string, RetentionResultRow>()
    for (const row of rows) {
      const segment = row.breakdownValue || 'All Users'
      lookup.set(`${segment}:${row.period}`, row)
    }

    // Build matrix structure - one row per segment
    return segments.map((segment: string) => {
      const segmentRows = periods.map(period => {
        const row = lookup.get(`${segment}:${period}`)
        return row || null
      })

      // Get cohort size from period 0
      const period0 = segmentRows[0]
      const cohortSize = period0?.cohortSize ?? 0

      return {
        cohort: segment, // Keep 'cohort' key for compatibility with rendering
        cohortSize,
        periods: segmentRows,
      }
    })
  }, [retentionData])

  // Handle mouse enter on cell
  const handleMouseEnter = (
    event: React.MouseEvent,
    cohort: string,
    period: number,
    row: RetentionResultRow | null
  ) => {
    if (!row) return

    const rect = event.currentTarget.getBoundingClientRect()
    setTooltip({
      cohort,
      period,
      cohortSize: row.cohortSize,
      retainedUsers: row.retainedUsers,
      retentionRate: row.retentionRate,
      x: rect.left + rect.width / 2,
      y: rect.top,
    })
  }

  const handleMouseLeave = () => {
    setTooltip(null)
  }

  // Handle empty/loading states
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <div
        className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted"
        style={{ height }}
      >
        <div className="text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">No data available</div>
          <div className="dc:text-xs text-dc-text-secondary">
            Configure retention analysis to see results
          </div>
        </div>
      </div>
    )
  }

  if (!matrix || matrix.length === 0) {
    return (
      <div
        className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted"
        style={{ height }}
      >
        <div className="text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">Unable to render retention data</div>
          <div className="dc:text-xs text-dc-text-secondary">
            Data format may be incorrect
          </div>
        </div>
      </div>
    )
  }

  const periods = retentionData?.periods ?? []
  const showLegend = displayConfig?.showLegend ?? true

  return (
    <div className="dc:relative dc:w-full dc:h-full dc:overflow-auto" style={{ height }}>
      {/* Retention Matrix Table */}
      <table className="dc:w-full dc:border-collapse dc:text-sm">
        <thead className="dc:sticky dc:top-0 bg-dc-bg dc:z-10">
          <tr>
            <th className="text-left dc:p-2 dc:font-medium text-dc-text dc:border-b border-dc-border dc:min-w-[100px]">
              Cohort
            </th>
            <th className="text-right dc:p-2 dc:font-medium text-dc-text dc:border-b border-dc-border dc:min-w-[80px]">
              Users
            </th>
            {periods.map(period => (
              <th
                key={period}
                className="text-center dc:p-2 dc:font-medium text-dc-text dc:border-b border-dc-border dc:min-w-[60px]"
              >
                P{period}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, rowIndex) => (
            <tr key={row.cohort} className={rowIndex % 2 === 0 ? 'bg-dc-bg' : 'bg-dc-surface-secondary'}>
              <td className="dc:p-2 dc:font-medium text-dc-text dc:border-b border-dc-border dc:whitespace-nowrap">
                {formatCohortPeriod(row.cohort)}
              </td>
              <td className="dc:p-2 text-right text-dc-text-secondary dc:border-b border-dc-border">
                {row.cohortSize.toLocaleString()}
              </td>
              {row.periods.map((cell, periodIndex) => {
                const period = periods[periodIndex]
                const rate = cell?.retentionRate ?? 0
                const bgColor = cell ? getRetentionColor(rate) : 'transparent'
                const textColor = cell ? getTextColor(rate) : 'var(--dc-text-muted)'

                return (
                  <td
                    key={period}
                    className="dc:p-2 text-center dc:border-b border-dc-border dc:cursor-default dc:transition-opacity dc:hover:opacity-80"
                    style={{ backgroundColor: bgColor, color: textColor }}
                    onMouseEnter={(e) => handleMouseEnter(e, row.cohort, period, cell)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {cell ? formatPercentage(rate) : '-'}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Legend */}
      {showLegend && (
        <div className="dc:flex dc:items-center dc:justify-center dc:mt-4 dc:gap-2 dc:text-xs text-dc-text-secondary">
          <span>0%</span>
          <div className="dc:flex dc:h-4">
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map(rate => (
              <div
                key={rate}
                className="dc:w-6 dc:h-4"
                style={{ backgroundColor: getRetentionColor(rate) }}
              />
            ))}
          </div>
          <span>100%</span>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="dc:fixed dc:z-50 dc:px-3 dc:py-2 bg-dc-surface dc:border border-dc-border dc:rounded dc:shadow-lg dc:text-sm dc:pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y - 10,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="dc:font-medium text-dc-text dc:mb-1">
            {formatCohortPeriod(tooltip.cohort)} - Period {tooltip.period}
          </div>
          <div className="text-dc-text-secondary dc:space-y-0.5">
            <div>Cohort Size: {tooltip.cohortSize.toLocaleString()}</div>
            <div>Retained: {tooltip.retainedUsers.toLocaleString()}</div>
            <div className="dc:font-medium text-dc-text">
              Rate: {formatPercentage(tooltip.retentionRate)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default RetentionHeatmap
