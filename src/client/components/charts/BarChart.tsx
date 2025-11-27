import { useState, useMemo } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Cell, Legend } from 'recharts'
import ChartContainer from './ChartContainer'
import ChartTooltip from './ChartTooltip'
import { CHART_COLORS, POSITIVE_COLOR, NEGATIVE_COLOR, CHART_MARGINS } from '../../utils/chartConstants'
import { transformChartDataWithSeries, isValidNumericValue, formatNumericValue } from '../../utils/chartUtils'
import { parseTargetValues, spreadTargetValues } from '../../utils/targetUtils'
import { useCubeContext } from '../../providers/CubeProvider'
import type { ChartProps } from '../../types'

export default function BarChart({ 
  data, 
  chartConfig, 
  displayConfig = {},
  queryObject,
  height = "100%",
  colorPalette
}: ChartProps) {
  const [hoveredLegend, setHoveredLegend] = useState<string | null>(null)
  const { labelMap, getFieldLabel: contextGetFieldLabel } = useCubeContext()
  
  try {
    const safeDisplayConfig = {
      showLegend: displayConfig?.showLegend ?? true,
      showGrid: displayConfig?.showGrid ?? true,
      showTooltip: displayConfig?.showTooltip ?? true,
      stacked: displayConfig?.stacked ?? false
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-dc-text-muted" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No data available</div>
            <div className="text-xs text-dc-text-secondary">No data points to display in bar chart</div>
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
      xAxisField = Array.isArray(chartConfig.xAxis) ? chartConfig.xAxis[0] : chartConfig.xAxis
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
    const { data: transformedData, seriesKeys } = transformChartDataWithSeries(
      data,
      xAxisField,
      yAxisFields,
      queryObject,
      seriesFields,
      labelMap
    )

    // Null handling: Filter out data points where ALL measure values are null
    // This prevents rendering empty bars and makes the chart clearer
    const { chartData, skippedCount } = useMemo(() => {
      const filtered = transformedData.filter(row => {
        // Keep the row if at least one series has a valid numeric value
        return seriesKeys.some(key => isValidNumericValue(row[key]))
      })
      const skipped = transformedData.length - filtered.length
      return { chartData: filtered, skippedCount: skipped }
    }, [transformedData, seriesKeys])

    // Stacking is now controlled only by the explicit config
    const shouldStack = safeDisplayConfig.stacked === true
    
    // Check if we should use positive/negative coloring
    // This is enabled when we have single series data with mixed positive/negative values
    const usePositiveNegativeColoring = seriesKeys.length === 1 && chartData.some(row => {
      const value = row[seriesKeys[0]]
      return typeof value === 'number' && value < 0
    })
    
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
            <div className="text-xs text-dc-text-secondary">No valid data points for bar chart after transformation</div>
          </div>
        </div>
      )
    }

    return (
      <div className="relative w-full" style={{ height }}>
        <ChartContainer height={skippedCount > 0 ? `calc(100% - 20px)` : "100%"}>
          <ComposedChart data={enhancedChartData} margin={chartMargins}>
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
            label={{ value: contextGetFieldLabel(yAxisFields[0]), angle: -90, position: 'left', style: { textAnchor: 'middle', fontSize: '12px' } }}
          />
          {safeDisplayConfig.showTooltip && (
            <ChartTooltip
              formatter={(value: any, name: any) => {
                // Handle null values in tooltip
                if (value === null || value === undefined) {
                  return ['No data', name]
                }
                if (name === 'Target') {
                  return [formatNumericValue(value), 'Target Value']
                }
                return [formatNumericValue(value), name]
              }}
            />
          )}
          {showLegend && (
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '25px' }}
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
              fill={usePositiveNegativeColoring ? POSITIVE_COLOR : ((colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) || CHART_COLORS[index % CHART_COLORS.length])}
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
          </ComposedChart>
        </ChartContainer>
        {skippedCount > 0 && (
          <div className="text-xs text-dc-text-muted text-center mt-1">
            {skippedCount} data point{skippedCount !== 1 ? 's' : ''} with no values hidden
          </div>
        )}
      </div>
    )
  } catch (error) {
    // 'BarChart rendering error
    return (
      <div className="flex flex-col items-center justify-center w-full text-red-500 p-4" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Bar Chart Error</div>
          <div className="text-xs mb-2">{error instanceof Error ? error.message : 'Unknown rendering error'}</div>
          <div className="text-xs text-dc-text-muted">Check the data and configuration</div>
        </div>
      </div>
    )
  }
}