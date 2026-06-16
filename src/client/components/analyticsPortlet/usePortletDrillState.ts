/**
 * Local drill-down query state for AnalyticsPortlet: tracks the temporarily
 * drilled query, resets it when the base query changes, wires the
 * useDrillInteraction hook, and exposes navigation handlers. Extracted to keep
 * the component flat. No behaviour change.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useDrillInteraction } from '../../hooks/useDrillInteraction.js'
import { useCubeMeta } from '../../providers/CubeMetaContext.js'
import type { ChartAxisConfig, CubeQuery, DashboardFilter, DashboardFilterMapping } from '../../types.js'

export interface UsePortletDrillStateParams {
  queryObject: CubeQuery | null
  chartConfig?: ChartAxisConfig
  dashboardFilters?: DashboardFilter[]
  dashboardFilterMapping?: DashboardFilterMapping
  isMultiQuery: boolean
  isFunnelMode: boolean
  isFlowMode: boolean
  isRetentionMode: boolean
}

export function usePortletDrillState(params: UsePortletDrillStateParams) {
  const {
    queryObject,
    chartConfig,
    dashboardFilters,
    dashboardFilterMapping,
    isMultiQuery,
    isFunnelMode,
    isFlowMode,
    isRetentionMode
  } = params

  // Track the current drilled query (null means using the original/parsed query)
  const [drilledQuery, setDrilledQuery] = useState<CubeQuery | null>(null)

  // Reset drilled query when the base query changes (e.g., dashboard filters change)
  const queryObjectJson = queryObject ? JSON.stringify(queryObject) : null
  const previousQueryObjectJson = useRef<string | null>(null)
  useEffect(() => {
    if (queryObjectJson !== previousQueryObjectJson.current) {
      previousQueryObjectJson.current = queryObjectJson
      // Reset drill state when base query changes
      if (drilledQuery) {
        setDrilledQuery(null)
      }
    }
  }, [queryObjectJson, drilledQuery])

  // The active query is either the drilled query or the original parsed query
  const activeQuery = drilledQuery || queryObject

  // Get metadata for drill options (only for single query mode)
  const { meta } = useCubeMeta()

  // Drill interaction hook - only enabled for single query mode
  const drill = useDrillInteraction({
    query: activeQuery || { measures: [], dimensions: [] },
    metadata: meta,
    onQueryChange: (newQuery) => {
      setDrilledQuery(newQuery)
    },
    chartConfig,
    dashboardFilters,
    dashboardFilterMapping,
    enabled: !isMultiQuery && !isFunnelMode && !isFlowMode && !isRetentionMode && !!activeQuery
  })

  // Handle navigating back to root - restore the original query
  const handleNavigateBack = useCallback(() => {
    if (drill.drillPath.length === 1) {
      // Going back to root - restore original query
      setDrilledQuery(null)
    }
    drill.navigateBack()
  }, [drill])

  // Handle navigating to a specific level
  const handleNavigateToLevel = useCallback((index: number) => {
    if (index === 0) {
      // Navigate to root - restore original query
      setDrilledQuery(null)
    }
    drill.navigateToLevel(index)
  }, [drill])

  return {
    drill,
    activeQuery,
    handleNavigateBack,
    handleNavigateToLevel
  }
}
