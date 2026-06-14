/**
 * BreakdownRow Component
 *
 * Presentational wrapper for a single breakdown in BreakdownSection — handles
 * the drag transform container, gap indicator, and the BreakdownItemCard.
 * Extracted so the list `.map` callback stays trivial.
 */

import { memo, DragEvent } from 'react'
import type { MetaField } from '../../shared/types'
import type { BreakdownItem } from './types'
import BreakdownItemCard from './BreakdownItemCard'
import { getNextSortDirection } from './utils/sortUtils'

interface BreakdownRowProps {
  breakdown: BreakdownItem
  fieldMeta: MetaField | null
  sortDirection: 'asc' | 'desc' | null
  sortPriority: number | undefined
  index: number
  transform: string
  showGapBefore: boolean
  isAnyDragging: boolean
  isDragging: boolean
  comparisonDisabled: boolean
  onRemove: (id: string) => void
  onGranularityChange: (id: string, granularity: string) => void
  onComparisonToggle?: (id: string) => void
  onOrderChange?: (field: string, direction: 'asc' | 'desc' | null) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
  onItemDragOver: (e: DragEvent, index: number) => void
  onItemDrop: (e: DragEvent) => void
  onDragStart: (e: DragEvent, index: number) => void
  onDragEnd: () => void
}

const BreakdownRow = memo(function BreakdownRow({
  breakdown,
  fieldMeta,
  sortDirection,
  sortPriority,
  index,
  transform,
  showGapBefore,
  isAnyDragging,
  isDragging,
  comparisonDisabled,
  onRemove,
  onGranularityChange,
  onComparisonToggle,
  onOrderChange,
  onReorder,
  onItemDragOver,
  onItemDrop,
  onDragStart,
  onDragEnd
}: BreakdownRowProps) {
  return (
    <div
      className="dc:relative"
      style={{
        transform,
        transition: isAnyDragging ? 'transform 0.15s ease-out' : 'none'
      }}
      onDragOver={onReorder ? (e) => onItemDragOver(e, index) : undefined}
      onDrop={onReorder ? onItemDrop : undefined}
    >
      {showGapBefore && (
        <div className="dc:absolute dc:-top-5 dc:left-0 dc:right-0 dc:flex dc:items-center dc:justify-center dc:pointer-events-none dc:z-10">
          <div className="dc:h-0.5 dc:w-full bg-dc-primary dc:rounded-full" />
        </div>
      )}
      <BreakdownItemCard
        breakdown={breakdown}
        fieldMeta={fieldMeta}
        onRemove={() => onRemove(breakdown.id)}
        onGranularityChange={
          breakdown.isTimeDimension
            ? (granularity) => onGranularityChange(breakdown.id, granularity)
            : undefined
        }
        onComparisonToggle={
          breakdown.isTimeDimension && onComparisonToggle
            ? () => onComparisonToggle(breakdown.id)
            : undefined
        }
        comparisonDisabled={comparisonDisabled}
        sortDirection={sortDirection}
        sortPriority={sortPriority}
        onToggleSort={onOrderChange ? () => {
          onOrderChange(breakdown.field, getNextSortDirection(sortDirection))
        } : undefined}
        index={index}
        isDragging={isDragging}
        onDragStart={onReorder ? onDragStart : undefined}
        onDragEnd={onReorder ? onDragEnd : undefined}
      />
    </div>
  )
})

export default BreakdownRow
