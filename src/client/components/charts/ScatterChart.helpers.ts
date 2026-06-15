/**
 * Co-located helpers for ScatterChart.
 *
 * Pure config-resolution + data-shaping extracted from the component. No
 * behaviour change — these mirror the original inline logic exactly.
 */
import {
  formatTimeValue,
  getFieldGranularity,
  parseNumericValue,
  isValidNumericValue
} from '../../utils/chartUtils'
import { CHART_MARGINS } from '../../utils/chartConstants'
import type { AxisFormatConfig, ChartAxisConfig, ChartDisplayConfig, CubeQuery } from '../../types'

// Limit series to prevent performance issues with high-cardinality fields (e.g.,
// dates). Above this, the chart falls back to single-series mode.
const MAX_SERIES = 20

export interface ScatterRenderState {
  showLegend: boolean
  showGrid: boolean
  showTooltip: boolean
  /** Whether to render one Scatter per series group vs a single series. */
  hasSeries: boolean
  xAxisFormat?: AxisFormatConfig
  /** For scatter charts the y-axis uses the left-axis format config. */
  yAxisFormat?: AxisFormatConfig
  chartMargins: typeof CHART_MARGINS
}

/**
 * Resolve all render-time display flags, axis formats and margins for the
 * scatter chart from the display config and the transformed series keys.
 */
export function resolveScatterRenderState(
  displayConfig: ChartDisplayConfig | undefined,
  seriesKeys: string[]
): ScatterRenderState {
  const showLegendConfig = displayConfig?.showLegend ?? true
  const hasSeries = seriesKeys.length > 1 && seriesKeys.length <= MAX_SERIES
  return {
    showLegend: showLegendConfig && hasSeries,
    showGrid: displayConfig?.showGrid ?? true,
    showTooltip: displayConfig?.showTooltip ?? true,
    hasSeries,
    xAxisFormat: displayConfig?.xAxisFormat,
    yAxisFormat: displayConfig?.leftYAxisFormat,
    // Custom chart margins with extra left space for Y-axis label (40 vs 20)
    chartMargins: { ...CHART_MARGINS, left: 40 }
  }
}

export interface ScatterAxisFields {
  xAxisField: string
  yAxisField: string
  seriesFields: string[]
  /** Set when the config is invalid (no usable axis fields). */
  errorCode?: 'axisInvalid' | 'axisFields'
}

/** Resolve x/y/series fields supporting both the new and legacy config shapes. */
export function resolveScatterAxisFields(
  chartConfig: ChartAxisConfig | undefined
): ScatterAxisFields {
  let xAxisField: string
  let yAxisField: string
  let seriesFields: string[] = []

  if (chartConfig?.xAxis && chartConfig?.yAxis) {
    // New format - handle both string and array values
    xAxisField = Array.isArray(chartConfig.xAxis) ? chartConfig.xAxis[0] : chartConfig.xAxis
    yAxisField = Array.isArray(chartConfig.yAxis) ? chartConfig.yAxis[0] : chartConfig.yAxis
    const seriesConfig = chartConfig.series
    seriesFields = seriesConfig ? (Array.isArray(seriesConfig) ? seriesConfig : [seriesConfig]) : []
  } else if (chartConfig?.x && chartConfig?.y) {
    // Legacy format (adapt for scatter chart)
    xAxisField = chartConfig.x
    yAxisField = Array.isArray(chartConfig.y) ? chartConfig.y[0] : chartConfig.y
  } else {
    return { xAxisField: '', yAxisField: '', seriesFields: [], errorCode: 'axisInvalid' }
  }

  if (!xAxisField || !yAxisField) {
    return { xAxisField: '', yAxisField: '', seriesFields: [], errorCode: 'axisFields' }
  }

  return { xAxisField, yAxisField, seriesFields }
}

export interface ScatterPoint {
  x: number
  y: number
  name: string
  timeValues: Record<string, string>
  originalItem: Record<string, any>
}

/** Build the time-dimension value map for a single row (for tooltip display). */
function buildTimeValues(
  item: Record<string, any>,
  timeDimensionFields: string[],
  queryObject: CubeQuery | undefined
): Record<string, string> {
  const timeValues: Record<string, string> = {}
  timeDimensionFields.forEach((field) => {
    if (item[field]) {
      const granularity = getFieldGranularity(queryObject, field)
      timeValues[field] = formatTimeValue(item[field], granularity)
    }
  })
  return timeValues
}

/** Convert a formatted x value to a number (parses time strings via parseFloat). */
function toXNumber(item: Record<string, any>, xAxisField: string, xGranularity?: string): number {
  const xValue = formatTimeValue(item[xAxisField], xGranularity) || item[xAxisField]
  return typeof xValue === 'string' ? parseFloat(xValue) : xValue
}

export interface ScatterTransform {
  scatterData: ScatterPoint[]
  seriesGroups: Record<string, ScatterPoint[]>
}

/**
 * Transform rows into scatter points, grouping by series when configured.
 * Null x/y coordinates are filtered out. Mirrors the original two-branch logic.
 */
export function transformScatterData(
  data: Record<string, any>[],
  xAxisField: string,
  yAxisField: string,
  seriesFields: string[],
  timeDimensionFields: string[],
  queryObject: CubeQuery | undefined
): ScatterTransform {
  const xGranularity = getFieldGranularity(queryObject, xAxisField)

  if (seriesFields.length > 0) {
    const seriesField = seriesFields[0]
    const seriesGroups: Record<string, ScatterPoint[]> = {}

    data.forEach((item) => {
      const seriesValue = String(item[seriesField] || 'Default')
      if (!seriesGroups[seriesValue]) {
        seriesGroups[seriesValue] = []
      }

      const xNum = toXNumber(item, xAxisField, xGranularity)
      const yValue = parseNumericValue(item[yAxisField])

      if (isValidNumericValue(xNum) && yValue !== null) {
        seriesGroups[seriesValue].push({
          x: xNum,
          y: yValue,
          name: seriesValue,
          timeValues: buildTimeValues(item, timeDimensionFields, queryObject),
          originalItem: item
        })
      }
    })

    const scatterData = Object.keys(seriesGroups).flatMap((key) => seriesGroups[key])
    return { scatterData, seriesGroups }
  }

  // Single series scatter plot
  const scatterData = data
    .map((item) => {
      const xNum = toXNumber(item, xAxisField, xGranularity)
      const yValue = parseNumericValue(item[yAxisField])
      return {
        x: xNum,
        y: yValue as number,
        name: 'Point',
        timeValues: buildTimeValues(item, timeDimensionFields, queryObject),
        originalItem: item,
        isValid: isValidNumericValue(xNum) && yValue !== null
      }
    })
    .filter((point) => point.isValid)
    .map(({ isValid: _isValid, ...point }) => point)

  return { scatterData, seriesGroups: {} }
}
