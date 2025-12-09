/**
 * Query-related types for the semantic layer
 * Includes query definitions, filters, and time dimensions
 */

import type { TimeGranularity } from './core'

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