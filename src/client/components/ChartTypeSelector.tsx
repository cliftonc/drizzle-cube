import { useEffect, useState } from 'react'
import type { ChartType } from '../types'
import type { ChartAvailabilityMap } from '../shared/chartDefaults'
import type { ChartConfigRegistry } from '../charts/chartConfigs'

interface ChartTypeSelectorProps {
  selectedType: ChartType
  onTypeChange: (type: ChartType) => void
  className?: string
  /** Compact mode for narrow containers - uses 2 columns and constrains width */
  compact?: boolean
  /** Map of chart type availability - when provided, unavailable charts are disabled */
  availability?: ChartAvailabilityMap
  /** Chart types to exclude from the list (e.g., ['funnel'] to hide funnel in query mode) */
  excludeTypes?: ChartType[]
}

// Chart type display names (defined outside component to avoid recreation)
const chartTypeLabels: Record<ChartType, string> = {
  activityGrid: 'Activity Grid',
  area: 'Area Chart',
  bar: 'Bar Chart',
  bubble: 'Bubble Chart',
  funnel: 'Funnel Chart',
  heatmap: 'Heatmap',
  kpiDelta: 'KPI Delta',
  kpiNumber: 'KPI Number',
  kpiText: 'KPI Text',
  line: 'Line Chart',
  markdown: 'Markdown',
  pie: 'Pie Chart',
  radar: 'Radar Chart',
  radialBar: 'Radial Bar Chart',
  retentionCombined: 'Retention Chart',
  retentionHeatmap: 'Retention Matrix',
  sankey: 'Sankey Chart',
  scatter: 'Scatter Plot',
  sunburst: 'Sunburst Chart',
  table: 'Data Table',
  treemap: 'TreeMap'
}

export default function ChartTypeSelector({
  selectedType,
  onTypeChange,
  className = '',
  compact = false,
  availability,
  excludeTypes = []
}: ChartTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [configRegistry, setConfigRegistry] = useState<ChartConfigRegistry | null>(null)

  useEffect(() => {
    let isActive = true

    import('../charts/chartConfigRegistry')
      .then((module) => {
        if (isActive) {
          setConfigRegistry(module.chartConfigRegistry)
        }
      })
      .catch(() => {
        if (isActive) {
          setConfigRegistry(null)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  // Get chart types, filter excluded ones, and sort alphabetically by label
  const chartTypes = (Object.keys(chartTypeLabels) as ChartType[])
    .filter((type) => !excludeTypes.includes(type))
    .sort((a, b) => {
      const labelA = chartTypeLabels[a] || a
      const labelB = chartTypeLabels[b] || b
      return labelA.localeCompare(labelB)
    })

  const selectedConfig = configRegistry?.[selectedType]
  const SelectedIcon = selectedConfig?.icon
  const selectedLabel = chartTypeLabels[selectedType]

  return (
    <div className={`${className} relative`}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-dc-border rounded-md bg-dc-surface hover:bg-dc-surface-hover focus:outline-hidden focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
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
        <div className={`absolute z-10 mt-1 w-full bg-dc-surface border border-dc-border rounded-md shadow-lg max-h-80 overflow-auto ${compact ? '' : 'min-w-max'}`}>
          <div className="p-2">
            <div className={`grid gap-1.5 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
              {chartTypes.map((type) => {
                const config = configRegistry?.[type]
                const IconComponent = config?.icon
                const label = chartTypeLabels[type]
                const isSelected = selectedType === type
                const description = config?.description
                const useCase = config?.useCase

                // Check availability if provided
                const chartAvailability = availability?.[type]
                const isAvailable = chartAvailability?.available ?? true
                const unavailableReason = chartAvailability?.reason

                // Build tooltip text - show unavailable reason if not available, otherwise show description
                const tooltipText = !isAvailable && unavailableReason
                  ? unavailableReason
                  : [description, useCase].filter(Boolean).join('. ')

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      if (!isAvailable) return // Don't allow clicking disabled charts
                      onTypeChange(type)
                      setIsOpen(false)
                    }}
                    disabled={!isAvailable}
                    className={`
                      relative p-1.5 rounded border transition-colors duration-150
                      text-left group min-h-[30px] flex items-center justify-start
                      ${!isAvailable
                        ? 'opacity-50 cursor-not-allowed bg-dc-surface'
                        : isSelected
                          ? 'bg-dc-surface-secondary'
                          : 'bg-dc-surface hover:bg-dc-surface-hover'
                      }
                    `}
                    style={{
                      borderColor: isSelected && isAvailable ? 'var(--dc-primary)' : 'var(--dc-border)'
                    }}
                    title={tooltipText}
                  >
                    <div className="flex items-center space-x-1.5">
                      {/* Icon */}
                      {IconComponent && (
                        <IconComponent
                          className={`h-4 w-4 shrink-0 ${
                            !isAvailable
                              ? 'text-dc-text-muted'
                              : isSelected
                                ? 'text-dc-text'
                                : 'text-dc-text-secondary'
                          }`}
                        />
                      )}

                      {/* Chart name */}
                      <span className={`text-xs font-medium leading-tight truncate ${
                        !isAvailable
                          ? 'text-dc-text-muted'
                          : isSelected
                            ? ''
                            : 'text-dc-text'
                      }`}
                      style={isSelected && isAvailable ? { color: 'var(--dc-primary)' } : undefined}>
                        {label}
                      </span>
                    </div>

                    {/* Selected indicator - smaller dot */}
                    {isSelected && isAvailable && (
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
