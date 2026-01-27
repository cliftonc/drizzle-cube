/**
 * FunnelChart Component
 *
 * Visualizes funnel data showing conversion rates between steps.
 * Uses horizontal bars with percentage widths to represent the funnel shape.
 * Works with data from useFunnelQuery hook which provides FunnelChartData.
 *
 * When displayConfig.showFunnelTimeMetrics is enabled, displays time-to-convert
 * metrics from server-side funnel execution (avg, median, P90 seconds).
 */

import React, { useMemo } from 'react'
import { FunnelChart as RechartsFunnelChart, Funnel, LabelList, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { CHART_COLORS } from '../../utils/chartConstants'
import type { ChartProps } from '../../types'
import type { FunnelChartData } from '../../types/funnel'
import { formatDuration } from '../../utils/funnelExecution'

// Color gradient for funnel steps (darker to lighter)
const FUNNEL_COLORS = [
  '#3B82F6', // blue-500
  '#60A5FA', // blue-400
  '#93C5FD', // blue-300
  '#BFDBFE', // blue-200
  '#DBEAFE', // blue-100
]

/**
 * Get color for a funnel step
 */
function getStepColor(index: number, colorPalette?: string[]): string {
  const colors = colorPalette || FUNNEL_COLORS
  return colors[index % colors.length]
}

/**
 * Check if data is funnel data format
 */
function isFunnelData(data: unknown[]): data is FunnelChartData[] {
  if (!data || data.length === 0) return false
  const first = data[0]
  return (
    typeof first === 'object' &&
    first !== null &&
    'name' in first &&
    'value' in first &&
    'percentage' in first
  )
}

/**
 * Render time metrics based on config options - returns array of lines for vertical stacking
 */
function getTimeMetricsLines(
  step: FunnelChartData,
  showAvg: boolean,
  showMedian: boolean,
  showP90: boolean
): string[] {
  const lines: string[] = []
  if (showAvg && step.avgSecondsToConvert != null) {
    lines.push(`Avg: ${formatDuration(step.avgSecondsToConvert)}`)
  }
  if (showMedian && step.medianSecondsToConvert != null) {
    lines.push(`Med: ${formatDuration(step.medianSecondsToConvert)}`)
  }
  if (showP90 && step.p90SecondsToConvert != null) {
    lines.push(`P90: ${formatDuration(step.p90SecondsToConvert)}`)
  }
  return lines
}

/**
 * FunnelChart Component
 *
 * Renders a funnel visualization from FunnelChartData array.
 * Shows each step as a horizontal bar with width proportional to count.
 * Displays conversion rates between steps.
 */
const FunnelChart = React.memo(function FunnelChart({
  data,
  height = '100%',
  colorPalette,
  displayConfig,
}: ChartProps) {
  // Get display config options
  const customStepLabels = displayConfig?.funnelStepLabels
  const orientation = displayConfig?.funnelOrientation || 'horizontal'
  const isVertical = orientation === 'vertical'
  const funnelStyle = displayConfig?.funnelStyle ?? 'bars'
  const showConversion = displayConfig?.showFunnelConversion ?? true

  // Time metrics - individual toggles with backward compat for showFunnelTimeMetrics
  const showAvgTime = displayConfig?.showFunnelAvgTime ??
    (displayConfig?.showFunnelTimeMetrics ?? false) // backward compat
  const showMedianTime = displayConfig?.showFunnelMedianTime ?? false
  const showP90Time = displayConfig?.showFunnelP90Time ?? false

  // Transform data if needed
  const funnelData = useMemo<FunnelChartData[]>(() => {
    if (!data || data.length === 0) return []

    // If already funnel data format, use directly
    if (isFunnelData(data)) {
      return data
    }

    // Try to convert from raw query results
    // Look for common patterns: step/name, count/value, percentage
    return data.map((row, index) => {
      const record = row as Record<string, unknown>

      // Find name field
      const nameField = Object.keys(record).find(
        (k) => k.toLowerCase().includes('step') || k.toLowerCase().includes('name') || k === '__stepName'
      )
      const name = nameField ? String(record[nameField]) : `Step ${index + 1}`

      // Find value field
      const valueField = Object.keys(record).find(
        (k) => k.toLowerCase().includes('count') || k.toLowerCase().includes('value') || k === '__count'
      )
      const value = valueField ? Number(record[valueField]) || 0 : 0

      // Find percentage field
      const percentField = Object.keys(record).find(
        (k) => k.toLowerCase().includes('percent') || k === '__percentage'
      )
      const percentage = percentField ? Number(record[percentField]) || 0 : 0

      // Find conversion rate field
      const convRateField = Object.keys(record).find(
        (k) => k.toLowerCase().includes('conversion') || k === '__conversionRate'
      )
      const conversionRate = convRateField ? Number(record[convRateField]) || null : null

      return {
        name,
        value,
        percentage,
        conversionRate,
        stepIndex: index,
      }
    })
  }, [data])

  // Calculate first step value for percentage calculations
  const firstStepValue = funnelData[0]?.value || 0

  // Handle no data
  if (!data || data.length === 0 || funnelData.length === 0) {
    return (
      <div
        className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted"
        style={{ height }}
      >
        <div className="text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">No funnel data</div>
          <div className="dc:text-xs text-dc-text-secondary">
            Configure a funnel with at least 2 steps and a binding key
          </div>
        </div>
      </div>
    )
  }

  const paletteColors = colorPalette?.colors || CHART_COLORS

  // Render Recharts Funnel style (trapezoid shape)
  if (funnelStyle === 'funnel') {
    // Recharts FunnelChart layout: 'horizontal' = funnel flows left-to-right, 'vertical' = top-to-bottom (default)
    // Our config: 'horizontal' orientation = standard top-to-bottom funnel
    //             'vertical' orientation = left-to-right funnel
    const rechartsLayout: 'horizontal' | 'vertical' = isVertical ? 'horizontal' : 'vertical'

    return (
      <div className="dc:relative dc:w-full dc:h-full dc:flex dc:flex-col" style={{ height }}>
        <div className="dc:flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsFunnelChart layout={rechartsLayout} accessibilityLayer={false}>
              <Tooltip
                formatter={(value) => typeof value === 'number' ? value.toLocaleString() : String(value)}
                contentStyle={{
                  backgroundColor: 'var(--dc-surface)',
                  border: '1px solid var(--dc-border)',
                  borderRadius: '4px',
                }}
              />
              <Funnel
                dataKey="value"
                nameKey="name"
                data={funnelData}
                isAnimationActive
              >
                {funnelData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={getStepColor(index, paletteColors)} />
                ))}
                <LabelList
                  position="right"
                  dataKey="name"
                  fill="var(--dc-text)"
                  style={{ fontSize: '12px' }}
                />
                <LabelList
                  position="center"
                  dataKey="percentage"
                  formatter={(v) => typeof v === 'number' ? `${v.toFixed(1)}%` : String(v)}
                  fill="#fff"
                  style={{ fontSize: '11px', fontWeight: 500 }}
                />
              </Funnel>
            </RechartsFunnelChart>
          </ResponsiveContainer>
        </div>
        {/* Summary Footer */}
        {!displayConfig?.hideSummaryFooter && (
          <div className="dc:flex-shrink-0 dc:px-4 dc:py-2 dc:border-t border-dc-border bg-dc-surface-secondary">
            <div className="dc:flex dc:items-center dc:justify-between dc:text-sm">
              <div className="text-dc-text-muted">
                <span className="dc:font-medium">{funnelData.length}</span> steps
              </div>
              <div className="text-dc-text">
                <span className="text-dc-text-muted">Overall:</span>{' '}
                <span className="dc:font-medium">
                  {firstStepValue > 0
                    ? `${((funnelData[funnelData.length - 1]?.value || 0) / firstStepValue * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              <div className="text-dc-text-muted">
                {funnelData[funnelData.length - 1]?.value.toLocaleString() || 0} / {firstStepValue.toLocaleString()} completed
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render vertical orientation (bars grow from bottom to top, steps laid out horizontally)
  if (isVertical) {
    return (
      <div className="dc:relative dc:w-full dc:h-full dc:flex dc:flex-col" style={{ height }}>
        {/* Funnel Steps - Vertical Layout */}
        <div className="dc:flex-1 dc:flex dc:items-end dc:justify-center dc:gap-4 dc:px-4 dc:py-3 dc:overflow-hidden">
          {funnelData.map((step, index) => {
            const heightPercent = firstStepValue > 0 ? (step.value / firstStepValue) * 100 : 0
            const prevStep = index > 0 ? funnelData[index - 1] : null
            const stepConversionRate = prevStep && prevStep.value > 0
              ? (step.value / prevStep.value) * 100
              : null

            // Use custom label if provided, otherwise fall back to step name
            const displayName = customStepLabels?.[index] || step.name

            const timeMetricsLines = getTimeMetricsLines(step, showAvgTime, showMedianTime, showP90Time)
            const metricsCount = timeMetricsLines.length

            return (
              <div key={step.name} className="dc:flex dc:flex-col dc:items-center dc:gap-2 dc:flex-1 dc:max-w-32 dc:h-full">
                {/* Conversion Rate from Previous (top) */}
                <div className={`${metricsCount > 0 ? (metricsCount > 1 ? 'dc:min-h-16' : 'dc:min-h-10') : 'dc:h-5'} dc:flex-shrink-0 text-center`}>
                  {stepConversionRate !== null ? (
                    <div className="dc:text-xs text-dc-text-secondary">
                      {showConversion && <span>→ {stepConversionRate.toFixed(1)}%</span>}
                      {/* Time metrics (when enabled) */}
                      {metricsCount > 0 && (
                        <div className="text-dc-text-muted dc:mt-0.5 dc:space-y-0.5">
                          {timeMetricsLines.map((line, i) => (
                            <div key={i}>⏱ {line}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="dc:text-xs text-dc-text-muted">—</div>
                  )}
                </div>

                {/* Bar Container */}
                <div className="dc:flex-1 dc:w-full dc:relative dc:min-h-12">
                  {/* Background Track */}
                  <div className="dc:absolute dc:inset-0 bg-dc-surface-secondary dc:rounded-sm" />

                  {/* Filled Bar (grows from bottom) */}
                  <div
                    className="dc:absolute dc:bottom-0 dc:left-0 dc:right-0 dc:rounded-sm dc:transition-all dc:duration-300"
                    style={{
                      height: `${Math.max(heightPercent, 5)}%`,
                      backgroundColor: getStepColor(index, paletteColors),
                    }}
                  />

                  {/* Percentage Label on Bar */}
                  <div
                    className="dc:absolute dc:bottom-0 dc:left-0 dc:right-0 dc:flex dc:items-end dc:justify-center dc:pb-1 dc:pointer-events-none"
                    style={{ height: `${Math.max(heightPercent, 20)}%` }}
                  >
                    <span className="dc:text-xs dc:font-medium text-white dc:drop-shadow-sm">
                      {step.percentage?.toFixed(1) ?? heightPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Step Label (bottom) */}
                <div className="dc:flex-shrink-0 text-center">
                  <div className="dc:text-sm dc:font-medium text-dc-text dc:truncate" title={displayName}>
                    {displayName}
                  </div>
                  <div className="dc:text-xs text-dc-text-muted">
                    {step.value.toLocaleString()}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Summary Footer */}
        {!displayConfig?.hideSummaryFooter && (
          <div className="dc:flex-shrink-0 dc:px-4 dc:py-2 dc:border-t border-dc-border bg-dc-surface-secondary">
            <div className="dc:flex dc:items-center dc:justify-between dc:text-sm">
              <div className="text-dc-text-muted">
                <span className="dc:font-medium">{funnelData.length}</span> steps
              </div>
              <div className="text-dc-text">
                <span className="text-dc-text-muted">Overall:</span>{' '}
                <span className="dc:font-medium">
                  {firstStepValue > 0
                    ? `${((funnelData[funnelData.length - 1]?.value || 0) / firstStepValue * 100).toFixed(1)}%`
                    : '0%'}
                </span>
              </div>
              <div className="text-dc-text-muted">
                {funnelData[funnelData.length - 1]?.value.toLocaleString() || 0} / {firstStepValue.toLocaleString()} completed
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Render horizontal orientation (default - bars grow left to right, steps stacked vertically)
  return (
    <div className="dc:relative dc:w-full dc:h-full dc:flex dc:flex-col" style={{ height }}>
      {/* Funnel Steps - Horizontal Layout */}
      <div className="dc:flex-1 dc:flex dc:flex-col dc:justify-center dc:gap-2 dc:px-4 dc:py-3 dc:overflow-hidden">
        {funnelData.map((step, index) => {
          const widthPercent = firstStepValue > 0 ? (step.value / firstStepValue) * 100 : 0
          const prevStep = index > 0 ? funnelData[index - 1] : null
          const stepConversionRate = prevStep && prevStep.value > 0
            ? (step.value / prevStep.value) * 100
            : null

          // Use custom label if provided, otherwise fall back to step name
          const displayName = customStepLabels?.[index] || step.name
          const timeMetricsLines = getTimeMetricsLines(step, showAvgTime, showMedianTime, showP90Time)
          const metricsCount = timeMetricsLines.length

          return (
            <div key={step.name} className="dc:flex dc:items-center dc:gap-3">
              {/* Step Label */}
              <div className="dc:w-24 dc:flex-shrink-0 text-right">
                <div className="dc:text-sm dc:font-medium text-dc-text dc:truncate" title={displayName}>
                  {displayName}
                </div>
                <div className="dc:text-xs text-dc-text-muted">
                  {step.value.toLocaleString()}
                </div>
              </div>

              {/* Bar Container */}
              <div className="dc:flex-1 dc:relative">
                {/* Background Track */}
                <div className="dc:w-full dc:h-8 bg-dc-surface-secondary dc:rounded-sm" />

                {/* Filled Bar */}
                <div
                  className="dc:absolute dc:top-0 dc:left-0 dc:h-8 dc:rounded-sm dc:transition-all dc:duration-300"
                  style={{
                    width: `${Math.max(widthPercent, 2)}%`,
                    backgroundColor: getStepColor(index, paletteColors),
                  }}
                />

                {/* Percentage Label on Bar */}
                <div
                  className="dc:absolute dc:top-0 dc:left-0 dc:h-8 dc:flex dc:items-center dc:px-2 dc:pointer-events-none"
                  style={{ width: `${Math.max(widthPercent, 20)}%` }}
                >
                  <span className="dc:text-xs dc:font-medium text-white dc:drop-shadow-sm">
                    {step.percentage?.toFixed(1) ?? widthPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Conversion Rate from Previous */}
              <div className={`${metricsCount > 0 ? (metricsCount > 1 ? 'dc:w-36' : 'dc:w-28') : 'dc:w-16'} dc:flex-shrink-0 text-left`}>
                {stepConversionRate !== null ? (
                  <div className="dc:text-xs text-dc-text-secondary">
                    {showConversion && <span>↓ {stepConversionRate.toFixed(1)}%</span>}
                    {/* Time metrics (when enabled) */}
                    {metricsCount > 0 && (
                      <div className="text-dc-text-muted dc:mt-0.5 dc:space-y-0.5">
                        {timeMetricsLines.map((line, i) => (
                          <div key={i}>⏱ {line}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="dc:text-xs text-dc-text-muted">—</div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Summary Footer */}
      {!displayConfig?.hideSummaryFooter && (
        <div className="dc:flex-shrink-0 dc:px-4 dc:py-2 dc:border-t border-dc-border bg-dc-surface-secondary">
          <div className="dc:flex dc:items-center dc:justify-between dc:text-sm">
            <div className="text-dc-text-muted">
              <span className="dc:font-medium">{funnelData.length}</span> steps
            </div>
            <div className="text-dc-text">
              <span className="text-dc-text-muted">Overall:</span>{' '}
              <span className="dc:font-medium">
                {firstStepValue > 0
                  ? `${((funnelData[funnelData.length - 1]?.value || 0) / firstStepValue * 100).toFixed(1)}%`
                  : '0%'}
              </span>
            </div>
            <div className="text-dc-text-muted">
              {funnelData[funnelData.length - 1]?.value.toLocaleString() || 0} / {firstStepValue.toLocaleString()} completed
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default FunnelChart
