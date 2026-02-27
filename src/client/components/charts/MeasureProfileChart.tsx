import React, { useMemo } from 'react'
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
 * Supports multiple lines via a series dimension.
 *
 * Input (normal cube row):
 *   { 'Markouts.avgMinus2m': 10, 'Markouts.avgAtEvent': 0, 'Markouts.avgPlus2m': -5, 'Trades.symbol': 'AAPL' }
 *
 * Output (one row per measure):
 *   [
 *     { measureKey: 'Markouts.avgMinus2m', measureLabel: 'avgMinus2m', AAPL: 10 },
 *     { measureKey: 'Markouts.avgAtEvent', measureLabel: 'avgAtEvent', AAPL: 0 },
 *     { measureKey: 'Markouts.avgPlus2m',  measureLabel: 'avgPlus2m',  AAPL: -5 },
 *   ]
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

  // Build the template rows — one per measure
  const profileRows: Record<string, unknown>[] = yAxisFields.map((field) => ({
    measureKey: field,
    measureLabel: getFieldLabel(field),
  }))

  if (seriesField) {
    // Multi-series: one line per unique dimension value
    const seriesValues = Array.from(new Set(data.map((row) => String(row[seriesField] ?? 'Unknown'))))
    seriesValues.forEach((seriesVal) => {
      // Aggregate across all rows for this series value (take first match or average)
      const matchingRows = data.filter((row) => String(row[seriesField] ?? 'Unknown') === seriesVal)
      yAxisFields.forEach((field, i) => {
        // Average numeric values across matching rows
        const values = matchingRows
          .map((r) => {
            const v = r[field]
            return typeof v === 'number' ? v : parseFloat(String(v ?? ''))
          })
          .filter((v) => !isNaN(v))
        profileRows[i][seriesVal] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
      })
    })
    return { profileData: profileRows, seriesKeys: seriesValues }
  } else {
    // Single series: aggregate all rows (average per measure)
    const VALUE_KEY = '_value'
    yAxisFields.forEach((field, i) => {
      const values = data
        .map((r) => {
          const v = r[field]
          return typeof v === 'number' ? v : parseFloat(String(v ?? ''))
        })
        .filter((v) => !isNaN(v))
      profileRows[i][VALUE_KEY] = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null
    })
    return { profileData: profileRows, seriesKeys: [VALUE_KEY] }
  }
}

const MeasureProfileChart = React.memo(function MeasureProfileChart({
  data,
  chartConfig,
  displayConfig = {},
  queryObject,
  height = '100%',
  colorPalette,
  onDataPointClick,
  drillEnabled,
}: ChartProps) {
  const getFieldLabel = useCubeFieldLabel()

  const showReferenceLineAtZero: boolean = displayConfig?.showReferenceLineAtZero ?? true
  const showDataLabels: boolean = displayConfig?.showDataLabels ?? false
  const lineType: 'monotone' | 'linear' | 'step' = displayConfig?.lineType ?? 'monotone'
  const yAxisFormat = displayConfig?.leftYAxisFormat

  const { yAxisFields, seriesField, configError } = useMemo(() => {
    const yAxisFields: string[] = Array.isArray(chartConfig?.yAxis)
      ? chartConfig.yAxis
      : chartConfig?.yAxis
        ? [chartConfig.yAxis as string]
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

  if (!data || data.length === 0) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-text-muted" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">No data available</div>
          <div className="dc:text-xs text-dc-text-secondary">No data points to display in measure profile chart</div>
        </div>
      </div>
    )
  }

  if (configError) {
    return (
      <div className="dc:flex dc:items-center dc:justify-center dc:w-full text-dc-warning" style={{ height }}>
        <div className="dc:text-center">
          <div className="dc:text-sm dc:font-semibold dc:mb-1">Configuration Error</div>
          <div className="dc:text-xs">{configError}</div>
        </div>
      </div>
    )
  }

  const showLegend: boolean = (displayConfig?.showLegend ?? true) && seriesKeys.length > 1

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
              onClick={(lineData: any, _index: number, event: React.MouseEvent) => {
                if (onDataPointClick && drillEnabled && lineData) {
                  onDataPointClick({
                    dataPoint: lineData,
                    clickedField: lineData.measureKey ?? seriesKey,
                    xValue: lineData.measureLabel,
                    position: { x: event?.clientX ?? 0, y: event?.clientY ?? 0 },
                    nativeEvent: event,
                  })
                }
              }}
            />
          ))}
        </LineChart>
      </ChartContainer>
    </div>
  )
})

export default MeasureProfileChart
