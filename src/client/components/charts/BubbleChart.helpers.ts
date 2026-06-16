/**
 * Co-located data/config helpers for BubbleChart (no D3 side effects here).
 */
import { formatTimeValue, getFieldGranularity, parseNumericValue, isValidNumericValue } from '../../utils/chartUtils.js'
import type { AxisFormatConfig, ChartAxisConfig, ChartDisplayConfig, CubeQuery } from '../../types.js'

export interface BubbleData {
  x: number
  xLabel?: string // Formatted label for time dimensions
  y: number
  size: number
  color?: string | number
  label: string
  series?: string
}

export interface BubbleDisplayOptions {
  showLegend: boolean
  showGrid: boolean
  showTooltip: boolean
  minBubbleSize: number
  maxBubbleSize: number
  bubbleOpacity: number
  xAxisFormat?: AxisFormatConfig
  leftYAxisFormat?: AxisFormatConfig
}

/** Resolve bubble display options with defaults from the display config. */
export function resolveBubbleDisplayOptions(
  displayConfig: ChartDisplayConfig | undefined
): BubbleDisplayOptions {
  return {
    showLegend: displayConfig?.showLegend ?? true,
    showGrid: displayConfig?.showGrid ?? true,
    showTooltip: displayConfig?.showTooltip ?? true,
    minBubbleSize: (displayConfig as any)?.minBubbleSize ?? 5,
    maxBubbleSize: (displayConfig as any)?.maxBubbleSize ?? 50,
    bubbleOpacity: (displayConfig as any)?.bubbleOpacity ?? 0.7,
    xAxisFormat: displayConfig?.xAxisFormat,
    leftYAxisFormat: displayConfig?.leftYAxisFormat
  }
}

export interface BubbleFields {
  xAxisField: string
  yAxisField: string
  seriesField: string
  sizeFieldName: string
  colorFieldName?: string
}

/** Resolve the bubble chart field names; returns null when required fields missing. */
export function resolveBubbleFields(chartConfig: ChartAxisConfig | undefined): BubbleFields | null {
  if (!chartConfig?.xAxis || !chartConfig?.yAxis || !chartConfig?.series) {
    return null
  }
  const xAxisField = Array.isArray(chartConfig.xAxis) ? chartConfig.xAxis[0] : chartConfig.xAxis
  const yAxisField = Array.isArray(chartConfig.yAxis) ? chartConfig.yAxis[0] : chartConfig.yAxis
  const seriesField = Array.isArray(chartConfig.series) ? chartConfig.series[0] : chartConfig.series
  const sizeFieldName = (Array.isArray(chartConfig.sizeField) ? chartConfig.sizeField[0] : chartConfig.sizeField) || yAxisField
  const colorFieldName = Array.isArray(chartConfig.colorField) ? chartConfig.colorField[0] : chartConfig.colorField

  if (!xAxisField || !yAxisField || !seriesField || !sizeFieldName) return null
  return { xAxisField, yAxisField, seriesField, sizeFieldName, colorFieldName }
}

/** Parse an x value to a numeric position + display label (time-dim aware). */
function resolveXValue(
  rawXValue: unknown,
  isTimeDimension: boolean,
  xGranularity: string | undefined
): { xNum: number; xLabel: string } {
  if (isTimeDimension && rawXValue) {
    const dateStr = String(rawXValue)
    let date: Date
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}[T ]/)) {
      let isoStr = dateStr
      if (dateStr.includes(' ')) {
        isoStr = dateStr.replace(' ', 'T').replace('+00', 'Z').replace(/\+\d{2}:\d{2}$/, 'Z')
      }
      if (!isoStr.endsWith('Z') && !isoStr.includes('+')) {
        isoStr = isoStr + 'Z'
      }
      date = new Date(isoStr)
    } else {
      date = new Date(dateStr)
    }
    const xNum = isNaN(date.getTime()) ? parseFloat(dateStr) : date.getTime()
    return { xNum, xLabel: formatTimeValue(rawXValue, xGranularity) }
  }

  const formattedValue = formatTimeValue(rawXValue, xGranularity) || rawXValue
  const xNum = typeof formattedValue === 'string' ? parseFloat(formattedValue) : (formattedValue as number)
  return { xNum, xLabel: String(formattedValue) }
}

/**
 * Transform query rows into bubble data, filtering out points with invalid
 * x/y coordinates or non-positive size. Mirrors the original inline map+filter.
 */
export function transformBubbleData(
  data: Record<string, any>[],
  fields: BubbleFields,
  queryObject: CubeQuery | undefined
): BubbleData[] {
  const { xAxisField, yAxisField, sizeFieldName, seriesField, colorFieldName } = fields
  const xGranularity = getFieldGranularity(queryObject, xAxisField)
  const isTimeDimension =
    queryObject?.timeDimensions?.some((td: { dimension: string }) => td.dimension === xAxisField) || false

  return data
    .map((item) => {
      const { xNum, xLabel } = resolveXValue(item[xAxisField], isTimeDimension, xGranularity)
      const yValue = parseNumericValue(item[yAxisField])
      const sizeValue = parseNumericValue(item[sizeFieldName])
      const seriesValue = item[seriesField]

      return {
        x: xNum,
        xLabel,
        y: yValue as number,
        size: sizeValue !== null ? Math.abs(sizeValue) : 0,
        color: colorFieldName ? item[colorFieldName] : seriesValue,
        series: seriesValue,
        label: `${seriesValue || 'Unknown'}`,
        isValid: isValidNumericValue(xNum) && yValue !== null && sizeValue !== null && sizeValue > 0
      }
    })
    .filter((d) => d.isValid && d.size > 0)
    .map(({ isValid: _isValid, ...rest }) => rest)
}

/** Read a CSS custom property from the document root with a fallback. */
export function getThemeColor(varName: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  return value || fallback
}

/** Resolve text + grid colours for the current theme. */
export function resolveThemeColors(isDark: boolean): { textColor: string; gridColor: string } {
  return {
    textColor: isDark
      ? getThemeColor('--dc-text-muted', '#cbd5e1')
      : getThemeColor('--dc-text-secondary', '#374151'),
    gridColor: isDark ? getThemeColor('--dc-border', '#475569') : '#9ca3af'
  }
}
