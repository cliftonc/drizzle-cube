import React, { useMemo, useCallback } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { Icon } from '@iconify/react'
import infoCircleIcon from '@iconify-icons/tabler/info-circle'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel'
import DataHistogram from '../DataHistogram'
import { parseTargetValues, calculateVariance, formatVariance } from '../../utils/targetUtils'
import { filterIncompletePeriod } from '../../utils/periodUtils'
import {
  getKpiValueFields,
  sortKpiData,
  extractKpiValues,
  computeKpiStats,
  formatKpiNumber,
  resolveValueColor,
  resolveVarianceColor,
  resolveDisplayLabel
} from './KpiNumber.helpers'
import { useKpiDimensions } from './useKpiDimensions'
import { KpiCenteredState, kpiHeightStyle } from './KpiStates'
import type { ChartProps } from '../../types'

const KpiNumber = React.memo(function KpiNumber({
  data,
  chartConfig,
  displayConfig = {},
  queryObject,
  height = "100%",
  colorPalette
}: ChartProps) {
  const { t } = useTranslation()

  // Use specialized hook to avoid re-renders from unrelated context changes
  const getFieldLabel = useCubeFieldLabel()

  // Extract value field from chart config - handle both string and array formats
  const valueFields = useMemo(
    () => getKpiValueFields(chartConfig?.yAxis),
    [chartConfig?.yAxis]
  )

  const valueField = valueFields[0] || '' // Use first measure field

  // Get time dimension field if present (for incomplete period filtering)
  const timeDimensionField = queryObject?.timeDimensions?.[0]?.dimension || undefined

  // Memoize sorted data to prevent recalculation on every render
  const sortedData = useMemo(
    () => sortKpiData(data, timeDimensionField),
    [data, timeDimensionField]
  )

  // Filter out incomplete or last period if enabled
  const { useLastCompletePeriod = true, skipLastPeriod = false } = displayConfig

  // Memoize filtered data
  const {
    filteredData,
    excludedIncompletePeriod,
    skippedLastPeriod,
    granularity
  } = useMemo(() => {
    if (sortedData.length === 0) {
      return { filteredData: [], excludedIncompletePeriod: false, skippedLastPeriod: false, granularity: undefined }
    }
    return filterIncompletePeriod(sortedData, timeDimensionField, queryObject, useLastCompletePeriod, skipLastPeriod)
  }, [sortedData, timeDimensionField, queryObject, useLastCompletePeriod, skipLastPeriod])

  // Use filtered data for calculations
  const dataToUse = filteredData

  // Memoize value extraction to prevent recalculation
  const values = useMemo(
    () => extractKpiValues(dataToUse, valueField),
    [dataToUse, valueField]
  )

  // Memoize statistics calculations
  const { avg, min, max } = useMemo(() => computeKpiStats(values), [values])

  // Memoize format function to prevent re-creating on every render
  const formatNumber = useCallback(
    (value: number | null | undefined): string => formatKpiNumber(value, displayConfig),
    [displayConfig]
  )

  const mainValue = values.length === 1 ? values[0] : avg
  const showStats = values.length > 1

  // Memoize color calculation to prevent re-creating function on every render
  const valueColor = useMemo(
    (): string => resolveValueColor(displayConfig.valueColorIndex, colorPalette?.colors),
    [displayConfig.valueColorIndex, colorPalette?.colors]
  )

  // Process target values for variance calculation
  const targetValues = useMemo(() => parseTargetValues(displayConfig?.target || ''), [displayConfig?.target])
  const targetValue = targetValues.length > 0 ? targetValues[0] : null // Use first target value
  const variance = targetValue !== null && values.length > 0 ? calculateVariance(mainValue, targetValue) : null

  // Memoize variance color calculation
  const varianceColor = useMemo(
    (): string => resolveVarianceColor(
      variance,
      displayConfig.positiveColorIndex,
      displayConfig.negativeColorIndex,
      colorPalette?.colors
    ),
    [variance, displayConfig.positiveColorIndex, displayConfig.negativeColorIndex, colorPalette?.colors]
  )

  // Calculate font size and text width based on container dimensions
  const { containerRef, valueRef, fontSize, textWidth } = useKpiDimensions({
    widthDivisor: 5,
    heightDivisor: 4, // More conservative to leave room for label
    minFontSize: 24,
    maxFontSize: 120, // Lower max to ensure label fits
    // Ensure we have a minimum width and use container width as fallback
    measureWidth: (measuredWidth, containerWidth) =>
      Math.max(measuredWidth, Math.min(containerWidth * 0.6, 300)),
    deps: [data, chartConfig]
  })

  // Early returns AFTER all hooks
  if (!data || data.length === 0) {
    return (
      <KpiCenteredState
        height={height}
        title={t('chart.runtime.noData')}
        hint={t('chart.runtime.noDataHint.kpi')}
      />
    )
  }

  if (valueFields.length === 0) {
    return (
      <KpiCenteredState
        height={height}
        variant="danger"
        title={t('chart.runtime.configError')}
        hint={t('chart.runtime.configErrorHint.noMeasures')}
      />
    )
  }

  // Null handling: If all values are null, show placeholder instead of error
  if (values.length === 0) {
    return (
      <div
        ref={containerRef}
        className="dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full dc:h-full dc:p-4"
        style={kpiHeightStyle(height)}
      >
        {/* Field Label */}
        <div
          className="text-dc-text-secondary dc:font-bold dc:text-center dc:mb-3"
          style={{
            fontSize: '14px',
            lineHeight: '1.2'
          }}
        >
          {getFieldLabel(valueField)}
        </div>

        {/* No Data Placeholder */}
        <div
          className="dc:font-bold dc:leading-none text-dc-text-muted"
          style={{
            fontSize: `${fontSize}px`
          }}
        >
          —
        </div>

        <div className="dc:text-xs text-dc-text-muted dc:mt-2">No data</div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full dc:h-full dc:p-4"
      style={kpiHeightStyle(height)}
    >
        {/* Field Label - Bolder and bigger */}
        <div
          className="text-dc-text-secondary dc:font-bold dc:text-center dc:mb-3 dc:flex dc:items-center dc:justify-center dc:gap-1"
          style={{
            fontSize: '14px',
            lineHeight: '1.2'
          }}
        >
          <span>
            {resolveDisplayLabel(getFieldLabel(valueField), valueField)}
          </span>
          {(excludedIncompletePeriod || skippedLastPeriod) && (
            <span
              title={skippedLastPeriod
                ? `Excludes last ${granularity || 'period'}`
                : `Excludes current incomplete ${granularity}`}
              className="dc:cursor-help"
            >
              <Icon icon={infoCircleIcon} className="dc:w-4 dc:h-4 text-dc-text-muted dc:opacity-70" />
            </span>
          )}
        </div>

        {/* Main KPI Value and Variance - Horizontal layout */}
        <div className="dc:flex dc:items-center dc:justify-center dc:gap-4 dc:mb-3">
          <div
            ref={valueRef}
            className="dc:font-bold dc:leading-none"
            style={{
              fontSize: `${fontSize}px`,
              color: valueColor
            }}
          >
            {formatNumber(mainValue)}
          </div>

          {/* Target Variance Display - To the right of main value */}
          {targetValue !== null && variance !== null && (
            <div className="dc:flex dc:flex-col dc:items-start">
              <div
                className="dc:font-semibold"
                style={{
                  fontSize: `${Math.max(12, fontSize * 0.3)}px`,
                  color: varianceColor,
                  lineHeight: '1.2'
                }}
              >
                {formatVariance(variance, 1)}
              </div>
              <div
                className="text-dc-text-muted dc:text-xs"
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

        {/* Unit/Suffix - Larger, not bold (hidden when formatValue is provided) */}
        {displayConfig.suffix && !displayConfig.formatValue && (
          <div
            className="text-dc-text-muted dc:text-center"
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
          <div className="dc:mt-4">
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
})

export default KpiNumber
