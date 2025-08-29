/**
 * CubeMetaExplorer Component
 * 
 * Displays the cube schema in a collapsible tree view.
 * Users can click on dimensions, measures, and time dimensions to add them to their query.
 */

import React, { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon, ExclamationTriangleIcon, ArrowPathIcon, CogIcon, ArrowsPointingOutIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { ChartBarIcon, TagIcon, CalendarIcon, RectangleGroupIcon, ListBulletIcon } from '@heroicons/react/24/solid'
import type { CubeMetaExplorerProps, MetaCube, MetaField } from './types'
import { CubeRelationshipDiagram } from '../CubeRelationshipDiagram'

type SchemaViewType = 'tree' | 'diagram'

const CubeMetaExplorer: React.FC<CubeMetaExplorerProps> = ({
  schema,
  schemaStatus,
  schemaError,
  selectedFields,
  onFieldSelect,
  onFieldDeselect,
  onRetrySchema,
  onOpenSettings,
  onExpandSchema,
  onViewTypeChange,
  isExpanded = false
}) => {
  const [expandedCubes, setExpandedCubes] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [viewType, setViewType] = useState<SchemaViewType>('tree')
  
  // Track the original expansion state before search
  const [preSearchExpandedCubes, setPreSearchExpandedCubes] = useState<Set<string> | null>(null)
  const [preSearchExpandedSections, setPreSearchExpandedSections] = useState<Set<string> | null>(null)

  // Auto-switch to diagram view when expanded
  React.useEffect(() => {
    if (isExpanded) {
      setViewType('diagram')
    }
  }, [isExpanded])

  // Auto-expand cubes and sections that contain search matches
  React.useEffect(() => {
    if (!schema) {
      return
    }

    const hasSearchTerm = searchTerm.trim().length > 0

    if (hasSearchTerm) {
      // Save current state before expanding for search (only if not already saved)
      if (preSearchExpandedCubes === null) {
        setPreSearchExpandedCubes(new Set(expandedCubes))
        setPreSearchExpandedSections(new Set(expandedSections))
      }

      const newExpandedCubes = new Set<string>()
      const newExpandedSections = new Set<string>()

      schema.cubes.forEach((cube: MetaCube) => {
        let cubeHasMatches = false

        // Check measures
        const matchingMeasures = cube.measures.filter(field => 
          field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
        if (matchingMeasures.length > 0) {
          cubeHasMatches = true
          newExpandedSections.add(`${cube.name}-measures`)
        }

        // Check regular dimensions
        const regularDimensions = cube.dimensions.filter(d => d.type !== 'time')
        const matchingDimensions = regularDimensions.filter(field => 
          field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
        if (matchingDimensions.length > 0) {
          cubeHasMatches = true
          newExpandedSections.add(`${cube.name}-dimensions`)
        }

        // Check time dimensions
        const timeDimensions = cube.dimensions.filter(d => d.type === 'time')
        const matchingTimeDimensions = timeDimensions.filter(field => 
          field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
        if (matchingTimeDimensions.length > 0) {
          cubeHasMatches = true
          newExpandedSections.add(`${cube.name}-timeDimensions`)
        }

        // If cube has any matches, expand it
        if (cubeHasMatches) {
          newExpandedCubes.add(cube.name)
        }
      })

      // Combine pre-search state with search expansions
      const combinedCubes = new Set([...(preSearchExpandedCubes || []), ...newExpandedCubes])
      const combinedSections = new Set([...(preSearchExpandedSections || []), ...newExpandedSections])
      
      setExpandedCubes(combinedCubes)
      setExpandedSections(combinedSections)
    } else {
      // No search term - restore original state if we have it saved
      if (preSearchExpandedCubes !== null && preSearchExpandedSections !== null) {
        setExpandedCubes(preSearchExpandedCubes)
        setExpandedSections(preSearchExpandedSections)
        setPreSearchExpandedCubes(null)
        setPreSearchExpandedSections(null)
      }
    }
  }, [schema, searchTerm, preSearchExpandedCubes, preSearchExpandedSections])

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
    
    // If we're in search mode, also update the pre-search state
    if (preSearchExpandedCubes !== null) {
      const newPreSearchExpanded = new Set(preSearchExpandedCubes)
      if (newPreSearchExpanded.has(cubeName)) {
        newPreSearchExpanded.delete(cubeName)
      } else {
        newPreSearchExpanded.add(cubeName)
      }
      setPreSearchExpandedCubes(newPreSearchExpanded)
    }
  }

  const toggleSectionExpansion = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey)
    } else {
      newExpanded.add(sectionKey)
    }
    setExpandedSections(newExpanded)
    
    // If we're in search mode, also update the pre-search state
    if (preSearchExpandedSections !== null) {
      const newPreSearchExpanded = new Set(preSearchExpandedSections)
      if (newPreSearchExpanded.has(sectionKey)) {
        newPreSearchExpanded.delete(sectionKey)
      } else {
        newPreSearchExpanded.add(sectionKey)
      }
      setPreSearchExpandedSections(newPreSearchExpanded)
    }
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

  const cubeHasMatches = (cube: MetaCube): boolean => {
    if (!searchTerm.trim()) return true
    
    const measureMatches = cube.measures.some(field => 
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    const dimensionMatches = cube.dimensions.some(field => 
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
    
    return measureMatches || dimensionMatches
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
    
    // Get section type from sectionKey to apply consistent colors
    const getSectionType = (): 'dimensions' | 'timeDimensions' | 'measures' => {
      if (sectionKey.includes('-dimensions') && !sectionKey.includes('-timeDimensions')) {
        return 'dimensions'
      } else if (sectionKey.includes('-timeDimensions')) {
        return 'timeDimensions'
      } else {
        return 'measures'
      }
    }
    
    const getSectionColorClasses = () => {
      const sectionType = getSectionType()
      switch (sectionType) {
        case 'dimensions':
          return 'text-green-800'
        case 'timeDimensions':
          return 'text-blue-800'
        case 'measures':
          return 'text-amber-800'
        default:
          return 'text-gray-700'
      }
    }
    
    return (
      <div
        className={`flex items-center px-2 py-1 text-sm font-semibold cursor-pointer hover:bg-gray-50 rounded-md ${getSectionColorClasses()}`}
        onClick={() => toggleSectionExpansion(sectionKey)}
      >
        <div className="mr-1.5">
          {isExpanded ? (
            <ChevronDownIcon className="w-3 h-3" />
          ) : (
            <ChevronRightIcon className="w-3 h-3" />
          )}
        </div>
        <div className="mr-1.5">
          {icon}
        </div>
        <span className="flex-1">{title}</span>
        <span className="text-xs text-gray-500 bg-gray-200 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      </div>
    )
  }

  const NoMatchesMessage: React.FC = () => (
    <div className="flex items-center justify-center py-8 text-center">
      <div className="max-w-sm">
        <div className="text-gray-400 mb-2">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div className="text-sm font-medium text-gray-900 mb-1">No matches found</div>
        <div className="text-xs text-gray-500 mb-3">
          No fields match your search term "{searchTerm}"
        </div>
        <button
          onClick={() => setSearchTerm('')}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Clear search
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-lg min-h-0">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="p-3 pb-0">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold text-gray-900">
                {viewType === 'diagram' ? 'Schema Diagram' : 'Schema Explorer'}
              </h3>
            </div>
            <div className="flex items-center space-x-2">
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Open settings"
                >
                  <CogIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* View Type Tabs and Search */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-md">
              <button
                onClick={() => {
                  setViewType('tree')
                  onViewTypeChange?.('tree')
                }}
                className={`
                  flex items-center px-3 py-1.5 rounded text-xs font-medium transition-colors
                  ${viewType === 'tree' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <ListBulletIcon className="w-3 h-3 mr-1.5" />
                Fields
              </button>
              <button
                onClick={() => {
                  setViewType('diagram')
                  onViewTypeChange?.('diagram')
                }}
                className={`
                  flex items-center px-3 py-1.5 rounded text-xs font-medium transition-colors
                  ${viewType === 'diagram' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                  }
                `}
              >
                <RectangleGroupIcon className="w-3 h-3 mr-1.5" />
                Schema
              </button>
            </div>
            
            {/* Search input - visible for both views */}
            <div className="flex-1 relative min-w-0">
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
        </div>
        
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {viewType === 'diagram' ? (
          /* Diagram View - schema relationship diagram */
          <div className="h-full">
            <CubeRelationshipDiagram
              className="h-full"
              onCubeClick={(cubeName) => {
                if (!isExpanded) {
                  // Auto-expand the clicked cube in tree view
                  setExpandedCubes(prev => new Set([...prev, cubeName]))
                  // Switch to tree view to show the expanded cube
                  setViewType('tree')
                }
              }}
              onFieldClick={(cubeName, fieldName, fieldType) => {
                // Convert field type to QueryBuilder expected type and determine if time dimension
                let qbFieldType: 'measures' | 'dimensions' | 'timeDimensions'
                
                if (fieldType === 'measure') {
                  qbFieldType = 'measures'
                } else {
                  // For dimensions, check if it's a time dimension by looking at the schema
                  const cube = schema?.cubes.find(c => c.name === cubeName)
                  const dimension = cube?.dimensions.find(d => 
                    d.name === `${cubeName}.${fieldName}` || d.name === fieldName
                  )
                  
                  qbFieldType = dimension?.type === 'time' ? 'timeDimensions' : 'dimensions'
                }
                
                const fullFieldName = `${cubeName}.${fieldName}`
                
                // Check if field is already selected
                const isSelected = selectedFields[qbFieldType].includes(fullFieldName)
                
                if (isSelected) {
                  // Remove the field from the query
                  onFieldDeselect(fullFieldName, qbFieldType)
                } else {
                  // Add the field to the query
                  onFieldSelect(fullFieldName, qbFieldType)
                }
              }}
              highlightedCubes={[
                ...selectedFields.measures.map(field => field.split('.')[0]),
                ...selectedFields.dimensions.map(field => field.split('.')[0]),
                ...selectedFields.timeDimensions.map(field => field.split('.')[0])
              ].filter((cube, index, arr) => arr.indexOf(cube) === index)} // Remove duplicates
              highlightedFields={[
                ...selectedFields.measures,
                ...selectedFields.dimensions,
                ...selectedFields.timeDimensions
              ]}
              searchTerm={searchTerm}
            />
          </div>
        ) : (
          /* Tree View - existing field list */
          <div className="h-full p-3 space-y-2 overflow-y-auto">
            {(() => {
              // Filter cubes to only show those with matches (when searching)
              const filteredCubes = schema.cubes.filter(cubeHasMatches)
              
              // Show "No matches" message if searching but no cubes have matches
              if (searchTerm.trim() && filteredCubes.length === 0) {
                return <NoMatchesMessage />
              }
              
              return filteredCubes.map((cube: MetaCube) => {
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
                        {/* Dimensions - First (matching QueryPanel order) */}
                        {regularDimensions.length > 0 && filterFields(regularDimensions).length > 0 && (
                          <div>
                            <SectionHeader
                              title="Dimensions"
                              count={filterFields(regularDimensions).length}
                              sectionKey={`${cube.name}-dimensions`}
                              icon={<TagIcon className="w-4 h-4 text-green-600" />}
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

                        {/* Time Dimensions - Second (matching QueryPanel order) */}
                        {timeDimensions.length > 0 && filterFields(timeDimensions).length > 0 && (
                          <div>
                            <SectionHeader
                              title="Time Dimensions"
                              count={filterFields(timeDimensions).length}
                              sectionKey={`${cube.name}-timeDimensions`}
                              icon={<CalendarIcon className="w-4 h-4 text-blue-600" />}
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

                        {/* Measures - Third (matching QueryPanel order) */}
                        {cube.measures.length > 0 && filterFields(cube.measures).length > 0 && (
                          <div>
                            <SectionHeader
                              title="Measures"
                              count={filterFields(cube.measures).length}
                              sectionKey={`${cube.name}-measures`}
                              icon={<ChartBarIcon className="w-4 h-4 text-amber-600" />}
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
                      </div>
                    )}
                  </div>
                )
              })
            })()}
          </div>
        )}
      </div>
    </div>
  )
}

export default CubeMetaExplorer