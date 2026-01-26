/**
 * MetricsSection Component
 *
 * Displays the Metrics section in the query panel with expandable list of metrics.
 */

import { useMemo, useState, useCallback, useRef, memo, DragEvent } from 'react'
import type { MetricsSectionProps } from './types'
import type { MetaField } from '../../shared/types'
import MetricItemCard from './MetricItemCard'
import SectionHeading from './SectionHeading'
import { getIcon } from '../../icons'

// Get icon once at module level to avoid recreating
const AddIcon = getIcon('add')

/**
 * Find field metadata by field name
 */
function findFieldMeta(fieldName: string, schema: MetricsSectionProps['schema']): MetaField | null {
  if (!schema?.cubes) return null

  const [cubeName] = fieldName.split('.')
  const cube = schema.cubes.find((c) => c.name === cubeName)
  if (!cube) return null

  return cube.measures?.find((m) => m.name === fieldName) || null
}

/**
 * Get next sort direction in the cycle: null -> asc -> desc -> null
 */
function getNextSortDirection(current: 'asc' | 'desc' | null): 'asc' | 'desc' | null {
  switch (current) {
    case null:
      return 'asc'
    case 'asc':
      return 'desc'
    case 'desc':
      return null
    default:
      return 'asc'
  }
}

/**
 * MetricsSection displays a collapsible section with:
 * - Header with title and add button
 * - List of selected metrics (using MetricItemCard)
 * - Drag/drop reordering support
 */
const MetricsSection = memo(function MetricsSection({
  metrics,
  schema,
  onAdd,
  onRemove,
  order,
  onOrderChange,
  onReorder
}: MetricsSectionProps) {

  // Drag/drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null) // Index where item will be inserted

  // Use refs to track current values for use in drop handler (avoids stale closure issues)
  const draggedIndexRef = useRef<number | null>(null)
  const dropTargetIndexRef = useRef<number | null>(null)

  // Get the ordered keys to calculate priority
  const orderKeys = useMemo(() => order ? Object.keys(order) : [], [order])

  // Resolve field metadata for all metrics with sort info
  const metricsWithMeta = useMemo(() => {
    return metrics.map((metric, index) => {
      const sortDirection = order?.[metric.field] || null
      const sortPriority = sortDirection ? orderKeys.indexOf(metric.field) + 1 : undefined
      return {
        metric,
        fieldMeta: findFieldMeta(metric.field, schema),
        sortDirection,
        sortPriority,
        index
      }
    })
  }, [metrics, schema, order, orderKeys])

  // Track drag clone for cleanup
  const dragCloneRef = useRef<HTMLElement | null>(null)

  // Drag handlers
  const handleDragStart = useCallback((e: DragEvent, index: number) => {
    setDraggedIndex(index)
    draggedIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'metric', index, field: metrics[index].field }))

    // Create a semi-transparent, slightly tilted drag image
    const target = e.currentTarget as HTMLElement
    const clone = target.cloneNode(true) as HTMLElement
    clone.style.cssText = `
      position: absolute;
      top: -9999px;
      left: -9999px;
      width: ${target.offsetWidth}px;
      opacity: 0.7;
      transform: rotate(2deg);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      pointer-events: none;
    `
    document.body.appendChild(clone)
    dragCloneRef.current = clone

    // Calculate offset from click position
    const rect = target.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top
    e.dataTransfer.setDragImage(clone, offsetX, offsetY)
  }, [metrics])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDropTargetIndex(null)
    draggedIndexRef.current = null
    dropTargetIndexRef.current = null
    // Clean up the drag clone
    if (dragCloneRef.current) {
      document.body.removeChild(dragCloneRef.current)
      dragCloneRef.current = null
    }
  }, [])

  // Handle drag over an item - determine drop position based on mouse position
  const handleItemDragOver = useCallback((e: DragEvent, itemIndex: number) => {
    e.preventDefault()
    e.stopPropagation()

    // Only process if we're dragging from this section
    const currentDraggedIndex = draggedIndexRef.current
    if (currentDraggedIndex === null) return

    // Determine if we're in the top or bottom half of the item
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseY = e.clientY - rect.top
    const isTopHalf = mouseY < rect.height / 2

    // Calculate target index based on position
    let targetIndex = isTopHalf ? itemIndex : itemIndex + 1

    // Don't set drop target if it would result in no movement
    if (targetIndex === currentDraggedIndex || targetIndex === currentDraggedIndex + 1) {
      setDropTargetIndex(null)
      dropTargetIndexRef.current = null
    } else {
      setDropTargetIndex(targetIndex)
      dropTargetIndexRef.current = targetIndex
    }
  }, [])

  // Handle drop on an item
  const handleItemDrop = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Use refs to get current values (avoids stale closure issues)
    const currentDraggedIndex = draggedIndexRef.current
    const currentDropTargetIndex = dropTargetIndexRef.current

    // Reset visual state immediately
    setDraggedIndex(null)
    setDropTargetIndex(null)
    draggedIndexRef.current = null
    dropTargetIndexRef.current = null

    // Validate and reorder - use refs directly, no dataTransfer parsing needed
    if (currentDraggedIndex === null || currentDropTargetIndex === null || !onReorder) {
      return
    }

    // Adjust target index when dragging down (after splice, indices shift)
    const adjustedTarget = currentDropTargetIndex > currentDraggedIndex
      ? currentDropTargetIndex - 1
      : currentDropTargetIndex

    if (adjustedTarget !== currentDraggedIndex) {
      onReorder(currentDraggedIndex, adjustedTarget)
    }
  }, [onReorder])

  // Clear drop target when leaving the section
  const handleSectionDragLeave = useCallback((e: DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropTargetIndex(null)
    }
  }, [])

  // Calculate if an item should be shifted to make room for the drop
  const getItemTransform = useCallback((itemIndex: number): string => {
    if (draggedIndex === null || dropTargetIndex === null) return ''

    // Gap size in pixels
    const gapSize = 40

    // If this is the dragged item, no transform needed (it's already faded)
    if (itemIndex === draggedIndex) return ''

    // Items at or after drop target need to shift down
    // But we need to account for the dragged item's position
    if (draggedIndex < dropTargetIndex) {
      // Dragging down: items between dragged+1 and dropTarget-1 shift up
      if (itemIndex > draggedIndex && itemIndex < dropTargetIndex) {
        return '' // No gap needed, item stays in place
      }
      // Item at dropTarget-1 position should show gap after it
      if (itemIndex === dropTargetIndex - 1) {
        return `translateY(-${gapSize / 2}px)` // Shift up to make room
      }
      if (itemIndex >= dropTargetIndex) {
        return `translateY(${gapSize / 2}px)` // Shift down
      }
    } else {
      // Dragging up: items from dropTarget to draggedIndex-1 shift down
      if (itemIndex >= dropTargetIndex && itemIndex < draggedIndex) {
        return `translateY(${gapSize / 2}px)` // Shift down to make room
      }
    }

    return ''
  }, [draggedIndex, dropTargetIndex])

  // Determine if gap indicator should show at a position
  const shouldShowGapIndicator = useCallback((itemIndex: number): boolean => {
    if (draggedIndex === null || dropTargetIndex === null) return false

    // Show indicator before the item that matches dropTargetIndex
    return itemIndex === dropTargetIndex
  }, [draggedIndex, dropTargetIndex])

  return (
    <div>
      {/* Section Header - entire row is clickable */}
      <button
        onClick={onAdd}
        className="dc:flex dc:items-center dc:justify-between dc:mb-3 dc:w-full dc:py-1 dc:px-2 dc:-ml-2 dc:rounded-lg hover:bg-dc-primary/10 dc:transition-colors dc:group"
        title="Add metric"
      >
        <SectionHeading>Metrics</SectionHeading>
        <AddIcon className="dc:w-5 dc:h-5 text-dc-text-secondary group-hover:text-dc-primary dc:transition-colors" />
      </button>

      {/* Metrics List */}
      <div
        className="dc:space-y-2"
        onDragLeave={onReorder ? handleSectionDragLeave : undefined}
        onDragOver={onReorder ? (e) => e.preventDefault() : undefined}
        onDrop={onReorder ? handleItemDrop : undefined}
      >
        {metricsWithMeta.map(({ metric, fieldMeta, sortDirection, sortPriority, index }) => {
          const transform = getItemTransform(index)
          const showGapBefore = shouldShowGapIndicator(index)

          return (
            <div
              key={metric.id}
              className="dc:relative"
              style={{
                transform,
                transition: draggedIndex !== null ? 'transform 0.15s ease-out' : 'none'
              }}
              onDragOver={onReorder ? (e) => handleItemDragOver(e, index) : undefined}
              onDrop={onReorder ? handleItemDrop : undefined}
            >
              {/* Gap indicator line - shows where item will be inserted */}
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
                  const nextDirection = getNextSortDirection(sortDirection)
                  onOrderChange(metric.field, nextDirection)
                } : undefined}
                index={index}
                isDragging={draggedIndex === index}
                onDragStart={onReorder ? handleDragStart : undefined}
                onDragEnd={onReorder ? handleDragEnd : undefined}
              />
            </div>
          )
        })}
        {/* Gap indicator after the last item - shows when dropping at end */}
        {onReorder && draggedIndex !== null && dropTargetIndex === metrics.length && (
          <div className="dc:relative dc:h-2">
            <div className="dc:absolute dc:top-0 dc:left-0 dc:right-0 dc:flex dc:items-center dc:justify-center dc:pointer-events-none dc:z-10">
              <div className="dc:h-0.5 dc:w-full bg-dc-primary dc:rounded-full" />
            </div>
          </div>
        )}
        {/* Handle drop at the end of the list */}
        {onReorder && metrics.length > 0 && draggedIndex !== null && (
          <div
            className="dc:h-8"
            onDragOver={(e) => {
              e.preventDefault()
              // Set drop target to end of list
              const lastIndex = metrics.length
              const currentDraggedIndex = draggedIndexRef.current
              if (dropTargetIndexRef.current !== lastIndex && currentDraggedIndex !== lastIndex - 1) {
                setDropTargetIndex(lastIndex)
                dropTargetIndexRef.current = lastIndex
              }
            }}
            onDrop={handleItemDrop}
          />
        )}
      </div>
    </div>
  )
})

export default MetricsSection
