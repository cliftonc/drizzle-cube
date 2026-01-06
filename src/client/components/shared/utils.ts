/**
 * Utility functions for QueryBuilder components
 *
 * Common filter/query utilities are imported from the shared module
 * to avoid duplication. Only component-specific utilities are defined here.
 */

import type { CubeQuery, Filter, SimpleFilter } from '../../types'
import type { MetaField, MetaResponse } from '../QueryBuilder/types'
import { FILTER_OPERATORS } from '../QueryBuilder/types'

// ============================================================================
// Re-export common utilities from shared module (canonical source)
// ============================================================================
export {
  // Filter type guards
  isSimpleFilter,
  isGroupFilter,
  isAndFilter,
  isOrFilter,
  // Filter manipulation
  flattenFilters,
  countFilters,
  createSimpleFilter,
  createAndFilter,
  createOrFilter,
  cleanupFilters,
  // Filter transformation
  transformFiltersForServer,
  transformFiltersFromServer,
  // Query utilities
  hasQueryContent,
  cleanQuery,
  cleanQueryForServer,
  transformQueryForUI,
  // Schema utilities
  getCubeNameFromField,
  getFieldType,
  getFieldTitle,
  getAvailableOperators,
  getAllFilterableFields,
  // Date utilities
  convertDateRangeTypeToValue,
  requiresNumberInput,
  formatDateForCube,
} from '../../shared/utils'

// Import for internal use
import {
  isSimpleFilter,
  isGroupFilter,
  getCubeNameFromField,
  getAllFilterableFields,
  getFieldType,
} from '../../shared/utils'

// ============================================================================
// Component-specific utilities (unique to this module)
// ============================================================================

/**
 * Check if a field is selected in the current query
 */
export function isFieldSelected(
  fieldName: string,
  fieldType: 'measures' | 'dimensions' | 'timeDimensions',
  query: CubeQuery
): boolean {
  switch (fieldType) {
    case 'measures':
      return query.measures?.includes(fieldName) || false
    case 'dimensions':
      return query.dimensions?.includes(fieldName) || false
    case 'timeDimensions':
      return query.timeDimensions?.some(td => td.dimension === fieldName) || false
    default:
      return false
  }
}

/**
 * Get all time dimension fields from schema
 */
export function getTimeDimensionFields(schema: MetaResponse): MetaField[] {
  const timeDimensions: MetaField[] = []

  schema.cubes.forEach(cube => {
    cube.dimensions.forEach(dimension => {
      if (dimension.type === 'time') {
        timeDimensions.push(dimension)
      }
    })
  })

  return timeDimensions
}

/**
 * Get all non-time dimension fields from schema
 */
export function getRegularDimensionFields(schema: MetaResponse): MetaField[] {
  const dimensions: MetaField[] = []

  schema.cubes.forEach(cube => {
    cube.dimensions.forEach(dimension => {
      if (dimension.type !== 'time') {
        dimensions.push(dimension)
      }
    })
  })

  return dimensions
}

/**
 * Get all measure fields from schema
 */
export function getMeasureFields(schema: MetaResponse): MetaField[] {
  const measures: MetaField[] = []

  schema.cubes.forEach(cube => {
    cube.measures.forEach(measure => {
      measures.push(measure)
    })
  })

  return measures
}

/**
 * Get count of selected fields across all types
 */
export function getSelectedFieldsCount(query: CubeQuery): number {
  let count = 0
  if (query.measures) count += query.measures.length
  if (query.dimensions) count += query.dimensions.length
  if (query.timeDimensions) count += query.timeDimensions.length
  return count
}

/**
 * Group fields by cube name
 */
export function groupFieldsByCube(fields: MetaField[]): Record<string, MetaField[]> {
  return fields.reduce((groups, field) => {
    const cubeName = getCubeNameFromField(field.name)
    if (!groups[cubeName]) {
      groups[cubeName] = []
    }
    groups[cubeName].push(field)
    return groups
  }, {} as Record<string, MetaField[]>)
}

/**
 * Create an empty query object
 */
export function createEmptyQuery(): CubeQuery {
  return {}
}

/**
 * Get all filterable fields from schema (measures, dimensions, and time dimensions)
 * Returns ALL fields if no query provided, or only query fields if query provided
 */
export function getFilterableFields(schema: MetaResponse, query?: CubeQuery): MetaField[] {
  const allFields: MetaField[] = []

  schema.cubes.forEach(cube => {
    allFields.push(...cube.measures)
    allFields.push(...cube.dimensions)
  })

  // If no query provided, return all fields
  if (!query) {
    return allFields.sort((a, b) => a.name.localeCompare(b.name))
  }

  // Get currently selected fields from the query
  const selectedFields = new Set<string>()

  // Add measures
  if (query.measures) {
    query.measures.forEach(measure => selectedFields.add(measure))
  }

  // Add dimensions
  if (query.dimensions) {
    query.dimensions.forEach(dimension => selectedFields.add(dimension))
  }

  // Add time dimensions
  if (query.timeDimensions) {
    query.timeDimensions.forEach(td => selectedFields.add(td.dimension))
  }

  // Filter to only include selected fields
  const filterableFields = allFields.filter(field => selectedFields.has(field.name))

  return filterableFields.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get organized filter field options with query fields prioritized at top
 */
export function getOrganizedFilterFields(schema: MetaResponse, query?: CubeQuery): {
  queryFields: MetaField[]
  allFields: MetaField[]
} {
  const allFields = getAllFilterableFields(schema)

  if (!query) {
    return {
      queryFields: [],
      allFields
    }
  }

  // Get currently selected fields from the query
  const selectedFields = new Set<string>()

  // Add measures
  if (query.measures) {
    query.measures.forEach(measure => selectedFields.add(measure))
  }

  // Add dimensions
  if (query.dimensions) {
    query.dimensions.forEach(dimension => selectedFields.add(dimension))
  }

  // Add time dimensions
  if (query.timeDimensions) {
    query.timeDimensions.forEach(td => selectedFields.add(td.dimension))
  }

  // Split fields into query fields and other fields
  const queryFields = allFields.filter(field => selectedFields.has(field.name))

  return {
    queryFields,
    allFields
  }
}

/**
 * Validate a filter
 */
export function validateFilter(filter: SimpleFilter, schema: MetaResponse): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Check if field exists
  const fields = getFilterableFields(schema)
  const fieldExists = fields.some(f => f.name === filter.member)

  if (!fieldExists) {
    errors.push(`Field "${filter.member}" does not exist`)
  }

  // Check if operator is valid for field type
  if (fieldExists) {
    const fieldType = getFieldType(filter.member, schema)
    const operatorMeta = FILTER_OPERATORS[filter.operator]

    if (!operatorMeta) {
      errors.push(`Invalid operator "${filter.operator}"`)
    } else if (!operatorMeta.fieldTypes.includes(fieldType)) {
      errors.push(`Operator "${filter.operator}" is not valid for field type "${fieldType}"`)
    } else {
      // Check values
      if (operatorMeta.requiresValues && (!filter.values || filter.values.length === 0)) {
        errors.push(`Operator "${filter.operator}" requires values`)
      }

      if (!operatorMeta.supportsMultipleValues && filter.values && filter.values.length > 1) {
        errors.push(`Operator "${filter.operator}" does not support multiple values`)
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Clean up filters by removing any that reference fields not in the current query (legacy)
 * Only used for backward compatibility - filters on non-query fields are now supported
 */
export function cleanupFiltersLegacy(filters: Filter[], query: CubeQuery): Filter[] {
  if (!filters || filters.length === 0) {
    return []
  }

  // Get currently selected fields from the query
  const selectedFields = new Set<string>()

  // Add measures
  if (query.measures) {
    query.measures.forEach(measure => selectedFields.add(measure))
  }

  // Add dimensions
  if (query.dimensions) {
    query.dimensions.forEach(dimension => selectedFields.add(dimension))
  }

  // Add time dimensions
  if (query.timeDimensions) {
    query.timeDimensions.forEach(td => selectedFields.add(td.dimension))
  }

  // Recursively clean filters
  const cleanFilter = (filter: Filter): Filter | null => {
    if (isSimpleFilter(filter)) {
      // Remove filter if its field is not selected
      return selectedFields.has(filter.member) ? filter : null
    } else if (isGroupFilter(filter)) {
      // Clean group recursively
      const cleanedFilters = filter.filters.map(cleanFilter).filter(f => f !== null) as Filter[]
      return cleanedFilters.length > 0 ? { type: filter.type, filters: cleanedFilters } : null
    }
    return null
  }

  // Clean all filters and remove nulls
  const cleanedFilters = filters.map(cleanFilter).filter(f => f !== null) as Filter[]

  return cleanedFilters
}

/**
 * Get the time dimensions that have date ranges applied
 */
export function getTimeDimensionsWithDateRanges(query: CubeQuery): Record<string, string | string[]> {
  const dateRanges: Record<string, string | string[]> = {}

  if (query.timeDimensions) {
    query.timeDimensions.forEach(td => {
      if (td.dateRange) {
        dateRanges[td.dimension] = td.dateRange
      }
    })
  }

  return dateRanges
}

/**
 * Check if a query has any time dimensions
 */
export function hasTimeDimensions(query: CubeQuery): boolean {
  return Boolean(query.timeDimensions && query.timeDimensions.length > 0)
}

// ============================================================================
// Sorting utility functions
// ============================================================================

/**
 * Clean up order object by removing fields that are no longer in the query
 */
export function cleanupOrder(order: Record<string, 'asc' | 'desc'> | undefined, query: CubeQuery): Record<string, 'asc' | 'desc'> | undefined {
  if (!order) return undefined

  const allFields = [
    ...(query.measures || []),
    ...(query.dimensions || []),
    ...(query.timeDimensions || []).map(td => td.dimension)
  ]

  const cleanedOrder: Record<string, 'asc' | 'desc'> = {}
  for (const [field, direction] of Object.entries(order)) {
    if (allFields.includes(field)) {
      cleanedOrder[field] = direction
    }
  }

  return Object.keys(cleanedOrder).length > 0 ? cleanedOrder : undefined
}

/**
 * Get sort direction for a field from the order object
 */
export function getSortDirection(fieldName: string, order: Record<string, 'asc' | 'desc'> | undefined): 'asc' | 'desc' | null {
  return order?.[fieldName] || null
}

/**
 * Get tooltip text for sort button based on current direction
 */
export function getSortTooltip(direction: 'asc' | 'desc' | null): string {
  switch (direction) {
    case 'asc':
      return 'Sorted ascending (click for descending)'
    case 'desc':
      return 'Sorted descending (click to remove)'
    default:
      return 'Click to sort ascending'
  }
}

/**
 * Get next sort direction in the cycle: null -> asc -> desc -> null
 */
export function getNextSortDirection(current: 'asc' | 'desc' | null): 'asc' | 'desc' | null {
  switch (current) {
    case null:
      return 'asc'
    case 'asc':
      return 'desc'
    case 'desc':
      return null
    default:
      return 'asc'
  }
}

// ============================================================================
// Compact filter bar date utilities
// ============================================================================

/**
 * Date preset configuration for compact filter bar
 */
export interface DatePreset {
  id: string
  label: string
  value: string
}

export const DATE_PRESETS: DatePreset[] = [
  { id: 'today', label: 'Today', value: 'today' },
  { id: 'yesterday', label: 'Yesterday', value: 'yesterday' },
  { id: '7d', label: '7D', value: 'last 7 days' },
  { id: '30d', label: '30D', value: 'last 30 days' },
  { id: '3m', label: '3M', value: 'last 3 months' },
  { id: '6m', label: '6M', value: 'last 6 months' },
  { id: '12m', label: '12M', value: 'last 12 months' }
]

export const XTD_OPTIONS: DatePreset[] = [
  { id: 'wtd', label: 'Week to Date', value: 'this week' },
  { id: 'mtd', label: 'Month to Date', value: 'this month' },
  { id: 'qtd', label: 'Quarter to Date', value: 'this quarter' },
  { id: 'ytd', label: 'Year to Date', value: 'this year' }
]

/**
 * Calculate actual date range from a preset string
 * Returns start and end dates for display purposes
 */
export function calculateDateRange(preset: string): { start: Date, end: Date } | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const endOfToday = new Date(today)
  endOfToday.setHours(23, 59, 59, 999)

  switch (preset.toLowerCase()) {
    case 'today': {
      return { start: today, end: endOfToday }
    }
    case 'yesterday': {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const endOfYesterday = new Date(yesterday)
      endOfYesterday.setHours(23, 59, 59, 999)
      return { start: yesterday, end: endOfYesterday }
    }
    case 'this week': {
      const startOfWeek = new Date(today)
      const dayOfWeek = startOfWeek.getDay()
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday as first day
      startOfWeek.setDate(startOfWeek.getDate() - diff)
      return { start: startOfWeek, end: endOfToday }
    }
    case 'this month': {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      return { start: startOfMonth, end: endOfToday }
    }
    case 'this quarter': {
      const quarter = Math.floor(today.getMonth() / 3)
      const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1)
      return { start: startOfQuarter, end: endOfToday }
    }
    case 'this year': {
      const startOfYear = new Date(today.getFullYear(), 0, 1)
      return { start: startOfYear, end: endOfToday }
    }
    default: {
      // Handle "last N units" patterns
      const lastNMatch = preset.match(/^last\s+(\d+)\s+(day|days|week|weeks|month|months|quarter|quarters|year|years)$/i)
      if (lastNMatch) {
        const num = parseInt(lastNMatch[1], 10)
        const unit = lastNMatch[2].toLowerCase()
        const startDate = new Date(today)

        if (unit === 'day' || unit === 'days') {
          startDate.setDate(startDate.getDate() - num + 1)
        } else if (unit === 'week' || unit === 'weeks') {
          startDate.setDate(startDate.getDate() - (num * 7) + 1)
        } else if (unit === 'month' || unit === 'months') {
          startDate.setMonth(startDate.getMonth() - num)
          startDate.setDate(startDate.getDate() + 1)
        } else if (unit === 'quarter' || unit === 'quarters') {
          startDate.setMonth(startDate.getMonth() - (num * 3))
          startDate.setDate(startDate.getDate() + 1)
        } else if (unit === 'year' || unit === 'years') {
          startDate.setFullYear(startDate.getFullYear() - num)
          startDate.setDate(startDate.getDate() + 1)
        }

        return { start: startDate, end: endOfToday }
      }

      // Handle "last week", "last month", etc. (without number)
      const lastUnitMatch = preset.match(/^last\s+(week|month|quarter|year)$/i)
      if (lastUnitMatch) {
        const unit = lastUnitMatch[1].toLowerCase()

        if (unit === 'week') {
          const endOfLastWeek = new Date(today)
          const dayOfWeek = endOfLastWeek.getDay()
          const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
          endOfLastWeek.setDate(endOfLastWeek.getDate() - diff - 1)
          endOfLastWeek.setHours(23, 59, 59, 999)

          const startOfLastWeek = new Date(endOfLastWeek)
          startOfLastWeek.setDate(startOfLastWeek.getDate() - 6)
          startOfLastWeek.setHours(0, 0, 0, 0)

          return { start: startOfLastWeek, end: endOfLastWeek }
        } else if (unit === 'month') {
          const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
          const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
          endOfLastMonth.setHours(23, 59, 59, 999)
          return { start: startOfLastMonth, end: endOfLastMonth }
        } else if (unit === 'quarter') {
          const currentQuarter = Math.floor(today.getMonth() / 3)
          const lastQuarter = currentQuarter === 0 ? 3 : currentQuarter - 1
          const lastQuarterYear = currentQuarter === 0 ? today.getFullYear() - 1 : today.getFullYear()
          const startOfLastQuarter = new Date(lastQuarterYear, lastQuarter * 3, 1)
          const endOfLastQuarter = new Date(lastQuarterYear, lastQuarter * 3 + 3, 0)
          endOfLastQuarter.setHours(23, 59, 59, 999)
          return { start: startOfLastQuarter, end: endOfLastQuarter }
        } else if (unit === 'year') {
          const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1)
          const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31)
          endOfLastYear.setHours(23, 59, 59, 999)
          return { start: startOfLastYear, end: endOfLastYear }
        }
      }

      return null
    }
  }
}

/**
 * Format a date range for display (e.g., "Jan 1, 2024 - Jan 31, 2024")
 */
export function formatDateRangeDisplay(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }

  const startStr = start.toLocaleDateString('en-US', options)
  const endStr = end.toLocaleDateString('en-US', options)

  // If same day, just show one date
  if (startStr === endStr) {
    return startStr
  }

  // If same year, omit year from start date
  if (start.getFullYear() === end.getFullYear()) {
    const startNoYear: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    return `${start.toLocaleDateString('en-US', startNoYear)} - ${endStr}`
  }

  return `${startStr} - ${endStr}`
}

/**
 * Detect preset ID from a date range value
 * Returns the preset ID (e.g., '7d', 'mtd') or 'custom' if not a preset
 */
export function detectPresetFromDateRange(dateRange: string | string[] | undefined): string | null {
  if (!dateRange) return null

  // Custom date range (array of dates)
  if (Array.isArray(dateRange)) {
    return 'custom'
  }

  const normalizedRange = dateRange.toLowerCase().trim()

  // Check regular presets
  for (const preset of DATE_PRESETS) {
    if (preset.value.toLowerCase() === normalizedRange) {
      return preset.id
    }
  }

  // Check XTD presets
  for (const preset of XTD_OPTIONS) {
    if (preset.value.toLowerCase() === normalizedRange) {
      return preset.id
    }
  }

  // Check for "last N units" patterns that don't match exact presets
  const lastNMatch = normalizedRange.match(/^last\s+(\d+)\s+(day|days|week|weeks|month|months|quarter|quarters|year|years)$/i)
  if (lastNMatch) {
    return 'custom' // Dynamic last N is treated as custom
  }

  return 'custom'
}

/**
 * Format filter value for display in a compact chip
 */
export function formatFilterValueDisplay(values: any[], operator: string): string {
  if (!values || values.length === 0) {
    // Handle operators that don't need values
    if (operator === 'set') return 'is set'
    if (operator === 'notSet') return 'is not set'
    if (operator === 'isEmpty') return 'is empty'
    if (operator === 'isNotEmpty') return 'is not empty'
    return ''
  }

  const formattedValues = values.map(v => {
    if (v === true) return 'true'
    if (v === false) return 'false'
    if (v === null || v === undefined) return 'null'
    return String(v)
  })

  switch (operator) {
    case 'equals':
      return formattedValues.length === 1 ? `= ${formattedValues[0]}` : `in (${formattedValues.join(', ')})`
    case 'notEquals':
      return formattedValues.length === 1 ? `!= ${formattedValues[0]}` : `not in (${formattedValues.join(', ')})`
    case 'contains':
      return `contains "${formattedValues[0]}"`
    case 'notContains':
      return `!contains "${formattedValues[0]}"`
    case 'startsWith':
      return `starts with "${formattedValues[0]}"`
    case 'endsWith':
      return `ends with "${formattedValues[0]}"`
    case 'gt':
      return `> ${formattedValues[0]}`
    case 'gte':
      return `>= ${formattedValues[0]}`
    case 'lt':
      return `< ${formattedValues[0]}`
    case 'lte':
      return `<= ${formattedValues[0]}`
    case 'between':
      return `${formattedValues[0]} - ${formattedValues[1] || '?'}`
    case 'in':
      return `in (${formattedValues.join(', ')})`
    case 'notIn':
      return `not in (${formattedValues.join(', ')})`
    case 'set':
      return 'is set'
    case 'notSet':
      return 'is not set'
    default:
      return formattedValues.join(', ')
  }
}
