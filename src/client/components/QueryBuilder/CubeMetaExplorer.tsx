/**
 * CubeMetaExplorer Component
 * 
 * Displays the cube schema in a collapsible tree view.
 * Users can click on dimensions, measures, and time dimensions to add them to their query.
 */

import React, { useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { ChartBarIcon, TagIcon, CalendarIcon } from '@heroicons/react/24/solid'
import type { CubeMetaExplorerProps, MetaCube, MetaField } from './types'
import { isFieldSelected } from './utils'

const CubeMetaExplorer: React.FC<CubeMetaExplorerProps> = ({
  schema,
  selectedFields,
  onFieldSelect,
  onFieldDeselect
}) => {
  const [expandedCubes, setExpandedCubes] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')

  if (!schema) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="text-sm font-semibold mb-1">Loading Schema...</div>
          <div className="text-xs">Fetching cube metadata</div>
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
    const isSelected = isFieldSelected(field.name, fieldType, {
      measures: selectedFields.measures,
      dimensions: selectedFields.dimensions,
      timeDimensions: selectedFields.timeDimensions.map(td => ({ dimension: td, granularity: 'month' }))
    })

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
    const isSelected = isFieldSelected(field.name, fieldType, {
      measures: selectedFields.measures,
      dimensions: selectedFields.dimensions,
      timeDimensions: selectedFields.timeDimensions.map(td => ({ dimension: td, granularity: 'month' }))
    })

    return (
      <div
        className={`flex items-center px-3 py-2 text-sm cursor-pointer rounded-md transition-colors ${
          isSelected 
            ? 'bg-blue-100 text-blue-800 border border-blue-200' 
            : 'hover:bg-gray-100 text-gray-700'
        }`}
        onClick={() => handleFieldClick(field, fieldType)}
        title={field.description || field.title}
      >
        <div className={`mr-2 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{field.shortTitle}</div>
          <div className="text-xs text-gray-500 truncate">{field.name}</div>
        </div>
        {isSelected && (
          <div className="ml-2 text-blue-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-50 rounded-md"
        onClick={() => toggleSectionExpansion(sectionKey)}
      >
        <div className="mr-2">
          {isExpanded ? (
            <ChevronDownIcon className="w-4 h-4" />
          ) : (
            <ChevronRightIcon className="w-4 h-4" />
          )}
        </div>
        <div className="mr-2 text-gray-500">
          {icon}
        </div>
        <span className="flex-1">{title}</span>
        <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
          {count}
        </span>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Schema Explorer</h3>
        
        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Cubes */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {schema.cubes.map((cube: MetaCube) => {
          const isExpanded = expandedCubes.has(cube.name)
          const timeDimensions = cube.dimensions.filter(d => d.type === 'time')
          const regularDimensions = cube.dimensions.filter(d => d.type !== 'time')

          return (
            <div key={cube.name} className="border border-gray-200 rounded-lg">
              {/* Cube Header */}
              <div
                className="flex items-center px-4 py-3 cursor-pointer hover:bg-gray-50 rounded-t-lg"
                onClick={() => toggleCubeExpansion(cube.name)}
              >
                <div className="mr-3">
                  {isExpanded ? (
                    <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{cube.title}</div>
                  <div className="text-sm text-gray-500">{cube.description}</div>
                </div>
              </div>

              {/* Cube Content */}
              {isExpanded && (
                <div className="border-t border-gray-200 p-3 space-y-3">
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
                        <div className="ml-6 space-y-1 mt-2">
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
                        <div className="ml-6 space-y-1 mt-2">
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
                        <div className="ml-6 space-y-1 mt-2">
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