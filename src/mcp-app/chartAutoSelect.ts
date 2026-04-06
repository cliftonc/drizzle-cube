/**
 * Auto-select the best chart type based on query shape and result data.
 *
 * Operates on raw load results + query metadata (no CubeProvider context needed).
 */

import type { ChartType } from '../client/types'

/** Chart types available in the MCP App (subset of full ChartType) */
export type McpChartType = ChartType

export interface ChartSelection {
  chartType: McpChartType
  xAxis: string[]
  yAxis: string[]
  series: string[]
}

interface LoadQuery {
  measures?: string[]
  dimensions?: string[]
  timeDimensions?: Array<{
    dimension: string
    granularity?: string
    dateRange?: string | string[]
  }>
  filters?: unknown[]
  order?: Record<string, string>
  limit?: number
}

/** Chart types shown in the MCP App switcher */
export const SUPPORTED_CHARTS: McpChartType[] = [
  'bar', 'line', 'area', 'pie', 'scatter', 'kpiNumber', 'table', 'treemap',
  'radar', 'radialBar', 'bubble', 'funnel', 'waterfall', 'gauge',
  'heatmap', 'sankey', 'sunburst', 'boxPlot', 'activityGrid',
  'kpiDelta', 'kpiText', 'candlestick', 'measureProfile',
]

function getMeasures(query: LoadQuery): string[] {
  return query.measures || []
}

function getDimensions(query: LoadQuery): string[] {
  return query.dimensions || []
}

function getChartTimeDimensions(query: LoadQuery): string[] {
  return query.timeDimensions
    ?.filter(timeDimension => Boolean(timeDimension.granularity))
    .map(timeDimension => timeDimension.dimension) || []
}

function getAllTimeDimensions(query: LoadQuery): string[] {
  return query.timeDimensions?.map(timeDimension => timeDimension.dimension) || []
}

function dedupeFields(fields: string[]): string[] {
  const seen = new Set<string>()

  return fields.filter((field) => {
    if (!field || seen.has(field)) return false
    seen.add(field)
    return true
  })
}

function getRemainingRowKeys(data: any[], existingFields: string[]): string[] {
  const seen = new Set(existingFields)
  const remainingKeys: string[] = []

  for (const row of data) {
    if (!row || typeof row !== 'object') continue

    for (const key of Object.keys(row)) {
      if (seen.has(key)) continue
      seen.add(key)
      remainingKeys.push(key)
    }
  }

  return remainingKeys
}

function getTableColumns(query: LoadQuery, data: any[]): string[] {
  const baseColumns = dedupeFields([
    ...getDimensions(query),
    ...getAllTimeDimensions(query),
    ...getMeasures(query),
  ])

  return [...baseColumns, ...getRemainingRowKeys(data, baseColumns)]
}

function getDefaultChartAxes(query: LoadQuery): Omit<ChartSelection, 'chartType'> {
  const measures = getMeasures(query)
  const dimensions = getDimensions(query)
  const timeDimensions = getChartTimeDimensions(query)
  const xAxis: string[] = []
  const series: string[] = []

  if (timeDimensions.length > 0) {
    xAxis.push(timeDimensions[0])
  } else if (dimensions.length > 0) {
    xAxis.push(dimensions[0])
    series.push(...dimensions.slice(1))
  }

  return {
    xAxis,
    yAxis: [...measures],
    series,
  }
}

/**
 * Check if a chart type is available for the given query shape
 */
export function isChartAvailable(chartType: McpChartType, query: LoadQuery, rowCount: number): boolean {
  const measures = getMeasures(query)
  const dimensions = getDimensions(query)
  const timeDims = getChartTimeDimensions(query)
  const hasMeasure = measures.length > 0
  const hasDimension = dimensions.length > 0
  const hasTimeDim = timeDims.length > 0

  switch (chartType) {
    case 'table':
    case 'markdown':
      return true
    case 'kpiNumber':
    case 'kpiDelta':
    case 'kpiText':
    case 'gauge':
    case 'measureProfile':
      return hasMeasure
    case 'bar':
    case 'line':
    case 'area':
    case 'waterfall':
    case 'boxPlot':
    case 'candlestick':
      return hasMeasure && (hasDimension || hasTimeDim)
    case 'pie':
    case 'radialBar':
    case 'sunburst':
      return hasMeasure && hasDimension && rowCount <= 20
    case 'scatter':
    case 'bubble':
      return hasMeasure && (hasDimension || hasTimeDim)
    case 'treemap':
    case 'funnel':
      return hasMeasure && hasDimension
    case 'radar':
      return hasMeasure && hasDimension
    case 'heatmap':
      return hasMeasure && hasDimension
    case 'sankey':
      return hasMeasure && dimensions.length >= 2
    case 'activityGrid':
      return hasMeasure && hasTimeDim
    default:
      return true
  }
}

/**
 * Select the best chart type based on query + data shape
 */
export function autoSelectChartType(query: LoadQuery, data: any[]): McpChartType {
  const measures = getMeasures(query)
  const dimensions = getDimensions(query)
  const timeDims = getChartTimeDimensions(query)
  const rowCount = data.length

  if (measures.length >= 1 && dimensions.length === 0 && timeDims.length === 0 && rowCount <= 1) {
    // Single aggregate value → KPI
    return 'kpiNumber'
  }

  if (timeDims.length > 0 && measures.length >= 1) {
    // Time series → line
    return 'line'
  }

  if (dimensions.length > 0 && measures.length >= 1) {
    if (rowCount <= 10 && measures.length === 1 && dimensions.length === 1) {
      // Few categories, single measure → pie
      return 'pie'
    }

    if (rowCount <= 30) {
      // Moderate categories → bar
      return 'bar'
    }

    // Many rows → table
    return 'table'
  }

  return 'table'
}

export function deriveChartConfig(query: LoadQuery, data: any[], chartType: McpChartType): ChartSelection {
  if (chartType === 'table') {
    return {
      chartType,
      xAxis: getTableColumns(query, data),
      yAxis: [],
      series: [],
    }
  }

  return {
    chartType,
    ...getDefaultChartAxes(query),
  }
}

export function autoSelectChart(query: LoadQuery, data: any[]): ChartSelection {
  return deriveChartConfig(query, data, autoSelectChartType(query, data))
}
