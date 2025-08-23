import React, { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { AxisDropZoneConfig } from '../charts/chartConfigs'

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
  onDragStart: (e: React.DragEvent<HTMLDivElement>, field: string, fromKey: string) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  getFieldStyling: (field: string) => FieldStyling
  onReorder?: (fromIndex: number, toIndex: number, axisKey: string) => void
}

export default function AxisDropZone({
  config,
  fields,
  onDrop,
  onRemove,
  onDragStart,
  onDragOver,
  getFieldStyling,
  onReorder
}: AxisDropZoneProps) {
  const { key, label, description, mandatory, maxItems, emptyText, icon: IconComponent } = config
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [draggedFromIndex, setDraggedFromIndex] = useState<number | null>(null)
  const [isDraggingFromSameAxis, setIsDraggingFromSameAxis] = useState(false)
  
  // Check if we can accept more items
  const canAcceptMore = !maxItems || fields.length < maxItems
  const isFull = maxItems && fields.length >= maxItems

  // Helper to handle reordering within the same axis
  const handleReorderDragStart = (e: React.DragEvent<HTMLDivElement>, field: string, index: number) => {
    setDraggedFromIndex(index)
    setIsDraggingFromSameAxis(true)
    
    // Set both the regular drag data and the reorder data
    e.dataTransfer.setData('text/plain', JSON.stringify({ 
      field, 
      fromAxis: key,
      fromIndex: index,
      isReorder: true
    }))
  }

  const handleReorderDragEnd = () => {
    setDraggedFromIndex(null)
    setIsDraggingFromSameAxis(false)
    setDragOverIndex(null)
  }

  const handleReorderDragOver = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    // Only prevent default and show indicator if we're dragging from the same axis
    if (isDraggingFromSameAxis && draggedFromIndex !== null && draggedFromIndex !== targetIndex) {
      e.preventDefault()
      e.stopPropagation()
      setDragOverIndex(targetIndex)
    }
  }

  const handleReorderDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleReorderDrop = (e: React.DragEvent<HTMLDivElement>, targetIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverIndex(null)
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'))
      if (data.isReorder && data.fromAxis === key && onReorder && draggedFromIndex !== null) {
        // Only reorder if we're actually changing positions
        if (draggedFromIndex !== targetIndex) {
          onReorder(draggedFromIndex, targetIndex, key)
        }
      }
    } catch {
      // If we can't parse the data, try using the stored state
      if (isDraggingFromSameAxis && draggedFromIndex !== null && draggedFromIndex !== targetIndex && onReorder) {
        onReorder(draggedFromIndex, targetIndex, key)
      }
    }
    
    handleReorderDragEnd()
  }
  
  return (
    <div className="mb-2">
      <div className="flex items-center gap-2 mb-1">
        <h4 className="text-xs font-semibold flex items-center">
          {IconComponent && <IconComponent className="w-3 h-3 mr-1" />}
          {label}
          {mandatory && <span className="text-red-500 ml-1">*</span>}
          {maxItems && (
            <span className="text-gray-500 ml-1 font-normal">
              ({fields.length}/{maxItems})
            </span>
          )}
        </h4>
        {description && (
          <span className="text-xs text-gray-500">
            {description}
          </span>
        )}
      </div>
      
      <div
        className={`min-h-[40px] sm:min-h-[32px] border-2 border-dashed rounded-lg p-3 sm:p-1.5 transition-colors flex items-center ${
          isFull 
            ? 'border-gray-200 bg-gray-50' 
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
        onDragOver={(e) => {
          // Don't interfere with internal reordering
          if (isDraggingFromSameAxis) {
            return
          }
          
          if (canAcceptMore) {
            onDragOver(e)
          } else {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'none'
          }
        }}
        onDrop={(e) => {
          // Don't interfere with internal reordering
          if (isDraggingFromSameAxis) {
            return
          }
          
          if (canAcceptMore) {
            onDrop(e, key)
          } else {
            e.preventDefault()
          }
        }}
      >
        {fields.length === 0 ? (
          <div className="text-xs text-gray-500 text-center w-full">
            {isFull ? 'Maximum items reached' : (emptyText || `Drop fields here`)}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1">
            {fields.map((field, index) => {
              const { IconComponent: FieldIcon, baseClasses, hoverClasses } = getFieldStyling(field)
              const isDragOver = dragOverIndex === index
              
              return (
                <div
                  key={`${field}-${index}`}
                  className={`relative ${isDragOver ? 'transform scale-105' : ''}`}
                >
                  {/* Drop indicator line for reordering */}
                  {isDragOver && (
                    <div className="absolute -left-1 top-0 bottom-0 w-1 bg-blue-500 rounded-full z-10" />
                  )}
                  
                  <div
                    draggable
                    onDragStart={(e) => {
                      // Handle both regular drag (to other axes) and reorder drag (within same axis)
                      onDragStart(e, field, key)
                      handleReorderDragStart(e, field, index)
                    }}
                    onDragEnd={handleReorderDragEnd}
                    onDragOver={(e) => handleReorderDragOver(e, index)}
                    onDragLeave={handleReorderDragLeave}
                    onDrop={(e) => handleReorderDrop(e, index)}
                    className={`rounded text-xs cursor-move px-3 py-0.5 sm:px-2 sm:py-1 flex items-center transition-transform h-[28px] sm:h-auto ${baseClasses} ${hoverClasses} ${
                      isDragOver ? 'bg-opacity-75' : ''
                    } ${draggedFromIndex === index ? 'opacity-50' : ''}`}
                  >
                    <FieldIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="leading-none">{field}</span>
                    <button
                      type="button"
                      onClick={() => onRemove(field, key)}
                      className="text-gray-600 hover:text-red-600 ml-1.5 leading-none"
                      title={`Remove from ${label}`}
                    >
                      <XMarkIcon className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {mandatory && fields.length === 0 && (
        <div className="text-xs text-red-500 mt-0.5">
          This field is required
        </div>
      )}
    </div>
  )
}