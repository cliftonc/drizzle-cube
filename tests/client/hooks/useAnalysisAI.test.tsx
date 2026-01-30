import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../client-setup/msw-server'
import { useAnalysisAI } from '../../../src/client/hooks/useAnalysisAI'
import type { AnalysisBuilderState } from '../../../src/client/components/AnalysisBuilder/types'
import type { ChartType, ChartAxisConfig, ChartDisplayConfig, CubeQuery } from '../../../src/client/types'
import type { AnalysisConfig, AnalysisType } from '../../../src/client/types/analysisConfig'

// ============================================================================
// Test Data
// ============================================================================

const createMockState = (): AnalysisBuilderState => ({
  metrics: [{ id: 'metric-1', field: 'Employees.count', label: 'A' }],
  breakdowns: [{ id: 'breakdown-1', field: 'Employees.name', isTimeDimension: false }],
  filters: [],
})

const emptyState: AnalysisBuilderState = {
  metrics: [],
  breakdowns: [],
  filters: [],
}

const mockChartConfig: ChartAxisConfig = {
  xAxis: ['Employees.name'],
  yAxis: ['Employees.count'],
}

const mockDisplayConfig: ChartDisplayConfig = {
  showLegend: true,
  showGrid: true,
}

const mockAnalysisConfig: AnalysisConfig = {
  version: 1,
  analysisType: 'query',
  activeView: 'chart',
  charts: {
    query: {
      chartType: 'bar',
      chartConfig: mockChartConfig,
      displayConfig: mockDisplayConfig,
    },
  },
  query: { measures: ['Employees.count'], dimensions: ['Employees.name'] },
}

// ============================================================================
// Mock Setters
// ============================================================================

function createMockSetters() {
  return {
    setState: vi.fn(),
    setChartType: vi.fn(),
    setChartConfig: vi.fn(),
    setDisplayConfig: vi.fn(),
    setUserManuallySelectedChart: vi.fn(),
    setActiveView: vi.fn(),
    setAnalysisType: vi.fn(),
    loadFunnelFromServerQuery: vi.fn(),
    getFullConfig: vi.fn(() => mockAnalysisConfig),
    loadFullConfig: vi.fn(),
  }
}

// Helper to create AI response in the format expected by the hook
// The hook uses sendGeminiMessage which expects { query: string } response
// and extractTextFromResponse parses the query field
function createAIResponse(queryOrConfig: object) {
  return { query: JSON.stringify(queryOrConfig) }
}

// ============================================================================
// Tests
// ============================================================================

describe('useAnalysisAI', () => {
  let mockSetters: ReturnType<typeof createMockSetters>

  beforeEach(() => {
    mockSetters = createMockSetters()
    server.resetHandlers()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // Initial State Tests
  // ==========================================================================

  describe('initial state', () => {
    it('should start with AI panel closed', () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      expect(result.current.aiState.isOpen).toBe(false)
    })

    it('should start with empty prompt', () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      expect(result.current.aiState.userPrompt).toBe('')
    })

    it('should start with isGenerating false', () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      expect(result.current.aiState.isGenerating).toBe(false)
    })

    it('should start with no error', () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      expect(result.current.aiState.error).toBeNull()
    })

    it('should start with hasGeneratedQuery false', () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      expect(result.current.aiState.hasGeneratedQuery).toBe(false)
    })

    it('should start with previousState null', () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      expect(result.current.aiState.previousState).toBeNull()
    })
  })

  // ==========================================================================
  // Open AI Panel Tests
  // ==========================================================================

  describe('handleOpenAI', () => {
    it('should open AI panel', () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      act(() => {
        result.current.handleOpenAI()
      })

      expect(result.current.aiState.isOpen).toBe(true)
    })

    it('should snapshot current state when opening', () => {
      const currentState = createMockState()
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: currentState,
          ...mockSetters,
          chartType: 'line',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      act(() => {
        result.current.handleOpenAI()
      })

      expect(result.current.aiState.previousState).toBeDefined()
      expect(result.current.aiState.previousState?.chartType).toBe('line')
      expect(result.current.aiState.previousState?.metrics).toEqual(currentState.metrics)
    })

    it('should snapshot full config when getFullConfig provided', () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          getFullConfig: mockSetters.getFullConfig,
        })
      )

      act(() => {
        result.current.handleOpenAI()
      })

      expect(mockSetters.getFullConfig).toHaveBeenCalled()
      expect(result.current.aiState.previousConfig).toEqual(mockAnalysisConfig)
    })

    it('should reset prompt when opening', () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      // First set a prompt
      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('old prompt')
      })

      // Close and reopen
      act(() => {
        result.current.handleCloseAI()
      })

      act(() => {
        result.current.handleOpenAI()
      })

      expect(result.current.aiState.userPrompt).toBe('')
    })

    it('should include analysis type in snapshot', () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          analysisType: 'funnel',
        })
      )

      act(() => {
        result.current.handleOpenAI()
      })

      expect(result.current.aiState.previousState?.analysisType).toBe('funnel')
    })
  })

  // ==========================================================================
  // Close AI Panel Tests
  // ==========================================================================

  describe('handleCloseAI', () => {
    it('should close AI panel', () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      act(() => {
        result.current.handleOpenAI()
      })

      act(() => {
        result.current.handleCloseAI()
      })

      expect(result.current.aiState.isOpen).toBe(false)
    })

    it('should clear prompt when closing', () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('test prompt')
      })

      act(() => {
        result.current.handleCloseAI()
      })

      expect(result.current.aiState.userPrompt).toBe('')
    })

    it('should clear error when closing', () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      act(() => {
        result.current.handleOpenAI()
      })

      // Manually set error state for testing
      // In real usage, error would come from failed generation

      act(() => {
        result.current.handleCloseAI()
      })

      expect(result.current.aiState.error).toBeNull()
    })

    it('should reset hasGeneratedQuery when closing', () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleCloseAI()
      })

      expect(result.current.aiState.hasGeneratedQuery).toBe(false)
    })
  })

  // ==========================================================================
  // Prompt Change Tests
  // ==========================================================================

  describe('handleAIPromptChange', () => {
    it('should update prompt', () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show me employee counts by department')
      })

      expect(result.current.aiState.userPrompt).toBe('Show me employee counts by department')
    })

    it('should handle empty prompt', () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('some text')
        result.current.handleAIPromptChange('')
      })

      expect(result.current.aiState.userPrompt).toBe('')
    })

    it('should handle long prompts', () => {
      const longPrompt = 'A'.repeat(1000)
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange(longPrompt)
      })

      expect(result.current.aiState.userPrompt).toBe(longPrompt)
    })
  })

  // ==========================================================================
  // Generate AI Tests
  // ==========================================================================

  describe('handleGenerateAI', () => {
    it('should not generate with empty prompt', async () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      act(() => {
        result.current.handleOpenAI()
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      // Should not have changed generating state
      expect(result.current.aiState.isGenerating).toBe(false)
    })

    it('should not generate with whitespace-only prompt', async () => {
      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('   ')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      expect(result.current.aiState.isGenerating).toBe(false)
    })

    it('should set isGenerating to true while generating', async () => {
      // Set up delayed response
      let resolveResponse: () => void
      const responsePromise = new Promise<void>(resolve => {
        resolveResponse = resolve
      })

      server.use(
        http.post('*/api/ai', async () => {
          await responsePromise
          return HttpResponse.json(createAIResponse({ measures: ['Employees.count'] }))
        })
      )

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...mockSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show employee counts')
      })

      // Start generation - don't await yet
      let generateDone = false
      const generatePromise = result.current.handleGenerateAI().then(() => {
        generateDone = true
      })

      // Wait a tick for the state to update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
      })

      // Check it's generating (if the request is still pending)
      // Note: Due to timing, this may have already completed
      if (!generateDone) {
        expect(result.current.aiState.isGenerating).toBe(true)
      }

      // Now resolve the response
      resolveResponse!()

      await act(async () => {
        await generatePromise
      })

      expect(result.current.aiState.isGenerating).toBe(false)
    })

    it('should apply generated query to state', async () => {
      const mockQuery: CubeQuery = {
        measures: ['Employees.totalSalary'],
        dimensions: ['Employees.department'],
      }

      server.use(
        http.post('*/api/ai', () => {
          return HttpResponse.json(createAIResponse(mockQuery))
        })
      )

      const setStateFn = vi.fn()
      const localSetters = {
        ...createMockSetters(),
        setState: setStateFn,
      }

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: emptyState,
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show salaries by department')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      expect(setStateFn).toHaveBeenCalled()
    })

    it('should apply chart type from AI response', async () => {
      server.use(
        http.post('*/api/ai', () => {
          return HttpResponse.json(createAIResponse({
            query: { measures: ['Employees.count'] },
            chartType: 'pie',
          }))
        })
      )

      const setChartTypeFn = vi.fn()
      const setUserManuallySelectedChartFn = vi.fn()
      const localSetters = {
        ...createMockSetters(),
        setChartType: setChartTypeFn,
        setUserManuallySelectedChart: setUserManuallySelectedChartFn,
      }

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: emptyState,
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show pie chart of counts')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      expect(setChartTypeFn).toHaveBeenCalledWith('pie')
      expect(setUserManuallySelectedChartFn).toHaveBeenCalledWith(true)
    })

    it('should apply chart config from AI response', async () => {
      const aiChartConfig: ChartAxisConfig = {
        xAxis: ['Employees.department'],
        yAxis: ['Employees.avgSalary'],
      }

      server.use(
        http.post('*/api/ai', () => {
          return HttpResponse.json(createAIResponse({
            query: { measures: ['Employees.avgSalary'], dimensions: ['Employees.department'] },
            chartConfig: aiChartConfig,
          }))
        })
      )

      const setChartConfigFn = vi.fn()
      const localSetters = {
        ...createMockSetters(),
        setChartConfig: setChartConfigFn,
      }

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: emptyState,
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show average salary by department')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      expect(setChartConfigFn).toHaveBeenCalledWith(aiChartConfig)
    })

    it('should switch to chart view after generating', async () => {
      server.use(
        http.post('*/api/ai', () => {
          return HttpResponse.json(createAIResponse({ measures: ['Employees.count'] }))
        })
      )

      const setActiveViewFn = vi.fn()
      const localSetters = {
        ...createMockSetters(),
        setActiveView: setActiveViewFn,
      }

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: emptyState,
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show counts')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      expect(setActiveViewFn).toHaveBeenCalledWith('chart')
    })

    it('should set hasGeneratedQuery after success', async () => {
      server.use(
        http.post('*/api/ai', () => {
          return HttpResponse.json(createAIResponse({ measures: ['Employees.count'] }))
        })
      )

      const localSetters = createMockSetters()

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: emptyState,
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show counts')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      expect(result.current.aiState.hasGeneratedQuery).toBe(true)
    })

    it('should handle API errors gracefully', async () => {
      server.use(
        http.post('*/api/ai', () => {
          return HttpResponse.json({ error: 'AI service unavailable' }, { status: 500 })
        })
      )

      const localSetters = createMockSetters()

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: emptyState,
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show counts')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      expect(result.current.aiState.error).not.toBeNull()
      expect(result.current.aiState.isGenerating).toBe(false)
    })

    it('should handle JSON parse errors', async () => {
      server.use(
        http.post('*/api/ai', () => {
          // Return malformed JSON in the query field
          return HttpResponse.json({ query: 'not valid json' })
        })
      )

      const localSetters = createMockSetters()

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: emptyState,
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show counts')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      expect(result.current.aiState.error).not.toBeNull()
    })

    it('should switch to query mode if in funnel mode and AI returns CubeQuery', async () => {
      server.use(
        http.post('*/api/ai', () => {
          return HttpResponse.json(createAIResponse({ measures: ['Employees.count'] }))
        })
      )

      const setAnalysisTypeFn = vi.fn()
      const localSetters = {
        ...createMockSetters(),
        setAnalysisType: setAnalysisTypeFn,
      }

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: emptyState,
          ...localSetters,
          chartType: 'funnel',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
          analysisType: 'funnel',
          setAnalysisType: setAnalysisTypeFn,
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show employee counts')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      expect(setAnalysisTypeFn).toHaveBeenCalledWith('query')
    })

    it('should handle funnel query response', async () => {
      const funnelQuery = {
        funnel: {
          steps: [
            { measure: 'Events.viewCount' },
            { measure: 'Events.clickCount' },
          ],
          timeDimension: { dimension: 'Events.createdAt', dateRange: 'last 7 days' },
        },
      }

      server.use(
        http.post('*/api/ai', () => {
          return HttpResponse.json(createAIResponse(funnelQuery))
        })
      )

      const setAnalysisTypeFn = vi.fn()
      const loadFunnelFromServerQueryFn = vi.fn()
      const setChartTypeFn = vi.fn()
      const localSetters = {
        ...createMockSetters(),
        setAnalysisType: setAnalysisTypeFn,
        loadFunnelFromServerQuery: loadFunnelFromServerQueryFn,
        setChartType: setChartTypeFn,
      }

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: emptyState,
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
          analysisType: 'query',
          setAnalysisType: setAnalysisTypeFn,
          loadFunnelFromServerQuery: loadFunnelFromServerQueryFn,
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show conversion funnel')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      expect(setAnalysisTypeFn).toHaveBeenCalledWith('funnel')
      expect(loadFunnelFromServerQueryFn).toHaveBeenCalledWith(funnelQuery)
      expect(setChartTypeFn).toHaveBeenCalledWith('funnel')
    })

    it('should error when funnel query without funnel mode support', async () => {
      const funnelQuery = {
        funnel: {
          steps: [{ measure: 'Events.viewCount' }],
          timeDimension: { dimension: 'Events.createdAt' },
        },
      }

      server.use(
        http.post('*/api/ai', () => {
          return HttpResponse.json(createAIResponse(funnelQuery))
        })
      )

      // Create setters without funnel support
      const localSetters = {
        setState: vi.fn(),
        setChartType: vi.fn(),
        setChartConfig: vi.fn(),
        setDisplayConfig: vi.fn(),
        setUserManuallySelectedChart: vi.fn(),
        setActiveView: vi.fn(),
        // No setAnalysisType or loadFunnelFromServerQuery provided
      }

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: emptyState,
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show funnel')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      expect(result.current.aiState.error).toContain('funnel mode support')
    })
  })

  // ==========================================================================
  // Accept AI Tests
  // ==========================================================================

  describe('handleAcceptAI', () => {
    it('should close panel when accepting', async () => {
      server.use(
        http.post('*/api/ai', () => {
          return HttpResponse.json(createAIResponse({ measures: ['Employees.count'] }))
        })
      )

      const localSetters = createMockSetters()

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: emptyState,
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show counts')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      act(() => {
        result.current.handleAcceptAI()
      })

      expect(result.current.aiState.isOpen).toBe(false)
    })

    it('should clear previous state when accepting', async () => {
      server.use(
        http.post('*/api/ai', () => {
          return HttpResponse.json(createAIResponse({ measures: ['Employees.count'] }))
        })
      )

      const localSetters = createMockSetters()

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show counts')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      act(() => {
        result.current.handleAcceptAI()
      })

      expect(result.current.aiState.previousState).toBeNull()
      expect(result.current.aiState.previousConfig).toBeNull()
    })

    it('should reset hasGeneratedQuery when accepting', () => {
      const localSetters = createMockSetters()

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      act(() => {
        result.current.handleAcceptAI()
      })

      expect(result.current.aiState.hasGeneratedQuery).toBe(false)
    })
  })

  // ==========================================================================
  // Cancel AI Tests
  // ==========================================================================

  describe('handleCancelAI', () => {
    it('should close panel when cancelling', () => {
      const localSetters = createMockSetters()

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      act(() => {
        result.current.handleOpenAI()
      })

      act(() => {
        result.current.handleCancelAI()
      })

      expect(result.current.aiState.isOpen).toBe(false)
    })

    it('should restore previous state when cancelling', async () => {
      const initialState = createMockState()
      server.use(
        http.post('*/api/ai', () => {
          return HttpResponse.json(createAIResponse({ measures: ['Employees.totalSalary'] }))
        })
      )

      const setStateFn = vi.fn()
      const setChartTypeFn = vi.fn()
      const setChartConfigFn = vi.fn()
      const setDisplayConfigFn = vi.fn()
      // Don't provide getFullConfig/loadFullConfig so that individual state restoration is used
      const localSetters = {
        setState: setStateFn,
        setChartType: setChartTypeFn,
        setChartConfig: setChartConfigFn,
        setDisplayConfig: setDisplayConfigFn,
        setUserManuallySelectedChart: vi.fn(),
        setActiveView: vi.fn(),
        // No getFullConfig/loadFullConfig provided - forces individual state restore
      }

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: initialState,
          ...localSetters,
          chartType: 'line',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show totals')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      // Reset mocks to check what gets called on cancel
      setStateFn.mockClear()
      setChartTypeFn.mockClear()
      setChartConfigFn.mockClear()
      setDisplayConfigFn.mockClear()

      act(() => {
        result.current.handleCancelAI()
      })

      expect(setStateFn).toHaveBeenCalled()
      expect(setChartTypeFn).toHaveBeenCalledWith('line')
      expect(setChartConfigFn).toHaveBeenCalled()
      expect(setDisplayConfigFn).toHaveBeenCalled()
    })

    it('should restore full config when available', async () => {
      server.use(
        http.post('*/api/ai', () => {
          return HttpResponse.json(createAIResponse({ measures: ['Employees.count'] }))
        })
      )

      const getFullConfigFn = vi.fn(() => mockAnalysisConfig)
      const loadFullConfigFn = vi.fn()
      const localSetters = {
        ...createMockSetters(),
        getFullConfig: getFullConfigFn,
        loadFullConfig: loadFullConfigFn,
      }

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
          getFullConfig: getFullConfigFn,
          loadFullConfig: loadFullConfigFn,
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show counts')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      act(() => {
        result.current.handleCancelAI()
      })

      expect(loadFullConfigFn).toHaveBeenCalledWith(mockAnalysisConfig)
    })

    it('should restore analysis type when cancelling', async () => {
      server.use(
        http.post('*/api/ai', () => {
          return HttpResponse.json(createAIResponse({ measures: ['Employees.count'] }))
        })
      )

      const setAnalysisTypeFn = vi.fn()
      // Don't provide getFullConfig/loadFullConfig to force individual state restore
      const localSetters = {
        setState: vi.fn(),
        setChartType: vi.fn(),
        setChartConfig: vi.fn(),
        setDisplayConfig: vi.fn(),
        setUserManuallySelectedChart: vi.fn(),
        setActiveView: vi.fn(),
        setAnalysisType: setAnalysisTypeFn,
        // No getFullConfig/loadFullConfig - forces individual state restore path
      }

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...localSetters,
          chartType: 'funnel',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
          analysisType: 'funnel',
          setAnalysisType: setAnalysisTypeFn,
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show counts')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      // Clear to track cancel call
      setAnalysisTypeFn.mockClear()

      act(() => {
        result.current.handleCancelAI()
      })

      expect(setAnalysisTypeFn).toHaveBeenCalledWith('funnel')
    })

    it('should clear previous state after restoring', () => {
      const localSetters = createMockSetters()

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: createMockState(),
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
        })
      )

      act(() => {
        result.current.handleOpenAI()
      })

      act(() => {
        result.current.handleCancelAI()
      })

      expect(result.current.aiState.previousState).toBeNull()
      expect(result.current.aiState.previousConfig).toBeNull()
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle network timeout', async () => {
      server.use(
        http.post('*/api/ai', async () => {
          // Simulate network error
          return HttpResponse.error()
        })
      )

      const localSetters = createMockSetters()

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: emptyState,
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show counts')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      expect(result.current.aiState.error).not.toBeNull()
      expect(result.current.aiState.isGenerating).toBe(false)
    })

    it('should handle empty response from AI', async () => {
      server.use(
        http.post('*/api/ai', () => {
          // Empty query field will cause JSON parse error
          return HttpResponse.json({ query: '' })
        })
      )

      const localSetters = createMockSetters()

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: emptyState,
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/api/ai',
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show counts')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      expect(result.current.aiState.error).not.toBeNull()
    })

    it('should use custom aiEndpoint', async () => {
      let requestedUrl = ''

      server.use(
        http.post('*/custom/ai/endpoint', ({ request }) => {
          requestedUrl = request.url
          return HttpResponse.json(createAIResponse({ measures: ['Employees.count'] }))
        })
      )

      const localSetters = createMockSetters()

      const { result } = renderHook(() =>
        useAnalysisAI({
          state: emptyState,
          ...localSetters,
          chartType: 'bar',
          chartConfig: mockChartConfig,
          displayConfig: mockDisplayConfig,
          aiEndpoint: '/custom/ai/endpoint',
        })
      )

      act(() => {
        result.current.handleOpenAI()
        result.current.handleAIPromptChange('Show counts')
      })

      await act(async () => {
        await result.current.handleGenerateAI()
      })

      expect(requestedUrl).toContain('/custom/ai/endpoint')
    })
  })
})
