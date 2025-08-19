/**
 * CubeMetaExplorer Component
 * 
 * Displays the cube schema in a collapsible tree view.
 * Users can click on dimensions, measures, and time dimensions to add them to their query.
 */

import React, { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon, ExclamationTriangleIcon, ArrowPathIcon, CogIcon } from '@heroicons/react/24/outline'
import { ChartBarIcon, TagIcon, CalendarIcon } from '@heroicons/react/24/solid'
import type { CubeMetaExplorerProps, MetaCube, MetaField } from './types'

const CubeMetaExplorer: React.FC<CubeMetaExplorerProps> = ({
  schema,
  schemaStatus,
  schemaError,
  selectedFields,
  onFieldSelect,
  onFieldDeselect,
  onRetrySchema,
  onOpenSettings
}) => {
  const [expandedCubes, setExpandedCubes] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  // Loading state
  if (schemaStatus === 'loading') {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <div className="text-sm font-semibold mb-1">Loading Schema...</div>
          <div className="text-xs">Fetching cube metadata</div>
        </div>
      </div>
    )
  }

  // Error state
  if (schemaStatus === 'error') {
    const isCorsError = schemaError?.toLowerCase().includes('cors') || 
                       schemaError?.toLowerCase().includes('fetch')
    
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-sm p-6">
          <ExclamationTriangleIcon className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <div className="text-sm font-semibold text-gray-900 mb-2">
            Failed to Load Schema
          </div>
          <div className="text-xs text-gray-600 mb-4">
            {isCorsError ? (
              <>
                CORS error detected. The API endpoint may be incorrect or not accessible.
              </>
            ) : (
              <>
                {schemaError || 'Unable to connect to the Cube.js API'}
              </>
            )}
          </div>
          
          <div className="space-y-2">
            {onRetrySchema && (
              <button
                onClick={onRetrySchema}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>Retry</span>
              </button>
            )}
            
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <CogIcon className="w-4 h-4" />
                <span>Check API Settings</span>
              </button>
            )}
          </div>
          
          {isCorsError && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="text-xs text-amber-800">
                <div className="font-medium mb-1">Common solutions:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Verify the Base API URL is correct</li>
                  <li>Ensure the server supports CORS</li>
                  <li>Check if authentication is required</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // No schema loaded yet
  if (!schema) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">No Schema</div>
          <div className="text-xs">Schema not loaded</div>
        </div>
      </div>
    )
  }

  const toggleCubeExpansion = (cubeName: string) => {
    const newExpanded = new Set(expandedCubes)
    if (newExpanded.has(cubeName)) {
      newExpanded.delete(cubeName)
    } else {
      newExpanded.add(cubeName)
    }
    setExpandedCubes(newExpanded)
  }

  const toggleSectionExpansion = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey)
    } else {
      newExpanded.add(sectionKey)
    }
    setExpandedSections(newExpanded)
  }

  const handleFieldClick = (field: MetaField, fieldType: 'measures' | 'dimensions' | 'timeDimensions') => {
    const isSelected = (() => {
      switch (fieldType) {
        case 'measures':
          return selectedFields.measures.includes(field.name)
        case 'dimensions':
          return selectedFields.dimensions.includes(field.name)
        case 'timeDimensions':
          return selectedFields.timeDimensions.includes(field.name)
        default:
          return false
      }
    })()

    if (isSelected) {
      onFieldDeselect(field.name, fieldType)
    } else {
      onFieldSelect(field.name, fieldType)
    }
  }

  const filterFields = (fields: MetaField[]): MetaField[] => {
    if (!searchTerm) return fields
    return fields.filter(field => 
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const FieldItem: React.FC<{ 
    field: MetaField
    fieldType: 'measures' | 'dimensions' | 'timeDimensions'
    icon: React.ReactNode
  }> = ({ field, fieldType, icon }) => {
    const isSelected = (() => {
      switch (fieldType) {
        case 'measures':
          return selectedFields.measures.includes(field.name)
        case 'dimensions':
          return selectedFields.dimensions.includes(field.name)
        case 'timeDimensions':
          return selectedFields.timeDimensions.includes(field.name)
        default:
          return false
      }
    })()

    const getSelectedStyles = () => {
      if (!isSelected) return 'hover:bg-gray-100 text-gray-700'
      
      switch (fieldType) {
        case 'measures':
          return 'bg-amber-100 text-amber-800 border border-amber-200'
        case 'dimensions':
          return 'bg-green-100 text-green-800 border border-green-200'
        case 'timeDimensions':
          return 'bg-blue-100 text-blue-800 border border-blue-200'
        default:
          return 'bg-blue-100 text-blue-800 border border-blue-200'
      }
    }

    const getIconColor = () => {
      if (!isSelected) return 'text-gray-400'
      
      switch (fieldType) {
        case 'measures':
          return 'text-amber-600'
        case 'dimensions':
          return 'text-green-600'
        case 'timeDimensions':
          return 'text-blue-600'
        default:
          return 'text-blue-600'
      }
    }

    const getCheckmarkColor = () => {
      switch (fieldType) {
        case 'measures':
          return 'text-amber-600'
        case 'dimensions':
          return 'text-green-600'
        case 'timeDimensions':
          return 'text-blue-600'
        default:
          return 'text-blue-600'
      }
    }

    return (
      <div
        className={`flex items-center px-2 py-1.5 text-xs cursor-pointer rounded-md transition-colors ${getSelectedStyles()}`}
        onClick={() => handleFieldClick(field, fieldType)}
        title={field.description || field.title}
      >
        <div className={`mr-1.5 ${getIconColor()}`}>
          {React.cloneElement(icon as React.ReactElement, { className: 'w-3 h-3' })}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate text-xs">{field.shortTitle}</div>
          <div className="text-xs text-gray-500 truncate">{field.name}</div>
        </div>
        {isSelected && (
          <div className={`ml-1.5 ${getCheckmarkColor()}`}>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>
    )
  }

  const SectionHeader: React.FC<{
    title: string
    count: number
    sectionKey: string
    icon: React.ReactNode
  }> = ({ title, count, sectionKey, icon }) => {
    const isExpanded = expandedSections.has(sectionKey)
    
    return (
      <div
        className="flex items-center px-2 py-1 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 rounded-md"
        onClick={() => toggleSectionExpansion(sectionKey)}
      >
        <div className="mr-1.5">
          {isExpanded ? (
            <ChevronDownIcon className="w-3 h-3" />
          ) : (
            <ChevronRightIcon className="w-3 h-3" />
          )}
        </div>
        <div className="mr-1.5 text-gray-500">
          {React.cloneElement(icon as React.ReactElement, { className: 'w-3 h-3' })}
        </div>
        <span className="flex-1">{title}</span>
        <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Schema Explorer</h3>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Cubes */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {schema.cubes.map((cube: MetaCube) => {
          const isExpanded = expandedCubes.has(cube.name)
          const timeDimensions = cube.dimensions.filter(d => d.type === 'time')
          const regularDimensions = cube.dimensions.filter(d => d.type !== 'time')

          return (
            <div key={cube.name} className="border border-gray-200 rounded-lg">
              {/* Cube Header */}
              <div
                className="flex items-center px-3 py-2 cursor-pointer hover:bg-gray-50 rounded-t-lg"
                onClick={() => toggleCubeExpansion(cube.name)}
              >
                <div className="mr-2">
                  {isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{cube.title}</div>
                  <div className="text-xs text-gray-500">{cube.description}</div>
                </div>
              </div>

              {/* Cube Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-2 space-y-1">
                  {/* Measures */}
                  {cube.measures.length > 0 && (
                    <div>
                      <SectionHeader
                        title="Measures"
                        count={filterFields(cube.measures).length}
                        sectionKey={`${cube.name}-measures`}
                        icon={<ChartBarIcon className="w-4 h-4" />}
                      />
                      {expandedSections.has(`${cube.name}-measures`) && (
                        <div className="ml-5 space-y-1 mt-1">
                          {filterFields(cube.measures).map(measure => (
                            <FieldItem
                              key={measure.name}
                              field={measure}
                              fieldType="measures"
                              icon={<ChartBarIcon className="w-4 h-4" />}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Regular Dimensions */}
                  {regularDimensions.length > 0 && (
                    <div>
                      <SectionHeader
                        title="Dimensions"
                        count={filterFields(regularDimensions).length}
                        sectionKey={`${cube.name}-dimensions`}
                        icon={<TagIcon className="w-4 h-4" />}
                      />
                      {expandedSections.has(`${cube.name}-dimensions`) && (
                        <div className="ml-5 space-y-1 mt-1">
                          {filterFields(regularDimensions).map(dimension => (
                            <FieldItem
                              key={dimension.name}
                              field={dimension}
                              fieldType="dimensions"
                              icon={<TagIcon className="w-4 h-4" />}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Time Dimensions */}
                  {timeDimensions.length > 0 && (
                    <div>
                      <SectionHeader
                        title="Time Dimensions"
                        count={filterFields(timeDimensions).length}
                        sectionKey={`${cube.name}-timeDimensions`}
                        icon={<CalendarIcon className="w-4 h-4" />}
                      />
                      {expandedSections.has(`${cube.name}-timeDimensions`) && (
                        <div className="ml-5 space-y-1 mt-1">
                          {filterFields(timeDimensions).map(timeDimension => (
                            <FieldItem
                              key={timeDimension.name}
                              field={timeDimension}
                              fieldType="timeDimensions"
                              icon={<CalendarIcon className="w-4 h-4" />}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CubeMetaExplorer