/**
 * BreakdownComparisonToggle Component
 *
 * "vs prior" period-comparison toggle for time-dimension breakdowns.
 * Extracted from BreakdownItemCard to keep its render body flat.
 */

import { memo } from 'react'

interface BreakdownComparisonToggleProps {
  enableComparison?: boolean
  comparisonDisabled?: boolean
  onComparisonToggle: () => void
}

const BreakdownComparisonToggle = memo(function BreakdownComparisonToggle({
  enableComparison,
  comparisonDisabled,
  onComparisonToggle
}: BreakdownComparisonToggleProps) {
  const isDisabled = comparisonDisabled && !enableComparison

  let title: string
  if (isDisabled) {
    title = 'Another time dimension already has comparison enabled'
  } else if (enableComparison) {
    title = 'Click to disable comparison'
  } else {
    title = 'Compare with previous period'
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onComparisonToggle()
      }}
      disabled={isDisabled}
      className={`dc:text-xs dc:px-2 dc:py-1 dc:rounded dc:flex-shrink-0 dc:transition-colors ${
        enableComparison
          ? 'bg-dc-accent text-white'
          : 'bg-dc-surface dc:border border-dc-border text-dc-text-muted hover:text-dc-text hover:bg-dc-surface-hover'
      } ${isDisabled ? 'dc:opacity-50 dc:cursor-not-allowed' : ''}`}
      title={title}
    >
      vs prior
    </button>
  )
})

export default BreakdownComparisonToggle
