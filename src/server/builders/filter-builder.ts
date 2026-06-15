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
  SQL,
  type AnyColumn
} from 'drizzle-orm'

import type {
  FilterOperator,
  Filter,
  FilterCondition,
  Cube,
  QueryContext
} from '../types'

import { resolveFilterFieldExpr } from '../cube-utils'
import type { DatabaseAdapter } from '../adapters/base-adapter'
import { DateTimeBuilder } from './date-time-builder'
import { applyFilterOperator } from './filter-operators'
import { asGroupFilter } from './analysis-utils'

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

    return applyFilterOperator(operator, {
      fieldExpr,
      values,
      filteredValues,
      value,
      field,
      databaseAdapter: this.databaseAdapter,
      dateTimeBuilder: this.dateTimeBuilder
    })
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
      return this.combineFilters(filter.and, true, cubes, context)
    }

    if ('or' in filter && filter.or) {
      return this.combineFilters(filter.or, false, cubes, context)
    }

    return null
  }

  /** Build + AND/OR-combine a list of sub-filters, collapsing the 0- and 1-element cases. */
  private combineFilters(
    filterList: Filter[],
    isAnd: boolean,
    cubes: Map<string, Cube>,
    context: QueryContext
  ): SQL | null {
    const conditions = filterList
      .map(f => this.buildSingleFilter(f, cubes, context))
      .filter((c): c is SQL => c !== null)
    if (conditions.length === 0) return null
    if (conditions.length === 1) return conditions[0]
    return isAnd ? and(...conditions) as SQL : or(...conditions) as SQL
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

    // Handle client-style group filters ({ type: 'and' | 'or', filters: [...] })
    const group = asGroupFilter(filter)
    if (group) {
      return this.combineFilters(group.filters, group.isAnd, cubes, context)
    }

    // Simple filter
    const fc = filter as FilterCondition
    const [cubeName, fieldName] = fc.member.split('.')
    const cube = cubes.get(cubeName)
    if (!cube) return null

    const dimension = cube.dimensions?.[fieldName]
    if (!dimension) return null

    const fieldExpr = resolveFilterFieldExpr(dimension, context)
    return this.buildFilterCondition(
      fieldExpr,
      fc.operator,
      fc.values,
      dimension,
      fc.dateRange
    )
  }
}
