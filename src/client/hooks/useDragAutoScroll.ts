import { useEffect, useRef, useCallback, type RefObject } from 'react'

interface UseDragAutoScrollOptions {
  /** Distance from edge that triggers scrolling (default: 80px) */
  edgeThreshold?: number
  /** Maximum scroll speed in pixels per frame (default: 15) */
  maxScrollSpeed?: number
  /** Whether auto-scroll is currently enabled */
  enabled?: boolean
}

/**
 * Hook to enable auto-scrolling when dragging near the edges of a scroll container.
 * Works with HTML5 native drag-and-drop API by listening to dragover events.
 *
 * @param scrollContainerRef - Ref to the scrollable container element
 * @param options - Configuration options
 */
export function useDragAutoScroll(
  scrollContainerRef: RefObject<HTMLElement | null>,
  options: UseDragAutoScrollOptions = {}
) {
  const {
    edgeThreshold = 80,
    maxScrollSpeed = 15,
    enabled = true
  } = options

  const animationFrameRef = useRef<number | null>(null)
  const scrollDirectionRef = useRef<'up' | 'down' | null>(null)
  const scrollIntensityRef = useRef<number>(0)

  // Calculate scroll speed based on proximity to edge
  const calculateScrollSpeed = useCallback((distanceFromEdge: number): number => {
    // Closer to edge = faster scrolling (exponential curve for smoother feel)
    const normalizedDistance = Math.max(0, Math.min(1, 1 - distanceFromEdge / edgeThreshold))
    return Math.round(normalizedDistance * normalizedDistance * maxScrollSpeed)
  }, [edgeThreshold, maxScrollSpeed])

  // Animation frame loop for smooth scrolling
  const scrollLoop = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container || !scrollDirectionRef.current) {
      animationFrameRef.current = null
      return
    }

    const speed = scrollIntensityRef.current
    if (speed > 0) {
      const scrollAmount = scrollDirectionRef.current === 'up' ? -speed : speed
      container.scrollTop += scrollAmount
    }

    // Continue the loop while dragging
    animationFrameRef.current = requestAnimationFrame(scrollLoop)
  }, [scrollContainerRef])

  // Start the scroll animation
  const startScrolling = useCallback((direction: 'up' | 'down', intensity: number) => {
    scrollDirectionRef.current = direction
    scrollIntensityRef.current = intensity

    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(scrollLoop)
    }
  }, [scrollLoop])

  // Stop the scroll animation
  const stopScrolling = useCallback(() => {
    scrollDirectionRef.current = null
    scrollIntensityRef.current = 0

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  // Handle dragover events
  const handleDragOver = useCallback((event: DragEvent) => {
    const container = scrollContainerRef.current
    if (!container) return

    // Get container bounds
    const containerRect = container.getBoundingClientRect()
    const mouseY = event.clientY

    // Check if mouse is within the container's horizontal bounds
    if (event.clientX < containerRect.left || event.clientX > containerRect.right) {
      stopScrolling()
      return
    }

    // Calculate distance from edges
    const distanceFromTop = mouseY - containerRect.top
    const distanceFromBottom = containerRect.bottom - mouseY

    // Check if we should scroll
    if (distanceFromTop < edgeThreshold && container.scrollTop > 0) {
      // Near top edge - scroll up
      const speed = calculateScrollSpeed(distanceFromTop)
      startScrolling('up', speed)
    } else if (distanceFromBottom < edgeThreshold && container.scrollTop < container.scrollHeight - container.clientHeight) {
      // Near bottom edge - scroll down
      const speed = calculateScrollSpeed(distanceFromBottom)
      startScrolling('down', speed)
    } else {
      // Not near any edge - stop scrolling
      stopScrolling()
    }
  }, [scrollContainerRef, edgeThreshold, calculateScrollSpeed, startScrolling, stopScrolling])

  // Handle drag end - stop all scrolling
  const handleDragEnd = useCallback(() => {
    stopScrolling()
  }, [stopScrolling])

  // Setup event listeners
  useEffect(() => {
    if (!enabled) {
      stopScrolling()
      return
    }

    // Use capture phase to catch drag events before they're handled by other elements
    document.addEventListener('dragover', handleDragOver, { capture: true })
    document.addEventListener('dragend', handleDragEnd)
    document.addEventListener('drop', handleDragEnd)

    return () => {
      document.removeEventListener('dragover', handleDragOver, { capture: true })
      document.removeEventListener('dragend', handleDragEnd)
      document.removeEventListener('drop', handleDragEnd)
      stopScrolling()
    }
  }, [enabled, handleDragOver, handleDragEnd, stopScrolling])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])
}
