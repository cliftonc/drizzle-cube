import React, { useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import { RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts'
import ChartContainer from './ChartContainer.js'
import ChartTooltip from './ChartTooltip.js'
import { ChartEmptyState, ChartConfigError, ChartRenderError } from './ChartStates.js'
import { buildRadarData } from './radarChartHelpers.js'
import { CHART_COLORS } from '../../utils/chartConstants.js'
import { formatAxisValue } from '../../utils/chartUtils.js'
import type { ChartProps } from '../../types.js'

const RadarChart = React.memo(function RadarChart({
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
      showGrid: displayConfig?.showGrid ?? true,
      leftYAxisFormat: displayConfig?.leftYAxisFormat
    }

    if (!data || data.length === 0) {
      return <ChartEmptyState height={height} hint={t('chart.runtime.noDataHint.radar')} />
    }

    const { radarData, seriesKeys, noNumericFields } = buildRadarData(data, chartConfig, queryObject)

    if (noNumericFields) {
      return <ChartConfigError height={height} hint={t('chart.runtime.configErrorHint.radarNumeric')} />
    }

    // Validate transformed data
    if (!radarData || radarData.length === 0) {
      return (
        <ChartEmptyState
          height={height}
          titleKey="chart.runtime.noValidData"
          hint="No valid data points for radar chart after transformation"
        />
      )
    }

    const { leftYAxisFormat } = safeDisplayConfig
    return (
      <ChartContainer height={height}>
        <RechartsRadarChart data={radarData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }} accessibilityLayer={false}>
          {safeDisplayConfig.showGrid && (
            <PolarGrid />
          )}
          <PolarAngleAxis
            dataKey="name"
            tick={{ fontSize: 12 }}
            className="text-dc-text-muted"
          />
          <PolarRadiusAxis
            tick={{ fontSize: 10 }}
            className="text-dc-text-muted"
            tickFormatter={leftYAxisFormat
              ? (value: any) => formatAxisValue(value, leftYAxisFormat)
              : undefined
            }
          />
          {safeDisplayConfig.showTooltip && (
            <ChartTooltip
              formatter={leftYAxisFormat
                ? (value: any, name: string) => [formatAxisValue(value, leftYAxisFormat), name]
                : undefined
              }
            />
          )}
          {(safeDisplayConfig.showLegend && seriesKeys.length > 1) && (
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="rect"
              iconSize={8}
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              onMouseEnter={(o) => setHoveredLegend(String(o.dataKey || ''))}
              onMouseLeave={() => setHoveredLegend(null)}
            />
          )}
          {seriesKeys.map((seriesKey, index) => {
            const color = (colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) || CHART_COLORS[index % CHART_COLORS.length]
            return (
              <Radar
                key={seriesKey}
                name={seriesKey}
                dataKey={seriesKey}
                stroke={color}
                fill={color}
                fillOpacity={hoveredLegend ? (hoveredLegend === seriesKey ? 0.6 : 0.1) : 0.3}
                strokeOpacity={hoveredLegend ? (hoveredLegend === seriesKey ? 1 : 0.3) : 1}
                strokeWidth={2}
              />
            )
          })}
        </RechartsRadarChart>
      </ChartContainer>
    )
  } catch (error) {
    return <ChartRenderError height={height} chartType="Radar Chart" error={error} />
  }
})

export default RadarChart
