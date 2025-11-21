/**
 * Filter utility functions for dashboard-level filtering
 */

import type { Filter, DashboardFilter, CubeMeta, GroupFilter, DashboardConfig } from '../types'

/**
 * Get dashboard filters that should be applied to a portlet based on its mapping configuration
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

  // Return filters that are in the mapping
  return dashboardFilters
    .filter(df => filterMapping.includes(df.id))
    .map(df => df.filter)
}

/**
 * Merge dashboard filters with portlet filters using AND logic
 * Dashboard filters are combined with portlet filters so both sets of filters apply
 * @param dashboardFilters - Filters from dashboard-level configuration
 * @param portletFilters - Filters from portlet query
 * @returns Merged filter array with AND logic
 */
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

export function mergeDashboardAndPortletFilters(
  dashboardFilters: Filter[],
  portletFilters: Filter[] | undefined
): Filter[] | undefined {
  // If no dashboard filters, return portlet filters as-is
  if (!dashboardFilters || dashboardFilters.length === 0) {
    return portletFilters
  }

  // If no portlet filters, return dashboard filters
  if (!portletFilters || portletFilters.length === 0) {
    return dashboardFilters
  }

  // Both exist - need to merge with AND logic
  // We need to combine them in a way that both sets of filters apply

  // Flatten both filter arrays and convert to server format
  const allFilters = [...dashboardFilters, ...portletFilters].map(convertToServerFormat)

  // Wrap all filters in a single AND group using server format
  return [{
    and: allFilters
  } as any]
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
