/**
 * Filter utility functions for dashboard-level filtering
 *
 * NOTE: These are pure functions without internal caching.
 * Memoization should be handled at the component level using useMemo.
 */

import type { Filter, DashboardFilter, CubeMeta, GroupFilter, DashboardConfig, SimpleFilter } from '../types'

/**
 * Check if a filter should be included in the query (has valid values or doesn't require values)
 * @param filter - The filter to check
 * @returns true if the filter should be included, false otherwise
 */
function shouldIncludeFilter(filter: Filter): boolean {
  // Handle SimpleFilter
  if ('member' in filter && 'operator' in filter) {
    const simpleFilter = filter as SimpleFilter

    // Operators that don't require values
    const noValueOperators = ['set', 'notSet', 'isEmpty', 'isNotEmpty']
    if (noValueOperators.includes(simpleFilter.operator)) {
      return true
    }

    // For inDateRange, check if dateRange is provided as alternative to values
    if (simpleFilter.operator === 'inDateRange' && simpleFilter.dateRange) {
      return true
    }

    // For other operators, check if values exist and are non-empty
    return !!(simpleFilter.values && simpleFilter.values.length > 0)
  }

  // Handle GroupFilter - recursively check nested filters
  if ('type' in filter && 'filters' in filter) {
    const groupFilter = filter as GroupFilter
    // Include group filter if at least one nested filter is valid
    const validFilters = groupFilter.filters.filter(f => shouldIncludeFilter(f))
    return validFilters.length > 0
  }

  return false
}

/**
 * Get dashboard filters that should be applied to a portlet based on its mapping configuration
 *
 * @param dashboardFilters - All available dashboard filters
 * @param filterMapping - Array of filter IDs that apply to this portlet
 * @returns Array of filters that should be applied to the portlet
 */
export function getApplicableDashboardFilters(
  dashboardFilters: DashboardFilter[] | undefined,
  filterMapping: string[] | undefined
): Filter[] {
  if (!dashboardFilters || !dashboardFilters.length) {
    return []
  }

  // If no mapping is specified, no dashboard filters apply
  if (!filterMapping || !filterMapping.length) {
    return []
  }

  // Compute filters that are in the mapping AND have valid values
  return dashboardFilters
    .filter(df => filterMapping.includes(df.id))
    .filter(df => shouldIncludeFilter(df.filter))
    .map(df => df.filter)
}

/**
 * Convert GroupFilter format to server format
 * GroupFilter: { type: 'and', filters: [...] }
 * Server format: { and: [...] } or { or: [...] }
 */
function convertToServerFormat(filter: Filter): any {
  // Handle GroupFilter format
  if ('type' in filter && 'filters' in filter) {
    const groupFilter = filter as GroupFilter
    const convertedFilters = groupFilter.filters.map(convertToServerFormat)

    if (groupFilter.type === 'and') {
      return { and: convertedFilters }
    } else {
      return { or: convertedFilters }
    }
  }

  // Simple filter - return as-is
  return filter
}

/**
 * Filter format for merge operation:
 * - 'server': Returns {and: [...]} or {or: [...]} format (for API queries)
 * - 'client': Returns {type: 'and', filters: [...]} format (for UI components)
 */
export type FilterFormat = 'server' | 'client'

/**
 * Merge dashboard filters with portlet filters using AND logic
 * Dashboard filters are combined with portlet filters so both sets of filters apply
 *
 * @param dashboardFilters - Filters from dashboard-level configuration
 * @param portletFilters - Filters from portlet query
 * @param format - Output format: 'server' for API queries, 'client' for UI (default: 'server')
 * @returns Merged filter array with AND logic in the specified format
 */
export function mergeDashboardAndPortletFilters(
  dashboardFilters: Filter[],
  portletFilters: Filter[] | undefined,
  format: FilterFormat = 'server'
): Filter[] | undefined {
  // If no dashboard filters, return portlet filters as-is
  if (!dashboardFilters || dashboardFilters.length === 0) {
    return portletFilters
  }

  // If no portlet filters, return dashboard filters
  if (!portletFilters || portletFilters.length === 0) {
    return [...dashboardFilters]
  }

  // Both exist - need to merge with AND logic
  if (format === 'server') {
    // Server format: convert to {and: [...]} structure
    const allFilters = [...dashboardFilters, ...portletFilters].map(convertToServerFormat)
    return [{
      and: allFilters
    } as any]
  } else {
    // Client format: use {type: 'and', filters: [...]} structure
    const allFilters = [...dashboardFilters, ...portletFilters]
    return [{
      type: 'and',
      filters: allFilters
    } as GroupFilter]
  }
}

/**
 * @deprecated Use mergeDashboardAndPortletFilters(filters, portletFilters, 'client') instead
 */
export function mergeDashboardAndPortletFiltersClientFormat(
  dashboardFilters: Filter[],
  portletFilters: Filter[] | undefined
): Filter[] | undefined {
  return mergeDashboardAndPortletFilters(dashboardFilters, portletFilters, 'client')
}

/**
 * Check if a filter field exists in the cube metadata
 * This helps identify filters that might not apply to a specific portlet's data
 * @param filter - The filter to validate
 * @param cubeMeta - Cube metadata to validate against
 * @returns true if the filter field exists in any cube's measures or dimensions
 */
export function validateFilterForCube(
  filter: Filter,
  cubeMeta: CubeMeta | null
): boolean {
  if (!cubeMeta || !cubeMeta.cubes) {
    // If no metadata available, assume filter is valid (fail open)
    return true
  }

  // Extract member names from filter recursively
  const memberNames = extractMemberNamesFromFilter(filter)

  // Check if any of the member names exist in cube metadata
  return memberNames.some(memberName => {
    return cubeMeta.cubes.some(cube => {
      // Check measures
      const inMeasures = cube.measures?.some(m => m.name === memberName) ?? false
      // Check dimensions
      const inDimensions = cube.dimensions?.some(d => d.name === memberName) ?? false

      return inMeasures || inDimensions
    })
  })
}

/**
 * Extract all member names from a filter (handles nested group filters)
 * @param filter - The filter to extract members from
 * @returns Array of member names
 */
function extractMemberNamesFromFilter(filter: Filter): string[] {
  if ('member' in filter) {
    // SimpleFilter
    return [filter.member]
  } else if ('type' in filter && 'filters' in filter) {
    // GroupFilter - recursively extract from nested filters
    return filter.filters.flatMap(f => extractMemberNamesFromFilter(f))
  }

  return []
}

/**
 * Validate that all dashboard filters in a portlet's mapping exist and are valid
 * @param dashboardFilters - All available dashboard filters
 * @param filterMapping - The portlet's filter mapping
 * @param cubeMeta - Cube metadata for validation
 * @returns Object with validation result and list of invalid filter IDs
 */
export function validatePortletFilterMapping(
  dashboardFilters: DashboardFilter[] | undefined,
  filterMapping: string[] | undefined,
  cubeMeta: CubeMeta | null
): { isValid: boolean; invalidFilterIds: string[]; missingFilterIds: string[] } {
  if (!filterMapping || !filterMapping.length) {
    return { isValid: true, invalidFilterIds: [], missingFilterIds: [] }
  }

  if (!dashboardFilters || !dashboardFilters.length) {
    // Mapping references filters that don't exist
    return {
      isValid: false,
      invalidFilterIds: [],
      missingFilterIds: filterMapping
    }
  }

  const invalidFilterIds: string[] = []
  const missingFilterIds: string[] = []

  filterMapping.forEach(filterId => {
    const dashboardFilter = dashboardFilters.find(df => df.id === filterId)

    if (!dashboardFilter) {
      // Filter ID in mapping doesn't exist in dashboard filters
      missingFilterIds.push(filterId)
    } else {
      // Check if filter is valid for the cube metadata
      const isValid = validateFilterForCube(dashboardFilter.filter, cubeMeta)
      if (!isValid) {
        invalidFilterIds.push(filterId)
      }
    }
  })

  return {
    isValid: invalidFilterIds.length === 0 && missingFilterIds.length === 0,
    invalidFilterIds,
    missingFilterIds
  }
}

/**
 * Extract all unique measures, dimensions, and timeDimensions used across all portlets in a dashboard
 * This helps create a filtered schema view showing only fields relevant to the dashboard
 * @param dashboardConfig - Dashboard configuration
 * @returns Object with unique measures, dimensions, and timeDimensions
 */
export function extractDashboardFields(
  dashboardConfig: DashboardConfig
): { measures: Set<string>; dimensions: Set<string>; timeDimensions: Set<string> } {
  const measures = new Set<string>()
  const dimensions = new Set<string>()
  const timeDimensions = new Set<string>()

  // Iterate through all portlets
  dashboardConfig.portlets.forEach(portlet => {
    try {
      // Parse the query JSON
      const query = JSON.parse(portlet.query)

      // Extract measures
      if (query.measures && Array.isArray(query.measures)) {
        query.measures.forEach((measure: string) => measures.add(measure))
      }

      // Extract dimensions
      if (query.dimensions && Array.isArray(query.dimensions)) {
        query.dimensions.forEach((dimension: string) => dimensions.add(dimension))
      }

      // Extract timeDimensions
      if (query.timeDimensions && Array.isArray(query.timeDimensions)) {
        query.timeDimensions.forEach((td: any) => {
          if (td.dimension) {
            timeDimensions.add(td.dimension)
          }
        })
      }

      // Also extract from filters to catch any filtered fields
      if (query.filters) {
        extractFieldsFromFilters(query.filters).forEach(field => {
          // Try to determine if it's a measure, dimension, or timeDimension
          // by checking cube metadata or convention (add to dimensions by default)
          dimensions.add(field)
        })
      }
    } catch (e) {
      // Skip portlets with invalid query JSON
      console.warn('Failed to parse portlet query:', portlet.id, e)
    }
  })

  return { measures, dimensions, timeDimensions }
}

/**
 * Extract field names from filters recursively
 * @param filters - Filter array
 * @returns Array of unique field names
 */
function extractFieldsFromFilters(filters: Filter[]): string[] {
  const fields: string[] = []

  filters.forEach(filter => {
    if ('member' in filter) {
      // SimpleFilter
      fields.push(filter.member)
    } else if ('type' in filter && 'filters' in filter) {
      // GroupFilter - recurse
      fields.push(...extractFieldsFromFilters(filter.filters))
    }
  })

  return [...new Set(fields)] // Return unique fields
}

/**
 * Time dimension type from CubeQuery
 */
type TimeDimension = {
  dimension: string
  granularity?: string
  dateRange?: string[] | string
}

/**
 * Helper to get date range from a SimpleFilter (backward compatible)
 * Reads from both dateRange and values for compatibility
 * Handles both:
 * - Preset ranges: ["this quarter"], ["last 7 days"] (single string value)
 * - Custom ranges: ["2024-01-01", "2024-12-31"] (two date values)
 */
function getDateRangeFromFilter(filter: SimpleFilter): string[] | string | undefined {
  // Prefer dateRange for backward compatibility, fall back to values
  if (filter.dateRange) {
    return filter.dateRange
  }
  if (filter.values && filter.values.length > 0) {
    // Single value = preset like "this quarter", return as string
    // Multiple values = custom date range, return as array
    return filter.values.length === 1 ? filter.values[0] : filter.values
  }
  return undefined
}

/**
 * Apply universal time filters to a portlet's timeDimensions
 * Universal time filters apply their dateRange to ALL time dimensions in the portlet
 *
 * @param dashboardFilters - All dashboard filters
 * @param filterMapping - Filter IDs that apply to this portlet
 * @param portletTimeDimensions - The portlet's existing timeDimensions array
 * @returns Updated timeDimensions array with date ranges applied
 */
export function applyUniversalTimeFilters(
  dashboardFilters: DashboardFilter[] | undefined,
  filterMapping: string[] | undefined,
  portletTimeDimensions: TimeDimension[] | undefined
): TimeDimension[] | undefined {
  // Return as-is if no time dimensions in portlet (skip silently)
  if (!portletTimeDimensions || portletTimeDimensions.length === 0) {
    return portletTimeDimensions
  }

  // If no mapping specified, no filters apply
  if (!filterMapping || filterMapping.length === 0) {
    return portletTimeDimensions
  }

  // Find applicable universal time filters that have valid date ranges
  const universalTimeFilters = dashboardFilters
    ?.filter(df => df.isUniversalTime && filterMapping.includes(df.id))
    ?.filter(df => {
      // Must be a SimpleFilter with a valid dateRange
      if (!('member' in df.filter)) return false
      const simpleFilter = df.filter as SimpleFilter
      const dateRange = getDateRangeFromFilter(simpleFilter)
      return dateRange !== undefined
    })

  if (!universalTimeFilters || universalTimeFilters.length === 0) {
    return portletTimeDimensions
  }

  // Use the first universal time filter's dateRange (typically only one)
  const timeFilter = universalTimeFilters[0]
  const simpleFilter = timeFilter.filter as SimpleFilter
  const dateRange = getDateRangeFromFilter(simpleFilter)

  // Apply dateRange to ALL time dimensions (dashboard wins - overrides portlet dateRange)
  return portletTimeDimensions.map(td => ({
    ...td,
    dateRange: dateRange
  }))
}
