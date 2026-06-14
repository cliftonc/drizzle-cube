import React, { useState, useMemo } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { LineChart as RechartsLineChart, Line, XAxis, CartesianGrid } from 'recharts'
import ChartContainer from './ChartContainer'
import ChartTooltip from './ChartTooltip'
import AngledXAxisTick from './AngledXAxisTick'
import { ChartEmptyState, ChartConfigError, ChartRenderError } from './ChartStates'
import { resolveChartAxisFields } from './chartAxisResolution'
import {
  getDualAxisInfo,
  getYAxisChartMargins,
  withTargetData,
  renderDualYAxes,
  renderChartTargetLines,
  makeCartesianTooltipFormatter,
  renderHoverLegend
} from './chartScaffolding'
import { CHART_COLORS } from '../../utils/chartConstants'
import { transformChartDataWithSeries, formatTimeValue, getFieldGranularity } from '../../utils/chartUtils'
import {
  isComparisonData,
  getPeriodLabels,
  transformForOverlayMode,
  isPriorPeriodSeries,
  getPriorPeriodStrokeDashArray
} from '../../utils/comparisonUtils'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel'
import type { ChartProps } from '../../types'

const LineChart = React.memo(function LineChart({
  data,
  chartConfig,
  displayConfig = {},
  queryObject,
  height = "100%",
  colorPalette,
  onDataPointClick,
  drillEnabled
}: ChartProps) {
  const { t } = useTranslation()
  const [hoveredLegend, setHoveredLegend] = useState<string | null>(null)
  // Use specialized hook to avoid re-renders from unrelated context changes
  const getFieldLabel = useCubeFieldLabel()

  // Resolve + validate axis fields (hooks-first to satisfy React rules).
  // xAxisField is aliased; it is narrowed to a definite string after the
  // errorCode guard inside the render body below.
  const { xAxisField: resolvedXAxisField, yAxisFields, seriesFields, errorCode } = useMemo(
    () => resolveChartAxisFields(chartConfig),
    [chartConfig]
  )

  // Dual Y-axis support: extract yAxisAssignment from chartConfig (memoized to prevent object recreation)
  // MUST be called before any early returns to satisfy React hooks rules
  const yAxisAssignment = useMemo(() =>
    chartConfig?.yAxisAssignment || {},
    [chartConfig?.yAxisAssignment]
  )

  // Build mapping from series key (label) to original field name (memoized to prevent object recreation)
  // This is needed because seriesKeys use display labels, not field names
  // MUST be called before any early returns to satisfy React hooks rules
  const seriesKeyToField = useMemo(() => {
    const mapping: Record<string, string> = {}
    yAxisFields.forEach((field) => {
      const label = getFieldLabel(field)
      mapping[label] = field
    })
    return mapping
  }, [yAxisFields, getFieldLabel])

  try {
    const safeDisplayConfig = {
      showLegend: displayConfig?.showLegend ?? true,
      showGrid: displayConfig?.showGrid ?? true,
      showTooltip: displayConfig?.showTooltip ?? true,
      connectNulls: displayConfig?.connectNulls ?? false
    }

    const showAllXLabels = displayConfig?.showAllXLabels ?? true

    // Extract axis format configs
    const leftYAxisFormat = displayConfig?.leftYAxisFormat
    const rightYAxisFormat = displayConfig?.rightYAxisFormat

    if (!data || data.length === 0) {
      return <ChartEmptyState height={height} hint={t('chart.runtime.noDataHint.line')} />
    }

    if (errorCode) {
      return <ChartConfigError height={height} hint={t(`chart.runtime.configErrorHint.${errorCode}`)} />
    }

    // The errorCode guard above guarantees xAxisField is defined here
    const xAxisField = resolvedXAxisField as string

    // Check if this is comparison data (has __periodIndex metadata)
    const hasComparisonData = isComparisonData(data)
    const priorPeriodStyle = displayConfig?.priorPeriodStyle || 'dashed'
    const priorPeriodOpacity = displayConfig?.priorPeriodOpacity ?? 0.5
    const periodLabels = hasComparisonData ? getPeriodLabels(data) : []

    // Transform data based on comparison mode
    let chartData: any[]
    let seriesKeys: string[]
    let effectiveXAxisKey = 'name' // Default X-axis key after transformation

    if (hasComparisonData) {
      // For comparison data, always use overlay transformation to align by period day index
      // Both 'separate' and 'overlay' modes use the same data transformation,
      // they differ only in styling (dashed lines, opacity for prior periods in overlay mode)
      const overlayResult = transformForOverlayMode(data, yAxisFields, xAxisField, getFieldLabel)
      chartData = overlayResult.data
      seriesKeys = overlayResult.seriesKeys
      effectiveXAxisKey = '__periodDayIndex'
    } else {
      // Standard mode: use normal transformation
      const standardResult = transformChartDataWithSeries(
        data,
        xAxisField,
        yAxisFields,
        queryObject,
        seriesFields,
        getFieldLabel
      )
      chartData = standardResult.data
      seriesKeys = standardResult.seriesKeys
    }

    // Helper to find field from series key, handling comparison suffixes like "(Current)" and "(Prior)"
    const findFieldFromSeriesKey = (seriesKey: string): string | undefined => {
      // Direct match first
      if (seriesKeyToField[seriesKey]) {
        return seriesKeyToField[seriesKey]
      }
      // For comparison data, strip the period suffix and any dimension prefix
      // Series keys look like: "Label (Current)", "Label (Prior)", or "DimValue - Label (Current)"

      // Guard against excessive input length to prevent ReDoS
      if (seriesKey.length > 1000) return undefined
      const withoutSuffix = seriesKey.replace(/\s*\((Current|Prior)\)$/, '')
      // Check if it has a dimension prefix (contains " - ")
      const parts = withoutSuffix.split(' - ')
      const measureLabel = parts[parts.length - 1] // Last part is the measure label
      return seriesKeyToField[measureLabel]
    }

    // Dual Y-axis derivation + margins (shared scaffolding)
    const axisInfo = getDualAxisInfo(yAxisFields, yAxisAssignment)
    const { hasRightAxis } = axisInfo

    // Determine if legend will be shown
    const showLegend = safeDisplayConfig.showLegend

    // Use custom chart margins with extra space for Y-axis labels
    const chartMargins = getYAxisChartMargins(hasRightAxis)

    // Process target values and add to chart data
    const { spreadTargets, enhancedChartData } = withTargetData(chartData, displayConfig?.target)

    // Validate transformed data
    if (!chartData || chartData.length === 0) {
      return (
        <ChartEmptyState
          height={height}
          titleKey="chart.runtime.noValidData"
          hint="No valid data points for line chart after transformation"
        />
      )
    }

    return (
      <ChartContainer height={height}>
        <RechartsLineChart data={enhancedChartData} margin={chartMargins} accessibilityLayer={false}>
          {safeDisplayConfig.showGrid && (
            <CartesianGrid strokeDasharray="3 3" style={{ pointerEvents: 'none' }} />
          )}
          <XAxis
            dataKey={effectiveXAxisKey}
            type="category"
            tick={<AngledXAxisTick tickFormatter={
              hasComparisonData
                ? (value: string | number, index: number) => {
                    // For comparison data, show the date from the current period
                    // formatted according to the query's granularity
                    const row = chartData[index]
                    if (row?.__displayDate) {
                      const granularity = getFieldGranularity(queryObject, xAxisField)
                      return formatTimeValue(row.__displayDate, granularity)
                    }
                    return `Period ${Number(value) + 1}`
                  }
                : undefined
            } />}
            height={60}
            interval={showAllXLabels ? 0 : undefined}
          />
          {renderDualYAxes(axisInfo, getFieldLabel, leftYAxisFormat, rightYAxisFormat)}
          {safeDisplayConfig.showTooltip && (
            <ChartTooltip
              formatter={makeCartesianTooltipFormatter({
                leftYAxisFormat,
                rightYAxisFormat,
                yAxisAssignment,
                resolveField: findFieldFromSeriesKey
              })}
              labelFormatter={
                hasComparisonData
                  ? (label: any, payload: any) => {
                      // For comparison data, show the date from the current period
                      // formatted according to the query's granularity
                      if (payload && payload.length > 0) {
                        const row = payload[0]?.payload
                        if (row?.__displayDate) {
                          const granularity = getFieldGranularity(queryObject, xAxisField)
                          return formatTimeValue(row.__displayDate, granularity)
                        }
                      }
                      return `Period ${Number(label) + 1}`
                    }
                  : undefined
              }
            />
          )}
          {renderHoverLegend({
            show: showLegend,
            iconType: 'line',
            paddingTop: 25,
            onHover: setHoveredLegend,
            onLeave: () => setHoveredLegend(null)
          })}
          {seriesKeys.map((seriesKey, index) => {
            // Look up the original field name to get its axis assignment
            const originalField = findFieldFromSeriesKey(seriesKey)
            const axisId = originalField && yAxisAssignment[originalField] === 'right' ? 'right' : 'left'

            // Determine if this is a prior period series (for styling)
            const isPriorPeriod = hasComparisonData && isPriorPeriodSeries(seriesKey, periodLabels)
            const strokeDashArray = isPriorPeriod ? getPriorPeriodStrokeDashArray(priorPeriodStyle) : undefined
            const opacity = isPriorPeriod ? priorPeriodOpacity : 1

            // When drill is enabled, show persistent dots for better click targets
            const lineColor = (colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) ||
              CHART_COLORS[index % CHART_COLORS.length]

            return (
              <Line
                key={seriesKey}
                type="monotone"
                dataKey={seriesKey}
                yAxisId={axisId}
                stroke={lineColor}
                strokeWidth={isPriorPeriod ? 1.5 : 2}
                strokeDasharray={strokeDashArray}
                dot={isPriorPeriod ? false : (props: any) => {
                  const { cx, cy, payload, key } = props
                  if (cx === undefined || cy === undefined) return null

                  const handleClick = (event: React.MouseEvent) => {
                    event.stopPropagation()
                    event.preventDefault()
                    if (onDataPointClick) {
                      onDataPointClick({
                        dataPoint: payload,
                        clickedField: originalField || seriesKey,
                        xValue: payload.name,
                        position: { x: event.clientX, y: event.clientY },
                        nativeEvent: event
                      })
                    }
                  }

                  // When drill is enabled, render clickable dots with background to mask grid
                  if (drillEnabled && onDataPointClick) {
                    return (
                      <g key={key}>
                        {/* Background to mask grid lines - uses theme surface color */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={6}
                          fill="var(--dc-surface)"
                          style={{ pointerEvents: 'none' }}
                        />
                        {/* Visible dot with click handler */}
                        <circle
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill="var(--dc-surface)"
                          stroke={lineColor}
                          strokeWidth={2}
                          cursor="pointer"
                          onClick={(e: React.MouseEvent<SVGCircleElement>) => {
                            handleClick(e as unknown as React.MouseEvent)
                          }}
                        />
                      </g>
                    )
                  }

                  // Non-drill mode: simple small dot
                  return (
                    <circle
                      key={key}
                      cx={cx}
                      cy={cy}
                      r={3}
                      fill={lineColor}
                    />
                  )
                }}
                activeDot={false}
                strokeOpacity={
                  hoveredLegend
                    ? (hoveredLegend === seriesKey ? 1 : 0.3)
                    : opacity
                }
                connectNulls={safeDisplayConfig.connectNulls}
              />
            )
          })}
          {renderChartTargetLines(spreadTargets)}
        </RechartsLineChart>
      </ChartContainer>
    )
  } catch (error) {
    return <ChartRenderError height={height} chartType="Line Chart" error={error} />
  }
})

export default LineChart
