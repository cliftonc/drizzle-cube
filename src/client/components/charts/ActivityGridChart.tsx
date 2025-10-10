import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { select, scaleQuantize, max, min } from 'd3'
import ChartContainer from './ChartContainer'
import { CHART_COLORS_GRADIENT, CHART_MARGINS } from '../../utils/chartConstants'
import { formatTimeValue } from '../../utils/chartUtils'
import { useCubeContext } from '../../providers/CubeProvider'
import { getTheme, watchThemeChanges, type Theme } from '../../theme'
import type { ChartProps } from '../../types'

interface GridCell {
  x: number
  y: number
  value: number
  date: Date
  label: string
}

interface GridMapping {
  extractX: (date: Date) => number
  extractY: (date: Date) => number
  xLabels: string[]
  yLabels: string[]
  xFormat: (value: number) => string
  yFormat: (value: number) => string
  cellWidth: number
  cellHeight: number
  hasHierarchicalLabels?: boolean
  getYearFromX?: (value: number) => number
}

export default function ActivityGridChart({
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
  const [currentTheme, setCurrentTheme] = useState<Theme>('light')
  const { getFieldLabel } = useCubeContext()

  // Watch for theme changes
  useEffect(() => {
    setCurrentTheme(getTheme())
    const unwatch = watchThemeChanges((theme) => {
      setCurrentTheme(theme)
    })
    return unwatch
  }, [])

  const safeDisplayConfig = {
    showTooltip: displayConfig?.showTooltip ?? true,
    showLabels: displayConfig?.showLabels ?? true,
    colorIntensity: displayConfig?.colorIntensity ?? 'medium'
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
        
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
          setDimensionsReady(true)
          return true
        }
      }
      return false
    }
    
    const success = updateDimensions()
    
    if (!success && retryCount < maxRetries) {
      const retryWithRaf = () => {
        const rafSuccess = updateDimensions()
        
        if (!rafSuccess && retryCount < maxRetries) {
          retryCount++
          timeoutId = setTimeout(() => {
            rafId = requestAnimationFrame(retryWithRaf)
          }, 50 * retryCount)
        }
      }
      
      rafId = requestAnimationFrame(retryWithRaf)
    }
    
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // ResizeObserver for dynamic resizing
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
    
    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => updateDimensions())
      resizeObserver.observe(containerRef.current)
      updateDimensions()
    }

    window.addEventListener('resize', updateDimensions)
    
    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      window.removeEventListener('resize', updateDimensions)
    }
  }, [dimensionsReady])

  // Helper functions for grid coordinate extraction
  const getQuarter = (date: Date): number => {
    return Math.floor(date.getMonth() / 3) + 1 // 1-4
  }

  const getMonthOfQuarter = (date: Date): number => {
    return (date.getMonth() % 3) + 1 // 1-3
  }

  const getWeekOfMonth = (date: Date): number => {
    // Always start from week 1 for the first week of the month, regardless of day offset
    const dayOfMonth = date.getDate()
    return Math.floor((dayOfMonth - 1) / 7) + 1 // 1-5 typically
  }

  // Get granularity mapping based on time dimension
  const getGridMapping = (granularity: string): GridMapping | null => {
    switch (granularity?.toLowerCase()) {
      case 'year':
        // Year granularity is not useful for activity grids
        return null
      
      case 'quarter':
        // Quarter granularity: years × quarters
        return {
          extractX: (date: Date) => date.getFullYear(),
          extractY: (date: Date) => getQuarter(date) - 1, // 0-3 for indexing
          xLabels: [], // Will be determined from data
          yLabels: ['Q1', 'Q2', 'Q3', 'Q4'],
          xFormat: (value: number) => `'${value.toString().slice(-2)}`, // '24 instead of 2024
          yFormat: (value: number) => ['Q1', 'Q2', 'Q3', 'Q4'][value] || '',
          cellWidth: 16,
          cellHeight: 16
        }
      
      case 'month':
        // Month granularity: quarters × months of quarter
        // Show years above and quarters (Q1, Q2, Q3, Q4) as columns with hierarchical labels
        return {
          extractX: (date: Date) => {
            const year = date.getFullYear()
            const quarter = getQuarter(date) // 1-4
            return year * 10 + quarter // e.g., 20241, 20242, 20243, 20244 (only 4 per year)
          },
          extractY: (date: Date) => getMonthOfQuarter(date) - 1, // 0-2 for indexing
          xLabels: [], // Will be determined from data
          yLabels: ['Month 1', 'Month 2', 'Month 3'],
          xFormat: (value: number) => {
            const quarter = value % 10
            return `Q${quarter}` // Just show Q1, Q2, Q3, Q4 for individual columns
          },
          yFormat: (value: number) => ['Month 1', 'Month 2', 'Month 3'][value] || '',
          cellWidth: 16,
          cellHeight: 16,
          hasHierarchicalLabels: true, // Flag to indicate we need special handling
          getYearFromX: (value: number) => Math.floor(value / 10) // Helper to get year for grouping
        }
      
      case 'week':
        // Week granularity: months × weeks of month (same structure as quarters but with months as columns)
        return {
          extractX: (date: Date) => {
            const year = date.getFullYear()
            const month = date.getMonth() + 1
            return year * 100 + month // e.g., 202401, 202402, etc.
          },
          extractY: (date: Date) => getWeekOfMonth(date) - 1, // 0-5 for indexing
          xLabels: [], // Will be determined from data
          yLabels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'],
          xFormat: (value: number) => {
            const month = value % 100
            const monthNames = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
            return monthNames[month - 1] || ''
          },
          yFormat: (value: number) => ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'][value] || '',
          cellWidth: 16,
          cellHeight: 16,
          hasHierarchicalLabels: true, // Add hierarchical labels like month view
          getYearFromX: (value: number) => Math.floor(value / 100) // Helper to get year for grouping
        }
      
      case 'day':
        // Day granularity: weeks × days of week with hierarchical year/week labels
        return {
          extractX: (date: Date) => {
            const { year, week } = getWeekOfYear(date)
            return year * 100 + week // e.g., 202401, 202402, etc.
          },
          extractY: (date: Date) => date.getDay(), // 0-6 (Sun-Sat)
          xLabels: [], // Will be determined from data
          yLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          xFormat: (value: number) => {
            const week = value % 100
            return `${week}`
          },
          yFormat: (value: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][value] || '',
          cellWidth: 16,
          cellHeight: 16,
          hasHierarchicalLabels: true, // Add hierarchical labels
          getYearFromX: (value: number) => Math.floor(value / 100) // Helper to get year for grouping
        }

      case 'hour':
        // Hour granularity: days × 3-hour blocks with hierarchical year/month labels
        return {
          extractX: (date: Date) => {
            // Get day as YYYYMMDD number for unique day identification
            const year = date.getFullYear()
            const month = date.getMonth() + 1
            const day = date.getDate()
            return year * 10000 + month * 100 + day // e.g., 20240115
          },
          extractY: (date: Date) => Math.floor(date.getHours() / 3), // 0-7 for 8 three-hour blocks
          xLabels: [], // Will be determined from data
          yLabels: ['00-03', '03-06', '06-09', '09-12', '12-15', '15-18', '18-21', '21-00'],
          xFormat: (value: number) => {
            // Format YYYYMMDD as just the day number
            const day = value % 100
            return `${day}`
          },
          yFormat: (value: number) => ['00-03', '03-06', '06-09', '09-12', '12-15', '15-18', '18-21', '21-00'][value] || '',
          cellWidth: 16,
          cellHeight: 16,
          hasHierarchicalLabels: true, // Show year/month grouping above
          getYearFromX: (value: number) => Math.floor(value / 100) // Extract YYYYMM for month grouping
        }

      default:
        return null
    }
  }

  // Helper function to get week of year with correct year (1-53)
  const getWeekOfYear = (date: Date): { year: number, week: number } => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const year = d.getUTCFullYear()
    const yearStart = new Date(Date.UTC(year, 0, 1))
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
    return { year, week }
  }

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current || !dimensionsReady || dimensions.width === 0) {
      return
    }

    // Clear previous chart
    select(svgRef.current).selectAll('*').remove()

    // Validate chartConfig
    if (!chartConfig?.dateField || !chartConfig?.valueField) {
      return
    }

    const dateField = Array.isArray(chartConfig.dateField) ? chartConfig.dateField[0] : chartConfig.dateField
    const valueField = Array.isArray(chartConfig.valueField) ? chartConfig.valueField[0] : chartConfig.valueField


    if (!dateField || !valueField) {
      return
    }

    // Get granularity directly from the query's time dimensions
    const getQueryGranularity = () => {
      if (!queryObject?.timeDimensions || queryObject.timeDimensions.length === 0) {
        return 'day'
      }
      
      // Find the time dimension that matches our dateField
      const timeDim = queryObject.timeDimensions.find((td: any) => 
        td.dimension === dateField || td.dimension.includes(dateField)
      )
      
      if (timeDim && timeDim.granularity) {
        return timeDim.granularity
      }
      
      // Fallback to first time dimension's granularity
      const firstTimeDim = queryObject.timeDimensions[0]
      if (firstTimeDim && firstTimeDim.granularity) {
        return firstTimeDim.granularity
      }
      
      return 'day'
    }
    
    const queryGranularity = getQueryGranularity()
    const gridMapping = getGridMapping(queryGranularity)
    
    // Handle unsupported granularity
    if (!gridMapping) {
      return
    }
    

    // Transform data for grid
    const gridData: GridCell[] = data.map(item => {
      const dateValue = item[dateField]
      const value = typeof item[valueField] === 'string' 
        ? parseFloat(item[valueField]) 
        : (item[valueField] || 0)
      
      // Parse the date
      let date: Date
      if (typeof dateValue === 'string') {
        // Handle different date formats
        let isoStr = dateValue
        if (dateValue.includes(' ')) {
          isoStr = dateValue.replace(' ', 'T').replace('+00', 'Z').replace(/\+\d{2}:\d{2}$/, 'Z')
        }
        if (!isoStr.endsWith('Z') && !isoStr.includes('+')) {
          isoStr = isoStr + 'Z'
        }
        date = new Date(isoStr)
      } else {
        date = new Date(dateValue)
      }

      // Skip invalid dates
      if (isNaN(date.getTime())) {
        return null
      }

      const x = gridMapping.extractX(date)
      const y = gridMapping.extractY(date)
      
      return {
        x,
        y,
        value,
        date,
        label: formatTimeValue(dateValue, queryGranularity)
      }
    }).filter((cell): cell is GridCell => cell !== null)


    if (gridData.length === 0) return

    // Calculate grid dimensions
    const maxY = max(gridData, d => d.y) || 0
    const minY = min(gridData, d => d.y) || 0


    // Generate complete X range first so we can calculate proper grid width
    const getCompleteXRange = (): number[] => {
      const dataXValues = [...new Set(gridData.map(cell => cell.x))].sort()
      
      if (queryGranularity === 'quarter') {
        // For quarters: only show quarters that have data to avoid gaps
        return dataXValues
      }
      
      if (queryGranularity === 'month') {
        // For months: only show quarters that have data to avoid gaps
        return dataXValues
      }
      
      if (queryGranularity === 'week') {
        // For weeks: only show months that have data to avoid gaps
        return dataXValues
      }
      
      if (queryGranularity === 'day') {
        // For days: only show the actual weeks that have data to avoid discontinuities
        return dataXValues
      }
      
      // For other granularities, use the actual data values
      return dataXValues
    }
    
    const completeXRange = getCompleteXRange()
    
    // Calculate grid dimensions based on complete X range
    const gridWidth = completeXRange.length * gridMapping.cellWidth + (completeXRange.length - 1) * 4
    const gridHeight = (maxY - minY + 1) * gridMapping.cellHeight + (maxY - minY) * 4

    const margin = { 
      ...CHART_MARGINS, 
      left: 60,  // Space for Y-axis labels
      bottom: 10, // Reduced since labels are at top
      top: gridMapping.hasHierarchicalLabels ? 40 : 25, // Extra space for hierarchical labels
      right: 10
    }
    
    const availableWidth = dimensions.width - margin.left - margin.right
    const availableHeight = dimensions.height - margin.top - margin.bottom

    // Scale the grid to fit the available space, but ensure minimum cell size
    // Same minimum sizes for all granularities for consistency
    const getMinCellSize = () => {
      return { width: 16, height: 16 } // Same size for all views
    }
    
    const minCellSize = getMinCellSize()
    const maxCellSize = 24
    
    const scaleX = availableWidth / gridWidth
    const scaleY = availableHeight / gridHeight
    const scale = Math.min(scaleX, scaleY)

    // Calculate final cell size with constraints
    let finalCellWidth = Math.max(minCellSize.width, Math.min(maxCellSize, gridMapping.cellWidth * scale))
    let finalCellHeight = Math.max(minCellSize.height, Math.min(maxCellSize, gridMapping.cellHeight * scale))
    
    // For week view, prefer scrolling over tiny cells
    if (queryGranularity === 'week' && finalCellWidth < minCellSize.width) {
      finalCellWidth = minCellSize.width
    }
    
    // Calculate actual grid dimensions with the final cell sizes
    const actualGridWidth = completeXRange.length * finalCellWidth + (completeXRange.length - 1) * 4
    
    // Determine if we need horizontal scrolling
    const needsHorizontalScroll = actualGridWidth > availableWidth
    const svgWidth = needsHorizontalScroll ? actualGridWidth + margin.left + margin.right : dimensions.width
    

    const svg = select(svgRef.current)
      .attr('width', svgWidth)
      .attr('height', dimensions.height)

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Set up color scale
    const values = gridData.map(d => d.value)
    const minValue = min(values) || 0
    const maxValue = max(values) || 1

    const colorScale = scaleQuantize<string>()
      .domain([minValue, maxValue])
      .range(colorPalette?.gradient || CHART_COLORS_GRADIENT)

    // Create grid data map for quick lookup
    const gridMap = new Map<string, GridCell>()
    gridData.forEach(cell => {
      const key = `${cell.x}-${cell.y}`
      gridMap.set(key, cell)
    })

    // Get theme colors from CSS variables
    const getThemeColor = (varName: string, fallback: string) => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
      return value || fallback
    }

    const isDark = currentTheme !== 'light'
    const textColor = isDark
      ? getThemeColor('--dc-text-muted', '#cbd5e1')  // Lighter text for dark mode
      : getThemeColor('--dc-text-secondary', '#374151')  // Darker text for light mode
    const lineColor = getThemeColor('--dc-border', '#e5e7eb')
    // Use theme-aware colors for empty cells: light gray in light mode, slightly lighter than bg in dark mode
    const emptyCellColor = isDark
      ? getThemeColor('--dc-bg-secondary', '#1e293b')  // Slightly lighter than dark background
      : getThemeColor('--dc-bg-secondary', '#f3f4f6')  // Very light gray in light mode
    const cellStrokeColor = isDark
      ? getThemeColor('--dc-border', '#334155')  // Subtle border in dark mode
      : getThemeColor('--dc-bg', '#ffffff')  // White border in light mode

    // Create tooltip
    const tooltip = select('body').append('div')
      .attr('class', 'activity-grid-tooltip')
      .style('position', 'absolute')
      .style('padding', '8px')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000)

    // Create a mapping from X values to their position indices for proper spacing
    const xValueToIndex = new Map<number, number>()
    completeXRange.forEach((x, index) => {
      xValueToIndex.set(x, index)
    })
    
    // Render grid cells for the complete X range
    for (const x of completeXRange) {
      for (let y = minY; y <= maxY; y++) {
        const key = `${x}-${y}`
        const cell = gridMap.get(key)
        const xIndex = xValueToIndex.get(x) || 0
        
        const rect = g.append('rect')
          .attr('x', xIndex * (finalCellWidth + 4))
          .attr('y', (y - minY) * (finalCellHeight + 4))
          .attr('width', finalCellWidth)
          .attr('height', finalCellHeight)
          .attr('rx', 2)
          .attr('ry', 2)
          .style('fill', cell ? colorScale(cell.value) : emptyCellColor)
          .style('stroke', cellStrokeColor)
          .style('stroke-width', 1)

        // Add hover effects and tooltips
        if (safeDisplayConfig.showTooltip) {
          rect
            .style('cursor', 'pointer')
            .on('mouseover', function(event) {
              select(this)
                .style('stroke', '#000')
                .style('stroke-width', 2)

              if (cell) {
                const tooltipContent = [
                  `<strong>${cell.label}</strong>`,
                  `${getFieldLabel(valueField)}: ${cell.value}`
                ].join('<br>')

                tooltip
                  .html(tooltipContent)
                  .style('left', (event.pageX + 10) + 'px')
                  .style('top', (event.pageY - 10) + 'px')
                  .transition()
                  .duration(200)
                  .style('opacity', 1)
              }
            })
            .on('mousemove', function(event) {
              tooltip
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px')
            })
            .on('mouseout', function() {
              select(this)
                .style('stroke', cellStrokeColor)
                .style('stroke-width', 1)

              tooltip
                .transition()
                .duration(200)
                .style('opacity', 0)
            })
        }
      }
    }

    // Add axis labels if enabled
    if (safeDisplayConfig.showLabels) {
      if (gridMapping.hasHierarchicalLabels && gridMapping.getYearFromX) {
        // Special handling for quarter view with hierarchical labels
        // Use the complete X range to show all quarters/months
        
        // Group quarters by year
        const yearGroups = new Map<number, number[]>()
        for (const x of completeXRange) {
          const year = gridMapping.getYearFromX(x)
          if (!yearGroups.has(year)) {
            yearGroups.set(year, [])
          }
          yearGroups.get(year)!.push(x)
        }
        
        
        // Draw column labels (Q1-Q4 for months, Jan-Dec for weeks)
        for (const x of completeXRange) {
          const xIndex = xValueToIndex.get(x) || 0
          g.append('text')
            .attr('x', xIndex * (finalCellWidth + 4) + finalCellWidth / 2)
            .attr('y', -8)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', textColor)
            .text(gridMapping.xFormat(x))
        }

        // Draw year group labels above quarters
        for (const [year, xValues] of yearGroups) {
          if (xValues.length > 0) {
            // Get the index positions for proper spacing
            const startIndex = Math.min(...xValues.map(x => xValueToIndex.get(x) || 0))
            const endIndex = Math.max(...xValues.map(x => xValueToIndex.get(x) || 0))
            const centerIndex = (startIndex + endIndex) / 2

            // Year label (or year/month for hour granularity)
            let labelText = ''
            if (year > 9999) {
              // For hour granularity, year is encoded as YYYYMM
              const actualYear = Math.floor(year / 100)
              const month = year % 100
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
              labelText = `${monthNames[month - 1]} '${actualYear.toString().slice(-2)}`
            } else {
              // For other granularities, just show the year
              labelText = `'${year.toString().slice(-2)}`
            }

            g.append('text')
              .attr('x', centerIndex * (finalCellWidth + 4) + finalCellWidth / 2)
              .attr('y', -25)
              .attr('text-anchor', 'middle')
              .style('font-size', '12px')
              .style('font-weight', 'bold')
              .style('fill', textColor)
              .text(labelText)

            // Optional: Add a subtle line to group quarters under the year
            if (xValues.length > 1) {
              g.append('line')
                .attr('x1', startIndex * (finalCellWidth + 4))
                .attr('x2', endIndex * (finalCellWidth + 4) + finalCellWidth)
                .attr('y1', -20)
                .attr('y2', -20)
                .style('stroke', lineColor)
                .style('stroke-width', 1)
                .style('opacity', 0.3)
            }
          }
        }
      } else {
        // Regular X-axis labels for other granularities
        const xLabelStep = Math.max(1, Math.floor(completeXRange.length / 10))
        for (let i = 0; i < completeXRange.length; i += xLabelStep) {
          const x = completeXRange[i]
          g.append('text')
            .attr('x', i * (finalCellWidth + 4) + finalCellWidth / 2)
            .attr('y', -8)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', textColor)
            .text(gridMapping.xFormat(x))
        }
      }

      // Y-axis labels (left) - same for all granularities
      for (let y = minY; y <= maxY; y++) {
        g.append('text')
          .attr('x', -8)
          .attr('y', (y - minY) * (finalCellHeight + 4) + finalCellHeight / 2)
          .attr('text-anchor', 'end')
          .attr('dy', '.35em')
          .style('font-size', '10px')
          .style('fill', textColor)
          .text(gridMapping.yFormat(y))
      }
    }

    // Cleanup function
    return () => {
      tooltip.remove()
    }
  }, [data, chartConfig, displayConfig, queryObject, dimensions, dimensionsReady, safeDisplayConfig.showTooltip, safeDisplayConfig.showLabels, colorPalette, currentTheme])

  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-full"
        style={{
          height,
          backgroundColor: 'var(--dc-warning-bg)',
          color: 'var(--dc-warning)',
          borderColor: 'var(--dc-warning-border)'
        }}
      >
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">No data available</div>
          <div className="text-xs">No data points to display in activity grid</div>
        </div>
      </div>
    )
  }

  // Validate that we have required fields
  const hasValidConfig = chartConfig?.dateField && chartConfig?.valueField
  if (!hasValidConfig) {
    return (
      <div
        className="flex items-center justify-center w-full"
        style={{
          height,
          backgroundColor: 'var(--dc-warning-bg)',
          color: 'var(--dc-warning)',
          borderColor: 'var(--dc-warning-border)'
        }}
      >
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Configuration Required</div>
          <div className="text-xs">Activity grid requires a time dimension and a measure</div>
        </div>
      </div>
    )
  }

  // Check if granularity is supported
  const dateField = Array.isArray(chartConfig.dateField) ? chartConfig.dateField[0] : chartConfig.dateField
  const granularityFromQuery = queryObject?.timeDimensions?.find((td: any) => 
    td.dimension === dateField || td.dimension.includes(dateField)
  )?.granularity || 'day'
  
  if (granularityFromQuery?.toLowerCase() === 'year') {
    return (
      <div
        className="flex items-center justify-center w-full"
        style={{
          height,
          backgroundColor: 'var(--dc-warning-bg)',
          color: 'var(--dc-warning)',
          borderColor: 'var(--dc-warning-border)'
        }}
      >
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Granularity Too High</div>
          <div className="text-xs">Activity grids work best with hour, day, week, month, or quarter granularity</div>
          <div className="text-xs mt-1">Please choose a lower granularity for your time dimension</div>
        </div>
      </div>
    )
  }

  return (
    <ChartContainer height={height}>
      <div ref={containerRef} className="w-full h-full relative overflow-x-auto">
        <svg ref={svgRef} className="h-full" />
        {!dimensionsReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-dc-text-muted text-sm">Measuring chart dimensions...</div>
          </div>
        )}
      </div>
    </ChartContainer>
  )
}