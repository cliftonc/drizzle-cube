import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import ChartContainer from './ChartContainer'
import { CHART_COLORS, CHART_MARGINS } from '../../utils/chartConstants'
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
  height = "100%"
}: ChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [, setHoveredBubble] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const { getFieldLabel } = useCubeContext()

  const safeDisplayConfig = {
    showLegend: displayConfig?.showLegend ?? true,
    showGrid: displayConfig?.showGrid ?? true,
    showTooltip: displayConfig?.showTooltip ?? true,
    minBubbleSize: displayConfig?.minBubbleSize ?? 5,
    maxBubbleSize: displayConfig?.maxBubbleSize ?? 50,
    bubbleOpacity: displayConfig?.bubbleOpacity ?? 0.7
  }

  // Initial dimension measurement
  useLayoutEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
        }
      }
    }
    
    // Immediate measurement
    updateDimensions()
    
    // Fallback with requestAnimationFrame for next paint
    const rafId = requestAnimationFrame(updateDimensions)
    
    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [])

  // Handle resize with ResizeObserver for better performance
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
        }
      }
    }
    
    // Use ResizeObserver for dynamic resizing
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    // Also listen to window resize as fallback
    window.addEventListener('resize', updateDimensions)
    
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateDimensions)
    }
  }, [])

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current || dimensions.width === 0) return

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove()

    // Debug logging
    console.log('BubbleChart: chartConfig:', chartConfig)
    console.log('BubbleChart: data:', data)
    console.log('BubbleChart: dimensions:', dimensions)

    // Validate chartConfig - only new format supported
    if (!chartConfig?.xAxis || !chartConfig?.yAxis || !chartConfig?.series) {
      console.log('BubbleChart: Missing xAxis, yAxis, or series in chartConfig')
      return
    }

    const xAxisField = chartConfig.xAxis[0]
    const yAxisField = chartConfig.yAxis[0]
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
      bottom: safeDisplayConfig.showLegend ? 70 : 40  // Add extra 10px bottom margin
    }
    const width = dimensions.width - margin.left - margin.right
    const chartHeight = dimensions.height - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
      .attr('width', dimensions.width)
      .attr('height', dimensions.height)

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Set up scales
    const xScale = d3.scaleLinear()
      .domain(d3.extent(bubbleData, d => d.x) as [number, number])
      .range([0, width])
      .nice()

    const yScale = d3.scaleLinear()
      .domain(d3.extent(bubbleData, d => d.y) as [number, number])
      .range([chartHeight, 0])
      .nice()

    const sizeScale = d3.scaleSqrt()
      .domain([0, d3.max(bubbleData, d => d.size) as number])
      .range([safeDisplayConfig.minBubbleSize, safeDisplayConfig.maxBubbleSize])

    // Set up color scale
    let colorScale: d3.ScaleOrdinal<string, string> | d3.ScaleSequential<string>
    const uniqueColors = colorFieldName ? [...new Set(bubbleData.map(d => String(d.color)))] : []
    
    if (colorFieldName && uniqueColors.length > 0) {
      if (typeof bubbleData[0].color === 'number') {
        // Numeric color field - use sequential scale
        const colorExtent = d3.extent(bubbleData, d => d.color as number) as [number, number]
        colorScale = d3.scaleSequential(d3.interpolateViridis)
          .domain(colorExtent)
      } else {
        // Categorical color field - use CHART_COLORS
        colorScale = d3.scaleOrdinal<string>()
          .domain(uniqueColors)
          .range(CHART_COLORS)
      }
    } else {
      // Single color for all bubbles
      colorScale = d3.scaleOrdinal<string>()
        .domain(['default'])
        .range([CHART_COLORS[0]])
    }

    // Add grid
    if (safeDisplayConfig.showGrid) {
      // X-axis grid
      g.append('g')
        .attr('class', 'grid')
        .attr('transform', `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale)
          .tickSize(-chartHeight)
          .tickFormat(() => '')
        )
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3)

      // Y-axis grid
      g.append('g')
        .attr('class', 'grid')
        .call(d3.axisLeft(yScale)
          .tickSize(-width)
          .tickFormat(() => '')
        )
        .style('stroke-dasharray', '3,3')
        .style('opacity', 0.3)
    }

    // Add X axis
    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(xScale))
      .append('text')
      .attr('x', width / 2)
      .attr('y', 35)
      .attr('fill', 'currentColor')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(getFieldLabel(xAxisField))

    // Add Y axis
    g.append('g')
      .call(d3.axisLeft(yScale))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -35)
      .attr('x', -chartHeight / 2)
      .attr('fill', 'currentColor')
      .style('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(getFieldLabel(yAxisField))

    // Create tooltip
    const tooltip = d3.select('body').append('div')
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
          return typeof d.color === 'number' 
            ? (colorScale as d3.ScaleSequential<string>)(d.color)
            : (colorScale as d3.ScaleOrdinal<string, string>)(String(d.color))
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
          d3.select(this)
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
          d3.select(this)
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
      const legendItems = typeof bubbleData[0].color === 'string' ? uniqueColors : []

      if (legendItems.length > 0) {
        const legend = g.append('g')
          .attr('class', 'legend')
          .attr('transform', `translate(${width / 2 - (legendItems.length * 80) / 2}, ${chartHeight + 45})`)

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
          .style('fill', d => (colorScale as d3.ScaleOrdinal<string, string>)(d as string))
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

    // Cleanup function
    return () => {
      tooltip.remove()
    }
  }, [data, chartConfig, displayConfig, queryObject, dimensions, safeDisplayConfig])

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
  if (!chartConfig?.xAxis || !chartConfig?.yAxis || !chartConfig?.series) {
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
        {dimensions.width === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-gray-400 text-sm">Loading chart...</div>
          </div>
        )}
      </div>
    </ChartContainer>
  )
}