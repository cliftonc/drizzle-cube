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
import { sendGeminiMessage, extractTextFromResponse } from '../components/AIAssistant/utils'
import { generateId, generateMetricLabel } from '../components/AnalysisBuilder/utils'

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
  aiEndpoint = '/api/ai'
}: UseAnalysisAIOptions): UseAnalysisAIResult {
  // AI state
  const [aiState, setAIState] = useState<AIState>({
    isOpen: false,
    userPrompt: '',
    isGenerating: false,
    error: null,
    hasGeneratedQuery: false,
    previousState: null
  })

  /**
   * Open the AI panel and snapshot current state for undo
   */
  const handleOpenAI = useCallback(() => {
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
        displayConfig: { ...displayConfig }
      }
    })
  }, [state.metrics, state.breakdowns, state.filters, chartType, chartConfig, displayConfig])

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
        query?: CubeQuery
        chartType?: ChartType
        chartConfig?: ChartAxisConfig
      } | CubeQuery

      // Support both new format (with query/chartType/chartConfig) and legacy format (just query)
      const query = ('query' in parsed && parsed.query) ? parsed.query : parsed as CubeQuery
      const aiChartType = ('chartType' in parsed) ? parsed.chartType : undefined
      const aiChartConfig = ('chartConfig' in parsed) ? parsed.chartConfig : undefined

      // Load query into builder state
      setState(prev => ({
        ...prev,
        metrics: (query.measures || []).map((field, index) => ({
          id: generateId(),
          field,
          label: generateMetricLabel(index)
        })),
        breakdowns: [
          ...(query.dimensions || []).map((field) => ({
            id: generateId(),
            field,
            isTimeDimension: false
          })),
          ...(query.timeDimensions || []).map((td) => ({
            id: generateId(),
            field: td.dimension,
            granularity: td.granularity,
            isTimeDimension: true
          }))
        ],
        filters: query.filters || []
      }))

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
  }, [aiState.userPrompt, aiEndpoint, setState, setChartType, setUserManuallySelectedChart, setChartConfig, setActiveView])

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
      previousState: null
    })
  }, [])

  /**
   * Cancel and restore previous state
   */
  const handleCancelAI = useCallback(() => {
    // Restore previous state
    if (aiState.previousState) {
      setState(prev => ({
        ...prev,
        metrics: aiState.previousState!.metrics,
        breakdowns: aiState.previousState!.breakdowns,
        filters: aiState.previousState!.filters
      }))
      setChartType(aiState.previousState.chartType)
      setChartConfig(aiState.previousState.chartConfig)
      setDisplayConfig(aiState.previousState.displayConfig)
    }

    // Close panel
    setAIState({
      isOpen: false,
      userPrompt: '',
      isGenerating: false,
      error: null,
      hasGeneratedQuery: false,
      previousState: null
    })
  }, [aiState.previousState, setState, setChartType, setChartConfig, setDisplayConfig])

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
