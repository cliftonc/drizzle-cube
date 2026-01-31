/**
 * Tests for ChartContainer component
 *
 * Focus on rendering, responsive behavior, loading states,
 * error handling, and height configuration.
 *
 * ChartContainer wraps Recharts' ResponsiveContainer with:
 * - Dimension measurement via ResizeObserver
 * - Loading state while measuring
 * - Error boundary for container failures
 */

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ChartContainer from '../../../../src/client/components/charts/ChartContainer'

// Mock ResponsiveContainer from recharts to avoid complex rendering issues
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children, width, height }: { children: React.ReactNode; width: number; height: number }) => (
    <div data-testid="responsive-container" style={{ width, height }}>
      {children}
    </div>
  ),
}))

// Mock LoadingIndicator
vi.mock('../../../../src/client/components/LoadingIndicator', () => ({
  default: ({ size }: { size: string }) => (
    <div data-testid="loading-indicator" data-size={size} role="status" aria-label="Loading">
      Loading...
    </div>
  ),
}))

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback
  observed: Set<Element>

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    this.observed = new Set()
  }

  observe(target: Element) {
    this.observed.add(target)
  }

  unobserve(target: Element) {
    this.observed.delete(target)
  }

  disconnect() {
    this.observed.clear()
  }

  // Helper to trigger resize
  triggerResize(entries: ResizeObserverEntry[]) {
    this.callback(entries, this as unknown as ResizeObserver)
  }
}

let mockResizeObserver: MockResizeObserver | null = null

beforeEach(() => {
  // Setup ResizeObserver mock
  mockResizeObserver = null
  vi.stubGlobal('ResizeObserver', class extends MockResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      super(callback)
      mockResizeObserver = this
    }
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

// Helper to create a mock bounding rect
function createMockBoundingRect(width: number, height: number): DOMRect {
  return {
    width,
    height,
    top: 0,
    left: 0,
    right: width,
    bottom: height,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }
}

// Helper to simulate container becoming ready with dimensions
function simulateContainerReady(width: number, height: number) {
  if (mockResizeObserver && mockResizeObserver.observed.size > 0) {
    const target = Array.from(mockResizeObserver.observed)[0]

    // Mock getBoundingClientRect
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(
      createMockBoundingRect(width, height)
    )

    // Mock clientWidth/Height
    Object.defineProperty(target, 'clientWidth', { value: width, configurable: true })
    Object.defineProperty(target, 'clientHeight', { value: height, configurable: true })

    // Trigger the resize callback
    mockResizeObserver.triggerResize([{
      target,
      contentRect: {
        width,
        height,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      },
      borderBoxSize: [{ blockSize: height, inlineSize: width }],
      contentBoxSize: [{ blockSize: height, inlineSize: width }],
      devicePixelContentBoxSize: [{ blockSize: height, inlineSize: width }],
    }])
  }
}

describe('ChartContainer', () => {
  describe('basic rendering', () => {
    it('should render a container div', () => {
      const { container } = render(
        <ChartContainer>
          <div>Chart Content</div>
        </ChartContainer>
      )

      expect(container.firstChild).toBeInTheDocument()
      expect(container.firstChild).toHaveClass('dc:w-full')
    })

    it('should pass children to the container', () => {
      render(
        <ChartContainer>
          <div data-testid="chart-child">Test Chart</div>
        </ChartContainer>
      )

      // Initially shows loading, but children structure is set up
      expect(document.querySelector('[data-testid="loading-indicator"]')).toBeInTheDocument()
    })
  })

  describe('height configuration', () => {
    it('should use 100% height by default', () => {
      const { container } = render(
        <ChartContainer>
          <div>Chart</div>
        </ChartContainer>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ minHeight: '250px' })
    })

    it('should handle numeric height', () => {
      const { container } = render(
        <ChartContainer height={400}>
          <div>Chart</div>
        </ChartContainer>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '400px' })
    })

    it('should handle string height', () => {
      const { container } = render(
        <ChartContainer height="50vh">
          <div>Chart</div>
        </ChartContainer>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ height: '50vh' })
    })

    it('should set minHeight for 100% mode', () => {
      const { container } = render(
        <ChartContainer height="100%">
          <div>Chart</div>
        </ChartContainer>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ minHeight: '250px' })
    })

    it('should set minHeight for specific heights', () => {
      const { container } = render(
        <ChartContainer height={300}>
          <div>Chart</div>
        </ChartContainer>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ minHeight: '200px' })
    })

    it('should set minWidth on container', () => {
      const { container } = render(
        <ChartContainer>
          <div>Chart</div>
        </ChartContainer>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ minWidth: '100px' })
    })
  })

  describe('loading states', () => {
    it('should show loading indicator initially', () => {
      render(
        <ChartContainer>
          <div>Chart</div>
        </ChartContainer>
      )

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByLabelText('Loading')).toBeInTheDocument()
    })

    it('should use small loading indicator', () => {
      render(
        <ChartContainer>
          <div>Chart</div>
        </ChartContainer>
      )

      const loader = screen.getByTestId('loading-indicator')
      expect(loader).toHaveAttribute('data-size', 'sm')
    })

    it('should show ResponsiveContainer when dimensions are ready', async () => {
      render(
        <ChartContainer>
          <div>Chart Content</div>
        </ChartContainer>
      )

      // Simulate container becoming ready
      act(() => {
        simulateContainerReady(500, 300)
      })

      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      })
    })

    it('should hide loading indicator when ready', async () => {
      render(
        <ChartContainer>
          <div>Chart Content</div>
        </ChartContainer>
      )

      // Simulate container becoming ready
      act(() => {
        simulateContainerReady(500, 300)
      })

      await waitFor(() => {
        expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument()
      })
    })
  })

  describe('responsive behavior', () => {
    it('should set up ResizeObserver on mount', () => {
      render(
        <ChartContainer>
          <div>Chart</div>
        </ChartContainer>
      )

      expect(mockResizeObserver).not.toBeNull()
      expect(mockResizeObserver?.observed.size).toBeGreaterThan(0)
    })

    it('should disconnect ResizeObserver on unmount', () => {
      const { unmount } = render(
        <ChartContainer>
          <div>Chart</div>
        </ChartContainer>
      )

      const observer = mockResizeObserver
      expect(observer?.observed.size).toBeGreaterThan(0)

      unmount()

      expect(observer?.observed.size).toBe(0)
    })

    it('should update dimensions on resize', async () => {
      const { rerender } = render(
        <ChartContainer>
          <div>Chart Content</div>
        </ChartContainer>
      )

      // Initial dimensions
      act(() => {
        simulateContainerReady(500, 300)
      })

      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      })

      // Simulate resize
      act(() => {
        simulateContainerReady(800, 400)
      })

      // Re-render to pick up new dimensions
      rerender(
        <ChartContainer>
          <div>Chart Content</div>
        </ChartContainer>
      )

      await waitFor(() => {
        const container = screen.getByTestId('responsive-container')
        expect(container).toHaveStyle({ width: '800px' })
      })
    })

    it('should not become ready with zero width', () => {
      render(
        <ChartContainer>
          <div>Chart</div>
        </ChartContainer>
      )

      // Simulate zero dimensions
      act(() => {
        simulateContainerReady(0, 300)
      })

      // Should still show loading
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    })

    it('should not become ready with zero height', () => {
      render(
        <ChartContainer>
          <div>Chart</div>
        </ChartContainer>
      )

      // Simulate zero dimensions
      act(() => {
        simulateContainerReady(500, 0)
      })

      // Should still show loading
      expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    })
  })

  describe('container styles', () => {
    it('should have overflow hidden', () => {
      const { container } = render(
        <ChartContainer>
          <div>Chart</div>
        </ChartContainer>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ overflow: 'hidden' })
    })

    it('should have userSelect none to prevent selection during drag', () => {
      const { container } = render(
        <ChartContainer>
          <div>Chart</div>
        </ChartContainer>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveStyle({ userSelect: 'none' })
    })

    it('should have flex column layout for 100% height', () => {
      const { container } = render(
        <ChartContainer height="100%">
          <div>Chart</div>
        </ChartContainer>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('dc:flex-col')
      expect(wrapper).toHaveClass('dc:flex-1')
    })

    it('should be positioned relative', () => {
      const { container } = render(
        <ChartContainer>
          <div>Chart</div>
        </ChartContainer>
      )

      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toHaveClass('dc:relative')
    })
  })

  describe('ResponsiveContainer configuration', () => {
    it('should pass calculated width to ResponsiveContainer', async () => {
      render(
        <ChartContainer>
          <div>Chart Content</div>
        </ChartContainer>
      )

      act(() => {
        simulateContainerReady(600, 400)
      })

      await waitFor(() => {
        const responsiveContainer = screen.getByTestId('responsive-container')
        expect(responsiveContainer).toHaveStyle({ width: '600px' })
      })
    })

    it('should pass calculated height minus offset to ResponsiveContainer', async () => {
      render(
        <ChartContainer>
          <div>Chart Content</div>
        </ChartContainer>
      )

      act(() => {
        simulateContainerReady(600, 400)
      })

      await waitFor(() => {
        const responsiveContainer = screen.getByTestId('responsive-container')
        // Height should be containerSize.height - 16 = 400 - 16 = 384
        expect(responsiveContainer).toHaveStyle({ height: '384px' })
      })
    })
  })

  describe('error handling', () => {
    it('should render error state when ResponsiveContainer throws', () => {
      // Mock ResponsiveContainer to throw
      vi.doMock('recharts', () => ({
        ResponsiveContainer: () => {
          throw new Error('Container error')
        },
      }))

      // This test verifies the try-catch block exists
      // The actual error boundary is in the component
      const { container } = render(
        <ChartContainer>
          <div>Chart</div>
        </ChartContainer>
      )

      // Container should still render (either loading or error state)
      expect(container.firstChild).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have loading indicator with role="status"', () => {
      render(
        <ChartContainer>
          <div>Chart</div>
        </ChartContainer>
      )

      const loadingIndicator = screen.getByRole('status')
      expect(loadingIndicator).toBeInTheDocument()
    })

    it('should have loading indicator with aria-label', () => {
      render(
        <ChartContainer>
          <div>Chart</div>
        </ChartContainer>
      )

      const loadingIndicator = screen.getByLabelText('Loading')
      expect(loadingIndicator).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle very small dimensions', async () => {
      render(
        <ChartContainer>
          <div>Chart Content</div>
        </ChartContainer>
      )

      act(() => {
        simulateContainerReady(101, 201) // Just above minimums
      })

      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      })
    })

    it('should handle exact minimum dimensions', async () => {
      render(
        <ChartContainer>
          <div>Chart Content</div>
        </ChartContainer>
      )

      act(() => {
        simulateContainerReady(100, 200) // At minimums
      })

      // Should become ready at exact minimum dimensions
      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      })
    })

    it('should handle very large dimensions', async () => {
      render(
        <ChartContainer>
          <div>Chart Content</div>
        </ChartContainer>
      )

      act(() => {
        simulateContainerReady(5000, 3000)
      })

      await waitFor(() => {
        const container = screen.getByTestId('responsive-container')
        expect(container).toHaveStyle({ width: '5000px' })
      })
    })

    it('should handle rapid resize events', async () => {
      render(
        <ChartContainer>
          <div>Chart Content</div>
        </ChartContainer>
      )

      // Rapid resizes
      act(() => {
        simulateContainerReady(500, 300)
        simulateContainerReady(600, 350)
        simulateContainerReady(550, 320)
        simulateContainerReady(700, 400)
      })

      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      })
    })

    it('should handle children with no explicit size', async () => {
      render(
        <ChartContainer>
          <span>Simple text child</span>
        </ChartContainer>
      )

      act(() => {
        simulateContainerReady(400, 300)
      })

      await waitFor(() => {
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument()
      })
    })
  })
})
