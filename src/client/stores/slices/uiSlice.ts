/**
 * UI Slice
 *
 * Handles UI-related state and actions:
 * - activeTab (query panel tab)
 * - activeView (table or chart)
 * - displayLimit (table row limit)
 * - Modal state (field search modal)
 * - AI state (AI panel)
 */

import type { StateCreator } from 'zustand'
import type { AnalysisBuilderStore } from '../analysisBuilderStore'
import type {
  QueryPanelTab,
  AIState,
} from '../../components/AnalysisBuilder/types'
import { createInitialState } from '../../components/AnalysisBuilder/utils'

// ============================================================================
// Types
// ============================================================================

/**
 * Field modal mode for field search
 */
export type FieldModalMode = 'metrics' | 'breakdown'

/**
 * UI slice state
 */
export interface UISliceState {
  /** Active tab in query panel */
  activeTab: QueryPanelTab
  /** Active view (table or chart) */
  activeView: 'table' | 'chart'
  /** Display limit for table */
  displayLimit: number
  /** Whether field search modal is open */
  showFieldModal: boolean
  /** Current mode for field search modal */
  fieldModalMode: FieldModalMode
  /** AI panel state */
  aiState: AIState
}

/**
 * UI slice actions
 */
export interface UISliceActions {
  // Tab/View actions
  setActiveTab: (tab: QueryPanelTab) => void
  setActiveView: (view: 'table' | 'chart') => void
  setDisplayLimit: (limit: number) => void

  // Field modal actions
  openMetricsModal: () => void
  openBreakdownsModal: () => void
  closeFieldModal: () => void

  // AI actions
  openAI: () => void
  closeAI: () => void
  setAIPrompt: (prompt: string) => void
  setAIGenerating: (generating: boolean) => void
  setAIError: (error: string | null) => void
  setAIHasGeneratedQuery: (hasQuery: boolean) => void
  saveAIPreviousState: () => void
  restoreAIPreviousState: () => void
}

export type UISlice = UISliceState & UISliceActions

// ============================================================================
// Initial State
// ============================================================================

const initialAIState: AIState = {
  isOpen: false,
  userPrompt: '',
  isGenerating: false,
  error: null,
  hasGeneratedQuery: false,
  previousState: null,
}

export const createInitialUIState = (): UISliceState => ({
  activeTab: 'query',
  activeView: 'chart',
  displayLimit: 100,
  showFieldModal: false,
  fieldModalMode: 'metrics',
  aiState: initialAIState,
})

// ============================================================================
// Slice Creator
// ============================================================================

/**
 * Create the UI slice.
 * Uses StateCreator pattern for composability.
 */
export const createUISlice: StateCreator<
  AnalysisBuilderStore,
  [],
  [],
  UISlice
> = (set, _get) => ({
  ...createInitialUIState(),

  // ==========================================================================
  // Tab/View Actions
  // ==========================================================================

  setActiveTab: (tab) => set({ activeTab: tab }),

  setActiveView: (view) =>
    set((state) => ({
      activeView: view,
      activeViews: {
        ...state.activeViews,
        [state.analysisType]: view,
      },
    })),

  setDisplayLimit: (limit) => set({ displayLimit: limit }),

  // ==========================================================================
  // Field Modal Actions
  // ==========================================================================

  openMetricsModal: () => set({ showFieldModal: true, fieldModalMode: 'metrics' }),

  openBreakdownsModal: () => set({ showFieldModal: true, fieldModalMode: 'breakdown' }),

  closeFieldModal: () => set({ showFieldModal: false }),

  // ==========================================================================
  // AI Actions
  // ==========================================================================

  openAI: () =>
    set((state) => ({
      aiState: { ...state.aiState, isOpen: true },
    })),

  closeAI: () =>
    set((state) => ({
      aiState: { ...state.aiState, isOpen: false },
    })),

  setAIPrompt: (prompt) =>
    set((state) => ({
      aiState: { ...state.aiState, userPrompt: prompt },
    })),

  setAIGenerating: (generating) =>
    set((state) => ({
      aiState: { ...state.aiState, isGenerating: generating },
    })),

  setAIError: (error) =>
    set((state) => ({
      aiState: { ...state.aiState, error },
    })),

  setAIHasGeneratedQuery: (hasQuery) =>
    set((state) => ({
      aiState: { ...state.aiState, hasGeneratedQuery: hasQuery },
    })),

  saveAIPreviousState: () =>
    set((state) => {
      const currentState = state.queryStates[state.activeQueryIndex]
      // Get chart config from charts map (Phase 4 - use charts map as source of truth)
      const chartConfig = state.charts[state.analysisType] || {
        chartType: 'bar' as const,
        chartConfig: {},
        displayConfig: { showLegend: true, showGrid: true, showTooltip: true },
      }
      return {
        aiState: {
          ...state.aiState,
          previousState: currentState
            ? {
                metrics: [...currentState.metrics],
                breakdowns: [...currentState.breakdowns],
                filters: [...currentState.filters],
                chartType: chartConfig.chartType,
                chartConfig: { ...chartConfig.chartConfig },
                displayConfig: { ...chartConfig.displayConfig },
              }
            : null,
        },
      }
    }),

  restoreAIPreviousState: () =>
    set((state) => {
      const prev = state.aiState.previousState
      if (!prev) return state

      const index = state.activeQueryIndex
      const newStates = [...state.queryStates]
      newStates[index] = {
        ...(newStates[index] || createInitialState()),
        metrics: prev.metrics,
        breakdowns: prev.breakdowns,
        filters: prev.filters,
      }

      // Phase 4: Write to charts map instead of legacy fields
      return {
        queryStates: newStates,
        charts: {
          ...state.charts,
          [state.analysisType]: {
            chartType: prev.chartType,
            chartConfig: prev.chartConfig,
            displayConfig: prev.displayConfig,
          },
        },
        aiState: { ...initialAIState },
      } as any
    }),
})
