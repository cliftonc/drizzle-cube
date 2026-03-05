/**
 * Container-width-based layout mode hook for AgenticNotebook.
 * Uses ResizeObserver + RefCallback + window resize fallback
 * following the useResponsiveDashboard pattern.
 */

import { useState, useEffect, useRef, useCallback, type RefCallback } from 'react'

export type NotebookLayoutMode = 'wide' | 'narrow'

const NARROW_THRESHOLD = 768

export interface UseNotebookLayoutResult {
  containerRef: RefCallback<HTMLDivElement>
  layoutMode: NotebookLayoutMode
  containerWidth: number
}

export function useNotebookLayout(): UseNotebookLayoutResult {
  const [containerWidth, setContainerWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : NARROW_THRESHOLD + 1
  )
  const observerRef = useRef<ResizeObserver | null>(null)
  const elementRef = useRef<HTMLDivElement | null>(null)

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    elementRef.current = node

    if (node) {
      const initialWidth = node.offsetWidth
      if (initialWidth > 0) {
        setContainerWidth(initialWidth)
      }

      observerRef.current = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width
        if (width && width > 0) {
          setContainerWidth(width)
        }
      })
      observerRef.current.observe(node)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

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
    const timeoutId = setTimeout(handleWindowResize, 100)

    return () => {
      window.removeEventListener('resize', handleWindowResize)
      clearTimeout(timeoutId)
    }
  }, [])

  const layoutMode: NotebookLayoutMode = containerWidth >= NARROW_THRESHOLD ? 'wide' : 'narrow'

  return { containerRef, layoutMode, containerWidth }
}
