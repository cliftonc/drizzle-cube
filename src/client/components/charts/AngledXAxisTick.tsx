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

  const displayValue = tickFormatter
    ? tickFormatter(payload.value, index)
    : String(payload.value)

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="currentColor"
        fontSize={12}
        transform="rotate(-45)"
      >
        {displayValue}
      </text>
    </g>
  )
}

export default AngledXAxisTick
