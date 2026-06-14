import React, { useState } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { Treemap } from 'recharts'
import ChartContainer from './ChartContainer'
import ChartTooltip from './ChartTooltip'
import { ChartEmptyState, ChartConfigError, ChartRenderError } from './ChartStates'
import { formatAxisValue } from '../../utils/chartUtils'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel'
import {
  buildTreemapData,
  buildTreemapLegend,
  adjustHeightForLegend
} from './TreeMapChart.helpers'
import { makeTreeMapContent } from './TreeMapContent'
import { TreeMapLegend } from './TreeMapLegend'
import type { ChartProps } from '../../types'

const TreeMapChart = React.memo(function TreeMapChart({
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  // Use specialized hook to avoid re-renders from unrelated context changes
  const getFieldLabel = useCubeFieldLabel()

  try {
    const safeDisplayConfig = {
      showTooltip: displayConfig?.showTooltip ?? true,
      showLegend: displayConfig?.showLegend ?? true,
      leftYAxisFormat: displayConfig?.leftYAxisFormat
    }

    if (!data || data.length === 0) {
      return <ChartEmptyState height={height} hint={t('chart.runtime.noDataHint.treemap')} />
    }

    // Build treemap rows (config or auto-detect) — null means no usable size field
    const built = buildTreemapData(data, chartConfig, queryObject, colorPalette)
    if (!built) {
      return <ChartConfigError height={height} hint={t('chart.runtime.configErrorHint.treemapNumeric')} />
    }

    const { treemapData, isNumericSeries, seriesField } = built

    if (treemapData.length === 0) {
      return (
        <ChartEmptyState
          height={height}
          titleKey="chart.runtime.noValidData"
          hint="No valid data points for treemap chart after transformation"
        />
      )
    }

    // Custom content renderer for treemap cells with HTML overlays
    const CustomizedContent = makeTreeMapContent({
      treemapData,
      colorPalette,
      hoveredIndex,
      setHoveredIndex,
      leftYAxisFormat: safeDisplayConfig.leftYAxisFormat,
      drillEnabled,
      onDataPointClick,
      queryObject,
      chartConfig
    })

    // Build legend payload (gradient for numeric series, swatches otherwise)
    const legendPayload = buildTreemapLegend(
      data,
      treemapData,
      safeDisplayConfig.showLegend,
      seriesField,
      isNumericSeries,
      safeDisplayConfig.leftYAxisFormat
    )

    const hasLegend = safeDisplayConfig.showLegend && legendPayload.length > 0
    const adjustedHeight = adjustHeightForLegend(height, hasLegend)

    return (
      <div className="dc:w-full" style={{ height: adjustedHeight }}>
        <ChartContainer height={hasLegend ? `calc(100% - 50px)` : "100%"}>
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#fff"
            content={<CustomizedContent />}
          >
            {safeDisplayConfig.showTooltip && (
              <ChartTooltip
                formatter={safeDisplayConfig.leftYAxisFormat
                  ? (value: any, name: string) => [formatAxisValue(value, safeDisplayConfig.leftYAxisFormat), name]
                  : undefined
                }
              />
            )}
          </Treemap>
        </ChartContainer>

        {/* Custom Legend outside ChartContainer */}
        {hasLegend && (
          <TreeMapLegend
            isNumericSeries={isNumericSeries}
            seriesField={seriesField}
            seriesLabel={seriesField ? getFieldLabel(seriesField) : ''}
            legendPayload={legendPayload}
            data={data}
            leftYAxisFormat={safeDisplayConfig.leftYAxisFormat}
          />
        )}
      </div>
    )
  } catch (error) {
    // 'TreeMapChart rendering error
    return <ChartRenderError height={height} chartType="TreeMap Chart" error={error} />
  }
})

export default TreeMapChart
