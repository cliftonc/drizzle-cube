import React, { useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { RadialBarChart as RechartsRadialBarChart, RadialBar, Legend, Cell } from 'recharts'
import ChartContainer from './ChartContainer'
import ChartTooltip from './ChartTooltip'
import { ChartEmptyState, ChartConfigError, ChartRenderError } from './ChartStates'
import { buildRadialData } from './radialBarChartHelpers'
import { formatAxisValue } from '../../utils/chartUtils'
import type { ChartProps } from '../../types'

const RadialBarChart = React.memo(function RadialBarChart({
  data,
  chartConfig,
  displayConfig = {},
  queryObject,
  height = "100%",
  colorPalette
}: ChartProps) {
  const { t } = useTranslation()
  const [hoveredLegend, setHoveredLegend] = useState<string | null>(null)

  try {
    const safeDisplayConfig = {
      showLegend: displayConfig?.showLegend ?? true,
      showTooltip: displayConfig?.showTooltip ?? true,
      leftYAxisFormat: displayConfig?.leftYAxisFormat
    }

    if (!data || data.length === 0) {
      return <ChartEmptyState height={height} hint={t('chart.runtime.noDataHint.radialBar')} />
    }

    const { radialData, noValueField } = buildRadialData(data, chartConfig, queryObject, colorPalette)

    if (noValueField) {
      return <ChartConfigError height={height} hint={t('chart.runtime.configErrorHint.radialBarNumeric')} />
    }

    if (radialData.length === 0) {
      return (
        <ChartEmptyState
          height={height}
          titleKey="chart.runtime.noValidData"
          hint="No valid data points for radial bar chart after transformation"
        />
      )
    }

    const { leftYAxisFormat } = safeDisplayConfig
    return (
      <ChartContainer height={height}>
        <RechartsRadialBarChart
          data={radialData}
          innerRadius="10%"
          outerRadius="80%"
          margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
          accessibilityLayer={false}
        >
          {safeDisplayConfig.showTooltip && (
            <ChartTooltip
              formatter={leftYAxisFormat
                ? (value: any, name: string) => [formatAxisValue(value, leftYAxisFormat), name]
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
          <RadialBar
            dataKey="value"
            cornerRadius={4}
            label={{
              position: 'insideStart',
              fill: '#fff',
              fontSize: 12,
              formatter: leftYAxisFormat
                ? (value: any) => formatAxisValue(value, leftYAxisFormat)
                : undefined
            }}
          >
            {radialData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
                fillOpacity={hoveredLegend ? (hoveredLegend === entry.name ? 1 : 0.3) : 1}
              />
            ))}
          </RadialBar>
        </RechartsRadialBarChart>
      </ChartContainer>
    )
  } catch (error) {
    return <ChartRenderError height={height} chartType="Radial Bar Chart" error={error} />
  }
})

export default RadialBarChart
