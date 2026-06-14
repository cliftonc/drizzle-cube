import React, { useState, useMemo } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { ComposedChart, Bar, XAxis, CartesianGrid, Cell } from 'recharts'
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
import { CHART_COLORS, POSITIVE_COLOR, NEGATIVE_COLOR } from '../../utils/chartConstants'
import { transformChartDataWithSeries, isValidNumericValue } from '../../utils/chartUtils'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel'
import type { ChartProps } from '../../types'

const BarChart = React.memo(function BarChart({
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

  // Determine stacking from stackType (new) or stacked (legacy)
  const stackType = displayConfig?.stackType ?? (displayConfig?.stacked ? 'normal' : 'none')
  const shouldStack = stackType !== 'none'
  const isPercentStack = stackType === 'percent'

  const safeDisplayConfig = {
    showLegend: displayConfig?.showLegend ?? true,
    showGrid: displayConfig?.showGrid ?? true,
    showTooltip: displayConfig?.showTooltip ?? true
  }

  const showAllXLabels = displayConfig?.showAllXLabels ?? true

  // Extract axis format configs
  const leftYAxisFormat = displayConfig?.leftYAxisFormat
  const rightYAxisFormat = displayConfig?.rightYAxisFormat

  // Resolve + validate axis fields (hooks-first; early returns happen after all hooks)
  const { xAxisField, yAxisFields, seriesFields, errorCode } = useMemo(
    () => resolveChartAxisFields(chartConfig),
    [chartConfig]
  )

  // Transform data (will be empty arrays if config is invalid)
  const { data: transformedData, seriesKeys } = useMemo(() => {
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

  // Dual Y-axis support: extract yAxisAssignment from chartConfig (memoized to prevent object recreation)
  const yAxisAssignment = useMemo(() =>
    chartConfig?.yAxisAssignment || {},
    [chartConfig?.yAxisAssignment]
  )

  // Build mapping from series key (label) to original field name
  const seriesKeyToField: Record<string, string> = useMemo(() => {
    const mapping: Record<string, string> = {}
    yAxisFields.forEach((field) => {
      const label = getFieldLabel(field)
      mapping[label] = field
    })
    return mapping
  }, [yAxisFields, getFieldLabel])

  // Dual Y-axis derivation (shared scaffolding)
  const axisInfo = getDualAxisInfo(yAxisFields, yAxisAssignment)
  const { hasRightAxis } = axisInfo

  // Null handling: Filter out data points where ALL measure values are null
  // This prevents rendering empty bars and makes the chart clearer
  const { chartData, skippedCount } = useMemo(() => {
    if (transformedData.length === 0 || seriesKeys.length === 0) {
      return { chartData: [], skippedCount: 0 }
    }
    const filtered = transformedData.filter(row => {
      // Keep the row if at least one series has a valid numeric value
      return seriesKeys.some(key => isValidNumericValue(row[key]))
    })
    const skipped = transformedData.length - filtered.length
    return { chartData: filtered, skippedCount: skipped }
  }, [transformedData, seriesKeys])

  // Now handle early returns AFTER all hooks
  try {
    if (!data || data.length === 0) {
      return <ChartEmptyState height={height} hint={t('chart.runtime.noDataHint.bar')} />
    }

    if (errorCode) {
      return <ChartConfigError height={height} hint={t(`chart.runtime.configErrorHint.${errorCode}`)} />
    }

    // Determine stack offset for percentage stacking
    // Disable stacking when dual Y-axis is used (bars on different axes can't be stacked)
    const effectiveShouldStack = shouldStack && !hasRightAxis
    const effectiveIsPercentStack = isPercentStack && !hasRightAxis
    const stackOffset = effectiveIsPercentStack ? 'expand' as const : undefined

    // Check if we should use positive/negative coloring
    // This is enabled when we have single series data with mixed positive/negative values
    const usePositiveNegativeColoring = seriesKeys.length === 1 && chartData.some(row => {
      const value = row[seriesKeys[0]]
      return typeof value === 'number' && value < 0
    })

    // Color each bar by its x-axis category when there's a single measure and no series dimension.
    // This gives each category a distinct color without needing to abuse the series field.
    const useColorByCategory = seriesKeys.length === 1
      && !usePositiveNegativeColoring
      && !seriesFields.length
      && chartData.length > 1

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
          hint="No valid data points for bar chart after transformation"
        />
      )
    }

    return (
      <div className="dc:relative dc:w-full" style={{ height }}>
        <ChartContainer height={skippedCount > 0 ? `calc(100% - 20px)` : "100%"}>
          <ComposedChart data={enhancedChartData} margin={chartMargins} stackOffset={stackOffset} accessibilityLayer={false}>
          {safeDisplayConfig.showGrid && (
            <CartesianGrid strokeDasharray="3 3" style={{ pointerEvents: 'none' }} />
          )}
          <XAxis
            dataKey="name"
            type="category"
            tick={<AngledXAxisTick />}
            height={60}
            interval={showAllXLabels ? 0 : undefined}
          />
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
            paddingTop: 25,
            onHover: setHoveredLegend,
            onLeave: () => setHoveredLegend(null)
          })}
          {seriesKeys.map((seriesKey, index) => {
            // Look up the original field name to get its axis assignment
            const originalField = seriesKeyToField[seriesKey]
            const axisId = originalField && yAxisAssignment[originalField] === 'right' ? 'right' : 'left'
            return (
              <Bar
                key={seriesKey}
                dataKey={seriesKey}
                yAxisId={axisId}
                stackId={effectiveShouldStack ? 'stack' : undefined}
                fill={
                  usePositiveNegativeColoring
                    ? POSITIVE_COLOR
                    : (colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) ||
                      CHART_COLORS[index % CHART_COLORS.length]
                }
                fillOpacity={hoveredLegend ? (hoveredLegend === seriesKey ? 1 : 0.3) : 1}
                cursor={drillEnabled ? 'pointer' : undefined}
                onClick={(barData: any, dataIndex: number, event: React.MouseEvent) => {
                  if (onDataPointClick && drillEnabled && barData) {
                    onDataPointClick({
                      dataPoint: enhancedChartData[dataIndex] || barData,
                      clickedField: originalField || seriesKey,
                      xValue: barData.name,
                      position: { x: event.clientX, y: event.clientY },
                      nativeEvent: event
                    })
                  }
                }}
              >
                {usePositiveNegativeColoring &&
                  chartData.map((entry, entryIndex) => {
                    const value = entry[seriesKey]
                    const fillColor = typeof value === 'number' && value < 0 ? NEGATIVE_COLOR : POSITIVE_COLOR
                    return (
                      <Cell
                        key={`cell-${entryIndex}`}
                        fill={fillColor}
                        fillOpacity={hoveredLegend ? (hoveredLegend === seriesKey ? 1 : 0.3) : 1}
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
                        fillOpacity={hoveredLegend ? (hoveredLegend === seriesKey ? 1 : 0.3) : 1}
                      />
                    )
                  })}
              </Bar>
            )
          })}
          {renderChartTargetLines(spreadTargets)}
          </ComposedChart>
        </ChartContainer>
        {skippedCount > 0 && (
          <div className="dc:text-xs text-dc-text-muted dc:text-center dc:mt-1">
            {skippedCount} data point{skippedCount !== 1 ? 's' : ''} with no values hidden
          </div>
        )}
      </div>
    )
  } catch (error) {
    return <ChartRenderError height={height} chartType="Bar Chart" error={error} />
  }
})

export default BarChart