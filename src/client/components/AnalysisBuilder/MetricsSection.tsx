/**
 * MetricsSection Component
 *
 * Displays the Metrics section in the query panel with expandable list of metrics.
 */

import { useMemo, useState, useCallback, useRef } from 'react'
import type { MetricsSectionProps } from './types'
import type { MetaField } from '../../shared/types'
import MetricItemCard from './MetricItemCard'
import { getIcon } from '../../icons'

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
export default function MetricsSection({
  metrics,
  schema,
  onAdd,
  onRemove,
  order,
  onOrderChange,
  onReorder
}: MetricsSectionProps) {
  const AddIcon = getIcon('add')

  // Drag/drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null) // Index where item will be inserted

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
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
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
    // Clean up the drag clone
    if (dragCloneRef.current) {
      document.body.removeChild(dragCloneRef.current)
      dragCloneRef.current = null
    }
  }, [])

  // Handle drag over a drop zone (the gaps between items)
  const handleDropZoneDragOver = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    // Only show if we're dragging from this section
    if (draggedIndex !== null) {
      setDropTargetIndex(targetIndex)
    }
  }, [draggedIndex])

  const handleDropZoneDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Only clear if leaving to outside the drop zone
    const relatedTarget = e.relatedTarget as HTMLElement | null
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropTargetIndex(null)
    }
  }, [])

  const handleDropZoneDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      // Only accept drops from metrics
      if (data.type === 'metric' && draggedIndex !== null && onReorder) {
        // Adjust target index if dropping after the dragged item
        const adjustedTarget = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex
        if (adjustedTarget !== draggedIndex) {
          onReorder(draggedIndex, adjustedTarget)
        }
      }
    } catch {
      // Ignore invalid data
    }
    setDraggedIndex(null)
    setDropTargetIndex(null)
  }, [draggedIndex, onReorder])

  // Clear drop target when leaving the section
  const handleSectionDragLeave = useCallback((e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement | null
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropTargetIndex(null)
    }
  }, [])

  // Render a drop zone indicator - positioned absolutely to not disrupt layout
  const renderDropZone = (targetIndex: number, isFirst: boolean = false) => {
    const isActive = dropTargetIndex === targetIndex && draggedIndex !== null
    const isValidDrop = draggedIndex !== null && targetIndex !== draggedIndex && targetIndex !== draggedIndex + 1

    if (draggedIndex === null) return null

    return (
      <div
        key={`drop-${targetIndex}`}
        className={`absolute left-0 right-0 z-10 ${isFirst ? '-top-1' : '-bottom-1'}`}
        style={{ height: '16px', transform: isFirst ? 'translateY(-50%)' : 'translateY(50%)' }}
        onDragOver={(e) => handleDropZoneDragOver(e, targetIndex)}
        onDragLeave={handleDropZoneDragLeave}
        onDrop={(e) => handleDropZoneDrop(e, targetIndex)}
      >
        {isValidDrop && (
          <div
            className={`absolute inset-x-0 top-1/2 -translate-y-1/2 rounded-md border-2 border-dashed flex items-center justify-center transition-all ${
              isActive
                ? 'border-dc-primary bg-dc-primary/10 h-8'
                : 'border-transparent h-1'
            }`}
          >
            {isActive && <span className="text-xs text-dc-primary font-medium">Drop here</span>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-dc-text">Metrics</h3>
        <button
          onClick={onAdd}
          className="p-1 text-dc-text-secondary hover:text-dc-primary hover:bg-dc-surface-secondary rounded transition-colors"
          title="Add metric"
        >
          <AddIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Metrics List */}
      <div className="space-y-2" onDragLeave={onReorder ? handleSectionDragLeave : undefined}>
        {metricsWithMeta.map(({ metric, fieldMeta, sortDirection, sortPriority, index }) => (
          <div key={metric.id} className="relative">
            {/* Drop zone before first item */}
            {index === 0 && onReorder && renderDropZone(0, true)}
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
            {/* Drop zone after each item */}
            {onReorder && renderDropZone(index + 1)}
          </div>
        ))}
      </div>
    </div>
  )
}
