import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { select, scaleLinear, scaleSqrt, scaleOrdinal, scaleQuantize, extent, max, axisBottom, axisLeft, transition as _transition, type ScaleOrdinal, type ScaleQuantize } from 'd3'
// _transition import is for side effects only - it extends Selection.prototype with .transition() method
import { CHART_COLORS, CHART_COLORS_GRADIENT, CHART_MARGINS } from '../../utils/chartConstants'
import { formatTimeValue, getFieldGranularity, parseNumericValue, isValidNumericValue, formatAxisValue } from '../../utils/chartUtils'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel'
import { useTheme } from '../../hooks/useTheme'
import type { ChartProps } from '../../types'

interface BubbleData {
  x: number
  xLabel?: string // Formatted label for time dimensions
  y: number
  size: number
  color?: string | number
  label: string
  series?: string
}

const BubbleChart = React.memo(function BubbleChart({
  data,
  chartConfig,
  displayConfig = {},
  queryObject,
  height = "100%",
  colorPalette
}: ChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [dimensionsReady, setDimensionsReady] = useState(false)
  const { theme } = useTheme()
  const getFieldLabel = useCubeFieldLabel()

  // Memoize safeDisplayConfig to prevent unnecessary re-renders
  const safeDisplayConfig = useMemo(() => ({
    showLegend: displayConfig?.showLegend ?? true,
    showGrid: displayConfig?.showGrid ?? true,
    showTooltip: displayConfig?.showTooltip ?? true,
    minBubbleSize: displayConfig?.minBubbleSize ?? 5,
    maxBubbleSize: displayConfig?.maxBubbleSize ?? 50,
    bubbleOpacity: displayConfig?.bubbleOpacity ?? 0.7,
    xAxisFormat: displayConfig?.xAxisFormat,
    leftYAxisFormat: displayConfig?.leftYAxisFormat
  }), [
    displayConfig?.showLegend,
    displayConfig?.showGrid,
    displayConfig?.showTooltip,
    displayConfig?.minBubbleSize,
    displayConfig?.maxBubbleSize,
    displayConfig?.bubbleOpacity,
    displayConfig?.xAxisFormat,
    displayConfig?.leftYAxisFormat
  ])

  // Enhanced dimension measurement with retry mechanism
  useLayoutEffect(() => {
    let retryCount = 0
    const maxRetries = 10
    let rafId: number
    let timeoutId: ReturnType<typeof setTimeout>
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
          setDimensionsReady(true)
          return true
        }
      }
      return false
    }
    
    // Immediate measurement
    const success = updateDimensions()
    
    if (!success && retryCount < maxRetries) {
      // Retry with requestAnimationFrame
      const retryWithRaf = () => {
        const rafSuccess = updateDimensions()
        
        if (!rafSuccess && retryCount < maxRetries) {
          retryCount++
          // Use setTimeout for additional retries with increasing delays
          timeoutId = setTimeout(() => {
            rafId = requestAnimationFrame(retryWithRaf)
          }, 50 * retryCount) // Increasing delay: 50ms, 100ms, 150ms, etc.
        }
      }
      
      rafId = requestAnimationFrame(retryWithRaf)
    }
    
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // Enhanced ResizeObserver for dynamic resizing with immediate initialization
  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
          if (!dimensionsReady) {
            setDimensionsReady(true)
          }
        }
      }
    }
    
    // Initialize ResizeObserver immediately
    if (containerRef.current) {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect
          if (width > 0 && height > 0) {
            setDimensions({ width, height })
            if (!dimensionsReady) {
              setDimensionsReady(true)
              }
          }
        }
      })
      
      resizeObserver.observe(containerRef.current)
      
      // Also try immediate measurement as fallback
      updateDimensions()
    }

    // Window resize as additional fallback
    window.addEventListener('resize', updateDimensions)
    
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      window.removeEventListener('resize', updateDimensions)
    }
  }, [dimensionsReady])

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current || !dimensionsReady || dimensions.width === 0) {
      return
    }

    // Clear previous chart
    select(svgRef.current).selectAll('*').remove()


    // Validate chartConfig - only new format supported
    if (!chartConfig?.xAxis || !chartConfig?.yAxis || !chartConfig?.series) {
      return
    }

    const xAxisField = Array.isArray(chartConfig.xAxis) ? chartConfig.xAxis[0] : chartConfig.xAxis
    const yAxisField = Array.isArray(chartConfig.yAxis) ? chartConfig.yAxis[0] : chartConfig.yAxis
    const seriesField = Array.isArray(chartConfig.series) ? chartConfig.series[0] : chartConfig.series
    const sizeFieldName = Array.isArray(chartConfig.sizeField) ? chartConfig.sizeField[0] : chartConfig.sizeField || yAxisField
    const colorFieldName = Array.isArray(chartConfig.colorField) ? chartConfig.colorField[0] : chartConfig.colorField


    if (!xAxisField || !yAxisField || !seriesField || !sizeFieldName) {
      return
    }

    // Transform data for bubble chart
    // Null handling: Filter out bubbles where x, y, or size are null
    const xGranularity = getFieldGranularity(queryObject, xAxisField)

    // Check if x-axis field is a time dimension
    const isTimeDimension = queryObject?.timeDimensions?.some(
      (td: { dimension: string }) => td.dimension === xAxisField
    ) || false

    const bubbleData: BubbleData[] = data
      .map(item => {
        const rawXValue = item[xAxisField]
        let xNum: number
        let xLabel: string

        if (isTimeDimension && rawXValue) {
          // For time dimensions, convert to timestamp for proper numeric positioning
          const dateStr = String(rawXValue)
          // Try to parse as date - handle ISO format and PostgreSQL format
          let date: Date
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}[T ]/)) {
            // Full timestamp format
            let isoStr = dateStr
            if (dateStr.includes(' ')) {
              isoStr = dateStr.replace(' ', 'T').replace('+00', 'Z').replace(/\+\d{2}:\d{2}$/, 'Z')
            }
            if (!isoStr.endsWith('Z') && !isoStr.includes('+')) {
              isoStr = isoStr + 'Z'
            }
            date = new Date(isoStr)
          } else {
            date = new Date(dateStr)
          }

          xNum = isNaN(date.getTime()) ? parseFloat(dateStr) : date.getTime()
          xLabel = formatTimeValue(rawXValue, xGranularity)
        } else {
          // Non-time value - use as-is
          const formattedValue = formatTimeValue(rawXValue, xGranularity) || rawXValue
          xNum = typeof formattedValue === 'string' ? parseFloat(formattedValue) : formattedValue
          xLabel = String(formattedValue)
        }

        const yValue = parseNumericValue(item[yAxisField])
        const sizeValue = parseNumericValue(item[sizeFieldName])
        const seriesValue = item[seriesField]

        return {
          x: xNum,
          xLabel, // Store formatted label for tooltip display
          y: yValue as number, // Type assertion: filter below ensures this is never null
          size: sizeValue !== null ? Math.abs(sizeValue) : 0, // Ensure positive size
          color: colorFieldName ? item[colorFieldName] : seriesValue,
          series: seriesValue,
          label: `${seriesValue || 'Unknown'}`,
          isValid: isValidNumericValue(xNum) && yValue !== null && sizeValue !== null && sizeValue > 0
        }
      })
      .filter(d => d.isValid && d.size > 0) // Filter out bubbles with invalid coordinates or no size

    if (bubbleData.length === 0) return

    const margin = { 
      ...CHART_MARGINS, 
      left: CHART_MARGINS.left + 30,  // Add extra 30px left margin for Y-axis label
      bottom: (safeDisplayConfig.showLegend && colorFieldName) ? 100 : 40  // Add extra space for legend
    }
    const width = dimensions.width - margin.left - margin.right
    const chartHeight = dimensions.height - margin.top - margin.bottom

    const svg = select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Set up scales
    const xScale = scaleLinear()
      .domain(extent(bubbleData, d => d.x) as [number, number])
      .range([0, width])
      .nice()

    const yScale = scaleLinear()
      .domain(extent(bubbleData, d => d.y) as [number, number])
      .range([chartHeight, 0])
      .nice()

    const sizeScale = scaleSqrt()
      .domain([0, max(bubbleData, d => d.size) as number])
      .range([safeDisplayConfig.minBubbleSize, safeDisplayConfig.maxBubbleSize])

    // Set up color scale
    let colorScale: ScaleOrdinal<string, string> | ScaleQuantize<string>
    let isNumericColorField = false
    let uniqueColors: string[] = []
    
    if (colorFieldName && bubbleData.length > 0) {
      // Check if color field is numeric for color scaling (same logic as TreeMapChart)
      const colorValues = bubbleData.map(item => {
        const value = item.color
        return typeof value === 'string' ? parseFloat(value) : value
      }).filter((val): val is number => !isNaN(val as number))
      
      isNumericColorField = colorValues.length === bubbleData.length && colorValues.every(val => typeof val === 'number')
      
      if (isNumericColorField) {
        // Use D3 quantize scale for better color distribution with small ranges
        const minValue = Math.min(...colorValues)
        const maxValue = Math.max(...colorValues)
        
        // Create D3 quantize color scale - maps continuous data to discrete color bands
        colorScale = scaleQuantize<string>()
          .domain([minValue, maxValue])
          .range(colorPalette?.gradient || CHART_COLORS_GRADIENT)
      } else {
        // Categorical color field - use series colors
        uniqueColors = [...new Set(bubbleData.map(d => String(d.color)))]
        colorScale = scaleOrdinal<string>()
          .domain(uniqueColors)
          .range(colorPalette?.colors || CHART_COLORS)
      }
    } else {
      // Single color for all bubbles
      colorScale = scaleOrdinal<string>()
        .domain(['default'])
        .range([CHART_COLORS[0]])
    }

    // Get theme colors from CSS variables
    const getThemeColor = (varName: string, fallback: string) => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      return value || fallback
    }

    const isDark = theme !== 'light'
    const textColor = isDark
      ? getThemeColor('--dc-text-muted', '#cbd5e1')  // Lighter text for dark mode
      : getThemeColor('--dc-text-secondary', '#374151')  // Darker text for light mode
    const gridColor = isDark
      ? getThemeColor('--dc-border', '#475569')  // Lighter grid for dark mode
      : '#9ca3af'  // Much darker gray for light mode visibility

    // Add grid
    if (safeDisplayConfig.showGrid) {
      // X-axis grid
      const xGrid = g.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(axisBottom(xScale)
          .tickSize(-chartHeight)
          .tickFormat(() => '')
        )

      xGrid.selectAll('line')
        .style('stroke', gridColor)
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3)

      xGrid.select('.domain')
        .style('stroke', 'none')

      // Y-axis grid
      const yGrid = g.append('g')
        .attr('class', 'grid')
        .call(axisLeft(yScale)
          .tickSize(-width)
          .tickFormat(() => '')
        )

      yGrid.selectAll('line')
        .style('stroke', gridColor)
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3)

      yGrid.select('.domain')
        .style('stroke', 'none')
    }

    // Add X axis with proper time formatting if needed
    const xAxisGenerator = axisBottom(xScale)

    // If it's a time dimension, format the tick labels
    if (isTimeDimension) {
      xAxisGenerator.tickFormat((d) => {
        const date = new Date(d as number)
        if (isNaN(date.getTime())) return String(d)

        // Format based on granularity
        switch (xGranularity?.toLowerCase()) {
          case 'year':
            return String(date.getUTCFullYear())
          case 'quarter': {
            const q = Math.floor(date.getUTCMonth() / 3) + 1
            return `${date.getUTCFullYear()}-Q${q}`
          }
          case 'month':
            return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
          case 'week':
          case 'day':
            return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
          case 'hour':
            return `${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')} ${String(date.getUTCHours()).padStart(2, '0')}:00`
          default:
            return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
        }
      })
    } else if (safeDisplayConfig.xAxisFormat) {
      // Apply custom formatting for non-time X-axis
      xAxisGenerator.tickFormat((d) => formatAxisValue(d as number, safeDisplayConfig.xAxisFormat))
    }

    const xAxis = g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxisGenerator)

    xAxis.selectAll('text')
      .style('fill', textColor)

    xAxis.selectAll('line, path')
      .style('stroke', gridColor)

    xAxis.append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', textColor)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(safeDisplayConfig.xAxisFormat?.label || getFieldLabel(xAxisField))

    // Add Y axis with optional formatting
    const yAxisGenerator = axisLeft(yScale)
    if (safeDisplayConfig.leftYAxisFormat) {
      yAxisGenerator.tickFormat((d) => formatAxisValue(d as number, safeDisplayConfig.leftYAxisFormat))
    }
    const yAxis = g.append('g')
      .call(yAxisGenerator)

    yAxis.selectAll('text')
      .style('fill', textColor)

    yAxis.selectAll('line, path')
      .style('stroke', gridColor)

    yAxis.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -35)
      .attr('x', -chartHeight / 2)
      .attr('fill', textColor)
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(safeDisplayConfig.leftYAxisFormat?.label || getFieldLabel(yAxisField))

    // Create tooltip
    const tooltip = select('body').append('div')
      .attr('class', 'bubble-chart-tooltip')
      .style('position', 'absolute')
      .style('padding', '8px')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000)

    // Add bubbles
    const bubbles = g.selectAll('.bubble')
      .data(bubbleData)
      .enter().append('circle')
      .attr('class', 'bubble')
      .attr('cx', d => xScale(d.x))
      .attr('cy', d => yScale(d.y))
      .attr('r', d => sizeScale(d.size))
      .style('fill', d => {
        if (colorFieldName && d.color !== undefined) {
          return isNumericColorField
            ? (colorScale as ScaleQuantize<string>)(d.color as number)
            : (colorScale as ScaleOrdinal<string, string>)(String(d.color))
        }
        return CHART_COLORS[0]
      })
      .style('opacity', safeDisplayConfig.bubbleOpacity)
      .style('stroke', '#fff')
      .style('stroke-width', 1)
      .style('cursor', 'pointer')

    // Add hover effects
    if (safeDisplayConfig.showTooltip) {
      bubbles
        .on('mouseover', function(event, d) {
          select(this)
            .transition()
            .duration(200)
            .style('opacity', 1)
            .attr('r', sizeScale(d.size) * 1.1)

          const tooltipContent = [
            `<strong>${d.series || 'Unknown'}</strong>`,
            `${getFieldLabel(xAxisField)}: ${d.xLabel || (safeDisplayConfig.xAxisFormat ? formatAxisValue(d.x, safeDisplayConfig.xAxisFormat) : d.x)}`,
            `${getFieldLabel(yAxisField)}: ${safeDisplayConfig.leftYAxisFormat ? formatAxisValue(d.y, safeDisplayConfig.leftYAxisFormat) : d.y}`,
            `${getFieldLabel(sizeFieldName)}: ${safeDisplayConfig.leftYAxisFormat ? formatAxisValue(d.size, safeDisplayConfig.leftYAxisFormat) : d.size}`,
            colorFieldName && d.color ? `${getFieldLabel(colorFieldName)}: ${d.color}` : ''
          ].filter(Boolean).join('<br>')

          tooltip
            .html(tooltipContent)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .transition()
            .duration(200)
            .style('opacity', 1)
        })
        .on('mousemove', function(event) {
          tooltip
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
        })
        .on('mouseout', function(_event, d) {
          select(this)
            .transition()
            .duration(200)
            .style('opacity', safeDisplayConfig.bubbleOpacity)
            .attr('r', sizeScale(d.size))

          tooltip
            .transition()
            .duration(200)
            .style('opacity', 0)
        })
    }

    // Add legend if needed
    if (safeDisplayConfig.showLegend && colorFieldName) {
      if (isNumericColorField) {
        // Create gradient legend for numeric color field
        const legendWidth = 200
        const legendHeight = 20
        const minValue = Math.min(...bubbleData.map(d => d.color as number))
        const maxValue = Math.max(...bubbleData.map(d => d.color as number))
        
        const legend = g.append('g')
          .attr('class', 'color-legend')
          .attr('transform', `translate(${width / 2 - legendWidth / 2}, ${chartHeight + 60})`)

        // Create gradient definition
        const defs = svg.append('defs')
        const gradient = defs.append('linearGradient')
          .attr('id', 'color-scale-gradient')
          .attr('x1', '0%')
          .attr('y1', '0%')
          .attr('x2', '100%')
          .attr('y2', '0%')

        // Add color stops for the gradient
        const gradientColors = colorPalette?.gradient || CHART_COLORS_GRADIENT
        gradientColors.forEach((color, i) => {
          gradient.append('stop')
            .attr('offset', `${(i / (gradientColors.length - 1)) * 100}%`)
            .attr('stop-color', color)
        })

        // Add the gradient rectangle
        legend.append('rect')
          .attr('width', legendWidth)
          .attr('height', legendHeight)
          .style('fill', 'url(#color-scale-gradient)')
          .style('stroke', '#ccc')
          .style('stroke-width', 1)

        // Add min value label
        legend.append('text')
          .attr('x', 0)
          .attr('y', legendHeight + 15)
          .attr('text-anchor', 'start')
          .style('font-size', '11px')
          .style('fill', textColor)
          .text(safeDisplayConfig.leftYAxisFormat ? formatAxisValue(minValue, safeDisplayConfig.leftYAxisFormat) : minValue.toFixed(2))

        // Add max value label
        legend.append('text')
          .attr('x', legendWidth)
          .attr('y', legendHeight + 15)
          .attr('text-anchor', 'end')
          .style('font-size', '11px')
          .style('fill', textColor)
          .text(safeDisplayConfig.leftYAxisFormat ? formatAxisValue(maxValue, safeDisplayConfig.leftYAxisFormat) : maxValue.toFixed(2))

        // Add field name label
        legend.append('text')
          .attr('x', legendWidth / 2)
          .attr('y', -5)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .style('fill', textColor)
          .text(getFieldLabel(colorFieldName))

      } else {
        // Original categorical legend
        const legendItems = uniqueColors

        if (legendItems.length > 0) {
          const legend = g.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width / 2 - (legendItems.length * 80) / 2}, ${chartHeight + 60})`)

          const legendItem = legend.selectAll('.legend-item')
            .data(legendItems)
            .enter().append('g')
            .attr('class', 'legend-item')
            .attr('transform', (_d, i) => `translate(${i * 80}, 0)`)
            .style('cursor', 'pointer')

          legendItem.append('circle')
            .attr('cx', 5)
            .attr('cy', 5)
            .attr('r', 5)
            .style('fill', d => (colorScale as ScaleOrdinal<string, string>)(d as string))
            .style('opacity', safeDisplayConfig.bubbleOpacity)

          legendItem.append('text')
            .attr('x', 15)
            .attr('y', 5)
            .attr('dy', '.35em')
            .style('font-size', '11px')
            .style('fill', textColor)
            .text(d => String(d))

          // Legend hover effects
          legendItem
            .on('mouseover', function(_event, legendKey) {
              // Highlight matching bubbles
              bubbles
                .transition()
                .duration(200)
                .style('opacity', d => {
                  const matches = colorFieldName && String(d.color) === legendKey
                  return matches ? 1 : 0.2
                })
            })
            .on('mouseout', function() {
              // Reset all bubbles
              bubbles
                .transition()
                .duration(200)
                .style('opacity', safeDisplayConfig.bubbleOpacity)
            })
        }
      }
    }

    // Cleanup function
    return () => {
      tooltip.remove()
    }
  }, [data, chartConfig, safeDisplayConfig, queryObject, dimensions, dimensionsReady, colorPalette, theme, getFieldLabel])

  if (!data || data.length === 0) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
        <div className="text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">No data available</div>
          <div className="dc:text-xs text-dc-text-secondary">No data points to display in bubble chart</div>
        </div>
      </div>
    )
  }

  // Validate that we have required fields
  const hasValidConfig = chartConfig?.xAxis && chartConfig?.yAxis && chartConfig?.series
  if (!hasValidConfig) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-warning" style={{ height }}>
        <div className="text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">Configuration Required</div>
          <div className="dc:text-xs">Bubble chart requires xAxis, yAxis, series, and sizeField dimensions</div>
          <div className="dc:text-xs dc:mt-1">Optional: colorField for bubble coloring</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dc:w-full dc:flex-1 dc:flex dc:flex-col dc:relative" style={{ height, minHeight: '250px', overflow: 'hidden' }}>
      <div ref={containerRef} className="dc:w-full dc:h-full dc:relative">
        <svg ref={svgRef} className="dc:w-full dc:h-full" />
        {!dimensionsReady && (
          <div className="dc:absolute dc:inset-0 dc:flex dc:items-center dc:justify-center">
            <div className="text-dc-text-muted dc:text-sm">Measuring chart dimensions...</div>
          </div>
        )}
      </div>
    </div>
  )
})

export default BubbleChart