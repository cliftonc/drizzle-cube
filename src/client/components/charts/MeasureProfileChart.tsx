import React, { useMemo } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, Legend } from 'recharts'
import ChartContainer from './ChartContainer'
import ChartTooltip from './ChartTooltip'
import AngledXAxisTick from './AngledXAxisTick'
import { CHART_COLORS, CHART_MARGINS } from '../../utils/chartConstants'
import { formatAxisValue } from '../../utils/chartUtils'
import { useCubeFieldLabel } from '../../hooks/useCubeFieldLabel'
import type { ChartProps } from '../../types'

/**
 * Pivots N measures from chartConfig.yAxis[] into sequential X-axis points.
 * Each measure becomes one X-axis category; its numeric value is Y.
 * When a series dimension is provided, values are averaged across all rows
 * that share the same series value.
 *
 * Input (normal cube rows):
 *   [{ 'Markouts.avgMinus2m': 10, 'Markouts.avgAtEvent': 0, 'Trades.symbol': 'AAPL' },
 *    { 'Markouts.avgMinus2m': 12, 'Markouts.avgAtEvent': 1, 'Trades.symbol': 'AAPL' }]
 *
 * Output (one row per measure, values averaged per series):
 *   [{ measureKey: 'Markouts.avgMinus2m', measureLabel: <getFieldLabel result>, AAPL: 11 },
 *    { measureKey: 'Markouts.avgAtEvent', measureLabel: <getFieldLabel result>, AAPL: 0.5 }]
 */
function pivotMeasuresToProfile(
  data: Record<string, unknown>[],
  yAxisFields: string[],
  seriesField: string | undefined,
  getFieldLabel: (field: string) => string
): { profileData: Record<string, unknown>[]; seriesKeys: string[] } {
  if (!data || data.length === 0 || yAxisFields.length === 0) {
    return { profileData: [], seriesKeys: [] }
  }

  if (seriesField) {
    const seriesValues = Array.from(new Set(data.map((row) => String(row[seriesField] ?? 'Unknown'))))
    const profileData = yAxisFields.map((field) => {
      const base: Record<string, unknown> = {
        measureKey: field,
        measureLabel: getFieldLabel(field),
      }
      for (const seriesVal of seriesValues) {
        const matchingRows = data.filter((row) => String(row[seriesField] ?? 'Unknown') === seriesVal)
        const values = matchingRows
          .map((r) => {
            const v = r[field]
            return typeof v === 'number' ? v : parseFloat(String(v ?? ''))
          })
          .filter((v) => !isNaN(v))
        base[seriesVal] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
      }
      return base
    })
    return { profileData, seriesKeys: seriesValues }
  } else {
    const VALUE_KEY = '_value'
    const profileData = yAxisFields.map((field) => {
      const values = data
        .map((r) => {
          const v = r[field]
          return typeof v === 'number' ? v : parseFloat(String(v ?? ''))
        })
        .filter((v) => !isNaN(v))
      return {
        measureKey: field,
        measureLabel: getFieldLabel(field),
        [VALUE_KEY]: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null,
      }
    })
    return { profileData, seriesKeys: [VALUE_KEY] }
  }
}

const MeasureProfileChart = React.memo(function MeasureProfileChart({
  data,
  chartConfig,
  displayConfig = {},
  height = '100%',
  colorPalette,
  drillEnabled,
}: ChartProps) {
  const { t } = useTranslation()
  const getFieldLabel = useCubeFieldLabel()

  const showReferenceLineAtZero = displayConfig?.showReferenceLineAtZero ?? true
  const showDataLabels = displayConfig?.showDataLabels ?? false
  const lineType = displayConfig?.lineType ?? 'monotone'
  const yAxisFormat = displayConfig?.leftYAxisFormat

  const { yAxisFields, seriesField, configError } = useMemo(() => {
    const yAxisFields: string[] = Array.isArray(chartConfig?.yAxis)
      ? chartConfig.yAxis
      : []
    const seriesField = Array.isArray(chartConfig?.series)
      ? chartConfig.series[0]
      : chartConfig?.series ?? undefined
    const configError =
      yAxisFields.length < 2 ? 'Measure Profile chart requires at least 2 measures in Y-Axis' : null
    return { yAxisFields, seriesField, configError }
  }, [chartConfig])

  const { profileData, seriesKeys } = useMemo(() => {
    if (configError || !data || data.length === 0) return { profileData: [], seriesKeys: [] }
    return pivotMeasuresToProfile(
      data as Record<string, unknown>[],
      yAxisFields,
      seriesField,
      getFieldLabel
    )
  }, [data, yAxisFields, seriesField, getFieldLabel, configError])

  const showLegend = (displayConfig?.showLegend ?? true) && seriesKeys.length > 1

  try {
    if (!data || data.length === 0) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
          <div className="dc:text-center">
            <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.noData')}</div>
            <div className="dc:text-xs text-dc-text-secondary">{t('chart.runtime.noDataHint.measureProfile')}</div>
          </div>
        </div>
      )
    }

    if (configError) {
      return (
        <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-warning" style={{ height }}>
          <div className="dc:text-center">
            <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.configError')}</div>
            <div className="dc:text-xs">{configError}</div>
          </div>
        </div>
      )
    }
    return (
      <div className="dc:relative dc:w-full" style={{ height }}>
        <ChartContainer height="100%">
          <LineChart data={profileData} margin={{ ...CHART_MARGINS, left: 40 }} accessibilityLayer={false}>
            <CartesianGrid strokeDasharray="3 3" style={{ pointerEvents: 'none' }} />
            <XAxis dataKey="measureLabel" type="category" tick={<AngledXAxisTick />} height={60} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={yAxisFormat ? (v) => formatAxisValue(v, yAxisFormat) : undefined}
            />
            <ChartTooltip
              formatter={(value: any, name: any) => {
                if (value === null || value === undefined) return ['No data', name]
                const formatted = yAxisFormat ? formatAxisValue(value, yAxisFormat) : value?.toLocaleString?.() ?? value
                const displayName = name === '_value' ? (getFieldLabel(yAxisFields[0]?.split('.')[0]) || 'Value') : name
                return [formatted, displayName]
              }}
            />
            {showReferenceLineAtZero && (
              <ReferenceLine y={0} stroke="var(--dc-border, #94a3b8)" strokeDasharray="4 2" />
            )}
            {showLegend && (
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            )}
            {seriesKeys.map((seriesKey, index) => (
              <Line
                key={seriesKey}
                type={lineType}
                dataKey={seriesKey}
                name={seriesKey === '_value' ? (getFieldLabel(yAxisFields[0]?.split('.')[0]) || 'Value') : seriesKey}
                stroke={
                  (colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) ||
                  CHART_COLORS[index % CHART_COLORS.length]
                }
                strokeWidth={2}
                dot={showDataLabels ? { r: 4 } : { r: 3 }}
                activeDot={{ r: 5 }}
                label={showDataLabels ? { position: 'top', fontSize: 10 } : undefined}
                isAnimationActive={false}
                cursor={drillEnabled ? 'pointer' : undefined}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </div>
    )
  } catch (error) {
    return (
      <div className="dc:flex dc:flex-col dc:items-center dc:justify-center dc:w-full text-dc-error dc:p-4" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">{t('chart.runtime.chartError', { chartType: 'Measure Profile Chart' })}</div>
          <div className="dc:text-xs dc:mb-2">{error instanceof Error ? error.message : t('chart.runtime.unknownError')}</div>
          <div className="dc:text-xs text-dc-text-muted">{t('chart.runtime.checkConfig')}</div>
        </div>
      </div>
    )
  }
})

export default MeasureProfileChart
