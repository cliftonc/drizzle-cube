/**
 * Custom hook for responsive dashboard layout management
 * Implements a three-tier responsive strategy:
 * - Desktop (1200px+): Normal grid layout with full editing
 * - Scaled (768-1199px): CSS transform scaling, read-only
 * - Mobile (<768px): Single-column stacked layout, read-only
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

export type DashboardDisplayMode = 'desktop' | 'scaled' | 'mobile'

const DESIGN_WIDTH = 1200
const MOBILE_THRESHOLD = 768

export interface UseResponsiveDashboardResult {
  containerRef: React.RefCallback<HTMLDivElement>
  containerWidth: number
  displayMode: DashboardDisplayMode
  scaleFactor: number
  isEditable: boolean
  designWidth: number
}

/**
 * Hook for managing responsive dashboard layouts
 * Uses ResizeObserver for accurate width detection and calculates
 * the appropriate display mode and scale factor
 */
export function useResponsiveDashboard(): UseResponsiveDashboardResult {
  // Start with window width as initial estimate
  const [containerWidth, setContainerWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : DESIGN_WIDTH
  )
  const observerRef = useRef<ResizeObserver | null>(null)
  const elementRef = useRef<HTMLDivElement | null>(null)

  // Ref callback - called when element is attached/detached
  // This is key: unlike useEffect, this fires immediately when the DOM element exists
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    elementRef.current = node

    if (node) {
      // Get initial width immediately (synchronously when element attaches)
      const initialWidth = node.offsetWidth
      if (initialWidth > 0) {
        setContainerWidth(initialWidth)
      }

      // Set up ResizeObserver for ongoing changes
      observerRef.current = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width
        if (width && width > 0) {
          setContainerWidth(width)
        }
      })
      observerRef.current.observe(node)
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  // Fallback: window resize listener to catch resize events that ResizeObserver might miss
  // This is particularly important for containers in flex/grid layouts or deeply nested elements
  useEffect(() => {
    const handleWindowResize = () => {
      if (elementRef.current) {
        const width = elementRef.current.offsetWidth
        if (width > 0) {
          setContainerWidth(width)
        }
      }
    }

    window.addEventListener('resize', handleWindowResize)

    // Also measure after a short delay to catch late layout calculations
    const timeoutId = setTimeout(handleWindowResize, 100)

    return () => {
      window.removeEventListener('resize', handleWindowResize)
      clearTimeout(timeoutId)
    }
  }, [])

  const displayMode = useMemo<DashboardDisplayMode>(() => {
    if (containerWidth >= DESIGN_WIDTH) return 'desktop'
    if (containerWidth >= MOBILE_THRESHOLD) return 'scaled'
    return 'mobile'
  }, [containerWidth])

  const scaleFactor = useMemo(() => {
    if (displayMode !== 'scaled') return 1
    return containerWidth / DESIGN_WIDTH
  }, [containerWidth, displayMode])

  const isEditable = displayMode === 'desktop'

  return {
    containerRef,
    containerWidth,
    displayMode,
    scaleFactor,
    isEditable,
    designWidth: DESIGN_WIDTH
  }
}
