/**
 * FunnelChart Component
 *
 * Visualizes funnel data showing conversion rates between steps.
 * Uses horizontal bars with percentage widths to represent the funnel shape.
 * Works with data from useFunnelQuery hook which provides FunnelChartData.
 *
 * When displayConfig.showFunnelTimeMetrics is enabled, displays time-to-convert
 * metrics from server-side funnel execution (avg, median, P90 seconds).
 */

import React, { useMemo } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import { CHART_COLORS } from '../../utils/chartConstants.js'
import type { ChartProps } from '../../types.js'
import type { FunnelChartData } from '../../types/funnel.js'
import { toFunnelData, resolveFunnelDisplayOptions } from './FunnelChart.helpers.js'
import { FunnelShapeView, FunnelVerticalView, FunnelHorizontalView } from './FunnelViews.js'

/**
 * FunnelChart Component
 *
 * Renders a funnel visualization from FunnelChartData array.
 * Shows each step as a horizontal bar with width proportional to count.
 * Displays conversion rates between steps.
 */
const FunnelChart = React.memo(function FunnelChart({
  data,
  height = '100%',
  colorPalette,
  displayConfig,
}: ChartProps) {
  const { t } = useTranslation()
  const options = resolveFunnelDisplayOptions(displayConfig)

  // Transform data if needed
  const funnelData = useMemo<FunnelChartData[]>(() => toFunnelData(data), [data])

  // Calculate first step value for percentage calculations
  const firstStepValue = funnelData[0]?.value || 0

  // Handle no data
  if (!data || data.length === 0 || funnelData.length === 0) {
    return (
      <div
        className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted"
        style={{ height }}
      >
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.funnel.noData')}</div>
          <div className="dc:text-xs text-dc-text-secondary">
            {t('chart.runtime.noDataHint.funnel')}
          </div>
        </div>
      </div>
    )
  }

  const paletteColors = colorPalette?.colors || CHART_COLORS
  const viewProps = { funnelData, firstStepValue, paletteColors, options, height }

  if (options.funnelStyle === 'funnel') {
    return <FunnelShapeView {...viewProps} />
  }

  if (options.isVertical) {
    return <FunnelVerticalView {...viewProps} />
  }

  return <FunnelHorizontalView {...viewProps} />
})

export default FunnelChart
