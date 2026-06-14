/**
 * Query parsing + dashboard-filter merging for AnalyticsPortlet.
 *
 * Parses the portlet's JSON query string and detects which of the supported
 * formats it is (single CubeQuery, MultiQueryConfig, ServerFunnelQuery,
 * ServerFlowQuery, ServerRetentionQuery), merging applicable dashboard filters
 * along the way. Extracted from AnalyticsPortlet to keep the component flat.
 */

import type {
  CubeQuery,
  DashboardFilter,
  DashboardFilterMapping,
  Filter,
  MultiQueryConfig,
  ServerFunnelQuery
} from '../../types'
import { isMultiQueryConfig, isServerFunnelQuery } from '../../types'
import type { ServerFlowQuery } from '../../types/flow'
import { isServerFlowQuery } from '../../types/flow'
import type { ServerRetentionQuery } from '../../types/retention'
import { isServerRetentionQuery } from '../../types/retention'
import {
  getApplicableDashboardFilters,
  mergeDashboardAndPortletFilters,
  applyUniversalTimeFilters,
  mappingIncludesFilter
} from '../../utils/filterUtils'

export interface ParsedPortletQuery {
  queryObject: CubeQuery | null
  multiQueryConfig: MultiQueryConfig | null
  serverFunnelQuery: ServerFunnelQuery | null
  serverFlowQuery: ServerFlowQuery | null
  serverRetentionQuery: ServerRetentionQuery | null
}

const EMPTY_RESULT: ParsedPortletQuery = {
  queryObject: null,
  multiQueryConfig: null,
  serverFunnelQuery: null,
  serverFlowQuery: null,
  serverRetentionQuery: null
}

export interface ParsePortletQueryParams {
  query: string
  shouldSkipQuery: boolean
  regularFilters?: DashboardFilter[]
  dashboardFilters?: DashboardFilter[]
  dashboardFilterMapping?: DashboardFilterMapping
}

/**
 * Resolve the time-dimension member string from a funnel's timeDimension config.
 */
function resolveFunnelTimeDimensionMember(
  timeDimension: ServerFunnelQuery['funnel']['timeDimension']
): string | undefined {
  if (typeof timeDimension === 'string') {
    return timeDimension
  }
  if (Array.isArray(timeDimension) && timeDimension.length > 0) {
    const td = timeDimension[0]
    return `${td.cube}.${td.dimension}`
  }
  return undefined
}

/**
 * Apply universal time filters to step 0 of a funnel query as an inDateRange filter.
 */
function applyUniversalTimeToFunnel(
  modifiedFunnel: ServerFunnelQuery,
  dashboardFilters: DashboardFilter[] | undefined,
  dashboardFilterMapping: DashboardFilterMapping | undefined
): void {
  const universalTimeFilters = dashboardFilters?.filter(df =>
    df.isUniversalTime && mappingIncludesFilter(dashboardFilterMapping, df.id)
  )
  if (!universalTimeFilters || universalTimeFilters.length === 0 || modifiedFunnel.funnel.steps.length === 0) {
    return
  }

  const timeFilter = universalTimeFilters[0]
  if (!('member' in timeFilter.filter)) return

  const simpleFilter = timeFilter.filter as { member: string; operator: string; values?: string[]; dateRange?: string }
  const dateRangeValue = simpleFilter.dateRange || simpleFilter.values?.[0]
  if (!dateRangeValue) return

  const timeDimMember = resolveFunnelTimeDimensionMember(modifiedFunnel.funnel.timeDimension)
  if (!timeDimMember) return

  const step0 = { ...modifiedFunnel.funnel.steps[0] }
  const timeRangeFilter = {
    member: timeDimMember,
    operator: 'inDateRange',
    values: [] as string[],
    dateRange: dateRangeValue
  }
  const existingFilters = step0.filter ? (Array.isArray(step0.filter) ? step0.filter : [step0.filter]) : []
  step0.filter = [...existingFilters, timeRangeFilter]
  modifiedFunnel.funnel.steps[0] = step0
}

/**
 * Apply dashboard filters to a ServerFunnelQuery, returning a new (cloned) funnel.
 */
function applyFiltersToFunnel(
  funnelQuery: ServerFunnelQuery,
  applicableFilters: Filter[],
  dashboardFilters: DashboardFilter[] | undefined,
  dashboardFilterMapping: DashboardFilterMapping | undefined
): ServerFunnelQuery {
  // Clone the funnel query to avoid mutating the original
  const modifiedFunnel = { ...funnelQuery, funnel: { ...funnelQuery.funnel, steps: [...funnelQuery.funnel.steps] } }

  // Regular filters → merge into step 0's filter
  if (applicableFilters.length > 0 && modifiedFunnel.funnel.steps.length > 0) {
    const step0 = { ...modifiedFunnel.funnel.steps[0] }
    const existingFilters = step0.filter ? (Array.isArray(step0.filter) ? step0.filter : [step0.filter]) : []
    const mergedFilters = mergeDashboardAndPortletFilters(applicableFilters, existingFilters as any)
    step0.filter = mergedFilters
    modifiedFunnel.funnel.steps[0] = step0
  }

  // Universal time filters → apply as inDateRange filter on step 0
  applyUniversalTimeToFunnel(modifiedFunnel, dashboardFilters, dashboardFilterMapping)

  return modifiedFunnel
}

/**
 * Parse the portlet query string and merge applicable dashboard filters.
 * Returns a discriminated set of possible query shapes (only one non-null).
 */
export function parsePortletQuery(params: ParsePortletQueryParams): ParsedPortletQuery {
  const { query, shouldSkipQuery, regularFilters, dashboardFilters, dashboardFilterMapping } = params

  // Skip query parsing for charts that don't need queries
  if (shouldSkipQuery) {
    return EMPTY_RESULT
  }

  try {
    const parsed = JSON.parse(query)

    // Get applicable dashboard filters (excluding universal time filters - they apply to timeDimensions)
    const applicableFilters = getApplicableDashboardFilters(regularFilters, dashboardFilterMapping)

    // ServerRetentionQuery format { retention: {...} }
    // Retention queries don't have dashboard filter merging yet (could be added later)
    if (isServerRetentionQuery(parsed)) {
      return { ...EMPTY_RESULT, serverRetentionQuery: parsed as ServerRetentionQuery }
    }

    // ServerFlowQuery format { flow: {...} }
    // Flow queries don't have dashboard filter merging yet (could be added later)
    if (isServerFlowQuery(parsed)) {
      return { ...EMPTY_RESULT, serverFlowQuery: parsed as ServerFlowQuery }
    }

    // ServerFunnelQuery format { funnel: {...} }
    if (isServerFunnelQuery(parsed)) {
      const modifiedFunnel = applyFiltersToFunnel(
        parsed as ServerFunnelQuery,
        applicableFilters,
        dashboardFilters,
        dashboardFilterMapping
      )
      return { ...EMPTY_RESULT, serverFunnelQuery: modifiedFunnel }
    }

    // Multi-query configuration: apply filters to each query in the array
    if (isMultiQueryConfig(parsed)) {
      const multiConfig: MultiQueryConfig = {
        ...parsed,
        queries: parsed.queries.map(q => ({
          ...q,
          filters: mergeDashboardAndPortletFilters(applicableFilters, q.filters),
          timeDimensions: applyUniversalTimeFilters(dashboardFilters, dashboardFilterMapping, q.timeDimensions)
        }))
      }
      return { ...EMPTY_RESULT, multiQueryConfig: multiConfig }
    }

    // Single query: existing behavior
    const mergedFilters = mergeDashboardAndPortletFilters(applicableFilters, parsed.filters)
    const mergedTimeDimensions = applyUniversalTimeFilters(
      dashboardFilters,
      dashboardFilterMapping,
      parsed.timeDimensions
    )

    return {
      ...EMPTY_RESULT,
      queryObject: {
        ...parsed,
        filters: mergedFilters,
        timeDimensions: mergedTimeDimensions
      }
    }
  } catch (e) {
    console.error('AnalyticsPortlet: Invalid query JSON:', e)
    return EMPTY_RESULT
  }
}
