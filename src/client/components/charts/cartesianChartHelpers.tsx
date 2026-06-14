import React from 'react'
import { Line, Area } from 'recharts'
import { formatTimeValue, getFieldGranularity, transformChartDataWithSeries } from '../../utils/chartUtils'
import { CHART_COLORS } from '../../utils/chartConstants'
import {
  isComparisonData,
  getPeriodLabels,
  transformForOverlayMode,
  isPriorPeriodSeries,
  getPriorPeriodStrokeDashArray
} from '../../utils/comparisonUtils'
import type { ColorPalette } from '../../types'

/**
 * Co-located helpers shared by the Cartesian time-series charts (Line, Area).
 *
 * These extract the heavier inline logic that previously lived inside the chart
 * components — the clickable/drill dot renderer, the comparison-mode tick and
 * label formatters, and the series-key → measure-field resolution — so the
 * component bodies stay focused on chart composition. Pure extraction: no
 * behaviour change.
 */

export interface DataPointClickPayload {
  dataPoint: any
  clickedField: string
  xValue: any
  position: { x: number; y: number }
  nativeEvent: React.MouseEvent
}

interface DrillDotOptions {
  /** Recharts dot props (cx, cy, payload, key). */
  props: any
  color: string
  drillEnabled?: boolean
  originalField?: string
  seriesKey: string
  onDataPointClick?: (payload: DataPointClickPayload) => void
}

/**
 * Render a single data-point dot. When drill is enabled and a click handler is
 * present, renders a larger clickable dot with a surface-coloured backing
 * circle to mask grid lines; otherwise a small plain dot. Returns null when the
 * point has no coordinates.
 *
 * `renderPlain` controls whether a small non-interactive dot is drawn when
 * drill is disabled (Line draws one; Area returns nothing).
 */
export function renderDrillDot({
  props,
  color,
  drillEnabled,
  originalField,
  seriesKey,
  onDataPointClick,
  renderPlain
}: DrillDotOptions & { renderPlain: boolean }): React.ReactElement | null {
  const { cx, cy, payload, key } = props
  if (cx === undefined || cy === undefined) return null

  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
    if (onDataPointClick) {
      onDataPointClick({
        dataPoint: payload,
        clickedField: originalField || seriesKey,
        xValue: payload.name,
        position: { x: event.clientX, y: event.clientY },
        nativeEvent: event
      })
    }
  }

  if (drillEnabled && onDataPointClick) {
    return (
      <g key={key}>
        {/* Background to mask grid lines - uses theme surface color */}
        <circle cx={cx} cy={cy} r={6} fill="var(--dc-surface)" style={{ pointerEvents: 'none' }} />
        {/* Visible dot with click handler */}
        <circle
          cx={cx}
          cy={cy}
          r={4}
          fill="var(--dc-surface)"
          stroke={color}
          strokeWidth={2}
          cursor="pointer"
          onClick={(e: React.MouseEvent<SVGCircleElement>) => {
            handleClick(e as unknown as React.MouseEvent)
          }}
        />
      </g>
    )
  }

  if (!renderPlain) return null

  return <circle key={key} cx={cx} cy={cy} r={3} fill={color} />
}

/**
 * Format a comparison-data X-axis value: shows the current period's date,
 * formatted to the query granularity, falling back to "Period N".
 */
function formatComparisonDate(
  displayDate: unknown,
  queryObject: any,
  xAxisField: string,
  fallbackIndex: number
): string {
  if (displayDate) {
    const granularity = getFieldGranularity(queryObject, xAxisField)
    return formatTimeValue(displayDate as any, granularity)
  }
  return `Period ${fallbackIndex + 1}`
}

/**
 * Build the comparison-mode X-axis tick formatter for time-series charts.
 * Returns undefined when not in comparison mode (no custom formatting).
 */
export function makeComparisonTickFormatter(
  hasComparisonData: boolean,
  chartData: any[],
  queryObject: any,
  xAxisField: string
): ((value: string | number, index: number) => string) | undefined {
  if (!hasComparisonData) return undefined
  return (value: string | number, index: number) => {
    const row = chartData[index]
    return formatComparisonDate(row?.__displayDate, queryObject, xAxisField, Number(value))
  }
}

/**
 * Build the comparison-mode tooltip label formatter for time-series charts.
 * Returns undefined when not in comparison mode (no custom formatting).
 */
export function makeComparisonLabelFormatter(
  hasComparisonData: boolean,
  queryObject: any,
  xAxisField: string
): ((label: any, payload: any) => string) | undefined {
  if (!hasComparisonData) return undefined
  return (label: any, payload: any) => {
    const row = payload && payload.length > 0 ? payload[0]?.payload : undefined
    return formatComparisonDate(row?.__displayDate, queryObject, xAxisField, Number(label))
  }
}

/**
 * Resolve effective stacking for the Area chart from `stackType` (new) /
 * `stacked` (legacy), disabling stacking when a right axis is present (areas on
 * different axes can't be stacked).
 */
export function resolveAreaStacking(
  displayConfig: { stackType?: string; stacked?: boolean } | undefined,
  hasRightAxis: boolean
): { effectiveShouldStack: boolean; effectiveIsPercentStack: boolean; stackOffset: 'expand' | undefined } {
  const stackType = displayConfig?.stackType ?? (displayConfig?.stacked ? 'normal' : 'none')
  const effectiveShouldStack = stackType !== 'none' && !hasRightAxis
  const effectiveIsPercentStack = stackType === 'percent' && !hasRightAxis
  return {
    effectiveShouldStack,
    effectiveIsPercentStack,
    stackOffset: effectiveIsPercentStack ? 'expand' : undefined
  }
}

/** Build a map from series display label to original measure field name. */
export function buildSeriesKeyToFieldMap(
  yAxisFields: string[],
  getFieldLabel: (field: string) => string
): Record<string, string> {
  const mapping: Record<string, string> = {}
  yAxisFields.forEach((field) => {
    mapping[getFieldLabel(field)] = field
  })
  return mapping
}

/**
 * Resolve a series key back to its original measure field, handling comparison
 * suffixes like "(Current)" / "(Prior)" and dimension prefixes ("Dim - Label").
 */
export function makeSeriesKeyResolver(
  seriesKeyToField: Record<string, string>
): (seriesKey: string) => string | undefined {
  return (seriesKey: string): string | undefined => {
    if (seriesKeyToField[seriesKey]) return seriesKeyToField[seriesKey]
    // Guard against excessive input length to prevent ReDoS
    if (seriesKey.length > 1000) return undefined
    const withoutSuffix = seriesKey.replace(/\s*\((Current|Prior)\)$/, '')
    const parts = withoutSuffix.split(' - ')
    const measureLabel = parts[parts.length - 1]
    return seriesKeyToField[measureLabel]
  }
}

/** Pick a series colour by index, preferring the palette then the defaults. */
export function getSeriesColor(colorPalette: ColorPalette | undefined, index: number): string {
  const colors = colorPalette?.colors
  return (colors && colors[index % colors.length]) || CHART_COLORS[index % CHART_COLORS.length]
}

interface LineSeriesOptions {
  seriesKeys: string[]
  colorPalette?: ColorPalette
  resolveField: (seriesKey: string) => string | undefined
  yAxisAssignment: Record<string, 'left' | 'right'>
  hoveredLegend: string | null
  connectNulls: boolean
  drillEnabled?: boolean
  onDataPointClick?: (payload: DataPointClickPayload) => void
  /** Comparison styling (omit/false → standard series). */
  hasComparisonData?: boolean
  periodLabels?: string[]
  priorPeriodStyle?: 'solid' | 'dashed' | 'dotted'
  priorPeriodOpacity?: number
}

/** Render the `<Line>` element for one resolved series (Line chart). */
function renderOneLineSeries(seriesKey: string, index: number, opts: LineSeriesOptions): React.ReactElement {
  const {
    colorPalette, resolveField, yAxisAssignment, hoveredLegend, connectNulls,
    drillEnabled, onDataPointClick, hasComparisonData, periodLabels = [],
    priorPeriodStyle = 'dashed', priorPeriodOpacity = 0.5
  } = opts

  const originalField = resolveField(seriesKey)
  const axisId = originalField && yAxisAssignment[originalField] === 'right' ? 'right' : 'left'

  const isPriorPeriod = Boolean(hasComparisonData) && isPriorPeriodSeries(seriesKey, periodLabels)
  const strokeDashArray = isPriorPeriod ? getPriorPeriodStrokeDashArray(priorPeriodStyle) : undefined
  const opacity = isPriorPeriod ? priorPeriodOpacity : 1
  const lineColor = getSeriesColor(colorPalette, index)

  let strokeOpacity = opacity
  if (hoveredLegend) strokeOpacity = hoveredLegend === seriesKey ? 1 : 0.3

  return (
    <Line
      key={seriesKey}
      type="monotone"
      dataKey={seriesKey}
      yAxisId={axisId}
      stroke={lineColor}
      strokeWidth={isPriorPeriod ? 1.5 : 2}
      strokeDasharray={strokeDashArray}
      dot={isPriorPeriod ? false : (props: any) => renderDrillDot({
        props, color: lineColor, drillEnabled, originalField, seriesKey, onDataPointClick, renderPlain: true
      })}
      activeDot={false}
      strokeOpacity={strokeOpacity}
      connectNulls={connectNulls}
    />
  )
}

/** Render all line series for the Line chart. */
export function renderLineSeries(opts: LineSeriesOptions): React.ReactElement[] {
  return opts.seriesKeys.map((seriesKey, index) => renderOneLineSeries(seriesKey, index, opts))
}

interface AreaSeriesOptions {
  seriesKeys: string[]
  colorPalette?: ColorPalette
  seriesKeyToField: Record<string, string>
  yAxisAssignment: Record<string, 'left' | 'right'>
  hoveredLegend: string | null
  connectNulls: boolean
  shouldStack: boolean
  drillEnabled?: boolean
  onDataPointClick?: (payload: DataPointClickPayload) => void
}

/** Render the `<Area>` element for one series (Area chart). */
function renderOneAreaSeries(seriesKey: string, index: number, opts: AreaSeriesOptions): React.ReactElement {
  const {
    colorPalette, seriesKeyToField, yAxisAssignment, hoveredLegend, connectNulls,
    shouldStack, drillEnabled, onDataPointClick
  } = opts

  const originalField = seriesKeyToField[seriesKey]
  const axisId = originalField && yAxisAssignment[originalField] === 'right' ? 'right' : 'left'
  const areaColor = getSeriesColor(colorPalette, index)

  let fillOpacity = 0.3
  let strokeOpacity = 1
  if (hoveredLegend) {
    const active = hoveredLegend === seriesKey
    fillOpacity = active ? 0.6 : 0.1
    strokeOpacity = active ? 1 : 0.3
  }

  return (
    <Area
      key={seriesKey}
      type="monotone"
      dataKey={seriesKey}
      yAxisId={axisId}
      stackId={shouldStack ? 'stack' : undefined}
      stroke={areaColor}
      fill={areaColor}
      fillOpacity={fillOpacity}
      strokeWidth={2}
      strokeOpacity={strokeOpacity}
      connectNulls={connectNulls}
      dot={(props: any) => renderDrillDot({
        props, color: areaColor, drillEnabled, originalField, seriesKey, onDataPointClick, renderPlain: false
      })}
      activeDot={false}
    />
  )
}

/** Render all area series for the Area chart. */
export function renderAreaSeries(opts: AreaSeriesOptions): React.ReactElement[] {
  return opts.seriesKeys.map((seriesKey, index) => renderOneAreaSeries(seriesKey, index, opts))
}

export interface TimeSeriesShape {
  chartData: any[]
  seriesKeys: string[]
  effectiveXAxisKey: string
  hasComparisonData: boolean
  periodLabels: string[]
}

/**
 * Shape raw rows for a Cartesian time-series chart. In comparison mode this
 * uses the overlay transform (aligned by period day index); otherwise the
 * standard series transform. Centralises the branch so the chart body stays
 * flat.
 */
export function buildTimeSeriesData(args: {
  data: any[]
  xAxisField: string
  yAxisFields: string[]
  seriesFields: string[]
  queryObject: any
  getFieldLabel: (field: string) => string
}): TimeSeriesShape {
  const { data, xAxisField, yAxisFields, seriesFields, queryObject, getFieldLabel } = args
  const hasComparisonData = isComparisonData(data)

  if (hasComparisonData) {
    const overlay = transformForOverlayMode(data, yAxisFields, xAxisField, getFieldLabel)
    return {
      chartData: overlay.data,
      seriesKeys: overlay.seriesKeys,
      effectiveXAxisKey: '__periodDayIndex',
      hasComparisonData,
      periodLabels: getPeriodLabels(data)
    }
  }

  const standard = transformChartDataWithSeries(data, xAxisField, yAxisFields, queryObject, seriesFields, getFieldLabel)
  return {
    chartData: standard.data,
    seriesKeys: standard.seriesKeys,
    effectiveXAxisKey: 'name',
    hasComparisonData,
    periodLabels: []
  }
}
