import { useState } from 'react'
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import ChartContainer from './ChartContainer'
import ChartTooltip from './ChartTooltip'
import { CHART_COLORS, CHART_MARGINS } from '../../utils/chartConstants'
import { transformChartDataWithSeries } from '../../utils/chartUtils'
import { parseTargetValues, spreadTargetValues } from '../../utils/targetUtils'
import { useCubeContext } from '../../providers/CubeProvider'
import type { ChartProps } from '../../types'

export default function LineChart({ 
  data, 
  chartConfig, 
  displayConfig = {},
  queryObject,
  height = "100%",
  colorPalette
}: ChartProps) {
  const [hoveredLegend, setHoveredLegend] = useState<string | null>(null)
  const { labelMap, getFieldLabel } = useCubeContext()
  
  try {
    const safeDisplayConfig = {
      showLegend: displayConfig?.showLegend ?? true,
      showGrid: displayConfig?.showGrid ?? true,
      showTooltip: displayConfig?.showTooltip ?? true
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-dc-text-muted" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No data available</div>
            <div className="text-xs text-dc-text-secondary">No data points to display in line chart</div>
          </div>
        </div>
      )
    }

    // Validate chartConfig - support both legacy and new formats
    let xAxisField: string
    let yAxisFields: string[]
    let seriesFields: string[] = []
    
    if (chartConfig?.xAxis && chartConfig?.yAxis) {
      // New format
      xAxisField = chartConfig.xAxis[0]
      yAxisFields = Array.isArray(chartConfig.yAxis) ? chartConfig.yAxis : [chartConfig.yAxis]
      seriesFields = chartConfig.series || []
    } else if (chartConfig?.x && chartConfig?.y) {
      // Legacy format
      xAxisField = chartConfig.x
      yAxisFields = Array.isArray(chartConfig.y) ? chartConfig.y : [chartConfig.y]
    } else {
      return (
        <div className="flex items-center justify-center w-full text-yellow-600" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">Configuration Error</div>
            <div className="text-xs">Invalid or missing chart axis configuration</div>
          </div>
        </div>
      )
    }

    if (!xAxisField || !yAxisFields || yAxisFields.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-yellow-600" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">Configuration Error</div>
            <div className="text-xs">Missing required X-axis or Y-axis fields</div>
          </div>
        </div>
      )
    }

    // Use shared function to transform data and handle series
    const { data: chartData, seriesKeys } = transformChartDataWithSeries(
      data, 
      xAxisField, 
      yAxisFields, 
      queryObject,
      seriesFields,
      labelMap
    )
    
    // Determine if legend will be shown
    const showLegend = safeDisplayConfig.showLegend
    
    // Use custom chart margins with extra left space for Y-axis label
    const chartMargins = {
      ...CHART_MARGINS,
      left: 40 // Increased from 20 to 40 for Y-axis label space
    }
    
    // Process target values and add to chart data
    const targetValues = parseTargetValues(displayConfig?.target || '')
    const spreadTargets = spreadTargetValues(targetValues, chartData.length)
    
    // Add target data to chart data if targets exist
    let enhancedChartData = chartData
    if (spreadTargets.length > 0) {
      enhancedChartData = chartData.map((dataPoint, index) => ({
        ...dataPoint,
        __target: spreadTargets[index] || null
      }))
    }
    
    // Validate transformed data
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-dc-text-muted" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No valid data</div>
            <div className="text-xs text-dc-text-secondary">No valid data points for line chart after transformation</div>
          </div>
        </div>
      )
    }

    return (
      <ChartContainer height={height}>
        <RechartsLineChart data={enhancedChartData} margin={chartMargins}>
          {safeDisplayConfig.showGrid && (
            <CartesianGrid strokeDasharray="3 3" />
          )}
          <XAxis 
            dataKey="name"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            tick={{ fontSize: 12 }} 
            label={{ value: getFieldLabel(yAxisFields[0]), angle: -90, position: 'left', style: { textAnchor: 'middle', fontSize: '12px' } }}
          />
          {safeDisplayConfig.showTooltip && (
            <ChartTooltip 
              formatter={(value: any, name: any) => {
                if (name === 'Target') {
                  return [`${value}`, 'Target Value']
                }
                return [value, name]
              }}
            />
          )}
          {showLegend && (
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '25px' }}
              iconType="line"
              iconSize={8}
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              onMouseEnter={(o) => setHoveredLegend(String(o.dataKey || ''))}
              onMouseLeave={() => setHoveredLegend(null)}
            />
          )}
          {seriesKeys.map((seriesKey, index) => (
            <Line
              key={seriesKey}
              type="monotone"
              dataKey={seriesKey}
              stroke={(colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) || CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              strokeOpacity={hoveredLegend ? (hoveredLegend === seriesKey ? 1 : 0.3) : 1}
            />
          ))}
          {spreadTargets.length > 0 && (
            <>
              {/* White background line */}
              <Line
                type="monotone"
                dataKey="__target"
                stroke="#ffffff"
                strokeWidth={2}
                dot={false}
                activeDot={false}
                connectNulls={false}
              />
              {/* Grey dashed line on top */}
              <Line
                type="monotone"
                dataKey="__target"
                name="Target"
                stroke="#8B5CF6"
                strokeWidth={2}
                strokeDasharray="2 3"
                dot={false}
                activeDot={false}
                connectNulls={false}
              />
            </>
          )}
        </RechartsLineChart>
      </ChartContainer>
    )
  } catch (error) {
    // 'LineChart rendering error
    return (
      <div className="flex flex-col items-center justify-center w-full text-red-500 p-4" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Line Chart Error</div>
          <div className="text-xs mb-2">{error instanceof Error ? error.message : 'Unknown rendering error'}</div>
          <div className="text-xs text-dc-text-muted">Check the data and configuration</div>
        </div>
      </div>
    )
  }
}