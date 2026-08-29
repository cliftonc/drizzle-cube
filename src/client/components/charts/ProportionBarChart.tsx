import React, { useMemo } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel.js'
import { ChartEmptyState, ChartConfigError, ChartRenderError } from './ChartStates.js'
import { getSeriesColor } from './cartesianChartHelpers.js'
import { formatAxisValue } from '../../utils/chartUtils.js'
import type { ChartProps } from '../../types.js'

interface Segment {
  label: string
  value: number
  share: number
  color: string
}

/**
 * A single 100%-wide stacked bar plus a labelled percentage legend.
 *
 * A flatter alternative to a pie chart for part-to-whole breakdowns: shares are
 * far easier to compare along one axis than as angles, and it costs a fraction
 * of the vertical space. Deliberately plain HTML rather than Recharts — there is
 * no axis, scale or interaction to justify an SVG chart.
 */
const ProportionBarChart = React.memo(function ProportionBarChart({
  data,
  chartConfig,
  displayConfig = {},
  height = '100%',
  colorPalette
}: ChartProps) {
  const { t } = useTranslation()
  const getFieldLabel = useCubeFieldLabel()

  const categoryField = useMemo(() => {
    const x = chartConfig?.xAxis
    return (Array.isArray(x) ? x[0] : x) || ''
  }, [chartConfig?.xAxis])

  const valueField = useMemo(() => {
    const y = chartConfig?.yAxis
    return (Array.isArray(y) ? y[0] : y) || ''
  }, [chartConfig?.yAxis])

  const sortSegments = displayConfig.sortSegments ?? false

  const { segments, total } = useMemo(() => {
    if (!data || !categoryField || !valueField) return { segments: [] as Segment[], total: 0 }

    const rows = data
      .map((row: any) => {
        const raw = row?.[valueField]
        const num = typeof raw === 'number' ? raw : parseFloat(String(raw))
        return {
          label: String(row?.[categoryField] ?? ''),
          // Negative shares cannot be drawn in a part-to-whole bar.
          value: !isNaN(num) && isFinite(num) && num > 0 ? num : 0
        }
      })
      .filter((row) => row.value > 0)

    if (sortSegments) rows.sort((a, b) => b.value - a.value)

    const sum = rows.reduce((acc, row) => acc + row.value, 0)
    return {
      total: sum,
      segments: rows.map((row, index) => ({
        ...row,
        share: sum > 0 ? (row.value / sum) * 100 : 0,
        color: getSeriesColor(colorPalette, index)
      }))
    }
  }, [data, categoryField, valueField, colorPalette, sortSegments])

  try {
    if (!data || data.length === 0) {
      return <ChartEmptyState height={height} hint={t('chart.runtime.noDataHint.proportionBar')} />
    }

    if (!categoryField || !valueField) {
      return <ChartConfigError height={height} hint={t('chart.runtime.configErrorHint.proportionBar')} />
    }

    if (segments.length === 0 || total === 0) {
      return (
        <ChartEmptyState
          height={height}
          titleKey="chart.runtime.noValidData"
          hint={t('chart.runtime.noValidDataHint.proportionBar')}
        />
      )
    }

    const showLabels = displayConfig.showLabels ?? true
    const showPercentages = displayConfig.showPercentages ?? true
    const decimals = displayConfig.decimals ?? 0

    return (
      <div
        className="dc:w-full dc:h-full dc:flex dc:flex-col dc:justify-center dc:gap-3 dc:px-3 dc:py-2 dc:overflow-hidden"
        // Fill the parent rather than the `height` prop, which is a pixel value
        // that can exceed the visible panel and push this short content low.
        style={{ height: '100%', minHeight: '80px' }}
        data-testid="proportion-bar"
      >
        <div className="dc:flex dc:w-full dc:overflow-hidden dc:rounded-sm" style={{ height: 10 }}>
          {segments.map((segment) => (
            <div
              key={segment.label}
              data-testid="proportion-bar-segment"
              title={`${segment.label}: ${formatAxisValue(segment.value, displayConfig.leftYAxisFormat)}`}
              style={{ width: `${segment.share}%`, backgroundColor: segment.color }}
            />
          ))}
        </div>

        {(showLabels || showPercentages) && (
          <div className="dc:flex dc:flex-wrap dc:gap-x-6 dc:gap-y-2">
            {segments.map((segment) => (
              <div key={segment.label} className="dc:flex dc:flex-col dc:gap-0.5 dc:min-w-0">
                {showLabels && (
                  <span
                    className="text-dc-text-muted dc:uppercase dc:truncate dc:font-semibold"
                    style={{ fontSize: '11px', letterSpacing: '0.06em' }}
                  >
                    {segment.label}
                  </span>
                )}
                {showPercentages && (
                  <span
                    className="dc:font-semibold dc:leading-none"
                    style={{ fontSize: '18px', color: segment.color }}
                  >
                    {segment.share.toFixed(decimals)}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  } catch (error) {
    return <ChartRenderError height={height} chartType={getFieldLabel(valueField)} error={error} />
  }
})

export default ProportionBarChart
