import { useMemo, useState } from 'react'
import type { ChartType } from '../types'
import type { ChartAvailabilityMap } from '../shared/chartDefaults'
import { chartConfigRegistry } from '../charts/chartConfigRegistry'

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

/** Get label for a chart type from the registry, falling back to the chart type key */
function getLabel(type: ChartType): string {
  return chartConfigRegistry[type]?.label || type
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

  // Derive chart types from the registry, filter excluded ones, and sort alphabetically by label
  const chartTypes = useMemo(() =>
    (Object.keys(chartConfigRegistry) as ChartType[])
      .filter((type) => !excludeTypes.includes(type))
      .sort((a, b) => getLabel(a).localeCompare(getLabel(b)))
  , [excludeTypes])

  const selectedConfig = chartConfigRegistry[selectedType]
  const SelectedIcon = selectedConfig?.icon
  const selectedLabel = getLabel(selectedType)

  return (
    <div className={`${className} dc:relative`}>
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="dc:w-full dc:flex dc:items-center dc:justify-between dc:px-3 dc:py-2 dc:border border-dc-border dc:rounded-md bg-dc-surface hover:bg-dc-surface-hover focus:outline-hidden dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
      >
        <div className="dc:flex dc:items-center dc:space-x-2">
          {SelectedIcon && (
            <SelectedIcon className="dc:h-5 dc:w-5 text-dc-text-secondary" />
          )}
          <span className="dc:text-sm dc:font-medium text-dc-text">{selectedLabel}</span>
        </div>
        <svg
          className={`dc:h-4 dc:w-4 text-dc-text-muted dc:transform dc:transition-transform ${isOpen ? 'dc:rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu - Grid Layout */}
      {isOpen && (
        <div className={`dc:absolute dc:z-10 dc:mt-1 dc:w-full bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg dc:max-h-80 dc:overflow-auto ${compact ? '' : 'dc:min-w-max'}`}>
          <div className="dc:p-2">
            <div className={`dc:grid dc:gap-1.5 ${compact ? 'dc:grid-cols-2' : 'dc:grid-cols-2 dc:sm:grid-cols-3 dc:lg:grid-cols-4'}`}>
              {chartTypes.map((type) => {
                const config = chartConfigRegistry[type]
                const IconComponent = config?.icon
                const label = getLabel(type)
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
                      dc:relative dc:p-1.5 dc:rounded dc:border dc:transition-colors dc:duration-150
                      dc:text-left dc:group dc:min-h-[30px] dc:flex dc:items-center dc:justify-start
                      ${!isAvailable
                        ? 'dc:opacity-50 dc:cursor-not-allowed bg-dc-surface'
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
                    <div className="dc:flex dc:items-center dc:space-x-1.5">
                      {/* Icon */}
                      {IconComponent && (
                        <IconComponent
                          className={`dc:h-4 dc:w-4 dc:shrink-0 ${
                            !isAvailable
                              ? 'text-dc-text-muted'
                              : isSelected
                                ? 'text-dc-text'
                                : 'text-dc-text-secondary'
                          }`}
                        />
                      )}

                      {/* Chart name */}
                      <span className={`dc:text-xs dc:font-medium dc:leading-tight dc:truncate ${
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
                      <div className="dc:absolute dc:top-0.5 dc:right-0.5">
                        <div className="dc:w-1.5 dc:h-1.5 dc:rounded-full" style={{ backgroundColor: 'var(--dc-primary)' }}></div>
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
