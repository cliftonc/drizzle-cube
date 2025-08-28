import React, { useMemo, useEffect } from 'react'
import { ChartBarIcon, TagIcon, CalendarIcon } from '@heroicons/react/24/outline'
import AxisDropZone from './AxisDropZone'
import { chartConfigRegistry } from '../charts/chartConfigRegistry'
import { getChartConfig } from '../charts/chartConfigs'
import type { ChartType, ChartAxisConfig, ChartDisplayConfig } from '../types'

interface ChartConfigPanelProps {
  chartType: ChartType
  chartConfig: ChartAxisConfig
  displayConfig: ChartDisplayConfig
  availableFields: {
    dimensions: string[]
    timeDimensions: string[]
    measures: string[]
  } | null
  onChartConfigChange: (config: ChartAxisConfig) => void
  onDisplayConfigChange: (config: ChartDisplayConfig) => void
}

export default function ChartConfigPanel({
  chartType,
  chartConfig,
  displayConfig,
  availableFields,
  onChartConfigChange,
  onDisplayConfigChange
}: ChartConfigPanelProps) {
  
  // Get configuration for current chart type
  const chartTypeConfig = useMemo(() => 
    getChartConfig(chartType, chartConfigRegistry),
    [chartType]
  )

  // Get fields for each drop zone
  const getFieldsForDropZone = (key: string): string[] => {
    const value = chartConfig[key as keyof ChartAxisConfig]
    if (Array.isArray(value)) return value
    if (typeof value === 'string') return [value]
    return []
  }

  // Clean up chart config when available fields change
  useEffect(() => {
    if (!availableFields) return

    const allAvailableFields = [
      ...availableFields.dimensions,
      ...availableFields.timeDimensions,
      ...availableFields.measures
    ]

    let hasChanges = false
    const newConfig = { ...chartConfig }

    // Check each axis and remove fields that are no longer available
    chartTypeConfig.dropZones.forEach(dropZone => {
      const currentFields = getFieldsForDropZone(dropZone.key)
      const validFields = currentFields.filter(field => allAvailableFields.includes(field))
      
      if (validFields.length !== currentFields.length) {
        hasChanges = true
        if (validFields.length === 0) {
          // Remove the axis property entirely if no valid fields remain
          delete newConfig[dropZone.key as keyof ChartAxisConfig]
        } else if (dropZone.maxItems === 1) {
          // Single field axis - always store as string
          newConfig[dropZone.key as keyof ChartAxisConfig] = validFields[0] as any
        } else {
          // Multi-field axis - always store as array
          newConfig[dropZone.key as keyof ChartAxisConfig] = validFields as any
        }
      }
    })

    if (hasChanges) {
      onChartConfigChange(newConfig)
    }
  }, [availableFields, chartConfig, chartTypeConfig.dropZones, onChartConfigChange])

  // Helper to determine field type and styling
  const getFieldType = (field: string): 'dimension' | 'timeDimension' | 'measure' => {
    if (!availableFields) return 'dimension'
    if (availableFields.measures.includes(field)) return 'measure'
    if (availableFields.timeDimensions.includes(field)) return 'timeDimension'
    return 'dimension'
  }

  const getFieldStyling = (field: string) => {
    const fieldType = getFieldType(field)
    
    switch (fieldType) {
      case 'measure':
        return {
          IconComponent: ChartBarIcon,
          baseClasses: 'bg-amber-100 text-amber-800 border border-amber-200',
          hoverClasses: 'hover:bg-amber-200'
        }
      case 'timeDimension':
        return {
          IconComponent: CalendarIcon,
          baseClasses: 'bg-blue-100 text-blue-800 border border-blue-200',
          hoverClasses: 'hover:bg-blue-200'
        }
      default:
        return {
          IconComponent: TagIcon,
          baseClasses: 'bg-green-100 text-green-800 border border-green-200',
          hoverClasses: 'hover:bg-green-200'
        }
    }
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, field: string, fromAxis: string) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ field, fromAxis }))
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, toAxis: string) => {
    e.preventDefault()
    const data = JSON.parse(e.dataTransfer.getData('text/plain'))
    const { field, fromAxis, isReorder } = data
    
    // Don't handle reorder drops here - let the AxisDropZone handle them
    if (isReorder && fromAxis === toAxis) {
      return
    }
    
    const newConfig = { ...chartConfig }
    
    // Remove from old location if moving between axes
    if (fromAxis !== 'available' && fromAxis !== toAxis) {
      const fromValue = newConfig[fromAxis as keyof ChartAxisConfig]
      if (Array.isArray(fromValue)) {
        newConfig[fromAxis as keyof ChartAxisConfig] = fromValue.filter(f => f !== field) as any
      } else if (fromValue === field) {
        delete newConfig[fromAxis as keyof ChartAxisConfig]
      }
    }
    
    // Add to new location
    const toValue = newConfig[toAxis as keyof ChartAxisConfig]
    const dropZoneConfig = chartTypeConfig.dropZones.find(dz => dz.key === toAxis)
    
    if (dropZoneConfig?.maxItems === 1) {
      // Single field - always store as string
      newConfig[toAxis as keyof ChartAxisConfig] = field as any
    } else {
      // Multiple fields - always store as array
      if (Array.isArray(toValue)) {
        if (!toValue.includes(field)) {
          newConfig[toAxis as keyof ChartAxisConfig] = [...toValue, field] as any
        }
      } else {
        newConfig[toAxis as keyof ChartAxisConfig] = [field] as any
      }
    }
    
    onChartConfigChange(newConfig)
  }

  const handleRemoveFromAxis = (field: string, fromAxis: string) => {
    const newConfig = { ...chartConfig }
    const value = newConfig[fromAxis as keyof ChartAxisConfig]
    
    if (Array.isArray(value)) {
      newConfig[fromAxis as keyof ChartAxisConfig] = value.filter(f => f !== field) as any
    } else if (value === field) {
      delete newConfig[fromAxis as keyof ChartAxisConfig]
    }
    
    onChartConfigChange(newConfig)
  }

  const handleReorder = (fromIndex: number, toIndex: number, axisKey: string) => {
    const newConfig = { ...chartConfig }
    const value = newConfig[axisKey as keyof ChartAxisConfig]
    
    // Only reorder if we have an array with multiple items
    if (Array.isArray(value) && value.length > 1 && fromIndex !== toIndex) {
      const newArray = [...value]
      const [movedItem] = newArray.splice(fromIndex, 1)
      newArray.splice(toIndex, 0, movedItem)
      newConfig[axisKey as keyof ChartAxisConfig] = newArray as any
      onChartConfigChange(newConfig)
    }
  }

  // Get unassigned fields
  const getUnassignedFields = () => {
    if (!availableFields) return { dimensions: [], timeDimensions: [], measures: [] }
    
    const assignedFields = new Set<string>()
    chartTypeConfig.dropZones.forEach(dz => {
      getFieldsForDropZone(dz.key).forEach(field => assignedFields.add(field))
    })
    
    return {
      dimensions: availableFields.dimensions.filter(f => !assignedFields.has(f)),
      timeDimensions: availableFields.timeDimensions.filter(f => !assignedFields.has(f)),
      measures: availableFields.measures.filter(f => !assignedFields.has(f))
    }
  }

  const unassignedFields = getUnassignedFields()


  return (
    <div>
      {/* Available Fields */}
      {availableFields && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold mb-2">Available Fields</h4>
          <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
            {(unassignedFields.dimensions.length > 0 || 
              unassignedFields.timeDimensions.length > 0 || 
              unassignedFields.measures.length > 0) ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2 gap-y-4 sm:gap-y-2">
                {/* Dimensions Column */}
                <div className="pb-2 sm:pb-0">
                  <div className="text-xs text-gray-600 mb-2 sm:mb-1 flex items-center">
                    <TagIcon className="w-3 h-3 mr-1" />
                    Dimensions
                  </div>
                  <div className="space-y-1">
                    {unassignedFields.dimensions.map(dim => (
                      <div
                        key={dim}
                        draggable
                        onDragStart={(e) => handleDragStart(e, dim, 'available')}
                        className="bg-green-100 text-green-800 border border-green-200 hover:bg-green-200 rounded text-xs cursor-move px-3 py-2 sm:px-2 sm:py-1 truncate"
                        title={dim}
                      >
                        {dim}
                      </div>
                    ))}
                    {unassignedFields.dimensions.length === 0 && (
                      <div className="text-xs text-gray-400 italic">None</div>
                    )}
                  </div>
                </div>
                
                {/* Time Dimensions Column */}
                <div className="pb-2 sm:pb-0">
                  <div className="text-xs text-gray-600 mb-2 sm:mb-1 flex items-center">
                    <CalendarIcon className="w-3 h-3 mr-1" />
                    Time Dimensions
                  </div>
                  <div className="space-y-1">
                    {unassignedFields.timeDimensions.map(dim => (
                      <div
                        key={dim}
                        draggable
                        onDragStart={(e) => handleDragStart(e, dim, 'available')}
                        className="bg-blue-100 text-blue-800 border border-blue-200 hover:bg-blue-200 rounded text-xs cursor-move px-3 py-2 sm:px-2 sm:py-1 truncate"
                        title={dim}
                      >
                        {dim}
                      </div>
                    ))}
                    {unassignedFields.timeDimensions.length === 0 && (
                      <div className="text-xs text-gray-400 italic">None</div>
                    )}
                  </div>
                </div>
                
                {/* Measures Column */}
                <div className="pb-2 sm:pb-0">
                  <div className="text-xs text-gray-600 mb-2 sm:mb-1 flex items-center">
                    <ChartBarIcon className="w-3 h-3 mr-1" />
                    Measures
                  </div>
                  <div className="space-y-1">
                    {unassignedFields.measures.map(measure => (
                      <div
                        key={measure}
                        draggable
                        onDragStart={(e) => handleDragStart(e, measure, 'available')}
                        className="bg-amber-100 text-amber-800 border border-amber-200 hover:bg-amber-200 rounded text-xs cursor-move px-3 py-2 sm:px-2 sm:py-1 truncate"
                        title={measure}
                      >
                        {measure}
                      </div>
                    ))}
                    {unassignedFields.measures.length === 0 && (
                      <div className="text-xs text-gray-400 italic">None</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-500 text-center py-2">
                All fields have been assigned
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chart Axis Configuration - Dynamic Drop Zones */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold mb-2">Chart Configuration</h4>
        <div className="space-y-1">
          {chartTypeConfig.dropZones.map(dropZone => (
            <AxisDropZone
              key={dropZone.key}
              config={dropZone}
              fields={getFieldsForDropZone(dropZone.key)}
              onDrop={handleDrop}
              onRemove={handleRemoveFromAxis}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              getFieldStyling={getFieldStyling}
              onReorder={handleReorder}
            />
          ))}
        </div>
      </div>

      {/* Display Options */}
      {((chartTypeConfig.displayOptions && chartTypeConfig.displayOptions.length > 0) || 
        (chartTypeConfig.displayOptionsConfig && chartTypeConfig.displayOptionsConfig.length > 0)) && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold mb-2">Display Options</h4>
          <div className="space-y-2">
            {/* Backward compatibility: Simple boolean display options */}
            {chartTypeConfig.displayOptions?.includes('showLegend') && (
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={displayConfig.showLegend ?? true}
                  onChange={(e) => onDisplayConfigChange({
                    ...displayConfig,
                    showLegend: e.target.checked
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Show Legend</span>
              </label>
            )}
            
            {chartTypeConfig.displayOptions?.includes('showGrid') && (
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={displayConfig.showGrid ?? true}
                  onChange={(e) => onDisplayConfigChange({
                    ...displayConfig,
                    showGrid: e.target.checked
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Show Grid</span>
              </label>
            )}
            
            {chartTypeConfig.displayOptions?.includes('showTooltip') && (
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={displayConfig.showTooltip ?? true}
                  onChange={(e) => onDisplayConfigChange({
                    ...displayConfig,
                    showTooltip: e.target.checked
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Show Tooltip</span>
              </label>
            )}
            
            {chartTypeConfig.displayOptions?.includes('stacked') && (
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={displayConfig.stacked ?? false}
                  onChange={(e) => onDisplayConfigChange({
                    ...displayConfig,
                    stacked: e.target.checked
                  })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">Stacked</span>
              </label>
            )}

            {/* New structured display options */}
            {chartTypeConfig.displayOptionsConfig?.map((option) => (
              <div key={option.key} className="space-y-1">
                {option.type === 'boolean' && (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={displayConfig[option.key as keyof ChartDisplayConfig] ?? option.defaultValue ?? false}
                      onChange={(e) => onDisplayConfigChange({
                        ...displayConfig,
                        [option.key]: e.target.checked
                      })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                )}

                {option.type === 'string' && (
                  <div className="space-y-1">
                    <label className="text-sm text-gray-700">{option.label}</label>
                    <input
                      type="text"
                      value={displayConfig[option.key as keyof ChartDisplayConfig] ?? option.defaultValue ?? ''}
                      onChange={(e) => onDisplayConfigChange({
                        ...displayConfig,
                        [option.key]: e.target.value
                      })}
                      placeholder={option.placeholder}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                    {option.description && (
                      <p className="text-xs text-gray-500">{option.description}</p>
                    )}
                  </div>
                )}

                {option.type === 'number' && (
                  <div className="space-y-1">
                    <label className="text-sm text-gray-700">{option.label}</label>
                    <input
                      type="number"
                      value={displayConfig[option.key as keyof ChartDisplayConfig] ?? option.defaultValue ?? 0}
                      onChange={(e) => onDisplayConfigChange({
                        ...displayConfig,
                        [option.key]: e.target.value === '' ? undefined : Number(e.target.value)
                      })}
                      placeholder={option.placeholder}
                      min={option.min}
                      max={option.max}
                      step={option.step}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    />
                    {option.description && (
                      <p className="text-xs text-gray-500">{option.description}</p>
                    )}
                  </div>
                )}

                {option.type === 'select' && (
                  <div className="space-y-1">
                    <label className="text-sm text-gray-700">{option.label}</label>
                    <select
                      value={displayConfig[option.key as keyof ChartDisplayConfig] ?? option.defaultValue ?? ''}
                      onChange={(e) => onDisplayConfigChange({
                        ...displayConfig,
                        [option.key]: e.target.value
                      })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    >
                      {option.options?.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    {option.description && (
                      <p className="text-xs text-gray-500">{option.description}</p>
                    )}
                  </div>
                )}

                {option.type === 'color' && (
                  <div className="space-y-1">
                    <label className="text-sm text-gray-700">{option.label}</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={displayConfig[option.key as keyof ChartDisplayConfig] ?? option.defaultValue ?? '#8884d8'}
                        onChange={(e) => onDisplayConfigChange({
                          ...displayConfig,
                          [option.key]: e.target.value
                        })}
                        className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={displayConfig[option.key as keyof ChartDisplayConfig] ?? option.defaultValue ?? '#8884d8'}
                        onChange={(e) => onDisplayConfigChange({
                          ...displayConfig,
                          [option.key]: e.target.value
                        })}
                        placeholder={option.placeholder || '#8884d8'}
                        className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    {option.description && (
                      <p className="text-xs text-gray-500">{option.description}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}