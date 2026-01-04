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
        return ChevronUpIcon ? <ChevronUpIcon className="w-4 h-4" /> : '↑'
      case 'desc':
        return ChevronDownIcon ? <ChevronDownIcon className="w-4 h-4" /> : '↓'
      default:
        return ChevronUpDownIcon ? <ChevronUpDownIcon className="w-4 h-4" /> : '⇅'
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
      className={`flex items-center gap-2 p-2 bg-dc-surface-secondary rounded-lg group hover:bg-dc-surface-tertiary transition-all duration-150 ${
        isDraggable ? 'cursor-grab active:cursor-grabbing' : ''
      } ${isDragging ? 'opacity-30' : ''}`}
      draggable={isDraggable ? true : undefined}
      onDragStart={isDraggable ? (e) => onDragStart(e, index) : undefined}
      onDragEnd={isDraggable ? onDragEnd : undefined}
    >
      {/* Icon - colored background matching field selector */}
      <span className={`w-6 h-6 flex items-center justify-center rounded flex-shrink-0 ${
        breakdown.isTimeDimension
          ? 'bg-dc-time-dimension text-dc-time-dimension-text'
          : 'bg-dc-dimension text-dc-dimension-text'
      }`}>
        <Icon className="w-4 h-4" />
      </span>

      {/* Field Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-dc-text truncate" title={breakdown.field}>
          {displayTitle}
        </div>
        <div className="text-xs text-dc-text-muted truncate">
          {cubeName}
        </div>
      </div>

      {/* Granularity Selector (for time dimensions) */}
      {breakdown.isTimeDimension && onGranularityChange && (
        <select
          value={breakdown.granularity || 'day'}
          onChange={(e) => onGranularityChange(e.target.value as TimeGranularity)}
          onClick={(e) => e.stopPropagation()}
          className="text-xs bg-dc-surface border border-dc-border rounded px-2 py-1 text-dc-text focus:outline-none focus:ring-1 focus:ring-dc-primary flex-shrink-0"
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
          className={`text-xs px-2 py-1 rounded flex-shrink-0 transition-colors ${
            breakdown.enableComparison
              ? 'bg-dc-accent text-white'
              : 'bg-dc-surface border border-dc-border text-dc-text-muted hover:text-dc-text hover:bg-dc-surface-hover'
          } ${comparisonDisabled && !breakdown.enableComparison ? 'opacity-50 cursor-not-allowed' : ''}`}
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
          className={`p-1 transition-opacity flex-shrink-0 flex items-center gap-0.5 ${
            sortDirection
              ? 'opacity-100 text-dc-primary'
              : 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100 text-dc-text-muted hover:text-dc-primary'
          }`}
          title={getSortTooltip()}
        >
          {getSortIcon()}
          {sortDirection && sortPriority && (
            <span className="text-xs font-medium">({sortPriority})</span>
          )}
        </button>
      )}

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="p-1 text-dc-text-muted hover:text-dc-danger opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0"
        title="Remove breakdown"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  )
})

export default BreakdownItemCard
