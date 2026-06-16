/**
 * Filter Operators
 *
 * Per-operator handlers for FilterBuilder.buildFilterCondition.
 * Extracted from the original switch statement to keep the dispatch lean.
 * Behaviour is byte-identical to the original inline cases.
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

import type { FilterOperator } from '../types/index.js'
import type { DatabaseAdapter } from '../adapters/base-adapter.js'
import type { DateTimeBuilder } from './date-time-builder.js'

/**
 * Context passed to every operator handler. Carries the resolved field
 * expression, the (already filtered/converted) value list, plus the
 * collaborators a handler may need.
 */
export interface FilterOperatorContext {
  fieldExpr: AnyColumn | SQL
  values: any[]
  filteredValues: any[]
  value: any
  field?: any
  databaseAdapter: DatabaseAdapter
  dateTimeBuilder: DateTimeBuilder
}

type FilterOperatorHandler = (ctx: FilterOperatorContext) => SQL | null

const handleEquals: FilterOperatorHandler = (ctx) => {
  const { fieldExpr, filteredValues, value, field, databaseAdapter, dateTimeBuilder } = ctx
  if (filteredValues.length > 1) {
    // For time-type fields, normalize all values
    if (field?.type === 'time') {
      const normalizedValues = filteredValues.map(v => dateTimeBuilder.normalizeDate(v) || v)
      return inArray(fieldExpr as AnyColumn, normalizedValues)
    }
    return inArray(fieldExpr as AnyColumn, filteredValues)
  } else if (filteredValues.length === 1) {
    // For time-type fields, normalize the single value
    const finalValue = field?.type === 'time' ? dateTimeBuilder.normalizeDate(value) || value : value
    return eq(fieldExpr as AnyColumn, finalValue)
  }
  return databaseAdapter.buildBooleanLiteral(false)
}

const handleNotEquals: FilterOperatorHandler = (ctx) => {
  const { fieldExpr, filteredValues, value } = ctx
  if (filteredValues.length > 1) {
    return notInArray(fieldExpr as AnyColumn, filteredValues)
  } else if (filteredValues.length === 1) {
    return ne(fieldExpr as AnyColumn, value)
  }
  return null
}

type StringConditionOperator = Parameters<DatabaseAdapter['buildStringCondition']>[1]

const stringCondition = (kind: StringConditionOperator): FilterOperatorHandler =>
  ({ fieldExpr, value, databaseAdapter }) =>
    databaseAdapter.buildStringCondition(fieldExpr, kind, value)

const handleGt: FilterOperatorHandler = ({ fieldExpr, value }) => gt(fieldExpr as AnyColumn, value)
const handleGte: FilterOperatorHandler = ({ fieldExpr, value }) => gte(fieldExpr as AnyColumn, value)
const handleLt: FilterOperatorHandler = ({ fieldExpr, value }) => lt(fieldExpr as AnyColumn, value)
const handleLte: FilterOperatorHandler = ({ fieldExpr, value }) => lte(fieldExpr as AnyColumn, value)
const handleSet: FilterOperatorHandler = ({ fieldExpr }) => isNotNull(fieldExpr as AnyColumn)
const handleNotSet: FilterOperatorHandler = ({ fieldExpr }) => isNull(fieldExpr as AnyColumn)

const handleInDateRange: FilterOperatorHandler = (ctx) => {
  const { fieldExpr, values, filteredValues, databaseAdapter, dateTimeBuilder } = ctx
  if (filteredValues.length < 2) {
    return null
  }
  const startDate = dateTimeBuilder.normalizeDate(filteredValues[0])
  let endDate = dateTimeBuilder.normalizeDate(filteredValues[1])

  if (!startDate || !endDate) {
    return null
  }

  // For date-only strings in original values, treat end date as end-of-day
  // Check original values array (before filtering/conversion)
  const originalEndValue = values[1]
  if (typeof originalEndValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(originalEndValue.trim())) {
    const endDateObj = typeof endDate === 'number'
      ? new Date(endDate * (databaseAdapter.getEngineType() === 'sqlite' ? 1000 : 1))
      : new Date(endDate)
    const endOfDay = new Date(endDateObj)
    endOfDay.setUTCHours(23, 59, 59, 999)
    if (databaseAdapter.isTimestampInteger()) {
      endDate = databaseAdapter.getEngineType() === 'sqlite'
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

const handleBeforeDate: FilterOperatorHandler = ({ fieldExpr, value, dateTimeBuilder }) => {
  const beforeValue = dateTimeBuilder.normalizeDate(value)
  if (beforeValue) {
    return lt(fieldExpr as AnyColumn, beforeValue)
  }
  return null
}

const handleAfterDate: FilterOperatorHandler = ({ fieldExpr, value, dateTimeBuilder }) => {
  const afterValue = dateTimeBuilder.normalizeDate(value)
  if (afterValue) {
    return gt(fieldExpr as AnyColumn, afterValue)
  }
  return null
}

const handleBetween: FilterOperatorHandler = ({ fieldExpr, filteredValues }) => {
  if (filteredValues.length >= 2) {
    return and(
      gte(fieldExpr as AnyColumn, filteredValues[0]),
      lte(fieldExpr as AnyColumn, filteredValues[1])
    ) as SQL
  }
  return null
}

const handleNotBetween: FilterOperatorHandler = ({ fieldExpr, filteredValues }) => {
  if (filteredValues.length >= 2) {
    return or(
      lt(fieldExpr as AnyColumn, filteredValues[0]),
      gt(fieldExpr as AnyColumn, filteredValues[1])
    ) as SQL
  }
  return null
}

const handleIn: FilterOperatorHandler = ({ fieldExpr, filteredValues }) => {
  if (filteredValues.length > 0) {
    return inArray(fieldExpr as AnyColumn, filteredValues)
  }
  return null
}

const handleNotIn: FilterOperatorHandler = ({ fieldExpr, filteredValues }) => {
  if (filteredValues.length > 0) {
    return notInArray(fieldExpr as AnyColumn, filteredValues)
  }
  return null
}

const handleIsEmpty: FilterOperatorHandler = ({ fieldExpr }) =>
  or(
    isNull(fieldExpr as AnyColumn),
    eq(fieldExpr as AnyColumn, '')
  ) as SQL

const handleIsNotEmpty: FilterOperatorHandler = ({ fieldExpr }) =>
  and(
    isNotNull(fieldExpr as AnyColumn),
    ne(fieldExpr as AnyColumn, '')
  ) as SQL

// PostgreSQL array operators - silent no-op for other databases
// These use Drizzle's built-in array operator functions
const pgArrayCondition = (
  fn: typeof drizzleArrayContains
): FilterOperatorHandler => ({ fieldExpr, filteredValues, databaseAdapter }) => {
  if (databaseAdapter.getEngineType() === 'postgres') {
    return fn(fieldExpr as AnyColumn, filteredValues)
  }
  return null
}

const OPERATOR_HANDLERS: Partial<Record<FilterOperator, FilterOperatorHandler>> = {
  equals: handleEquals,
  notEquals: handleNotEquals,
  contains: stringCondition('contains'),
  notContains: stringCondition('notContains'),
  startsWith: stringCondition('startsWith'),
  endsWith: stringCondition('endsWith'),
  gt: handleGt,
  gte: handleGte,
  lt: handleLt,
  lte: handleLte,
  set: handleSet,
  notSet: handleNotSet,
  inDateRange: handleInDateRange,
  beforeDate: handleBeforeDate,
  afterDate: handleAfterDate,
  between: handleBetween,
  notBetween: handleNotBetween,
  in: handleIn,
  notIn: handleNotIn,
  like: stringCondition('like'),
  notLike: stringCondition('notLike'),
  ilike: stringCondition('ilike'),
  regex: stringCondition('regex'),
  notRegex: stringCondition('notRegex'),
  isEmpty: handleIsEmpty,
  isNotEmpty: handleIsNotEmpty,
  arrayContains: pgArrayCondition(drizzleArrayContains),
  arrayOverlaps: pgArrayCondition(drizzleArrayOverlaps),
  arrayContained: pgArrayCondition(drizzleArrayContained)
}

/**
 * Dispatch a single filter operator to its handler. Returns null for any
 * unknown operator (matching the original `default` case).
 */
export function applyFilterOperator(
  operator: FilterOperator,
  ctx: FilterOperatorContext
): SQL | null {
  const handler = OPERATOR_HANDLERS[operator]
  return handler ? handler(ctx) : null
}
