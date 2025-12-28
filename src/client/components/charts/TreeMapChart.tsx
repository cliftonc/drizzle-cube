import { useState } from 'react'
import { Treemap } from 'recharts'
import { scaleQuantize, scaleOrdinal } from 'd3'
import ChartContainer from './ChartContainer'
import ChartTooltip from './ChartTooltip'
import { CHART_COLORS, CHART_COLORS_GRADIENT } from '../../utils/chartConstants'
import { formatTimeValue, getFieldGranularity, formatAxisValue } from '../../utils/chartUtils'
import { useCubeContext } from '../../providers/CubeProvider'
import type { ChartProps } from '../../types'

export default function TreeMapChart({ 
  data, 
  chartConfig,
  displayConfig = {},
  queryObject,
  height = "100%",
  colorPalette
}: ChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const { getFieldLabel } = useCubeContext()
  
  try {
    const safeDisplayConfig = {
      showTooltip: displayConfig?.showTooltip ?? true,
      showLegend: displayConfig?.showLegend ?? true,
      leftYAxisFormat: displayConfig?.leftYAxisFormat
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-dc-text-muted" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No data available</div>
            <div className="text-xs text-dc-text-secondary">No data points to display in treemap chart</div>
          </div>
        </div>
      )
    }

    let treemapData: Array<{name: string, size: number, fill?: string, series?: string}>
    let isNumericSeries = false
    let seriesField: string | undefined

    if (chartConfig?.xAxis && chartConfig?.yAxis) {
      // New format - use chart config
      const xAxisField = Array.isArray(chartConfig.xAxis) ? chartConfig.xAxis[0] : chartConfig.xAxis // Name/category field
      const yAxisField = Array.isArray(chartConfig.yAxis) ? chartConfig.yAxis[0] : chartConfig.yAxis // Size field
      seriesField = Array.isArray(chartConfig.series) ? chartConfig.series[0] : chartConfig.series // Color grouping field

      const granularity = getFieldGranularity(queryObject, xAxisField)
      
      if (seriesField) {
        // Check if series field is numeric for color scaling
        const seriesValues = data.map(item => {
          const value = item[seriesField!]
          return typeof value === 'string' ? parseFloat(value) : value
        }).filter(val => !isNaN(val))
        
        isNumericSeries = seriesValues.length === data.length && seriesValues.every(val => typeof val === 'number')
        
        
        if (isNumericSeries) {
          // Use D3 quantize scale for better color distribution with small ranges
          const minValue = Math.min(...seriesValues)
          const maxValue = Math.max(...seriesValues)
          
          // Create D3 quantize color scale - maps continuous data to discrete color bands
          const colorScale = scaleQuantize<string>()
            .domain([minValue, maxValue])
            .range(CHART_COLORS_GRADIENT)
          
          treemapData = data.map((item) => {
            const seriesValue = typeof item[seriesField!] === 'string' 
              ? parseFloat(item[seriesField!]) 
              : item[seriesField!]
            
            const color = colorScale(seriesValue)
            
            return {
              name: formatTimeValue(item[xAxisField], granularity) || String(item[xAxisField]) || 'Unknown',
              size: typeof item[yAxisField] === 'string' 
                ? parseFloat(item[yAxisField]) 
                : (item[yAxisField] || 0),
              fill: color,
              series: String(item[seriesField!])
            }
          })
        } else {
          // Use D3 ordinal color scale for categorical series
          const uniqueSeriesValues = [...new Set(data.map(item => String(item[seriesField!])))]
          const colorScale = scaleOrdinal<string>()
            .domain(uniqueSeriesValues)
            .range(colorPalette?.colors || CHART_COLORS)
          
          treemapData = data.map((item) => ({
            name: formatTimeValue(item[xAxisField], granularity) || String(item[xAxisField]) || 'Unknown',
            size: typeof item[yAxisField] === 'string' 
              ? parseFloat(item[yAxisField]) 
              : (item[yAxisField] || 0),
            fill: colorScale(String(item[seriesField!])),
            series: String(item[seriesField!])
          }))
        }
      } else {
        // No series grouping - use index-based colors
        treemapData = data.map((item, index) => ({
          name: formatTimeValue(item[xAxisField], granularity) || String(item[xAxisField]) || 'Unknown',
          size: typeof item[yAxisField] === 'string' 
            ? parseFloat(item[yAxisField]) 
            : (item[yAxisField] || 0),
          fill: (colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) || CHART_COLORS[index % CHART_COLORS.length]
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
          fill: (colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) || CHART_COLORS[index % CHART_COLORS.length]
        }
      })
    }

    // Filter out zero/null values and ensure positive sizes
    treemapData = treemapData.filter(item => item.size != null && item.size > 0)
    
    if (treemapData.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-dc-text-muted" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No valid data</div>
            <div className="text-xs text-dc-text-secondary">No valid data points for treemap chart after transformation</div>
          </div>
        </div>
      )
    }

    // Custom content renderer for treemap cells with HTML overlays
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
              fill: treemapData[index]?.fill || ((colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) || CHART_COLORS[index % CHART_COLORS.length]),
              fillOpacity: hoveredIndex !== null ? (hoveredIndex === index ? 1 : 0.6) : 0.8,
              stroke: '#fff',
              strokeWidth: 2,
              cursor: 'pointer'
            }}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          />
          <foreignObject 
            x={x} 
            y={y} 
            width={width} 
            height={height}
            style={{ pointerEvents: 'none', overflow: 'visible' }}
          >
            <div 
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                boxSizing: 'border-box',
                color: '#ffffff',
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                overflow: 'hidden'
              }}
            >
              {width > 40 && height > 30 && (
                <div 
                  style={{
                    fontSize: `${Math.max(10, Math.min(width / 8, height / 8, 16))}px`,
                    fontWeight: '600',
                    textAlign: 'center',
                    lineHeight: '1.2',
                    marginBottom: width > 60 && height > 45 ? '4px' : '0',
                    wordBreak: 'break-word',
                    hyphens: 'auto'
                  }}
                >
                  {name}
                </div>
              )}
              {width > 60 && height > 45 && (
                <div
                  style={{
                    fontSize: `${Math.max(8, Math.min(width / 10, height / 10, 14))}px`,
                    textAlign: 'center',
                    opacity: 0.9
                  }}
                >
                  {safeDisplayConfig.leftYAxisFormat
                    ? formatAxisValue(size, safeDisplayConfig.leftYAxisFormat)
                    : (typeof size === 'number' ? size.toLocaleString() : size)
                  }
                </div>
              )}
            </div>
          </foreignObject>
        </g>
      )
    }

    // Check if we have series data for legend
    const hasSeriesData = treemapData.some(item => 'series' in item)
    const uniqueSeries = hasSeriesData 
      ? [...new Set(treemapData.map(item => item.series).filter(Boolean))]
      : []
    
    // For numeric series, create a legend showing the color scale
    let legendPayload: any[] = []
    if (safeDisplayConfig.showLegend && seriesField) {
      
      if (isNumericSeries) {
        // Create color scale legend for numeric values
        const minValue = Math.min(...data.map(item => {
          const value = item[seriesField!]
          return typeof value === 'string' ? parseFloat(value) : value
        }))
        const maxValue = Math.max(...data.map(item => {
          const value = item[seriesField!]
          return typeof value === 'string' ? parseFloat(value) : value
        }))
        
        
        // Create legend entries showing color scale
        legendPayload = CHART_COLORS_GRADIENT.map((color, index) => {
          const ratio = index / (CHART_COLORS_GRADIENT.length - 1)
          const value = minValue + (maxValue - minValue) * ratio
          return {
            value: safeDisplayConfig.leftYAxisFormat
              ? formatAxisValue(value, safeDisplayConfig.leftYAxisFormat)
              : value.toFixed(2),
            type: 'rect',
            color: color
          }
        })
      } else if (uniqueSeries.length > 1) {
        // Use categorical legend for non-numeric series
        legendPayload = uniqueSeries.map((series, index) => ({
          value: series,
          type: 'rect',
          color: CHART_COLORS[index % CHART_COLORS.length]
        }))
      }
      
    }

    // Calculate height adjustment for legend
    const hasLegend = safeDisplayConfig.showLegend && legendPayload.length > 0
    const adjustedHeight = hasLegend 
      ? (typeof height === 'string' && height.includes('%') 
          ? height 
          : typeof height === 'number' 
            ? height + 60 
            : `calc(${height} + 60px)`)
      : height

    return (
      <div className="w-full" style={{ height: adjustedHeight }}>
        <ChartContainer height={hasLegend ? `calc(100% - 50px)` : "100%"}>
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4/3}
            stroke="#fff"
            content={<CustomizedContent />}
          >
            {safeDisplayConfig.showTooltip && (
              <ChartTooltip
                formatter={safeDisplayConfig.leftYAxisFormat
                  ? (value: any, name: string) => [formatAxisValue(value, safeDisplayConfig.leftYAxisFormat), name]
                  : undefined
                }
              />
            )}
          </Treemap>
        </ChartContainer>
        
        {/* Custom Legend outside ChartContainer */}
        {hasLegend && (
          <div className="flex justify-center items-center mt-4 pb-2">
            {isNumericSeries ? (
              // Gradient legend for numeric series
              <div className="flex flex-col items-center">
                <div className="text-xs font-semibold text-dc-text-primary mb-2">
                  {seriesField ? getFieldLabel(seriesField) : ''}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-dc-text-muted">
                    {safeDisplayConfig.leftYAxisFormat
                      ? formatAxisValue(Math.min(...data.map(item => {
                          const value = item[seriesField!]
                          return typeof value === 'string' ? parseFloat(value) : value
                        })), safeDisplayConfig.leftYAxisFormat)
                      : Math.min(...data.map(item => {
                          const value = item[seriesField!]
                          return typeof value === 'string' ? parseFloat(value) : value
                        })).toFixed(2)
                    }
                  </span>
                  <div
                    className="h-4 rounded-sm"
                    style={{
                      width: '200px',
                      background: `linear-gradient(to right, ${CHART_COLORS_GRADIENT.join(', ')})`
                    }}
                  />
                  <span className="text-xs text-dc-text-muted">
                    {safeDisplayConfig.leftYAxisFormat
                      ? formatAxisValue(Math.max(...data.map(item => {
                          const value = item[seriesField!]
                          return typeof value === 'string' ? parseFloat(value) : value
                        })), safeDisplayConfig.leftYAxisFormat)
                      : Math.max(...data.map(item => {
                          const value = item[seriesField!]
                          return typeof value === 'string' ? parseFloat(value) : value
                        })).toFixed(2)
                    }
                  </span>
                </div>
              </div>
            ) : (
              // Discrete legend for categorical series
              <div className="flex flex-wrap justify-center gap-4">
                {legendPayload.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-xs"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-dc-text-muted">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    )
  } catch (error) {
    // 'TreeMapChart rendering error
    return (
      <div className="flex flex-col items-center justify-center w-full text-red-500 p-4" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">TreeMap Chart Error</div>
          <div className="text-xs mb-2">{error instanceof Error ? error.message : 'Unknown rendering error'}</div>
          <div className="text-xs text-dc-text-muted">Check the data and configuration</div>
        </div>
      </div>
    )
  }
}