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
    <div className="mb-2">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="text-xs font-semibold text-dc-text-secondary flex items-center">
          {IconComponent && <IconComponent className="w-3 h-3 mr-1 text-dc-text-muted" />}
          {label}
          {mandatory && <span className="text-dc-error ml-1">*</span>}
          {maxItems && (
            <span className="text-dc-text-muted ml-1 font-normal">
              ({fields.length}/{maxItems})
            </span>
          )}
        </h4>
        {description && (
          <span className="text-xs text-dc-text-muted">
            {description}
          </span>
        )}
      </div>
      
      <div
        data-axis-container={key}
        className={`min-h-[40px] sm:min-h-[32px] border-2 border-dashed rounded-lg p-3 sm:p-1.5 transition-all duration-300 flex items-center ${
          (isDraggedOver && (canAcceptMore || maxItems === 1)) || isReorderDraggedOver
            ? 'shadow-lg scale-110 border-solid animate-pulse'
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
          <div className="text-xs text-dc-text-muted text-center w-full">
            {isFull ? 'Maximum items reached' : (emptyText || `Drop fields here`)}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {fields.map((field, index) => {
              const { IconComponent: FieldIcon, baseClasses, hoverClasses } = getFieldStyling(field)
              const isDragOver = dragOverIndex === index
              const isBeingDragged = draggedItem && draggedItem.field === field && draggedItem.fromAxis === key
              
              return (
                <div
                  key={`${field}-${index}`}
                  className={`relative ${isDragOver ? 'transform scale-105' : ''}`}
                >
                  {/* Drop indicator line for reordering */}
                  {isDragOver && (
                    <div className="absolute -left-1 top-0 bottom-0 w-1 rounded-full z-10" style={{ backgroundColor: 'var(--dc-primary)' }} />
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
                    className={`rounded text-xs cursor-move px-3 py-0.5 sm:px-2 sm:py-1 flex items-center transition-transform h-[28px] sm:h-auto ${baseClasses} ${hoverClasses} ${
                      isDragOver ? 'bg-opacity-75' : ''
                    } ${isBeingDragged ? 'opacity-50 cursor-grabbing' : ''}`}
                  >
                    <FieldIcon className="w-3 h-3 mr-1 shrink-0" />
                    <span className="leading-none">{field}</span>
                    <button
                      type="button"
                      onClick={() => onRemove(field, key)}
                      className="text-dc-text-secondary hover:text-dc-danger ml-1.5 leading-none"
                      title={`Remove from ${label}`}
                    >
                      <CloseIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {mandatory && fields.length === 0 && (
        <div className="text-xs text-dc-error mt-0.5">
          This field is required
        </div>
      )}
    </div>
  )
}