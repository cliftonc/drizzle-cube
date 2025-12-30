/**
 * useScrollDetection - Debounced Scroll Detection Hook
 *
 * Detects when a container has been scrolled past a threshold with debouncing
 * to prevent excessive state updates.
 *
 * This fixes the issue where scroll detection was listening to window.pageYOffset
 * instead of the actual scroll container (overflow-y-auto div in Layout).
 */

import { useEffect, useState, useRef, type RefObject } from 'react'

interface UseScrollDetectionOptions {
  /** Scroll threshold in pixels (default: 20) */
  threshold?: number
  /** Debounce delay in milliseconds (default: 150) */
  debounceMs?: number
}

/**
 * Hook to detect scroll position in a container
 *
 * @param containerRef - Ref to the scrollable container element
 * @param options - Configuration options for threshold and debounce
 * @returns Boolean indicating if scrolled past threshold
 *
 * @example
 * const scrollContainerRef = useRef<HTMLDivElement>(null)
 * const isScrolled = useScrollDetection(scrollContainerRef, {
 *   threshold: 20,
 *   debounceMs: 150
 * })
 *
 * <div ref={scrollContainerRef} className="overflow-y-auto">
 *   {isScrolled && <div>Shadow visible</div>}
 * </div>
 */
export function useScrollDetection(
  containerRef: RefObject<HTMLElement>,
  { threshold = 20, debounceMs = 150 }: UseScrollDetectionOptions = {}
) {
  const [isScrolled, setIsScrolled] = useState(false)
  const timeoutRef = useRef<number>()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Debounce scroll updates
      timeoutRef.current = window.setTimeout(() => {
        const scrollTop = container.scrollTop
        const shouldBeScrolled = scrollTop > threshold

        // Only update state if value actually changed
        setIsScrolled(prev => prev !== shouldBeScrolled ? shouldBeScrolled : prev)
      }, debounceMs)
    }

    // Attach scroll listener to actual container (not window!)
    container.addEventListener('scroll', handleScroll, { passive: true })

    // Initial check
    handleScroll()

    // Cleanup
    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [threshold, debounceMs])

  return isScrolled
}
