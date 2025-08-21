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
    table: 'Data Table'
  }

  return (
    <div className={`${className}`}>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {chartTypes.map(([type, config]) => {
          const isSelected = selectedType === type
          const IconComponent = config.icon
          const label = chartTypeLabels[type]
          const description = config.description
          const useCase = config.useCase
          
          // Combine description and use case for tooltip
          const tooltipText = [description, useCase].filter(Boolean).join('. ')

          return (
            <button
              key={type}
              type="button"
              onClick={() => onTypeChange(type)}
              className={`
                relative p-2 rounded-lg border-2 transition-all duration-200 ease-in-out
                text-center hover:shadow-md group min-h-[70px] flex flex-col items-center justify-center
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 shadow-md' 
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }
              `}
              title={tooltipText}
            >
              {/* Icon */}
              {IconComponent && (
                <IconComponent 
                  className={`h-6 w-6 mb-1.5 ${
                    isSelected ? 'text-blue-600' : 'text-gray-600 group-hover:text-gray-800'
                  }`} 
                />
              )}
              
              {/* Chart name */}
              <h3 className={`font-medium text-xs leading-tight text-center ${
                isSelected ? 'text-blue-900' : 'text-gray-900'
              }`}>
                {label}
              </h3>

              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-1.5 h-1.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}