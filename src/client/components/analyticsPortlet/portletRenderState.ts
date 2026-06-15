/**
 * Decides which view AnalyticsPortlet should render (config-required, lazy
 * placeholder, loading, error, no-data, or the chart) from the resolved query
 * state. Pure logic extracted from the component to keep it flat. No behaviour
 * change.
 */

import type { FlowChartData } from '../../types/flow'
import type { RetentionChartData } from '../../types/retention'
import type { CubeQuery, MultiQueryConfig, ServerFunnelQuery } from '../../types'
import type { ServerFlowQuery } from '../../types/flow'
import type { ServerRetentionQuery } from '../../types/retention'

export type PortletRenderKind =
  | 'config-required'
  | 'lazy-placeholder'
  | 'loading'
  | 'error'
  | 'no-data'
  | 'chart'

export interface PortletRenderStateParams {
  hasChartConfig: boolean
  hasMandatoryFields: boolean
  shouldSkipQuery: boolean
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

  // Loading during initial load OR during refresh (isFetching)
  if (p.isLoading || p.isFetching || (p.queryObject && !p.resultSet && !p.error)) return 'loading'

  if (p.error) return 'error'

  if (!hasValidDataForMode(p)) return 'no-data'

  return 'chart'
}
