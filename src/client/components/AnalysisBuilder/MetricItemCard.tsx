/**
 * MetricItemCard Component
 *
 * Displays a single metric item with remove button.
 */

import { memo } from 'react'
import type { MetricItemCardProps } from './types'
import { getIcon, getMeasureTypeIcon } from '../../icons'

/**
 * MetricItemCard displays a selected metric with:
 * - Field icon based on measure type
 * - Field title or full name
 * - Sort toggle button (visible on hover, or always visible when sorted)
 * - Remove button (visible on hover)
 * - Drag handle for reordering
 */
const MetricItemCard = memo(function MetricItemCard({
  metric,
  fieldMeta,
  onRemove,
  sortDirection,
  sortPriority,
  onToggleSort,
  index,
  isDragging,
  onDragStart,
  onDragEnd
}: MetricItemCardProps) {
  const CloseIcon = getIcon('close')
  const ChevronUpIcon = getIcon('chevronUp')
  const ChevronDownIcon = getIcon('chevronDown')
  const ChevronUpDownIcon = getIcon('chevronUpDown')

  // Get the appropriate icon based on measure type
  const measureType = fieldMeta?.type || 'count'
  const MeasureIcon = getMeasureTypeIcon(measureType) || getIcon('measure')

  // Get display title - prefer shortTitle, then title, then field name
  const displayTitle = fieldMeta?.shortTitle || fieldMeta?.title || metric.field.split('.').pop() || metric.field

  // Get the cube name from the field
  const cubeName = metric.field.split('.')[0]

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
      <span className="w-6 h-6 flex items-center justify-center rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex-shrink-0">
        {MeasureIcon && <MeasureIcon className="w-4 h-4" />}
      </span>

      {/* Field Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-dc-text truncate" title={metric.field}>
          {displayTitle}
        </div>
        <div className="text-xs text-dc-text-muted truncate">
          {cubeName}
        </div>
      </div>

      {/* Sort Button */}
      {onToggleSort && (
        <button
          onClick={onToggleSort}
          className={`p-1 transition-opacity flex-shrink-0 flex items-center gap-0.5 ${
            sortDirection
              ? 'opacity-100 text-dc-primary'
              : 'opacity-0 group-hover:opacity-100 text-dc-text-muted hover:text-dc-primary'
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
        className="p-1 text-dc-text-muted hover:text-dc-danger opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        title="Remove metric"
      >
        <CloseIcon className="w-4 h-4" />
      </button>
    </div>
  )
})

export default MetricItemCard
