/**
 * resultsPanelDerive
 *
 * Small pure helpers for AnalysisResultsPanel derived values, extracted to keep
 * the component body flat. Behaviour is identical to the previous inline logic.
 */

export interface DebugDataEntry {
  sql: unknown
  analysis: unknown
  mode: unknown
  queryType: unknown
  joinType: unknown
  cubesUsed: unknown[]
  modeMetadata: unknown
  loading: boolean
  error: unknown
}

const EMPTY_DEBUG_DATA: DebugDataEntry = {
  sql: null,
  analysis: null,
  mode: null,
  queryType: null,
  joinType: null,
  cubesUsed: [],
  modeMetadata: undefined,
  loading: false,
  error: null
}

/**
 * Resolve the active debug entry, falling back to an empty placeholder.
 * The fallback is cast to the element type so callers keep their precise typing.
 */
export function resolveDebugData<T>(
  debugDataPerQuery: T[],
  activeDebugIndex: number
): T {
  return debugDataPerQuery[activeDebugIndex] || (EMPTY_DEBUG_DATA as unknown as T)
}

interface ChartViewParams {
  isCurrentChartRenderable: boolean
  isFlowMode: boolean
  isFunnelMode: boolean
  isRetentionMode: boolean
}

/** Whether the chart view toggle should be enabled. */
export function isChartViewEnabled({
  isCurrentChartRenderable,
  isFlowMode,
  isFunnelMode,
  isRetentionMode
}: ChartViewParams): boolean {
  return isCurrentChartRenderable || isFlowMode || isFunnelMode || isRetentionMode
}

function flowHasData(flowData: { nodes?: unknown[]; links?: unknown[] } | undefined): boolean {
  if (!flowData || typeof flowData !== 'object') return false
  if (!('nodes' in flowData) || !('links' in flowData)) return false
  const hasNodes = Array.isArray(flowData.nodes) && flowData.nodes.length > 0
  const hasLinks = Array.isArray(flowData.links) && flowData.links.length > 0
  return hasNodes || hasLinks
}

/**
 * Whether the panel has meaningful results to display, accounting for the
 * different data shapes per analysis mode.
 */
export function computeHasResults(
  executionResults: unknown[] | null | undefined,
  isFlowMode: boolean,
  isRetentionMode: boolean,
  retentionChartData: { rows: unknown[] } | null | undefined
): boolean {
  if (executionResults === null) return false
  if (!Array.isArray(executionResults)) return true
  if (executionResults.length === 0) return false

  // Flow wraps results as [{ nodes: [...], links: [...] }] - check inner content
  if (isFlowMode && executionResults.length === 1) {
    const flowData = executionResults[0] as { nodes?: unknown[]; links?: unknown[] } | undefined
    if (flowData && typeof flowData === 'object' && 'nodes' in flowData && 'links' in flowData) {
      return flowHasData(flowData)
    }
  }

  // Retention: chart data with rows
  if (isRetentionMode && retentionChartData) {
    return retentionChartData.rows.length > 0
  }

  // Funnel/query: data rows
  return executionResults.length > 0
}

interface TableSelectionParams<Q, R> {
  tableIndex: number | undefined
  isMultiQuery: unknown
  allQueries: Q[] | null | undefined
  perQueryResults: R[] | null | undefined
  executionResults: R | null | undefined
  combinedQueryForChart: Q | undefined
}

/**
 * Resolve the data + query object for a table view given the requested index.
 * tableIndex: undefined = single query, -1 = merged view, 0+ = per-query view.
 */
export function selectTableData<Q, R>({
  tableIndex,
  isMultiQuery,
  allQueries,
  perQueryResults,
  executionResults,
  combinedQueryForChart
}: TableSelectionParams<Q, R>): { tableData: R | null; tableQuery: Q | undefined } {
  if (isMultiQuery && tableIndex !== undefined && tableIndex >= 0 && perQueryResults) {
    // Per-query table view
    return {
      tableData: perQueryResults[tableIndex] || null,
      tableQuery: allQueries?.[tableIndex]
    }
  }
  // Merged view (tableIndex === -1) or single query mode
  return {
    tableData: executionResults ?? null,
    tableQuery: isMultiQuery ? combinedQueryForChart : allQueries?.[0]
  }
}

/**
 * Resolve the display source/target event names for a flow Sankey link, handling
 * both transformed (`source`/`target`) and raw (`source_id`/`target_id`) shapes.
 */
export function flowLinkNames(link: Record<string, unknown>): { sourceName: string; targetName: string } {
  const sourceId = ((link.source || link.source_id) as string) || ''
  const targetId = ((link.target || link.target_id) as string) || ''
  // IDs are like "before_5_created" or "start_created" - extract the event name
  return {
    sourceName: sourceId.split('_').slice(-1)[0] || sourceId,
    targetName: targetId.split('_').slice(-1)[0] || targetId
  }
}

/**
 * Multi-query mode (but NOT funnel mode — funnels always show unified results).
 */
export function computeIsMultiQuery(
  isFunnelMode: boolean,
  queryCount: number,
  perQueryResults: unknown[] | null | undefined
): boolean {
  return !isFunnelMode && queryCount > 1 && !!perQueryResults && perQueryResults.length > 1
}

/** Title/tooltip for the chart view toggle button. */
export function chartViewButtonTitle(
  chartViewEnabled: boolean,
  chartViewUnavailableReason: string | undefined,
  t: (key: string) => string
): string {
  if (chartViewEnabled) return t('results.toolbar.chartView')
  if (chartViewUnavailableReason) return t(chartViewUnavailableReason)
  return t('results.toolbar.chartDisabled')
}
