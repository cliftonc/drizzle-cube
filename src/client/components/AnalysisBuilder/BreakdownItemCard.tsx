/**
 * BreakdownItemCard Component
 *
 * Displays a single breakdown (dimension) item with optional granularity selector.
 */

import { memo } from 'react'
import type { BreakdownItemCardProps, TimeGranularity } from './types'
import { TIME_GRANULARITIES } from './types'
import { getIcon } from '../../icons'
import { useTranslation } from '../../hooks/useTranslation'
import SortToggleButton from './SortToggleButton'
import BreakdownComparisonToggle from './BreakdownComparisonToggle'

/**
 * BreakdownItemCard displays a selected breakdown with:
 * - Field icon (dimension or time dimension)
 * - Field title or full name
 * - Granularity dropdown (for time dimensions)
 * - Sort toggle button (visible on hover, or always visible when sorted)
 * - Remove button (visible on hover)
 * - Drag handle for reordering
 */
const BreakdownItemCard = memo(function BreakdownItemCard({
  breakdown,
  fieldMeta,
  onRemove,
  onGranularityChange,
  onComparisonToggle,
  comparisonDisabled,
  sortDirection,
  sortPriority,
  onToggleSort,
  index,
  isDragging,
  onDragStart,
  onDragEnd
}: BreakdownItemCardProps) {
  const { t } = useTranslation()
  const DimensionIcon = getIcon('dimension')
  const TimeIcon = getIcon('timeDimension')
  const CloseIcon = getIcon('close')

  // Get display title - prefer shortTitle, then title, then field name
  const displayTitle = fieldMeta?.shortTitle || fieldMeta?.title || breakdown.field.split('.').pop() || breakdown.field

  // Get the cube name from the field
  const cubeName = breakdown.field.split('.')[0]

  // Choose icon based on dimension type
  const Icon = breakdown.isTimeDimension ? TimeIcon : DimensionIcon

  // Check if drag/drop is enabled
  const isDraggable = typeof index === 'number' && onDragStart && onDragEnd

  return (
    <div
      className={`dc:flex dc:items-center dc:gap-2 dc:p-2 bg-dc-surface-secondary dc:rounded-lg dc:group hover:bg-dc-surface-tertiary dc:transition-all dc:duration-150 ${
        isDraggable ? 'dc:cursor-grab dc:active:cursor-grabbing' : ''
      } ${isDragging ? 'dc:opacity-30' : ''}`}
      draggable={isDraggable ? true : undefined}
      onDragStart={isDraggable ? (e) => onDragStart(e, index) : undefined}
      onDragEnd={isDraggable ? onDragEnd : undefined}
    >
      {/* Icon - colored background matching field selector */}
      <span className={`dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded dc:flex-shrink-0 ${
        breakdown.isTimeDimension
          ? 'bg-dc-time-dimension text-dc-time-dimension-text'
          : 'bg-dc-dimension text-dc-dimension-text'
      }`}>
        <Icon className="dc:w-4 dc:h-4" />
      </span>

      {/* Field Info */}
      <div className="dc:flex-1 dc:min-w-0">
        <div className="dc:text-sm text-dc-text dc:truncate" title={breakdown.field}>
          {displayTitle}
        </div>
        <div className="dc:text-xs text-dc-text-muted dc:truncate">
          {cubeName}
        </div>
      </div>

      {/* Granularity Selector (for time dimensions) */}
      {breakdown.isTimeDimension && onGranularityChange && (
        <select
          value={breakdown.granularity || 'day'}
          onChange={(e) => onGranularityChange(e.target.value as TimeGranularity)}
          onClick={(e) => e.stopPropagation()}
          className="dc:text-xs bg-dc-surface dc:border border-dc-border dc:rounded dc:px-2 dc:py-1 text-dc-text dc:focus:outline-none dc:focus:ring-1 focus:ring-dc-primary dc:flex-shrink-0"
        >
          {TIME_GRANULARITIES.map((g) => (
            <option key={g.value} value={g.value}>
              {t(g.label)}
            </option>
          ))}
        </select>
      )}

      {/* Comparison Toggle (for time dimensions) */}
      {breakdown.isTimeDimension && onComparisonToggle && (
        <BreakdownComparisonToggle
          enableComparison={breakdown.enableComparison}
          comparisonDisabled={comparisonDisabled}
          onComparisonToggle={onComparisonToggle}
        />
      )}

      {/* Sort Button */}
      {onToggleSort && (
        <SortToggleButton
          sortDirection={sortDirection}
          sortPriority={sortPriority}
          onToggleSort={onToggleSort}
        />
      )}

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="dc:p-1 text-dc-text-muted hover:text-dc-danger dc:opacity-100 dc:sm:opacity-0 dc:sm:group-hover:opacity-100 dc:transition-opacity dc:flex-shrink-0"
        title="Remove breakdown"
      >
        <CloseIcon className="dc:w-4 dc:h-4" />
      </button>
    </div>
  )
})

export default BreakdownItemCard
