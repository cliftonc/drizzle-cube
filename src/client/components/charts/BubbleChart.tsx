import React, { useEffect, useMemo } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import { transition as _transition } from 'd3'
// _transition import is for side effects only - it extends Selection.prototype with .transition()
void _transition
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel.js'
import { useTheme } from '../../hooks/useTheme.js'
import { useChartDimensions } from './useChartDimensions.js'
import {
  resolveBubbleDisplayOptions,
  resolveBubbleFields,
  transformBubbleData
} from './BubbleChart.helpers.js'
import { renderBubbleChart } from './BubbleChart.render.js'
import type { ChartProps } from '../../types.js'

const BubbleChart = React.memo(function BubbleChart({
  data,
  chartConfig,
  displayConfig = {},
  queryObject,
  height = "100%",
  colorPalette
}: ChartProps) {
  const { t } = useTranslation()
  const svgRef = React.useRef<SVGSVGElement | null>(null)
  const { containerRef, dimensions, dimensionsReady } = useChartDimensions()
  const { theme } = useTheme()
  const getFieldLabel = useCubeFieldLabel()

  // Memoize display options to keep the render effect dependencies stable
  const options = useMemo(() => resolveBubbleDisplayOptions(displayConfig), [displayConfig])

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current || !dimensionsReady || dimensions.width === 0) {
      return
    }

    const fields = resolveBubbleFields(chartConfig)
    if (!fields) return

    const bubbleData = transformBubbleData(data as Record<string, any>[], fields, queryObject)

    return renderBubbleChart({
      svgEl: svgRef.current,
      bubbleData,
      fields,
      options,
      dimensions,
      queryObject,
      colorPalette,
      isDark: theme !== 'light',
      getFieldLabel
    })
  }, [data, chartConfig, options, queryObject, dimensions, dimensionsReady, colorPalette, theme, getFieldLabel])

  if (!data || data.length === 0) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.noData')}</div>
          <div className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.noDataHint.bubble')}</div>
        </div>
      </div>
    )
  }

  // Validate that we have required fields
  const hasValidConfig = chartConfig?.xAxis && chartConfig?.yAxis && chartConfig?.series
  if (!hasValidConfig) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-warning" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.activityGridConfigRequired')}</div>
          <div className="dc:text-xs">{t('chart.runtime.configErrorHint.bubbleRequired')}</div>
          <div className="dc:text-xs dc:mt-1">{t('chart.runtime.configErrorHint.bubbleOptional')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="dc:w-full dc:flex-1 dc:flex dc:flex-col dc:relative" style={{ height, minHeight: '250px', overflow: 'hidden' }}>
      <div ref={containerRef} className="dc:w-full dc:h-full dc:relative">
        <svg ref={svgRef} className="dc:w-full dc:h-full" />
        {!dimensionsReady && (
          <div className="dc:absolute dc:inset-0 dc:flex dc:items-center dc:justify-center">
            <div className="text-dc-text-muted dc:text-sm">{t('chart.runtime.measuringDimensions')}</div>
          </div>
        )}
      </div>
    </div>
  )
})

export default BubbleChart
