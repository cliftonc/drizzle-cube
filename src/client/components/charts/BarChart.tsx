import { useState } from 'react'
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Legend } from 'recharts'
import ChartContainer from './ChartContainer'
import ChartTooltip from './ChartTooltip'
import { CHART_COLORS, POSITIVE_COLOR, NEGATIVE_COLOR, RESPONSIVE_CHART_MARGINS } from '../../utils/chartConstants'
import { transformChartDataWithSeries } from '../../utils/chartUtils'
import type { ChartProps } from '../../types'

export default function BarChart({ 
  data, 
  chartConfig, 
  displayConfig = {},
  queryObject,
  height = "100%" 
}: ChartProps) {
  const [hoveredLegend, setHoveredLegend] = useState<string | null>(null)
  
  try {
    const safeDisplayConfig = {
      showLegend: displayConfig?.showLegend ?? true,
      showGrid: displayConfig?.showGrid ?? true,
      showTooltip: displayConfig?.showTooltip ?? true,
      stackedBarChart: displayConfig?.stackedBarChart ?? false
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-gray-500" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No data available</div>
            <div className="text-xs">No data points to display in bar chart</div>
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
      yAxisFields = chartConfig.yAxis
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
      seriesFields
    )

    
    // Stacking is now controlled only by the explicit config
    const shouldStack = safeDisplayConfig.stackedBarChart === true
    
    // Check if we should use positive/negative coloring
    // This is enabled when we have single series data with mixed positive/negative values
    const usePositiveNegativeColoring = seriesKeys.length === 1 && chartData.some(row => {
      const value = row[seriesKeys[0]]
      return typeof value === 'number' && value < 0
    })
    
    // Validate transformed data
    if (!chartData || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-gray-500" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No valid data</div>
            <div className="text-xs">No valid data points for bar chart after transformation</div>
          </div>
        </div>
      )
    }

    return (
      <ChartContainer height={height}>
        <RechartsBarChart data={chartData} margin={RESPONSIVE_CHART_MARGINS}>
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
          <YAxis tick={{ fontSize: 12 }} />
          {safeDisplayConfig.showTooltip && (
            <ChartTooltip />
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
          {seriesKeys.map((seriesKey, index) => (
            <Bar
              key={seriesKey}
              dataKey={seriesKey}
              stackId={shouldStack ? "stack" : undefined}
              fill={usePositiveNegativeColoring ? POSITIVE_COLOR : CHART_COLORS[index % CHART_COLORS.length]}
              fillOpacity={hoveredLegend ? (hoveredLegend === seriesKey ? 1 : 0.3) : 1}
            >
              {usePositiveNegativeColoring && chartData.map((entry, entryIndex) => {
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
            </Bar>
          ))}
        </RechartsBarChart>
      </ChartContainer>
    )
  } catch (error) {
    console.error('BarChart rendering error:', error)
    return (
      <div className="flex flex-col items-center justify-center w-full text-red-500 p-4" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Bar Chart Error</div>
          <div className="text-xs mb-2">{error instanceof Error ? error.message : 'Unknown rendering error'}</div>
          <div className="text-xs text-gray-600">Check the data and configuration</div>
        </div>
      </div>
    )
  }
}