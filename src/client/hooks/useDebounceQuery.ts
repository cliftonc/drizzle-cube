/**
 * useDebounceQuery - Shared debounce logic for query hooks
 *
 * This hook encapsulates the common debouncing pattern used by
 * useCubeLoadQuery and useMultiCubeLoadQuery to prevent excessive API calls
 * when users are actively editing queries.
 *
 * Features:
 * - Debounces value changes with configurable delay
 * - Handles skip-to-unskip transitions (e.g., portlet becoming visible)
 * - Clears debounced value when invalid or skipped
 * - Provides isDebouncing state for UI feedback
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import { stableStringify } from '../shared/queryKey'

export interface UseDebounceQueryOptions {
  /**
   * Whether the value is valid (has required fields)
   */
  isValid: boolean
  /**
   * Whether to skip the debounced value
   * @default false
   */
  skip?: boolean
  /**
   * Debounce delay in milliseconds
   * @default 300
   */
  debounceMs?: number
}

export interface UseDebounceQueryResult<T> {
  /** The debounced value (null if skipped or invalid) */
  debouncedValue: T | null
  /** Whether the hook is currently debouncing (waiting for timer) */
  isDebouncing: boolean
}

/**
 * Hook for debouncing query values with skip and validity support
 *
 * Usage:
 * ```tsx
 * const { debouncedValue, isDebouncing } = useDebounceQuery(query, {
 *   isValid: isValidCubeQuery(query),
 *   skip: !isReady,
 *   debounceMs: 300
 * })
 * ```
 */
export function useDebounceQuery<T>(
  value: T | null,
  options: UseDebounceQueryOptions
): UseDebounceQueryResult<T> {
  const { isValid, skip = false, debounceMs = 300 } = options

  // Debounced state
  const [debouncedValue, setDebouncedValue] = useState<T | null>(null)
  const [isDebouncing, setIsDebouncing] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastValueStringRef = useRef<string>('')
  const wasSkippedRef = useRef<boolean>(skip)

  // Serialize value for comparison
  const valueString = useMemo(() => {
    if (!value) return ''
    return stableStringify(value)
  }, [value])

  // Debounce the value changes
  useEffect(() => {
    // Detect skip-to-unskip transition (e.g., portlet becoming visible)
    const wasSkipped = wasSkippedRef.current
    const justBecameUnskipped = wasSkipped && !skip
    wasSkippedRef.current = skip

    // Skip if value hasn't actually changed AND we haven't just become unskipped
    // The justBecameUnskipped check ensures we re-trigger when visibility changes
    if (valueString === lastValueStringRef.current && !justBecameUnskipped) {
      return
    }

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // If value is valid, set debouncing state and schedule update
    if (isValid && !skip) {
      setIsDebouncing(true)
      debounceTimerRef.current = setTimeout(() => {
        lastValueStringRef.current = valueString
        setDebouncedValue(value)
        setIsDebouncing(false)
      }, debounceMs)
    } else {
      // Clear debounced value if invalid or skipped
      lastValueStringRef.current = valueString
      setDebouncedValue(null)
      setIsDebouncing(false)
    }

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [valueString, isValid, skip, debounceMs, value])

  return {
    debouncedValue,
    isDebouncing,
  }
}
