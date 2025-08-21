import { useState } from 'react'
import { Treemap, Legend } from 'recharts'
import ChartContainer from './ChartContainer'
import ChartTooltip from './ChartTooltip'
import { CHART_COLORS } from '../../utils/chartConstants'
import { formatTimeValue, getFieldGranularity } from '../../utils/chartUtils'
import type { ChartProps } from '../../types'

export default function TreeMapChart({ 
  data, 
  chartConfig,
  displayConfig = {},
  queryObject,
  height = "100%" 
}: ChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  try {
    const safeDisplayConfig = {
      showTooltip: displayConfig?.showTooltip ?? true,
      showLegend: displayConfig?.showLegend ?? true
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-gray-500" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No data available</div>
            <div className="text-xs">No data points to display in treemap chart</div>
          </div>
        </div>
      )
    }

    let treemapData: Array<{name: string, size: number, fill?: string, series?: string}>

    if (chartConfig?.xAxis && chartConfig?.yAxis) {
      // New format - use chart config
      const xAxisField = chartConfig.xAxis[0] // Name/category field
      const yAxisField = chartConfig.yAxis[0] // Size field
      const seriesField = chartConfig.series?.[0] // Color grouping field

      const granularity = getFieldGranularity(queryObject, xAxisField)
      
      if (seriesField) {
        // Use series field for color grouping
        const uniqueSeriesValues = [...new Set(data.map(item => String(item[seriesField])))]
        const seriesColorMap = Object.fromEntries(
          uniqueSeriesValues.map((value, index) => [
            value, 
            displayConfig.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]
          ])
        )
        
        treemapData = data.map((item) => ({
          name: formatTimeValue(item[xAxisField], granularity) || String(item[xAxisField]) || 'Unknown',
          size: typeof item[yAxisField] === 'string' 
            ? parseFloat(item[yAxisField]) 
            : (item[yAxisField] || 0),
          fill: seriesColorMap[String(item[seriesField])] || CHART_COLORS[0],
          series: String(item[seriesField])
        }))
      } else {
        // No series grouping - use index-based colors
        treemapData = data.map((item, index) => ({
          name: formatTimeValue(item[xAxisField], granularity) || String(item[xAxisField]) || 'Unknown',
          size: typeof item[yAxisField] === 'string' 
            ? parseFloat(item[yAxisField]) 
            : (item[yAxisField] || 0),
          fill: displayConfig.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]
        }))
      }
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

      // Find a numeric field for size - look for 'size' field first, then any numeric
      const sizeField = keys.find(key => key.toLowerCase().includes('size')) ||
        keys.find(key => 
          typeof firstRow[key] === 'number' && key !== nameField
        ) || keys[1]

      if (!sizeField) {
        return (
          <div className="flex items-center justify-center w-full text-yellow-600" style={{ height }}>
            <div className="text-center">
              <div className="text-sm font-semibold mb-1">Configuration Error</div>
              <div className="text-xs">No numeric field found for treemap chart size</div>
            </div>
          </div>
        )
      }

      // Transform data for treemap chart
      treemapData = data.map((item, index) => {
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
          size: typeof item[sizeField] === 'string' 
            ? parseFloat(item[sizeField]) 
            : (item[sizeField] || 0),
          fill: displayConfig.colors?.[index] || CHART_COLORS[index % CHART_COLORS.length]
        }
      })
    }

    // Filter out zero/null values and ensure positive sizes
    treemapData = treemapData.filter(item => item.size != null && item.size > 0)
    
    if (treemapData.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-gray-500" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No valid data</div>
            <div className="text-xs">No valid data points for treemap chart after transformation</div>
          </div>
        </div>
      )
    }

    // Custom content renderer for treemap cells
    const CustomizedContent = (props: any) => {
      const { x, y, width, height, index, name, size } = props
      
      if (width < 20 || height < 20) return null // Don't render content for very small cells
      
      return (
        <g>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            style={{
              fill: treemapData[index]?.fill || CHART_COLORS[index % CHART_COLORS.length],
              fillOpacity: hoveredIndex !== null ? (hoveredIndex === index ? 1 : 0.6) : 0.8,
              stroke: '#fff',
              strokeWidth: 2,
              cursor: 'pointer'
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
          {width > 40 && height > 30 && (
            <text
              x={x + width / 2}
              y={y + height / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={Math.min(12, width / 8, height / 4)}
              fill="#fff"
              fontWeight="bold"
            >
              {name}
            </text>
          )}
          {width > 60 && height > 45 && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 15}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={Math.min(10, width / 10, height / 6)}
              fill="#fff"
              opacity={0.9}
            >
              {size}
            </text>
          )}
        </g>
      )
    }

    // Check if we have series data for legend
    const hasSeriesData = treemapData.some(item => 'series' in item)
    const uniqueSeries = hasSeriesData 
      ? [...new Set(treemapData.map(item => item.series).filter(Boolean))]
      : []

    return (
      <ChartContainer height={height}>
        <Treemap
          data={treemapData}
          dataKey="size"
          aspectRatio={4/3}
          stroke="#fff"
          content={<CustomizedContent />}
        >
          {safeDisplayConfig.showTooltip && (
            <ChartTooltip />
          )}
          {(safeDisplayConfig.showLegend && uniqueSeries.length > 1) && (
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="rect"
              iconSize={8}
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
              payload={uniqueSeries.map((series, index) => ({
                value: series,
                type: 'rect',
                color: CHART_COLORS[index % CHART_COLORS.length]
              }))}
            />
          )}
        </Treemap>
      </ChartContainer>
    )
  } catch (error) {
    console.error('TreeMapChart rendering error:', error)
    return (
      <div className="flex flex-col items-center justify-center w-full text-red-500 p-4" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">TreeMap Chart Error</div>
          <div className="text-xs mb-2">{error instanceof Error ? error.message : 'Unknown rendering error'}</div>
          <div className="text-xs text-gray-600">Check the data and configuration</div>
        </div>
      </div>
    )
  }
}