/**
 * Tests for useDebounceQuery hook
 * Covers debouncing logic, skip/validity handling, and timing behavior
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useDebounceQuery } from '../../../../src/client/hooks/useDebounceQuery'

describe('useDebounceQuery', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('should return null debounced value initially', () => {
      const { result } = renderHook(() =>
        useDebounceQuery({ query: 'test' }, { isValid: true })
      )

      // Initially null because debounce timer hasn't fired yet
      expect(result.current.debouncedValue).toBeNull()
      expect(result.current.isDebouncing).toBe(true)
    })

    it('should use default debounceMs of 300', () => {
      const { result } = renderHook(() =>
        useDebounceQuery({ query: 'test' }, { isValid: true })
      )

      // Advance less than default 300ms
      act(() => {
        vi.advanceTimersByTime(299)
      })
      expect(result.current.debouncedValue).toBeNull()
      expect(result.current.isDebouncing).toBe(true)

      // Advance past 300ms
      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(result.current.debouncedValue).toEqual({ query: 'test' })
      expect(result.current.isDebouncing).toBe(false)
    })

    it('should accept custom debounceMs', () => {
      const { result } = renderHook(() =>
        useDebounceQuery({ query: 'test' }, { isValid: true, debounceMs: 500 })
      )

      act(() => {
        vi.advanceTimersByTime(499)
      })
      expect(result.current.debouncedValue).toBeNull()

      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(result.current.debouncedValue).toEqual({ query: 'test' })
    })
  })

  describe('validity handling', () => {
    it('should clear debounced value when isValid is false', () => {
      const { result, rerender } = renderHook(
        ({ value, options }) => useDebounceQuery(value, options),
        {
          initialProps: {
            value: { query: 'test' },
            options: { isValid: true, debounceMs: 100 }
          }
        }
      )

      // Wait for debounce to complete
      act(() => {
        vi.advanceTimersByTime(100)
      })
      expect(result.current.debouncedValue).toEqual({ query: 'test' })

      // Change to invalid
      rerender({
        value: { query: 'invalid' },
        options: { isValid: false, debounceMs: 100 }
      })

      // Should immediately clear
      expect(result.current.debouncedValue).toBeNull()
      expect(result.current.isDebouncing).toBe(false)
    })

    it('should not set debounced value when invalid from start', () => {
      const { result } = renderHook(() =>
        useDebounceQuery({ query: 'test' }, { isValid: false, debounceMs: 100 })
      )

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current.debouncedValue).toBeNull()
      expect(result.current.isDebouncing).toBe(false)
    })

    it('should start debouncing when valid changes from false to true with value change', () => {
      const { result, rerender } = renderHook(
        ({ value, options }) => useDebounceQuery(value, options),
        {
          initialProps: {
            value: { query: 'test' },
            options: { isValid: false, debounceMs: 100 }
          }
        }
      )

      expect(result.current.debouncedValue).toBeNull()
      expect(result.current.isDebouncing).toBe(false)

      // Change to valid with a different value (triggers the effect)
      rerender({
        value: { query: 'test2' },
        options: { isValid: true, debounceMs: 100 }
      })

      expect(result.current.isDebouncing).toBe(true)

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.debouncedValue).toEqual({ query: 'test2' })
      expect(result.current.isDebouncing).toBe(false)
    })
  })

  describe('skip handling', () => {
    it('should clear debounced value when skip is true with value change', () => {
      const { result, rerender } = renderHook(
        ({ value, options }) => useDebounceQuery(value, options),
        {
          initialProps: {
            value: { query: 'test' },
            options: { isValid: true, skip: false, debounceMs: 100 }
          }
        }
      )

      act(() => {
        vi.advanceTimersByTime(100)
      })
      expect(result.current.debouncedValue).toEqual({ query: 'test' })

      // Set skip to true with a value change (triggers the effect)
      rerender({
        value: { query: 'test2' },
        options: { isValid: true, skip: true, debounceMs: 100 }
      })

      expect(result.current.debouncedValue).toBeNull()
      expect(result.current.isDebouncing).toBe(false)
    })

    it('should not debounce when skip is true from start', () => {
      const { result } = renderHook(() =>
        useDebounceQuery({ query: 'test' }, { isValid: true, skip: true, debounceMs: 100 })
      )

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current.debouncedValue).toBeNull()
      expect(result.current.isDebouncing).toBe(false)
    })

    it('should handle skip-to-unskip transition (portlet visibility)', () => {
      const { result, rerender } = renderHook(
        ({ value, options }) => useDebounceQuery(value, options),
        {
          initialProps: {
            value: { query: 'test' },
            options: { isValid: true, skip: true, debounceMs: 100 }
          }
        }
      )

      expect(result.current.debouncedValue).toBeNull()

      // Transition from skip=true to skip=false (e.g., portlet becomes visible)
      rerender({
        value: { query: 'test' },
        options: { isValid: true, skip: false, debounceMs: 100 }
      })

      expect(result.current.isDebouncing).toBe(true)

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.debouncedValue).toEqual({ query: 'test' })
    })
  })

  describe('value changes', () => {
    it('should debounce value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, options }) => useDebounceQuery(value, options),
        {
          initialProps: {
            value: { query: 'initial' },
            options: { isValid: true, debounceMs: 200 }
          }
        }
      )

      act(() => {
        vi.advanceTimersByTime(200)
      })
      expect(result.current.debouncedValue).toEqual({ query: 'initial' })

      // Change value
      rerender({
        value: { query: 'updated' },
        options: { isValid: true, debounceMs: 200 }
      })

      // Should be debouncing again
      expect(result.current.isDebouncing).toBe(true)

      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current.debouncedValue).toEqual({ query: 'updated' })
    })

    it('should reset timer on rapid value changes', () => {
      const { result, rerender } = renderHook(
        ({ value, options }) => useDebounceQuery(value, options),
        {
          initialProps: {
            value: { query: 'initial' },
            options: { isValid: true, debounceMs: 200 }
          }
        }
      )

      act(() => {
        vi.advanceTimersByTime(200)
      })

      // Rapid changes
      rerender({ value: { query: 'change1' }, options: { isValid: true, debounceMs: 200 } })
      act(() => { vi.advanceTimersByTime(100) })

      rerender({ value: { query: 'change2' }, options: { isValid: true, debounceMs: 200 } })
      act(() => { vi.advanceTimersByTime(100) })

      rerender({ value: { query: 'change3' }, options: { isValid: true, debounceMs: 200 } })
      act(() => { vi.advanceTimersByTime(100) })

      // Still should be initial value (timer keeps resetting)
      expect(result.current.debouncedValue).toEqual({ query: 'initial' })
      expect(result.current.isDebouncing).toBe(true)

      // Wait full debounce time from last change
      act(() => {
        vi.advanceTimersByTime(200)
      })

      expect(result.current.debouncedValue).toEqual({ query: 'change3' })
    })

    it('should not trigger debounce when value has not changed', () => {
      const { result, rerender } = renderHook(
        ({ value, options }) => useDebounceQuery(value, options),
        {
          initialProps: {
            value: { query: 'same' },
            options: { isValid: true, debounceMs: 100 }
          }
        }
      )

      act(() => {
        vi.advanceTimersByTime(100)
      })
      expect(result.current.debouncedValue).toEqual({ query: 'same' })
      expect(result.current.isDebouncing).toBe(false)

      // Rerender with same value
      rerender({
        value: { query: 'same' },
        options: { isValid: true, debounceMs: 100 }
      })

      // Should still not be debouncing since value is the same
      expect(result.current.isDebouncing).toBe(false)
    })
  })

  describe('null value handling', () => {
    it('should handle null value input', () => {
      const { result } = renderHook(() =>
        useDebounceQuery(null, { isValid: false, debounceMs: 100 })
      )

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.debouncedValue).toBeNull()
      expect(result.current.isDebouncing).toBe(false)
    })

    it('should transition from null to valid value', () => {
      const { result, rerender } = renderHook(
        ({ value, options }) => useDebounceQuery(value, options),
        {
          initialProps: {
            value: null as { query: string } | null,
            options: { isValid: false, debounceMs: 100 }
          }
        }
      )

      expect(result.current.debouncedValue).toBeNull()

      rerender({
        value: { query: 'now valid' },
        options: { isValid: true, debounceMs: 100 }
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.debouncedValue).toEqual({ query: 'now valid' })
    })
  })

  describe('cleanup', () => {
    it('should cleanup timer on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      const { unmount } = renderHook(() =>
        useDebounceQuery({ query: 'test' }, { isValid: true, debounceMs: 1000 })
      )

      // Unmount before timer fires
      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })

    it('should cleanup timer when value changes', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      const { rerender } = renderHook(
        ({ value, options }) => useDebounceQuery(value, options),
        {
          initialProps: {
            value: { query: 'initial' },
            options: { isValid: true, debounceMs: 200 }
          }
        }
      )

      rerender({
        value: { query: 'updated' },
        options: { isValid: true, debounceMs: 200 }
      })

      expect(clearTimeoutSpy).toHaveBeenCalled()
      clearTimeoutSpy.mockRestore()
    })
  })

  describe('debounceMs edge cases', () => {
    it('should handle zero debounceMs', () => {
      const { result } = renderHook(() =>
        useDebounceQuery({ query: 'test' }, { isValid: true, debounceMs: 0 })
      )

      // With 0 delay, should update on next tick
      act(() => {
        vi.advanceTimersByTime(0)
      })

      expect(result.current.debouncedValue).toEqual({ query: 'test' })
      expect(result.current.isDebouncing).toBe(false)
    })

    it('should handle very long debounceMs', () => {
      const { result } = renderHook(() =>
        useDebounceQuery({ query: 'test' }, { isValid: true, debounceMs: 10000 })
      )

      act(() => {
        vi.advanceTimersByTime(9999)
      })
      expect(result.current.debouncedValue).toBeNull()
      expect(result.current.isDebouncing).toBe(true)

      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(result.current.debouncedValue).toEqual({ query: 'test' })
    })
  })

  describe('combined state changes', () => {
    it('should handle isValid and skip both changing', () => {
      const { result, rerender } = renderHook(
        ({ value, options }) => useDebounceQuery(value, options),
        {
          initialProps: {
            value: { query: 'test' },
            options: { isValid: false, skip: true, debounceMs: 100 }
          }
        }
      )

      expect(result.current.debouncedValue).toBeNull()

      // Both become true/false
      rerender({
        value: { query: 'test2' },
        options: { isValid: true, skip: false, debounceMs: 100 }
      })

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.debouncedValue).toEqual({ query: 'test2' })
    })
  })

  describe('complex object serialization', () => {
    it('should correctly compare complex objects', () => {
      const complexObj1 = {
        measures: ['Employees.count'],
        dimensions: ['Departments.name'],
        filters: [{ member: 'Employees.active', operator: 'equals', values: [true] }]
      }
      const complexObj2 = {
        measures: ['Employees.count'],
        dimensions: ['Departments.name'],
        filters: [{ member: 'Employees.active', operator: 'equals', values: [true] }]
      }

      const { result, rerender } = renderHook(
        ({ value, options }) => useDebounceQuery(value, options),
        {
          initialProps: {
            value: complexObj1,
            options: { isValid: true, debounceMs: 100 }
          }
        }
      )

      act(() => {
        vi.advanceTimersByTime(100)
      })
      expect(result.current.debouncedValue).toEqual(complexObj1)

      // Rerender with equivalent but different reference object
      rerender({
        value: complexObj2,
        options: { isValid: true, debounceMs: 100 }
      })

      // Should not trigger new debounce since values are equivalent
      expect(result.current.isDebouncing).toBe(false)
    })

    it('should detect changes in nested objects', () => {
      const { result, rerender } = renderHook(
        ({ value, options }) => useDebounceQuery(value, options),
        {
          initialProps: {
            value: { nested: { count: 1 }, array: [1, 2, 3] },
            options: { isValid: true, debounceMs: 100 }
          }
        }
      )

      act(() => {
        vi.advanceTimersByTime(100)
      })

      rerender({
        value: { nested: { count: 2 }, array: [1, 2, 3] },
        options: { isValid: true, debounceMs: 100 }
      })

      expect(result.current.isDebouncing).toBe(true)

      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.debouncedValue).toEqual({ nested: { count: 2 }, array: [1, 2, 3] })
    })
  })
})
