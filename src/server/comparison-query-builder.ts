/**
 * Comparison Query Builder
 * Handles period-over-period comparison queries with compareDateRange
 *
 * Responsibilities:
 * - Normalize compareDateRange date formats (relative strings, explicit arrays)
 * - Expand comparison queries into multiple period sub-queries
 * - Merge results with period metadata for client-side visualization
 * - Calculate period alignment (day-of-period index) for overlay charts
 */

import type {
  SemanticQuery,
  TimeDimension,
  QueryResult,
  TimeGranularity,
  PeriodComparisonMetadata
} from './types'
import { DateTimeBuilder } from './builders/date-time-builder'
import type { DatabaseAdapter } from './adapters/base-adapter'

/**
 * Normalized period range with start/end dates and metadata
 */
export interface NormalizedPeriod {
  /** Start date of the period */
  start: Date
  /** End date of the period */
  end: Date
  /** Human-readable label for the period */
  label: string
  /** Index in the comparison (0 = first/current, 1 = second/prior, etc.) */
  index: number
}

/**
 * Extended result row with period metadata for alignment
 */
export interface ComparisonResultRow extends Record<string, unknown> {
  /** Period label (e.g., "2024-01-01 - 2024-01-31") */
  __period: string
  /** Period index (0 = current, 1 = prior, etc.) */
  __periodIndex: number
  /** Day-of-period index for alignment in overlay mode */
  __periodDayIndex: number
}

export class ComparisonQueryBuilder {
  private dateTimeBuilder: DateTimeBuilder

  constructor(databaseAdapter: DatabaseAdapter) {
    this.dateTimeBuilder = new DateTimeBuilder(databaseAdapter)
  }

  /**
   * Check if a query contains compareDateRange
   */
  hasComparison(query: SemanticQuery): boolean {
    return query.timeDimensions?.some(td =>
      td.compareDateRange && td.compareDateRange.length >= 2
    ) ?? false
  }

  /**
   * Get the time dimension with compareDateRange
   */
  getComparisonTimeDimension(query: SemanticQuery): TimeDimension | undefined {
    return query.timeDimensions?.find(td =>
      td.compareDateRange && td.compareDateRange.length >= 2
    )
  }

  /**
   * Normalize compareDateRange entries to concrete date ranges
   * Handles both relative strings ('last 30 days') and explicit arrays (['2024-01-01', '2024-01-31'])
   */
  normalizePeriods(
    compareDateRange: (string | [string, string])[]
  ): NormalizedPeriod[] {
    const periods: NormalizedPeriod[] = []

    for (let i = 0; i < compareDateRange.length; i++) {
      const range = compareDateRange[i]
      let start: Date
      let end: Date
      let label: string

      if (typeof range === 'string') {
        // Relative date string (e.g., 'last 30 days', 'this week')
        const parsed = this.dateTimeBuilder.parseRelativeDateRange(range)
        if (parsed) {
          start = parsed.start
          end = parsed.end
          label = range
        } else {
          // Try to parse as absolute date
          const dateObj = new Date(range)
          if (!isNaN(dateObj.getTime())) {
            start = new Date(dateObj)
            start.setUTCHours(0, 0, 0, 0)
            end = new Date(dateObj)
            end.setUTCHours(23, 59, 59, 999)
            label = range
          } else {
            // Skip invalid range
            continue
          }
        }
      } else {
        // Explicit array format ['2024-01-01', '2024-01-31']
        start = new Date(range[0])
        end = new Date(range[1])

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          // Skip invalid range
          continue
        }

        // For date-only strings, treat end date as end-of-day
        if (/^\d{4}-\d{2}-\d{2}$/.test(range[1])) {
          end.setUTCHours(23, 59, 59, 999)
        }

        label = `${range[0]} - ${range[1]}`
      }

      periods.push({
        start,
        end,
        label,
        index: i
      })
    }

    return periods
  }

  /**
   * Create sub-query for a specific period
   * Replaces compareDateRange with a concrete dateRange for that period
   */
  createPeriodQuery(
    query: SemanticQuery,
    period: NormalizedPeriod
  ): SemanticQuery {
    return {
      ...query,
      timeDimensions: query.timeDimensions?.map(td => {
        if (td.compareDateRange) {
          // Replace compareDateRange with concrete dateRange for this period
          return {
            ...td,
            dateRange: [
              period.start.toISOString(),
              period.end.toISOString()
            ],
            // Remove compareDateRange to prevent recursion
            compareDateRange: undefined
          }
        }
        return td
      })
    }
  }

  /**
   * Calculate the day-of-period index for a date
   * Used for aligning data points across periods in overlay mode
   */
  calculatePeriodDayIndex(
    date: Date | string,
    periodStart: Date,
    granularity: TimeGranularity
  ): number {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const startTime = periodStart.getTime()
    const dateTime = dateObj.getTime()

    switch (granularity) {
      case 'second':
        return Math.floor((dateTime - startTime) / 1000)
      case 'minute':
        return Math.floor((dateTime - startTime) / (1000 * 60))
      case 'hour':
        return Math.floor((dateTime - startTime) / (1000 * 60 * 60))
      case 'day':
        return Math.floor((dateTime - startTime) / (1000 * 60 * 60 * 24))
      case 'week':
        return Math.floor((dateTime - startTime) / (1000 * 60 * 60 * 24 * 7))
      case 'month': {
        const startYear = periodStart.getUTCFullYear()
        const startMonth = periodStart.getUTCMonth()
        const dateYear = dateObj.getUTCFullYear()
        const dateMonth = dateObj.getUTCMonth()
        return (dateYear - startYear) * 12 + (dateMonth - startMonth)
      }
      case 'quarter': {
        const startYear = periodStart.getUTCFullYear()
        const startQuarter = Math.floor(periodStart.getUTCMonth() / 3)
        const dateYear = dateObj.getUTCFullYear()
        const dateQuarter = Math.floor(dateObj.getUTCMonth() / 3)
        return (dateYear - startYear) * 4 + (dateQuarter - startQuarter)
      }
      case 'year':
        return dateObj.getUTCFullYear() - periodStart.getUTCFullYear()
      default:
        // Default to days
        return Math.floor((dateTime - startTime) / (1000 * 60 * 60 * 24))
    }
  }

  /**
   * Add period metadata to result rows
   */
  addPeriodMetadata(
    data: Record<string, unknown>[],
    period: NormalizedPeriod,
    timeDimensionKey: string,
    granularity: TimeGranularity
  ): ComparisonResultRow[] {
    return data.map(row => {
      const timeDimensionValue = row[timeDimensionKey]
      let periodDayIndex = 0

      if (timeDimensionValue) {
        const dateValue = typeof timeDimensionValue === 'string'
          ? new Date(timeDimensionValue)
          : timeDimensionValue instanceof Date
            ? timeDimensionValue
            : null

        if (dateValue && !isNaN(dateValue.getTime())) {
          periodDayIndex = this.calculatePeriodDayIndex(
            dateValue,
            period.start,
            granularity
          )
        }
      }

      return {
        ...row,
        __period: period.label,
        __periodIndex: period.index,
        __periodDayIndex: periodDayIndex
      } as ComparisonResultRow
    })
  }

  /**
   * Merge results from multiple period queries
   * Adds period metadata and creates combined result with annotation
   */
  mergeComparisonResults(
    periodResults: Array<{ result: QueryResult; period: NormalizedPeriod }>,
    timeDimension: TimeDimension,
    granularity: TimeGranularity
  ): QueryResult {
    const allData: ComparisonResultRow[] = []
    let mergedAnnotation = {
      measures: {} as Record<string, any>,
      dimensions: {} as Record<string, any>,
      segments: {} as Record<string, any>,
      timeDimensions: {} as Record<string, any>
    }

    const periods = periodResults.map(pr => pr.period)

    for (const { result, period } of periodResults) {
      // Add period metadata to each row
      const rowsWithMetadata = this.addPeriodMetadata(
        result.data,
        period,
        timeDimension.dimension,
        granularity
      )
      allData.push(...rowsWithMetadata)

      // Merge annotations (they should be the same across periods)
      mergedAnnotation = {
        measures: { ...mergedAnnotation.measures, ...result.annotation.measures },
        dimensions: { ...mergedAnnotation.dimensions, ...result.annotation.dimensions },
        segments: { ...mergedAnnotation.segments, ...result.annotation.segments },
        timeDimensions: { ...mergedAnnotation.timeDimensions, ...result.annotation.timeDimensions }
      }
    }

    // Add period comparison metadata
    const periodMetadata: PeriodComparisonMetadata = {
      ranges: periods.map(p => [
        p.start.toISOString().split('T')[0],
        p.end.toISOString().split('T')[0]
      ] as [string, string]),
      labels: periods.map(p => p.label),
      timeDimension: timeDimension.dimension,
      granularity
    }

    return {
      data: allData,
      annotation: {
        ...mergedAnnotation,
        periods: periodMetadata
      }
    }
  }

  /**
   * Sort merged results by period index and then by time dimension
   * Ensures consistent ordering for client-side processing
   */
  sortComparisonResults(
    data: ComparisonResultRow[],
    timeDimensionKey: string
  ): ComparisonResultRow[] {
    return [...data].sort((a, b) => {
      // First sort by period index
      const periodDiff = a.__periodIndex - b.__periodIndex
      if (periodDiff !== 0) return periodDiff

      // Then sort by time dimension
      const aTime = a[timeDimensionKey]
      const bTime = b[timeDimensionKey]

      if (typeof aTime === 'string' && typeof bTime === 'string') {
        return new Date(aTime).getTime() - new Date(bTime).getTime()
      }

      return 0
    })
  }
}
