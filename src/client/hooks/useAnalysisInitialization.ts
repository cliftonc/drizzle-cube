/**
 * useAnalysisInitialization
 *
 * Handles initialization side effects:
 * - URL share loading on mount
 * - Callback forwarding (onQueryChange, onChartConfigChange)
 */

import { useEffect, useRef } from 'react'
import { useAnalysisBuilderStore } from '../stores/analysisBuilderStore'
import { parseShareUrl, clearShareHash } from '../utils/shareUtils'
import type { CubeQuery, ChartType, ChartAxisConfig, ChartDisplayConfig } from '../types'

export interface UseAnalysisInitializationOptions {
  /** Current query */
  currentQuery: CubeQuery
  /** Whether query is valid */
  isValidQuery: boolean
  /** Chart type */
  chartType: ChartType
  /** Chart config */
  chartConfig: ChartAxisConfig
  /** Display config */
  displayConfig: ChartDisplayConfig
  /** Callback when query changes */
  onQueryChange?: (query: CubeQuery) => void
  /** Callback when chart config changes */
  onChartConfigChange?: (config: {
    chartType: ChartType
    chartConfig: ChartAxisConfig
    displayConfig: ChartDisplayConfig
  }) => void
}

/**
 * Handles initialization effects - no return value (side-effect only hook)
 */
export function useAnalysisInitialization(options: UseAnalysisInitializationOptions): void {
  const {
    currentQuery,
    isValidQuery,
    chartType,
    chartConfig,
    displayConfig,
    onQueryChange,
    onChartConfigChange,
  } = options

  // Get store action for loading from share URL
  const load = useAnalysisBuilderStore((state) => state.load)

  // URL share loading (on mount only)
  const hasInitializedShareRef = useRef(false)

  useEffect(() => {
    if (hasInitializedShareRef.current) return
    hasInitializedShareRef.current = true

    // parseShareUrl returns AnalysisConfig | null
    const config = parseShareUrl()
    if (!config) return

    load(config)
    clearShareHash()
  }, [load])

  // Query change callback
  useEffect(() => {
    if (onQueryChange && isValidQuery) {
      onQueryChange(currentQuery)
    }
  }, [currentQuery, isValidQuery, onQueryChange])

  // Chart config change callback
  useEffect(() => {
    if (onChartConfigChange) {
      onChartConfigChange({
        chartType,
        chartConfig,
        displayConfig,
      })
    }
  }, [chartType, chartConfig, displayConfig, onChartConfigChange])
}
