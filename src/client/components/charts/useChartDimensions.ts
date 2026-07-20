import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

interface ChartDimensions {
  containerRef: RefObject<HTMLDivElement | null>
  dimensions: { width: number; height: number }
  dimensionsReady: boolean
}

/**
 * Shared container-measurement hook for the D3/SVG charts (BubbleChart,
 * ActivityGridChart).
 *
 * Performs an initial measurement with a requestAnimationFrame + setTimeout
 * retry ladder (handles containers that aren't laid out yet), then keeps the
 * dimensions in sync via a ResizeObserver and window resize. Mirrors the
 * original per-component effects exactly.
 */
export function useChartDimensions(): ChartDimensions {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [dimensionsReady, setDimensionsReady] = useState(false)

  // Initial measurement with retry ladder.
  useLayoutEffect(() => {
    let retryCount = 0
    const maxRetries = 10
    let rafId: number
    let timeoutId: ReturnType<typeof setTimeout>

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
          setDimensionsReady(true)
          return true
        }
      }
      return false
    }

    const success = updateDimensions()

    if (!success && retryCount < maxRetries) {
      const retryWithRaf = () => {
        const rafSuccess = updateDimensions()
        if (!rafSuccess && retryCount < maxRetries) {
          retryCount++
          timeoutId = setTimeout(() => {
            rafId = requestAnimationFrame(retryWithRaf)
          }, 50 * retryCount)
        }
      }
      rafId = requestAnimationFrame(retryWithRaf)
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  // ResizeObserver for dynamic resizing.
  useEffect(() => {
    let resizeObserver: ResizeObserver | null = null

    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        if (width > 0 && height > 0) {
          setDimensions({ width, height })
          setDimensionsReady((ready) => ready || true)
        }
      }
    }

    if (containerRef.current) {
      resizeObserver = new ResizeObserver(() => updateDimensions())
      resizeObserver.observe(containerRef.current)
      updateDimensions()
    }

    window.addEventListener('resize', updateDimensions)

    return () => {
      if (resizeObserver) resizeObserver.disconnect()
      window.removeEventListener('resize', updateDimensions)
    }
  }, [])

  return { containerRef, dimensions, dimensionsReady }
}
