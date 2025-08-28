import { useState } from 'react'
import { ScatterChart as RechartsScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import ChartContainer from './ChartContainer'
import ChartTooltip from './ChartTooltip'
import { CHART_COLORS, CHART_MARGINS } from '../../utils/chartConstants'
import { formatTimeValue, getFieldGranularity } from '../../utils/chartUtils'
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

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-gray-500" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No data available</div>
            <div className="text-xs">No data points to display in scatter chart</div>
          </div>
        </div>
      )
    }

    // Validate chartConfig - support both legacy and new formats
    let xAxisField: string
    let yAxisField: string
    let seriesFields: string[] = []
    
    if (chartConfig?.xAxis && chartConfig?.yAxis) {
      // New format
      xAxisField = chartConfig.xAxis[0]
      yAxisField = Array.isArray(chartConfig.yAxis) ? chartConfig.yAxis[0] : chartConfig.yAxis
      seriesFields = chartConfig.series || []
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

    // Transform data for scatter plot
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
        const yValue = typeof item[yAxisField] === 'string' 
          ? parseFloat(item[yAxisField]) 
          : (item[yAxisField] || 0)
          
        seriesGroups[seriesValue].push({
          x: typeof xValue === 'string' ? parseFloat(xValue) || 0 : xValue,
          y: yValue,
          name: `${seriesValue} (${xValue}, ${yValue})`
        })
      })
      
      // Use the first series as primary data
      const seriesKeys = Object.keys(seriesGroups)
      scatterData = seriesGroups[seriesKeys[0]] || []
    } else {
      // Single series scatter plot
      const xGranularity = getFieldGranularity(queryObject, xAxisField)
      scatterData = data.map(item => {
        const xValue = formatTimeValue(item[xAxisField], xGranularity) || item[xAxisField]
        const yValue = typeof item[yAxisField] === 'string' 
          ? parseFloat(item[yAxisField]) 
          : (item[yAxisField] || 0)
          
        return {
          x: typeof xValue === 'string' ? parseFloat(xValue) || 0 : xValue,
          y: yValue,
          name: `(${xValue}, ${yValue})`
        }
      })
    }
    
    // Validate transformed data
    if (!scatterData || scatterData.length === 0) {
      return (
        <div className="flex items-center justify-center w-full text-gray-500" style={{ height }}>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1">No valid data</div>
            <div className="text-xs">No valid data points for scatter chart after transformation</div>
          </div>
        </div>
      )
    }

    const seriesKeys = Object.keys(seriesGroups)
    const hasSeries = seriesKeys.length > 1
    
    // Determine if legend will be shown
    const showLegend = safeDisplayConfig.showLegend && hasSeries
    
    // Use custom chart margins with extra left space for Y-axis label
    const chartMargins = {
      ...CHART_MARGINS,
      left: 40 // Increased from 20 to 40 for Y-axis label space
    }

    return (
      <ChartContainer height={height}>
        <RechartsScatterChart data={scatterData} margin={chartMargins}>
          {safeDisplayConfig.showGrid && (
            <CartesianGrid strokeDasharray="3 3" />
          )}
          <XAxis 
            type="number"
            dataKey="x"
            name={getFieldLabel(xAxisField)}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            type="number"
            dataKey="y"
            name={getFieldLabel(yAxisField)}
            tick={{ fontSize: 12 }}
            label={{ value: getFieldLabel(yAxisField), angle: -90, position: 'left', style: { textAnchor: 'middle', fontSize: '12px' } }}
          />
          {safeDisplayConfig.showTooltip && (
            <ChartTooltip />
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
          <div className="text-xs text-gray-600">Check the data and configuration</div>
        </div>
      </div>
    )
  }
}