import { useState, useRef, useEffect, type RefObject } from 'react'

interface KpiDimensionOptions {
  /** Container divisor for the width-based font size candidate. */
  widthDivisor: number
  /** Container divisor for the height-based font size candidate. */
  heightDivisor: number
  /** Minimum clamped font size. */
  minFontSize: number
  /** Maximum clamped font size. */
  maxFontSize: number
  /** Computes the measured-text width from the value element's box + container width. */
  measureWidth: (measuredWidth: number, containerWidth: number) => number
  /** Re-run measurement whenever any of these change. */
  deps: unknown[]
}

interface KpiDimensions {
  containerRef: RefObject<HTMLDivElement | null>
  valueRef: RefObject<HTMLDivElement | null>
  fontSize: number
  textWidth: number
}

/**
 * Shared container-measurement hook for KPI cards (KpiNumber / KpiDelta).
 *
 * Measures the container to derive a responsive font size, then (after the font
 * is applied) measures the rendered value element to size the histogram. Mirrors
 * the original per-component effects exactly — only the tunable constants differ.
 */
export function useKpiDimensions({
  widthDivisor,
  heightDivisor,
  minFontSize,
  maxFontSize,
  measureWidth,
  deps
}: KpiDimensionOptions): KpiDimensions {
  const [fontSize, setFontSize] = useState(32)
  const [textWidth, setTextWidth] = useState(250)
  const containerRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const containerWidth = rect.width
      const containerHeight = rect.height
      if (containerWidth <= 0 || containerHeight <= 0) return

      const widthBasedSize = containerWidth / widthDivisor
      const heightBasedSize = containerHeight / heightDivisor
      const baseFontSize = Math.min(widthBasedSize, heightBasedSize)
      const clampedFontSize = Math.max(minFontSize, Math.min(baseFontSize, maxFontSize))
      setFontSize(clampedFontSize)

      setTimeout(() => {
        if (valueRef.current) {
          const measuredWidth = valueRef.current.getBoundingClientRect().width
          setTextWidth(measureWidth(measuredWidth, containerWidth))
        }
      }, 10)
    }

    const timer = setTimeout(updateDimensions, 50)
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updateDimensions, 10)
    })
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      clearTimeout(timer)
      resizeObserver.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { containerRef, valueRef, fontSize, textWidth }
}
