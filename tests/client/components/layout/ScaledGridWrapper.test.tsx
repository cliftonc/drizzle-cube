/**
 * Tests for ScaledGridWrapper component
 * Covers CSS transform scaling for intermediate screen sizes
 */

import { render, screen, act, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ScaledGridWrapper from '../../../../src/client/components/ScaledGridWrapper'

// Create a mock ResizeObserver that allows us to trigger callbacks
let resizeObserverCallback: ResizeObserverCallback | null = null
let resizeObserverInstance: { disconnect: () => void } | null = null

class MockResizeObserver {
  callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    resizeObserverCallback = callback
    resizeObserverInstance = this
  }

  observe(target: Element) {
    // Immediately trigger callback with element dimensions
    const entries = [{
      target,
      contentRect: {
        height: (target as HTMLElement).offsetHeight || 400,
        width: (target as HTMLElement).offsetWidth || 1200,
        top: 0,
        left: 0,
        bottom: 400,
        right: 1200,
        x: 0,
        y: 0,
        toJSON: () => ({})
      },
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: []
    } as ResizeObserverEntry]
    this.callback(entries, this as unknown as ResizeObserver)
  }

  unobserve() {}

  disconnect() {
    resizeObserverCallback = null
    resizeObserverInstance = null
  }
}

describe('ScaledGridWrapper', () => {
  const originalResizeObserver = global.ResizeObserver

  beforeEach(() => {
    vi.clearAllMocks()
    resizeObserverCallback = null
    resizeObserverInstance = null
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver
  })

  afterEach(() => {
    global.ResizeObserver = originalResizeObserver
  })

  describe('basic rendering', () => {
    it('should render children', () => {
      render(
        <ScaledGridWrapper scaleFactor={1} designWidth={1200}>
          <div data-testid="child">Child content</div>
        </ScaledGridWrapper>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
      expect(screen.getByText('Child content')).toBeInTheDocument()
    })

    it('should render with container class', () => {
      const { container } = render(
        <ScaledGridWrapper scaleFactor={1} designWidth={1200}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      const wrapper = container.querySelector('.scaled-grid-container')
      expect(wrapper).toBeInTheDocument()
    })

    it('should render inner wrapper with class', () => {
      const { container } = render(
        <ScaledGridWrapper scaleFactor={1} designWidth={1200}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      const inner = container.querySelector('.scaled-grid-inner')
      expect(inner).toBeInTheDocument()
    })
  })

  describe('scale factor application', () => {
    it('should apply scale(1) transform when scaleFactor is 1', () => {
      const { container } = render(
        <ScaledGridWrapper scaleFactor={1} designWidth={1200}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      const inner = container.querySelector('.scaled-grid-inner') as HTMLElement
      expect(inner.style.transform).toBe('scale(1)')
    })

    it('should apply scale(0.75) transform when scaleFactor is 0.75', () => {
      const { container } = render(
        <ScaledGridWrapper scaleFactor={0.75} designWidth={1200}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      const inner = container.querySelector('.scaled-grid-inner') as HTMLElement
      expect(inner.style.transform).toBe('scale(0.75)')
    })

    it('should apply scale(0.5) transform when scaleFactor is 0.5', () => {
      const { container } = render(
        <ScaledGridWrapper scaleFactor={0.5} designWidth={1200}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      const inner = container.querySelector('.scaled-grid-inner') as HTMLElement
      expect(inner.style.transform).toBe('scale(0.5)')
    })

    it('should apply fractional scale factors', () => {
      const { container } = render(
        <ScaledGridWrapper scaleFactor={0.666} designWidth={1200}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      const inner = container.querySelector('.scaled-grid-inner') as HTMLElement
      expect(inner.style.transform).toBe('scale(0.666)')
    })
  })

  describe('design width', () => {
    it('should set inner width to designWidth', () => {
      const { container } = render(
        <ScaledGridWrapper scaleFactor={1} designWidth={1200}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      const inner = container.querySelector('.scaled-grid-inner') as HTMLElement
      expect(inner.style.width).toBe('1200px')
    })

    it('should handle different design widths', () => {
      const { container } = render(
        <ScaledGridWrapper scaleFactor={0.8} designWidth={1400}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      const inner = container.querySelector('.scaled-grid-inner') as HTMLElement
      expect(inner.style.width).toBe('1400px')
    })

    it('should handle small design widths', () => {
      const { container } = render(
        <ScaledGridWrapper scaleFactor={1} designWidth={800}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      const inner = container.querySelector('.scaled-grid-inner') as HTMLElement
      expect(inner.style.width).toBe('800px')
    })
  })

  describe('transform origin', () => {
    it('should set transform origin to top left', () => {
      const { container } = render(
        <ScaledGridWrapper scaleFactor={0.75} designWidth={1200}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      const inner = container.querySelector('.scaled-grid-inner') as HTMLElement
      expect(inner.style.transformOrigin).toBe('top left')
    })
  })

  describe('container styling', () => {
    it('should have overflow hidden', () => {
      const { container } = render(
        <ScaledGridWrapper scaleFactor={1} designWidth={1200}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      const wrapper = container.querySelector('.scaled-grid-container') as HTMLElement
      expect(wrapper.style.overflow).toBe('hidden')
    })

    it('should have 100% width', () => {
      const { container } = render(
        <ScaledGridWrapper scaleFactor={1} designWidth={1200}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      const wrapper = container.querySelector('.scaled-grid-container') as HTMLElement
      expect(wrapper.style.width).toBe('100%')
    })
  })

  describe('height calculation with ResizeObserver', () => {
    it('should set height to auto when actualHeight is 0', () => {
      // Mock offsetHeight to return 0
      const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        get() {
          return 0
        }
      })

      const { container } = render(
        <ScaledGridWrapper scaleFactor={1} designWidth={1200}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      const wrapper = container.querySelector('.scaled-grid-container') as HTMLElement
      expect(wrapper.style.height).toBe('auto')

      // Restore original
      if (originalOffsetHeight) {
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight)
      }
    })

    it('should calculate visual height as actualHeight * scaleFactor', async () => {
      // Mock offsetHeight to return 400
      const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
        configurable: true,
        get() {
          return 400
        }
      })

      const { container } = render(
        <ScaledGridWrapper scaleFactor={0.75} designWidth={1200}>
          <div style={{ height: '400px' }}>Content</div>
        </ScaledGridWrapper>
      )

      await waitFor(() => {
        const wrapper = container.querySelector('.scaled-grid-container') as HTMLElement
        // Visual height = 400 * 0.75 = 300
        expect(wrapper.style.height).toBe('300px')
      })

      // Restore original
      if (originalOffsetHeight) {
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', originalOffsetHeight)
      }
    })

    it('should update height when ResizeObserver fires', async () => {
      const { container } = render(
        <ScaledGridWrapper scaleFactor={0.5} designWidth={1200}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      // Trigger ResizeObserver callback with new dimensions
      if (resizeObserverCallback) {
        const inner = container.querySelector('.scaled-grid-inner') as HTMLElement
        act(() => {
          resizeObserverCallback!([{
            target: inner,
            contentRect: {
              height: 600,
              width: 1200,
              top: 0,
              left: 0,
              bottom: 600,
              right: 1200,
              x: 0,
              y: 0,
              toJSON: () => ({})
            },
            borderBoxSize: [],
            contentBoxSize: [],
            devicePixelContentBoxSize: []
          } as ResizeObserverEntry], resizeObserverInstance as unknown as ResizeObserver)
        })
      }

      await waitFor(() => {
        const wrapper = container.querySelector('.scaled-grid-container') as HTMLElement
        // Visual height = 600 * 0.5 = 300
        expect(wrapper.style.height).toBe('300px')
      })
    })

    it('should disconnect ResizeObserver on unmount', () => {
      const disconnectSpy = vi.fn()

      class SpyResizeObserver extends MockResizeObserver {
        disconnect() {
          disconnectSpy()
          super.disconnect()
        }
      }

      global.ResizeObserver = SpyResizeObserver as unknown as typeof ResizeObserver

      const { unmount } = render(
        <ScaledGridWrapper scaleFactor={1} designWidth={1200}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      unmount()
      expect(disconnectSpy).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle scaleFactor of 0', () => {
      const { container } = render(
        <ScaledGridWrapper scaleFactor={0} designWidth={1200}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      const inner = container.querySelector('.scaled-grid-inner') as HTMLElement
      expect(inner.style.transform).toBe('scale(0)')
    })

    it('should handle very small scale factors', () => {
      const { container } = render(
        <ScaledGridWrapper scaleFactor={0.1} designWidth={1200}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      const inner = container.querySelector('.scaled-grid-inner') as HTMLElement
      expect(inner.style.transform).toBe('scale(0.1)')
    })

    it('should handle scale factors greater than 1', () => {
      const { container } = render(
        <ScaledGridWrapper scaleFactor={1.5} designWidth={1200}>
          <div>Content</div>
        </ScaledGridWrapper>
      )

      const inner = container.querySelector('.scaled-grid-inner') as HTMLElement
      expect(inner.style.transform).toBe('scale(1.5)')
    })

    it('should render multiple children', () => {
      render(
        <ScaledGridWrapper scaleFactor={1} designWidth={1200}>
          <div data-testid="child-1">First</div>
          <div data-testid="child-2">Second</div>
          <div data-testid="child-3">Third</div>
        </ScaledGridWrapper>
      )

      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
      expect(screen.getByTestId('child-3')).toBeInTheDocument()
    })

    it('should handle null/undefined children gracefully', () => {
      const { container } = render(
        <ScaledGridWrapper scaleFactor={1} designWidth={1200}>
          {null}
          {undefined}
          <div data-testid="visible-child">Visible</div>
        </ScaledGridWrapper>
      )

      expect(screen.getByTestId('visible-child')).toBeInTheDocument()
      expect(container.querySelector('.scaled-grid-container')).toBeInTheDocument()
    })
  })
})
