import React, { useState, useMemo } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts'
import ChartContainer from './ChartContainer'
import ChartTooltip from './ChartTooltip'
import { ChartEmptyState, ChartConfigError, ChartRenderError } from './ChartStates'
import { resolveChartAxisFields } from './chartAxisResolution'
import { CHART_COLORS } from '../../utils/chartConstants'
import { transformChartDataWithSeries, formatTimeValue, getFieldGranularity, formatAxisValue } from '../../utils/chartUtils'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel'
import type { ChartProps, CubeQuery } from '../../types'

interface PieSlice {
  name: string
  value: number
}

/**
 * Build pie slices from query data, supporting both series-based (dimension
 * slices) and standard measure-based pies. Returns the slices that survive
 * value filtering plus the pre-filter count (so the caller can explain how
 * many points were dropped). Pure — extracted to keep `PieChart` simple.
 */
function buildPieData(
  data: any[],
  xField: string,
  yAxisFields: string[],
  seriesFields: string[],
  queryObject: CubeQuery | undefined,
  getFieldLabel: (field: string) => string
): { pieData: PieSlice[]; originalLength: number } {
  let pieData: PieSlice[]

  if (seriesFields.length > 0) {
    // Use series-based transformation for dimension-based pie slices
    const { data: chartData } = transformChartDataWithSeries(
      data,
      xField,
      yAxisFields,
      queryObject,
      seriesFields,
      getFieldLabel
    )

    // Convert series data to pie format
    pieData = []
    if (chartData.length > 0) {
      const firstRow = chartData[0]
      Object.keys(firstRow).forEach(key => {
        if (key !== 'name' && typeof firstRow[key] === 'number') {
          pieData.push({ name: String(key), value: firstRow[key] })
        }
      })
    }
  } else {
    // Standard measure-based pie chart
    const granularity = getFieldGranularity(queryObject, xField)
    pieData = data.map(item => {
      let name = formatTimeValue(item[xField], granularity) || String(item[xField]) || 'Unknown'
      // Handle boolean values with better labels
      if (typeof item[xField] === 'boolean') {
        name = item[xField] ? 'Active' : 'Inactive'
      } else if (name === 'true' || name === 'false') {
        name = name === 'true' ? 'Active' : 'Inactive'
      }
      return {
        name,
        value: typeof item[yAxisFields[0]] === 'string'
          ? parseFloat(item[yAxisFields[0]])
          : (item[yAxisFields[0]] || 0)
      }
    })
  }

  // Filter out invalid values (null, undefined, NaN, or non-positive)
  const originalLength = pieData.length
  pieData = pieData.filter(item =>
    item.value != null &&
    !isNaN(item.value) &&
    item.value !== 0 &&
    item.value > 0
  )

  return { pieData, originalLength }
}

const PieChart = React.memo(function PieChart({
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

  try {
    const safeDisplayConfig = {
      showLegend: displayConfig?.showLegend ?? true,
      showTooltip: displayConfig?.showTooltip ?? true,
      leftYAxisFormat: displayConfig?.leftYAxisFormat,
      innerRadius: displayConfig?.innerRadius || '0%'
    }

    if (!data || data.length === 0) {
      return <ChartEmptyState height={height} hint={t('chart.runtime.noDataHint.pie')} />
    }

    if (errorCode) {
      // Pie surfaces a pie-specific message for the "invalid config" case
      const hintKey = errorCode === 'axisInvalid'
        ? 'chart.runtime.configErrorHint.pieAxis'
        : 'chart.runtime.configErrorHint.axisFields'
      return <ChartConfigError height={height} hint={t(hintKey)} />
    }

    // The errorCode guard above guarantees xAxisField is defined here
    const xField = xAxisField as string

    const { pieData, originalLength } = buildPieData(
      data,
      xField,
      yAxisFields,
      seriesFields,
      queryObject,
      getFieldLabel
    )

    if (pieData.length === 0) {
      return (
        <ChartEmptyState
          height={height}
          titleKey="chart.runtime.noValidData"
          hint={
            originalLength > 0
              ? `Filtered out ${originalLength} data points (zero or invalid values)`
              : 'No data points to display in pie chart'
          }
        />
      )
    }
  
    return (
      <ChartContainer height={height}>
        <RechartsPieChart accessibilityLayer={false}>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={safeDisplayConfig.innerRadius !== '0%' ? safeDisplayConfig.innerRadius : undefined}
            outerRadius="70%"
            dataKey="value"
            label={!safeDisplayConfig.showLegend ? ({ name, percent }) =>
              `${name} ${((percent || 0) * 100).toFixed(0)}%`
            : undefined}
            cursor={drillEnabled ? 'pointer' : undefined}
            onClick={(sliceData: any, _index: number, event: React.MouseEvent) => {
              if (onDataPointClick && drillEnabled && sliceData) {
                onDataPointClick({
                  dataPoint: sliceData,
                  clickedField: yAxisFields[0],
                  xValue: sliceData.name,
                  position: { x: event.clientX, y: event.clientY },
                  nativeEvent: event
                })
              }
            }}
          >
            {pieData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={(colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) || CHART_COLORS[index % CHART_COLORS.length]}
                fillOpacity={hoveredLegend ? (hoveredLegend === pieData[index].name ? 1 : 0.3) : 1}
              />
            ))}
          </Pie>
          {safeDisplayConfig.showTooltip && (
            <ChartTooltip
              formatter={safeDisplayConfig.leftYAxisFormat
                ? (value: any, name: string) => [formatAxisValue(value, safeDisplayConfig.leftYAxisFormat), name]
                : undefined
              }
            />
          )}
          {safeDisplayConfig.showLegend && (
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="circle"
              iconSize={8}
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              onMouseEnter={(o) => setHoveredLegend(String(o.value || ''))}
              onMouseLeave={() => setHoveredLegend(null)}
            />
          )}
        </RechartsPieChart>
      </ChartContainer>
    )
  } catch (error) {
    return <ChartRenderError height={height} chartType="Pie Chart" error={error} />
  }
})

export default PieChart