import React, { useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import { ScatterChart as RechartsScatterChart, XAxis, YAxis, CartesianGrid, Legend, Tooltip } from 'recharts'
import ChartContainer from './ChartContainer.js'
import { ChartEmptyState, ChartConfigError, ChartRenderError } from './ChartStates.js'
import { resolveScatterAxisFields, transformScatterData, resolveScatterRenderState } from './ScatterChart.helpers.js'
import { ScatterTooltip } from './ScatterTooltip.js'
import { ScatterSeries } from './ScatterSeries.js'
import { formatAxisValue } from '../../utils/chartUtils.js'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel.js'
import type { ChartProps } from '../../types.js'

const ScatterChart = React.memo(function ScatterChart({
  data,
  chartConfig,
  displayConfig = {},
  queryObject,
  height = "100%",
  colorPalette
}: ChartProps) {
  const { t } = useTranslation()
  const [hoveredLegend, setHoveredLegend] = useState<string | null>(null)
  // Use specialized hook to avoid re-renders from unrelated context changes
  const getFieldLabel = useCubeFieldLabel()
  
  try {
    if (!data || data.length === 0) {
      return <ChartEmptyState height={height} hint={t('chart.runtime.noDataHint.scatter')} />
    }

    // Validate chartConfig - support both legacy and new formats
    const { xAxisField, yAxisField, seriesFields, errorCode } = resolveScatterAxisFields(chartConfig)

    if (errorCode) {
      return <ChartConfigError height={height} hint={t(`chart.runtime.configErrorHint.${errorCode}`)} />
    }

    // Extract time dimensions from query for tooltip display
    const timeDimensions = queryObject?.timeDimensions || []
    const timeDimensionFields = timeDimensions.map((td: any) => td.dimension)

    // Transform data for scatter plot (filters out null x/y coordinates)
    const { scatterData, seriesGroups } = transformScatterData(
      data,
      xAxisField,
      yAxisField,
      seriesFields,
      timeDimensionFields,
      queryObject
    )

    // Validate transformed data
    if (!scatterData || scatterData.length === 0) {
      return (
        <ChartEmptyState
          height={height}
          titleKey="chart.runtime.noValidData"
          hint="No valid data points for scatter chart after transformation"
        />
      )
    }

    const seriesKeys = Object.keys(seriesGroups)
    const { showLegend, showGrid, showTooltip, hasSeries, xAxisFormat, yAxisFormat, chartMargins } =
      resolveScatterRenderState(displayConfig, seriesKeys)

    return (
      <ChartContainer height={height}>
        <RechartsScatterChart margin={chartMargins} accessibilityLayer={false}>
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" />
          )}
          <XAxis
            type="number"
            dataKey="x"
            name={xAxisFormat?.label || getFieldLabel(xAxisField)}
            tick={{ fontSize: 12 }}
            tickFormatter={xAxisFormat ? (value) => formatAxisValue(value, xAxisFormat) : undefined}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yAxisFormat?.label || getFieldLabel(yAxisField)}
            tick={{ fontSize: 12 }}
            tickFormatter={yAxisFormat ? (value) => formatAxisValue(value, yAxisFormat) : undefined}
            label={{ value: yAxisFormat?.label || getFieldLabel(yAxisField), angle: -90, position: 'left', style: { textAnchor: 'middle', fontSize: '12px' } }}
          />
          {showTooltip && (
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => (
                <ScatterTooltip
                  active={active}
                  payload={payload as any}
                  xAxisField={xAxisField}
                  yAxisField={yAxisField}
                  xAxisFormat={xAxisFormat}
                  yAxisFormat={yAxisFormat}
                  getFieldLabel={getFieldLabel}
                />
              )}
            />
          )}
          {showLegend && (
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="circle"
              iconSize={8}
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              onMouseEnter={(o) => setHoveredLegend(String(o.dataKey || ''))}
              onMouseLeave={() => setHoveredLegend(null)}
            />
          )}
          <ScatterSeries
            hasSeries={hasSeries}
            seriesKeys={seriesKeys}
            seriesGroups={seriesGroups}
            scatterData={scatterData}
            colorPalette={colorPalette}
            hoveredLegend={hoveredLegend}
          />
        </RechartsScatterChart>
      </ChartContainer>
    )
  } catch (error) {
    // 'ScatterChart rendering error
    return <ChartRenderError height={height} chartType="Scatter Chart" error={error} />
  }
})

export default ScatterChart