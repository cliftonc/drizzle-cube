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
      <span className="dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded bg-dc-measure text-dc-measure-text dc:flex-shrink-0">
        {MeasureIcon && <MeasureIcon className="dc:w-4 dc:h-4" />}
      </span>

      {/* Field Info */}
      <div className="dc:flex-1 dc:min-w-0">
        <div className="dc:text-sm text-dc-text dc:truncate" title={metric.field}>
          {displayTitle}
        </div>
        <div className="dc:text-xs text-dc-text-muted dc:truncate">
          {cubeName}
        </div>
      </div>

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
        title="Remove metric"
      >
        <CloseIcon className="dc:w-4 dc:h-4" />
      </button>
    </div>
  )
})

export default MetricItemCard
