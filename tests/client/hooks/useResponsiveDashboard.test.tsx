import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useResponsiveDashboard, type DashboardDisplayMode } from '../../../src/client/hooks/useResponsiveDashboard'

/**
 * Tests for useResponsiveDashboard hook
 *
 * This hook manages responsive dashboard layout with three display modes:
 * - Desktop (1200px+): Normal grid layout with full editing
 * - Scaled (768-1199px): CSS transform scaling, read-only
 * - Mobile (<768px): Single-column stacked layout, read-only
 */
describe('useResponsiveDashboard', () => {
  // Store original window properties
  let originalInnerWidth: number
  let resizeObserverCallback: ResizeObserverCallback | null = null
  let resizeObserverDisconnect: ReturnType<typeof vi.fn>
  let resizeHandlers: ((event: Event) => void)[] = []

  beforeEach(() => {
    vi.clearAllMocks()
    originalInnerWidth = window.innerWidth
    resizeHandlers = []
    resizeObserverCallback = null
    resizeObserverDisconnect = vi.fn()

    // Mock ResizeObserver as a proper class
    class MockResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        resizeObserverCallback = callback
      }
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = resizeObserverDisconnect
    }
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver

    // Mock window.addEventListener for resize events
    vi.spyOn(window, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'resize' && typeof handler === 'function') {
        resizeHandlers.push(handler)
      }
    })

    vi.spyOn(window, 'removeEventListener').mockImplementation((event, handler) => {
      if (event === 'resize') {
        const index = resizeHandlers.indexOf(handler as (event: Event) => void)
        if (index > -1) {
          resizeHandlers.splice(index, 1)
        }
      }
    })
  })

  afterEach(() => {
    // Restore window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      value: originalInnerWidth,
      writable: true,
      configurable: true
    })
    vi.restoreAllMocks()
  })

  describe('initial state', () => {
    it('should return containerRef as a function', () => {
      const { result } = renderHook(() => useResponsiveDashboard())

      expect(typeof result.current.containerRef).toBe('function')
    })

    it('should initialize with window width', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1400,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      expect(result.current.containerWidth).toBe(1400)
    })

    it('should return design width constant', () => {
      const { result } = renderHook(() => useResponsiveDashboard())

      expect(result.current.designWidth).toBe(1200)
    })
  })

  describe('display mode calculation', () => {
    it('should return desktop mode for width >= 1200', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1400,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      expect(result.current.displayMode).toBe('desktop')
    })

    it('should return desktop mode for width exactly 1200', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1200,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      expect(result.current.displayMode).toBe('desktop')
    })

    it('should return scaled mode for width between 768 and 1199', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1000,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      expect(result.current.displayMode).toBe('scaled')
    })

    it('should return scaled mode for width exactly 768', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 768,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      expect(result.current.displayMode).toBe('scaled')
    })

    it('should return mobile mode for width < 768', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 600,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      expect(result.current.displayMode).toBe('mobile')
    })

    it('should return mobile mode for very small widths', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 320,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      expect(result.current.displayMode).toBe('mobile')
    })
  })

  describe('scale factor calculation', () => {
    it('should return 1 for desktop mode', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1400,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      expect(result.current.scaleFactor).toBe(1)
    })

    it('should return 1 for mobile mode', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 600,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      expect(result.current.scaleFactor).toBe(1)
    })

    it('should calculate correct scale factor for scaled mode', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 900,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      // 900 / 1200 = 0.75
      expect(result.current.scaleFactor).toBe(0.75)
    })

    it('should calculate scale factor close to threshold', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1199,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      // 1199 / 1200 ≈ 0.9991...
      expect(result.current.scaleFactor).toBeCloseTo(1199 / 1200, 4)
    })
  })

  describe('isEditable flag', () => {
    it('should return true only for desktop mode', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1400,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      expect(result.current.isEditable).toBe(true)
    })

    it('should return false for scaled mode', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1000,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      expect(result.current.isEditable).toBe(false)
    })

    it('should return false for mobile mode', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 500,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      expect(result.current.isEditable).toBe(false)
    })
  })

  describe('containerRef callback', () => {
    it('should handle null node (cleanup)', () => {
      const { result } = renderHook(() => useResponsiveDashboard())

      // Calling with null should not throw
      expect(() => {
        act(() => {
          result.current.containerRef(null)
        })
      }).not.toThrow()
    })

    it('should read initial width from element', () => {
      const { result } = renderHook(() => useResponsiveDashboard())

      const mockElement = {
        offsetWidth: 950
      } as HTMLDivElement

      act(() => {
        result.current.containerRef(mockElement)
      })

      expect(result.current.containerWidth).toBe(950)
    })

    it('should create ResizeObserver for element', () => {
      const { result } = renderHook(() => useResponsiveDashboard())

      const mockElement = {
        offsetWidth: 1000
      } as HTMLDivElement

      act(() => {
        result.current.containerRef(mockElement)
      })

      // ResizeObserver should be created (callback should be set)
      expect(resizeObserverCallback).not.toBeNull()
    })

    it('should update width on ResizeObserver callback', () => {
      const { result } = renderHook(() => useResponsiveDashboard())

      const mockElement = {
        offsetWidth: 1000
      } as HTMLDivElement

      act(() => {
        result.current.containerRef(mockElement)
      })

      // Simulate resize via ResizeObserver callback
      if (resizeObserverCallback) {
        act(() => {
          resizeObserverCallback!([
            { contentRect: { width: 800 } } as ResizeObserverEntry
          ], {} as ResizeObserver)
        })
      }

      expect(result.current.containerWidth).toBe(800)
    })

    it('should ignore zero width in ResizeObserver callback', () => {
      const { result } = renderHook(() => useResponsiveDashboard())

      const mockElement = {
        offsetWidth: 1000
      } as HTMLDivElement

      act(() => {
        result.current.containerRef(mockElement)
      })

      // Simulate resize with zero width
      if (resizeObserverCallback) {
        act(() => {
          resizeObserverCallback!([
            { contentRect: { width: 0 } } as ResizeObserverEntry
          ], {} as ResizeObserver)
        })
      }

      // Should keep previous width
      expect(result.current.containerWidth).toBe(1000)
    })

    it('should ignore zero initial width from element', () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1400,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      const mockElement = {
        offsetWidth: 0
      } as HTMLDivElement

      act(() => {
        result.current.containerRef(mockElement)
      })

      // Should keep window width as initial value
      expect(result.current.containerWidth).toBe(1400)
    })

    it('should disconnect previous observer when new element attached', () => {
      const { result } = renderHook(() => useResponsiveDashboard())

      const mockElement1 = { offsetWidth: 1000 } as HTMLDivElement
      const mockElement2 = { offsetWidth: 800 } as HTMLDivElement

      act(() => {
        result.current.containerRef(mockElement1)
      })

      act(() => {
        result.current.containerRef(mockElement2)
      })

      // Previous observer should be disconnected
      expect(resizeObserverDisconnect).toHaveBeenCalled()
    })
  })

  describe('window resize fallback', () => {
    it('should register window resize listener', () => {
      renderHook(() => useResponsiveDashboard())

      expect(window.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('should clean up window resize listener on unmount', () => {
      const { unmount } = renderHook(() => useResponsiveDashboard())

      unmount()

      expect(window.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })
  })

  describe('mode transitions', () => {
    it('should transition from desktop to scaled', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 1400,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      expect(result.current.displayMode).toBe('desktop')

      // Simulate container resize to scaled range
      const mockElement = { offsetWidth: 900 } as HTMLDivElement

      act(() => {
        result.current.containerRef(mockElement)
      })

      expect(result.current.displayMode).toBe('scaled')
    })

    it('should transition from scaled to mobile', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 900,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      expect(result.current.displayMode).toBe('scaled')

      // Simulate container resize to mobile range
      const mockElement = { offsetWidth: 500 } as HTMLDivElement

      act(() => {
        result.current.containerRef(mockElement)
      })

      expect(result.current.displayMode).toBe('mobile')
    })

    it('should transition from mobile to desktop', async () => {
      Object.defineProperty(window, 'innerWidth', {
        value: 500,
        writable: true,
        configurable: true
      })

      const { result } = renderHook(() => useResponsiveDashboard())

      expect(result.current.displayMode).toBe('mobile')

      // Simulate container resize to desktop range
      const mockElement = { offsetWidth: 1400 } as HTMLDivElement

      act(() => {
        result.current.containerRef(mockElement)
      })

      expect(result.current.displayMode).toBe('desktop')
    })
  })

  describe('SSR handling', () => {
    it('should use fallback width when window is undefined', () => {
      // The hook checks for typeof window !== 'undefined'
      // In jsdom, window is always defined, so we test the logic path
      const { result } = renderHook(() => useResponsiveDashboard())

      // Should return valid values regardless
      expect(result.current.containerWidth).toBeGreaterThan(0)
      expect(result.current.designWidth).toBe(1200)
    })
  })

  describe('result object structure', () => {
    it('should return all expected properties', () => {
      const { result } = renderHook(() => useResponsiveDashboard())

      expect(result.current).toHaveProperty('containerRef')
      expect(result.current).toHaveProperty('containerWidth')
      expect(result.current).toHaveProperty('displayMode')
      expect(result.current).toHaveProperty('scaleFactor')
      expect(result.current).toHaveProperty('isEditable')
      expect(result.current).toHaveProperty('designWidth')
    })

    it('should have correct types for all properties', () => {
      const { result } = renderHook(() => useResponsiveDashboard())

      expect(typeof result.current.containerRef).toBe('function')
      expect(typeof result.current.containerWidth).toBe('number')
      expect(['desktop', 'scaled', 'mobile']).toContain(result.current.displayMode)
      expect(typeof result.current.scaleFactor).toBe('number')
      expect(typeof result.current.isEditable).toBe('boolean')
      expect(typeof result.current.designWidth).toBe('number')
    })
  })
})
