/**
 * AnalysisAxisDropZone Component
 *
 * A styled version of AxisDropZone that matches the Query Panel card styling.
 * Used in the Analysis Builder's Chart tab for configuring chart axes.
 *
 * Key differences from AxisDropZone:
 * - Vertical card layout instead of inline chips
 * - Two-line display (title + cube name)
 * - Colored icon boxes for measures, plain icons for dimensions
 * - Hidden-on-hover remove buttons
 */

import React, { useState, useCallback, useRef } from 'react'
import { getIcon, getMeasureTypeIcon } from '../../icons'
import type { AxisDropZoneConfig } from '../../charts/chartConfigs'

const CloseIcon = getIcon('close')
const DimensionIcon = getIcon('dimension')
const TimeDimensionIcon = getIcon('timeDimension')
const MeasureIcon = getIcon('measure')

interface FieldMeta {
  title?: string
  shortTitle?: string
  cubeName: string
  type: 'measure' | 'dimension' | 'timeDimension'
  measureType?: string
}

interface AnalysisAxisDropZoneProps {
  config: AxisDropZoneConfig
  fields: string[]
  onDrop: (e: React.DragEvent<HTMLDivElement>, toKey: string) => void
  onRemove: (field: string, fromKey: string) => void
  onDragStart: (
    e: React.DragEvent<HTMLDivElement>,
    field: string,
    fromKey: string,
    fromIndex?: number
  ) => void
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onReorder?: (fromIndex: number, toIndex: number, axisKey: string) => void
  draggedItem?: { field: string; fromAxis: string; fromIndex?: number } | null
  getFieldMeta?: (field: string) => FieldMeta
  // Dual Y-axis support
  yAxisAssignment?: Record<string, 'left' | 'right'>
  onYAxisAssignmentChange?: (field: string, axis: 'left' | 'right') => void
}

export default function AnalysisAxisDropZone({
  config,
  fields,
  onDrop,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
  onReorder,
  draggedItem,
  getFieldMeta,
  yAxisAssignment,
  onYAxisAssignmentChange
}: AnalysisAxisDropZoneProps) {
  const { key, label, description, mandatory, maxItems, emptyText } = config
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const [isDraggedOver, setIsDraggedOver] = useState(false)
  const [isReorderDraggedOver, setIsReorderDraggedOver] = useState(false)

  // Track the field being dragged from this axis for drag-out-to-remove
  const draggingFieldRef = useRef<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  // Keep fields in a ref to avoid stale closure issues
  const fieldsRef = useRef(fields)
  fieldsRef.current = fields
  // Keep dropTargetIndex in a ref to avoid stale closure issues in drop handler
  const dropTargetIndexRef = useRef<number | null>(null)

  // Calculate acceptance considering what's being dragged
  const getCanAcceptMore = () => {
    let effectiveCount = fields.length

    // If we're dragging FROM this axis, we effectively have one less item
    if (draggedItem && draggedItem.fromAxis === key) {
      effectiveCount = Math.max(0, fields.length - 1)
    }

    return !maxItems || effectiveCount < maxItems
  }

  const getIsFull = () => {
    let effectiveCount = fields.length

    // If we're dragging FROM this axis, we effectively have one less item
    if (draggedItem && draggedItem.fromAxis === key) {
      effectiveCount = Math.max(0, fields.length - 1)
    }

    return maxItems && effectiveCount >= maxItems
  }

  const canAcceptMore = getCanAcceptMore()
  const isFull = getIsFull()

  // Add a global drag end listener to reset visual state
  React.useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDropTargetIndex(null)
      dropTargetIndexRef.current = null
      setIsDraggedOver(false)
      setIsReorderDraggedOver(false)
      draggingFieldRef.current = null
    }

    document.addEventListener('dragend', handleGlobalDragEnd)
    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd)
    }
  }, [])

  // Clear states when transitioning between different drag operations
  React.useEffect(() => {
    if (draggedItem) {
      // If we have a dragged item but it's not from this axis, clear reorder state
      if (draggedItem.fromAxis !== key) {
        setIsReorderDraggedOver(false)
        setDropTargetIndex(null)
        dropTargetIndexRef.current = null
      }
      // If we have a dragged item from this axis, clear regular drag state
      else if (draggedItem.fromAxis === key && draggedItem.fromIndex !== undefined) {
        setIsDraggedOver(false)
      }
    } else {
      // No dragged item, clear all states
      setDropTargetIndex(null)
      dropTargetIndexRef.current = null
      setIsDraggedOver(false)
      setIsReorderDraggedOver(false)
    }
  }, [draggedItem, key])

  // Handle drag over an item - determine drop position based on mouse position
  const handleItemDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, itemIndex: number) => {
    // Check if this is a reorder operation (same axis)
    if (!draggedItem || draggedItem.fromAxis !== key || draggedItem.fromIndex === undefined) return

    e.preventDefault()
    e.stopPropagation()

    // Determine if we're in the top or bottom half of the item
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseY = e.clientY - rect.top
    const isTopHalf = mouseY < rect.height / 2

    // Calculate target index based on position
    const fromIndex = draggedItem.fromIndex
    let targetIndex = isTopHalf ? itemIndex : itemIndex + 1

    // Don't set drop target if it would result in no movement
    if (targetIndex === fromIndex || targetIndex === fromIndex + 1) {
      setDropTargetIndex(null)
      dropTargetIndexRef.current = null
    } else {
      setDropTargetIndex(targetIndex)
      dropTargetIndexRef.current = targetIndex
      setIsReorderDraggedOver(true)
    }
  }, [draggedItem, key])

  // Handle drop on an item for reordering
  const handleItemDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    // DON'T stopPropagation here yet - only stop if this is a reorder operation

    // Use ref to get current dropTargetIndex (avoids stale closure)
    const currentDropTargetIndex = dropTargetIndexRef.current

    // Check if this is a reorder operation (same axis with valid indices)
    const isReorderOperation = draggedItem &&
      draggedItem.fromAxis === key &&
      draggedItem.fromIndex !== undefined &&
      currentDropTargetIndex !== null

    if (!isReorderOperation) {
      // Let the event bubble up to container for external drops
      setDropTargetIndex(null)
      dropTargetIndexRef.current = null
      setIsReorderDraggedOver(false)
      return  // Don't stop propagation - container will handle external drops
    }

    // This IS a reorder operation - stop propagation and handle it
    e.stopPropagation()

    // Adjust target index when dragging down (after splice, indices shift)
    const fromIndex = draggedItem!.fromIndex!
    const adjustedTarget = currentDropTargetIndex > fromIndex
      ? currentDropTargetIndex - 1
      : currentDropTargetIndex

    if (onReorder && adjustedTarget !== fromIndex) {
      onReorder(fromIndex, adjustedTarget, key)
    }

    setDropTargetIndex(null)
    dropTargetIndexRef.current = null
    setIsReorderDraggedOver(false)
  }, [draggedItem, key, onReorder])

  // Handle drag end - check if dropped outside container to remove
  const handleFieldDragEnd = useCallback((e: React.DragEvent<HTMLDivElement>, field: string) => {
    const container = containerRef.current
    if (container && draggingFieldRef.current === field) {
      const rect = container.getBoundingClientRect()
      const isInside =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom

      // If dropped outside the container
      if (!isInside) {
        // Use a small delay to let other drop handlers fire first
        // Then check if the field is still in this axis (wasn't moved elsewhere)
        setTimeout(() => {
          // Check using ref to get current fields, avoiding stale closure
          if (fieldsRef.current.includes(field)) {
            onRemove(field, key)
          }
        }, 0)
      }
    }

    draggingFieldRef.current = null
    setDropTargetIndex(null)
    dropTargetIndexRef.current = null
    setIsReorderDraggedOver(false)

    onDragEnd?.(e)
  }, [key, onRemove, onDragEnd])

  // Calculate transform for gap animation
  const getItemTransform = useCallback((itemIndex: number): string => {
    if (!draggedItem || draggedItem.fromAxis !== key || draggedItem.fromIndex === undefined || dropTargetIndex === null) {
      return ''
    }

    const fromIndex = draggedItem.fromIndex
    const gapSize = 40

    // If this is the dragged item, no transform needed
    if (itemIndex === fromIndex) return ''

    if (fromIndex < dropTargetIndex) {
      // Dragging down
      if (itemIndex >= dropTargetIndex) {
        return `translateY(${gapSize / 2}px)`
      }
    } else {
      // Dragging up
      if (itemIndex >= dropTargetIndex && itemIndex < fromIndex) {
        return `translateY(${gapSize / 2}px)`
      }
    }

    return ''
  }, [draggedItem, key, dropTargetIndex])

  // Determine if gap indicator should show
  const shouldShowGapIndicator = useCallback((itemIndex: number): boolean => {
    if (!draggedItem || draggedItem.fromAxis !== key || dropTargetIndex === null) return false
    return itemIndex === dropTargetIndex
  }, [draggedItem, key, dropTargetIndex])

  // Get default field meta from field name
  const getDefaultFieldMeta = (field: string): FieldMeta => {
    const parts = field.split('.')
    const cubeName = parts[0] || field
    const fieldName = parts[1] || field

    return {
      title: fieldName,
      shortTitle: fieldName,
      cubeName,
      type: 'dimension' // Default assumption
    }
  }

  // Render icon based on field type
  const renderFieldIcon = (meta: FieldMeta) => {
    if (meta.type === 'measure') {
      // Measures get colored icon box with type-specific icon
      const IconComponent = getMeasureTypeIcon(meta.measureType || 'count') || MeasureIcon
      return (
        <span className="w-6 h-6 flex items-center justify-center rounded bg-dc-measure text-dc-measure-text flex-shrink-0">
          <IconComponent className="w-4 h-4" />
        </span>
      )
    } else if (meta.type === 'timeDimension') {
      // Time dimensions get colored background matching field selector
      return (
        <span className="w-6 h-6 flex items-center justify-center rounded bg-dc-time-dimension text-dc-time-dimension-text flex-shrink-0">
          <TimeDimensionIcon className="w-4 h-4" />
        </span>
      )
    } else {
      // Regular dimensions get colored background matching field selector
      return (
        <span className="w-6 h-6 flex items-center justify-center rounded bg-dc-dimension text-dc-dimension-text flex-shrink-0">
          <DimensionIcon className="w-4 h-4" />
        </span>
      )
    }
  }

  return (
    <div className="mb-3">
      {/* Header */}
      <div className="mb-2">
        <h4 className="text-sm font-medium text-dc-text flex items-center">
          {label}
          {mandatory && <span className="text-dc-error ml-1">*</span>}
        </h4>
        {description && <div className="text-xs text-dc-text-muted mt-0.5">{description}</div>}
      </div>

      {/* Drop Zone Container */}
      <div
        ref={containerRef}
        data-axis-container={key}
        className={`min-h-[48px] border-2 border-dashed rounded-lg p-2 transition-all duration-200 ${
          (isDraggedOver && (canAcceptMore || maxItems === 1)) || isReorderDraggedOver
            ? 'shadow-sm border-solid'
            : isFull
              ? 'bg-dc-surface-secondary'
              : 'bg-dc-surface-secondary hover:bg-dc-surface-hover'
        }`}
        style={{
          borderColor:
            (isDraggedOver && (canAcceptMore || maxItems === 1)) || isReorderDraggedOver
              ? 'var(--dc-primary)'
              : 'var(--dc-border)',
          backgroundColor:
            (isDraggedOver && (canAcceptMore || maxItems === 1)) || isReorderDraggedOver
              ? 'rgba(var(--dc-primary-rgb), 0.1)'
              : undefined
        }}
        onDragOver={(e) => {
          // Check if this is a reorder operation (same axis) - if so, don't interfere
          if (draggedItem && draggedItem.fromAxis === key && draggedItem.fromIndex !== undefined) {
            return
          }

          // Simple acceptance check - either we have space OR it's a single-item replacement
          const canAccept = canAcceptMore || maxItems === 1

          if (canAccept) {
            setIsDraggedOver(true)
            onDragOver(e)
          } else {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'none'
          }
        }}
        onDragLeave={(e) => {
          // Check if we're truly leaving the container
          const rect = e.currentTarget.getBoundingClientRect()
          const isLeavingContainer =
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom

          // Also check if the related target is outside this container
          const relatedTarget = e.relatedTarget as Element | null
          const isRelatedTargetOutside = relatedTarget && !e.currentTarget.contains(relatedTarget)

          if (isLeavingContainer || isRelatedTargetOutside || e.currentTarget === e.target) {
            setIsDraggedOver(false)
            setIsReorderDraggedOver(false)
          }
        }}
        onDrop={(e) => {
          // Check if this is a reorder operation (same axis) - if so, don't interfere
          if (draggedItem && draggedItem.fromAxis === key && draggedItem.fromIndex !== undefined) {
            return
          }

          // Simple acceptance check - either we have space OR it's a single-item replacement
          const shouldAcceptDrop = canAcceptMore || maxItems === 1

          if (shouldAcceptDrop) {
            onDrop(e, key)
          } else {
            e.preventDefault()
          }

          // Reset drag state on drop
          setIsDraggedOver(false)
          setIsReorderDraggedOver(false)
        }}
      >
        {fields.length === 0 ? (
          <div className="text-sm text-dc-text-muted text-center py-2">
            {isFull ? 'Maximum items reached' : emptyText || `Drop fields here`}
          </div>
        ) : (
          <div
            className="space-y-2"
            onDragOver={(e) => {
              // Allow dropping for reorder operations
              if (draggedItem && draggedItem.fromAxis === key) {
                e.preventDefault()
              }
            }}
            onDrop={(e) => {
              // Handle reorder drops at container level
              if (draggedItem && draggedItem.fromAxis === key && draggedItem.fromIndex !== undefined) {
                handleItemDrop(e)
              }
            }}
          >
            {fields.map((field, index) => {
              const meta = getFieldMeta ? getFieldMeta(field) : getDefaultFieldMeta(field)
              const isBeingDragged =
                draggedItem && draggedItem.field === field && draggedItem.fromAxis === key
              const transform = getItemTransform(index)
              const showGapBefore = shouldShowGapIndicator(index)

              return (
                <div
                  key={`${field}-${index}`}
                  className="relative"
                  style={{
                    transform,
                    transition: draggedItem && draggedItem.fromAxis === key ? 'transform 0.15s ease-out' : 'none'
                  }}
                >
                  {/* Gap indicator line - shows where item will be inserted */}
                  {showGapBefore && (
                    <div className="absolute -top-5 left-0 right-0 flex items-center justify-center pointer-events-none z-10">
                      <div className="h-0.5 w-full bg-dc-primary rounded-full" />
                    </div>
                  )}

                  <div
                    draggable
                    onDragStart={(e) => {
                      draggingFieldRef.current = field
                      onDragStart(e, field, key, index)
                    }}
                    onDragEnd={(e) => handleFieldDragEnd(e, field)}
                    onDragOver={(e) => handleItemDragOver(e, index)}
                    onDrop={handleItemDrop}
                    className={`flex items-center gap-2 p-2 bg-dc-surface rounded-lg group hover:bg-dc-surface-tertiary transition-colors cursor-move ${
                      isBeingDragged ? 'opacity-30 cursor-grabbing' : ''
                    }`}
                  >
                    {/* Icon */}
                    {renderFieldIcon(meta)}

                    {/* Field Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-dc-text truncate" title={field}>
                        {meta.shortTitle || meta.title || field.split('.').pop()}
                      </div>
                      <div className="text-xs text-dc-text-muted truncate">{meta.cubeName}</div>
                    </div>

                    {/* L/R Axis Toggle - only for yAxis with dual axis enabled */}
                    {config.enableDualAxis && onYAxisAssignmentChange && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          const currentAxis = yAxisAssignment?.[field] || 'left'
                          onYAxisAssignmentChange(field, currentAxis === 'left' ? 'right' : 'left')
                        }}
                        className={`px-1.5 py-0.5 text-xs font-medium rounded transition-colors flex-shrink-0 ${
                          (yAxisAssignment?.[field] || 'left') === 'left'
                            ? 'bg-dc-info-bg text-dc-info hover:opacity-80'
                            : 'bg-dc-accent-bg text-dc-accent hover:opacity-80'
                        }`}
                        title={`Y-Axis: ${(yAxisAssignment?.[field] || 'left') === 'left' ? 'Left' : 'Right'} (click to toggle)`}
                      >
                        {(yAxisAssignment?.[field] || 'left') === 'left' ? 'L' : 'R'}
                      </button>
                    )}

                    {/* Remove Button - hidden until hover */}
                    <button
                      type="button"
                      onClick={() => onRemove(field, key)}
                      className="p-1 text-dc-text-muted hover:text-dc-danger opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      title={`Remove from ${label}`}
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
            {/* Gap indicator after the last item - shows when dropping at end */}
            {draggedItem && draggedItem.fromAxis === key && dropTargetIndex === fields.length && (
              <div className="relative h-2">
                <div className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-10">
                  <div className="h-0.5 w-full bg-dc-primary rounded-full" />
                </div>
              </div>
            )}
            {/* Handle drop at the end of the list for reordering */}
            {draggedItem && draggedItem.fromAxis === key && fields.length > 1 && (
              <div
                className="h-6"
                onDragOver={(e) => {
                  if (draggedItem.fromIndex !== undefined) {
                    e.preventDefault()
                    const lastIndex = fields.length
                    if (dropTargetIndexRef.current !== lastIndex && draggedItem.fromIndex !== lastIndex - 1) {
                      setDropTargetIndex(lastIndex)
                      dropTargetIndexRef.current = lastIndex
                      setIsReorderDraggedOver(true)
                    }
                  }
                }}
                onDrop={handleItemDrop}
              />
            )}
          </div>
        )}
      </div>

      {mandatory && fields.length === 0 && (
        <div className="text-xs text-dc-error mt-1">This field is required</div>
      )}
    </div>
  )
}
