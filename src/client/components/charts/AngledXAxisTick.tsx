import React from 'react'

interface AngledXAxisTickProps {
  x?: number
  y?: number
  payload?: {
    value: string | number
  }
  tickFormatter?: (value: string | number, index: number) => string
  index?: number
  visibleTicksCount?: number
  // Allow any additional props recharts might pass
  [key: string]: unknown
}

/**
 * Longest label the angled axis reserves room for; see
 * MAX_ANGLED_AXIS_HEIGHT in chartScaffolding.
 */
export const MAX_TICK_LABEL_CHARS = 16

/**
 * Custom XAxis tick component for properly aligned angled labels.
 * Fixes alignment issues in recharts 3.7+ where angled labels don't
 * center properly under data points.
 */
const AngledXAxisTick: React.FC<AngledXAxisTickProps> = ({
  x = 0,
  y = 0,
  payload,
  tickFormatter,
  index = 0
}) => {
  if (!payload) return null

  const rawValue = tickFormatter
    ? tickFormatter(payload.value, index)
    : String(payload.value)

  // The axis reserves height for the longest label (resolveAngledAxisHeight),
  // capped so one very long value cannot squeeze the plot. Truncate past that
  // cap rather than let the label be clipped by the chart edge.
  const displayValue =
    rawValue.length > MAX_TICK_LABEL_CHARS
      ? `${rawValue.slice(0, MAX_TICK_LABEL_CHARS - 1)}\u2026`
      : rawValue

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="var(--dc-text-muted)"
        fontSize={12}
        transform="rotate(-45)"
      >
        {displayValue}
      </text>
    </g>
  )
}

export default AngledXAxisTick
