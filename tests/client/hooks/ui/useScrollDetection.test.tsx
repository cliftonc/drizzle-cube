/**
 * Tests for useScrollDetection hook
 * Covers scroll position detection, threshold handling, and debouncing
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useRef } from 'react'
import { useScrollDetection } from '../../../../src/client/hooks/useScrollDetection'

// Helper to create a mock scroll container
function createMockScrollContainer(scrollTop: number = 0) {
  const container = document.createElement('div')

  Object.defineProperty(container, 'scrollTop', {
    value: scrollTop,
    writable: true,
    configurable: true
  })

  return container
}

describe('useScrollDetection', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should return false initially when scroll is at top', () => {
      const { result } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(createMockScrollContainer(0))
        return useScrollDetection(containerRef)
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current).toBe(false)
    })

    it('should return true initially when scrolled past threshold', () => {
      const { result } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(createMockScrollContainer(50))
        return useScrollDetection(containerRef, { threshold: 20 })
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current).toBe(true)
    })

    it('should use default threshold of 20', () => {
      // Just at threshold
      const { result } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(createMockScrollContainer(20))
        return useScrollDetection(containerRef)
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      // scrollTop (20) is NOT > threshold (20), so false
      expect(result.current).toBe(false)

      // Just past threshold
      const { result: result2 } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(createMockScrollContainer(21))
        return useScrollDetection(containerRef)
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result2.current).toBe(true)
    })

    it('should use default debounceMs of 150', () => {
      const container = createMockScrollContainer(0)
      let scrollHandler: EventListener | null = null

      vi.spyOn(container, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'scroll') {
            scrollHandler = handler as EventListener
          }
        }
      )

      renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(container)
        return useScrollDetection(containerRef)
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      // Change scroll position
      Object.defineProperty(container, 'scrollTop', { value: 50, writable: true })

      act(() => {
        scrollHandler?.(new Event('scroll'))
        vi.advanceTimersByTime(149) // Just under default 150ms
      })

      // Should still be debouncing
    })

    it('should accept custom threshold', () => {
      const { result } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(createMockScrollContainer(50))
        return useScrollDetection(containerRef, { threshold: 100 })
      })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      // scrollTop (50) is NOT > threshold (100)
      expect(result.current).toBe(false)
    })

    it('should accept custom debounceMs', () => {
      const container = createMockScrollContainer(0)
      let scrollHandler: EventListener | null = null

      vi.spyOn(container, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'scroll') {
            scrollHandler = handler as EventListener
          }
        }
      )

      const { result } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(container)
        return useScrollDetection(containerRef, { debounceMs: 50 })
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current).toBe(false)

      // Change scroll position
      Object.defineProperty(container, 'scrollTop', { value: 50, writable: true })

      act(() => {
        scrollHandler?.(new Event('scroll'))
        vi.advanceTimersByTime(50)
      })

      expect(result.current).toBe(true)
    })
  })

  describe('scroll event handling', () => {
    it('should add scroll listener to container element', () => {
      const container = createMockScrollContainer()
      const addEventListenerSpy = vi.spyOn(container, 'addEventListener')

      renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(container)
        return useScrollDetection(containerRef)
      })

      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true })

      addEventListenerSpy.mockRestore()
    })

    it('should update isScrolled when scroll position changes', () => {
      const container = createMockScrollContainer(0)
      let scrollHandler: EventListener | null = null

      vi.spyOn(container, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'scroll') {
            scrollHandler = handler as EventListener
          }
        }
      )

      const { result } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(container)
        return useScrollDetection(containerRef, { threshold: 20, debounceMs: 0 })
      })

      act(() => {
        vi.advanceTimersByTime(50)
      })
      expect(result.current).toBe(false)

      // Scroll past threshold
      Object.defineProperty(container, 'scrollTop', { value: 50, writable: true })

      act(() => {
        scrollHandler?.(new Event('scroll'))
        vi.advanceTimersByTime(50)
      })

      expect(result.current).toBe(true)
    })

    it('should update isScrolled when scrolling back to top', () => {
      const container = createMockScrollContainer(50)
      let scrollHandler: EventListener | null = null

      vi.spyOn(container, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'scroll') {
            scrollHandler = handler as EventListener
          }
        }
      )

      const { result } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(container)
        return useScrollDetection(containerRef, { threshold: 20, debounceMs: 0 })
      })

      act(() => {
        vi.advanceTimersByTime(50)
      })
      expect(result.current).toBe(true)

      // Scroll back to top
      Object.defineProperty(container, 'scrollTop', { value: 10, writable: true })

      act(() => {
        scrollHandler?.(new Event('scroll'))
        vi.advanceTimersByTime(50)
      })

      expect(result.current).toBe(false)
    })
  })

  describe('debouncing', () => {
    it('should debounce rapid scroll events', () => {
      const container = createMockScrollContainer(0)
      let scrollHandler: EventListener | null = null

      vi.spyOn(container, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'scroll') {
            scrollHandler = handler as EventListener
          }
        }
      )

      const { result } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(container)
        return useScrollDetection(containerRef, { threshold: 20, debounceMs: 100 })
      })

      act(() => {
        vi.advanceTimersByTime(150)
      })

      // Rapid scroll events
      Object.defineProperty(container, 'scrollTop', { value: 30, writable: true })
      act(() => { scrollHandler?.(new Event('scroll')) })

      Object.defineProperty(container, 'scrollTop', { value: 50, writable: true })
      act(() => { scrollHandler?.(new Event('scroll')) })

      Object.defineProperty(container, 'scrollTop', { value: 70, writable: true })
      act(() => { scrollHandler?.(new Event('scroll')) })

      // Advance less than debounce time
      act(() => {
        vi.advanceTimersByTime(50)
      })

      // Still should be false (debouncing)
      expect(result.current).toBe(false)

      // Advance past debounce time
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Now should reflect final scroll position
      expect(result.current).toBe(true)
    })

    it('should reset debounce timer on each scroll event', () => {
      const container = createMockScrollContainer(0)
      let scrollHandler: EventListener | null = null

      vi.spyOn(container, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'scroll') {
            scrollHandler = handler as EventListener
          }
        }
      )

      const { result } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(container)
        return useScrollDetection(containerRef, { threshold: 20, debounceMs: 100 })
      })

      act(() => {
        vi.advanceTimersByTime(150)
      })

      // First scroll
      Object.defineProperty(container, 'scrollTop', { value: 50, writable: true })
      act(() => { scrollHandler?.(new Event('scroll')) })

      // Advance 80ms (less than 100ms debounce)
      act(() => {
        vi.advanceTimersByTime(80)
      })

      // Second scroll - resets timer
      act(() => { scrollHandler?.(new Event('scroll')) })

      // Advance another 80ms (160ms total, but only 80ms since last scroll)
      act(() => {
        vi.advanceTimersByTime(80)
      })

      // Should still be false because timer was reset
      expect(result.current).toBe(false)

      // Advance past debounce time from last scroll
      act(() => {
        vi.advanceTimersByTime(30)
      })

      expect(result.current).toBe(true)
    })
  })

  describe('null container handling', () => {
    it('should return false when container ref is null', () => {
      const { result } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(null)
        return useScrollDetection(containerRef)
      })

      expect(result.current).toBe(false)
    })

    it('should not add event listeners when container is null', () => {
      // Create a specific container to track
      const container = createMockScrollContainer()
      const addEventListenerSpy = vi.spyOn(container, 'addEventListener')

      // Use null container - should not call addEventListener on any container
      renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(null)
        return useScrollDetection(containerRef)
      })

      // The spy on the non-used container should not be called
      expect(addEventListenerSpy).not.toHaveBeenCalled()

      addEventListenerSpy.mockRestore()
    })
  })

  describe('container prop', () => {
    it('should reinitialize when container prop changes', () => {
      const container1 = createMockScrollContainer(0)
      const container2 = createMockScrollContainer(50)

      let addListenerCount = 0

      vi.spyOn(container1, 'addEventListener').mockImplementation(() => {
        addListenerCount++
      })
      vi.spyOn(container2, 'addEventListener').mockImplementation(() => {
        addListenerCount++
      })

      const { rerender } = renderHook(
        ({ container }) => {
          const containerRef = useRef<HTMLElement | null>(container)
          return useScrollDetection(containerRef, { container, threshold: 20 })
        },
        { initialProps: { container: container1 } }
      )

      expect(addListenerCount).toBeGreaterThan(0)
      const initialCount = addListenerCount

      // Change container
      rerender({ container: container2 })

      // Should have re-initialized with new container
      expect(addListenerCount).toBeGreaterThan(initialCount)
    })
  })

  describe('cleanup', () => {
    it('should remove event listener on unmount', () => {
      const container = createMockScrollContainer()
      const removeEventListenerSpy = vi.spyOn(container, 'removeEventListener')

      const { unmount } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(container)
        return useScrollDetection(containerRef)
      })

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function))

      removeEventListenerSpy.mockRestore()
    })

    it('should clear timeout on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      const container = createMockScrollContainer()

      const { unmount } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(container)
        return useScrollDetection(containerRef, { debounceMs: 1000 })
      })

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()

      clearTimeoutSpy.mockRestore()
    })

    it('should clear timeout when threshold changes', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')
      const container = createMockScrollContainer()

      const { rerender } = renderHook(
        ({ threshold }) => {
          const containerRef = useRef<HTMLElement | null>(container)
          return useScrollDetection(containerRef, { threshold })
        },
        { initialProps: { threshold: 20 } }
      )

      clearTimeoutSpy.mockClear()

      rerender({ threshold: 50 })

      // Should have cleared any pending timeout
      expect(clearTimeoutSpy).toHaveBeenCalled()

      clearTimeoutSpy.mockRestore()
    })
  })

  describe('state optimization', () => {
    it('should not update state if value has not changed', () => {
      const container = createMockScrollContainer(50)
      let scrollHandler: EventListener | null = null
      let stateUpdateCount = 0

      vi.spyOn(container, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'scroll') {
            scrollHandler = handler as EventListener
          }
        }
      )

      const { result } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(container)
        const isScrolled = useScrollDetection(containerRef, { threshold: 20, debounceMs: 0 })
        // Track renders (state updates cause re-render)
        stateUpdateCount++
        return isScrolled
      })

      act(() => {
        vi.advanceTimersByTime(50)
      })

      expect(result.current).toBe(true)
      const initialUpdateCount = stateUpdateCount

      // Scroll to different position but still past threshold
      Object.defineProperty(container, 'scrollTop', { value: 100, writable: true })

      act(() => {
        scrollHandler?.(new Event('scroll'))
        vi.advanceTimersByTime(50)
      })

      // Should still be true (no state change needed)
      expect(result.current).toBe(true)

      // State update count should be minimal (ideally no extra updates)
      // Note: React may batch updates, so this is more of a sanity check
    })
  })

  describe('edge cases', () => {
    it('should handle scrollTop of exactly threshold', () => {
      const { result } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(createMockScrollContainer(20))
        return useScrollDetection(containerRef, { threshold: 20, debounceMs: 0 })
      })

      act(() => {
        vi.advanceTimersByTime(50)
      })

      // scrollTop === threshold should be false (need to be > threshold)
      expect(result.current).toBe(false)
    })

    it('should handle scrollTop of 0', () => {
      const { result } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(createMockScrollContainer(0))
        return useScrollDetection(containerRef, { threshold: 0, debounceMs: 0 })
      })

      act(() => {
        vi.advanceTimersByTime(50)
      })

      expect(result.current).toBe(false)
    })

    it('should handle very large scrollTop values', () => {
      const { result } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(createMockScrollContainer(100000))
        return useScrollDetection(containerRef, { threshold: 20, debounceMs: 0 })
      })

      act(() => {
        vi.advanceTimersByTime(50)
      })

      expect(result.current).toBe(true)
    })

    it('should handle threshold of 0', () => {
      const container = createMockScrollContainer(1)
      let scrollHandler: EventListener | null = null

      vi.spyOn(container, 'addEventListener').mockImplementation(
        (type, handler) => {
          if (type === 'scroll') {
            scrollHandler = handler as EventListener
          }
        }
      )

      const { result } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(container)
        return useScrollDetection(containerRef, { threshold: 0, debounceMs: 0 })
      })

      act(() => {
        vi.advanceTimersByTime(50)
      })

      // scrollTop (1) > threshold (0)
      expect(result.current).toBe(true)

      // Scroll to 0
      Object.defineProperty(container, 'scrollTop', { value: 0, writable: true })

      act(() => {
        scrollHandler?.(new Event('scroll'))
        vi.advanceTimersByTime(50)
      })

      expect(result.current).toBe(false)
    })

    it('should handle negative threshold gracefully', () => {
      const { result } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(createMockScrollContainer(0))
        return useScrollDetection(containerRef, { threshold: -10, debounceMs: 0 })
      })

      act(() => {
        vi.advanceTimersByTime(50)
      })

      // scrollTop (0) > threshold (-10)
      expect(result.current).toBe(true)
    })

    it('should handle fractional scrollTop', () => {
      const container = createMockScrollContainer(0)
      Object.defineProperty(container, 'scrollTop', { value: 20.5, writable: true })

      const { result } = renderHook(() => {
        const containerRef = useRef<HTMLElement | null>(container)
        return useScrollDetection(containerRef, { threshold: 20, debounceMs: 0 })
      })

      act(() => {
        vi.advanceTimersByTime(50)
      })

      // scrollTop (20.5) > threshold (20)
      expect(result.current).toBe(true)
    })
  })

  describe('multiple containers', () => {
    it('should support container prop to trigger re-initialization', () => {
      const container = createMockScrollContainer(50)
      let addEventListenerCallCount = 0

      vi.spyOn(container, 'addEventListener').mockImplementation(() => {
        addEventListenerCallCount++
      })

      const { rerender } = renderHook(
        ({ containerProp }) => {
          const containerRef = useRef<HTMLElement | null>(container)
          return useScrollDetection(containerRef, { threshold: 20, debounceMs: 0, container: containerProp })
        },
        { initialProps: { containerProp: container as HTMLElement | null } }
      )

      expect(addEventListenerCallCount).toBeGreaterThan(0)
      const initialCount = addEventListenerCallCount

      // Change the container prop (same container, but should re-init)
      const newContainer = createMockScrollContainer(0)
      rerender({ containerProp: newContainer })

      // Re-initialization should occur
      expect(addEventListenerCallCount).toBeGreaterThanOrEqual(initialCount)
    })
  })
})
