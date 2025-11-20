import { useState, useRef, useEffect } from 'react'
import { useCubeContext } from '../../providers/CubeProvider'
import type { ChartProps } from '../../types'

interface VarianceHistogramProps {
  values: number[]
  lastValue: number
  positiveColor: string
  negativeColor: string
  formatValue: (value: number) => string
  width: number
  height: number
}

function VarianceHistogram({ 
  values, 
  lastValue, 
  positiveColor, 
  negativeColor,
  formatValue,
  width,
  height 
}: VarianceHistogramProps) {
  // Calculate variance percentages from last value for each point
  const variances = values.map(value => {
    if (lastValue === 0) return 0
    return ((value - lastValue) / Math.abs(lastValue)) * 100
  })

  // Find min/max variance for scaling
  const minVariance = Math.min(...variances, 0) // Include 0 as baseline
  const maxVariance = Math.max(...variances, 0) // Include 0 as baseline
  const range = Math.max(Math.abs(minVariance), Math.abs(maxVariance))

  if (range === 0 || variances.length === 0) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-50 rounded-sm border"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <span className="text-xs text-gray-500">No variance data</span>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Histogram bars */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: `${width}px`,
          height: `${height}px`
        }}
      >
        {/* Zero line indicator */}
        <div
          className="absolute"
          style={{
            left: 0,
            right: 0,
            height: '1px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
            backgroundColor: 'var(--dc-border)'
          }}
        />
        
        {/* Variance bars - right to left (recent to old) */}
        {variances.slice().reverse().map((variance, index) => {
          const normalizedHeight = Math.abs(variance) / range
          const barHeight = Math.max(2, normalizedHeight * (height / 2 - 4)) // Leave room for zero line
          const isPositive = variance >= 0
          const color = isPositive ? positiveColor : negativeColor
          const barWidth = Math.max(2, width / variances.length - 1)
          
          return (
            <div
              key={index}
              className="absolute rounded-xs opacity-70"
              style={{
                left: `${(index / variances.length) * 100}%`,
                width: `${barWidth}px`,
                height: `${barHeight}px`,
                backgroundColor: color,
                ...(isPositive 
                  ? { bottom: '50%' }
                  : { top: '50%' }),
                zIndex: 2
              }}
              title={`${formatValue(values[variances.length - 1 - index])}: ${variance.toFixed(1)}% from current`}
            />
          )
        })}
        
        {/* "Now" indicator at the right edge */}
        <div
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            right: '0px',
            width: '2px',
            backgroundColor: '#ef4444',
            opacity: 0.8,
            zIndex: 10
          }}
          title="Current value (Now)"
        >
          {/* Small triangle at top to indicate current time */}
          <div
            className="absolute -top-1"
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
              width: '0',
              height: '0',
              borderLeft: '4px solid transparent',
              borderRight: '4px solid transparent',
              borderTop: '6px solid #ef4444'
            }}
          />
        </div>
      </div>
      
      {/* Variance labels on the right */}
      <div className="flex flex-col justify-between text-xs text-dc-text-muted" style={{ height: `${height}px` }}>
        <span>+{Math.abs(maxVariance).toFixed(0)}%</span>
        <span>-{Math.abs(minVariance).toFixed(0)}%</span>
      </div>
    </div>
  )
}

export default function KpiDelta({ 
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
          const widthBasedSize = containerWidth / 4
          const heightBasedSize = containerHeight / 4 
          const baseFontSize = Math.min(widthBasedSize, heightBasedSize)
          const clampedFontSize = Math.max(28, Math.min(baseFontSize, 140))
          setFontSize(clampedFontSize)
          
          setTimeout(() => {
            if (valueRef.current) {
              const textRect = valueRef.current.getBoundingClientRect()
              const measuredWidth = textRect.width
              const effectiveWidth = Math.max(measuredWidth, Math.min(containerWidth * 0.7, 300))
              setTextWidth(effectiveWidth)
            }
          }, 10)
        }
      }
    }

    const timer = setTimeout(updateDimensions, 50)
    
    const resizeObserver = new ResizeObserver(() => {
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

  // Extract value and dimension fields from chart config
  let valueFields: string[] = []
  let dimensionFields: string[] = []
  
  if (chartConfig?.yAxis) {
    valueFields = Array.isArray(chartConfig.yAxis) ? chartConfig.yAxis : [chartConfig.yAxis]
  }
  
  if (chartConfig?.xAxis) {
    dimensionFields = Array.isArray(chartConfig.xAxis) ? chartConfig.xAxis : [chartConfig.xAxis]
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
          <div className="text-xs">No measure field configured</div>
        </div>
      </div>
    )
  }

  const valueField = valueFields[0]
  const dimensionField = dimensionFields[0] // Optional

  // Sort data by dimension if available (for time series)
  let sortedData = [...data]
  if (dimensionField) {
    sortedData = sortedData.sort((a, b) => {
      const aVal = a[dimensionField]
      const bVal = b[dimensionField]
      if (aVal < bVal) return -1
      if (aVal > bVal) return 1
      return 0
    })
  }

  // Extract values
  const values = sortedData
    .map(row => row[valueField])
    .filter(val => val !== null && val !== undefined && !isNaN(Number(val)))
    .map(val => Number(val))

  if (values.length < 2) {
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
          <div className="text-sm font-semibold mb-1">Insufficient Data</div>
          <div className="text-xs">Delta calculation requires at least 2 data points</div>
          <div className="text-xs">Current data points: {values.length}</div>
        </div>
      </div>
    )
  }

  // Calculate delta between last and second-last values
  const lastValue = values[values.length - 1]
  const secondLastValue = values[values.length - 2]
  const absoluteChange = lastValue - secondLastValue
  const percentageChange = secondLastValue !== 0 
    ? ((absoluteChange / Math.abs(secondLastValue)) * 100)
    : 0

  const isPositiveChange = absoluteChange >= 0

  // Format number with appropriate units and decimals
  const formatNumber = (value: number | null | undefined): string => {
    // If custom formatValue is provided, use it exclusively
    if (displayConfig.formatValue) {
      return displayConfig.formatValue(value)
    }

    // Fallback to default formatting
    if (value === null || value === undefined) {
      return '0'
    }

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

  // Get colors from palette
  const getPositiveColor = (): string => {
    if (displayConfig.positiveColorIndex !== undefined && colorPalette?.colors) {
      const colorIndex = displayConfig.positiveColorIndex
      if (colorIndex >= 0 && colorIndex < colorPalette.colors.length) {
        return colorPalette.colors[colorIndex]
      }
    }
    return '#10b981' // Default green
  }

  const getNegativeColor = (): string => {
    if (displayConfig.negativeColorIndex !== undefined && colorPalette?.colors) {
      const colorIndex = displayConfig.negativeColorIndex
      if (colorIndex >= 0 && colorIndex < colorPalette.colors.length) {
        return colorPalette.colors[colorIndex]
      }
    }
    return '#ef4444' // Default red
  }

  const positiveColor = getPositiveColor()
  const negativeColor = getNegativeColor()
  const currentColor = isPositiveChange ? positiveColor : negativeColor

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center justify-center w-full h-full p-4"
      style={{ 
        height: height === "100%" ? "100%" : height,
        minHeight: height === "100%" ? '200px' : undefined
      }}
    >
      {/* Field Label */}
      <div
        className="text-dc-text-secondary font-bold text-center mb-2"
        style={{
          fontSize: '14px',
          lineHeight: '1.2'
        }}
      >
        {(() => {
          const label = getFieldLabel(valueField)
          return (label && label.length > 1) ? label : valueField
        })()}
      </div>

      {/* Main KPI Value and Delta */}
      <div className="flex items-center justify-center space-x-4 mb-2">
        {/* Main KPI Value */}
        <div 
          ref={valueRef}
          className="font-bold leading-none"
          style={{ 
            fontSize: `${fontSize}px`,
            color: '#1f2937' // Keep main value neutral
          }}
        >
          {formatNumber(lastValue)}
        </div>

        {/* Delta Information */}
        <div className="flex items-center space-x-2">
          {/* Arrow */}
          <div 
            className="font-bold"
            style={{ 
              color: currentColor,
              fontSize: `${fontSize * 0.6}px` // Larger arrow
            }}
          >
            {isPositiveChange ? '▲' : '▼'}
          </div>
          
          {/* Delta Values */}
          <div className="text-left">
            <div 
              className="font-bold leading-tight"
              style={{ 
                fontSize: `${fontSize * 0.6}px`, // Larger delta value
                color: currentColor
              }}
            >
              {isPositiveChange ? '+' : ''}{formatNumber(absoluteChange)}
            </div>
            <div 
              className="font-semibold leading-tight"
              style={{ 
                fontSize: `${fontSize * 0.45}px`, // Larger percentage
                color: currentColor,
                opacity: 0.8
              }}
            >
              {isPositiveChange ? '+' : ''}{percentageChange.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Unit/Suffix (hidden when formatValue is provided) */}
      {displayConfig.suffix && !displayConfig.formatValue && (
        <div
          className="text-dc-text-muted text-center mb-3"
          style={{
            fontSize: '14px',
            lineHeight: '1.2',
            opacity: 0.8
          }}
        >
          {displayConfig.suffix}
        </div>
      )}

      {/* Variance Histogram */}
      {displayConfig.showHistogram !== false && values.length > 2 && (
        <div className="mt-2">
          <VarianceHistogram
            values={values}
            lastValue={lastValue}
            positiveColor={positiveColor}
            negativeColor={negativeColor}
            formatValue={formatNumber}
            width={textWidth}
            height={64}
          />
        </div>
      )}
    </div>
  )
}