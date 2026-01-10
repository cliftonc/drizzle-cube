/**
 * Query-related types for the semantic layer
 * Includes query definitions, filters, and time dimensions
 */

import type { TimeGranularity } from './core'
import type { FunnelQueryConfig } from './funnel'

/**
 * Semantic query structure (Cube.js compatible)
 */
export interface SemanticQuery {
  measures?: string[]
  dimensions?: string[]
  filters?: Array<Filter>
  timeDimensions?: Array<TimeDimension>
  limit?: number
  offset?: number
  order?: Record<string, 'asc' | 'desc'>
  /**
   * Default value to fill missing time series gaps with.
   * Used when fillMissingDates is enabled on time dimensions.
   * Default: 0
   */
  fillMissingDatesValue?: number | null

  /**
   * Funnel analysis configuration for query-time funnel definition.
   * When specified, the query executes as a funnel analysis instead of
   * standard measures/dimensions aggregation.
   *
   * @example
   * ```typescript
   * {
   *   funnel: {
   *     bindingKey: 'Events.userId',
   *     timeDimension: 'Events.timestamp',
   *     steps: [
   *       { name: 'Signup', filter: { member: 'Events.eventType', operator: 'equals', values: ['signup'] } },
   *       { name: 'Activation', filter: { member: 'Events.eventType', operator: 'equals', values: ['activation'] }, timeToConvert: 'P7D' }
   *     ]
   *   }
   * }
   * ```
   */
  funnel?: FunnelQueryConfig
}

/**
 * Filter definitions with logical operators
 */
export type Filter = FilterCondition | LogicalFilter

export interface FilterCondition {
  member: string
  operator: FilterOperator
  values: any[]
  dateRange?: string | string[]
}

export interface LogicalFilter {
  and?: Filter[]
  or?: Filter[]
}

/**
 * Time dimension with granularity
 */
export interface TimeDimension {
  dimension: string
  granularity?: TimeGranularity
  dateRange?: string | string[]
  /**
   * Fill missing dates in time series with the fill value.
   * Requires both granularity and dateRange to be set.
   * Default: true (enabled)
   */
  fillMissingDates?: boolean
  /**
   * Array of date ranges for period-over-period comparison.
   * When specified, queries are executed for each period and results are merged
   * with period metadata (__periodIndex, __periodDayIndex) for alignment.
   *
   * Each range can be:
   * - A relative string: 'this week', 'last month', 'last 30 days'
   * - A tuple: ['2024-01-01', '2024-01-31']
   *
   * @example
   * compareDateRange: [
   *   'last 30 days',                    // Current period
   *   ['2024-01-01', '2024-01-30']       // Prior period to compare
   * ]
   */
  compareDateRange?: (string | [string, string])[]
}

/**
 * Supported filter operators
 */
export type FilterOperator = 
  | 'equals' 
  | 'notEquals' 
  | 'contains' 
  | 'notContains'
  | 'startsWith'
  | 'notStartsWith'
  | 'endsWith'
  | 'notEndsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'set'
  | 'notSet'
  | 'inDateRange'
  | 'beforeDate'
  | 'afterDate'
  | 'between'
  | 'notBetween'
  | 'in'
  | 'notIn'
  | 'like'
  | 'notLike'
  | 'ilike'
  | 'regex'
  | 'notRegex'
  | 'isEmpty'
  | 'isNotEmpty'
  // PostgreSQL array operators
  | 'arrayContains'
  | 'arrayOverlaps'
  | 'arrayContained'