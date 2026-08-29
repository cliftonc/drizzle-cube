import React, { useState, useMemo, useId } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import { ComposedChart, XAxis, CartesianGrid } from 'recharts'
import ChartContainer from './ChartContainer.js'
import ChartTooltip from './ChartTooltip.js'
import AngledXAxisTick from './AngledXAxisTick.js'
import { ChartEmptyState, ChartConfigError, ChartRenderError } from './ChartStates.js'
import { resolveChartAxisFields } from './chartAxisResolution.js'
import {
  getDualAxisInfo,
  getYAxisChartMargins,
  getPlotLeftOffset,
  withTargetData,
  renderDualYAxes,
  renderChartTargetLines,
  makeCartesianTooltipFormatter,
  renderHoverLegend
} from './chartScaffolding.js'
import {
  buildSeriesKeyToFieldMap,
  computeSeriesSummaries,
  isTimeOrderedXAxis,
  renderAreaGradientDefs,
  renderAreaSeries,
  resolveAreaStacking
} from './cartesianChartHelpers.js'
import ChartSummaryHeader, { CHART_SUMMARY_HEADER_HEIGHT } from './ChartSummaryHeader.js'
import { transformChartDataWithSeries } from '../../utils/chartUtils.js'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel.js'
import type { ChartProps } from '../../types.js'

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
  // Gradient ids must be unique per chart instance or two area portlets on one
  // dashboard steal each other's fills. useId() emits colons, which are not
  // reliable inside SVG url(#...) references — strip them.
  const gradientIdPrefix = `dc-area-${useId().replace(/:/g, '')}`
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

    // Summary header: per-series current value + change since the start of the
    // window, derived from the data already fetched for the plot.
    const showSummary = displayConfig?.showSummary === true && seriesKeys.length > 0
    const summaries = showSummary
      ? computeSeriesSummaries(chartData, seriesKeys, colorPalette)
      : []

    // The summary carries the colour dots, so the bottom legend becomes redundant.
    const showLegend = safeDisplayConfig.showLegend && !showSummary

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
      <div className="dc:relative dc:w-full dc:flex dc:flex-col" style={{ height }}>
        {showSummary && (
          <ChartSummaryHeader
            summaries={summaries}
            getSeriesLabel={(seriesKey) => seriesKey}
            valueFormat={leftYAxisFormat}
            showChange={isTimeOrderedXAxis(queryObject, xAxisField)}
            leftOffset={getPlotLeftOffset(hasRightAxis)}
          />
        )}
        <ChartContainer height={showSummary ? `calc(100% - ${CHART_SUMMARY_HEADER_HEIGHT}px)` : height}>
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
          {!effectiveShouldStack && renderAreaGradientDefs(seriesKeys, colorPalette, gradientIdPrefix)}
          {renderAreaSeries({
            seriesKeys,
            colorPalette,
            seriesKeyToField,
            yAxisAssignment,
            hoveredLegend,
            connectNulls: safeDisplayConfig.connectNulls,
            shouldStack: effectiveShouldStack,
            drillEnabled,
            onDataPointClick,
            gradientIdPrefix
          })}
          {renderChartTargetLines(spreadTargets)}
        </ComposedChart>
        </ChartContainer>
      </div>
    )
  } catch (error) {
    return <ChartRenderError height={height} chartType="Area Chart" error={error} />
  }
})

export default AreaChart
