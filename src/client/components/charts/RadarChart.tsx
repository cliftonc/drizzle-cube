import { useState } from 'react'
import { RadarChart as RechartsRadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts'
import ChartContainer from './ChartContainer'
import ChartTooltip from './ChartTooltip'
import { CHART_COLORS } from '../../utils/chartConstants'
import { transformChartDataWithSeries, formatTimeValue, getFieldGranularity, formatAxisValue } from '../../utils/chartUtils'
import type { ChartProps } from '../../types'

export default function RadarChart({ 
  data, 
  chartConfig,
  displayConfig = {},
  queryObject,
  height = "100%",
  colorPalette
}: ChartProps) {
  const [hoveredLegend, setHoveredLegend] = useState<string | null>(null)
  
  try {
    const safeDisplayConfig = {
      showLegend: displayConfig?.showLegend ?? true,
      showTooltip: displayConfig?.showTooltip ?? true,
      showGrid: displayConfig?.showGrid ?? true,
      leftYAxisFormat: displayConfig?.leftYAxisFormat
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-dc-text-muted" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No data available</div>
            <div className="text-xs text-dc-text-secondary">No data points to display in radar chart</div>
          </div>
        </div>
      )
    }

    let radarData: any[]
    let seriesKeys: string[] = []

    if (chartConfig?.xAxis && chartConfig?.yAxis) {
      // New format - use chart config
      const xAxisField = Array.isArray(chartConfig.xAxis) ? chartConfig.xAxis[0] : chartConfig.xAxis // Subject/category field
      const yAxisFields = Array.isArray(chartConfig.yAxis) ? chartConfig.yAxis : [chartConfig.yAxis]   // Value fields
      const seriesFields = chartConfig.series || []

      // Use shared function to transform data and handle series
      const { data: chartData, seriesKeys: transformedSeriesKeys } = transformChartDataWithSeries(
        data, 
        xAxisField, 
        yAxisFields, 
        queryObject,
        seriesFields
      )
      
      radarData = chartData
      seriesKeys = transformedSeriesKeys
    } else {
      // Legacy format or auto-detection - try to find suitable fields
      const firstRow = data[0]
      const keys = Object.keys(firstRow)
      
      // Try to find subject/category field
      const subjectField = keys.find(key => 
        typeof firstRow[key] === 'string' ||
        key.toLowerCase().includes('subject') ||
        key.toLowerCase().includes('name') ||
        key.toLowerCase().includes('category')
      ) || keys[0]

      // Find numeric fields for values
      const valueFields = keys.filter(key => 
        typeof firstRow[key] === 'number' && key !== subjectField
      )

      if (valueFields.length === 0) {
        return (
          <div className="flex items-center justify-center w-full text-dc-warning" style={{ height }}>
            <div className="text-center">
              <div className="text-sm font-semibold mb-1">Configuration Error</div>
              <div className="text-xs">No numeric fields found for radar chart values</div>
            </div>
          </div>
        )
      }

      // Transform data for radar chart
      if (subjectField) {
        // Use subject field for radar categories
        const granularity = getFieldGranularity(queryObject, subjectField)
        radarData = data.map(item => {
          const transformedItem: any = {
            name: formatTimeValue(item[subjectField], granularity) || String(item[subjectField]) || 'Unknown'
          }
          
          valueFields.forEach(field => {
            const displayName = field.split('.').pop() || field
            transformedItem[displayName] = typeof item[field] === 'string' 
              ? parseFloat(item[field]) 
              : (item[field] || 0)
          })
          
          return transformedItem
        })
        
        seriesKeys = valueFields.map(field => field.split('.').pop() || field)
      } else {
        // Fallback - use first value field only
        radarData = data.map(item => ({
          name: String(item[keys[0]] || 'Unknown'),
          value: typeof item[valueFields[0]] === 'string' 
            ? parseFloat(item[valueFields[0]]) 
            : (item[valueFields[0]] || 0)
        }))
        seriesKeys = ['value']
      }
    }
    
    // Validate transformed data
    if (!radarData || radarData.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-dc-text-muted" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No valid data</div>
            <div className="text-xs text-dc-text-secondary">No valid data points for radar chart after transformation</div>
          </div>
        </div>
      )
    }

    return (
      <ChartContainer height={height}>
        <RechartsRadarChart data={radarData} margin={{ top: 20, right: 80, bottom: 20, left: 80 }}>
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
            tickFormatter={safeDisplayConfig.leftYAxisFormat
              ? (value: any) => formatAxisValue(value, safeDisplayConfig.leftYAxisFormat)
              : undefined
            }
          />
          {safeDisplayConfig.showTooltip && (
            <ChartTooltip
              formatter={safeDisplayConfig.leftYAxisFormat
                ? (value: any, name: string) => [formatAxisValue(value, safeDisplayConfig.leftYAxisFormat), name]
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
          {seriesKeys.map((seriesKey, index) => (
            <Radar
              key={seriesKey}
              name={seriesKey}
              dataKey={seriesKey}
              stroke={(colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) || CHART_COLORS[index % CHART_COLORS.length]}
              fill={(colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) || CHART_COLORS[index % CHART_COLORS.length]}
              fillOpacity={hoveredLegend ? (hoveredLegend === seriesKey ? 0.6 : 0.1) : 0.3}
              strokeOpacity={hoveredLegend ? (hoveredLegend === seriesKey ? 1 : 0.3) : 1}
              strokeWidth={2}
            />
          ))}
        </RechartsRadarChart>
      </ChartContainer>
    )
  } catch (error) {
    // 'RadarChart rendering error
    return (
      <div className="flex flex-col items-center justify-center w-full text-dc-error p-4" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Radar Chart Error</div>
          <div className="text-xs mb-2">{error instanceof Error ? error.message : 'Unknown rendering error'}</div>
          <div className="text-xs text-dc-text-muted">Check the data and configuration</div>
        </div>
      </div>
    )
  }
}