/**
 * SortToggleButton Component
 *
 * Shared sort-direction toggle used by MetricItemCard and BreakdownItemCard.
 * Renders the direction icon, optional sort-priority badge, and tooltip.
 */

import { memo } from 'react'
import type { ReactNode } from 'react'
import { getIcon } from '../../icons'

interface SortToggleButtonProps {
  sortDirection?: 'asc' | 'desc' | null
  sortPriority?: number
  onToggleSort: () => void
}

function getSortTooltip(sortDirection?: 'asc' | 'desc' | null): string {
  switch (sortDirection) {
    case 'asc':
      return 'Sorted ascending (click for descending)'
    case 'desc':
      return 'Sorted descending (click to remove)'
    default:
      return 'Click to sort ascending'
  }
}

const SortToggleButton = memo(function SortToggleButton({
  sortDirection,
  sortPriority,
  onToggleSort
}: SortToggleButtonProps) {
  const ChevronUpIcon = getIcon('chevronUp')
  const ChevronDownIcon = getIcon('chevronDown')
  const ChevronUpDownIcon = getIcon('chevronUpDown')

  let icon: ReactNode
  if (sortDirection === 'asc') {
    icon = ChevronUpIcon ? <ChevronUpIcon className="dc:w-4 dc:h-4" /> : '↑'
  } else if (sortDirection === 'desc') {
    icon = ChevronDownIcon ? <ChevronDownIcon className="dc:w-4 dc:h-4" /> : '↓'
  } else {
    icon = ChevronUpDownIcon ? <ChevronUpDownIcon className="dc:w-4 dc:h-4" /> : '⇅'
  }

  return (
    <button
      onClick={onToggleSort}
      className={`dc:p-1 dc:transition-opacity dc:flex-shrink-0 dc:flex dc:items-center dc:gap-0.5 ${
        sortDirection
          ? 'dc:opacity-100 text-dc-primary'
          : 'dc:opacity-100 dc:sm:opacity-0 dc:sm:group-hover:opacity-100 text-dc-text-muted hover:text-dc-primary'
      }`}
      title={getSortTooltip(sortDirection)}
    >
      {icon}
      {sortDirection && sortPriority && (
        <span className="dc:text-xs dc:font-medium">({sortPriority})</span>
      )}
    </button>
  )
})

export default SortToggleButton
