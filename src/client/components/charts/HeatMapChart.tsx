/**
 * HeatMapChart Component
 *
 * Visualizes intensity across two categorical dimensions using a color matrix.
 * Uses @nivo/heatmap for rendering.
 *
 * The chart displays:
 * - Rows: Y-axis dimension values
 * - Columns: X-axis dimension values
 * - Cell color: Intensity based on measure value
 */

import React, { useMemo } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import { getFieldGranularity } from '../../utils/chartUtils.js'
import { ChartEmptyState } from './ChartStates.js'
import { HeatMapCanvas } from './HeatMapCanvas.js'
import {
  MAX_HEATMAP_ROWS,
  MAX_HEATMAP_COLS,
  transformToHeatMapFormat,
  firstField,
  resolveHeatMapDisplayOptions,
  DEFAULT_HEATMAP_COLORS,
} from './HeatMapChart.helpers.js'
import type { ChartProps } from '../../types.js'

/**
 * HeatMapChart Component
 *
 * Renders a heatmap visualization from query results.
 * Shows intensity patterns across two categorical dimensions.
 */
const HeatMapChart = React.memo(function HeatMapChart({
  data,
  height = '100%',
  chartConfig,
  colorPalette,
  displayConfig,
  queryObject,
}: ChartProps) {
  const { t } = useTranslation()
  const options = resolveHeatMapDisplayOptions(displayConfig)

  // Extract field names from chartConfig (handle both array and string formats)
  const xAxisField = firstField(chartConfig?.xAxis)
  const yAxisField = firstField(chartConfig?.yAxis)
  const valueField = firstField(chartConfig?.valueField)

  // Get granularity for time dimensions (only if field is defined)
  const xGranularity = xAxisField ? getFieldGranularity(queryObject, xAxisField) : undefined
  const yGranularity = yAxisField ? getFieldGranularity(queryObject, yAxisField) : undefined

  // Transform data to nivo format
  const { data: heatmapData, truncated, originalRows, originalCols } = useMemo(() => {
    if (!data || data.length === 0) {
      return { data: [], truncated: false, originalRows: 0, originalCols: 0 }
    }
    return transformToHeatMapFormat(
      data as Record<string, unknown>[],
      xAxisField,
      yAxisField,
      valueField,
      xGranularity,
      yGranularity
    )
  }, [data, xAxisField, yAxisField, valueField, xGranularity, yGranularity])

  // Handle no data or missing config
  if (!data || data.length === 0) {
    return <ChartEmptyState height={height} hint={t('chart.runtime.noDataHint.heatmap')} />
  }

  if (!xAxisField || !yAxisField || !valueField) {
    return (
      <ChartEmptyState
        height={height}
        titleKey="chart.runtime.heatmapConfigRequired"
        hint={
          <>
            {!xAxisField && t('chart.runtime.heatmapXRequired')}
            {!yAxisField && t('chart.runtime.heatmapYRequired')}
            {!valueField && t('chart.runtime.heatmapValueRequired')}
          </>
        }
      />
    )
  }

  if (heatmapData.length === 0) {
    return (
      <ChartEmptyState
        height={height}
        titleKey="chart.runtime.noDataToDisplay"
        hint={t('chart.runtime.heatmapNoResults')}
      />
    )
  }

  // Use gradient colors from palette, or default sequential blue gradient.
  // Sequential single-hue gradients are ideal for heatmaps showing magnitude.
  const colors = colorPalette?.gradient || DEFAULT_HEATMAP_COLORS

  return (
    <div className="dc:relative dc:w-full dc:h-full" style={{ height }}>
      {truncated && (
        <div className="dc:absolute dc:top-0 dc:left-0 dc:right-0 dc:z-10 dc:px-3 dc:py-1.5 dc:text-xs bg-dc-warning-bg text-dc-warning dc:border-b border-dc-border">
          {t('chart.runtime.heatmapTruncated', {
            maxRows: MAX_HEATMAP_ROWS,
            maxCols: MAX_HEATMAP_COLS,
            originalRows,
            originalCols
          })}
        </div>
      )}
      <HeatMapCanvas
        data={heatmapData}
        truncated={truncated}
        colors={colors}
        options={options}
        xAxisField={xAxisField}
        yAxisField={yAxisField}
        valueField={valueField}
      />
    </div>
  )
})

export default HeatMapChart
