/**
 * useElementVisibility - Detects when an element scrolls out of view
 *
 * Used to detect when the static edit bar scrolls out of view, triggering
 * the floating toolbar to appear. Works with both viewport and custom
 * scroll containers.
 */

import { useEffect, useState, useRef, type RefObject } from 'react'

interface UseElementVisibilityOptions {
  /** Threshold in pixels - element considered out of view when this much scrolls past top */
  threshold?: number
  /** Debounce delay in milliseconds */
  debounceMs?: number
  /** Custom scroll container ref (uses viewport if not provided) */
  containerRef?: RefObject<HTMLElement | null>
  /** Optional state value to trigger re-initialization when container is found */
  container?: HTMLElement | null
}

/**
 * Hook to detect whether an element is visible in the viewport/container
 *
 * @param elementRef - Ref to the element to track
 * @param options - Configuration options
 * @returns Boolean indicating if the element is visible (true when in view, false when scrolled out)
 *
 * @example
 * const editBarRef = useRef<HTMLDivElement>(null)
 * const isEditBarVisible = useElementVisibility(editBarRef, {
 *   threshold: 80,
 *   containerRef: scrollContainerRef
 * })
 *
 * // Show floating toolbar when edit bar scrolls out of view
 * {!isEditBarVisible && <FloatingToolbar />}
 */
export function useElementVisibility(
  elementRef: RefObject<HTMLElement | null>,
  { threshold = 80, debounceMs = 100, containerRef, container }: UseElementVisibilityOptions = {}
): boolean {
  // Start with visible=true to prevent flash on initial render
  const [isVisible, setIsVisible] = useState(true)
  const timeoutRef = useRef<number>()
  // Track if we've ever seen the element visible (prevents animation on load)
  const hasBeenVisibleRef = useRef(false)

  useEffect(() => {
    const container = containerRef?.current

    const checkVisibility = () => {
      const element = elementRef.current
      // If element not yet mounted, stay visible (don't show floating toolbar)
      if (!element) return

      // Clear existing timeout for debouncing
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = window.setTimeout(() => {
        const elementRect = element.getBoundingClientRect()

        if (container) {
          // Check against scroll container
          const containerRect = container.getBoundingClientRect()
          // Element is "visible" when its bottom is below the container's top by at least threshold
          const visible = elementRect.bottom > containerRect.top + threshold

          // Track that we've seen the element visible at least once
          if (visible) {
            hasBeenVisibleRef.current = true
          }

          // Only update state if value changed
          setIsVisible(prev => prev !== visible ? visible : prev)
        } else {
          // Check against viewport (window)
          // Element is "visible" when its bottom is in the viewport (plus threshold buffer)
          const visible = elementRect.bottom > threshold

          // Track that we've seen the element visible at least once
          if (visible) {
            hasBeenVisibleRef.current = true
          }

          // Only update state if value changed
          setIsVisible(prev => prev !== visible ? visible : prev)
        }
      }, debounceMs)
    }

    // Attach scroll listener to container or window
    const scrollTarget = container || window
    scrollTarget.addEventListener('scroll', checkVisibility, { passive: true })

    // Also listen for resize events
    window.addEventListener('resize', checkVisibility, { passive: true })

    // Initial check
    checkVisibility()

    // Deferred re-check after React render cycle completes
    // This handles the case where elementRef.current isn't set yet on first render
    const rafId = requestAnimationFrame(() => {
      checkVisibility()
    })

    // Cleanup
    return () => {
      scrollTarget.removeEventListener('scroll', checkVisibility)
      window.removeEventListener('resize', checkVisibility)
      cancelAnimationFrame(rafId)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [elementRef, containerRef, threshold, debounceMs, container])

  return isVisible
}
