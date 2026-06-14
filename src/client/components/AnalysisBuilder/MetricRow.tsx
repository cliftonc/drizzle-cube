/**
 * MetricRow Component
 *
 * Presentational wrapper for a single metric in MetricsSection — handles the
 * drag transform container, gap indicator, and the MetricItemCard itself.
 * Extracted so the list `.map` callback stays trivial.
 */

import { memo, DragEvent } from 'react'
import type { MetaField } from '../../shared/types'
import type { MetricItem } from './types'
import MetricItemCard from './MetricItemCard'
import { getNextSortDirection } from './utils/sortUtils'

interface MetricRowProps {
  metric: MetricItem
  fieldMeta: MetaField | null
  sortDirection: 'asc' | 'desc' | null
  sortPriority: number | undefined
  index: number
  transform: string
  showGapBefore: boolean
  isAnyDragging: boolean
  isDragging: boolean
  onRemove: (id: string) => void
  onOrderChange?: (field: string, direction: 'asc' | 'desc' | null) => void
  onReorder?: (fromIndex: number, toIndex: number) => void
  onItemDragOver: (e: DragEvent, index: number) => void
  onItemDrop: (e: DragEvent) => void
  onDragStart: (e: DragEvent, index: number) => void
  onDragEnd: () => void
}

const MetricRow = memo(function MetricRow({
  metric,
  fieldMeta,
  sortDirection,
  sortPriority,
  index,
  transform,
  showGapBefore,
  isAnyDragging,
  isDragging,
  onRemove,
  onOrderChange,
  onReorder,
  onItemDragOver,
  onItemDrop,
  onDragStart,
  onDragEnd
}: MetricRowProps) {
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
      <MetricItemCard
        metric={metric}
        fieldMeta={fieldMeta}
        onRemove={() => onRemove(metric.id)}
        sortDirection={sortDirection}
        sortPriority={sortPriority}
        onToggleSort={onOrderChange ? () => {
          onOrderChange(metric.field, getNextSortDirection(sortDirection))
        } : undefined}
        index={index}
        isDragging={isDragging}
        onDragStart={onReorder ? onDragStart : undefined}
        onDragEnd={onReorder ? onDragEnd : undefined}
      />
    </div>
  )
})

export default MetricRow
