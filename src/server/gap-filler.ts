/**
 * Gap Filler Utility
 * Fills missing time series gaps in query results to ensure continuous data for charts.
 * Follows Cube.js naming conventions (fillMissingDates) but implements server-side.
 */

import type { SemanticQuery, Filter, FilterCondition } from './types/query'
import type { TimeGranularity } from './types/core'
import { parseRelativeDateRange } from '../shared/date-utils'

/**
 * Maximum number of time buckets gap filling will generate. Beyond this, gap
 * filling is skipped entirely (data is returned unmodified) to avoid both
 * runaway memory use and silent truncation of real rows.
 */
export const MAX_GAP_FILL_BUCKETS = 10000

export interface GapFillerConfig {
  /** The time dimension key (e.g., 'Sales.date') */
  timeDimensionKey: string
  /** Time granularity for bucket generation */
  granularity: TimeGranularity
  /** Date range [start, end] */
  dateRange: [Date, Date]
  /** Value to fill for missing measures (default: 0) */
  fillValue: number | null
  /** List of measure keys in the data */
  measures: string[]
  /** List of dimension keys in the data (excluding time dimensions) */
  dimensions: string[]
}

/**
 * Generate all time buckets for a given date range and granularity
 */
export function generateTimeBuckets(
  startDate: Date,
  endDate: Date,
  granularity: TimeGranularity
): Date[] {
  const buckets: Date[] = []
  let current = alignToGranularity(new Date(startDate), granularity)
  const end = alignToGranularity(new Date(endDate), granularity)

  // Safety: limit to prevent runaway allocation/infinite loops.
  // Callers MUST treat hitting this cap as "do not gap fill" rather than
  // truncating data — see fillTimeSeriesGaps.
  while (current <= end && buckets.length < MAX_GAP_FILL_BUCKETS) {
    buckets.push(new Date(current))
    current = incrementByGranularity(current, granularity)
  }

  return buckets
}

/**
 * Align a date to the start of its granularity bucket
 */
function alignToGranularity(date: Date, granularity: TimeGranularity): Date {
  const aligned = new Date(date)

  switch (granularity) {
    case 'second':
      aligned.setUTCMilliseconds(0)
      break
    case 'minute':
      aligned.setUTCSeconds(0, 0)
      break
    case 'hour':
      aligned.setUTCMinutes(0, 0, 0)
      break
    case 'day':
      aligned.setUTCHours(0, 0, 0, 0)
      break
    case 'week': {
      // Align to Monday (ISO week start)
      const dayOfWeek = aligned.getUTCDay()
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
      aligned.setUTCDate(aligned.getUTCDate() - daysToMonday)
      aligned.setUTCHours(0, 0, 0, 0)
      break
    }
    case 'month':
      aligned.setUTCDate(1)
      aligned.setUTCHours(0, 0, 0, 0)
      break
    case 'quarter': {
      const quarterMonth = Math.floor(aligned.getUTCMonth() / 3) * 3
      aligned.setUTCMonth(quarterMonth, 1)
      aligned.setUTCHours(0, 0, 0, 0)
      break
    }
    case 'year':
      aligned.setUTCMonth(0, 1)
      aligned.setUTCHours(0, 0, 0, 0)
      break
  }

  return aligned
}

/**
 * Increment a date by one granularity unit
 */
function incrementByGranularity(date: Date, granularity: TimeGranularity): Date {
  const next = new Date(date)

  switch (granularity) {
    case 'second':
      next.setUTCSeconds(next.getUTCSeconds() + 1)
      break
    case 'minute':
      next.setUTCMinutes(next.getUTCMinutes() + 1)
      break
    case 'hour':
      next.setUTCHours(next.getUTCHours() + 1)
      break
    case 'day':
      next.setUTCDate(next.getUTCDate() + 1)
      break
    case 'week':
      next.setUTCDate(next.getUTCDate() + 7)
      break
    case 'month':
      next.setUTCMonth(next.getUTCMonth() + 1)
      break
    case 'quarter':
      next.setUTCMonth(next.getUTCMonth() + 3)
      break
    case 'year':
      next.setUTCFullYear(next.getUTCFullYear() + 1)
      break
  }

  return next
}

/**
 * Normalize a date value to an aligned ISO bucket key for consistent comparison.
 *
 * Real rows carry the time value as produced by the database's time-bucketing
 * expression, which may not exactly equal the JS-generated bucket boundary
 * (e.g. a week expression that retains the time-of-day). Aligning the row's date
 * to the same granularity boundary used to generate buckets ensures real rows
 * match their bucket instead of being discarded and replaced with fill values.
 *
 * Returns null when the value cannot be parsed as a date.
 */
function normalizeDateKey(value: unknown, granularity: TimeGranularity): string | null {
  let date: Date | null = null
  if (value instanceof Date) {
    date = value
  } else if (typeof value === 'string') {
    const parsed = new Date(value)
    if (!isNaN(parsed.getTime())) {
      date = parsed
    }
  }

  if (!date || isNaN(date.getTime())) {
    return null
  }

  return alignToGranularity(date, granularity).toISOString()
}

/**
 * Create a dimension group key for grouping rows by dimension values
 */
function createDimensionGroupKey(
  row: Record<string, unknown>,
  dimensions: string[]
): string {
  if (dimensions.length === 0) {
    return '__all__'
  }

  return dimensions.map(dim => {
    return String((row as Record<string, unknown>)[dim] ?? '')
  }).join('|||')
}

/**
 * Fill time series gaps in query result data
 *
 * @param data - Original query result data
 * @param config - Gap filling configuration
 * @returns Data with gaps filled
 */
export function fillTimeSeriesGaps(
  data: Record<string, unknown>[],
  config: GapFillerConfig
): Record<string, unknown>[] {
  const { timeDimensionKey, granularity, dateRange, fillValue, measures, dimensions } = config

  // Generate all expected time buckets
  const timeBuckets = generateTimeBuckets(dateRange[0], dateRange[1], granularity)

  if (timeBuckets.length === 0) {
    return data
  }

  // If the requested range would exceed the bucket cap, skip gap filling rather
  // than truncating: filling only the first N buckets would silently drop every
  // real row that falls after them. Return the data unmodified.
  if (timeBuckets.length >= MAX_GAP_FILL_BUCKETS) {
    console.warn(
      `[drizzle-cube] Skipping gap filling for "${timeDimensionKey}": the ${granularity} ` +
      `range exceeds the ${MAX_GAP_FILL_BUCKETS}-bucket limit. Returning unfilled data.`
    )
    return data
  }

  // Group data by dimension values, keying each row by its time value aligned to
  // the same granularity boundary used to generate buckets. Aligning the row key
  // is what lets real rows match their bucket even when the database's bucketing
  // expression keeps a time-of-day component (e.g. the MySQL/SingleStore week
  // expression). Without alignment those rows were discarded and replaced with
  // fill values (issue #849).
  const dimensionGroups = new Map<string, Map<string, Record<string, unknown>>>()

  for (const row of data) {
    const groupKey = createDimensionGroupKey(row, dimensions)
    // Fall back to a stable string for unparseable values so they simply don't
    // match any bucket (prior behaviour) rather than throwing.
    const timeKey = normalizeDateKey(row[timeDimensionKey], granularity)
      ?? String(row[timeDimensionKey])

    if (!dimensionGroups.has(groupKey)) {
      dimensionGroups.set(groupKey, new Map())
    }
    dimensionGroups.get(groupKey)!.set(timeKey, row)
  }

  // If no data at all, create one group with no dimensions
  if (dimensionGroups.size === 0 && dimensions.length === 0) {
    dimensionGroups.set('__all__', new Map())
  }

  // Build filled result
  const result: Record<string, unknown>[] = []

  for (const [_groupKey, timeMap] of dimensionGroups) {
    // Get a sample row from this group to extract dimension values
    const sampleRow = timeMap.size > 0
      ? timeMap.values().next().value
      : null

    for (const bucket of timeBuckets) {
      const bucketKey = bucket.toISOString()
      const existingRow = timeMap.get(bucketKey)

      if (existingRow) {
        // Use existing row
        result.push(existingRow)
      } else {
        // Create filled row
        const filledRow: Record<string, unknown> = {
          [timeDimensionKey]: bucketKey
        }

        // Copy dimension values from sample row
        if (sampleRow) {
          for (const dim of dimensions) {
            filledRow[dim] = sampleRow[dim]
          }
        }

        // Fill measures with fill value
        for (const measure of measures) {
          filledRow[measure] = fillValue
        }

        result.push(filledRow)
      }
    }
  }

  return result
}

/**
 * Parse date range from query time dimension
 * Handles both array format ['2024-01-01', '2024-01-31'] and string format
 */
export function parseDateRange(dateRange: string | string[] | undefined): [Date, Date] | null {
  if (!dateRange) {
    return null
  }

  if (Array.isArray(dateRange)) {
    if (dateRange.length < 2) {
      return null
    }
    const start = new Date(dateRange[0])
    const end = new Date(dateRange[1])

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return null
    }

    return [start, end]
  }

  // Try as a relative date range (e.g., 'last 7 days', 'this month', 'this year')
  const relative = parseRelativeDateRange(dateRange)
  if (relative) {
    return [relative.start, relative.end]
  }

  // Try to parse as a single absolute date string
  const date = new Date(dateRange)
  if (!isNaN(date.getTime())) {
    // Single date - return same day range
    return [date, date]
  }

  return null
}

/**
 * Apply gap filling to query result data based on query configuration
 *
 * @param data - Original query result data
 * @param query - The semantic query
 * @param measures - List of measure names in the result
 * @returns Data with gaps filled (if applicable)
 */
export function applyGapFilling(
  data: Record<string, unknown>[],
  query: SemanticQuery,
  measures: string[]
): Record<string, unknown>[] {
  // Check if we have time dimensions to fill
  if (!query.timeDimensions || query.timeDimensions.length === 0) {
    return data
  }

  // Find time dimensions that need gap filling
  const timeDimensionsToFill = query.timeDimensions.filter(td => {
    // fillMissingDates defaults to true
    const shouldFill = td.fillMissingDates !== false

    // Must have granularity to fill gaps
    // dateRange can come from the timeDimension itself OR from a matching inDateRange filter
    const hasGranularity = !!td.granularity
    const hasDateRange = td.dateRange || findDateRangeFilter(td.dimension, query.filters)

    return shouldFill && hasGranularity && hasDateRange
  })

  if (timeDimensionsToFill.length === 0) {
    return data
  }

  // Get fill value (default: 0, but allow explicit null)
  const fillValue = query.fillMissingDatesValue === undefined ? 0 : query.fillMissingDatesValue

  // Get regular dimensions (exclude time dimensions)
  const timeDimensionKeys = new Set(query.timeDimensions.map(td => td.dimension))
  const regularDimensions = (query.dimensions || []).filter(d => !timeDimensionKeys.has(d))

  // Apply gap filling for each time dimension
  // Note: Currently only supports single time dimension gap filling
  // Multiple time dimensions would require more complex logic
  let result = data

  for (const timeDim of timeDimensionsToFill) {
    // Try dateRange from timeDimension first, then fall back to matching filter
    const dateRange = parseDateRange(timeDim.dateRange)
      || resolveDateRangeFromFilter(timeDim.dimension, query.filters)

    if (!dateRange) {
      continue
    }

    const config: GapFillerConfig = {
      timeDimensionKey: timeDim.dimension,
      granularity: timeDim.granularity!,
      dateRange,
      fillValue,
      measures,
      dimensions: regularDimensions
    }

    result = fillTimeSeriesGaps(result, config)
  }

  return result
}

/**
 * Find an inDateRange filter matching a time dimension in the query filters.
 * Searches through top-level filters and logical groups (and/or).
 */
function findDateRangeFilter(
  dimensionKey: string,
  filters: Filter[] | undefined
): FilterCondition | null {
  if (!filters) return null

  for (const filter of filters) {
    // Direct filter condition
    if ('member' in filter && 'operator' in filter) {
      if (filter.member === dimensionKey && filter.operator === 'inDateRange') {
        return filter
      }
    }
    // Logical groups
    if ('and' in filter && filter.and) {
      const found = findDateRangeFilter(dimensionKey, filter.and)
      if (found) return found
    }
    if ('or' in filter && filter.or) {
      const found = findDateRangeFilter(dimensionKey, filter.or)
      if (found) return found
    }
  }

  return null
}

/**
 * Resolve a date range from a matching inDateRange filter for the given dimension.
 * Handles both absolute date pairs and relative date strings (e.g., "this month").
 */
function resolveDateRangeFromFilter(
  dimensionKey: string,
  filters: Filter[] | undefined
): [Date, Date] | null {
  const filter = findDateRangeFilter(dimensionKey, filters)
  if (!filter) return null

  // Check filter.dateRange first (e.g., { dateRange: "this year" })
  if (filter.dateRange) {
    const fromDateRange = parseDateRange(filter.dateRange)
    if (fromDateRange) return fromDateRange
  }

  // Check filter.values (e.g., values: ["2024-01-01", "2024-03-31"] or values: ["this month"])
  const values = filter.values
  if (!values || values.length === 0) return null

  // Single relative string (e.g., ["this month"])
  if (values.length === 1 && typeof values[0] === 'string') {
    const relative = parseRelativeDateRange(values[0])
    if (relative) return [relative.start, relative.end]
    // Try as absolute date
    return parseDateRange(values)
  }

  // Two absolute dates (e.g., ["2024-01-01", "2024-03-31"])
  if (values.length >= 2) {
    return parseDateRange(values)
  }

  return null
}
