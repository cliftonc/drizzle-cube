/**
 * ScaledGridWrapper component
 * Applies CSS transform scaling to the dashboard grid for intermediate screen sizes
 * Maintains the exact desktop layout appearance, just proportionally smaller
 */

import React, { useState, useEffect, useRef } from 'react'

interface ScaledGridWrapperProps {
  scaleFactor: number
  designWidth: number
  children: React.ReactNode
}

/**
 * Wrapper component that scales the grid using CSS transform
 * Handles height compensation to prevent overflow/whitespace issues
 */
export default function ScaledGridWrapper({
  scaleFactor,
  designWidth,
  children
}: ScaledGridWrapperProps) {
  const [actualHeight, setActualHeight] = useState(0)
  const innerRef = useRef<HTMLDivElement>(null)

  // Measure actual grid height to calculate visible height
  useEffect(() => {
    if (!innerRef.current) return

    const observer = new ResizeObserver((entries) => {
      setActualHeight(entries[0]?.contentRect.height ?? 0)
    })

    observer.observe(innerRef.current)

    // Set initial height
    setActualHeight(innerRef.current.offsetHeight || 0)

    return () => observer.disconnect()
  }, [])

  // The scaled visual height
  const visualHeight = actualHeight * scaleFactor

  return (
    <div
      className="scaled-grid-container"
      style={{
        height: visualHeight > 0 ? visualHeight : 'auto',
        overflow: 'hidden',
        width: '100%'
      }}
    >
      <div
        ref={innerRef}
        className="scaled-grid-inner"
        style={{
          transform: `scale(${scaleFactor})`,
          transformOrigin: 'top left',
          width: designWidth
        }}
      >
        {children}
      </div>
    </div>
  )
}
