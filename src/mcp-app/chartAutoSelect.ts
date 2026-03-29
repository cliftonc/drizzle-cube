/**
 * Auto-select the best chart type based on query shape and result data.
 *
 * Operates on raw load results + query metadata (no CubeProvider context needed).
 */

export type McpChartType = 'bar' | 'line' | 'area' | 'pie' | 'scatter' | 'kpiNumber' | 'table' | 'treemap'

export interface ChartSelection {
  chartType: McpChartType
  xAxis: string | undefined
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

/** All supported chart types in the MCP App */
export const SUPPORTED_CHARTS: McpChartType[] = [
  'bar', 'line', 'area', 'pie', 'scatter', 'kpiNumber', 'table', 'treemap'
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
      return true
    case 'kpiNumber':
      return hasMeasure
    case 'bar':
    case 'line':
    case 'area':
      return hasMeasure && (hasDimension || hasTimeDim)
    case 'pie':
      return hasMeasure && hasDimension && rowCount <= 20
    case 'scatter':
      return hasMeasure && (hasDimension || hasTimeDim)
    case 'treemap':
      return hasMeasure && hasDimension
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
  let xAxis: string | undefined
  const series: string[] = []

  // Determine x-axis: prefer time dimension, then first dimension
  if (timeDims.length > 0) {
    xAxis = timeDims[0].dimension
  } else if (dimensions.length > 0) {
    xAxis = dimensions[0]
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
