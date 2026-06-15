import React, { useState, useMemo } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { LineChart as RechartsLineChart, XAxis, CartesianGrid } from 'recharts'
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
import {
  makeComparisonTickFormatter,
  makeComparisonLabelFormatter,
  buildSeriesKeyToFieldMap,
  makeSeriesKeyResolver,
  buildTimeSeriesData,
  renderLineSeries
} from './cartesianChartHelpers'
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
  const seriesKeyToField = useMemo(
    () => buildSeriesKeyToFieldMap(yAxisFields, getFieldLabel),
    [yAxisFields, getFieldLabel]
  )

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

    const priorPeriodStyle = displayConfig?.priorPeriodStyle || 'dashed'
    const priorPeriodOpacity = displayConfig?.priorPeriodOpacity ?? 0.5

    // Shape data (comparison overlay vs standard transform) via shared helper.
    const { chartData, seriesKeys, effectiveXAxisKey, hasComparisonData, periodLabels } =
      buildTimeSeriesData({ data, xAxisField, yAxisFields, seriesFields, queryObject, getFieldLabel })

    // Resolve series key → measure field, handling comparison suffixes
    // ("(Current)"/"(Prior)") and dimension prefixes ("DimValue - Label").
    const findFieldFromSeriesKey = makeSeriesKeyResolver(seriesKeyToField)

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
              makeComparisonTickFormatter(hasComparisonData, chartData, queryObject, xAxisField)
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
                makeComparisonLabelFormatter(hasComparisonData, queryObject, xAxisField)
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
          {renderLineSeries({
            seriesKeys,
            colorPalette,
            resolveField: findFieldFromSeriesKey,
            yAxisAssignment,
            hoveredLegend,
            connectNulls: safeDisplayConfig.connectNulls,
            drillEnabled,
            onDataPointClick,
            hasComparisonData,
            periodLabels,
            priorPeriodStyle,
            priorPeriodOpacity
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
