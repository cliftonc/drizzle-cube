import React from 'react'
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
}

export default function AxisDropZone({
  config,
  fields,
  onDrop,
  onRemove,
  onDragStart,
  onDragOver,
  getFieldStyling
}: AxisDropZoneProps) {
  const { key, label, description, mandatory, maxItems, emptyText, icon: IconComponent } = config
  
  // Check if we can accept more items
  const canAcceptMore = !maxItems || fields.length < maxItems
  const isFull = maxItems && fields.length >= maxItems
  
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
        className={`min-h-[32px] border-2 border-dashed rounded-lg p-1.5 transition-colors flex items-center ${
          isFull 
            ? 'border-gray-200 bg-gray-50' 
            : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
        }`}
        onDragOver={(e) => {
          if (canAcceptMore) {
            onDragOver(e)
          } else {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'none'
          }
        }}
        onDrop={(e) => {
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
            {fields.map((field) => {
              const { IconComponent: FieldIcon, baseClasses, hoverClasses } = getFieldStyling(field)
              return (
                <div
                  key={field}
                  draggable
                  onDragStart={(e) => onDragStart(e, field, key)}
                  className={`rounded text-xs cursor-move px-2 py-1 flex items-center ${baseClasses} ${hoverClasses}`}
                >
                  <FieldIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span>{field}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(field, key)}
                    className="text-gray-600 hover:text-red-600 ml-1.5"
                    title={`Remove from ${label}`}
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
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