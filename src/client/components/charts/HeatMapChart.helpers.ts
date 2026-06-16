/**
 * Co-located helpers for HeatMapChart.
 *
 * Pure colour math, field resolution, data transformation and nivo config
 * builders extracted from the component. No behaviour change.
 */
import { formatTimeValue, formatAxisValue } from '../../utils/chartUtils.js'
import type { AxisFormatConfig, ChartDisplayConfig } from '../../types.js'

/**
 * Maximum dimensions for heatmap to prevent browser lockup. 50x50 = 2500 cells.
 */
export const MAX_HEATMAP_ROWS = 50
export const MAX_HEATMAP_COLS = 50

/** Parse color string (hex or rgb) to RGB values. */
export function parseColor(color: string): { r: number; g: number; b: number } | null {
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    return {
      r: parseInt(hex.substring(0, 2), 16),
      g: parseInt(hex.substring(2, 4), 16),
      b: parseInt(hex.substring(4, 6), 16),
    }
  }

  const rgbMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    }
  }

  return null
}

/** Relative luminance of a color (0 black .. 1 white) per WCAG. */
export function getLuminance(color: string): number {
  const rgb = parseColor(color)
  if (!rgb) return 0.5 // Default to mid-gray if parsing fails

  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255

  const rLinear = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
  const gLinear = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
  const bLinear = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)

  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear
}

/** Contrasting text color (white or dark) based on a background color. */
export function getContrastingTextColor(bgColor: string): string {
  const luminance = getLuminance(bgColor)
  return luminance < 0.4 ? '#ffffff' : '#1f2937'
}

interface HeatMapDatum {
  x: string
  y: number | null
}

interface HeatMapSerie {
  id: string
  data: HeatMapDatum[]
}

export interface HeatMapTransformResult {
  data: HeatMapSerie[]
  truncated: boolean
  originalRows: number
  originalCols: number
}

/**
 * Transform drizzle-cube flat query results to nivo heatmap format.
 *
 * Groups rows by the Y dimension, sorts X chronologically when possible, and
 * truncates to MAX_HEATMAP_ROWS x MAX_HEATMAP_COLS to prevent browser lockup.
 */
export function transformToHeatMapFormat(
  data: Record<string, unknown>[],
  xAxisField: string | undefined,
  yAxisField: string | undefined,
  valueField: string | undefined,
  xGranularity?: string,
  yGranularity?: string
): HeatMapTransformResult {
  if (!xAxisField || !yAxisField || !valueField) {
    return { data: [], truncated: false, originalRows: 0, originalCols: 0 }
  }

  const groupedByY = new Map<string, Map<string, number>>()
  const allXValues = new Set<string>()
  const xValueOriginals = new Map<string, unknown>()

  for (const row of data) {
    const rawYValue = row[yAxisField]
    const rawXValue = row[xAxisField]

    const yValue = formatTimeValue(rawYValue, yGranularity) || String(rawYValue ?? '(empty)')
    const xValue = formatTimeValue(rawXValue, xGranularity) || String(rawXValue ?? '(empty)')
    const value = Number(row[valueField]) || 0

    allXValues.add(xValue)
    if (!xValueOriginals.has(xValue)) {
      xValueOriginals.set(xValue, rawXValue)
    }

    if (!groupedByY.has(yValue)) {
      groupedByY.set(yValue, new Map())
    }
    groupedByY.get(yValue)!.set(xValue, value)
  }

  const xValueArray = Array.from(allXValues).sort((a, b) => {
    const origA = xValueOriginals.get(a)
    const origB = xValueOriginals.get(b)
    if (typeof origA === 'string' && typeof origB === 'string' &&
        origA.match(/^\d{4}-\d{2}-\d{2}/) && origB.match(/^\d{4}-\d{2}-\d{2}/)) {
      return origA.localeCompare(origB)
    }
    return a.localeCompare(b)
  })

  const originalRows = groupedByY.size
  const originalCols = xValueArray.length
  const truncated = originalRows > MAX_HEATMAP_ROWS || originalCols > MAX_HEATMAP_COLS

  const limitedXValues = xValueArray.slice(0, MAX_HEATMAP_COLS)

  const result: HeatMapSerie[] = []
  let rowCount = 0
  for (const [yValue, xMap] of groupedByY) {
    if (rowCount >= MAX_HEATMAP_ROWS) break
    result.push({
      id: yValue,
      data: limitedXValues.map((x) => ({ x, y: xMap.get(x) ?? null })),
    })
    rowCount++
  }

  return { data: result, truncated, originalRows, originalCols }
}

/** Coerce an axis config value (string | array | undefined) to a single field. */
export function firstField(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined
  return Array.isArray(value) ? value[0] : value
}

export interface HeatMapDisplayOptions {
  showLabels: boolean
  cellShape: 'rect' | 'circle'
  showLegend: boolean
  xAxisFormat?: AxisFormatConfig
  yAxisFormat?: AxisFormatConfig
  valueFormat?: AxisFormatConfig
}

/** Resolve heatmap display options from the (loosely-typed) display config. */
export function resolveHeatMapDisplayOptions(
  displayConfig: ChartDisplayConfig | undefined
): HeatMapDisplayOptions {
  const cfg = displayConfig as Record<string, unknown> | undefined
  return {
    showLabels: (cfg?.showLabels as boolean) ?? false,
    cellShape: (cfg?.cellShape as 'rect' | 'circle') ?? 'rect',
    showLegend: (cfg?.showLegend as boolean) ?? true,
    xAxisFormat: cfg?.xAxisFormat as AxisFormatConfig | undefined,
    yAxisFormat: cfg?.yAxisFormat as AxisFormatConfig | undefined,
    valueFormat: cfg?.valueFormat as AxisFormatConfig | undefined,
  }
}

/** Build an axis `format` fn that applies the given axis format config (or none). */
export function makeAxisFormatter(
  format: AxisFormatConfig | undefined
): ((v: string | number) => string) | undefined {
  if (!format) return undefined
  return (v) => {
    const num = parseFloat(String(v))
    return isNaN(num) ? String(v) : formatAxisValue(num, format)
  }
}

/** Resolve the heatmap value formatter (custom format or nivo default). */
export function makeValueFormatter(
  valueFormat: AxisFormatConfig | undefined
): ((v: number) => string) | string {
  return valueFormat ? (v: number) => formatAxisValue(v, valueFormat) : '>-.2s'
}

/** Sequential colours config for nivo; falls back to a built-in scheme. */
export function resolveHeatMapColors(colors: string[]):
  | { type: 'sequential'; colors: [string, string] }
  | { type: 'sequential'; scheme: 'greens' } {
  return colors.length >= 2
    ? { type: 'sequential', colors: [colors[0], colors[colors.length - 1]] as [string, string] }
    : { type: 'sequential', scheme: 'greens' }
}

/** Default sequential blue gradient when no palette gradient is supplied. */
export const DEFAULT_HEATMAP_COLORS = [
  '#eff3ff', // lightest blue
  '#c6dbef',
  '#9ecae1',
  '#6baed6',
  '#3182bd',
  '#08519c', // darkest blue
]
