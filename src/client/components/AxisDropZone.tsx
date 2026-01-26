import React, { useState } from 'react'
import { getIcon } from '../icons'
import type { AxisDropZoneConfig } from '../charts/chartConfigs'

const CloseIcon = getIcon('close')

interface FieldStyling {
  IconComponent: React.ComponentType<{ className?: string }>
  baseClasses: string
  hoverClasses: string
}

interface AxisDropZoneProps {
  config: AxisDropZoneConfig
  fields: string[]
  onDrop: (e: React.DragEvent<HTMLDivElement>, toKey: string) => void
  onRemove: (field: string, fromKey: string) => void
  onDragStart: (e: React.DragEvent<HTMLDivElement>, field: string, fromKey: string, fromIndex?: number) => void
  onDragEnd?: (e: React.DragEvent<HTMLDivElement>) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  getFieldStyling: (field: string) => FieldStyling
  onReorder?: (fromIndex: number, toIndex: number, axisKey: string) => void
  draggedItem?: { field: string; fromAxis: string; fromIndex?: number } | null
}

export default function AxisDropZone({
  config,
  fields,
  onDrop,
  onRemove,
  onDragStart,
  onDragEnd,
  onDragOver,
  getFieldStyling,
  onReorder,
  draggedItem
}: AxisDropZoneProps) {
  const { key, label, description, mandatory, maxItems, emptyText, icon: IconComponent } = config
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
    // Note: Don't clear isReorderDraggedOver here as it causes flickering
    // Let the global drag end handler clear it when the drag is truly complete
  }

  const handleReorderDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverIndex(null)
    setIsReorderDraggedOver(false)
    
    // Handle reordering using either drag data or the draggedItem prop
    if (draggedItem && draggedItem.fromAxis === key && draggedItem.fromIndex !== undefined && onReorder) {
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
  
  return (
    <div className="dc:mb-2">
      <div className="dc:flex dc:items-center dc:gap-2 dc:mb-1">
        <h4 className="dc:text-xs dc:font-semibold text-dc-text-secondary dc:flex dc:items-center">
          {IconComponent && <IconComponent className="dc:w-3 dc:h-3 dc:mr-1 text-dc-text-muted" />}
          {label}
          {mandatory && <span className="text-dc-error dc:ml-1">*</span>}
          {maxItems && (
            <span className="text-dc-text-muted dc:ml-1 dc:font-normal">
              ({fields.length}/{maxItems})
            </span>
          )}
        </h4>
        {description && (
          <span className="dc:text-xs text-dc-text-muted">
            {description}
          </span>
        )}
      </div>
      
      <div
        data-axis-container={key}
        className={`dc:min-h-[40px] dc:sm:min-h-[32px] dc:border-2 dc:border-dashed dc:rounded-lg dc:p-3 dc:sm:p-1.5 dc:transition-all dc:duration-300 dc:flex dc:items-center ${
          (isDraggedOver && (canAcceptMore || maxItems === 1)) || isReorderDraggedOver
            ? 'dc:shadow-lg dc:scale-110 dc:border-solid dc:animate-pulse'
            : isFull
              ? 'bg-dc-surface-secondary'
              : 'bg-dc-surface-secondary hover:bg-dc-surface-hover'
        }`}
        style={{
          borderColor: (isDraggedOver && (canAcceptMore || maxItems === 1)) || isReorderDraggedOver
            ? 'var(--dc-primary)'
            : 'var(--dc-border)',
          backgroundColor: (isDraggedOver && (canAcceptMore || maxItems === 1)) || isReorderDraggedOver
            ? 'rgba(var(--dc-primary-rgb), 0.1)'
            : undefined
        }}
        onDragOver={(e) => {
          // Check if this is a reorder operation (same axis) - if so, don't interfere
          if (draggedItem && draggedItem.fromAxis === key && draggedItem.fromIndex !== undefined) {
            return
          }
          
          // Simple acceptance check - either we have space OR it's a single-item replacement
          const canAccept = canAcceptMore || (maxItems === 1)
          
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
          const isLeavingContainer = (
            e.clientX < rect.left || 
            e.clientX > rect.right || 
            e.clientY < rect.top || 
            e.clientY > rect.bottom
          )
          
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
          const shouldAcceptDrop = canAcceptMore || (maxItems === 1)
          
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
          <div className="dc:text-xs text-dc-text-muted text-center dc:w-full">
            {isFull ? 'Maximum items reached' : (emptyText || `Drop fields here`)}
          </div>
        ) : (
          <div className="dc:flex dc:flex-wrap dc:gap-1">
            {fields.map((field, index) => {
              const { IconComponent: FieldIcon, baseClasses, hoverClasses } = getFieldStyling(field)
              const isDragOver = dragOverIndex === index
              const isBeingDragged = draggedItem && draggedItem.field === field && draggedItem.fromAxis === key
              
              return (
                <div
                  key={`${field}-${index}`}
                  className={`dc:relative ${isDragOver ? 'dc:transform dc:scale-105' : ''}`}
                >
                  {/* Drop indicator line for reordering */}
                  {isDragOver && (
                    <div className="dc:absolute dc:-left-1 dc:top-0 dc:bottom-0 dc:w-1 dc:rounded-full dc:z-10" style={{ backgroundColor: 'var(--dc-primary)' }} />
                  )}
                  
                  <div
                    draggable
                    onDragStart={(e) => {
                      // Let parent handle drag data with index
                      onDragStart(e, field, key, index)
                    }}
                    onDragEnd={onDragEnd}
                    onDragOver={(e) => handleReorderDragOver(e, index)}
                    onDragLeave={handleReorderDragLeave}
                    onDrop={(e) => handleReorderDrop(e, index)}
                    className={`dc:rounded dc:text-xs dc:cursor-move dc:px-3 dc:py-0.5 dc:sm:px-2 dc:sm:py-1 dc:flex dc:items-center dc:transition-transform dc:h-[28px] dc:sm:h-auto ${baseClasses} ${hoverClasses} ${
                      isDragOver ? 'bg-opacity-75' : ''
                    } ${isBeingDragged ? 'dc:opacity-50 dc:cursor-grabbing' : ''}`}
                  >
                    <FieldIcon className="dc:w-3 dc:h-3 dc:mr-1 dc:shrink-0" />
                    <span className="dc:leading-none">{field}</span>
                    <button
                      type="button"
                      onClick={() => onRemove(field, key)}
                      className="text-dc-text-secondary hover:text-dc-danger dc:ml-1.5 dc:leading-none"
                      title={`Remove from ${label}`}
                    >
                      <CloseIcon className="dc:w-3 dc:h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {mandatory && fields.length === 0 && (
        <div className="dc:text-xs text-dc-error dc:mt-0.5">
          This field is required
        </div>
      )}
    </div>
  )
}