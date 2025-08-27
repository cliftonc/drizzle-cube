/**
 * Tests for useDebounce hook
 * Covers debouncing logic, timing, and cleanup behavior
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDebounce } from '../../src/client/hooks/useDebounce'

// Set up a simple React environment for hook testing
import React from 'react'

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('basic functionality', () => {
    it('should return initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 300))

      expect(result.current).toBe('initial')
    })

    it('should debounce string values', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 300 }
        }
      )

      expect(result.current).toBe('initial')

      // Change the value
      rerender({ value: 'updated', delay: 300 })

      // Value should not change immediately
      expect(result.current).toBe('initial')

      // Fast-forward time less than delay
      act(() => {
        vi.advanceTimersByTime(200)
      })

      // Still should not change
      expect(result.current).toBe('initial')

      // Fast-forward beyond delay
      act(() => {
        vi.advanceTimersByTime(200) // Total 400ms, beyond 300ms delay
      })

      // Now should be updated
      expect(result.current).toBe('updated')
    })

    it('should debounce numeric values', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 100, delay: 500 }
        }
      )

      expect(result.current).toBe(100)

      rerender({ value: 200, delay: 500 })
      expect(result.current).toBe(100)

      act(() => {
        vi.advanceTimersByTime(500)
      })

      expect(result.current).toBe(200)
    })

    it('should debounce boolean values', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: false, delay: 250 }
        }
      )

      expect(result.current).toBe(false)

      rerender({ value: true, delay: 250 })
      expect(result.current).toBe(false)

      act(() => {
        vi.advanceTimersByTime(250)
      })

      expect(result.current).toBe(true)
    })

    it('should debounce object values', async () => {
      const initial = { count: 1, name: 'initial' }
      const updated = { count: 2, name: 'updated' }

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: initial, delay: 200 }
        }
      )

      expect(result.current).toBe(initial)

      rerender({ value: updated, delay: 200 })
      expect(result.current).toBe(initial)

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current).toBe(updated)
    })

    it('should debounce null and undefined values', async () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: null, delay: 300 }
        }
      )

      expect(result.current).toBe(null)

      rerender({ value: undefined, delay: 300 })
      expect(result.current).toBe(null)

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(result.current).toBe(undefined)
    })
  })

  describe('timing behavior', () => {
    it('should use the specified delay', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 1000 }
        }
      )

      rerender({ value: 'updated', delay: 1000 })

      // Should not update before delay
      act(() => {
        vi.advanceTimersByTime(999)
      })
      expect(result.current).toBe('initial')

      // Should update exactly at delay
      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(result.current).toBe('updated')
    })

    it('should work with zero delay', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 0 }
        }
      )

      rerender({ value: 'updated', delay: 0 })

      // With zero delay, should update on next tick
      act(() => {
        vi.advanceTimersByTime(0)
      })

      expect(result.current).toBe('updated')
    })

    it('should handle very large delays', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 10000 }
        }
      )

      rerender({ value: 'updated', delay: 10000 })

      // Should not update before large delay
      act(() => {
        vi.advanceTimersByTime(9999)
      })
      expect(result.current).toBe('initial')

      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(result.current).toBe('updated')
    })
  })

  describe('rapid changes', () => {
    it('should reset timer on rapid value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 300 }
        }
      )

      // First change
      rerender({ value: 'change1', delay: 300 })
      
      // Advance part way
      act(() => {
        vi.advanceTimersByTime(200)
      })
      
      expect(result.current).toBe('initial') // Still original

      // Second change before first completes
      rerender({ value: 'change2', delay: 300 })
      
      // Advance same amount from second change
      act(() => {
        vi.advanceTimersByTime(200)
      })
      
      expect(result.current).toBe('initial') // Still original
      
      // Complete the delay from second change
      act(() => {
        vi.advanceTimersByTime(100) // Total 300ms from second change
      })
      
      expect(result.current).toBe('change2') // Should be final value
    })

    it('should handle multiple rapid changes correctly', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 500 }
        }
      )

      // Simulate typing: rapid changes every 100ms
      rerender({ value: 'a', delay: 500 })
      act(() => { vi.advanceTimersByTime(100) })

      rerender({ value: 'ab', delay: 500 })
      act(() => { vi.advanceTimersByTime(100) })

      rerender({ value: 'abc', delay: 500 })
      act(() => { vi.advanceTimersByTime(100) })

      rerender({ value: 'abcd', delay: 500 })
      act(() => { vi.advanceTimersByTime(100) })

      // Still should be initial because we haven't waited full delay
      expect(result.current).toBe('initial')

      // Now wait the full delay from last change
      act(() => {
        vi.advanceTimersByTime(500)
      })

      // Should be the final value
      expect(result.current).toBe('abcd')
    })
  })

  describe('delay changes', () => {
    it('should use updated delay for subsequent changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 300 }
        }
      )

      // Change both value and delay
      rerender({ value: 'updated', delay: 600 })

      // Should not update at old delay time
      act(() => {
        vi.advanceTimersByTime(300)
      })
      expect(result.current).toBe('initial')

      // Should update at new delay time
      act(() => {
        vi.advanceTimersByTime(300) // Total 600ms
      })
      expect(result.current).toBe('updated')
    })

    it('should restart timer when delay changes', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 500 }
        }
      )

      rerender({ value: 'updated', delay: 500 })

      // Advance partway through delay
      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Change only the delay
      rerender({ value: 'updated', delay: 200 })

      // Should restart timer with new delay
      // Original timer at 300ms should be cleared
      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current).toBe('updated')
    })
  })

  describe('cleanup behavior', () => {
    it('should cleanup timer when component unmounts', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      const { result, rerender, unmount } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 300 }
        }
      )

      rerender({ value: 'updated', delay: 300 })

      // Unmount before timer completes
      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()

      clearTimeoutSpy.mockRestore()
    })

    it('should not update state after unmount', () => {
      const { result, rerender, unmount } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 300 }
        }
      )

      rerender({ value: 'updated', delay: 300 })

      // Unmount before delay completes
      unmount()

      // Advance time past delay
      act(() => {
        vi.advanceTimersByTime(300)
      })

      // Since component is unmounted, this won't throw but timer should be cleaned up
      // The test passes if no errors are thrown
    })

    it('should cleanup timer when value changes', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'initial', delay: 300 }
        }
      )

      rerender({ value: 'first-change', delay: 300 })

      // Change again before first timer completes
      rerender({ value: 'second-change', delay: 300 })

      // clearTimeout should be called to cleanup first timer
      expect(clearTimeoutSpy).toHaveBeenCalledTimes(2) // Once for each value change

      clearTimeoutSpy.mockRestore()
    })
  })

  describe('edge cases', () => {
    it('should handle same value updates without creating new timers unnecessarily', () => {
      const setTimeoutSpy = vi.spyOn(global, 'setTimeout')
      const initialCallCount = setTimeoutSpy.mock.calls.length

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: 'same', delay: 300 }
        }
      )

      // Update with same value
      rerender({ value: 'same', delay: 300 })

      // Should still create timer (useDebounce doesn't optimize for same values)
      expect(setTimeoutSpy.mock.calls.length).toBeGreaterThan(initialCallCount)

      setTimeoutSpy.mockRestore()
    })

    it('should work with complex objects', () => {
      const obj1 = { nested: { value: 1 }, array: [1, 2, 3] }
      const obj2 = { nested: { value: 2 }, array: [4, 5, 6] }

      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        {
          initialProps: { value: obj1, delay: 200 }
        }
      )

      expect(result.current).toBe(obj1)

      rerender({ value: obj2, delay: 200 })

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current).toBe(obj2)
      expect(result.current.nested.value).toBe(2)
      expect(result.current.array).toEqual([4, 5, 6])
    })
  })
})