import { CHART_COLORS } from '../../utils/chartConstants.js'
import { formatTimeValue, getFieldGranularity } from '../../utils/chartUtils.js'
import type { ColorPalette } from '../../types.js'

/**
 * Co-located data-shaping helpers for RadialBarChart. The component supports a
 * config-driven format and a legacy auto-detection format; both branches are
 * isolated here so the component body stays focused on rendering. Pure
 * extraction — no behaviour change.
 */

export interface RadialDatum {
  name: string
  value: number
  fill?: string
}

export interface RadialShape {
  radialData: RadialDatum[]
  /** True when the legacy auto-detect found no usable value field. */
  noValueField?: boolean
}

function colorAt(colorPalette: ColorPalette | undefined, index: number): string {
  const colors = colorPalette?.colors
  return (colors && colors[index % colors.length]) || CHART_COLORS[index % CHART_COLORS.length]
}

function toNumber(value: unknown): number {
  return typeof value === 'string' ? parseFloat(value) : ((value as number) || 0)
}

function shapeFromChartConfig(
  data: any[],
  chartConfig: any,
  queryObject: any,
  colorPalette: ColorPalette | undefined
): RadialShape {
  const xAxisField = Array.isArray(chartConfig.xAxis) ? chartConfig.xAxis[0] : chartConfig.xAxis
  const yAxisField = Array.isArray(chartConfig.yAxis) ? chartConfig.yAxis[0] : chartConfig.yAxis
  const granularity = getFieldGranularity(queryObject, xAxisField)

  const radialData = data.map((item, index) => ({
    name: formatTimeValue(item[xAxisField], granularity) || String(item[xAxisField]) || 'Unknown',
    value: toNumber(item[yAxisField]),
    fill: colorAt(colorPalette, index)
  }))
  return { radialData }
}

/** Coerce a name value to a display label, mapping booleans to Active/Inactive. */
function toRadialName(name: unknown): string {
  if (typeof name === 'boolean') return name ? 'Active' : 'Inactive'
  if (name === 'true' || name === 'false') return name === 'true' ? 'Active' : 'Inactive'
  return String(name)
}

function shapeFromLegacy(
  data: any[],
  colorPalette: ColorPalette | undefined
): RadialShape {
  const firstRow = data[0]
  const keys = Object.keys(firstRow)

  const nameField = keys.find(key =>
    typeof firstRow[key] === 'string' ||
    key.toLowerCase().includes('name') ||
    key.toLowerCase().includes('label') ||
    key.toLowerCase().includes('category')
  ) || keys[0]

  const valueField = keys.find(key => typeof firstRow[key] === 'number' && key !== nameField) || keys[1]

  if (!valueField) {
    return { radialData: [], noValueField: true }
  }

  const radialData = data.map((item, index) => ({
    name: toRadialName(item[nameField]),
    value: toNumber(item[valueField]),
    fill: colorAt(colorPalette, index)
  }))
  return { radialData }
}

/**
 * Shape rows for the radial bar chart (config-driven or legacy auto-detect),
 * filtering out null/zero values.
 */
export function buildRadialData(
  data: any[],
  chartConfig: any,
  queryObject: any,
  colorPalette: ColorPalette | undefined
): RadialShape {
  const shaped = chartConfig?.xAxis && chartConfig?.yAxis
    ? shapeFromChartConfig(data, chartConfig, queryObject, colorPalette)
    : shapeFromLegacy(data, colorPalette)

  if (shaped.noValueField) return shaped

  return { radialData: shaped.radialData.filter(item => item.value != null && item.value !== 0) }
}
