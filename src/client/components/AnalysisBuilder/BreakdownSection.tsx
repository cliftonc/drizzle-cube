/**
 * BreakdownSection Component
 *
 * Displays the Breakdown section in the query panel with expandable list of breakdowns.
 */

import { useMemo, useState, useCallback, useRef, memo } from 'react'
import type { BreakdownSectionProps } from './types'
import type { MetaField } from '../../shared/types'
import BreakdownItemCard from './BreakdownItemCard'
import SectionHeading from './SectionHeading'
import { getIcon } from '../../icons'

// Get icon once at module level to avoid recreating
const AddIcon = getIcon('add')

/**
 * Find field metadata by field name
 */
function findFieldMeta(fieldName: string, schema: BreakdownSectionProps['schema']): MetaField | null {
  if (!schema?.cubes) return null

  const [cubeName] = fieldName.split('.')
  const cube = schema.cubes.find((c) => c.name === cubeName)
  if (!cube) return null

  // Check dimensions first, then try to find in other arrays
  return cube.dimensions?.find((d) => d.name === fieldName) || null
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
 * BreakdownSection displays a collapsible section with:
 * - Header with title and add button
 * - List of selected breakdowns (using BreakdownItemCard)
 * - Drag/drop reordering support
 */
const BreakdownSection = memo(function BreakdownSection({
  breakdowns,
  schema,
  onAdd,
  onRemove,
  onGranularityChange,
  order,
  onOrderChange,
  onReorder
}: BreakdownSectionProps) {

  // Drag/drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null) // Index where item will be inserted

  // Use refs to track current values for use in drop handler (avoids stale closure issues)
  const draggedIndexRef = useRef<number | null>(null)
  const dropTargetIndexRef = useRef<number | null>(null)

  // Get the ordered keys to calculate priority
  const orderKeys = useMemo(() => order ? Object.keys(order) : [], [order])

  // Resolve field metadata for all breakdowns with sort info
  const breakdownsWithMeta = useMemo(() => {
    return breakdowns.map((breakdown, index) => {
      const sortDirection = order?.[breakdown.field] || null
      const sortPriority = sortDirection ? orderKeys.indexOf(breakdown.field) + 1 : undefined
      return {
        breakdown,
        fieldMeta: findFieldMeta(breakdown.field, schema),
        sortDirection,
        sortPriority,
        index
      }
    })
  }, [breakdowns, schema, order, orderKeys])

  // Track drag clone for cleanup
  const dragCloneRef = useRef<HTMLElement | null>(null)

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    draggedIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'breakdown', index, field: breakdowns[index].field }))

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
  }, [breakdowns])

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
  const handleItemDragOver = useCallback((e: React.DragEvent, itemIndex: number) => {
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
  const handleItemDrop = useCallback((e: React.DragEvent) => {
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
  const handleSectionDragLeave = useCallback((e: React.DragEvent) => {
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
        className="flex items-center justify-between mb-3 w-full py-1 px-2 -ml-2 rounded-lg hover:bg-dc-primary/10 transition-colors group"
        title="Add breakdown"
      >
        <SectionHeading>Breakdown</SectionHeading>
        <AddIcon className="w-5 h-5 text-dc-text-secondary group-hover:text-dc-primary transition-colors" />
      </button>

      {/* Breakdowns List */}
      <div
        className="space-y-2"
        onDragLeave={onReorder ? handleSectionDragLeave : undefined}
        onDragOver={onReorder ? (e) => e.preventDefault() : undefined}
        onDrop={onReorder ? handleItemDrop : undefined}
      >
        {breakdownsWithMeta.map(({ breakdown, fieldMeta, sortDirection, sortPriority, index }) => {
          const transform = getItemTransform(index)
          const showGapBefore = shouldShowGapIndicator(index)

          return (
            <div
              key={breakdown.id}
              className="relative"
              style={{
                transform,
                transition: draggedIndex !== null ? 'transform 0.15s ease-out' : 'none'
              }}
              onDragOver={onReorder ? (e) => handleItemDragOver(e, index) : undefined}
              onDrop={onReorder ? handleItemDrop : undefined}
            >
              {/* Gap indicator line - shows where item will be inserted */}
              {showGapBefore && (
                <div className="absolute -top-5 left-0 right-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="h-0.5 w-full bg-dc-primary rounded-full" />
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
                sortDirection={sortDirection}
                sortPriority={sortPriority}
                onToggleSort={onOrderChange ? () => {
                  const nextDirection = getNextSortDirection(sortDirection)
                  onOrderChange(breakdown.field, nextDirection)
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
        {onReorder && draggedIndex !== null && dropTargetIndex === breakdowns.length && (
          <div className="relative h-2">
            <div className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-10">
              <div className="h-0.5 w-full bg-dc-primary rounded-full" />
            </div>
          </div>
        )}
        {/* Handle drop at the end of the list */}
        {onReorder && breakdowns.length > 0 && draggedIndex !== null && (
          <div
            className="h-8"
            onDragOver={(e) => {
              e.preventDefault()
              // Set drop target to end of list
              const lastIndex = breakdowns.length
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

export default BreakdownSection
