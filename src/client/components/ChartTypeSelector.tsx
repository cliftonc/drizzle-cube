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
    kpiDelta: 'KPI Delta',
    kpiText: 'KPI Text',
    markdown: 'Markdown'
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
        className="w-full flex items-center justify-between px-3 py-2 border border-dc-border rounded-md bg-dc-surface hover:bg-dc-surface-hover focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <div className="flex items-center space-x-2">
          {SelectedIcon && (
            <SelectedIcon className="h-5 w-5 text-dc-text-secondary" />
          )}
          <span className="text-sm font-medium text-dc-text">{selectedLabel}</span>
        </div>
        <svg
          className={`h-4 w-4 text-dc-text-muted transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu - Grid Layout */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full min-w-max bg-dc-surface border border-dc-border rounded-md shadow-lg max-h-80 overflow-auto">
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
                        ? 'bg-dc-surface-secondary'
                        : 'bg-dc-surface hover:bg-dc-surface-hover'
                      }
                    `}
                    style={{
                      borderColor: isSelected ? 'var(--dc-primary)' : 'var(--dc-border)'
                    }}
                    title={tooltipText}
                  >
                    <div className="flex items-center space-x-1.5">
                      {/* Icon */}
                      {IconComponent && (
                        <IconComponent
                          className={`h-4 w-4 shrink-0 ${isSelected ? 'text-dc-text' : 'text-dc-text-secondary'}`}
                          style={isSelected ? { color: 'var(--dc-primary)' } : undefined}
                        />
                      )}

                      {/* Chart name */}
                      <span className={`text-xs font-medium leading-tight truncate ${
                        isSelected ? '' : 'text-dc-text'
                      }`}
                      style={isSelected ? { color: 'var(--dc-primary)' } : undefined}>
                        {label}
                      </span>
                    </div>

                    {/* Selected indicator - smaller dot */}
                    {isSelected && (
                      <div className="absolute top-0.5 right-0.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--dc-primary)' }}></div>
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