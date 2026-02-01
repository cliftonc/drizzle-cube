/**
 * Tests for useAnalysisInitialization hook
 *
 * This hook handles initialization side effects:
 * - URL share loading on mount
 * - Callback forwarding (onQueryChange, onChartConfigChange)
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAnalysisInitialization } from '../../../../src/client/hooks/useAnalysisInitialization'
import { AnalysisBuilderStoreProvider } from '../../../../src/client/stores/analysisBuilderStore'
import type { CubeQuery, ChartType, ChartAxisConfig, ChartDisplayConfig } from '../../../../src/client/types'

// Mock share utilities
vi.mock('../../../../src/client/utils/shareUtils', () => ({
  parseShareUrl: vi.fn(() => null),
  clearShareHash: vi.fn(),
  generateShareUrl: vi.fn(() => 'http://test.com/#share=abc'),
  compressAndEncode: vi.fn(() => 'encoded'),
  decodeAndDecompress: vi.fn(() => null),
}))

// Import mocked modules for test control
import * as shareUtils from '../../../../src/client/utils/shareUtils'

// ============================================================================
// Test Utilities
// ============================================================================

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: Infinity,
        gcTime: Infinity,
      },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AnalysisBuilderStoreProvider disableLocalStorage>
          {children}
        </AnalysisBuilderStoreProvider>
      </QueryClientProvider>
    )
  }
}

interface InitializationOptions {
  currentQuery: CubeQuery
  isValidQuery: boolean
  chartType: ChartType
  chartConfig: ChartAxisConfig
  displayConfig: ChartDisplayConfig
  onQueryChange?: (query: CubeQuery) => void
  onChartConfigChange?: (config: {
    chartType: ChartType
    chartConfig: ChartAxisConfig
    displayConfig: ChartDisplayConfig
  }) => void
}

const defaultOptions: InitializationOptions = {
  currentQuery: { measures: ['Employees.count'] },
  isValidQuery: true,
  chartType: 'bar',
  chartConfig: { xAxis: ['Employees.name'], yAxis: ['Employees.count'] },
  displayConfig: { showLegend: true, showGrid: true, showTooltip: true },
}

// ============================================================================
// Tests
// ============================================================================

describe('useAnalysisInitialization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  // ==========================================================================
  // Basic Functionality Tests
  // ==========================================================================
  describe('basic functionality', () => {
    it('should return void (side-effect only hook)', () => {
      const { result } = renderHook(
        () => useAnalysisInitialization(defaultOptions),
        { wrapper: createWrapper() }
      )

      // The hook returns void
      expect(result.current).toBeUndefined()
    })

    it('should not throw when initialized with valid options', () => {
      expect(() => {
        renderHook(
          () => useAnalysisInitialization(defaultOptions),
          { wrapper: createWrapper() }
        )
      }).not.toThrow()
    })
  })

  // ==========================================================================
  // URL Share Loading Tests
  // ==========================================================================
  describe('URL share loading', () => {
    it('should call parseShareUrl on mount', () => {
      renderHook(
        () => useAnalysisInitialization(defaultOptions),
        { wrapper: createWrapper() }
      )

      expect(shareUtils.parseShareUrl).toHaveBeenCalledTimes(1)
    })

    it('should only parse share URL once on mount', () => {
      const { rerender } = renderHook(
        () => useAnalysisInitialization(defaultOptions),
        { wrapper: createWrapper() }
      )

      // Rerender multiple times
      rerender()
      rerender()
      rerender()

      // Should still only be called once
      expect(shareUtils.parseShareUrl).toHaveBeenCalledTimes(1)
    })

    it('should not call clearShareHash when no share URL is present', () => {
      vi.mocked(shareUtils.parseShareUrl).mockReturnValue(null)

      renderHook(
        () => useAnalysisInitialization(defaultOptions),
        { wrapper: createWrapper() }
      )

      expect(shareUtils.clearShareHash).not.toHaveBeenCalled()
    })

    it('should call clearShareHash when share URL is present', () => {
      // Mock a valid AnalysisConfig
      const mockConfig = {
        version: 1 as const,
        analysisType: 'query' as const,
        activeView: 'chart' as const,
        charts: {
          query: {
            chartType: 'bar' as const,
            chartConfig: {},
            displayConfig: { showLegend: true, showGrid: true, showTooltip: true },
          },
        },
        query: { measures: ['Employees.count'] },
      }

      vi.mocked(shareUtils.parseShareUrl).mockReturnValue(mockConfig)

      renderHook(
        () => useAnalysisInitialization(defaultOptions),
        { wrapper: createWrapper() }
      )

      expect(shareUtils.clearShareHash).toHaveBeenCalledTimes(1)
    })
  })

  // ==========================================================================
  // onQueryChange Callback Tests
  // ==========================================================================
  describe('onQueryChange callback', () => {
    it('should call onQueryChange when query is valid', async () => {
      const onQueryChange = vi.fn()

      renderHook(
        () => useAnalysisInitialization({
          ...defaultOptions,
          onQueryChange,
        }),
        { wrapper: createWrapper() }
      )

      // Wait for effect to run
      await waitFor(() => {
        expect(onQueryChange).toHaveBeenCalled()
      })

      expect(onQueryChange).toHaveBeenCalledWith(defaultOptions.currentQuery)
    })

    it('should not call onQueryChange when query is invalid', () => {
      const onQueryChange = vi.fn()

      renderHook(
        () => useAnalysisInitialization({
          ...defaultOptions,
          isValidQuery: false,
          onQueryChange,
        }),
        { wrapper: createWrapper() }
      )

      expect(onQueryChange).not.toHaveBeenCalled()
    })

    it('should call onQueryChange when query changes', async () => {
      const onQueryChange = vi.fn()

      const { rerender } = renderHook(
        ({ query }: { query: CubeQuery }) =>
          useAnalysisInitialization({
            ...defaultOptions,
            currentQuery: query,
            onQueryChange,
          }),
        {
          wrapper: createWrapper(),
          initialProps: { query: { measures: ['Employees.count'] } },
        }
      )

      await waitFor(() => {
        expect(onQueryChange).toHaveBeenCalledTimes(1)
      })

      // Update the query
      rerender({ query: { measures: ['Employees.avgSalary'] } })

      await waitFor(() => {
        expect(onQueryChange).toHaveBeenCalledTimes(2)
      })

      expect(onQueryChange).toHaveBeenLastCalledWith({ measures: ['Employees.avgSalary'] })
    })

    it('should not call onQueryChange when not provided', () => {
      // No callback, should not throw
      expect(() => {
        renderHook(
          () => useAnalysisInitialization({
            ...defaultOptions,
            onQueryChange: undefined,
          }),
          { wrapper: createWrapper() }
        )
      }).not.toThrow()
    })
  })

  // ==========================================================================
  // onChartConfigChange Callback Tests
  // ==========================================================================
  describe('onChartConfigChange callback', () => {
    it('should call onChartConfigChange on mount', async () => {
      const onChartConfigChange = vi.fn()

      renderHook(
        () => useAnalysisInitialization({
          ...defaultOptions,
          onChartConfigChange,
        }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(onChartConfigChange).toHaveBeenCalled()
      })

      expect(onChartConfigChange).toHaveBeenCalledWith({
        chartType: 'bar',
        chartConfig: { xAxis: ['Employees.name'], yAxis: ['Employees.count'] },
        displayConfig: { showLegend: true, showGrid: true, showTooltip: true },
      })
    })

    it('should call onChartConfigChange when chartType changes', async () => {
      const onChartConfigChange = vi.fn()

      const { rerender } = renderHook(
        ({ chartType }: { chartType: ChartType }) =>
          useAnalysisInitialization({
            ...defaultOptions,
            chartType,
            onChartConfigChange,
          }),
        {
          wrapper: createWrapper(),
          initialProps: { chartType: 'bar' as ChartType },
        }
      )

      await waitFor(() => {
        expect(onChartConfigChange).toHaveBeenCalledTimes(1)
      })

      // Change chart type
      rerender({ chartType: 'line' })

      await waitFor(() => {
        expect(onChartConfigChange).toHaveBeenCalledTimes(2)
      })

      expect(onChartConfigChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ chartType: 'line' })
      )
    })

    it('should call onChartConfigChange when chartConfig changes', async () => {
      const onChartConfigChange = vi.fn()

      const { rerender } = renderHook(
        ({ chartConfig }: { chartConfig: ChartAxisConfig }) =>
          useAnalysisInitialization({
            ...defaultOptions,
            chartConfig,
            onChartConfigChange,
          }),
        {
          wrapper: createWrapper(),
          initialProps: { chartConfig: { xAxis: ['Employees.name'] } },
        }
      )

      await waitFor(() => {
        expect(onChartConfigChange).toHaveBeenCalledTimes(1)
      })

      // Change chart config
      rerender({ chartConfig: { xAxis: ['Employees.department'] } })

      await waitFor(() => {
        expect(onChartConfigChange).toHaveBeenCalledTimes(2)
      })
    })

    it('should call onChartConfigChange when displayConfig changes', async () => {
      const onChartConfigChange = vi.fn()

      const { rerender } = renderHook(
        ({ displayConfig }: { displayConfig: ChartDisplayConfig }) =>
          useAnalysisInitialization({
            ...defaultOptions,
            displayConfig,
            onChartConfigChange,
          }),
        {
          wrapper: createWrapper(),
          initialProps: { displayConfig: { showLegend: true, showGrid: true, showTooltip: true } },
        }
      )

      await waitFor(() => {
        expect(onChartConfigChange).toHaveBeenCalledTimes(1)
      })

      // Change display config
      rerender({ displayConfig: { showLegend: false, showGrid: true, showTooltip: true } })

      await waitFor(() => {
        expect(onChartConfigChange).toHaveBeenCalledTimes(2)
      })
    })

    it('should not call onChartConfigChange when not provided', () => {
      expect(() => {
        renderHook(
          () => useAnalysisInitialization({
            ...defaultOptions,
            onChartConfigChange: undefined,
          }),
          { wrapper: createWrapper() }
        )
      }).not.toThrow()
    })
  })

  // ==========================================================================
  // Callback Independence Tests
  // ==========================================================================
  describe('callback independence', () => {
    it('should call both callbacks independently', async () => {
      const onQueryChange = vi.fn()
      const onChartConfigChange = vi.fn()

      renderHook(
        () => useAnalysisInitialization({
          ...defaultOptions,
          onQueryChange,
          onChartConfigChange,
        }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(onQueryChange).toHaveBeenCalled()
        expect(onChartConfigChange).toHaveBeenCalled()
      })
    })

    it('should not affect onQueryChange when onChartConfigChange throws', async () => {
      const onQueryChange = vi.fn()
      const onChartConfigChange = vi.fn().mockImplementation(() => {
        throw new Error('Chart config error')
      })

      // This test verifies error isolation - the hooks run in separate useEffects
      // so one throwing shouldn't prevent the other from running
      // However, in practice, React's error boundary would catch this
      // For this test, we just verify both are called (the throw happens after the call)

      try {
        renderHook(
          () => useAnalysisInitialization({
            ...defaultOptions,
            onQueryChange,
            onChartConfigChange,
          }),
          { wrapper: createWrapper() }
        )
      } catch {
        // Expected to potentially throw
      }

      // onQueryChange should still have been called
      expect(onQueryChange).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================
  describe('edge cases', () => {
    it('should handle null currentQuery gracefully', () => {
      const onQueryChange = vi.fn()

      expect(() => {
        renderHook(
          () => useAnalysisInitialization({
            ...defaultOptions,
            currentQuery: {} as CubeQuery,
            isValidQuery: false,
            onQueryChange,
          }),
          { wrapper: createWrapper() }
        )
      }).not.toThrow()

      // Should not call onQueryChange for invalid query
      expect(onQueryChange).not.toHaveBeenCalled()
    })

    it('should handle empty chartConfig gracefully', async () => {
      const onChartConfigChange = vi.fn()

      renderHook(
        () => useAnalysisInitialization({
          ...defaultOptions,
          chartConfig: {},
          onChartConfigChange,
        }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(onChartConfigChange).toHaveBeenCalled()
      })

      expect(onChartConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ chartConfig: {} })
      )
    })

    it('should handle empty displayConfig gracefully', async () => {
      const onChartConfigChange = vi.fn()

      renderHook(
        () => useAnalysisInitialization({
          ...defaultOptions,
          displayConfig: {},
          onChartConfigChange,
        }),
        { wrapper: createWrapper() }
      )

      await waitFor(() => {
        expect(onChartConfigChange).toHaveBeenCalled()
      })

      expect(onChartConfigChange).toHaveBeenCalledWith(
        expect.objectContaining({ displayConfig: {} })
      )
    })

    it('should handle rapid callback reference changes', async () => {
      let callCount = 0
      const makeCallback = () => vi.fn().mockImplementation(() => { callCount++ })

      const { rerender } = renderHook(
        ({ cb }: { cb: ((query: CubeQuery) => void) }) =>
          useAnalysisInitialization({
            ...defaultOptions,
            onQueryChange: cb,
          }),
        {
          wrapper: createWrapper(),
          initialProps: { cb: makeCallback() },
        }
      )

      // Rapidly change callback references
      for (let i = 0; i < 5; i++) {
        rerender({ cb: makeCallback() })
      }

      // Should handle gracefully without excessive calls or errors
      expect(callCount).toBeGreaterThan(0)
    })
  })

  // ==========================================================================
  // Query Validity State Transitions
  // ==========================================================================
  describe('query validity transitions', () => {
    it('should call onQueryChange when query becomes valid', async () => {
      const onQueryChange = vi.fn()

      const { rerender } = renderHook(
        ({ isValid }: { isValid: boolean }) =>
          useAnalysisInitialization({
            ...defaultOptions,
            isValidQuery: isValid,
            onQueryChange,
          }),
        {
          wrapper: createWrapper(),
          initialProps: { isValid: false },
        }
      )

      // Not called when invalid
      expect(onQueryChange).not.toHaveBeenCalled()

      // Transition to valid
      rerender({ isValid: true })

      await waitFor(() => {
        expect(onQueryChange).toHaveBeenCalled()
      })
    })

    it('should stop calling onQueryChange when query becomes invalid', async () => {
      const onQueryChange = vi.fn()

      const { rerender } = renderHook(
        ({ isValid, query }: { isValid: boolean; query: CubeQuery }) =>
          useAnalysisInitialization({
            ...defaultOptions,
            currentQuery: query,
            isValidQuery: isValid,
            onQueryChange,
          }),
        {
          wrapper: createWrapper(),
          initialProps: {
            isValid: true,
            query: { measures: ['Employees.count'] },
          },
        }
      )

      await waitFor(() => {
        expect(onQueryChange).toHaveBeenCalledTimes(1)
      })

      // Transition to invalid
      rerender({ isValid: false, query: {} as CubeQuery })

      // Should not have been called again
      expect(onQueryChange).toHaveBeenCalledTimes(1)
    })
  })
})
