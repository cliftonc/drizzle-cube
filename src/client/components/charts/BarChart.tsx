import React, { useState, useMemo } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { ComposedChart, XAxis, CartesianGrid } from 'recharts'
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
import { resolveStackMode, filterEmptyRows, resolveBarColoringMode } from './BarChart.helpers'
import { BarSeries } from './BarSeries'
import { transformChartDataWithSeries } from '../../utils/chartUtils'
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
  const { shouldStack, isPercentStack } = resolveStackMode(displayConfig)

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
  const { chartData, skippedCount } = useMemo(
    () => filterEmptyRows(transformedData, seriesKeys),
    [transformedData, seriesKeys]
  )

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

    // Resolve special per-bar colouring modes (positive/negative + colour-by-category)
    const { usePositiveNegativeColoring, useColorByCategory } =
      resolveBarColoringMode(seriesKeys, chartData, seriesFields.length)

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
              <BarSeries
                key={seriesKey}
                seriesKey={seriesKey}
                index={index}
                originalField={originalField}
                axisId={axisId}
                stackId={effectiveShouldStack ? 'stack' : undefined}
                chartData={chartData}
                enhancedChartData={enhancedChartData}
                colorPalette={colorPalette}
                hoveredLegend={hoveredLegend}
                usePositiveNegativeColoring={usePositiveNegativeColoring}
                useColorByCategory={useColorByCategory}
                drillEnabled={drillEnabled}
                onDataPointClick={onDataPointClick}
              />
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