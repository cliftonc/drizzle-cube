/**
 * Hook for AI query generation in AnalysisBuilder
 *
 * Manages:
 * - AI panel state (open/close, prompt, generating, error)
 * - State snapshots for undo functionality
 * - AI query generation and application
 */

import { useState, useCallback } from 'react'
import type { AnalysisBuilderState, AIState } from '../components/AnalysisBuilder/types'
import type { CubeQuery, ChartType, ChartAxisConfig, ChartDisplayConfig } from '../types'
import type { ServerFunnelQuery } from '../types/funnel'
import type { AnalysisType, AnalysisConfig } from '../types/analysisConfig'
import { sendGeminiMessage, extractTextFromResponse } from '../components/AIAssistant/utils'
import { generateId, generateMetricLabel } from '../components/AnalysisBuilder/utils'

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

interface UseAnalysisAIOptions {
  /** Current state for snapshotting */
  state: AnalysisBuilderState
  /** Set state function for applying AI-generated queries */
  setState: (updater: (prev: AnalysisBuilderState) => AnalysisBuilderState) => void
  /** Current chart type */
  chartType: ChartType
  /** Set chart type */
  setChartType: (type: ChartType) => void
  /** Current chart config */
  chartConfig: ChartAxisConfig
  /** Set chart config */
  setChartConfig: (config: ChartAxisConfig) => void
  /** Current display config */
  displayConfig: ChartDisplayConfig
  /** Set display config */
  setDisplayConfig: (config: ChartDisplayConfig) => void
  /** Set whether user manually selected chart */
  setUserManuallySelectedChart: (value: boolean) => void
  /** Set active view */
  setActiveView: (view: 'table' | 'chart') => void
  /** AI endpoint URL */
  aiEndpoint?: string
  /** Current analysis type */
  analysisType?: AnalysisType
  /** Set analysis type (for switching to funnel mode) */
  setAnalysisType?: (type: AnalysisType) => void
  /** Load funnel config from ServerFunnelQuery */
  loadFunnelFromServerQuery?: (query: ServerFunnelQuery) => void
  /** Get full AnalysisConfig for snapshotting (for complete undo) */
  getFullConfig?: () => AnalysisConfig
  /** Load full AnalysisConfig (for restoring on cancel) */
  loadFullConfig?: (config: AnalysisConfig) => void
}

interface UseAnalysisAIResult {
  /** Current AI state */
  aiState: AIState
  /** Open the AI panel */
  handleOpenAI: () => void
  /** Close the AI panel */
  handleCloseAI: () => void
  /** Update the AI prompt */
  handleAIPromptChange: (prompt: string) => void
  /** Generate query from AI */
  handleGenerateAI: () => Promise<void>
  /** Accept the AI-generated query */
  handleAcceptAI: () => void
  /** Cancel and restore previous state */
  handleCancelAI: () => void
}

export function useAnalysisAI({
  state,
  setState,
  chartType,
  setChartType,
  chartConfig,
  setChartConfig,
  displayConfig,
  setDisplayConfig,
  setUserManuallySelectedChart,
  setActiveView,
  aiEndpoint = '/api/ai',
  analysisType,
  setAnalysisType,
  loadFunnelFromServerQuery,
  getFullConfig,
  loadFullConfig
}: UseAnalysisAIOptions): UseAnalysisAIResult {
  // AI state
  const [aiState, setAIState] = useState<AIState>({
    isOpen: false,
    userPrompt: '',
    isGenerating: false,
    error: null,
    hasGeneratedQuery: false,
    previousState: null,
    previousConfig: null
  })

  /**
   * Open the AI panel and snapshot current state for undo
   */
  const handleOpenAI = useCallback(() => {
    // Snapshot full config if available (for complete restore including funnel state)
    const fullConfig = getFullConfig?.() ?? null

    setAIState({
      isOpen: true,
      userPrompt: '',
      isGenerating: false,
      error: null,
      hasGeneratedQuery: false,
      previousState: {
        metrics: [...state.metrics],
        breakdowns: [...state.breakdowns],
        filters: [...state.filters],
        chartType,
        chartConfig: { ...chartConfig },
        displayConfig: { ...displayConfig },
        analysisType: analysisType || 'query'
      },
      previousConfig: fullConfig
    })
  }, [state.metrics, state.breakdowns, state.filters, chartType, chartConfig, displayConfig, analysisType, getFullConfig])

  /**
   * Close the AI panel
   */
  const handleCloseAI = useCallback(() => {
    setAIState(prev => ({
      ...prev,
      isOpen: false,
      userPrompt: '',
      error: null,
      hasGeneratedQuery: false
    }))
  }, [])

  /**
   * Update the AI prompt
   */
  const handleAIPromptChange = useCallback((prompt: string) => {
    setAIState(prev => ({ ...prev, userPrompt: prompt }))
  }, [])

  /**
   * Generate query from AI and apply to builder
   */
  const handleGenerateAI = useCallback(async () => {
    if (!aiState.userPrompt.trim()) return

    setAIState(prev => ({ ...prev, isGenerating: true, error: null }))

    try {
      const response = await sendGeminiMessage(
        '', // API key not needed for server-side AI
        aiState.userPrompt,
        aiEndpoint
      )

      const responseText = extractTextFromResponse(response)
      const parsed = JSON.parse(responseText) as {
        query?: CubeQuery | ServerFunnelQuery
        chartType?: ChartType
        chartConfig?: ChartAxisConfig
      } | CubeQuery | ServerFunnelQuery

      // Support both new format (with query/chartType/chartConfig) and legacy format (just query)
      const query = ('query' in parsed && parsed.query) ? parsed.query : parsed as CubeQuery | ServerFunnelQuery
      const aiChartType = ('chartType' in parsed) ? parsed.chartType : undefined
      const aiChartConfig = ('chartConfig' in parsed) ? parsed.chartConfig : undefined

      // Check if AI generated a funnel query
      if (isServerFunnelQuery(query)) {
        // Switch to funnel mode and load the funnel config
        if (setAnalysisType && loadFunnelFromServerQuery) {
          setAnalysisType('funnel')
          loadFunnelFromServerQuery(query)

          // Apply funnel chart type
          setChartType('funnel')
          setUserManuallySelectedChart(true)

          // Apply chart config if provided
          if (aiChartConfig) {
            setChartConfig(aiChartConfig)
          }

          // Switch to chart view
          setActiveView('chart')

          setAIState(prev => ({
            ...prev,
            isGenerating: false,
            hasGeneratedQuery: true
          }))
          return
        } else {
          // Funnel mode not supported in current context
          throw new Error('Funnel queries require funnel mode support. Please switch to funnel mode manually.')
        }
      }

      // Handle regular CubeQuery
      const cubeQuery = query as CubeQuery

      // Load query into builder state
      setState(prev => ({
        ...prev,
        metrics: (cubeQuery.measures || []).map((field, index) => ({
          id: generateId(),
          field,
          label: generateMetricLabel(index)
        })),
        breakdowns: [
          ...(cubeQuery.dimensions || []).map((field) => ({
            id: generateId(),
            field,
            isTimeDimension: false
          })),
          ...(cubeQuery.timeDimensions || []).map((td) => ({
            id: generateId(),
            field: td.dimension,
            granularity: td.granularity,
            isTimeDimension: true
          }))
        ],
        filters: cubeQuery.filters || []
      }))

      // If we were in funnel mode, switch back to query mode
      if (analysisType === 'funnel' && setAnalysisType) {
        setAnalysisType('query')
      }

      // Apply chart type if provided by AI
      if (aiChartType) {
        setChartType(aiChartType)
        setUserManuallySelectedChart(true) // Prevent auto-switching
      }

      // Apply chart config if provided by AI
      if (aiChartConfig) {
        setChartConfig(aiChartConfig)
      }

      // Switch to chart view so user can see the visualization
      setActiveView('chart')

      setAIState(prev => ({
        ...prev,
        isGenerating: false,
        hasGeneratedQuery: true
      }))
    } catch (error) {
      setAIState(prev => ({
        ...prev,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Failed to generate query'
      }))
    }
  }, [aiState.userPrompt, aiEndpoint, setState, setChartType, setUserManuallySelectedChart, setChartConfig, setActiveView, analysisType, setAnalysisType, loadFunnelFromServerQuery])

  /**
   * Accept the AI-generated query (keep changes, close panel)
   */
  const handleAcceptAI = useCallback(() => {
    setAIState({
      isOpen: false,
      userPrompt: '',
      isGenerating: false,
      error: null,
      hasGeneratedQuery: false,
      previousState: null,
      previousConfig: null
    })
  }, [])

  /**
   * Cancel and restore previous state
   */
  const handleCancelAI = useCallback(() => {
    // Prefer full config restore (handles funnel mode properly)
    if (aiState.previousConfig && loadFullConfig) {
      loadFullConfig(aiState.previousConfig)
    } else if (aiState.previousState) {
      // Fallback to individual state restore
      setState(prev => ({
        ...prev,
        metrics: aiState.previousState!.metrics,
        breakdowns: aiState.previousState!.breakdowns,
        filters: aiState.previousState!.filters
      }))
      setChartType(aiState.previousState.chartType)
      setChartConfig(aiState.previousState.chartConfig)
      setDisplayConfig(aiState.previousState.displayConfig)

      // Restore analysis type if it was changed
      if (setAnalysisType && aiState.previousState.analysisType) {
        setAnalysisType(aiState.previousState.analysisType)
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
      previousConfig: null
    })
  }, [aiState.previousState, aiState.previousConfig, setState, setChartType, setChartConfig, setDisplayConfig, setAnalysisType, loadFullConfig])

  return {
    aiState,
    handleOpenAI,
    handleCloseAI,
    handleAIPromptChange,
    handleGenerateAI,
    handleAcceptAI,
    handleCancelAI
  }
}
