/**
 * Reports portlet debug data (chart config, query, resolved data, cache info,
 * drill state) up to the parent whenever results change. Extracted from
 * AnalyticsPortlet to keep the component flat. Behaviour is identical to the
 * original inline effect.
 */

import { useEffect, useRef } from 'react'
import type { AnalyticsPortletProps, ChartAxisConfig, ChartDisplayConfig, ChartType, CubeQuery, ServerFunnelQuery } from '../../types.js'
import type { FlowChartData, ServerFlowQuery } from '../../types/flow.js'
import type { RetentionChartData, ServerRetentionQuery } from '../../types/retention.js'
import type { DrillPathEntry } from '../../types/drill.js'

type DebugEntry = Parameters<NonNullable<AnalyticsPortletProps['onDebugDataReady']>>[0]
type CacheInfo = DebugEntry['cacheInfo']

interface ResultSetLike {
  tablePivot: () => unknown
  rawData: () => unknown
  cacheInfo?: () => CacheInfo
}

export interface UsePortletDebugDataParams {
  onDebugDataReady?: AnalyticsPortletProps['onDebugDataReady']
  error: unknown
  chartType: ChartType
  chartConfig?: ChartAxisConfig
  displayConfig?: ChartDisplayConfig
  // Mode flags
  isFunnelMode: boolean
  isFlowMode: boolean
  isRetentionMode: boolean
  // Parsed queries
  queryObject: CubeQuery | null
  activeQuery: CubeQuery | null
  serverFunnelQuery: ServerFunnelQuery | null
  serverFlowQuery: ServerFlowQuery | null
  serverRetentionQuery: ServerRetentionQuery | null
  // Data
  resultSet: ResultSetLike | null
  multiQueryData: unknown[] | null
  flowChartData: FlowChartData | null
  retentionChartData: RetentionChartData | null
  // Cache info
  funnelCacheInfo?: CacheInfo
  flowCacheInfo?: CacheInfo
  retentionCacheInfo?: CacheInfo
  // Drill
  drillPath: DrillPathEntry[]
  currentChartConfig?: ChartAxisConfig | null
}

/**
 * Resolve single-query data based on the chart type (pie/table use the pivot).
 */
function getSingleQueryData(chartType: ChartType, resultSet: ResultSetLike): unknown {
  switch (chartType) {
    case 'pie':
    case 'table':
      return resultSet.tablePivot()
    default:
      return resultSet.rawData()
  }
}

/**
 * Build the single-query debug entry, including drill state when active.
 */
function buildSingleQueryEntry(params: UsePortletDebugDataParams): DebugEntry | null {
  const { chartConfig, displayConfig, chartType, queryObject, activeQuery, resultSet, drillPath, currentChartConfig } = params
  if (!chartConfig || !queryObject || !resultSet) return null

  const data = getSingleQueryData(chartType, resultSet) as unknown[]
  if (!data) return null

  // Include drill state in debug info if drilling is active
  const drillState = drillPath.length > 0 ? {
    isDrilling: true,
    drillPath: drillPath.map(entry => ({
      id: entry.id,
      label: entry.label,
      clickedValue: entry.clickedValue,
      dimension: entry.dimension,
      granularity: entry.granularity,
      hierarchy: entry.hierarchy
    })),
    currentDrillDepth: drillPath.length,
    originalQuery: queryObject,
    activeQuery: activeQuery
  } : undefined

  return {
    chartConfig: currentChartConfig || chartConfig || {},
    displayConfig: displayConfig || {},
    queryObject: activeQuery || queryObject,
    data,
    chartType,
    cacheInfo: resultSet.cacheInfo?.(),
    drillState
  }
}

/**
 * Compute the debug entry for whichever mode is active, or null if there is
 * nothing to report yet.
 */
function buildDebugEntry(params: UsePortletDebugDataParams): DebugEntry | null {
  const {
    chartConfig, displayConfig, chartType,
    isFunnelMode, isFlowMode, isRetentionMode,
    serverFunnelQuery, serverFlowQuery, serverRetentionQuery,
    multiQueryData, flowChartData, retentionChartData,
    funnelCacheInfo, flowCacheInfo, retentionCacheInfo
  } = params

  const baseConfig = { chartConfig: chartConfig || {}, displayConfig: displayConfig || {}, chartType }

  if (isFunnelMode && multiQueryData && multiQueryData.length > 0) {
    return {
      ...baseConfig,
      queryObject: serverFunnelQuery as unknown as Record<string, unknown>,
      data: multiQueryData,
      cacheInfo: funnelCacheInfo ?? undefined
    }
  }

  if (isFlowMode && serverFlowQuery && flowChartData) {
    return {
      ...baseConfig,
      queryObject: serverFlowQuery as unknown as Record<string, unknown>,
      data: flowChartData,
      cacheInfo: flowCacheInfo
    }
  }

  if (isRetentionMode && serverRetentionQuery && retentionChartData) {
    return {
      ...baseConfig,
      queryObject: serverRetentionQuery as unknown as Record<string, unknown>,
      data: retentionChartData,
      cacheInfo: retentionCacheInfo ?? undefined
    }
  }

  return buildSingleQueryEntry(params)
}

export function usePortletDebugData(params: UsePortletDebugDataParams): void {
  const {
    onDebugDataReady,
    error,
    chartType,
    chartConfig,
    displayConfig,
    isFunnelMode,
    isFlowMode,
    isRetentionMode,
    queryObject,
    activeQuery,
    serverFunnelQuery,
    serverFlowQuery,
    serverRetentionQuery,
    resultSet,
    multiQueryData,
    flowChartData,
    retentionChartData,
    funnelCacheInfo,
    flowCacheInfo,
    retentionCacheInfo,
    drillPath,
    currentChartConfig
  } = params

  // Use ref for callback to prevent infinite loops
  const onDebugDataReadyRef = useRef(onDebugDataReady)
  useEffect(() => {
    onDebugDataReadyRef.current = onDebugDataReady
  }, [onDebugDataReady])

  useEffect(() => {
    const report = onDebugDataReadyRef.current
    if (!report || error) return

    const entry = buildDebugEntry(params)
    if (entry) report(entry)
    // We intentionally depend on the individual values (not `params`) to keep
    // the effect from re-running on every render due to object identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartConfig, displayConfig, queryObject, activeQuery, resultSet, chartType, error, isFunnelMode, isFlowMode, isRetentionMode, multiQueryData, serverFunnelQuery, serverFlowQuery, serverRetentionQuery, flowChartData, retentionChartData, flowCacheInfo, funnelCacheInfo, retentionCacheInfo, drillPath, currentChartConfig])
}
