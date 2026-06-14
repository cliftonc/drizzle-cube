/**
 * Save-time validation helpers for PortletAnalysisModal, extracted to keep
 * the save handler flat.
 */

import type { CubeQuery } from '../../types'

/** True if a (possibly multi/funnel/flow/retention) query has content worth saving. */
export function analysisConfigHasContent(query: any): boolean {
  // Check for ServerFlowQuery format { flow: {...} }
  if ('flow' in query && query.flow) {
    // Flow mode: check for required configuration
    return !!(
      query.flow.bindingKey &&
      query.flow.timeDimension &&
      query.flow.eventDimension &&
      query.flow.startingStep?.filter
    )
  }

  if ('retention' in query && query.retention) {
    // Retention mode: check for required configuration
    return !!(
      query.retention.bindingKey &&
      query.retention.timeDimension &&
      query.retention.dateRange?.start &&
      query.retention.dateRange?.end
    )
  }

  if ('funnel' in query && query.funnel) {
    // Funnel mode: check for steps
    return !!(query.funnel.steps && query.funnel.steps.length >= 2)
  }

  if ('queries' in query) {
    // Multi-query: check the first query
    return queryHasFields(query.queries[0])
  }

  // Single query: check directly (type narrowed to CubeQuery)
  return queryHasFields(query as CubeQuery)
}

/** True if a single cube query selects at least one measure/dimension/time dimension. */
function queryHasFields(query: CubeQuery | undefined): boolean {
  return !!(
    (query?.measures && query.measures.length > 0) ||
    (query?.dimensions && query.dimensions.length > 0) ||
    (query?.timeDimensions && query.timeDimensions.length > 0)
  )
}

/** Alert message shown when a query of the given analysis type has no content. */
export function getEmptyContentMessage(analysisType: string): string {
  switch (analysisType) {
    case 'flow':
      return 'Please configure the flow analysis (binding key, time dimension, event dimension, and starting step filter).'
    case 'retention':
      return 'Please configure the retention analysis (binding key, time dimension, and date range).'
    case 'funnel':
      return 'Please add at least two funnel steps.'
    default:
      return 'Please add at least one metric or breakdown to your query.'
  }
}
