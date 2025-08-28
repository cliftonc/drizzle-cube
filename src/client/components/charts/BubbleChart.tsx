import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { select, scaleLinear, scaleSqrt, scaleOrdinal, scaleQuantize, extent, max, axisBottom, axisLeft, type ScaleOrdinal, type ScaleQuantize } from 'd3'
import ChartContainer from './ChartContainer'
import { CHART_COLORS, CHART_COLORS_GRADIENT, CHART_MARGINS } from '../../utils/chartConstants'
import { formatTimeValue, getFieldGranularity } from '../../utils/chartUtils'
import { useCubeContext } from '../../providers/CubeProvider'
import type { ChartProps } from '../../types'

interface BubbleData {
  x: number
  y: number
  size: number
  color?: string | number
  label: string
  series?: string
}

export default function BubbleChart({
  data,
  chartConfig,
  displayConfig = {},
  queryObject,
  height = "100%",
  colorPalette
}: ChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [, setHoveredBubble] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [dimensionsReady, setDimensionsReady] = useState(false)
  const { getFieldLabel } = useCubeContext()

  const safeDisplayConfig = {
    showLegend: displayConfig?.showLegend ?? true,
    showGrid: displayConfig?.showGrid ?? true,
    showTooltip: displayConfig?.showTooltip ?? true,
    minBubbleSize: displayConfig?.minBubbleSize ?? 5,
    maxBubbleSize: displayConfig?.maxBubbleSize ?? 50,
    bubbleOpacity: displayConfig?.bubbleOpacity ?? 0.7
  }

  // Enhanced dimension measurement with retry mechanism
  useLayoutEffect(() => {
    let retryCount = 0
    const maxRetries = 10
    let rafId: number
    let timeoutId: NodeJS.Timeout
    
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        console.log('BubbleChart: Dimension measurement attempt', retryCount + 1, { width, height })
        
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
          setDimensionsReady(true)
          console.log('BubbleChart: Dimensions successfully measured:', { width, height })
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
            console.log('BubbleChart: Dimensions ready via ResizeObserver:', { width, height })
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
              console.log('BubbleChart: Dimensions ready via ResizeObserver:', { width, height })
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
      console.log('BubbleChart: Skipping render - conditions not met:', {
        hasData: data && data.length > 0,
        hasSvgRef: !!svgRef.current,
        dimensionsReady,
        dimensions
      })
      return
    }

    // Clear previous chart
    select(svgRef.current).selectAll('*').remove()

    // Debug logging
    console.log('BubbleChart: chartConfig:', chartConfig)
    console.log('BubbleChart: data:', data)
    console.log('BubbleChart: dimensions:', dimensions)

    // Validate chartConfig - only new format supported
    if (!chartConfig?.xAxis || !chartConfig?.yAxis || !chartConfig?.series) {
      console.log('BubbleChart: Missing xAxis, yAxis, or series in chartConfig')
      return
    }

    const xAxisField = Array.isArray(chartConfig.xAxis) ? chartConfig.xAxis[0] : chartConfig.xAxis
    const yAxisField = Array.isArray(chartConfig.yAxis) ? chartConfig.yAxis[0] : chartConfig.yAxis
    const seriesField = Array.isArray(chartConfig.series) ? chartConfig.series[0] : chartConfig.series
    const sizeFieldName = Array.isArray(chartConfig.sizeField) ? chartConfig.sizeField[0] : chartConfig.sizeField || yAxisField
    const colorFieldName = Array.isArray(chartConfig.colorField) ? chartConfig.colorField[0] : chartConfig.colorField

    console.log('BubbleChart: fields extracted:', {
      xAxisField,
      yAxisField,
      seriesField,
      sizeFieldName,
      colorFieldName
    })

    if (!xAxisField || !yAxisField || !seriesField || !sizeFieldName) {
      console.log('BubbleChart: Missing required fields')
      return
    }

    // Transform data for bubble chart
    const xGranularity = getFieldGranularity(queryObject, xAxisField)
    const bubbleData: BubbleData[] = data.map(item => {
      const xValue = formatTimeValue(item[xAxisField], xGranularity) || item[xAxisField]
      const yValue = typeof item[yAxisField] === 'string' 
        ? parseFloat(item[yAxisField]) 
        : (item[yAxisField] || 0)
      const sizeValue = typeof item[sizeFieldName] === 'string'
        ? parseFloat(item[sizeFieldName])
        : (item[sizeFieldName] || 0)
      
      const seriesValue = item[seriesField]
      
      return {
        x: typeof xValue === 'string' ? parseFloat(xValue) || 0 : xValue,
        y: yValue,
        size: Math.abs(sizeValue), // Ensure positive size
        color: colorFieldName ? item[colorFieldName] : seriesValue,
        series: seriesValue,
        label: `${seriesValue || 'Unknown'}`
      }
    }).filter(d => d.size > 0) // Filter out bubbles with no size

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

    // Add grid
    if (safeDisplayConfig.showGrid) {
      // X-axis grid
      g.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(axisBottom(xScale)
          .tickSize(-chartHeight)
          .tickFormat(() => '')
        )
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3)

      // Y-axis grid
      g.append('g')
        .attr('class', 'grid')
        .call(axisLeft(yScale)
          .tickSize(-width)
          .tickFormat(() => '')
        )
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3)
    }

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(axisBottom(xScale))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', 'currentColor')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(getFieldLabel(xAxisField))

    // Add Y axis
    g.append('g')
      .call(axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -35)
      .attr('x', -chartHeight / 2)
      .attr('fill', 'currentColor')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(getFieldLabel(yAxisField))

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
            `${getFieldLabel(xAxisField)}: ${d.x}`,
            `${getFieldLabel(yAxisField)}: ${d.y}`,
            `${getFieldLabel(sizeFieldName)}: ${d.size}`,
            colorFieldName && d.color ? `${getFieldLabel(colorFieldName)}: ${d.color}` : ''
          ].filter(Boolean).join('<br>')

          tooltip
            .html(tooltipContent)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .transition()
            .duration(200)
            .style('opacity', 1)

          setHoveredBubble(d.label)
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

          setHoveredBubble(null)
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
          .style('fill', 'currentColor')
          .text(minValue.toFixed(2))

        // Add max value label
        legend.append('text')
          .attr('x', legendWidth)
          .attr('y', legendHeight + 15)
          .attr('text-anchor', 'end')
          .style('font-size', '11px')
          .style('fill', 'currentColor')
          .text(maxValue.toFixed(2))

        // Add field name label
        legend.append('text')
          .attr('x', legendWidth / 2)
          .attr('y', -5)
          .attr('text-anchor', 'middle')
          .style('font-size', '12px')
          .style('font-weight', 'bold')
          .style('fill', 'currentColor')
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
            .style('fill', 'currentColor')
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
  }, [data, chartConfig, displayConfig, queryObject, dimensions, dimensionsReady, safeDisplayConfig.showLegend, safeDisplayConfig.showGrid, safeDisplayConfig.showTooltip, safeDisplayConfig.minBubbleSize, safeDisplayConfig.maxBubbleSize, safeDisplayConfig.bubbleOpacity, colorPalette])

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center w-full text-gray-500" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">No data available</div>
          <div className="text-xs">No data points to display in bubble chart</div>
        </div>
      </div>
    )
  }

  // Validate that we have required fields
  const hasValidConfig = chartConfig?.xAxis && chartConfig?.yAxis && chartConfig?.series
  if (!hasValidConfig) {
    return (
      <div className="flex items-center justify-center w-full text-yellow-600" style={{ height }}>
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Configuration Required</div>
          <div className="text-xs">Bubble chart requires xAxis, yAxis, series, and sizeField dimensions</div>
          <div className="text-xs mt-1">Optional: colorField for bubble coloring</div>
        </div>
      </div>
    )
  }

  return (
    <ChartContainer height={height}>
      <div ref={containerRef} className="w-full h-full relative">
        <svg ref={svgRef} className="w-full h-full" />
        {!dimensionsReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-400 text-sm">Measuring chart dimensions...</div>
          </div>
        )}
      </div>
    </ChartContainer>
  )
}