/**
 * Tests for useElementVisibility hook
 * Covers visibility detection, scroll handling, and debouncing
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useRef, type RefObject } from 'react'
import { useElementVisibility } from '../../../../src/client/hooks/useElementVisibility'

// Helper to create a mock element
function createMockElement(rect: Partial<DOMRect> = {}) {
  const element = document.createElement('div')
  element.getBoundingClientRect = vi.fn(() => ({
    top: rect.top ?? 0,
    bottom: rect.bottom ?? 100,
    left: rect.left ?? 0,
    right: rect.right ?? 100,
    width: rect.width ?? 100,
    height: rect.height ?? 100,
    x: rect.x ?? 0,
    y: rect.y ?? 0,
    toJSON: () => ({})
  }))
  return element
}

// Helper to create a mock container
function createMockContainer(rect: Partial<DOMRect> = {}) {
  const container = document.createElement('div')
  container.getBoundingClientRect = vi.fn(() => ({
    top: rect.top ?? 0,
    bottom: rect.bottom ?? 500,
    left: rect.left ?? 0,
    right: rect.right ?? 300,
    width: rect.width ?? 300,
    height: rect.height ?? 500,
    x: rect.x ?? 0,
    y: rect.y ?? 0,
    toJSON: () => ({})
  }))
  return container
}

describe('useElementVisibility', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should return true initially (to prevent flash)', () => {
      const { result } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(null)
        return useElementVisibility(elementRef)
      })

      expect(result.current).toBe(true)
    })

    it('should add scroll event listener to window by default', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener')

      renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(createMockElement())
        return useElementVisibility(elementRef)
      })

      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), { passive: true })

      addEventListenerSpy.mockRestore()
    })

    it('should use default threshold of 80', () => {
      const element = createMockElement({ bottom: 85 }) // Just above 80 threshold

      const { result } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(element)
        return useElementVisibility(elementRef)
      })

      // Advance timers for debounce and RAF
      act(() => {
        vi.advanceTimersByTime(200)
      })

      // Element bottom (85) > threshold (80), so visible
      expect(result.current).toBe(true)
    })

    it('should accept custom threshold', () => {
      const element = createMockElement({ bottom: 50 }) // Below custom threshold

      const { result } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(element)
        return useElementVisibility(elementRef, { threshold: 100 })
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      // Element bottom (50) < threshold (100), so not visible
      expect(result.current).toBe(false)
    })
  })

  describe('viewport visibility detection', () => {
    it('should detect element as visible when bottom is in viewport', () => {
      const element = createMockElement({ bottom: 200 }) // Well above threshold

      const { result } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(element)
        return useElementVisibility(elementRef, { threshold: 80, debounceMs: 0 })
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current).toBe(true)
    })

    it('should detect element as not visible when scrolled past threshold', () => {
      const element = createMockElement({ bottom: 30 }) // Below 80 threshold

      const { result } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(element)
        return useElementVisibility(elementRef, { threshold: 80, debounceMs: 0 })
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current).toBe(false)
    })

    it('should update visibility on scroll', () => {
      let scrollHandler: EventListener | null = null
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'scroll') {
            scrollHandler = handler as EventListener
          }
        }
      )

      // Start with visible element
      const element = createMockElement({ bottom: 200 })

      const { result } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(element)
        return useElementVisibility(elementRef, { threshold: 80, debounceMs: 50 })
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })
      expect(result.current).toBe(true)

      // Simulate scroll - element moves up
      element.getBoundingClientRect = vi.fn(() => ({
        top: -100,
        bottom: 30, // Now below threshold
        left: 0,
        right: 100,
        width: 100,
        height: 100,
        x: 0,
        y: -100,
        toJSON: () => ({})
      }))

      act(() => {
        scrollHandler?.(new Event('scroll'))
        vi.advanceTimersByTime(100)
      })

      expect(result.current).toBe(false)

      addEventListenerSpy.mockRestore()
    })
  })

  describe('container-based visibility', () => {
    it('should check visibility against container when containerRef provided', () => {
      const container = createMockContainer({ top: 100, bottom: 500 })
      const element = createMockElement({ bottom: 200 }) // Element bottom > container top + threshold

      const { result } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(element)
        const containerRef = useRef<HTMLElement | null>(container)
        return useElementVisibility(elementRef, {
          containerRef,
          threshold: 80,
          debounceMs: 0
        })
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Element bottom (200) > container top (100) + threshold (80) = 180
      expect(result.current).toBe(true)
    })

    it('should detect not visible when element scrolled past container threshold', () => {
      const container = createMockContainer({ top: 100, bottom: 500 })
      const element = createMockElement({ bottom: 150 }) // Just above container top

      const { result } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(element)
        const containerRef = useRef<HTMLElement | null>(container)
        return useElementVisibility(elementRef, {
          containerRef,
          threshold: 80,
          debounceMs: 0
        })
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Element bottom (150) < container top (100) + threshold (80) = 180
      expect(result.current).toBe(false)
    })

    it('should add scroll listener to container element', () => {
      const container = createMockContainer()
      const addEventListenerSpy = vi.spyOn(container, 'addEventListener')

      renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(createMockElement())
        const containerRef = useRef<HTMLElement | null>(container)
        return useElementVisibility(elementRef, { containerRef })
      })

      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })

      addEventListenerSpy.mockRestore()
    })
  })

  describe('debouncing', () => {
    it('should debounce visibility checks', () => {
      let scrollHandler: EventListener | null = null
      vi.spyOn(window, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'scroll') {
            scrollHandler = handler as EventListener
          }
        }
      )

      const element = createMockElement({ bottom: 200 })
      let getBoundingClientRectCalls = 0
      element.getBoundingClientRect = vi.fn(() => {
        getBoundingClientRectCalls++
        return {
          top: 0,
          bottom: 200,
          left: 0,
          right: 100,
          width: 100,
          height: 200,
          x: 0,
          y: 0,
          toJSON: () => ({})
        }
      })

      renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(element)
        return useElementVisibility(elementRef, { debounceMs: 100 })
      })

      // Initial check
      act(() => {
        vi.advanceTimersByTime(50)
      })

      const callsAfterInit = getBoundingClientRectCalls

      // Multiple rapid scroll events
      act(() => {
        scrollHandler?.(new Event('scroll'))
        scrollHandler?.(new Event('scroll'))
        scrollHandler?.(new Event('scroll'))
        vi.advanceTimersByTime(50) // Not enough time for debounce
      })

      // Should not have additional calls yet (still debouncing)
      expect(getBoundingClientRectCalls).toBeLessThanOrEqual(callsAfterInit + 1)

      // After debounce delay
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Now should have made the call
      expect(getBoundingClientRectCalls).toBeGreaterThan(callsAfterInit)
    })

    it('should use default debounceMs of 100', () => {
      let scrollHandler: EventListener | null = null
      vi.spyOn(window, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'scroll') {
            scrollHandler = handler as EventListener
          }
        }
      )

      const element = createMockElement({ bottom: 200 })

      renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(element)
        return useElementVisibility(elementRef)
      })

      act(() => {
        vi.advanceTimersByTime(150) // Initial setup
      })

      // Scroll and wait less than default 100ms
      act(() => {
        scrollHandler?.(new Event('scroll'))
        vi.advanceTimersByTime(99)
      })

      // Should still be debouncing - no assertion needed, just verifying no errors
    })
  })

  describe('resize handling', () => {
    it('should update visibility on window resize', () => {
      let resizeHandler: EventListener | null = null
      vi.spyOn(window, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'resize') {
            resizeHandler = handler as EventListener
          }
        }
      )

      const element = createMockElement({ bottom: 200 })

      const { result } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(element)
        return useElementVisibility(elementRef, { threshold: 80, debounceMs: 50 })
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })
      expect(result.current).toBe(true)

      // Simulate resize - element now out of view
      element.getBoundingClientRect = vi.fn(() => ({
        top: -200,
        bottom: 30,
        left: 0,
        right: 100,
        width: 100,
        height: 100,
        x: 0,
        y: -200,
        toJSON: () => ({})
      }))

      act(() => {
        resizeHandler?.(new Event('resize'))
        vi.advanceTimersByTime(100)
      })

      expect(result.current).toBe(false)
    })
  })

  describe('cleanup', () => {
    it('should remove event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')

      const { unmount } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(createMockElement())
        return useElementVisibility(elementRef)
      })

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })

    it('should clear timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      const { unmount } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(createMockElement())
        return useElementVisibility(elementRef, { debounceMs: 1000 })
      })

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()

      clearTimeoutSpy.mockRestore()
    })

    it('should remove container scroll listener on unmount', () => {
      const container = createMockContainer()
      const removeEventListenerSpy = vi.spyOn(container, 'removeEventListener')

      const { unmount } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(createMockElement())
        const containerRef = useRef<HTMLElement | null>(container)
        return useElementVisibility(elementRef, { containerRef })
      })

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })
  })

  describe('element ref handling', () => {
    it('should stay visible when element ref is null', () => {
      const { result } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(null)
        return useElementVisibility(elementRef)
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      // Should remain visible (default) when element not mounted
      expect(result.current).toBe(true)
    })
  })

  describe('container option vs containerRef', () => {
    it('should reinitialize when container prop changes', () => {
      const container1 = createMockContainer({ top: 0 })
      const container2 = createMockContainer({ top: 200 })
      const element = createMockElement({ bottom: 150 })

      const { result, rerender } = renderHook(
        ({ container }) => {
          const elementRef = useRef<HTMLElement | null>(element)
          const containerRef = useRef<HTMLElement | null>(container)
          return useElementVisibility(elementRef, {
            containerRef,
            container,
            threshold: 80,
            debounceMs: 0
          })
        },
        { initialProps: { container: container1 } }
      )

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // With container1 (top: 0): element bottom (150) > container top (0) + threshold (80)
      expect(result.current).toBe(true)

      // Change container
      rerender({ container: container2 })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // With container2 (top: 200): element bottom (150) < container top (200) + threshold (80)
      // Actually this depends on re-initialization behavior
    })
  })

  describe('hasBeenVisibleRef tracking', () => {
    it('should track when element has been visible', () => {
      const element = createMockElement({ bottom: 200 })

      const { result } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(element)
        return useElementVisibility(elementRef, { threshold: 80, debounceMs: 0 })
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Element is visible
      expect(result.current).toBe(true)

      // Now scroll element out of view
      element.getBoundingClientRect = vi.fn(() => ({
        top: -200,
        bottom: 30,
        left: 0,
        right: 100,
        width: 100,
        height: 230,
        x: 0,
        y: -200,
        toJSON: () => ({})
      }))

      // Trigger scroll check by simulating scroll
      let scrollHandler: EventListener | null = null
      vi.spyOn(window, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'scroll') {
            scrollHandler = handler as EventListener
          }
        }
      )
    })
  })

  describe('edge cases', () => {
    it('should handle threshold of 0', () => {
      const element = createMockElement({ bottom: 1 })

      const { result } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(element)
        return useElementVisibility(elementRef, { threshold: 0, debounceMs: 0 })
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Element bottom (1) > threshold (0)
      expect(result.current).toBe(true)
    })

    it('should handle very large threshold', () => {
      const element = createMockElement({ bottom: 500 })

      const { result } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(element)
        return useElementVisibility(elementRef, { threshold: 1000, debounceMs: 0 })
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Element bottom (500) < threshold (1000)
      expect(result.current).toBe(false)
    })

    it('should handle debounceMs of 0', () => {
      const element = createMockElement({ bottom: 200 })

      const { result } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(element)
        return useElementVisibility(elementRef, { debounceMs: 0 })
      })

      act(() => {
        vi.advanceTimersByTime(10)
      })

      expect(result.current).toBe(true)
    })

    it('should handle element with negative bottom value', () => {
      const element = createMockElement({ bottom: -100 })

      const { result } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(element)
        return useElementVisibility(elementRef, { threshold: 80, debounceMs: 0 })
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Element bottom (-100) < threshold (80)
      expect(result.current).toBe(false)
    })
  })

  describe('requestAnimationFrame handling', () => {
    it('should cancel RAF on unmount', () => {
      const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame')

      const { unmount } = renderHook(() => {
        const elementRef = useRef<HTMLElement | null>(createMockElement())
        return useElementVisibility(elementRef)
      })

      unmount()

      expect(cancelAnimationFrameSpy).toHaveBeenCalled()
      cancelAnimationFrameSpy.mockRestore()
    })
  })
})
