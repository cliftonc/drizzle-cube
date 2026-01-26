/**
 * BreakdownItemCard Component
 *
 * Displays a single breakdown (dimension) item with optional granularity selector.
 */

import { memo } from 'react'
import type { BreakdownItemCardProps, TimeGranularity } from './types'
import { TIME_GRANULARITIES } from './types'
import { getIcon } from '../../icons'

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
  const DimensionIcon = getIcon('dimension')
  const TimeIcon = getIcon('timeDimension')
  const CloseIcon = getIcon('close')
  const ChevronUpIcon = getIcon('chevronUp')
  const ChevronDownIcon = getIcon('chevronDown')
  const ChevronUpDownIcon = getIcon('chevronUpDown')

  // Get display title - prefer shortTitle, then title, then field name
  const displayTitle = fieldMeta?.shortTitle || fieldMeta?.title || breakdown.field.split('.').pop() || breakdown.field

  // Get the cube name from the field
  const cubeName = breakdown.field.split('.')[0]

  // Choose icon based on dimension type
  const Icon = breakdown.isTimeDimension ? TimeIcon : DimensionIcon

  // Get sort icon based on direction
  const getSortIcon = () => {
    switch (sortDirection) {
      case 'asc':
        return ChevronUpIcon ? <ChevronUpIcon className="dc:w-4 dc:h-4" /> : '↑'
      case 'desc':
        return ChevronDownIcon ? <ChevronDownIcon className="dc:w-4 dc:h-4" /> : '↓'
      default:
        return ChevronUpDownIcon ? <ChevronUpDownIcon className="dc:w-4 dc:h-4" /> : '⇅'
    }
  }

  // Get sort tooltip
  const getSortTooltip = () => {
    switch (sortDirection) {
      case 'asc':
        return 'Sorted ascending (click for descending)'
      case 'desc':
        return 'Sorted descending (click to remove)'
      default:
        return 'Click to sort ascending'
    }
  }

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
              {g.label}
            </option>
          ))}
        </select>
      )}

      {/* Comparison Toggle (for time dimensions) */}
      {breakdown.isTimeDimension && onComparisonToggle && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onComparisonToggle()
          }}
          disabled={comparisonDisabled && !breakdown.enableComparison}
          className={`dc:text-xs dc:px-2 dc:py-1 dc:rounded dc:flex-shrink-0 dc:transition-colors ${
            breakdown.enableComparison
              ? 'bg-dc-accent text-white'
              : 'bg-dc-surface dc:border border-dc-border text-dc-text-muted hover:text-dc-text hover:bg-dc-surface-hover'
          } ${comparisonDisabled && !breakdown.enableComparison ? 'dc:opacity-50 dc:cursor-not-allowed' : ''}`}
          title={
            comparisonDisabled && !breakdown.enableComparison
              ? 'Another time dimension already has comparison enabled'
              : breakdown.enableComparison
                ? 'Click to disable comparison'
                : 'Compare with previous period'
          }
        >
          vs prior
        </button>
      )}

      {/* Sort Button */}
      {onToggleSort && (
        <button
          onClick={onToggleSort}
          className={`dc:p-1 dc:transition-opacity dc:flex-shrink-0 dc:flex dc:items-center dc:gap-0.5 ${
            sortDirection
              ? 'dc:opacity-100 text-dc-primary'
              : 'dc:opacity-100 dc:sm:opacity-0 dc:sm:group-hover:opacity-100 text-dc-text-muted hover:text-dc-primary'
          }`}
          title={getSortTooltip()}
        >
          {getSortIcon()}
          {sortDirection && sortPriority && (
            <span className="dc:text-xs dc:font-medium">({sortPriority})</span>
          )}
        </button>
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
