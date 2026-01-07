/**
 * Pivot utilities for DataTable time dimension pivoting
 *
 * When a query includes a time dimension with granularity, transforms flat data
 * into a pivoted structure with time periods as columns.
 */

import type { CubeQuery, CubeMeta } from '../types'
import { formatTimeValue } from './chartUtils'

/**
 * Derives ordered column list from a CubeQuery object.
 * Order: dimensions, timeDimensions (as field names), measures
 *
 * @param queryObject The CubeQuery object
 * @returns Array of field names in order
 */
export function getOrderedColumnsFromQuery(queryObject?: CubeQuery): string[] {
  if (!queryObject) return []

  const columns: string[] = []

  // Add regular dimensions first
  if (queryObject.dimensions) {
    columns.push(...queryObject.dimensions)
  }

  // Add time dimensions
  if (queryObject.timeDimensions) {
    queryObject.timeDimensions.forEach(td => {
      if (!columns.includes(td.dimension)) {
        columns.push(td.dimension)
      }
    })
  }

  // Add measures last
  if (queryObject.measures) {
    columns.push(...queryObject.measures)
  }

  return columns
}

/**
 * Configuration for pivoting based on query structure
 */
export interface PivotConfig {
  /** Time dimension field name (e.g., "Sales.date") */
  timeDimension: string
  /** Time granularity (e.g., "month", "day", "year") */
  granularity: string
  /** Non-time dimension fields */
  dimensions: string[]
  /** Measure fields */
  measures: string[]
}

/**
 * Column definition for pivoted table
 */
export interface PivotColumn {
  /** Column key for data access */
  key: string
  /** Display label for column header */
  label: string
  /** Whether this is a time column (vs row identifier column) */
  isTimeColumn: boolean
  /** Whether this is the measure column */
  isMeasureColumn?: boolean
}

/**
 * Row in the pivoted table
 */
export interface PivotRow {
  /** Unique row identifier */
  id: string
  /** The measure field name (for icon lookup) */
  measureField: string
  /** Values keyed by column key */
  values: Record<string, any>
  /** Whether this is the first row in a dimension group (for row spanning) */
  isFirstInGroup?: boolean
  /** Number of rows to span for dimension cells (only set on first row in group) */
  dimensionRowSpan?: number
}

/**
 * Result of pivoting table data
 */
export interface PivotedTableData {
  /** Whether data was pivoted (has time dimension with granularity) */
  isPivoted: boolean
  /** Column definitions for the pivoted table */
  columns: PivotColumn[]
  /** Rows of pivoted data */
  rows: PivotRow[]
}

/**
 * Determines if a query has a time dimension with granularity that should trigger pivoting
 * @param queryObject The CubeQuery object
 * @param xAxisOverride Optional array of fields to use for filtering dimensions and measures
 *                      (for respecting chartConfig.xAxis configuration)
 * @returns PivotConfig if pivoting should occur, null otherwise
 */
export function hasTimeDimensionForPivot(
  queryObject?: CubeQuery,
  xAxisOverride?: string[]
): PivotConfig | null {
  if (!queryObject?.timeDimensions?.length) return null

  // Find the first time dimension with granularity
  const timeDim = queryObject.timeDimensions.find(td => td.granularity)
  if (!timeDim?.granularity) return null

  // Must have at least one measure to pivot
  if (!queryObject.measures?.length) return null

  let dimensions: string[]
  let measures: string[]

  if (xAxisOverride && xAxisOverride.length > 0) {
    // Filter dimensions from xAxisOverride (excluding time dimension and measures)
    dimensions = xAxisOverride.filter(field => {
      // Exclude the time dimension being pivoted (it becomes columns)
      if (field === timeDim.dimension) return false
      // Exclude measures (they become row values, not dimension columns)
      if (queryObject.measures?.includes(field)) return false
      return true
    })

    // Filter measures from xAxisOverride - only show measures that are in xAxis
    const measuresInXAxis = xAxisOverride.filter(field =>
      queryObject.measures?.includes(field)
    )
    // If xAxis contains measures, use only those; otherwise fall back to all measures
    measures = measuresInXAxis.length > 0 ? measuresInXAxis : queryObject.measures
  } else {
    dimensions = queryObject.dimensions || []
    measures = queryObject.measures
  }

  // Must have at least one measure after filtering
  if (measures.length === 0) return null

  return {
    timeDimension: timeDim.dimension,
    granularity: timeDim.granularity,
    dimensions,
    measures
  }
}

/**
 * Extracts unique time values from data and sorts them chronologically
 */
function extractAndSortTimeValues(
  data: any[],
  timeDimension: string,
  granularity: string
): string[] {
  const timeSet = new Set<string>()

  data.forEach(row => {
    const rawTime = row[timeDimension]
    if (rawTime != null) {
      const formattedTime = formatTimeValue(rawTime, granularity)
      timeSet.add(formattedTime)
    }
  })

  // Sort chronologically - ISO date strings sort correctly alphabetically
  return Array.from(timeSet).sort()
}

/**
 * Builds column definitions for pivoted table
 * Order: Measure (if multiple) -> Dimensions -> Time columns
 */
function buildColumns(
  config: PivotConfig,
  timeValues: string[],
  getFieldLabel: (field: string) => string
): PivotColumn[] {
  const columns: PivotColumn[] = []

  // Add measure column first (if multiple measures)
  if (config.measures.length > 1) {
    columns.push({
      key: '__measure__',
      label: 'Measure',
      isTimeColumn: false,
      isMeasureColumn: true
    })
  }

  // Add dimension columns
  config.dimensions.forEach(dim => {
    columns.push({
      key: dim,
      label: getFieldLabel(dim),
      isTimeColumn: false
    })
  })

  // Add time columns (already sorted chronologically)
  timeValues.forEach(timeVal => {
    columns.push({
      key: timeVal,
      label: timeVal,
      isTimeColumn: true
    })
  })

  return columns
}

/**
 * Groups data by dimension values, then by time period
 * Returns Map<dimensionKey, Map<formattedTime, dataRow>>
 */
function groupByDimensions(
  data: any[],
  config: PivotConfig
): Map<string, Map<string, any>> {
  const grouped = new Map<string, Map<string, any>>()

  data.forEach(row => {
    // Build dimension key from all dimension values
    const dimKey = config.dimensions.length > 0
      ? config.dimensions.map(dim => String(row[dim] ?? '')).join('|')
      : '__all__'

    // Get or create time map for this dimension combo
    if (!grouped.has(dimKey)) {
      grouped.set(dimKey, new Map())
    }

    // Store data point by formatted time value
    const rawTime = row[config.timeDimension]
    if (rawTime != null) {
      const formattedTime = formatTimeValue(rawTime, config.granularity)
      grouped.get(dimKey)!.set(formattedTime, row)
    }
  })

  return grouped
}

/**
 * Builds pivoted rows from grouped data
 * Rows are grouped by measure first (all Revenue rows together, all Quantity rows together)
 * Then within each measure group, rows are ordered by dimension values
 */
function buildPivotedRows(
  data: any[],
  config: PivotConfig,
  timeValues: string[],
  getFieldLabel: (field: string) => string
): PivotRow[] {
  // Group data by dimensions and time
  const grouped = groupByDimensions(data, config)
  const dimensionKeys = Array.from(grouped.keys())

  const rows: PivotRow[] = []
  const measureCount = config.measures.length
  const dimensionCount = dimensionKeys.length

  // Iterate over measures first, then dimensions
  // This groups all rows for one measure together
  config.measures.forEach((measure) => {
    dimensionKeys.forEach((dimensionKey, dimIndex) => {
      const timeData = grouped.get(dimensionKey)!
      const rowId = measureCount > 1
        ? `${measure}|${dimensionKey}`
        : dimensionKey

      const values: Record<string, any> = {}

      // Add dimension values
      const dimValues = dimensionKey === '__all__' ? [] : dimensionKey.split('|')
      config.dimensions.forEach((dim, idx) => {
        values[dim] = dimValues[idx] ?? ''
      })

      // Add measure name if multiple measures (for display in Measure column)
      if (measureCount > 1) {
        values['__measure__'] = getFieldLabel(measure)
      }

      // Add time period values
      timeValues.forEach(timeVal => {
        const dataPoint = timeData.get(timeVal)
        values[timeVal] = dataPoint?.[measure] ?? null
      })

      // Track grouping for row spanning (when multiple measures)
      // First row of each measure group should span all dimension rows
      const isFirstInGroup = dimIndex === 0
      const measureRowSpan = isFirstInGroup && measureCount > 1 ? dimensionCount : undefined

      rows.push({
        id: rowId,
        measureField: measure,
        values,
        isFirstInGroup,
        dimensionRowSpan: measureRowSpan
      })
    })
  })

  return rows
}

/**
 * Pivots flat data into time-columned table structure
 *
 * @param data Raw data array from query result
 * @param config Pivot configuration
 * @param getFieldLabel Function to get display label for a field
 * @param meta Optional cube metadata for looking up measure types
 * @returns Pivoted table data structure
 */
export function pivotTableData(
  data: any[],
  config: PivotConfig,
  getFieldLabel: (field: string) => string,
  _meta?: CubeMeta | null
): PivotedTableData {
  if (!data || data.length === 0) {
    return { isPivoted: true, columns: [], rows: [] }
  }

  // Extract unique time values and sort chronologically
  const timeValues = extractAndSortTimeValues(data, config.timeDimension, config.granularity)

  // Build column definitions
  const columns = buildColumns(config, timeValues, getFieldLabel)

  // Build pivoted rows
  const rows = buildPivotedRows(data, config, timeValues, getFieldLabel)

  return { isPivoted: true, columns, rows }
}

/**
 * Looks up the measure type from metadata
 *
 * @param measureField The fully qualified measure field name (e.g., "Sales.revenue")
 * @param meta Cube metadata
 * @returns The measure type (e.g., "sum", "count", "avg") or undefined
 */
export function getMeasureType(measureField: string, meta: CubeMeta | null): string | undefined {
  if (!meta?.cubes) return undefined

  for (const cube of meta.cubes) {
    const measure = cube.measures.find(m => m.name === measureField)
    if (measure) {
      return measure.type
    }
  }

  return undefined
}
