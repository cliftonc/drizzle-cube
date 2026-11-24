/**
 * Decides which view AnalyticsPortlet should render (config-required, lazy
 * placeholder, loading, error, no-data, or the chart) from the resolved query
 * state. Pure logic extracted from the component to keep it flat. No behaviour
 * change.
 */

import type { FlowChartData } from '../../types/flow.js'
import type { RetentionChartData } from '../../types/retention.js'
import type { CubeQuery, MultiQueryConfig, ServerFunnelQuery } from '../../types.js'
import type { ServerFlowQuery } from '../../types/flow.js'
import type { ServerRetentionQuery } from '../../types/retention.js'

export type PortletRenderKind =
  | 'config-required'
  | 'lazy-placeholder'
  | 'loading'
  | 'error'
  | 'no-data'
  | 'one-query-only'
  | 'chart'

export interface PortletRenderStateParams {
  hasChartConfig: boolean
  hasMandatoryFields: boolean
  shouldSkipQuery: boolean
  /**
   * Whether the chart has something to show even with no rows — true for the
   * content-first types, meaning those whose config sets `skipQuery`. A
   * markdown narrative whose whole job is to say "no incidents this week" must
   * survive an empty result rather than being replaced by the no-data view.
   */
  rendersWithoutData: boolean
  /**
   * The chart config sets `fetchesOwnData`: the chart loads its own data, so
   * the portlet's loading, error and no-data views do not apply. The chart
   * reads one query only.
   */
  fetchesOwnData: boolean
  eagerLoad: boolean
  isVisible: boolean
  isLoading: boolean
  isFetching: boolean
  error: unknown
  // Mode flags
  isMultiQuery: boolean
  isFunnelMode: boolean
  isFlowMode: boolean
  isRetentionMode: boolean
  // Parsed queries
  queryObject: CubeQuery | null
  multiQueryConfig: MultiQueryConfig | null
  serverFunnelQuery: ServerFunnelQuery | null
  serverFlowQuery: ServerFlowQuery | null
  serverRetentionQuery: ServerRetentionQuery | null
  // Data
  resultSet: unknown
  multiQueryData: unknown[] | null
  flowChartData: FlowChartData | null
  retentionChartData: RetentionChartData | null
}

/**
 * Whether the active mode has produced valid data to render a chart.
 */
function hasValidDataForMode(p: PortletRenderStateParams): boolean {
  if (p.isRetentionMode) return p.retentionChartData !== null && p.serverRetentionQuery !== null
  if (p.isFlowMode) return p.flowChartData !== null && p.serverFlowQuery !== null
  if (p.isFunnelMode) return p.multiQueryData !== null && p.serverFunnelQuery !== null
  if (p.isMultiQuery) return p.multiQueryData !== null && p.multiQueryConfig !== null
  return p.resultSet !== null && p.queryObject !== null
}

/**
 * Resolve which view the portlet should render.
 */
export function resolvePortletRenderKind(p: PortletRenderStateParams): PortletRenderKind {
  // Config required (not for skipQuery charts)
  if (!p.hasChartConfig && p.hasMandatoryFields) return 'config-required'

  // Lazy-load placeholder for portlets not yet visible
  if (!p.shouldSkipQuery && !p.eagerLoad && !p.isVisible) return 'lazy-placeholder'

  // Charts that don't need queries skip loading/error/no-data handling
  if (p.shouldSkipQuery) return 'chart'

  // A chart that loads its own data owns those states too, but it reads one query only
  if (p.fetchesOwnData) {
    return p.isMultiQuery || p.isFunnelMode || p.isFlowMode || p.isRetentionMode ? 'one-query-only' : 'chart'
  }

  // Keep the chart mounted while its cached data refreshes.
  if (p.isLoading || (p.isFetching && !hasValidDataForMode(p)) || (p.queryObject && !p.resultSet && !p.error)) return 'loading'

  if (p.error) return 'error'

  // A content-first chart renders its own copy whether or not rows came back.
  if (!hasValidDataForMode(p)) return p.rendersWithoutData ? 'chart' : 'no-data'

  return 'chart'
}
