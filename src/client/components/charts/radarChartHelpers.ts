import { transformChartDataWithSeries, formatTimeValue, getFieldGranularity } from '../../utils/chartUtils.js'

/**
 * Co-located data-shaping helpers for RadarChart. The component supports a
 * config-driven format and a legacy auto-detection format; both branches are
 * isolated here so the component body stays focused on rendering. Pure
 * extraction — no behaviour change.
 */

export interface RadarShape {
  radarData: any[]
  seriesKeys: string[]
  /** True when no numeric value fields could be found (legacy auto-detect). */
  noNumericFields?: boolean
}

function shapeFromChartConfig(
  data: any[],
  chartConfig: any,
  queryObject: any
): RadarShape {
  const xAxisField = Array.isArray(chartConfig.xAxis) ? chartConfig.xAxis[0] : chartConfig.xAxis
  const yAxisFields = Array.isArray(chartConfig.yAxis) ? chartConfig.yAxis : [chartConfig.yAxis]
  const seriesFields = chartConfig.series || []

  const { data: radarData, seriesKeys } = transformChartDataWithSeries(
    data,
    xAxisField,
    yAxisFields,
    queryObject,
    seriesFields
  )
  return { radarData, seriesKeys }
}

function toNumber(value: unknown): number {
  return typeof value === 'string' ? parseFloat(value) : ((value as number) || 0)
}

function shapeFromLegacy(data: any[], queryObject: any): RadarShape {
  const firstRow = data[0]
  const keys = Object.keys(firstRow)

  const subjectField = keys.find(key =>
    typeof firstRow[key] === 'string' ||
    key.toLowerCase().includes('subject') ||
    key.toLowerCase().includes('name') ||
    key.toLowerCase().includes('category')
  ) || keys[0]

  const valueFields = keys.filter(key => typeof firstRow[key] === 'number' && key !== subjectField)

  if (valueFields.length === 0) {
    return { radarData: [], seriesKeys: [], noNumericFields: true }
  }

  if (subjectField) {
    const granularity = getFieldGranularity(queryObject, subjectField)
    const radarData = data.map(item => {
      const transformedItem: any = {
        name: formatTimeValue(item[subjectField], granularity) || String(item[subjectField]) || 'Unknown'
      }
      valueFields.forEach(field => {
        const displayName = field.split('.').pop() || field
        transformedItem[displayName] = toNumber(item[field])
      })
      return transformedItem
    })
    return { radarData, seriesKeys: valueFields.map(field => field.split('.').pop() || field) }
  }

  const radarData = data.map(item => ({
    name: String(item[keys[0]] || 'Unknown'),
    value: toNumber(item[valueFields[0]])
  }))
  return { radarData, seriesKeys: ['value'] }
}

/** Shape rows for the radar chart via config-driven or legacy auto-detection. */
export function buildRadarData(data: any[], chartConfig: any, queryObject: any): RadarShape {
  if (chartConfig?.xAxis && chartConfig?.yAxis) {
    return shapeFromChartConfig(data, chartConfig, queryObject)
  }
  return shapeFromLegacy(data, queryObject)
}
