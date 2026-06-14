import React, { useState, useMemo } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { ComposedChart, Area, XAxis, CartesianGrid } from 'recharts'
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
import { transformChartDataWithSeries } from '../../utils/chartUtils'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel'
import type { ChartProps } from '../../types'

const AreaChart = React.memo(function AreaChart({
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

  // Resolve + validate axis fields (hooks-first to satisfy React rules)
  const { xAxisField, yAxisFields, seriesFields, errorCode } = useMemo(
    () => resolveChartAxisFields(chartConfig),
    [chartConfig]
  )

  // Dual Y-axis support: extract yAxisAssignment from chartConfig
  const yAxisAssignment = useMemo(() =>
    chartConfig?.yAxisAssignment || {},
    [chartConfig?.yAxisAssignment]
  )

  // Use shared function to transform data and handle series
  // (empty arrays when config is invalid — early returns happen after hooks)
  const { data: chartData, seriesKeys } = useMemo(() => {
    if (errorCode || !data || data.length === 0 || !xAxisField) {
      return { data: [], seriesKeys: [] }
    }
    return transformChartDataWithSeries(
      data,
      xAxisField,
      yAxisFields,
      queryObject,
      seriesFields,
      getFieldLabel
    )
  }, [data, xAxisField, yAxisFields, queryObject, seriesFields, getFieldLabel, errorCode])

  try {
    // Determine stacking from stackType (new) or stacked (legacy)
    const stackType = displayConfig?.stackType ?? (displayConfig?.stacked ? 'normal' : 'none')
    const shouldStack = stackType !== 'none'
    const isPercentStack = stackType === 'percent'

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
      return <ChartEmptyState height={height} hint={t('chart.runtime.noDataHint.area')} />
    }

    if (errorCode) {
      return <ChartConfigError height={height} hint={t(`chart.runtime.configErrorHint.${errorCode}`)} />
    }

    // Build mapping from series key (label) to original field name
    const seriesKeyToField: Record<string, string> = {}
    yAxisFields.forEach((field) => {
      const label = getFieldLabel(field)
      seriesKeyToField[label] = field
    })

    // Dual Y-axis derivation + margins (shared scaffolding)
    const axisInfo = getDualAxisInfo(yAxisFields, yAxisAssignment)
    const { hasRightAxis } = axisInfo

    // Disable stacking when dual Y-axis is used (areas on different axes can't be stacked)
    const effectiveShouldStack = shouldStack && !hasRightAxis
    const effectiveIsPercentStack = isPercentStack && !hasRightAxis

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
          hint="No valid data points for area chart after transformation"
        />
      )
    }

    // Determine stack offset for percentage stacking
    const stackOffset = effectiveIsPercentStack ? ('expand' as const) : undefined

    return (
      <ChartContainer height={height}>
        <ComposedChart data={enhancedChartData} margin={chartMargins} stackOffset={stackOffset} accessibilityLayer={false}>
          {safeDisplayConfig.showGrid && <CartesianGrid strokeDasharray="3 3" style={{ pointerEvents: 'none' }} />}
          <XAxis dataKey="name" type="category" tick={<AngledXAxisTick />} height={60} interval={showAllXLabels ? 0 : undefined} />
          {renderDualYAxes(axisInfo, getFieldLabel, leftYAxisFormat, rightYAxisFormat, effectiveIsPercentStack)}
          {safeDisplayConfig.showTooltip && (
            <ChartTooltip
              formatter={makeCartesianTooltipFormatter({
                leftYAxisFormat,
                rightYAxisFormat,
                yAxisAssignment,
                resolveField: (name) => seriesKeyToField[name],
                isPercentStack: effectiveIsPercentStack
              })}
            />
          )}
          {renderHoverLegend({
            show: showLegend,
            iconType: 'rect',
            paddingTop: 10,
            onHover: setHoveredLegend,
            onLeave: () => setHoveredLegend(null)
          })}
          {seriesKeys.map((seriesKey, index) => {
            // Look up the original field name to get its axis assignment
            const originalField = seriesKeyToField[seriesKey]
            const axisId = originalField && yAxisAssignment[originalField] === 'right' ? 'right' : 'left'
            // When drill is enabled, show persistent dots for better click targets
            const areaColor = (colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) ||
              CHART_COLORS[index % CHART_COLORS.length]

            return (
              <Area
                key={seriesKey}
                type="monotone"
                dataKey={seriesKey}
                yAxisId={axisId}
                stackId={effectiveShouldStack ? 'stack' : undefined}
                stroke={areaColor}
                fill={areaColor}
                fillOpacity={hoveredLegend ? (hoveredLegend === seriesKey ? 0.6 : 0.1) : 0.3}
                strokeWidth={2}
                strokeOpacity={hoveredLegend ? (hoveredLegend === seriesKey ? 1 : 0.3) : 1}
                connectNulls={safeDisplayConfig.connectNulls}
                dot={(props: any) => {
                  const { cx, cy, payload, key } = props
                  if (!drillEnabled || cx === undefined || cy === undefined) return null

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
                        stroke={areaColor}
                        strokeWidth={2}
                        cursor="pointer"
                        onClick={(e: React.MouseEvent<SVGCircleElement>) => {
                          handleClick(e as unknown as React.MouseEvent)
                        }}
                      />
                    </g>
                  )
                }}
                activeDot={false}
              />
            )
          })}
          {renderChartTargetLines(spreadTargets)}
        </ComposedChart>
      </ChartContainer>
    )
  } catch (error) {
    return <ChartRenderError height={height} chartType="Area Chart" error={error} />
  }
})

export default AreaChart
