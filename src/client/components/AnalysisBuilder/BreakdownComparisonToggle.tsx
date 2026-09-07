/**
 * BreakdownComparisonToggle Component
 *
 * "vs prior" period-comparison toggle for time-dimension breakdowns.
 * Extracted from BreakdownItemCard to keep its render body flat.
 */

import { memo } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'

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
  const { t } = useTranslation()
  const isDisabled = comparisonDisabled && !enableComparison

  let title: string
  if (isDisabled) {
    title = t('analysis.breakdownComparison.alreadyEnabled')
  } else if (enableComparison) {
    title = t('analysis.breakdownComparison.clickToDisable')
  } else {
    title = t('analysis.breakdownComparison.compareWithPrevious')
  }

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onComparisonToggle()
      }}
      disabled={isDisabled}
      className={`dc:text-xs dc:px-2 dc:py-1 dc:rounded-sm dc:flex-shrink-0 dc:transition-colors ${
        enableComparison
          ? 'bg-dc-accent text-white'
          : 'bg-dc-surface dc:border border-dc-border text-dc-text-muted hover:text-dc-text hover:bg-dc-surface-hover'
      } ${isDisabled ? 'dc:opacity-50 dc:cursor-not-allowed' : ''}`}
      title={title}
    >
      {t('analysis.breakdownComparison.vsPrior')}
    </button>
  )
})

export default BreakdownComparisonToggle
