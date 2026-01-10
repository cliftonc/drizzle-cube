/**
 * Hook for share URL functionality in AnalysisBuilder
 *
 * Manages:
 * - Share button state (idle, copied, copied-no-chart)
 * - Share URL generation and clipboard copy
 *
 * Phase 3: Now uses store.save() to get AnalysisConfig directly.
 */

import { useState, useCallback } from 'react'
import type { AnalysisConfig } from '../types/analysisConfig'
import { compressWithFallback } from '../utils/shareUtils'

interface UseAnalysisShareOptions {
  /** Whether the current query is valid */
  isValidQuery: boolean
  /**
   * Getter for the AnalysisConfig (from store.save())
   * This is the new Phase 3 API - returns complete AnalysisConfig
   */
  getAnalysisConfig: () => AnalysisConfig
}

interface UseAnalysisShareResult {
  /** Current share button state */
  shareButtonState: 'idle' | 'copied' | 'copied-no-chart'
  /** Handle share button click */
  handleShare: () => Promise<void>
}

export function useAnalysisShare({
  isValidQuery,
  getAnalysisConfig,
}: UseAnalysisShareOptions): UseAnalysisShareResult {
  const [shareButtonState, setShareButtonState] = useState<'idle' | 'copied' | 'copied-no-chart'>('idle')

  /**
   * Generate share URL and copy to clipboard
   */
  const handleShare = useCallback(async () => {
    if (!isValidQuery) return

    // Get AnalysisConfig from store's save() method
    const config = getAnalysisConfig()

    // Try full config first, fall back to minimal if too large
    const { encoded, queryOnly } = compressWithFallback(config)

    // If even minimal is too large, don't share
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
  }, [isValidQuery, getAnalysisConfig])

  return {
    shareButtonState,
    handleShare
  }
}
