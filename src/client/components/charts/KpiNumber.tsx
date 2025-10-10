import { useState, useRef, useEffect } from 'react'
import { useCubeContext } from '../../providers/CubeProvider'
import DataHistogram from '../DataHistogram'
import { parseTargetValues, calculateVariance, formatVariance } from '../../utils/targetUtils'
import type { ChartProps } from '../../types'

export default function KpiNumber({ 
  data, 
  chartConfig, 
  displayConfig = {},
  height = "100%",
  colorPalette
}: ChartProps) {
  const [fontSize, setFontSize] = useState(32)
  const [textWidth, setTextWidth] = useState(250)
  const containerRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef<HTMLDivElement>(null)
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
          // For KPI displays, we want the text to be large and prominent
          // Reserve space for the label by using more conservative sizing
          const widthBasedSize = containerWidth / 5
          const heightBasedSize = containerHeight / 4  // More conservative to leave room for label
          const baseFontSize = Math.min(widthBasedSize, heightBasedSize)
          const clampedFontSize = Math.max(24, Math.min(baseFontSize, 120)) // Lower max to ensure label fits
          setFontSize(clampedFontSize)
          
          // Use a timeout to measure text width after font size is applied
          setTimeout(() => {
            if (valueRef.current) {
              const textRect = valueRef.current.getBoundingClientRect()
              const measuredWidth = textRect.width
              // Ensure we have a minimum width and use container width as fallback
              const effectiveWidth = Math.max(measuredWidth, Math.min(containerWidth * 0.6, 300))
              setTextWidth(effectiveWidth)
            }
          }, 10)
        }
      }
    }

    // Initial calculation - reduce delay for faster initial render
    const timer = setTimeout(updateDimensions, 50)
    
    const resizeObserver = new ResizeObserver(() => {
      // Debounce the resize updates
      setTimeout(updateDimensions, 10)
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
          minHeight: height === "100%" ? '200px' : undefined,
          backgroundColor: 'var(--dc-warning-bg)',
          color: 'var(--dc-warning)',
          borderColor: 'var(--dc-warning-border)'
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
      return row[numericFields[0]]
    }
    
    return undefined
  })
  
  const values = rawValues
    .filter(val => val !== null && val !== undefined && !isNaN(Number(val)))
    .map(val => Number(val))
  

  if (values.length === 0) {
    const dataKeys = data.length > 0 ? Object.keys(data[0]).join(', ') : 'none'
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

  // Format number with appropriate units and decimals (no prefix/suffix here, handled separately)
  const formatNumber = (value: number): string => {
    const decimals = displayConfig.decimals ?? 0
    const prefix = displayConfig.prefix ?? ''
    
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
    
    return prefix + formattedValue
  }

  const mainValue = values.length === 1 ? values[0] : avg
  const showStats = values.length > 1

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
  
  // Process target values for variance calculation
  const targetValues = parseTargetValues(displayConfig?.target || '')
  const targetValue = targetValues.length > 0 ? targetValues[0] : null // Use first target value
  const variance = targetValue !== null ? calculateVariance(mainValue, targetValue) : null
  
  // Get colors for variance display (similar to KpiDelta)
  const getVarianceColor = (): string => {
    if (variance === null) return '#6B7280' // Gray for no target
    
    if (variance >= 0) {
      // Positive variance - use positive color from palette
      const positiveIndex = displayConfig.positiveColorIndex ?? 1
      return colorPalette?.colors?.[positiveIndex] || '#10B981' // Green fallback
    } else {
      // Negative variance - use negative color from palette  
      const negativeIndex = displayConfig.negativeColorIndex ?? 7
      return colorPalette?.colors?.[negativeIndex] || '#EF4444' // Red fallback
    }
  }

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center w-full h-full p-4"
      style={{ 
        height: height === "100%" ? "100%" : height,
        minHeight: height === "100%" ? '200px' : undefined
      }}
    >
        {/* Field Label - Bolder and bigger */}
        <div
          className="text-dc-text-secondary font-bold text-center mb-3"
          style={{
            fontSize: '14px',
            lineHeight: '1.2'
          }}
        >
          {(() => {
            const label = getFieldLabel(valueField)
            // Temporary fix: if label seems wrong, use the field name directly
            const displayLabel = (label && label.length > 1) ? label : valueField
            return displayLabel
          })()}
        </div>

        {/* Main KPI Value and Variance - Horizontal layout */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <div 
            ref={valueRef}
            className="font-bold leading-none"
            style={{ 
              fontSize: `${fontSize}px`,
              color: valueColor
            }}
          >
            {formatNumber(mainValue)}
          </div>
          
          {/* Target Variance Display - To the right of main value */}
          {targetValue !== null && variance !== null && (
            <div className="flex flex-col items-start">
              <div 
                className="font-semibold"
                style={{ 
                  fontSize: `${Math.max(12, fontSize * 0.3)}px`,
                  color: getVarianceColor(),
                  lineHeight: '1.2'
                }}
              >
                {formatVariance(variance, 1)}
              </div>
              <div
                className="text-dc-text-muted text-xs"
                style={{
                  opacity: 0.7,
                  fontSize: `${Math.max(10, fontSize * 0.2)}px`
                }}
              >
                vs {formatNumber(targetValue)}
              </div>
            </div>
          )}
        </div>

        {/* Unit/Suffix - Larger, not bold */}
        {displayConfig.suffix && (
          <div
            className="text-dc-text-muted text-center"
            style={{
              fontSize: '14px',
              lineHeight: '1.2',
              opacity: 0.8
            }}
          >
            {displayConfig.suffix}
          </div>
        )}

        {/* Data Histogram for multiple values */}
        {showStats && (
          <div className="mt-4">
            <DataHistogram
              values={values}
              min={min}
              max={max}
              color={valueColor}
              formatValue={formatNumber}
              height={24}
              width={textWidth}
              targetValue={targetValue || undefined}
            />
          </div>
        )}
    </div>
  )
}