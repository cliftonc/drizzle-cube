import React from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import { formatAxisValue } from '../../utils/chartUtils.js'
import { POSITIVE_COLOR, NEGATIVE_COLOR } from '../../utils/chartConstants.js'
import type { SeriesSummary } from './cartesianChartHelpers.js'
import type { AxisFormatConfig } from '../../types.js'

interface ChartSummaryHeaderProps {
  summaries: SeriesSummary[]
  /** Resolves a series key to its display label. */
  getSeriesLabel: (seriesKey: string) => string
  /** Numeric format, so the header matches the axis it summarises. */
  valueFormat?: AxisFormatConfig
  /**
   * Whether a change vs. the start of the window is meaningful. False for a
   * categorical x-axis, where "first" and "last" are arbitrary categories.
   */
  showChange?: boolean
  /**
   * Distance from the container's left edge to the plot area, so the summary
   * lines up with the first data point rather than the card edge.
   */
  leftOffset?: number
}

/** Fixed height reserved for the band, so callers can subtract it from the plot. */
export const CHART_SUMMARY_HEADER_HEIGHT = 56

/**
 * Summary band rendered above a time-series plot.
 *
 * Shows each series' latest value and how far it has moved since the start of
 * the window, so the chart is readable without hovering. All values are derived
 * from the already-fetched result set — this issues no queries of its own.
 */
const ChartSummaryHeader = React.memo(function ChartSummaryHeader({
  summaries,
  getSeriesLabel,
  valueFormat,
  showChange = true,
  leftOffset = 0
}: ChartSummaryHeaderProps) {
  const { t } = useTranslation()

  if (summaries.length === 0) return null

  return (
    <div
      className="dc:flex dc:flex-wrap dc:items-start dc:gap-x-8 dc:gap-y-2 dc:flex-shrink-0 dc:pr-1 dc:pb-2 dc:overflow-hidden"
      style={{ minHeight: CHART_SUMMARY_HEADER_HEIGHT, paddingLeft: leftOffset }}
      data-testid="chart-summary-header"
    >
      {summaries.map((summary) => {
        const hasChange = showChange && summary.absoluteChange !== null
        const isPositive = (summary.absoluteChange ?? 0) >= 0
        return (
          <div key={summary.seriesKey} className="dc:flex dc:flex-col dc:gap-0.5 dc:min-w-0">
            <div className="dc:flex dc:items-center dc:gap-1.5 dc:min-w-0">
              <span
                className="dc:rounded-full dc:flex-shrink-0"
                style={{ width: 8, height: 8, backgroundColor: summary.color }}
              />
              <span className="text-dc-text-secondary dc:truncate" style={{ fontSize: '12px' }}>
                {getSeriesLabel(summary.seriesKey)}
              </span>
            </div>

            <div className="dc:font-semibold dc:leading-none text-dc-text" style={{ fontSize: '24px' }}>
              {summary.current === null
                ? '—'
                : formatAxisValue(summary.current, valueFormat)}
            </div>

            {hasChange && (
              <div style={{ fontSize: '11px' }} className="dc:truncate">
                <span
                  className="dc:font-semibold"
                  style={{ color: isPositive ? POSITIVE_COLOR : NEGATIVE_COLOR }}
                >
                  {isPositive ? '+' : ''}
                  {formatAxisValue(summary.absoluteChange, valueFormat)}
                  {summary.percentageChange !== null && (
                    <> ({isPositive ? '+' : ''}{summary.percentageChange.toFixed(1)}%)</>
                  )}
                </span>{' '}
                <span className="text-dc-text-muted">
                  {t('chart.runtime.summarySincePeriodStart')}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})

export default ChartSummaryHeader
