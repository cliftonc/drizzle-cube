import { useState } from 'react'
import { chartConfigRegistry } from '../charts/chartConfigRegistry'
import type { ChartType } from '../types'

interface ChartTypeSelectorProps {
  selectedType: ChartType
  onTypeChange: (type: ChartType) => void
  className?: string
}

export default function ChartTypeSelector({ 
  selectedType, 
  onTypeChange, 
  className = '' 
}: ChartTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const chartTypes = Object.entries(chartConfigRegistry) as [ChartType, typeof chartConfigRegistry[keyof typeof chartConfigRegistry]][]

  // Chart type display names (fallback if not in config)
  const chartTypeLabels: Record<ChartType, string> = {
    bar: 'Bar Chart',
    line: 'Line Chart', 
    area: 'Area Chart',
    pie: 'Pie Chart',
    scatter: 'Scatter Plot',
    bubble: 'Bubble Chart',
    radar: 'Radar Chart',
    radialBar: 'Radial Bar Chart',
    treemap: 'TreeMap',
    table: 'Data Table',
    activityGrid: 'Activity Grid',
    kpiNumber: 'KPI Number',
    kpiText: 'KPI Text'
  }

  const selectedConfig = chartConfigRegistry[selectedType]
  const SelectedIcon = selectedConfig?.icon
  const selectedLabel = chartTypeLabels[selectedType]

  return (
    <div className={`${className} relative`}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center space-x-2">
          {SelectedIcon && (
            <SelectedIcon className="h-5 w-5 text-gray-600" />
          )}
          <span className="text-sm font-medium text-gray-900">{selectedLabel}</span>
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu - Grid Layout */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full min-w-max bg-white border border-gray-300 rounded-md shadow-lg max-h-80 overflow-auto">
          <div className="p-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
              {chartTypes.map(([type, config]) => {
                const IconComponent = config.icon
                const label = chartTypeLabels[type]
                const isSelected = selectedType === type
                const description = config.description
                const useCase = config.useCase
                
                // Combine description and use case for tooltip
                const tooltipText = [description, useCase].filter(Boolean).join('. ')
                
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      onTypeChange(type)
                      setIsOpen(false)
                    }}
                    className={`
                      relative p-1.5 rounded border transition-colors duration-150
                      text-left group min-h-[30px] flex items-center justify-start
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }
                    `}
                    title={tooltipText}
                  >
                    <div className="flex items-center space-x-1.5">
                      {/* Icon */}
                      {IconComponent && (
                        <IconComponent 
                          className={`h-4 w-4 flex-shrink-0 ${
                            isSelected ? 'text-blue-600' : 'text-gray-600 group-hover:text-gray-800'
                          }`} 
                        />
                      )}
                      
                      {/* Chart name */}
                      <span className={`text-xs font-medium leading-tight truncate ${
                        isSelected ? 'text-blue-900' : 'text-gray-900'
                      }`}>
                        {label}
                      </span>
                    </div>

                    {/* Selected indicator - smaller dot */}
                    {isSelected && (
                      <div className="absolute top-0.5 right-0.5">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}