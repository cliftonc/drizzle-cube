import { useState, useRef, useEffect } from 'react'
import { useCubeContext } from '../../providers/CubeProvider'
import type { ChartProps } from '../../types'

export default function KpiNumber({ 
  data, 
  chartConfig, 
  displayConfig = {},
  height = "100%" 
}: ChartProps) {
  const [fontSize, setFontSize] = useState(32)
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
          // For KPI displays, we want the text to be large and prominent
          // Reserve space for the label by using more conservative sizing
          const widthBasedSize = containerWidth / 5
          const heightBasedSize = containerHeight / 4  // More conservative to leave room for label
          const baseFontSize = Math.min(widthBasedSize, heightBasedSize)
          const clampedFontSize = Math.max(24, Math.min(baseFontSize, 120)) // Lower max to ensure label fits
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
  
  console.log('KPI Number yAxis handling:', {
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
  console.log('KPI Number Debug:', {
    data,
    chartConfig,
    valueFields,
    valueField,
    dataKeys: data.length > 0 ? Object.keys(data[0]) : []
  })
  
  // Extract values for the selected field
  const rawValues = data.map(row => {
    // Try direct field access first
    if (row[valueField] !== undefined) {
      return row[valueField]
    }
    
    // If not found, try finding the first numeric field as fallback
    const numericFields = Object.keys(row).filter(key => 
      typeof row[key] === 'number' && !isNaN(row[key])
    )
    
    if (numericFields.length > 0) {
      console.warn(`KPI Number: Field '${valueField}' not found, using fallback field '${numericFields[0]}'`)
      return row[numericFields[0]]
    }
    
    return undefined
  })
  console.log('Raw values extracted:', rawValues)
  
  const values = rawValues
    .filter(val => {
      const isValid = val !== null && val !== undefined && !isNaN(Number(val))
      console.log(`Value ${val} is valid: ${isValid}`)
      return isValid
    })
    .map(val => Number(val))
  
  console.log('Final processed values:', values)

  if (values.length === 0) {
    const dataKeys = data.length > 0 ? Object.keys(data[0]).join(', ') : 'none'
    return (
      <div 
        className="flex items-center justify-center w-full h-full text-red-500"
        style={{ 
          height: height === "100%" ? "100%" : height,
          minHeight: height === "100%" ? '200px' : undefined
        }}
      >
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">No valid data</div>
          <div className="text-xs mb-1">Looking for field: {valueField}</div>
          <div className="text-xs">Available fields: {dataKeys}</div>
          <div className="text-xs mt-1">Raw values: {JSON.stringify(rawValues.slice(0, 3))}</div>
        </div>
      </div>
    )
  }

  // Calculate statistics
  const sum = values.reduce((acc, val) => acc + val, 0)
  const avg = sum / values.length
  const min = Math.min(...values)
  const max = Math.max(...values)

  // Format number with appropriate units and decimals
  const formatNumber = (value: number): string => {
    const decimals = displayConfig.decimals ?? 0
    const prefix = displayConfig.prefix ?? ''
    const suffix = displayConfig.suffix ?? ''
    
    let formattedValue: string
    
    if (Math.abs(value) >= 1e9) {
      formattedValue = (value / 1e9).toFixed(decimals) + 'B'
    } else if (Math.abs(value) >= 1e6) {
      formattedValue = (value / 1e6).toFixed(decimals) + 'M'
    } else if (Math.abs(value) >= 1e3) {
      formattedValue = (value / 1e3).toFixed(decimals) + 'K'
    } else {
      formattedValue = value.toFixed(decimals)
    }
    
    return prefix + formattedValue + suffix
  }

  const mainValue = values.length === 1 ? values[0] : avg
  const showStats = values.length > 1

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center w-full h-full p-2"
      style={{ 
        height: height === "100%" ? "100%" : height,
        minHeight: height === "100%" ? '200px' : undefined
      }}
    >
        {/* Main KPI Value */}
        <div 
          className="font-bold text-gray-800 leading-none mb-1"
          style={{ 
            fontSize: `${fontSize}px`,
            color: displayConfig.colors?.[0] || '#1f2937' 
          }}
        >
          {formatNumber(mainValue)}
        </div>

        {/* Field Label */}
        <div 
          className="text-gray-600 font-medium text-center mb-2"
          style={{ 
            fontSize: `${Math.max(14, fontSize * 0.35)}px`,
            lineHeight: '1.2'
          }}
        >
          {(() => {
            const label = getFieldLabel(valueField)
            console.log('Field label debug:', {
              valueField,
              label,
              labelType: typeof label,
              labelLength: label?.length,
              labelAsString: String(label),
              directFieldName: valueField
            })
            // Temporary fix: if label seems wrong, use the field name directly
            const displayLabel = (label && label.length > 1) ? label : valueField
            return displayLabel
          })()}
        </div>

        {/* Statistics for multiple values */}
        {showStats && (
          <div className="flex gap-4 text-gray-500">
            <div 
              className="text-center"
              style={{ fontSize: `${Math.max(12, fontSize * 0.25)}px` }}
            >
              <div className="font-medium">Min</div>
              <div>{formatNumber(min)}</div>
            </div>
            <div 
              className="text-center"
              style={{ fontSize: `${Math.max(12, fontSize * 0.25)}px` }}
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
            style={{ fontSize: `${Math.max(10, fontSize * 0.2)}px` }}
          >
            Average of {values.length} values
          </div>
        )}
    </div>
  )
}