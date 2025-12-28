import { useState } from 'react'
import { ScatterChart as RechartsScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Legend, Tooltip } from 'recharts'
import ChartContainer from './ChartContainer'
import { CHART_COLORS, CHART_MARGINS } from '../../utils/chartConstants'
import { formatTimeValue, getFieldGranularity, parseNumericValue, isValidNumericValue, formatAxisValue } from '../../utils/chartUtils'
import { useCubeContext } from '../../providers/CubeProvider'
import type { ChartProps } from '../../types'

export default function ScatterChart({ 
  data, 
  chartConfig, 
  displayConfig = {},
  queryObject,
  height = "100%",
  colorPalette
}: ChartProps) {
  const [hoveredLegend, setHoveredLegend] = useState<string | null>(null)
  const { getFieldLabel } = useCubeContext()
  
  try {
    const safeDisplayConfig = {
      showLegend: displayConfig?.showLegend ?? true,
      showGrid: displayConfig?.showGrid ?? true,
      showTooltip: displayConfig?.showTooltip ?? true
    }

    // Extract axis format configs
    // For scatter charts, xAxis uses xAxisFormat, yAxis uses leftYAxisFormat
    const xAxisFormat = displayConfig?.xAxisFormat
    const yAxisFormat = displayConfig?.leftYAxisFormat

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-dc-text-muted" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No data available</div>
            <div className="text-xs text-dc-text-secondary">No data points to display in scatter chart</div>
          </div>
        </div>
      )
    }

    // Validate chartConfig - support both legacy and new formats
    let xAxisField: string
    let yAxisField: string
    let seriesFields: string[] = []
    
    if (chartConfig?.xAxis && chartConfig?.yAxis) {
      // New format - handle both string and array values
      xAxisField = Array.isArray(chartConfig.xAxis) ? chartConfig.xAxis[0] : chartConfig.xAxis
      yAxisField = Array.isArray(chartConfig.yAxis) ? chartConfig.yAxis[0] : chartConfig.yAxis
      // Normalize series to array
      const seriesConfig = chartConfig.series
      seriesFields = seriesConfig ? (Array.isArray(seriesConfig) ? seriesConfig : [seriesConfig]) : []
    } else if (chartConfig?.x && chartConfig?.y) {
      // Legacy format (adapt for scatter chart)
      xAxisField = chartConfig.x
      yAxisField = Array.isArray(chartConfig.y) ? chartConfig.y[0] : chartConfig.y
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

    if (!xAxisField || !yAxisField) {
      return (
        <div className="flex items-center justify-center w-full text-yellow-600" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">Configuration Error</div>
            <div className="text-xs">Missing required X-axis or Y-axis fields</div>
          </div>
        </div>
      )
    }

    // Extract time dimensions from query for tooltip display
    const timeDimensions = queryObject?.timeDimensions || []
    const timeDimensionFields = timeDimensions.map((td: any) => td.dimension)

    // Transform data for scatter plot
    // Null handling: Filter out data points where x or y coordinates are null
    let scatterData: any[]
    let seriesGroups: { [key: string]: any[] } = {}

    if (seriesFields.length > 0) {
      // Group data by series field
      const seriesField = seriesFields[0]
      data.forEach(item => {
        const seriesValue = String(item[seriesField] || 'Default')
        if (!seriesGroups[seriesValue]) {
          seriesGroups[seriesValue] = []
        }

        const xGranularity = getFieldGranularity(queryObject, xAxisField)
        const xValue = formatTimeValue(item[xAxisField], xGranularity) || item[xAxisField]
        const yValue = parseNumericValue(item[yAxisField])

        // Only add point if both x and y are valid numbers
        const xNum = typeof xValue === 'string' ? parseFloat(xValue) : xValue
        if (isValidNumericValue(xNum) && yValue !== null) {
          // Extract time dimension values for tooltip
          const timeValues: { [key: string]: string } = {}
          timeDimensionFields.forEach((field: string) => {
            if (item[field]) {
              const granularity = getFieldGranularity(queryObject, field)
              timeValues[field] = formatTimeValue(item[field], granularity)
            }
          })

          seriesGroups[seriesValue].push({
            x: xNum,
            y: yValue,
            name: seriesValue,
            timeValues,
            originalItem: item
          })
        }
      })

      // Collect all valid points from all series for validation
      // (The actual rendering uses seriesGroups with series separated)
      const seriesKeys = Object.keys(seriesGroups)
      scatterData = seriesKeys.flatMap(key => seriesGroups[key])
    } else {
      // Single series scatter plot
      const xGranularity = getFieldGranularity(queryObject, xAxisField)
      scatterData = data
        .map(item => {
          const xValue = formatTimeValue(item[xAxisField], xGranularity) || item[xAxisField]
          const yValue = parseNumericValue(item[yAxisField])
          const xNum = typeof xValue === 'string' ? parseFloat(xValue) : xValue

          // Extract time dimension values for tooltip
          const timeValues: { [key: string]: string } = {}
          timeDimensionFields.forEach((field: string) => {
            if (item[field]) {
              const granularity = getFieldGranularity(queryObject, field)
              timeValues[field] = formatTimeValue(item[field], granularity)
            }
          })

          return {
            x: xNum,
            y: yValue,
            name: `Point`,
            timeValues,
            originalItem: item,
            isValid: isValidNumericValue(xNum) && yValue !== null
          }
        })
        .filter(point => point.isValid)
    }
    
    // Validate transformed data
    if (!scatterData || scatterData.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-dc-text-muted" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No valid data</div>
            <div className="text-xs text-dc-text-secondary">No valid data points for scatter chart after transformation</div>
          </div>
        </div>
      )
    }

    const seriesKeys = Object.keys(seriesGroups)
    // Limit series to prevent performance issues with high-cardinality fields (e.g., dates)
    // If more than 20 unique series, fall back to single-series mode
    const MAX_SERIES = 20
    const hasSeries = seriesKeys.length > 1 && seriesKeys.length <= MAX_SERIES
    
    // Determine if legend will be shown
    const showLegend = safeDisplayConfig.showLegend && hasSeries
    
    // Use custom chart margins with extra left space for Y-axis label
    const chartMargins = {
      ...CHART_MARGINS,
      left: 40 // Increased from 20 to 40 for Y-axis label space
    }

    return (
      <ChartContainer height={height}>
        <RechartsScatterChart margin={chartMargins}>
          {safeDisplayConfig.showGrid && (
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
          {safeDisplayConfig.showTooltip && (
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) return null
                // Only show the first (active) point
                const point = payload[0]?.payload
                if (!point) return null

                return (
                  <div style={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    color: '#1f2937',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    padding: '8px 12px'
                  }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>{point.name}</div>
                    {/* Show time dimension values if present */}
                    {point.timeValues && Object.keys(point.timeValues).length > 0 && (
                      <div style={{ marginBottom: '4px', color: '#6b7280' }}>
                        {Object.entries(point.timeValues).map(([field, value]) => (
                          <div key={field}>{getFieldLabel(field)}: {value as string}</div>
                        ))}
                      </div>
                    )}
                    <div>{xAxisFormat?.label || getFieldLabel(xAxisField)}: {formatAxisValue(point.x, xAxisFormat)}</div>
                    <div>{yAxisFormat?.label || getFieldLabel(yAxisField)}: {formatAxisValue(point.y, yAxisFormat)}</div>
                  </div>
                )
              }}
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
          {hasSeries ? (
            // Multiple series
            seriesKeys.map((seriesKey, index) => (
              <Scatter
                key={seriesKey}
                name={seriesKey}
                data={seriesGroups[seriesKey]}
                fill={(colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) || CHART_COLORS[index % CHART_COLORS.length]}
                fillOpacity={hoveredLegend ? (hoveredLegend === seriesKey ? 1 : 0.3) : 1}
              />
            ))
          ) : (
            // Single series
            <Scatter
              name="Data"
              data={scatterData}
              fill={(colorPalette?.colors && colorPalette.colors[0]) || CHART_COLORS[0]}
            />
          )}
        </RechartsScatterChart>
      </ChartContainer>
    )
  } catch (error) {
    // 'ScatterChart rendering error
    return (
      <div className="flex flex-col items-center justify-center w-full text-red-500 p-4" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Scatter Chart Error</div>
          <div className="text-xs mb-2">{error instanceof Error ? error.message : 'Unknown rendering error'}</div>
          <div className="text-xs text-dc-text-muted">Check the data and configuration</div>
        </div>
      </div>
    )
  }
}