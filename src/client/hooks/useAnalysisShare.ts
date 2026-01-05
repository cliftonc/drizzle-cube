/**
 * Hook for share URL functionality in AnalysisBuilder
 *
 * Manages:
 * - Share button state (idle, copied, copied-no-chart)
 * - Share URL generation and clipboard copy
 */

import { useState, useCallback } from 'react'
import type { CubeQuery, ChartType, ChartAxisConfig, ChartDisplayConfig } from '../types'
import { compressWithFallback } from '../utils/shareUtils'

interface UseAnalysisShareOptions {
  /** Whether the current query is valid */
  isValidQuery: boolean
  /** Number of query states (for multi-query detection) */
  queryStatesLength: number
  /** All built queries */
  allQueries: CubeQuery[]
  /** Current query (for single-query mode) */
  currentQuery: CubeQuery
  /** Merge strategy for multi-query mode */
  mergeStrategy: 'concat' | 'merge'
  /** Merge keys for multi-query mode */
  mergeKeys: string[] | undefined
  /** Current chart type */
  chartType: ChartType
  /** Current chart config */
  chartConfig: ChartAxisConfig
  /** Current display config */
  displayConfig: ChartDisplayConfig
  /** Current active view */
  activeView: 'table' | 'chart'
}

interface UseAnalysisShareResult {
  /** Current share button state */
  shareButtonState: 'idle' | 'copied' | 'copied-no-chart'
  /** Handle share button click */
  handleShare: () => Promise<void>
}

export function useAnalysisShare({
  isValidQuery,
  queryStatesLength,
  allQueries,
  currentQuery,
  mergeStrategy,
  mergeKeys,
  chartType,
  chartConfig,
  displayConfig,
  activeView
}: UseAnalysisShareOptions): UseAnalysisShareResult {
  const [shareButtonState, setShareButtonState] = useState<'idle' | 'copied' | 'copied-no-chart'>('idle')

  /**
   * Generate share URL and copy to clipboard
   */
  const handleShare = useCallback(async () => {
    if (!isValidQuery) return

    // Build the query config - use multi-query format if multiple queries exist
    const queryConfig = queryStatesLength > 1
      ? {
          queries: allQueries,
          mergeStrategy,
          mergeKeys,
          queryLabels: Array.from({ length: queryStatesLength }, (_, i) => `Q${i + 1}`)
        }
      : currentQuery

    const shareableState = {
      query: queryConfig,
      chartType,
      chartConfig,
      displayConfig,
      activeView
    }

    // Try full state first, fall back to query-only if too large
    const { encoded, queryOnly } = compressWithFallback(shareableState)

    // If even query-only is too large, don't share
    if (!encoded) {
      return
    }

    const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`

    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }

    // Update button state
    setShareButtonState(queryOnly ? 'copied-no-chart' : 'copied')

    // Reset button state after 2 seconds
    setTimeout(() => {
      setShareButtonState('idle')
    }, 2000)
  }, [isValidQuery, queryStatesLength, allQueries, mergeStrategy, mergeKeys, currentQuery, chartType, chartConfig, displayConfig, activeView])

  return {
    shareButtonState,
    handleShare
  }
}
