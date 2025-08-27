import { useState, useRef, useEffect } from 'react'
import { useCubeContext } from '../../providers/CubeProvider'
import type { ChartProps } from '../../types'

export default function KpiText({ 
  data, 
  chartConfig, 
  displayConfig = {},
  height = "100%" 
}: ChartProps) {
  const [fontSize, setFontSize] = useState(28)
  const containerRef = useRef<HTMLDivElement>(null)
  const { getFieldLabel } = useCubeContext()

  // Calculate font size based on container dimensions
  useEffect(() => {
    const updateFontSize = () => {
      if (containerRef.current) {
        const container = containerRef.current
        const rect = container.getBoundingClientRect()
        const containerWidth = rect.width
        const containerHeight = rect.height
        
        if (containerWidth > 0 && containerHeight > 0) {
          // Calculate font size based on container dimensions
          // For KPI Text displays, text might be longer so use more conservative sizing
          // Also reserve space for potential statistics display
          const widthBasedSize = containerWidth / 8
          const heightBasedSize = containerHeight / 5
          const baseFontSize = Math.min(widthBasedSize, heightBasedSize)
          const clampedFontSize = Math.max(18, Math.min(baseFontSize, 80))
          setFontSize(clampedFontSize)
        }
      }
    }

    // Initial calculation after a short delay to ensure the container is fully rendered
    const timer = setTimeout(updateFontSize, 100)
    
    const resizeObserver = new ResizeObserver(() => {
      // Debounce the resize updates
      clearTimeout(timer)
      setTimeout(updateFontSize, 50)
    })
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      clearTimeout(timer)
      resizeObserver.disconnect()
    }
  }, [data, chartConfig])

  if (!data || data.length === 0) {
    return (
      <div 
        className="flex items-center justify-center w-full h-full text-gray-500"
        style={{ 
          height: height === "100%" ? "100%" : height,
          minHeight: height === "100%" ? '200px' : undefined
        }}
      >
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">No data available</div>
          <div className="text-xs">No data points to display</div>
        </div>
      </div>
    )
  }

  // Extract value field from chart config - handle both string and array formats
  let valueFields: string[] = []
  if (chartConfig?.yAxis) {
    // Handle both string and array formats
    if (typeof chartConfig.yAxis === 'string') {
      valueFields = [chartConfig.yAxis]
    } else if (Array.isArray(chartConfig.yAxis)) {
      valueFields = chartConfig.yAxis
    }
  }
  
  console.log('KPI Text yAxis handling:', {
    originalYAxis: chartConfig?.yAxis,
    processedValueFields: valueFields,
    yAxisType: typeof chartConfig?.yAxis
  })
  
  if (valueFields.length === 0) {
    return (
      <div 
        className="flex items-center justify-center w-full h-full text-red-500"
        style={{ 
          height: height === "100%" ? "100%" : height,
          minHeight: height === "100%" ? '200px' : undefined
        }}
      >
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Configuration Error</div>
          <div className="text-xs">No measure fields configured</div>
        </div>
      </div>
    )
  }

  const valueField = valueFields[0] // Use first measure field
  
  // Debug logging (remove in production)
  console.log('KPI Text Debug:', {
    data,
    chartConfig,
    valueFields,
    valueField,
    dataKeys: data.length > 0 ? Object.keys(data[0]) : []
  })
  
  // Extract values for the selected field
  const values = data
    .map(row => {
      // Try direct field access first
      if (row[valueField] !== undefined) {
        return row[valueField]
      }
      
      // If not found, try finding the first available field as fallback
      const availableFields = Object.keys(row)
      if (availableFields.length > 0) {
        console.warn(`KPI Text: Field '${valueField}' not found, using fallback field '${availableFields[0]}'`)
        return row[availableFields[0]]
      }
      
      return undefined
    })
    .filter(val => val !== null && val !== undefined)
  
  console.log('KPI Text extracted values:', values)

  if (values.length === 0) {
    return (
      <div 
        className="flex items-center justify-center w-full h-full text-gray-500"
        style={{ 
          height: height === "100%" ? "100%" : height,
          minHeight: height === "100%" ? '200px' : undefined
        }}
      >
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">No valid data</div>
          <div className="text-xs">All values are null or invalid</div>
        </div>
      </div>
    )
  }

  // Calculate statistics for numeric values
  const numericValues = values
    .map(val => Number(val))
    .filter(val => !isNaN(val))

  let mainValue: any
  let min: number | null = null
  let max: number | null = null
  let showStats = false

  if (numericValues.length > 0) {
    if (values.length === 1) {
      mainValue = values[0]
    } else {
      // Calculate average for multiple numeric values
      const sum = numericValues.reduce((acc, val) => acc + val, 0)
      const avg = sum / numericValues.length
      mainValue = avg
      min = Math.min(...numericValues)
      max = Math.max(...numericValues)
      showStats = true
    }
  } else {
    // Non-numeric values - just use the first one or concatenate if multiple
    mainValue = values.length === 1 ? values[0] : values.join(', ')
  }

  // Format number with appropriate units and decimals
  const formatNumber = (value: number): string => {
    const decimals = displayConfig.decimals ?? 2
    
    if (Math.abs(value) >= 1e9) {
      return (value / 1e9).toFixed(decimals) + 'B'
    } else if (Math.abs(value) >= 1e6) {
      return (value / 1e6).toFixed(decimals) + 'M'
    } else if (Math.abs(value) >= 1e3) {
      return (value / 1e3).toFixed(decimals) + 'K'
    } else {
      return value.toFixed(decimals)
    }
  }

  // Process template string
  const processTemplate = (template: string, value: any): string => {
    try {
      // Create template variables
      const templateVars = {
        value: typeof value === 'number' ? formatNumber(value) : String(value),
        rawValue: value,
        field: valueField,
        fieldLabel: getFieldLabel(valueField),
        min: min !== null ? formatNumber(min) : '',
        max: max !== null ? formatNumber(max) : '',
        count: values.length
      }

      // Simple template replacement using ${variable} syntax
      return template.replace(/\$\{(\w+)\}/g, (match, varName) => {
        if (varName in templateVars) {
          return String(templateVars[varName as keyof typeof templateVars])
        }
        return match
      })
    } catch (error) {
      console.error('Error processing template:', error)
      return String(value)
    }
  }

  const template = displayConfig.template || '${fieldLabel}: ${value}'
  const displayText = processTemplate(template, mainValue)

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center w-full h-full p-2"
      style={{ 
        height: height === "100%" ? "100%" : height,
        minHeight: height === "100%" ? '200px' : undefined
      }}
    >
        {/* Main KPI Text */}
        <div 
          className="font-bold text-gray-800 leading-tight text-center mb-2"
          style={{ 
            fontSize: `${fontSize}px`,
            color: displayConfig.colors?.[0] || '#1f2937' 
          }}
        >
          {displayText}
        </div>

        {/* Statistics for multiple numeric values */}
        {showStats && min !== null && max !== null && (
          <div className="flex gap-4 text-gray-500">
            <div 
              className="text-center"
              style={{ fontSize: `${fontSize * 0.25}px` }}
            >
              <div className="font-medium">Min</div>
              <div>{formatNumber(min)}</div>
            </div>
            <div 
              className="text-center"
              style={{ fontSize: `${fontSize * 0.25}px` }}
            >
              <div className="font-medium">Max</div>
              <div>{formatNumber(max)}</div>
            </div>
          </div>
        )}

        {/* Average indicator when showing stats */}
        {showStats && (
          <div 
            className="text-gray-400 mt-1"
            style={{ fontSize: `${fontSize * 0.2}px` }}
          >
            Average of {values.length} values
          </div>
        )}
    </div>
  )
}