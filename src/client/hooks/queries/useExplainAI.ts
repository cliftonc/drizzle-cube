/**
 * useExplainAI - TanStack Query hook for AI analysis of EXPLAIN plans
 *
 * Features:
 * - Manually triggered via useMutation (not automatic)
 * - Analyzes execution plans and provides actionable recommendations
 * - Returns structured recommendations (indexes, table changes, cube improvements)
 * - No caching - always fetches fresh analysis
 * - Uses the /api/ai/explain/analyze endpoint
 *
 * Usage:
 * ```tsx
 * const { analysis, isAnalyzing, error, analyze, clearAnalysis } = useExplainAI()
 *
 * // After getting an explain result, trigger AI analysis
 * <button onClick={() => analyze(explainResult, query)}>Analyze with AI</button>
 * ```
 */

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import type { ExplainResult, AIExplainAnalysis } from '../../types'
import { useCubeFeatures } from '../../providers/CubeFeaturesProvider'

export interface UseExplainAIOptions {
  /**
   * Custom AI endpoint for explain analysis
   * @default '/api/ai/explain/analyze'
   */
  aiEndpoint?: string
}

export interface UseExplainAIResult {
  /** The AI analysis result */
  analysis: AIExplainAnalysis | null
  /** Whether AI analysis is in progress */
  isAnalyzing: boolean
  /** Error if AI analysis failed */
  error: Error | null
  /**
   * Trigger AI analysis of an explain result
   * @param explainResult - The EXPLAIN result to analyze
   * @param query - The original semantic query
   */
  analyze: (explainResult: ExplainResult, query: unknown) => void
  /** Clear the analysis result */
  clearAnalysis: () => void
}

/**
 * Query key for AI explain analysis
 */
export const EXPLAIN_AI_QUERY_KEY = ['cube', 'explain', 'ai'] as const

/**
 * TanStack Query hook for AI analysis of EXPLAIN plans
 *
 * This hook uses useMutation to call the AI endpoint and analyze execution plans,
 * providing actionable recommendations for performance improvement.
 *
 * Recommendations focus on what users CAN control:
 * - Index creation (with CREATE INDEX statements)
 * - Table structure changes
 * - Cube definition improvements (segments, pre-aggregations, joins)
 *
 * Usage:
 * ```tsx
 * const { analysis, isAnalyzing, analyze } = useExplainAI()
 *
 * // After running EXPLAIN
 * if (explainResult) {
 *   <button onClick={() => analyze(explainResult, query)}>
 *     {isAnalyzing ? 'Analyzing...' : 'Analyze with AI'}
 *   </button>
 * }
 *
 * // Display recommendations
 * {analysis?.recommendations.map(rec => (
 *   <div key={rec.title}>
 *     <h4>{rec.title}</h4>
 *     <p>{rec.description}</p>
 *     {rec.sql && <pre>{rec.sql}</pre>}
 *     {rec.cubeCode && <pre>{rec.cubeCode}</pre>}
 *   </div>
 * ))}
 * ```
 */
export function useExplainAI(options: UseExplainAIOptions = {}): UseExplainAIResult {
  const { features } = useCubeFeatures()
  const enableAI = features.enableAI ?? true
  const queryClient = useQueryClient()

  // AI endpoint - defaults to /api/ai/explain/analyze
  // This is the standard path for AI routes in the dev server
  const aiEndpoint = options.aiEndpoint ?? '/api/ai/explain/analyze'

  const mutation = useMutation({
    mutationKey: EXPLAIN_AI_QUERY_KEY,
    mutationFn: async ({ explainResult, query }: { explainResult: ExplainResult; query: unknown }) => {
      // Check if AI is enabled
      if (!enableAI) {
        throw new Error('AI features are disabled')
      }

      const response = await fetch(aiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          explainResult,
          query,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.error ||
            errorData.message ||
            `AI analysis failed: ${response.status} ${response.statusText}`
        )
      }

      const result: AIExplainAnalysis = await response.json()
      return result
    },
    // No caching - each mutation is independent
    gcTime: 0,
  })

  const analyze = useCallback((explainResult: ExplainResult, query: unknown) => {
    mutation.mutate({ explainResult, query })
  }, [mutation])

  const clearAnalysis = useCallback(() => {
    mutation.reset()
    // Also invalidate any cached queries
    queryClient.removeQueries({ queryKey: EXPLAIN_AI_QUERY_KEY })
  }, [mutation, queryClient])

  return {
    analysis: mutation.data ?? null,
    isAnalyzing: mutation.isPending,
    error: mutation.error ?? null,
    analyze,
    clearAnalysis,
  }
}
