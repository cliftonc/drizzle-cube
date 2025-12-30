import React, { useState } from 'react'
import { RadialBarChart as RechartsRadialBarChart, RadialBar, Legend, Cell } from 'recharts'
import ChartContainer from './ChartContainer'
import ChartTooltip from './ChartTooltip'
import { CHART_COLORS } from '../../utils/chartConstants'
import { formatTimeValue, getFieldGranularity, formatAxisValue } from '../../utils/chartUtils'
import type { ChartProps } from '../../types'

const RadialBarChart = React.memo(function RadialBarChart({ 
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
      leftYAxisFormat: displayConfig?.leftYAxisFormat
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-dc-text-muted" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No data available</div>
            <div className="text-xs text-dc-text-secondary">No data points to display in radial bar chart</div>
          </div>
        </div>
      )
    }

    let radialData: Array<{name: string, value: number, fill?: string}>

    if (chartConfig?.xAxis && chartConfig?.yAxis) {
      // New format - use chart config
      const xAxisField = Array.isArray(chartConfig.xAxis) ? chartConfig.xAxis[0] : chartConfig.xAxis // Name/category field
      const yAxisField = Array.isArray(chartConfig.yAxis) ? chartConfig.yAxis[0] : chartConfig.yAxis // Value field

      const granularity = getFieldGranularity(queryObject, xAxisField)
      radialData = data.map((item, index) => ({
        name: formatTimeValue(item[xAxisField], granularity) || String(item[xAxisField]) || 'Unknown',
        value: typeof item[yAxisField] === 'string' 
          ? parseFloat(item[yAxisField]) 
          : (item[yAxisField] || 0),
        fill: (colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) || CHART_COLORS[index % CHART_COLORS.length]
      }))
    } else {
      // Legacy format or auto-detection
      const firstRow = data[0]
      const keys = Object.keys(firstRow)
      
      // Try to find name/label field
      const nameField = keys.find(key => 
        typeof firstRow[key] === 'string' ||
        key.toLowerCase().includes('name') ||
        key.toLowerCase().includes('label') ||
        key.toLowerCase().includes('category')
      ) || keys[0]

      // Find a numeric field for values
      const valueField = keys.find(key => 
        typeof firstRow[key] === 'number' && key !== nameField
      ) || keys[1]

      if (!valueField) {
        return (
          <div className="flex items-center justify-center w-full text-dc-warning" style={{ height }}>
            <div className="text-center">
              <div className="text-sm font-semibold mb-1">Configuration Error</div>
              <div className="text-xs">No numeric field found for radial bar chart values</div>
            </div>
          </div>
        )
      }

      // Transform data for radial bar chart
      radialData = data.map((item, index) => {
        let name = item[nameField]
        // Handle boolean values with better labels
        if (typeof name === 'boolean') {
          name = name ? 'Active' : 'Inactive'
        } else if (name === 'true' || name === 'false') {
          name = name === 'true' ? 'Active' : 'Inactive'
        } else {
          name = String(name)
        }
        return {
          name,
          value: typeof item[valueField] === 'string' 
            ? parseFloat(item[valueField]) 
            : (item[valueField] || 0),
          fill: (colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) || CHART_COLORS[index % CHART_COLORS.length]
        }
      })
    }

    // Filter out zero/null values
    radialData = radialData.filter(item => item.value != null && item.value !== 0)
    
    if (radialData.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-dc-text-muted" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No valid data</div>
            <div className="text-xs text-dc-text-secondary">No valid data points for radial bar chart after transformation</div>
          </div>
        </div>
      )
    }

    return (
      <ChartContainer height={height}>
        <RechartsRadialBarChart 
          data={radialData}
          innerRadius="10%"
          outerRadius="80%"
          margin={{ top: 20, right: 30, bottom: 20, left: 30 }}
        >
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
          <RadialBar
            dataKey="value"
            cornerRadius={4}
            label={{
              position: 'insideStart',
              fill: '#fff',
              fontSize: 12,
              formatter: safeDisplayConfig.leftYAxisFormat
                ? (value: any) => formatAxisValue(value, safeDisplayConfig.leftYAxisFormat)
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
    // 'RadialBarChart rendering error
    return (
      <div className="flex flex-col items-center justify-center w-full text-dc-error p-4" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Radial Bar Chart Error</div>
          <div className="text-xs mb-2">{error instanceof Error ? error.message : 'Unknown rendering error'}</div>
          <div className="text-xs text-dc-text-muted">Check the data and configuration</div>
        </div>
      </div>
    )
  }
})

export default RadialBarChart