/**
 * Co-located helpers for TreeMapChart.
 *
 * Pure data-shaping + legend computation extracted from the component. No
 * behaviour change — mirrors the original inline logic exactly.
 */
import { scaleQuantize, scaleOrdinal } from 'd3'
import { CHART_COLORS, CHART_COLORS_GRADIENT } from '../../utils/chartConstants.js'
import { formatTimeValue, getFieldGranularity, formatAxisValue } from '../../utils/chartUtils.js'
import type { AxisFormatConfig, ChartAxisConfig, ColorPalette, CubeQuery } from '../../types.js'

export interface TreemapDatum {
  name: string
  size: number
  fill?: string
  series?: string
  // Index signature so the rows satisfy recharts' Treemap data + drill payloads
  [key: string]: unknown
}

/** First element of a config field that may be a string, string[] or undefined. */
function pickField(value: string | string[] | undefined): string {
  if (!value) return ''
  return Array.isArray(value) ? value[0] : value
}

/** Coerce a possibly-string numeric cell to a number (NaN-safe via fallback). */
function toNumber(value: unknown): number {
  return typeof value === 'string' ? parseFloat(value) : ((value as number) || 0)
}

/** Numeric value of a series cell (string or number), used for colour scaling. */
function seriesNumber(value: unknown): number {
  return typeof value === 'string' ? parseFloat(value) : (value as number)
}

export interface TreemapBuildResult {
  treemapData: TreemapDatum[]
  isNumericSeries: boolean
  seriesField?: string
}

/** Build treemap rows from the new (configured) chart config format. */
function buildFromConfig(
  data: Record<string, any>[],
  chartConfig: ChartAxisConfig,
  queryObject: CubeQuery | undefined,
  colorPalette: ColorPalette | undefined
): TreemapBuildResult {
  const xAxisField = pickField(chartConfig.xAxis)
  const yAxisField = pickField(chartConfig.yAxis)
  const seriesField = Array.isArray(chartConfig.series) ? chartConfig.series[0] : chartConfig.series
  const granularity = getFieldGranularity(queryObject, xAxisField)

  const nameOf = (item: Record<string, any>) =>
    formatTimeValue(item[xAxisField], granularity) || String(item[xAxisField]) || 'Unknown'

  if (!seriesField) {
    // No series grouping - use index-based colors
    const treemapData = data.map((item, index) => ({
      name: nameOf(item),
      size: toNumber(item[yAxisField]),
      fill: (colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) ||
        CHART_COLORS[index % CHART_COLORS.length]
    }))
    return { treemapData, isNumericSeries: false, seriesField }
  }

  // Check if series field is numeric for color scaling
  const seriesValues = data
    .map((item) => seriesNumber(item[seriesField]))
    .filter((val) => !isNaN(val))
  const isNumericSeries =
    seriesValues.length === data.length && seriesValues.every((val) => typeof val === 'number')

  if (isNumericSeries) {
    const colorScale = scaleQuantize<string>()
      .domain([Math.min(...seriesValues), Math.max(...seriesValues)])
      .range(CHART_COLORS_GRADIENT)
    const treemapData = data.map((item) => ({
      name: nameOf(item),
      size: toNumber(item[yAxisField]),
      fill: colorScale(seriesNumber(item[seriesField])),
      series: String(item[seriesField])
    }))
    return { treemapData, isNumericSeries, seriesField }
  }

  const uniqueSeriesValues = [...new Set(data.map((item) => String(item[seriesField])))]
  const colorScale = scaleOrdinal<string>()
    .domain(uniqueSeriesValues)
    .range(colorPalette?.colors || CHART_COLORS)
  const treemapData = data.map((item) => ({
    name: nameOf(item),
    size: toNumber(item[yAxisField]),
    fill: colorScale(String(item[seriesField])),
    series: String(item[seriesField])
  }))
  return { treemapData, isNumericSeries, seriesField }
}

/** Resolve a friendly name for a legacy/auto-detected row. */
function legacyName(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'Active' : 'Inactive'
  if (value === 'true' || value === 'false') return value === 'true' ? 'Active' : 'Inactive'
  return String(value)
}

/** Build treemap rows by auto-detecting name/size fields (legacy format). */
function buildFromAutoDetect(
  data: Record<string, any>[],
  colorPalette: ColorPalette | undefined
): TreemapBuildResult | null {
  const firstRow = data[0]
  const keys = Object.keys(firstRow)

  const nameField =
    keys.find(
      (key) =>
        typeof firstRow[key] === 'string' ||
        key.toLowerCase().includes('name') ||
        key.toLowerCase().includes('label') ||
        key.toLowerCase().includes('category')
    ) || keys[0]

  const sizeField =
    keys.find((key) => key.toLowerCase().includes('size')) ||
    keys.find((key) => typeof firstRow[key] === 'number' && key !== nameField) ||
    keys[1]

  if (!sizeField) return null

  const treemapData = data.map((item, index) => ({
    name: legacyName(item[nameField]),
    size: toNumber(item[sizeField]),
    fill: (colorPalette?.colors && colorPalette.colors[index % colorPalette.colors.length]) ||
      CHART_COLORS[index % CHART_COLORS.length]
  }))
  return { treemapData, isNumericSeries: false, seriesField: undefined }
}

/**
 * Build treemap data (config or auto-detect), then drop non-positive sizes.
 * Returns `null` when the legacy path can't find a usable size field.
 */
export function buildTreemapData(
  data: Record<string, any>[],
  chartConfig: ChartAxisConfig | undefined,
  queryObject: CubeQuery | undefined,
  colorPalette: ColorPalette | undefined
): TreemapBuildResult | null {
  const result =
    chartConfig?.xAxis && chartConfig?.yAxis
      ? buildFromConfig(data, chartConfig, queryObject, colorPalette)
      : buildFromAutoDetect(data, colorPalette)

  if (!result) return null

  return {
    ...result,
    treemapData: result.treemapData.filter((item) => item.size != null && item.size > 0)
  }
}

/** Min/max of the (numeric) series field across the raw rows. */
export function seriesMinMax(
  data: Record<string, any>[],
  seriesField: string
): { min: number; max: number } {
  const values = data.map((item) => seriesNumber(item[seriesField]))
  return { min: Math.min(...values), max: Math.max(...values) }
}

/** Format a numeric value with the optional axis format (or `.toFixed(2)`). */
export function formatSeriesValue(value: number, format: AxisFormatConfig | undefined): string {
  return format ? formatAxisValue(value, format) : value.toFixed(2)
}

export interface LegendEntry {
  value: string
  type: 'rect'
  color: string
}

/**
 * Build the legend entries for the treemap: a gradient ramp for numeric series,
 * or discrete swatches for categorical series. Empty when not applicable.
 */
export function buildTreemapLegend(
  data: Record<string, any>[],
  treemapData: TreemapDatum[],
  showLegend: boolean,
  seriesField: string | undefined,
  isNumericSeries: boolean,
  leftYAxisFormat: AxisFormatConfig | undefined
): LegendEntry[] {
  if (!showLegend || !seriesField) return []

  if (isNumericSeries) {
    const { min, max } = seriesMinMax(data, seriesField)
    return CHART_COLORS_GRADIENT.map((color, index) => {
      const ratio = index / (CHART_COLORS_GRADIENT.length - 1)
      const value = min + (max - min) * ratio
      return { value: formatSeriesValue(value, leftYAxisFormat), type: 'rect' as const, color }
    })
  }

  const uniqueSeries = [...new Set(treemapData.map((item) => item.series).filter(Boolean))]
  if (uniqueSeries.length > 1) {
    return uniqueSeries.map((series, index) => ({
      value: series as string,
      type: 'rect' as const,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }))
  }
  return []
}

/** Adjust the outer container height to make room for a legend, if present. */
export function adjustHeightForLegend(
  height: string | number,
  hasLegend: boolean
): string | number {
  if (!hasLegend) return height
  if (typeof height === 'string' && height.includes('%')) return height
  if (typeof height === 'number') return height + 60
  return `calc(${height} + 60px)`
}
