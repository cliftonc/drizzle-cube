/**
 * Comprehensive tests for UI Slice
 * Tests all UI slice state and actions for Zustand store
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  createAnalysisBuilderStore,
  type AnalysisBuilderStore,
} from '../../../../src/client/stores/analysisBuilderStore'
import type { StoreApi } from 'zustand'
import {
  createInitialUIState,
  type UISliceState,
  type FieldModalMode,
} from '../../../../src/client/stores/slices/uiSlice'

// ============================================================================
// Test Setup
// ============================================================================

describe('UISlice', () => {
  let store: StoreApi<AnalysisBuilderStore>

  beforeEach(() => {
    localStorage.clear()
    store = createAnalysisBuilderStore({ disableLocalStorage: true })
  })

  afterEach(() => {
    localStorage.clear()
  })

  // ==========================================================================
  // Initial State
  // ==========================================================================
  describe('Initial State', () => {
    it('should have "query" as default activeTab', () => {
      expect(store.getState().activeTab).toBe('query')
    })

    it('should have "chart" as default activeView', () => {
      expect(store.getState().activeView).toBe('chart')
    })

    it('should have 100 as default displayLimit', () => {
      expect(store.getState().displayLimit).toBe(100)
    })

    it('should have showFieldModal as false by default', () => {
      expect(store.getState().showFieldModal).toBe(false)
    })

    it('should have "metrics" as default fieldModalMode', () => {
      expect(store.getState().fieldModalMode).toBe('metrics')
    })

    describe('AI State', () => {
      it('should have isOpen as false by default', () => {
        expect(store.getState().aiState.isOpen).toBe(false)
      })

      it('should have empty userPrompt by default', () => {
        expect(store.getState().aiState.userPrompt).toBe('')
      })

      it('should have isGenerating as false by default', () => {
        expect(store.getState().aiState.isGenerating).toBe(false)
      })

      it('should have error as null by default', () => {
        expect(store.getState().aiState.error).toBeNull()
      })

      it('should have hasGeneratedQuery as false by default', () => {
        expect(store.getState().aiState.hasGeneratedQuery).toBe(false)
      })

      it('should have previousState as null by default', () => {
        expect(store.getState().aiState.previousState).toBeNull()
      })
    })

    describe('createInitialUIState function', () => {
      it('should return correct initial state object', () => {
        const initialState = createInitialUIState()

        expect(initialState.activeTab).toBe('query')
        expect(initialState.activeView).toBe('chart')
        expect(initialState.displayLimit).toBe(100)
        expect(initialState.showFieldModal).toBe(false)
        expect(initialState.fieldModalMode).toBe('metrics')
        expect(initialState.aiState).toEqual({
          isOpen: false,
          userPrompt: '',
          isGenerating: false,
          error: null,
          hasGeneratedQuery: false,
          previousState: null,
        })
      })
    })
  })

  // ==========================================================================
  // Tab/View Actions
  // ==========================================================================
  describe('Tab/View Actions', () => {
    describe('setActiveTab', () => {
      it('should update activeTab to "query"', () => {
        store.getState().setActiveTab('chart')
        store.getState().setActiveTab('query')
        expect(store.getState().activeTab).toBe('query')
      })

      it('should update activeTab to "chart"', () => {
        store.getState().setActiveTab('chart')
        expect(store.getState().activeTab).toBe('chart')
      })

      it('should update activeTab to "display"', () => {
        store.getState().setActiveTab('display')
        expect(store.getState().activeTab).toBe('display')
      })
    })

    describe('setActiveView', () => {
      it('should update activeView to "table"', () => {
        store.getState().setActiveView('table')
        expect(store.getState().activeView).toBe('table')
      })

      it('should update activeView to "chart"', () => {
        store.getState().setActiveView('table')
        store.getState().setActiveView('chart')
        expect(store.getState().activeView).toBe('chart')
      })

      it('should update activeViews map for current analysis type', () => {
        // Default analysis type is 'query'
        store.getState().setActiveView('table')
        expect(store.getState().activeViews.query).toBe('table')
      })

      it('should preserve activeViews when switching views', () => {
        store.getState().setActiveView('table')
        store.getState().setActiveView('chart')
        expect(store.getState().activeViews.query).toBe('chart')
      })

      it('should update activeViews for different analysis types', () => {
        // Set view in query mode
        store.getState().setActiveView('table')
        expect(store.getState().activeViews.query).toBe('table')

        // Switch to funnel mode and set view
        store.getState().setAnalysisType('funnel')
        store.getState().setActiveView('chart')
        expect(store.getState().activeViews.funnel).toBe('chart')

        // Query mode view should be preserved
        expect(store.getState().activeViews.query).toBe('table')
      })
    })

    describe('setDisplayLimit', () => {
      it('should update displayLimit', () => {
        store.getState().setDisplayLimit(50)
        expect(store.getState().displayLimit).toBe(50)
      })

      it('should allow setting displayLimit to 0', () => {
        store.getState().setDisplayLimit(0)
        expect(store.getState().displayLimit).toBe(0)
      })

      it('should allow setting displayLimit to large values', () => {
        store.getState().setDisplayLimit(10000)
        expect(store.getState().displayLimit).toBe(10000)
      })

      it('should allow updating displayLimit multiple times', () => {
        store.getState().setDisplayLimit(25)
        expect(store.getState().displayLimit).toBe(25)

        store.getState().setDisplayLimit(200)
        expect(store.getState().displayLimit).toBe(200)
      })
    })
  })

  // ==========================================================================
  // Field Modal Actions
  // ==========================================================================
  describe('Field Modal Actions', () => {
    describe('openMetricsModal', () => {
      it('should set showFieldModal to true', () => {
        store.getState().openMetricsModal()
        expect(store.getState().showFieldModal).toBe(true)
      })

      it('should set fieldModalMode to "metrics"', () => {
        store.getState().openBreakdownsModal() // Set to different mode first
        store.getState().openMetricsModal()
        expect(store.getState().fieldModalMode).toBe('metrics')
      })

      it('should open modal with correct mode when called multiple times', () => {
        store.getState().openMetricsModal()
        store.getState().closeFieldModal()
        store.getState().openMetricsModal()

        expect(store.getState().showFieldModal).toBe(true)
        expect(store.getState().fieldModalMode).toBe('metrics')
      })
    })

    describe('openBreakdownsModal', () => {
      it('should set showFieldModal to true', () => {
        store.getState().openBreakdownsModal()
        expect(store.getState().showFieldModal).toBe(true)
      })

      it('should set fieldModalMode to "breakdown"', () => {
        store.getState().openMetricsModal() // Set to different mode first
        store.getState().openBreakdownsModal()
        expect(store.getState().fieldModalMode).toBe('breakdown')
      })

      it('should open modal with correct mode when called multiple times', () => {
        store.getState().openBreakdownsModal()
        store.getState().closeFieldModal()
        store.getState().openBreakdownsModal()

        expect(store.getState().showFieldModal).toBe(true)
        expect(store.getState().fieldModalMode).toBe('breakdown')
      })
    })

    describe('closeFieldModal', () => {
      it('should set showFieldModal to false', () => {
        store.getState().openMetricsModal()
        store.getState().closeFieldModal()
        expect(store.getState().showFieldModal).toBe(false)
      })

      it('should preserve fieldModalMode when closing', () => {
        store.getState().openBreakdownsModal()
        store.getState().closeFieldModal()
        expect(store.getState().fieldModalMode).toBe('breakdown')
      })

      it('should be idempotent when called multiple times', () => {
        store.getState().closeFieldModal()
        store.getState().closeFieldModal()
        expect(store.getState().showFieldModal).toBe(false)
      })
    })

    describe('Modal mode switching', () => {
      it('should switch from metrics to breakdown mode while open', () => {
        store.getState().openMetricsModal()
        expect(store.getState().fieldModalMode).toBe('metrics')

        store.getState().openBreakdownsModal()
        expect(store.getState().fieldModalMode).toBe('breakdown')
        expect(store.getState().showFieldModal).toBe(true)
      })

      it('should switch from breakdown to metrics mode while open', () => {
        store.getState().openBreakdownsModal()
        expect(store.getState().fieldModalMode).toBe('breakdown')

        store.getState().openMetricsModal()
        expect(store.getState().fieldModalMode).toBe('metrics')
        expect(store.getState().showFieldModal).toBe(true)
      })
    })
  })

  // ==========================================================================
  // AI Actions
  // ==========================================================================
  describe('AI Actions', () => {
    describe('openAI', () => {
      it('should set aiState.isOpen to true', () => {
        store.getState().openAI()
        expect(store.getState().aiState.isOpen).toBe(true)
      })

      it('should preserve other aiState properties when opening', () => {
        store.getState().setAIPrompt('test prompt')
        store.getState().openAI()

        expect(store.getState().aiState.isOpen).toBe(true)
        expect(store.getState().aiState.userPrompt).toBe('test prompt')
      })

      it('should be idempotent when called multiple times', () => {
        store.getState().openAI()
        store.getState().openAI()
        expect(store.getState().aiState.isOpen).toBe(true)
      })
    })

    describe('closeAI', () => {
      it('should set aiState.isOpen to false', () => {
        store.getState().openAI()
        store.getState().closeAI()
        expect(store.getState().aiState.isOpen).toBe(false)
      })

      it('should preserve other aiState properties when closing', () => {
        store.getState().setAIPrompt('test prompt')
        store.getState().openAI()
        store.getState().closeAI()

        expect(store.getState().aiState.isOpen).toBe(false)
        expect(store.getState().aiState.userPrompt).toBe('test prompt')
      })

      it('should be idempotent when called multiple times', () => {
        store.getState().closeAI()
        store.getState().closeAI()
        expect(store.getState().aiState.isOpen).toBe(false)
      })
    })

    describe('setAIPrompt', () => {
      it('should update userPrompt', () => {
        store.getState().setAIPrompt('Show me sales by region')
        expect(store.getState().aiState.userPrompt).toBe('Show me sales by region')
      })

      it('should allow setting empty prompt', () => {
        store.getState().setAIPrompt('test')
        store.getState().setAIPrompt('')
        expect(store.getState().aiState.userPrompt).toBe('')
      })

      it('should preserve other aiState properties', () => {
        store.getState().openAI()
        store.getState().setAIGenerating(true)
        store.getState().setAIPrompt('new prompt')

        expect(store.getState().aiState.isOpen).toBe(true)
        expect(store.getState().aiState.isGenerating).toBe(true)
        expect(store.getState().aiState.userPrompt).toBe('new prompt')
      })

      it('should handle special characters in prompt', () => {
        const prompt = 'Show me "sales" with $100+ value & region=\'US\''
        store.getState().setAIPrompt(prompt)
        expect(store.getState().aiState.userPrompt).toBe(prompt)
      })
    })

    describe('setAIGenerating', () => {
      it('should set isGenerating to true', () => {
        store.getState().setAIGenerating(true)
        expect(store.getState().aiState.isGenerating).toBe(true)
      })

      it('should set isGenerating to false', () => {
        store.getState().setAIGenerating(true)
        store.getState().setAIGenerating(false)
        expect(store.getState().aiState.isGenerating).toBe(false)
      })

      it('should preserve other aiState properties', () => {
        store.getState().setAIPrompt('test prompt')
        store.getState().openAI()
        store.getState().setAIGenerating(true)

        expect(store.getState().aiState.userPrompt).toBe('test prompt')
        expect(store.getState().aiState.isOpen).toBe(true)
        expect(store.getState().aiState.isGenerating).toBe(true)
      })
    })

    describe('setAIError', () => {
      it('should set error message', () => {
        store.getState().setAIError('Generation failed')
        expect(store.getState().aiState.error).toBe('Generation failed')
      })

      it('should clear error when set to null', () => {
        store.getState().setAIError('Some error')
        store.getState().setAIError(null)
        expect(store.getState().aiState.error).toBeNull()
      })

      it('should preserve other aiState properties', () => {
        store.getState().setAIPrompt('test')
        store.getState().setAIGenerating(true)
        store.getState().setAIError('Error message')

        expect(store.getState().aiState.userPrompt).toBe('test')
        expect(store.getState().aiState.isGenerating).toBe(true)
        expect(store.getState().aiState.error).toBe('Error message')
      })
    })

    describe('setAIHasGeneratedQuery', () => {
      it('should set hasGeneratedQuery to true', () => {
        store.getState().setAIHasGeneratedQuery(true)
        expect(store.getState().aiState.hasGeneratedQuery).toBe(true)
      })

      it('should set hasGeneratedQuery to false', () => {
        store.getState().setAIHasGeneratedQuery(true)
        store.getState().setAIHasGeneratedQuery(false)
        expect(store.getState().aiState.hasGeneratedQuery).toBe(false)
      })

      it('should preserve other aiState properties', () => {
        store.getState().setAIPrompt('test prompt')
        store.getState().setAIHasGeneratedQuery(true)

        expect(store.getState().aiState.userPrompt).toBe('test prompt')
        expect(store.getState().aiState.hasGeneratedQuery).toBe(true)
      })
    })

    describe('saveAIPreviousState', () => {
      it('should capture current query state', () => {
        // Add some metrics and breakdowns
        store.getState().addMetric('Sales.totalRevenue')
        store.getState().addBreakdown('Products.category', false)

        store.getState().saveAIPreviousState()

        expect(store.getState().aiState.previousState).not.toBeNull()
        expect(store.getState().aiState.previousState?.metrics).toHaveLength(1)
        expect(store.getState().aiState.previousState?.metrics[0].field).toBe(
          'Sales.totalRevenue'
        )
        expect(store.getState().aiState.previousState?.breakdowns).toHaveLength(1)
        expect(store.getState().aiState.previousState?.breakdowns[0].field).toBe(
          'Products.category'
        )
      })

      it('should capture current chart config from charts map', () => {
        store.getState().setChartType('line')
        store.getState().setChartConfig({ xAxis: ['time'], yAxis: ['value'] })
        store.getState().setDisplayConfig({ showLegend: false })

        store.getState().saveAIPreviousState()

        expect(store.getState().aiState.previousState?.chartType).toBe('line')
        expect(store.getState().aiState.previousState?.chartConfig).toEqual({
          xAxis: ['time'],
          yAxis: ['value'],
        })
        expect(store.getState().aiState.previousState?.displayConfig).toMatchObject({
          showLegend: false,
        })
      })

      it('should capture filters', () => {
        store.getState().setFilters([
          { member: 'Products.category', operator: 'equals', values: ['Electronics'] },
        ])

        store.getState().saveAIPreviousState()

        expect(store.getState().aiState.previousState?.filters).toHaveLength(1)
        expect(store.getState().aiState.previousState?.filters[0].member).toBe(
          'Products.category'
        )
      })

      it('should overwrite previous state when called again', () => {
        store.getState().addMetric('Sales.totalRevenue')
        store.getState().saveAIPreviousState()

        store.getState().removeMetric(store.getState().queryStates[0].metrics[0].id)
        store.getState().addMetric('Sales.count')
        store.getState().saveAIPreviousState()

        expect(store.getState().aiState.previousState?.metrics).toHaveLength(1)
        expect(store.getState().aiState.previousState?.metrics[0].field).toBe('Sales.count')
      })

      it('should capture empty state if no metrics/breakdowns', () => {
        store.getState().saveAIPreviousState()

        expect(store.getState().aiState.previousState).not.toBeNull()
        expect(store.getState().aiState.previousState?.metrics).toHaveLength(0)
        expect(store.getState().aiState.previousState?.breakdowns).toHaveLength(0)
        expect(store.getState().aiState.previousState?.filters).toHaveLength(0)
      })
    })

    describe('restoreAIPreviousState', () => {
      it('should restore metrics from previous state', () => {
        // Setup initial state
        store.getState().addMetric('Sales.totalRevenue')
        store.getState().addMetric('Sales.count')
        store.getState().saveAIPreviousState()

        // Clear current state
        const currentMetrics = store.getState().queryStates[0].metrics
        currentMetrics.forEach((m) => store.getState().removeMetric(m.id))
        store.getState().addMetric('NewMetric.value')

        // Restore
        store.getState().restoreAIPreviousState()

        expect(store.getState().queryStates[0].metrics).toHaveLength(2)
        expect(store.getState().queryStates[0].metrics[0].field).toBe('Sales.totalRevenue')
        expect(store.getState().queryStates[0].metrics[1].field).toBe('Sales.count')
      })

      it('should restore breakdowns from previous state', () => {
        // Setup initial state
        store.getState().addBreakdown('Products.category', false)
        store.getState().saveAIPreviousState()

        // Clear and modify
        const currentBreakdowns = store.getState().queryStates[0].breakdowns
        currentBreakdowns.forEach((b) => store.getState().removeBreakdown(b.id))
        store.getState().addBreakdown('Time.date', true, 'day')

        // Restore
        store.getState().restoreAIPreviousState()

        expect(store.getState().queryStates[0].breakdowns).toHaveLength(1)
        expect(store.getState().queryStates[0].breakdowns[0].field).toBe('Products.category')
      })

      it('should restore filters from previous state', () => {
        // Setup initial state
        store.getState().setFilters([
          { member: 'Products.category', operator: 'equals', values: ['Electronics'] },
        ])
        store.getState().saveAIPreviousState()

        // Modify filters
        store.getState().setFilters([
          { member: 'Products.price', operator: 'gt', values: ['100'] },
        ])

        // Restore
        store.getState().restoreAIPreviousState()

        expect(store.getState().queryStates[0].filters).toHaveLength(1)
        expect(store.getState().queryStates[0].filters[0].member).toBe('Products.category')
      })

      it('should restore chart configuration to charts map', () => {
        // Setup initial state
        store.getState().setChartType('bar')
        store.getState().setChartConfig({ xAxis: ['category'] })
        store.getState().setDisplayConfig({ showLegend: true, showGrid: true, showTooltip: true })
        store.getState().saveAIPreviousState()

        // Modify chart config
        store.getState().setChartType('line')
        store.getState().setChartConfig({ xAxis: ['time'], yAxis: ['value'] })

        // Restore
        store.getState().restoreAIPreviousState()

        // Check charts map for query mode
        expect(store.getState().charts.query?.chartType).toBe('bar')
        expect(store.getState().charts.query?.chartConfig).toEqual({ xAxis: ['category'] })
      })

      it('should reset aiState to initial state after restore', () => {
        store.getState().addMetric('Sales.totalRevenue')
        store.getState().saveAIPreviousState()
        store.getState().setAIPrompt('test prompt')
        store.getState().setAIGenerating(true)
        store.getState().setAIError('some error')
        store.getState().setAIHasGeneratedQuery(true)

        store.getState().restoreAIPreviousState()

        expect(store.getState().aiState.isOpen).toBe(false)
        expect(store.getState().aiState.userPrompt).toBe('')
        expect(store.getState().aiState.isGenerating).toBe(false)
        expect(store.getState().aiState.error).toBeNull()
        expect(store.getState().aiState.hasGeneratedQuery).toBe(false)
        expect(store.getState().aiState.previousState).toBeNull()
      })

      it('should do nothing if previousState is null', () => {
        store.getState().addMetric('Sales.totalRevenue')

        // Don't save previous state, just try to restore
        store.getState().restoreAIPreviousState()

        // State should be unchanged
        expect(store.getState().queryStates[0].metrics).toHaveLength(1)
        expect(store.getState().queryStates[0].metrics[0].field).toBe('Sales.totalRevenue')
      })
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('Edge Cases', () => {
    it('should handle rapid tab switching', () => {
      const tabs = ['query', 'chart', 'display', 'query', 'chart'] as const
      tabs.forEach((tab) => store.getState().setActiveTab(tab))
      expect(store.getState().activeTab).toBe('chart')
    })

    it('should handle rapid view switching', () => {
      const views = ['table', 'chart', 'table', 'chart', 'table'] as const
      views.forEach((view) => store.getState().setActiveView(view))
      expect(store.getState().activeView).toBe('table')
    })

    it('should handle opening/closing modal rapidly', () => {
      for (let i = 0; i < 5; i++) {
        store.getState().openMetricsModal()
        store.getState().closeFieldModal()
      }
      expect(store.getState().showFieldModal).toBe(false)
    })

    it('should handle AI actions in sequence', () => {
      // Simulate typical AI workflow
      store.getState().openAI()
      store.getState().setAIPrompt('Show me sales data')
      store.getState().saveAIPreviousState()
      store.getState().setAIGenerating(true)
      store.getState().setAIGenerating(false)
      store.getState().setAIHasGeneratedQuery(true)
      store.getState().closeAI()

      expect(store.getState().aiState.isOpen).toBe(false)
      expect(store.getState().aiState.userPrompt).toBe('Show me sales data')
      expect(store.getState().aiState.hasGeneratedQuery).toBe(true)
    })

    it('should handle AI error flow', () => {
      store.getState().openAI()
      store.getState().setAIPrompt('Invalid query')
      store.getState().setAIGenerating(true)
      store.getState().setAIError('Failed to generate query')
      store.getState().setAIGenerating(false)

      expect(store.getState().aiState.error).toBe('Failed to generate query')
      expect(store.getState().aiState.isGenerating).toBe(false)
    })

    it('should preserve UI state when analysis type changes', () => {
      store.getState().setActiveTab('display')
      store.getState().setDisplayLimit(50)
      store.getState().openAI()

      store.getState().setAnalysisType('funnel')

      expect(store.getState().activeTab).toBe('display')
      expect(store.getState().displayLimit).toBe(50)
      expect(store.getState().aiState.isOpen).toBe(true)
    })
  })

  // ==========================================================================
  // Integration with Other Slices
  // ==========================================================================
  describe('Integration with Other Slices', () => {
    it('should work correctly with query slice actions', () => {
      // Add metrics via query slice
      store.getState().addMetric('Sales.revenue')

      // Use UI actions
      store.getState().openMetricsModal()
      store.getState().setActiveTab('chart')

      // Verify both states
      expect(store.getState().queryStates[0].metrics).toHaveLength(1)
      expect(store.getState().showFieldModal).toBe(true)
      expect(store.getState().activeTab).toBe('chart')
    })

    it('should update activeViews correctly for each analysis type', () => {
      // Query mode
      store.getState().setActiveView('table')
      expect(store.getState().activeViews.query).toBe('table')

      // Funnel mode
      store.getState().setAnalysisType('funnel')
      store.getState().setActiveView('chart')
      expect(store.getState().activeViews.funnel).toBe('chart')

      // Flow mode
      store.getState().setAnalysisType('flow')
      store.getState().setActiveView('table')
      expect(store.getState().activeViews.flow).toBe('table')

      // Retention mode
      store.getState().setAnalysisType('retention')
      store.getState().setActiveView('chart')
      expect(store.getState().activeViews.retention).toBe('chart')

      // Verify all are preserved
      expect(store.getState().activeViews.query).toBe('table')
      expect(store.getState().activeViews.funnel).toBe('chart')
      expect(store.getState().activeViews.flow).toBe('table')
      expect(store.getState().activeViews.retention).toBe('chart')
    })

    it('should reset activeViews when reset() is called', () => {
      // Modify activeViews for different modes
      store.getState().setActiveView('table')
      store.getState().setAnalysisType('funnel')
      store.getState().setActiveView('table')

      // Reset
      store.getState().reset()

      // Verify activeViews is reset to default (chart for all modes)
      // Note: reset() only resets core, query, funnel, flow, retention state
      // plus charts and activeViews. Other UI state (showFieldModal, aiState) is NOT reset.
      expect(store.getState().activeViews.query).toBe('chart')
      expect(store.getState().activeViews.funnel).toBe('chart')
      expect(store.getState().activeViews.flow).toBe('chart')
      expect(store.getState().activeViews.retention).toBe('chart')
    })

    it('should NOT reset UI-specific state (showFieldModal, aiState) when reset() is called', () => {
      // Note: This documents the actual behavior - reset() does not clear UI slice state
      // Only activeViews (which is part of reset()) gets cleared
      store.getState().openMetricsModal()
      store.getState().openAI()
      store.getState().setAIPrompt('test')

      // Reset
      store.getState().reset()

      // UI-specific state is NOT reset by the store's reset() function
      // This is intentional - reset() resets query/chart state, not modal/AI panel state
      expect(store.getState().showFieldModal).toBe(true)
      expect(store.getState().aiState.isOpen).toBe(true)
      expect(store.getState().aiState.userPrompt).toBe('test')
    })
  })

  // ==========================================================================
  // Type Safety
  // ==========================================================================
  describe('Type Safety', () => {
    it('should have correct type for FieldModalMode', () => {
      const metricsMode: FieldModalMode = 'metrics'
      const breakdownMode: FieldModalMode = 'breakdown'

      store.getState().openMetricsModal()
      expect(store.getState().fieldModalMode).toBe(metricsMode)

      store.getState().openBreakdownsModal()
      expect(store.getState().fieldModalMode).toBe(breakdownMode)
    })

    it('should have correct UISliceState shape', () => {
      const state: UISliceState = createInitialUIState()

      expect(state).toHaveProperty('activeTab')
      expect(state).toHaveProperty('activeView')
      expect(state).toHaveProperty('displayLimit')
      expect(state).toHaveProperty('showFieldModal')
      expect(state).toHaveProperty('fieldModalMode')
      expect(state).toHaveProperty('aiState')
    })
  })
})
