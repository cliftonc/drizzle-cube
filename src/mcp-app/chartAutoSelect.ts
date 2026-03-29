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

/**
 * Check if a chart type is available for the given query shape
 */
export function isChartAvailable(chartType: McpChartType, query: LoadQuery, rowCount: number): boolean {
  const measures = query.measures || []
  const dimensions = query.dimensions || []
  const timeDims = query.timeDimensions?.filter(td => td.granularity) || []
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
export function autoSelectChart(query: LoadQuery, data: any[]): ChartSelection {
  const measures = query.measures || []
  const dimensions = query.dimensions || []
  const timeDims = query.timeDimensions?.filter(td => td.granularity) || []
  const rowCount = data.length

  // Build axis config
  const yAxis = [...measures]
  const xAxis: string[] = []
  const series: string[] = []

  // Determine x-axis: prefer time dimension, then first dimension
  if (timeDims.length > 0) {
    xAxis.push(timeDims[0].dimension)
  } else if (dimensions.length > 0) {
    xAxis.push(dimensions[0])
    // Extra dimensions become series
    for (let i = 1; i < dimensions.length; i++) {
      series.push(dimensions[i])
    }
  }

  // Chart type selection
  let chartType: McpChartType

  if (measures.length >= 1 && dimensions.length === 0 && timeDims.length === 0 && rowCount <= 1) {
    // Single aggregate value → KPI
    chartType = 'kpiNumber'
  } else if (timeDims.length > 0 && measures.length >= 1) {
    // Time series → line
    chartType = 'line'
  } else if (dimensions.length > 0 && measures.length >= 1) {
    if (rowCount <= 10 && measures.length === 1 && dimensions.length === 1) {
      // Few categories, single measure → pie
      chartType = 'pie'
    } else if (rowCount <= 30) {
      // Moderate categories → bar
      chartType = 'bar'
    } else {
      // Many rows → table
      chartType = 'table'
    }
  } else {
    chartType = 'table'
  }

  return { chartType, xAxis, yAxis, series }
}
