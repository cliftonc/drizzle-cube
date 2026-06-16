import React, { useEffect, useRef, useState, useMemo } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import { transition as _transition } from 'd3'
// _transition import is for side effects only - it extends Selection.prototype with .transition()
void _transition
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel.js'
import { getTheme, watchThemeChanges, type Theme } from '../../theme/index.js'
import { useChartDimensions } from './useChartDimensions.js'
import {
  firstDateField,
  getGridMapping,
  getQueryGranularity,
  buildGridData
} from './ActivityGridChart.helpers.js'
import { renderActivityGrid } from './ActivityGridChart.render.js'
import type { ChartProps } from '../../types.js'

const ActivityGridChart = React.memo(function ActivityGridChart({
  data,
  chartConfig,
  displayConfig = {},
  queryObject,
  height = "100%",
  colorPalette,
  onDataPointClick,
  drillEnabled
}: ChartProps) {
  const { t } = useTranslation()
  const svgRef = useRef<SVGSVGElement | null>(null)
  const { containerRef, dimensions, dimensionsReady } = useChartDimensions()
  const [currentTheme, setCurrentTheme] = useState<Theme>('light')
  // Use specialized hook to avoid re-renders from unrelated context changes
  const getFieldLabel = useCubeFieldLabel()

  // Watch for theme changes
  useEffect(() => {
    setCurrentTheme(getTheme())
    return watchThemeChanges((theme) => setCurrentTheme(theme))
  }, [])

  const safeDisplayConfig = useMemo(() => ({
    showTooltip: displayConfig?.showTooltip ?? true,
    showLabels: displayConfig?.showLabels ?? true,
    fitToWidth: displayConfig?.fitToWidth ?? false
  }), [displayConfig?.showTooltip, displayConfig?.showLabels, displayConfig?.fitToWidth])

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current || !dimensionsReady || dimensions.width === 0) {
      return
    }

    if (!chartConfig?.dateField || !chartConfig?.valueField) return
    const dateField = firstDateField(chartConfig.dateField)
    const valueField = firstDateField(chartConfig.valueField)
    if (!dateField || !valueField) return

    const granularity = getQueryGranularity(queryObject, dateField)
    const gridMapping = getGridMapping(granularity)
    if (!gridMapping) return

    const gridData = buildGridData(data as Record<string, any>[], dateField, valueField, gridMapping, granularity)

    return renderActivityGrid({
      svgEl: svgRef.current,
      gridData,
      gridMapping,
      granularity,
      dimensions,
      safeDisplayConfig,
      colorPalette,
      isDark: currentTheme !== 'light',
      valueField,
      dateField,
      getFieldLabel,
      drillEnabled,
      onDataPointClick
    })
  }, [data, chartConfig, queryObject, dimensions, dimensionsReady, safeDisplayConfig, colorPalette, currentTheme, getFieldLabel, drillEnabled, onDataPointClick])

  if (!data || data.length === 0) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full" style={{ height }}>
        <div className="dc:text-center text-dc-text-muted">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.noData')}</div>
          <div className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.noDataHint.activityGrid')}</div>
        </div>
      </div>
    )
  }

  // Validate that we have required fields
  const hasValidConfig = chartConfig?.dateField && chartConfig?.valueField
  if (!hasValidConfig) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full" style={{ height }}>
        <div className="dc:text-center text-dc-text-muted">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.activityGridConfigRequired')}</div>
          <div className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.configErrorHint.activityGridRequired')}</div>
        </div>
      </div>
    )
  }

  // Check if granularity is supported (year granularity is not useful for activity grids)
  const dateField = firstDateField(chartConfig.dateField)
  const granularityFromQuery = queryObject?.timeDimensions?.find((td: { dimension: string }) =>
    td.dimension === dateField || td.dimension.includes(dateField!)
  )?.granularity || 'day'

  if (granularityFromQuery?.toLowerCase() === 'year') {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full" style={{ height }}>
        <div className="dc:text-center text-dc-text-muted">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.activityGridGranularityTooHigh')}</div>
          <div className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.activityGridGranularityHint')}</div>
          <div className="dc:text-xs text-dc-text-secondary dc:mt-1">{t('chart.runtime.activityGridGranularityAction')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dc:w-full dc:flex dc:flex-col dc:relative" style={{ height, minHeight: '250px', overflow: 'hidden', width: '100%' }}>
      <div ref={containerRef} className="dc:w-full dc:h-full dc:relative dc:overflow-x-auto" style={{ width: '100%' }}>
        <svg ref={svgRef} className="dc:h-full" />
        {!dimensionsReady && (
          <div className="dc:absolute dc:inset-0 dc:flex dc:items-center dc:justify-center">
            <div className="text-dc-text-muted dc:text-sm">{t('chart.runtime.measuringDimensions')}</div>
          </div>
        )}
      </div>
    </div>
  )
})

export default ActivityGridChart
