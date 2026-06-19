/**
 * useAnalysisEffects
 *
 * Effects responsibility for the Analysis Builder — the single place that
 * *reacts and writes back*. Strictly downstream of State → Query:
 *
 * - Init / URL share parsing on mount
 * - External `onQueryChange` / `onChartConfigChange` callback forwarding
 * - AI query generation (reads + writes the store directly — the glue that used
 *   to live in `AnalysisBuilder/index.tsx` is dissolved into direct store access)
 * - Share URL generation + clipboard copy
 * - Chart-type auto-switch effect — the SOLE consumer of `hasDebounced`, moved
 *   here out of the chart-config code so State has no execution dependency.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useCubeApi } from '../providers/CubeApiProvider.js'
import { parseShareUrl, clearShareHash, compressWithFallback } from '../utils/shareUtils.js'
import { sendGeminiMessage, extractTextFromResponse } from '../components/AIAssistant/utils.js'
import { generateId, generateMetricLabel } from '../components/AnalysisBuilder/utils/index.js'
import { shouldAutoSwitchChartType, getSmartChartDefaults } from '../shared/chartDefaults.js'
import type { CubeQuery, ChartType, ChartAxisConfig, ChartDisplayConfig } from '../types.js'
import type { AIState } from '../components/AnalysisBuilder/types.js'
import type { ServerFunnelQuery } from '../types/funnel.js'
import type { UseAnalysisStateResult } from './useAnalysisState.js'
import type { UseAnalysisQueryResult } from './useAnalysisQuery.js'

/**
 * Check if a query object is a ServerFunnelQuery
 */
function isServerFunnelQuery(query: unknown): query is ServerFunnelQuery {
  return (
    typeof query === 'object' &&
    query !== null &&
    'funnel' in query &&
    typeof (query as ServerFunnelQuery).funnel === 'object'
  )
}

export interface UseAnalysisEffectsOptions {
  /** State responsibility hook result (store reads/derivation + actions) */
  state: UseAnalysisStateResult
  /** Query responsibility hook result (execution + hasDebounced) */
  query: UseAnalysisQueryResult
  /** AI endpoint URL */
  aiEndpoint?: string
  /** Callback when query changes */
  onQueryChange?: (query: CubeQuery) => void
  /** Callback when chart config changes */
  onChartConfigChange?: (config: {
    chartType: ChartType
    chartConfig: ChartAxisConfig
    displayConfig: ChartDisplayConfig
  }) => void
}

export function useAnalysisEffects(options: UseAnalysisEffectsOptions) {
  const { state, query, aiEndpoint = '/api/ai', onQueryChange, onChartConfigChange } = options
  const { storeApi, actions } = state

  // Provider headers for AI fetch calls
  const { apiOptions } = useCubeApi()

  // =========================================================================
  // Initialization — URL share loading (on mount only)
  // =========================================================================
  const hasInitializedShareRef = useRef(false)

  useEffect(() => {
    if (hasInitializedShareRef.current) return
    hasInitializedShareRef.current = true

    // parseShareUrl returns AnalysisConfig | null
    const config = parseShareUrl()
    if (!config) return

    storeApi.getState().load(config)
    clearShareHash()
  }, [storeApi])

  // =========================================================================
  // External callback forwarding (onQueryChange / onChartConfigChange)
  // Note: uses the RAW query validity (not mode-aware) to match prior behaviour.
  // =========================================================================
  useEffect(() => {
    if (onQueryChange && state.isValidQuery) {
      onQueryChange(state.currentQuery)
    }
  }, [state.currentQuery, state.isValidQuery, onQueryChange])

  useEffect(() => {
    if (onChartConfigChange) {
      onChartConfigChange({
        chartType: state.chartType,
        chartConfig: state.chartConfig,
        displayConfig: state.displayConfig,
      })
    }
  }, [state.chartType, state.chartConfig, state.displayConfig, onChartConfigChange])

  // =========================================================================
  // Chart-type auto-switch (the sole consumer of hasDebounced)
  // =========================================================================
  const { combinedMetrics, combinedBreakdowns, chartType, chartConfig, userManuallySelectedChart } = state
  const { hasDebounced } = query
  const { setChartType, setChartConfig } = actions
  const prevMetricsBreakdownsRef = useRef<string>('')

  useEffect(() => {
    if (!hasDebounced) return
    if (combinedMetrics.length === 0 && combinedBreakdowns.length === 0) return

    const currentKey = JSON.stringify({
      metrics: combinedMetrics.map((m) => m.field),
      breakdowns: combinedBreakdowns.map((b) => ({ field: b.field, isTime: b.isTimeDimension })),
    })

    if (currentKey === prevMetricsBreakdownsRef.current) return
    prevMetricsBreakdownsRef.current = currentKey

    const newChartType = shouldAutoSwitchChartType(
      combinedMetrics,
      combinedBreakdowns,
      chartType,
      userManuallySelectedChart
    )

    if (newChartType) {
      const { chartConfig: newConfig } = getSmartChartDefaults(
        combinedMetrics,
        combinedBreakdowns,
        newChartType
      )
      setChartType(newChartType)
      setChartConfig(newConfig)
      actions.setUserManuallySelectedChart(false)
    } else if (combinedMetrics.length > 0 || combinedBreakdowns.length > 0) {
      if (chartType === 'table') {
        // Table columns should reflect all selected fields — append any
        // missing ones to preserve existing column ordering.
        const allFields = [
          ...combinedBreakdowns.map((b) => b.field),
          ...combinedMetrics.map((m) => m.field),
        ]
        const currentXAxis = Array.isArray(chartConfig.xAxis) ? chartConfig.xAxis : []
        const missingFields = allFields.filter((f) => !currentXAxis.includes(f))
        if (missingFields.length > 0) {
          setChartConfig({
            ...chartConfig,
            xAxis: [...currentXAxis, ...missingFields],
          })
        }
      } else {
        // Apply smart defaults only if chart config is empty
        const isChartConfigEmpty =
          !chartConfig.xAxis?.length &&
          !chartConfig.yAxis?.length &&
          !chartConfig.series?.length
        if (isChartConfigEmpty) {
          const { chartConfig: smartDefaults } = getSmartChartDefaults(
            combinedMetrics,
            combinedBreakdowns,
            chartType
          )
          setChartConfig(smartDefaults)
        }
      }
    }
  }, [
    hasDebounced,
    combinedMetrics,
    combinedBreakdowns,
    chartType,
    userManuallySelectedChart,
    chartConfig,
    setChartType,
    setChartConfig,
    actions,
  ])

  // =========================================================================
  // AI query generation (state snapshots + generation + apply)
  // Glue that used to live in index.tsx now reads/writes the store directly.
  // =========================================================================
  const [aiState, setAIState] = useState<AIState>({
    isOpen: false,
    userPrompt: '',
    isGenerating: false,
    error: null,
    hasGeneratedQuery: false,
    previousState: null,
    previousConfig: null,
  })

  // setState adapter — applies a full query-state update to the active query.
  const applyQueryStateUpdate = useCallback(
    (updater: (prev: import('../components/AnalysisBuilder/types.js').AnalysisBuilderState) => import('../components/AnalysisBuilder/types.js').AnalysisBuilderState) => {
      const s = storeApi.getState()
      s.updateQueryState(state.activeQueryIndex, (prev) => {
        const newState = updater(prev)
        return {
          ...prev,
          metrics: newState.metrics,
          breakdowns: newState.breakdowns,
          filters: newState.filters,
          order: newState.order,
          limit: newState.limit,
        }
      })
    },
    [storeApi, state.activeQueryIndex]
  )

  // Switch to funnel mode and load a ServerFunnelQuery via the store.
  const loadFunnelFromServerQuery = useCallback(
    (serverQuery: ServerFunnelQuery) => {
      const funnelConfig = {
        version: 1 as const,
        analysisType: 'funnel' as const,
        activeView: 'chart' as const,
        charts: {
          funnel: {
            chartType: 'funnel' as const,
            chartConfig: {},
            displayConfig: {},
          },
        },
        query: serverQuery,
      }
      storeApi.getState().load(funnelConfig)
    },
    [storeApi]
  )

  const openAI = useCallback(() => {
    // Snapshot full config for complete restore (including funnel state)
    const fullConfig = storeApi.getState().save()

    setAIState({
      isOpen: true,
      userPrompt: '',
      isGenerating: false,
      error: null,
      hasGeneratedQuery: false,
      previousState: {
        metrics: [...state.queryState.metrics],
        breakdowns: [...state.queryState.breakdowns],
        filters: [...state.queryState.filters],
        chartType: state.chartType,
        chartConfig: { ...state.chartConfig },
        displayConfig: { ...state.displayConfig },
        analysisType: state.analysisType || 'query',
      },
      previousConfig: fullConfig,
    })
  }, [storeApi, state.queryState.metrics, state.queryState.breakdowns, state.queryState.filters, state.chartType, state.chartConfig, state.displayConfig, state.analysisType])

  const closeAI = useCallback(() => {
    setAIState((prev) => ({
      ...prev,
      isOpen: false,
      userPrompt: '',
      error: null,
      hasGeneratedQuery: false,
    }))
  }, [])

  const setAIPrompt = useCallback((prompt: string) => {
    setAIState((prev) => ({ ...prev, userPrompt: prompt }))
  }, [])

  const generateAI = useCallback(async () => {
    if (!aiState.userPrompt.trim()) return

    setAIState((prev) => ({ ...prev, isGenerating: true, error: null }))

    try {
      const response = await sendGeminiMessage(
        '', // API key not needed for server-side AI
        aiState.userPrompt,
        aiEndpoint,
        apiOptions?.headers
      )

      const responseText = extractTextFromResponse(response)
      const parsed = JSON.parse(responseText) as {
        query?: CubeQuery | ServerFunnelQuery
        chartType?: ChartType
        chartConfig?: ChartAxisConfig
      } | CubeQuery | ServerFunnelQuery

      // Support both new format (with query/chartType/chartConfig) and legacy format (just query)
      const generated = ('query' in parsed && parsed.query) ? parsed.query : parsed as CubeQuery | ServerFunnelQuery
      const aiChartType = ('chartType' in parsed) ? parsed.chartType : undefined
      const aiChartConfig = ('chartConfig' in parsed) ? parsed.chartConfig : undefined

      // Check if AI generated a funnel query
      if (isServerFunnelQuery(generated)) {
        // Switch to funnel mode and load the funnel config
        actions.setAnalysisType('funnel')
        loadFunnelFromServerQuery(generated)

        // Apply funnel chart type (setUserManuallySelectedChart is intentionally
        // a no-op here — the store owns the manual flag via setChartTypeManual)
        actions.setChartType('funnel')

        if (aiChartConfig) {
          actions.setChartConfig(aiChartConfig)
        }

        actions.setActiveView('chart')

        setAIState((prev) => ({
          ...prev,
          isGenerating: false,
          hasGeneratedQuery: true,
        }))
        return
      }

      // Handle regular CubeQuery
      const cubeQuery = generated as CubeQuery

      // Load query into builder state
      applyQueryStateUpdate((prev) => ({
        ...prev,
        metrics: (cubeQuery.measures || []).map((field, index) => ({
          id: generateId(),
          field,
          label: generateMetricLabel(index),
        })),
        breakdowns: [
          ...(cubeQuery.dimensions || []).map((field) => ({
            id: generateId(),
            field,
            isTimeDimension: false,
          })),
          ...(cubeQuery.timeDimensions || []).map((td) => ({
            id: generateId(),
            field: td.dimension,
            granularity: td.granularity,
            isTimeDimension: true,
          })),
        ],
        filters: cubeQuery.filters || [],
        order: cubeQuery.order || undefined,
        limit: cubeQuery.limit ?? undefined,
      }))

      // If we were in funnel mode, switch back to query mode
      if (state.analysisType === 'funnel') {
        actions.setAnalysisType('query')
      }

      // Apply chart type if provided by AI (manual flag owned by store)
      if (aiChartType) {
        actions.setChartType(aiChartType)
      }

      if (aiChartConfig) {
        actions.setChartConfig(aiChartConfig)
      }

      // Switch to chart view so user can see the visualization
      actions.setActiveView('chart')

      setAIState((prev) => ({
        ...prev,
        isGenerating: false,
        hasGeneratedQuery: true,
      }))
    } catch (error) {
      setAIState((prev) => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate query',
      }))
    }
  }, [aiState.userPrompt, aiEndpoint, apiOptions?.headers, applyQueryStateUpdate, loadFunnelFromServerQuery, state.analysisType, actions])

  const acceptAI = useCallback(() => {
    setAIState({
      isOpen: false,
      userPrompt: '',
      isGenerating: false,
      error: null,
      hasGeneratedQuery: false,
      previousState: null,
      previousConfig: null,
    })
  }, [])

  const cancelAI = useCallback(() => {
    // Prefer full config restore (handles funnel mode properly)
    if (aiState.previousConfig) {
      storeApi.getState().load(aiState.previousConfig)
    } else if (aiState.previousState) {
      // Fallback to individual state restore
      applyQueryStateUpdate((prev) => ({
        ...prev,
        metrics: aiState.previousState!.metrics,
        breakdowns: aiState.previousState!.breakdowns,
        filters: aiState.previousState!.filters,
      }))
      actions.setChartType(aiState.previousState.chartType)
      actions.setChartConfig(aiState.previousState.chartConfig)
      actions.setDisplayConfig(aiState.previousState.displayConfig)

      // Restore analysis type if it was changed
      if (aiState.previousState.analysisType) {
        actions.setAnalysisType(aiState.previousState.analysisType)
      }
    }

    // Close panel
    setAIState({
      isOpen: false,
      userPrompt: '',
      isGenerating: false,
      error: null,
      hasGeneratedQuery: false,
      previousState: null,
      previousConfig: null,
    })
  }, [aiState.previousState, aiState.previousConfig, storeApi, applyQueryStateUpdate, actions])

  // =========================================================================
  // Share URL generation + clipboard copy
  // =========================================================================
  const [shareButtonState, setShareButtonState] = useState<'idle' | 'copied' | 'copied-no-chart'>('idle')
  const canShare = state.effectiveIsValidQuery

  const share = useCallback(async () => {
    if (!canShare) return

    // Get AnalysisConfig from store's save() method
    const config = storeApi.getState().save()

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

    setShareButtonState(queryOnly ? 'copied-no-chart' : 'copied')

    setTimeout(() => {
      setShareButtonState('idle')
    }, 2000)
  }, [canShare, storeApi])

  return {
    // AI
    aiState,
    openAI,
    closeAI,
    setAIPrompt,
    generateAI,
    acceptAI,
    cancelAI,

    // Share
    shareButtonState,
    share,
    canShare,
  }
}

export type UseAnalysisEffectsResult = ReturnType<typeof useAnalysisEffects>
