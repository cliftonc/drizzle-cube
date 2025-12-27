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

import React, { useState } from 'react'
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
  getFieldMeta
}: AnalysisAxisDropZoneProps) {
  const { key, label, description, mandatory, maxItems, emptyText } = config
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isDraggedOver, setIsDraggedOver] = useState(false)
  const [isReorderDraggedOver, setIsReorderDraggedOver] = useState(false)

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
      setDragOverIndex(null)
      setIsDraggedOver(false)
      setIsReorderDraggedOver(false)
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
        setDragOverIndex(null)
      }
      // If we have a dragged item from this axis, clear regular drag state
      else if (draggedItem.fromAxis === key && draggedItem.fromIndex !== undefined) {
        setIsDraggedOver(false)
      }
    } else {
      // No dragged item, clear all states
      setDragOverIndex(null)
      setIsDraggedOver(false)
      setIsReorderDraggedOver(false)
    }
  }, [draggedItem, key])

  const handleReorderDragOver = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    // Check if this is a reorder operation (same axis) using the draggedItem prop
    if (draggedItem && draggedItem.fromAxis === key && draggedItem.fromIndex !== undefined) {
      e.preventDefault()
      e.stopPropagation()
      setDragOverIndex(targetIndex)
      setIsReorderDraggedOver(true)
    }
  }

  const handleReorderDragLeave = () => {
    // Clear the individual item drag over index
    setDragOverIndex(null)
  }

  const handleReorderDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverIndex(null)
    setIsReorderDraggedOver(false)

    // Handle reordering using either drag data or the draggedItem prop
    if (
      draggedItem &&
      draggedItem.fromAxis === key &&
      draggedItem.fromIndex !== undefined &&
      onReorder
    ) {
      onReorder(draggedItem.fromIndex, targetIndex, key)
      return
    }

    // Fallback to parsing drag data
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (data.fromAxis === key && onReorder && data.fromIndex !== undefined) {
        onReorder(data.fromIndex, targetIndex, key)
      }
    } catch {
      // If we can't parse the data, ignore
    }
  }

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
        <span className="w-6 h-6 flex items-center justify-center rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex-shrink-0">
          <IconComponent className="w-4 h-4" />
        </span>
      )
    } else if (meta.type === 'timeDimension') {
      // Time dimensions get plain icon
      return <TimeDimensionIcon className="w-4 h-4 text-dc-text-secondary flex-shrink-0" />
    } else {
      // Regular dimensions get plain icon
      return <DimensionIcon className="w-4 h-4 text-dc-text-secondary flex-shrink-0" />
    }
  }

  return (
    <div className="mb-3">
      {/* Header */}
      <div className="mb-2">
        <h4 className="text-sm font-medium text-dc-text flex items-center">
          {label}
          {mandatory && <span className="text-red-500 ml-1">*</span>}
        </h4>
        {description && <div className="text-xs text-dc-text-muted mt-0.5">{description}</div>}
      </div>

      {/* Drop Zone Container */}
      <div
        data-axis-container={key}
        className={`min-h-[48px] border-2 border-dashed rounded-lg p-2 transition-all duration-300 ${
          (isDraggedOver && (canAcceptMore || maxItems === 1)) || isReorderDraggedOver
            ? 'shadow-lg border-solid animate-pulse'
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
          <div className="space-y-2">
            {fields.map((field, index) => {
              const meta = getFieldMeta ? getFieldMeta(field) : getDefaultFieldMeta(field)
              const isDragOver = dragOverIndex === index
              const isBeingDragged =
                draggedItem && draggedItem.field === field && draggedItem.fromAxis === key

              return (
                <div key={`${field}-${index}`} className={`relative ${isDragOver ? '' : ''}`}>
                  {/* Drop indicator line for reordering */}
                  {isDragOver && (
                    <div
                      className="absolute -top-1 left-0 right-0 h-0.5 rounded-full z-10"
                      style={{ backgroundColor: 'var(--dc-primary)' }}
                    />
                  )}

                  <div
                    draggable
                    onDragStart={(e) => {
                      onDragStart(e, field, key, index)
                    }}
                    onDragEnd={onDragEnd}
                    onDragOver={(e) => handleReorderDragOver(e, index)}
                    onDragLeave={handleReorderDragLeave}
                    onDrop={(e) => handleReorderDrop(e, index)}
                    className={`flex items-center gap-2 p-2 bg-dc-surface rounded-lg group hover:bg-dc-surface-tertiary transition-colors cursor-move ${
                      isBeingDragged ? 'opacity-50 cursor-grabbing' : ''
                    } ${isDragOver ? 'mt-1' : ''}`}
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
          </div>
        )}
      </div>

      {mandatory && fields.length === 0 && (
        <div className="text-xs text-red-500 mt-1">This field is required</div>
      )}
    </div>
  )
}
