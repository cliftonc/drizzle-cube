import React, { useState } from 'react'
import { PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts'
import ChartContainer from './ChartContainer'
import ChartTooltip from './ChartTooltip'
import { CHART_COLORS } from '../../utils/chartConstants'
import { transformChartDataWithSeries, formatTimeValue, getFieldGranularity, formatAxisValue } from '../../utils/chartUtils'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel'
import type { ChartProps } from '../../types'

const PieChart = React.memo(function PieChart({
  data,
  chartConfig,
  displayConfig = {},
  queryObject,
  height = "100%",
  colorPalette,
  onDataPointClick,
  drillEnabled
}: ChartProps) {
  const [hoveredLegend, setHoveredLegend] = useState<string | null>(null)
  // Use specialized hook to avoid re-renders from unrelated context changes
  const getFieldLabel = useCubeFieldLabel()
  
  try {
    const safeDisplayConfig = {
      showLegend: displayConfig?.showLegend ?? true,
      showTooltip: displayConfig?.showTooltip ?? true,
      leftYAxisFormat: displayConfig?.leftYAxisFormat
    }

    if (!data || data.length === 0) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
          <div className="text-center">
            <div className="dc:text-sm dc:font-semibold dc:mb-1">No data available</div>
            <div className="dc:text-xs text-dc-text-secondary">No data points to display in pie chart</div>
          </div>
        </div>
      )
    }

    let pieData: Array<{name: string, value: number}>

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
        <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-warning" style={{ height }}>
          <div className="text-center">
            <div className="dc:text-sm dc:font-semibold dc:mb-1">Configuration Error</div>
            <div className="dc:text-xs">chartConfig.x/y or chartConfig.xAxis/yAxis required for pie chart</div>
          </div>
        </div>
      )
    }

    if (!xAxisField || !yAxisFields || yAxisFields.length === 0) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-warning" style={{ height }}>
          <div className="text-center">
            <div className="dc:text-sm dc:font-semibold dc:mb-1">Configuration Error</div>
            <div className="dc:text-xs">Missing required X-axis or Y-axis fields</div>
          </div>
        </div>
      )
    }

    if (seriesFields.length > 0) {
      // Use series-based transformation for dimension-based pie slices
      const { data: chartData } = transformChartDataWithSeries(
        data,
        xAxisField,
        yAxisFields,
        queryObject,
        seriesFields,
        getFieldLabel
      )
      
      // Convert series data to pie format
      pieData = []
      if (chartData.length > 0) {
        const firstRow = chartData[0]
        Object.keys(firstRow).forEach(key => {
          if (key !== 'name' && typeof firstRow[key] === 'number') {
            pieData.push({
              name: String(key),
              value: firstRow[key]
            })
          }
        })
      }
    } else {
      // Standard measure-based pie chart
      const granularity = getFieldGranularity(queryObject, xAxisField)
      pieData = data.map(item => {
        let name = formatTimeValue(item[xAxisField], granularity) || String(item[xAxisField]) || 'Unknown'
        // Handle boolean values with better labels
        if (typeof item[xAxisField] === 'boolean') {
          name = item[xAxisField] ? 'Active' : 'Inactive'
        } else if (name === 'true' || name === 'false') {
          name = name === 'true' ? 'Active' : 'Inactive'
        }
        return {
          name,
          value: typeof item[yAxisFields[0]] === 'string' 
            ? parseFloat(item[yAxisFields[0]]) 
            : (item[yAxisFields[0]] || 0)
        }
      })
    }

    // Filter out invalid values (null, undefined, NaN, or zero)
    const originalLength = pieData.length
    pieData = pieData.filter(item => 
      item.value != null && 
      !isNaN(item.value) && 
      item.value !== 0 && 
      item.value > 0
    )
    
    if (pieData.length === 0) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
          <div className="text-center">
            <div className="dc:text-sm dc:font-semibold dc:mb-1">No valid data</div>
            <div className="dc:text-xs text-dc-text-secondary">
              {originalLength > 0
                ? `Filtered out ${originalLength} data points (zero or invalid values)`
                : 'No data points to display in pie chart'
              }
            </div>
          </div>
        </div>
      )
    }
  
    return (
      <ChartContainer height={height}>
        <RechartsPieChart accessibilityLayer={false}>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius="70%"
            dataKey="value"
            label={!safeDisplayConfig.showLegend ? ({ name, percent }) =>
              `${name} ${((percent || 0) * 100).toFixed(0)}%`
            : undefined}
            cursor={drillEnabled ? 'pointer' : undefined}
            onClick={(sliceData: any, _index: number, event: React.MouseEvent) => {
              if (onDataPointClick && drillEnabled && sliceData) {
                onDataPointClick({
                  dataPoint: sliceData,
                  clickedField: yAxisFields[0],
                  xValue: sliceData.name,
                  position: { x: event.clientX, y: event.clientY },
                  nativeEvent: event
                })
              }
            }}
          >
            {pieData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={(colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) || CHART_COLORS[index % CHART_COLORS.length]}
                fillOpacity={hoveredLegend ? (hoveredLegend === pieData[index].name ? 1 : 0.3) : 1}
              />
            ))}
          </Pie>
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
        </RechartsPieChart>
      </ChartContainer>
    )
  } catch (error) {
    // 'PieChart rendering error
    return (
      <div className="dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full text-dc-error dc:p-4" style={{ height }}>
        <div className="text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">Pie Chart Error</div>
          <div className="dc:text-xs dc:mb-2">{error instanceof Error ? error.message : 'Unknown rendering error'}</div>
          <div className="dc:text-xs text-dc-text-muted">Check the data and configuration</div>
        </div>
      </div>
    )
  }
})

export default PieChart