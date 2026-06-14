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
import { buildSeriesKeyToFieldMap, renderAreaSeries, resolveAreaStacking } from './cartesianChartHelpers'
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
    const seriesKeyToField = buildSeriesKeyToFieldMap(yAxisFields, getFieldLabel)

    // Dual Y-axis derivation + margins (shared scaffolding)
    const axisInfo = getDualAxisInfo(yAxisFields, yAxisAssignment)
    const { hasRightAxis } = axisInfo

    // Resolve effective stacking (disabled when dual Y-axis present)
    const { effectiveShouldStack, effectiveIsPercentStack, stackOffset } =
      resolveAreaStacking(displayConfig, hasRightAxis)

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
          {renderAreaSeries({
            seriesKeys,
            colorPalette,
            seriesKeyToField,
            yAxisAssignment,
            hoveredLegend,
            connectNulls: safeDisplayConfig.connectNulls,
            shouldStack: effectiveShouldStack,
            drillEnabled,
            onDataPointClick
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
