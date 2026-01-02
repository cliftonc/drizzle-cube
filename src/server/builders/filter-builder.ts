/**
 * Filter Builder
 * Handles all filter-related SQL generation:
 * - Individual filter conditions (equals, contains, gt, etc.)
 * - Logical filter combinations (AND/OR)
 * - Date and array operators
 */

import {
  and,
  or,
  eq,
  ne,
  gt,
  gte,
  lt,
  lte,
  isNull,
  isNotNull,
  inArray,
  notInArray,
  SQL,
  type AnyColumn,
  arrayContains as drizzleArrayContains,
  arrayContained as drizzleArrayContained,
  arrayOverlaps as drizzleArrayOverlaps
} from 'drizzle-orm'

import type {
  FilterOperator,
  Filter,
  FilterCondition,
  Cube,
  QueryContext
} from '../types'

import { resolveSqlExpression } from '../cube-utils'
import type { DatabaseAdapter } from '../adapters/base-adapter'
import { DateTimeBuilder } from './date-time-builder'

export class FilterBuilder {
  constructor(
    private databaseAdapter: DatabaseAdapter,
    private dateTimeBuilder: DateTimeBuilder
  ) {}

  /**
   * Build filter condition using Drizzle operators
   */
  buildFilterCondition(
    fieldExpr: AnyColumn | SQL,
    operator: FilterOperator,
    values: any[],
    field?: any,
    dateRange?: string | string[]
  ): SQL | null {
    // Handle dateRange for date filters
    if (dateRange !== undefined) {
      // Validate: dateRange only works with inDateRange operator
      if (operator !== 'inDateRange') {
        throw new Error(
          `dateRange can only be used with 'inDateRange' operator, but got '${operator}'. ` +
          `Use explicit date values in the 'values' array for other date operators.`
        )
      }

      // Validate: field must be a time dimension
      if (field && field.type !== 'time') {
        throw new Error(
          `dateRange can only be used on time dimensions, but field '${field.name || 'unknown'}' has type '${field.type}'`
        )
      }

      // Use existing buildDateRangeCondition logic - dateRange takes precedence over values
      return this.dateTimeBuilder.buildDateRangeCondition(fieldExpr, dateRange)
    }

    // Handle empty values
    if (!values || values.length === 0) {
      // For empty equals filter, return condition that matches nothing
      if (operator === 'equals') {
        return this.databaseAdapter.buildBooleanLiteral(false)
      }
      return null
    }

    // Filter out empty/null values and values containing null bytes for security
    // For date operators, don't convert values yet - we'll normalize to Date first
    const filteredValues = values.filter(v => {
      if (v === null || v === undefined || v === '') return false
      // Reject values containing null bytes for security
      if (typeof v === 'string' && v.includes('\x00')) return false
      return true
    }).map(this.databaseAdapter.convertFilterValue)

    // For certain operators, we need at least one non-empty value
    if (filteredValues.length === 0 && !['set', 'notSet'].includes(operator)) {
      // For empty equals filter, return condition that matches nothing
      if (operator === 'equals') {
        return this.databaseAdapter.buildBooleanLiteral(false)
      }
      return null
    }

    const value = filteredValues[0]

    switch (operator) {
      case 'equals':
        if (filteredValues.length > 1) {
          // For time-type fields, normalize all values
          if (field?.type === 'time') {
            const normalizedValues = filteredValues.map(v => this.dateTimeBuilder.normalizeDate(v) || v)
            return inArray(fieldExpr as AnyColumn, normalizedValues)
          }
          return inArray(fieldExpr as AnyColumn, filteredValues)
        } else if (filteredValues.length === 1) {
          // For time-type fields, normalize the single value
          const finalValue = field?.type === 'time' ? this.dateTimeBuilder.normalizeDate(value) || value : value
          return eq(fieldExpr as AnyColumn, finalValue)
        }
        return this.databaseAdapter.buildBooleanLiteral(false)
      case 'notEquals':
        if (filteredValues.length > 1) {
          return notInArray(fieldExpr as AnyColumn, filteredValues)
        } else if (filteredValues.length === 1) {
          return ne(fieldExpr as AnyColumn, value)
        }
        return null
      case 'contains':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'contains', value)
      case 'notContains':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'notContains', value)
      case 'startsWith':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'startsWith', value)
      case 'endsWith':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'endsWith', value)
      case 'gt':
        return gt(fieldExpr as AnyColumn, value)
      case 'gte':
        return gte(fieldExpr as AnyColumn, value)
      case 'lt':
        return lt(fieldExpr as AnyColumn, value)
      case 'lte':
        return lte(fieldExpr as AnyColumn, value)
      case 'set':
        return isNotNull(fieldExpr as AnyColumn)
      case 'notSet':
        return isNull(fieldExpr as AnyColumn)
      case 'inDateRange':
        if (filteredValues.length >= 2) {
          const startDate = this.dateTimeBuilder.normalizeDate(filteredValues[0])
          let endDate = this.dateTimeBuilder.normalizeDate(filteredValues[1])

          if (startDate && endDate) {
            // For date-only strings in original values, treat end date as end-of-day
            // Check original values array (before filtering/conversion)
            const originalEndValue = values[1]
            if (typeof originalEndValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(originalEndValue.trim())) {
              const endDateObj = typeof endDate === 'number'
                ? new Date(endDate * (this.databaseAdapter.getEngineType() === 'sqlite' ? 1000 : 1))
                : new Date(endDate)
              const endOfDay = new Date(endDateObj)
              endOfDay.setUTCHours(23, 59, 59, 999)
              if (this.databaseAdapter.isTimestampInteger()) {
                endDate = this.databaseAdapter.getEngineType() === 'sqlite'
                  ? Math.floor(endOfDay.getTime() / 1000)
                  : endOfDay.getTime()
              } else {
                // PostgreSQL and MySQL need ISO strings
                endDate = endOfDay.toISOString()
              }
            }

            return and(
              gte(fieldExpr as AnyColumn, startDate),
              lte(fieldExpr as AnyColumn, endDate)
            ) as SQL
          }
        }
        return null
      case 'beforeDate': {
        const beforeValue = this.dateTimeBuilder.normalizeDate(value)
        if (beforeValue) {
          return lt(fieldExpr as AnyColumn, beforeValue)
        }
        return null
      }
      case 'afterDate': {
        const afterValue = this.dateTimeBuilder.normalizeDate(value)
        if (afterValue) {
          return gt(fieldExpr as AnyColumn, afterValue)
        }
        return null
      }
      case 'between':
        if (filteredValues.length >= 2) {
          return and(
            gte(fieldExpr as AnyColumn, filteredValues[0]),
            lte(fieldExpr as AnyColumn, filteredValues[1])
          ) as SQL
        }
        return null
      case 'notBetween':
        if (filteredValues.length >= 2) {
          return or(
            lt(fieldExpr as AnyColumn, filteredValues[0]),
            gt(fieldExpr as AnyColumn, filteredValues[1])
          ) as SQL
        }
        return null
      case 'in':
        if (filteredValues.length > 0) {
          return inArray(fieldExpr as AnyColumn, filteredValues)
        }
        return null
      case 'notIn':
        if (filteredValues.length > 0) {
          return notInArray(fieldExpr as AnyColumn, filteredValues)
        }
        return null
      case 'like':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'like', value)
      case 'notLike':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'notLike', value)
      case 'ilike':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'ilike', value)
      case 'regex':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'regex', value)
      case 'notRegex':
        return this.databaseAdapter.buildStringCondition(fieldExpr, 'notRegex', value)
      case 'isEmpty':
        return or(
          isNull(fieldExpr as AnyColumn),
          eq(fieldExpr as AnyColumn, '')
        ) as SQL
      case 'isNotEmpty':
        return and(
          isNotNull(fieldExpr as AnyColumn),
          ne(fieldExpr as AnyColumn, '')
        ) as SQL
      // PostgreSQL array operators - silent no-op for other databases
      // These use Drizzle's built-in array operator functions
      case 'arrayContains':
        if (this.databaseAdapter.getEngineType() === 'postgres') {
          return drizzleArrayContains(fieldExpr as AnyColumn, filteredValues)
        }
        return null
      case 'arrayOverlaps':
        if (this.databaseAdapter.getEngineType() === 'postgres') {
          return drizzleArrayOverlaps(fieldExpr as AnyColumn, filteredValues)
        }
        return null
      case 'arrayContained':
        if (this.databaseAdapter.getEngineType() === 'postgres') {
          return drizzleArrayContained(fieldExpr as AnyColumn, filteredValues)
        }
        return null
      default:
        return null
    }
  }

  /**
   * Build a logical filter (AND/OR) - used by executor for cache preloading
   * This handles nested filter structures and builds combined SQL
   */
  buildLogicalFilter(
    filter: Filter,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): SQL | null {
    if ('and' in filter && filter.and) {
      const conditions = filter.and
        .map(f => this.buildSingleFilter(f, cubes, context))
        .filter((c): c is SQL => c !== null)
      return conditions.length > 0
        ? (conditions.length === 1 ? conditions[0] : and(...conditions) as SQL)
        : null
    }

    if ('or' in filter && filter.or) {
      const conditions = filter.or
        .map(f => this.buildSingleFilter(f, cubes, context))
        .filter((c): c is SQL => c !== null)
      return conditions.length > 0
        ? (conditions.length === 1 ? conditions[0] : or(...conditions) as SQL)
        : null
    }

    return null
  }

  /**
   * Build SQL for a single filter condition (simple or logical)
   * Used for cache preloading to build filters independently of query context
   */
  buildSingleFilter(
    filter: Filter,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): SQL | null {
    // Handle logical filters recursively
    if ('and' in filter || 'or' in filter) {
      return this.buildLogicalFilter(filter, cubes, context)
    }

    // Simple filter
    const fc = filter as FilterCondition
    const [cubeName, fieldName] = fc.member.split('.')
    const cube = cubes.get(cubeName)
    if (!cube) return null

    const dimension = cube.dimensions?.[fieldName]
    if (!dimension) return null

    const fieldExpr = resolveSqlExpression(dimension.sql, context)
    return this.buildFilterCondition(
      fieldExpr,
      fc.operator,
      fc.values,
      dimension,
      fc.dateRange
    )
  }
}
