import { useState, useRef, useEffect } from 'react'
import { useCubeContext } from '../../providers/CubeProvider'
import DataHistogram from '../DataHistogram'
import type { ChartProps } from '../../types'

export default function KpiText({ 
  data, 
  chartConfig, 
  displayConfig = {},
  height = "100%",
  colorPalette
}: ChartProps) {
  const [fontSize, setFontSize] = useState(28)
  const [textWidth, setTextWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const { getFieldLabel } = useCubeContext()

  // Calculate font size and text width based on container dimensions
  useEffect(() => {
    const updateDimensions = () => {
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
      
      // Measure the text width after font size is set
      if (textRef.current) {
        const textRect = textRef.current.getBoundingClientRect()
        setTextWidth(textRect.width)
      }
    }

    // Initial calculation after a short delay to ensure the container is fully rendered
    const timer = setTimeout(updateDimensions, 100)
    
    const resizeObserver = new ResizeObserver(() => {
      // Debounce the resize updates
      clearTimeout(timer)
      setTimeout(updateDimensions, 50)
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
        className="flex items-center justify-center w-full h-full"
        style={{
          height: height === "100%" ? "100%" : height,
          minHeight: height === "100%" ? '200px' : undefined
        }}
      >
        <div className="text-center text-dc-text-muted">
          <div className="text-sm font-semibold mb-1">No data available</div>
          <div className="text-xs text-dc-text-secondary">No data points to display</div>
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
  
  
  if (valueFields.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-full h-full"
        style={{
          height: height === "100%" ? "100%" : height,
          minHeight: height === "100%" ? '200px' : undefined,
          backgroundColor: 'var(--dc-danger-bg)',
          color: 'var(--dc-danger)',
          borderColor: 'var(--dc-danger-border)'
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
        // Field not found, using fallback
        return row[availableFields[0]]
      }
      
      return undefined
    })
    .filter(val => val !== null && val !== undefined)
  

  if (values.length === 0) {
    return (
      <div
        className="flex items-center justify-center w-full h-full"
        style={{
          height: height === "100%" ? "100%" : height,
          minHeight: height === "100%" ? '200px' : undefined,
          backgroundColor: 'var(--dc-warning-bg)',
          color: 'var(--dc-warning)',
          borderColor: 'var(--dc-warning-border)'
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
  const formatNumber = (value: number | null | undefined): string => {
    // If custom formatValue is provided, use it exclusively
    if (displayConfig.formatValue) {
      return displayConfig.formatValue(value)
    }

    // Null handling: Show placeholder for missing data
    if (value === null || value === undefined) {
      return '—'
    }

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
    } catch {
      // Error processing template
      return String(value)
    }
  }

  const template = displayConfig.template || '${fieldLabel}: ${value}'
  const displayText = processTemplate(template, mainValue)

  // Get color from palette by index, default to first color in palette
  const getValueColor = (): string => {
    if (displayConfig.valueColorIndex !== undefined && colorPalette?.colors) {
      const colorIndex = displayConfig.valueColorIndex
      if (colorIndex >= 0 && colorIndex < colorPalette.colors.length) {
        return colorPalette.colors[colorIndex]
      }
    }
    // Default to first color in palette if available, otherwise fallback to dark gray
    return colorPalette?.colors?.[0] || '#1f2937'
  }

  const valueColor = getValueColor()

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center w-full h-full p-4"
      style={{ 
        height: height === "100%" ? "100%" : height,
        minHeight: height === "100%" ? '200px' : undefined
      }}
    >
        {/* Main KPI Text */}
        <div 
          ref={textRef}
          className="font-bold leading-tight text-center"
          style={{ 
            fontSize: `${fontSize}px`,
            color: valueColor 
          }}
        >
          {displayText}
        </div>

        {/* Data Histogram for multiple values */}
        {showStats && min !== null && max !== null && (
          <div className="mt-4">
            <DataHistogram
              values={values}
              min={min}
              max={max}
              color={valueColor}
              formatValue={formatNumber}
              height={24}
              width={textWidth || 200}
            />
          </div>
        )}
    </div>
  )
}