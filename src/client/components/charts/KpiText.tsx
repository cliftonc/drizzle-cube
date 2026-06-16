import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel.js'
import DataHistogram from '../DataHistogram.js'
import {
  extractValueFields,
  extractValues,
  computeKpiStats,
  formatKpiNumber,
  processKpiTemplate,
  resolveValueColor
} from './kpiTextHelpers.js'
import type { ChartProps } from '../../types.js'

const KpiText = React.memo(function KpiText({
  data,
  chartConfig,
  displayConfig = {},
  height = "100%",
  colorPalette
}: ChartProps) {
  const { t } = useTranslation()
  const [fontSize, setFontSize] = useState(28)
  const [textWidth, setTextWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  // Use specialized hook to avoid re-renders from unrelated context changes
  const getFieldLabel = useCubeFieldLabel()

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
        className="dc:flex dc:items-center dc:justify-center dc:w-full dc:h-full"
        style={{
          height: height === "100%" ? "100%" : height,
          minHeight: height === "100%" ? '200px' : undefined
        }}
      >
        <div className="dc:text-center text-dc-text-muted">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.noData')}</div>
          <div className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.noDataHint.kpi')}</div>
        </div>
      </div>
    )
  }

  // Extract value field from chart config - handle both string and array formats
  const valueFields = extractValueFields(chartConfig?.yAxis)

  if (valueFields.length === 0) {
    return (
      <div
        className="dc:flex dc:items-center dc:justify-center dc:w-full dc:h-full"
        style={{
          height: height === "100%" ? "100%" : height,
          minHeight: height === "100%" ? '200px' : undefined,
          backgroundColor: 'var(--dc-danger-bg)',
          color: 'var(--dc-danger)',
          borderColor: 'var(--dc-danger-border)'
        }}
      >
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.configError')}</div>
          <div className="dc:text-xs">{t('chart.runtime.configErrorHint.noMeasures')}</div>
        </div>
      </div>
    )
  }

  const valueField = valueFields[0] // Use first measure field

  // Extract values for the selected field
  const values = extractValues(data as Record<string, any>[], valueField)

  if (values.length === 0) {
    return (
      <div
        className="dc:flex dc:items-center dc:justify-center dc:w-full dc:h-full"
        style={{
          height: height === "100%" ? "100%" : height,
          minHeight: height === "100%" ? '200px' : undefined,
          backgroundColor: 'var(--dc-warning-bg)',
          color: 'var(--dc-warning)',
          borderColor: 'var(--dc-warning-border)'
        }}
      >
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.noValidData')}</div>
          <div className="dc:text-xs">{t('chart.runtime.noValidDataHint.kpiText')}</div>
        </div>
      </div>
    )
  }

  // Calculate statistics for numeric values
  const { mainValue, min, max, showStats } = computeKpiStats(values)

  // Format number with appropriate units and decimals
  const formatNumber = (value: number | null | undefined): string =>
    formatKpiNumber(value, { formatValue: displayConfig.formatValue, decimals: displayConfig.decimals })

  const template = displayConfig.template || '${fieldLabel}: ${value}'
  const displayText = processKpiTemplate(template, {
    value: mainValue,
    valueField,
    fieldLabel: getFieldLabel(valueField),
    min,
    max,
    count: values.length,
    formatNumber
  })

  // Get color from palette by index, default to first color in palette
  const valueColor = resolveValueColor(displayConfig.valueColorIndex, colorPalette)

  return (
    <div 
      ref={containerRef}
      className="dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full dc:h-full dc:p-4"
      style={{ 
        height: height === "100%" ? "100%" : height,
        minHeight: height === "100%" ? '200px' : undefined
      }}
    >
        {/* Main KPI Text */}
        <div 
          ref={textRef}
          className="dc:font-bold dc:leading-tight dc:text-center"
          style={{ 
            fontSize: `${fontSize}px`,
            color: valueColor 
          }}
        >
          {displayText}
        </div>

        {/* Data Histogram for multiple values */}
        {showStats && min !== null && max !== null && (
          <div className="dc:mt-4">
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
})

export default KpiText