import { Fragment } from 'react'
import { YAxis, Line, Legend } from 'recharts'
import { CHART_MARGINS } from '../../utils/chartConstants.js'
import { formatAxisValue } from '../../utils/chartUtils.js'
import { parseTargetValues, spreadTargetValues } from '../../utils/targetUtils.js'
import type { AxisFormatConfig } from '../../types.js'

/**
 * Shared scaffolding for the Cartesian recharts charts (bar, line, area).
 *
 * These charts duplicated the same dual-Y-axis derivation, chart margins,
 * target-line overlay, and the left/right `<YAxis>` JSX. The pure helpers and
 * recharts render-helpers here own that shared setup. Render-helpers return
 * recharts elements (inside a fragment) and are embedded directly in the chart
 * children — recharts flattens fragments when discovering axes/series, exactly
 * as it already does for the inline target-line fragment.
 */

export interface DualAxisInfo {
  /** True when at least one measure is assigned to the right axis */
  hasRightAxis: boolean
  /** Measure fields rendered against the left axis */
  leftAxisFields: string[]
  /** Measure fields rendered against the right axis */
  rightAxisFields: string[]
}

/** Derive left/right axis membership from per-measure axis assignments. */
export function getDualAxisInfo(
  yAxisFields: string[],
  yAxisAssignment: Record<string, 'left' | 'right'>
): DualAxisInfo {
  const hasRightAxis = yAxisFields.some((field) => yAxisAssignment[field] === 'right')
  const leftAxisFields = yAxisFields.filter((f) => (yAxisAssignment[f] || 'left') === 'left')
  const rightAxisFields = yAxisFields.filter((f) => yAxisAssignment[f] === 'right')
  return { hasRightAxis, leftAxisFields, rightAxisFields }
}

/** Chart margins with extra room for the Y-axis label(s). */
export function getYAxisChartMargins(hasRightAxis: boolean) {
  return {
    ...CHART_MARGINS,
    left: 40, // Space for left Y-axis label
    right: hasRightAxis ? 40 : 20 // Extra space for right Y-axis label if needed
  }
}

/**
 * Apply target values (single or comma-separated spread) onto chart data,
 * returning the spread targets plus data enhanced with a `__target` key.
 */
export function withTargetData<T extends Record<string, any>>(
  chartData: T[],
  target: string | undefined
): { spreadTargets: number[]; enhancedChartData: T[] } {
  const targetValues = parseTargetValues(target || '')
  const spreadTargets = spreadTargetValues(targetValues, chartData.length)
  const enhancedChartData = spreadTargets.length > 0
    ? chartData.map((dataPoint, index) => ({ ...dataPoint, __target: spreadTargets[index] || null }))
    : chartData
  return { spreadTargets, enhancedChartData }
}

/**
 * Render the left + optional right `<YAxis>`. Returns recharts elements in a
 * fragment for embedding directly in the chart children. Positional args keep
 * the (otherwise identical) call sites in each chart down to a single line.
 *
 * @param isPercentStack when true (area/bar percent stacking) the left axis shows 0–100%
 */
export function renderDualYAxes(
  { hasRightAxis, leftAxisFields, rightAxisFields }: DualAxisInfo,
  getFieldLabel: (field: string) => string,
  leftYAxisFormat?: AxisFormatConfig,
  rightYAxisFormat?: AxisFormatConfig,
  isPercentStack = false
) {
  return (
    <Fragment>
      <YAxis
        yAxisId="left"
        orientation="left"
        tick={{ fontSize: 12 }}
        tickFormatter={
          isPercentStack
            ? (v) => `${(v * 100).toFixed(0)}%`
            : leftYAxisFormat
              ? (value) => formatAxisValue(value, leftYAxisFormat)
              : undefined
        }
        domain={isPercentStack ? [0, 1] : undefined}
        label={
          isPercentStack
            ? undefined
            : leftAxisFields.length > 0
              ? {
                  value: leftYAxisFormat?.label || getFieldLabel(leftAxisFields[0]),
                  angle: -90,
                  position: 'left',
                  style: { textAnchor: 'middle', fontSize: '12px' }
                }
              : undefined
        }
      />
      {hasRightAxis && (
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 12 }}
          tickFormatter={rightYAxisFormat ? (value) => formatAxisValue(value, rightYAxisFormat) : undefined}
          label={
            rightAxisFields.length > 0
              ? {
                  value: rightYAxisFormat?.label || getFieldLabel(rightAxisFields[0]),
                  angle: 90,
                  position: 'right',
                  style: { textAnchor: 'middle', fontSize: '12px' }
                }
              : undefined
          }
        />
      )}
    </Fragment>
  )
}

/**
 * Render the target overlay: a white backing line plus a purple dashed line
 * on top (shared by bar, line, area). Returns null when there are no targets.
 */
export function renderChartTargetLines(spreadTargets: number[]) {
  if (spreadTargets.length === 0) return null
  return (
    <Fragment>
      {/* White background line */}
      <Line
        type="monotone"
        dataKey="__target"
        yAxisId="left"
        stroke="#ffffff"
        strokeWidth={2}
        dot={false}
        activeDot={false}
        connectNulls={false}
      />
      {/* Grey dashed line on top */}
      <Line
        type="monotone"
        dataKey="__target"
        yAxisId="left"
        name="Target"
        stroke="#8B5CF6"
        strokeWidth={2}
        strokeDasharray="2 3"
        dot={false}
        activeDot={false}
        connectNulls={false}
      />
    </Fragment>
  )
}

interface CartesianTooltipOptions {
  leftYAxisFormat?: AxisFormatConfig
  rightYAxisFormat?: AxisFormatConfig
  yAxisAssignment: Record<string, 'left' | 'right'>
  /** Maps a series key (display label) back to its original measure field. */
  resolveField: (name: string) => string | undefined
  /** When true, values render as percentages (area/bar percent stacking). */
  isPercentStack?: boolean
}

/**
 * Build the value/name tooltip formatter shared by the Cartesian charts.
 * Handles null values, the target series, percent stacking, and per-series
 * left/right axis format selection.
 */
export function makeCartesianTooltipFormatter({
  leftYAxisFormat,
  rightYAxisFormat,
  yAxisAssignment,
  resolveField,
  isPercentStack = false
}: CartesianTooltipOptions) {
  return (value: any, name: any): [any, any] => {
    if (value === null || value === undefined) {
      return ['No data', name]
    }
    if (name === 'Target') {
      // Use left Y-axis format for target values
      return [formatAxisValue(value, leftYAxisFormat), 'Target Value']
    }
    if (isPercentStack && typeof value === 'number') {
      return [`${(value * 100).toFixed(1)}%`, name]
    }
    // Determine which axis format to use based on series name
    const originalField = resolveField(name)
    const axisId = originalField && yAxisAssignment[originalField] === 'right' ? 'right' : 'left'
    const formatConfig = axisId === 'right' ? rightYAxisFormat : leftYAxisFormat
    return [formatAxisValue(value, formatConfig), name]
  }
}

/**
 * Render the hover-aware bottom legend shared by the Cartesian charts.
 * Returns null when the legend is hidden. `iconType` / `paddingTop` differ
 * per chart (rect+10 for area, rect+25 for bar, line+25 for line).
 */
export function renderHoverLegend({
  show,
  iconType,
  paddingTop,
  onHover,
  onLeave
}: {
  show: boolean
  iconType: 'rect' | 'line' | 'circle'
  paddingTop: number
  onHover: (dataKey: string) => void
  onLeave: () => void
}) {
  if (!show) return null
  return (
    <Legend
      wrapperStyle={{ fontSize: '12px', paddingTop: `${paddingTop}px` }}
      iconType={iconType}
      iconSize={8}
      layout="horizontal"
      align="center"
      verticalAlign="bottom"
      onMouseEnter={(o) => onHover(String(o.dataKey || ''))}
      onMouseLeave={onLeave}
    />
  )
}
