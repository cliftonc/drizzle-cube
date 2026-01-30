import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useAnalysisShare } from '../../../src/client/hooks/useAnalysisShare'
import type { AnalysisConfig } from '../../../src/client/types/analysisConfig'

// ============================================================================
// Mocks
// ============================================================================

// Mock the clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
}

// ============================================================================
// Test Data
// ============================================================================

const validAnalysisConfig: AnalysisConfig = {
  version: 1,
  analysisType: 'query',
  activeView: 'chart',
  charts: {
    query: {
      chartType: 'bar',
      chartConfig: {
        xAxis: ['Employees.name'],
        yAxis: ['Employees.count'],
      },
      displayConfig: {
        showLegend: true,
      },
    },
  },
  query: {
    measures: ['Employees.count'],
    dimensions: ['Employees.name'],
  },
}

const minimalConfig: AnalysisConfig = {
  version: 1,
  analysisType: 'query',
  activeView: 'table',
  charts: {},
  query: {
    measures: ['Employees.count'],
  },
}

const largeConfig: AnalysisConfig = {
  version: 1,
  analysisType: 'query',
  activeView: 'chart',
  charts: {
    query: {
      chartType: 'bar',
      chartConfig: {
        xAxis: Array(100).fill('Employees.name'),
        yAxis: Array(100).fill('Employees.count'),
      },
      displayConfig: {
        showLegend: true,
        showGrid: true,
        colors: Array(100).fill('#ff0000'),
      },
    },
  },
  query: {
    measures: Array(50).fill('Employees.count').map((m, i) => `${m}${i}`),
    dimensions: Array(50).fill('Employees.name').map((d, i) => `${d}${i}`),
    filters: Array(20).fill(null).map((_, i) => ({
      member: `Employees.field${i}`,
      operator: 'equals',
      values: [`value${i}`, `value${i + 1}`, `value${i + 2}`],
    })),
  },
}

// ============================================================================
// Tests
// ============================================================================

describe('useAnalysisShare', () => {
  beforeEach(() => {
    // Mock clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: mockClipboard,
      writable: true,
      configurable: true,
    })
    mockClipboard.writeText.mockClear()
    mockClipboard.writeText.mockResolvedValue(undefined)
  })

  // ==========================================================================
  // Initial State Tests
  // ==========================================================================

  describe('initial state', () => {
    it('should start with idle share button state', () => {
      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: true,
          getAnalysisConfig: () => validAnalysisConfig,
        })
      )

      expect(result.current.shareButtonState).toBe('idle')
    })

    it('should provide handleShare function', () => {
      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: true,
          getAnalysisConfig: () => validAnalysisConfig,
        })
      )

      expect(typeof result.current.handleShare).toBe('function')
    })
  })

  // ==========================================================================
  // Share Generation Tests
  // ==========================================================================

  describe('handleShare', () => {
    it('should not share when query is invalid', async () => {
      const getAnalysisConfig = vi.fn(() => validAnalysisConfig)
      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: false,
          getAnalysisConfig,
        })
      )

      await act(async () => {
        await result.current.handleShare()
      })

      expect(getAnalysisConfig).not.toHaveBeenCalled()
      expect(mockClipboard.writeText).not.toHaveBeenCalled()
    })

    it('should get config from getAnalysisConfig', async () => {
      const getAnalysisConfig = vi.fn(() => validAnalysisConfig)
      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: true,
          getAnalysisConfig,
        })
      )

      await act(async () => {
        await result.current.handleShare()
      })

      expect(getAnalysisConfig).toHaveBeenCalled()
    })

    it('should copy URL to clipboard', async () => {
      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: true,
          getAnalysisConfig: () => validAnalysisConfig,
        })
      )

      await act(async () => {
        await result.current.handleShare()
      })

      expect(mockClipboard.writeText).toHaveBeenCalled()
      const copiedUrl = mockClipboard.writeText.mock.calls[0][0]
      expect(copiedUrl).toContain('#share=')
    })

    it('should set state to copied after sharing', async () => {
      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: true,
          getAnalysisConfig: () => validAnalysisConfig,
        })
      )

      await act(async () => {
        await result.current.handleShare()
      })

      expect(result.current.shareButtonState).toBe('copied')
    })

    it('should reset to idle after timeout', async () => {
      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: true,
          getAnalysisConfig: () => validAnalysisConfig,
        })
      )

      await act(async () => {
        await result.current.handleShare()
      })

      expect(result.current.shareButtonState).toBe('copied')

      // Wait for the timeout (2 seconds)
      await waitFor(
        () => {
          expect(result.current.shareButtonState).toBe('idle')
        },
        { timeout: 3000 }
      )
    })

    it('should handle large config gracefully', async () => {
      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: true,
          getAnalysisConfig: () => largeConfig,
        })
      )

      await act(async () => {
        await result.current.handleShare()
      })

      // Large config should trigger fallback or still work
      expect(['copied', 'copied-no-chart']).toContain(result.current.shareButtonState)
    })
  })

  // ==========================================================================
  // URL Format Tests
  // ==========================================================================

  describe('URL format', () => {
    it('should include share hash in URL', async () => {
      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: true,
          getAnalysisConfig: () => validAnalysisConfig,
        })
      )

      await act(async () => {
        await result.current.handleShare()
      })

      const copiedUrl = mockClipboard.writeText.mock.calls[0][0]
      expect(copiedUrl).toContain('#share=')
    })

    it('should generate compressed share parameter', async () => {
      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: true,
          getAnalysisConfig: () => minimalConfig,
        })
      )

      await act(async () => {
        await result.current.handleShare()
      })

      const copiedUrl = mockClipboard.writeText.mock.calls[0][0] as string
      const shareParam = copiedUrl.split('#share=')[1]

      // LZ-string compressed data should be present
      expect(shareParam).toBeDefined()
      expect(shareParam.length).toBeGreaterThan(0)
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('edge cases', () => {
    it('should handle minimal config', async () => {
      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: true,
          getAnalysisConfig: () => minimalConfig,
        })
      )

      await act(async () => {
        await result.current.handleShare()
      })

      expect(mockClipboard.writeText).toHaveBeenCalled()
      expect(result.current.shareButtonState).toBe('copied')
    })

    it('should handle config with empty charts', async () => {
      const configWithEmptyCharts: AnalysisConfig = {
        ...validAnalysisConfig,
        charts: {},
      }

      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: true,
          getAnalysisConfig: () => configWithEmptyCharts,
        })
      )

      await act(async () => {
        await result.current.handleShare()
      })

      expect(mockClipboard.writeText).toHaveBeenCalled()
    })

    it('should handle funnel analysis type', async () => {
      const funnelConfig: AnalysisConfig = {
        version: 1,
        analysisType: 'funnel',
        activeView: 'chart',
        charts: {
          funnel: {
            chartType: 'funnel',
            chartConfig: {},
            displayConfig: {},
          },
        },
        query: {
          funnel: {
            steps: [
              { measure: 'Events.viewCount' },
              { measure: 'Events.clickCount' },
            ],
            timeDimension: {
              dimension: 'Events.createdAt',
              dateRange: 'last 7 days',
            },
          },
        } as unknown,
      }

      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: true,
          getAnalysisConfig: () => funnelConfig,
        })
      )

      await act(async () => {
        await result.current.handleShare()
      })

      expect(mockClipboard.writeText).toHaveBeenCalled()
    })

    it('should handle config with filters', async () => {
      const configWithFilters: AnalysisConfig = {
        ...validAnalysisConfig,
        query: {
          ...validAnalysisConfig.query as object,
          filters: [
            { member: 'Employees.department', operator: 'equals', values: ['Engineering'] },
          ],
        },
      }

      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: true,
          getAnalysisConfig: () => configWithFilters,
        })
      )

      await act(async () => {
        await result.current.handleShare()
      })

      expect(mockClipboard.writeText).toHaveBeenCalled()
    })

    it('should handle config with time dimensions', async () => {
      const configWithTimeDimensions: AnalysisConfig = {
        ...validAnalysisConfig,
        query: {
          ...validAnalysisConfig.query as object,
          timeDimensions: [
            { dimension: 'Employees.createdAt', granularity: 'month' },
          ],
        },
      }

      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: true,
          getAnalysisConfig: () => configWithTimeDimensions,
        })
      )

      await act(async () => {
        await result.current.handleShare()
      })

      expect(mockClipboard.writeText).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // State Transition Tests
  // ==========================================================================

  describe('state transitions', () => {
    it('should transition from idle to copied', async () => {
      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: true,
          getAnalysisConfig: () => validAnalysisConfig,
        })
      )

      expect(result.current.shareButtonState).toBe('idle')

      await act(async () => {
        await result.current.handleShare()
      })

      expect(result.current.shareButtonState).toBe('copied')
    })

    it('should not change state for invalid query', async () => {
      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: false,
          getAnalysisConfig: () => validAnalysisConfig,
        })
      )

      expect(result.current.shareButtonState).toBe('idle')

      await act(async () => {
        await result.current.handleShare()
      })

      // Should still be idle
      expect(result.current.shareButtonState).toBe('idle')
    })
  })

  // ==========================================================================
  // Compression Tests
  // ==========================================================================

  describe('compression behavior', () => {
    it('should compress small configs successfully', async () => {
      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: true,
          getAnalysisConfig: () => minimalConfig,
        })
      )

      await act(async () => {
        await result.current.handleShare()
      })

      const copiedUrl = mockClipboard.writeText.mock.calls[0][0] as string
      // URL should be reasonably short for minimal config
      expect(copiedUrl.length).toBeLessThan(500)
    })

    it('should handle medium-sized configs', async () => {
      const mediumConfig: AnalysisConfig = {
        ...validAnalysisConfig,
        query: {
          measures: Array(10).fill(null).map((_, i) => `Employees.measure${i}`),
          dimensions: Array(5).fill(null).map((_, i) => `Employees.dim${i}`),
        },
      }

      const { result } = renderHook(() =>
        useAnalysisShare({
          isValidQuery: true,
          getAnalysisConfig: () => mediumConfig,
        })
      )

      await act(async () => {
        await result.current.handleShare()
      })

      expect(mockClipboard.writeText).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Hook Stability Tests
  // ==========================================================================

  describe('hook stability', () => {
    it('should maintain stable handleShare reference on same props', () => {
      const getConfig = () => validAnalysisConfig
      const { result, rerender } = renderHook(
        ({ isValidQuery }) =>
          useAnalysisShare({
            isValidQuery,
            getAnalysisConfig: getConfig,
          }),
        { initialProps: { isValidQuery: true } }
      )

      const initialHandleShare = result.current.handleShare

      rerender({ isValidQuery: true })

      // Reference should be stable due to useCallback
      expect(result.current.handleShare).toBe(initialHandleShare)
    })
  })
})
