/**
 * Custom hook for debouncing values
 * Delays updating the value until after the specified delay has passed
 * since the last change
 */

import { useState, useEffect } from 'react'

/**
 * Debounces a value by the specified delay
 * @param value The value to debounce
 * @param delay The delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clean up the timer if the value changes before the delay
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}