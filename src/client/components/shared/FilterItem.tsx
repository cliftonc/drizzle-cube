/**
 * FilterItem Component
 * 
 * Renders a single filter with field selection, operator selection, and value input.
 * Handles all the logic for individual filter management.
 */

import React, { useState, useEffect, useRef } from 'react'
import { getIcon } from '../../icons'
import FilterValueSelector from './FilterValueSelector'
import type { FilterItemProps, MetaField, DateRangeType } from './types'
import { getAllFilterableFields, getOrganizedFilterFields, getFieldType, getAvailableOperators, convertDateRangeTypeToValue, formatDateForCube, requiresNumberInput } from './utils'
import { getMeasureIcon } from '../../utils/measureIcons'
import { DATE_RANGE_OPTIONS } from './types'

const CloseIcon = getIcon('close')
const FilterIcon = getIcon('filter')
const ChevronDownIcon = getIcon('chevronDown')
const SearchIcon = getIcon('search')
const DimensionIcon = getIcon('dimension')
const TimeDimensionIcon = getIcon('timeDimension')

const FilterItem: React.FC<FilterItemProps> = ({
  filter,
  index,
  onFilterChange,
  onFilterRemove,
  schema,
  query,
  hideFieldSelector = false,
  hideOperatorSelector = false,
  hideRemoveButton = false
}) => {
  const [isFieldDropdownOpen, setIsFieldDropdownOpen] = useState(false)
  const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState(false)
  const [isDateRangeDropdownOpen, setIsDateRangeDropdownOpen] = useState(false)
  const [fieldSearchTerm, setFieldSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Date range state - always initialized with defaults (must be before any early returns)
  const [rangeType, setRangeType] = useState<DateRangeType>('this_month')
  const [customDates, setCustomDates] = useState({
    startDate: formatDateForCube(new Date()),
    endDate: formatDateForCube(new Date())
  })
  const [numberValue, setNumberValue] = useState<number>(1)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFieldDropdownOpen(false)
        setIsOperatorDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close other dropdowns when opening one
  const handleFieldDropdownToggle = () => {
    setIsOperatorDropdownOpen(false)
    const newOpen = !isFieldDropdownOpen
    setIsFieldDropdownOpen(newOpen)
    setFieldSearchTerm('') // Reset search when toggling

    // Focus search input when opening
    if (newOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }

  const handleOperatorDropdownToggle = () => {
    setIsFieldDropdownOpen(false)
    setIsOperatorDropdownOpen(!isOperatorDropdownOpen)
  }

  // Get field info (safe defaults if schema not loaded)
  const allFields = schema ? getAllFilterableFields(schema) : []
  const { queryFields } = schema ? getOrganizedFilterFields(schema, query) : { queryFields: [] }
  const selectedField = allFields.find(f => f.name === filter.member)
  const fieldType = selectedField ? selectedField.type : 'string'
  const availableOperators = getAvailableOperators(fieldType)

  // Determine if we should show date range selector (for time fields with inDateRange operator)
  const shouldShowDateRangeSelector = fieldType === 'time' && filter.operator === 'inDateRange'

  // Update date range state when filter.dateRange changes (must be before early return)
  useEffect(() => {
    if (!shouldShowDateRangeSelector || !filter.dateRange) return

    // Update rangeType
    if (Array.isArray(filter.dateRange)) {
      setRangeType('custom')
      setCustomDates({
        startDate: filter.dateRange[0] || '',
        endDate: filter.dateRange[1] || filter.dateRange[0] || ''
      })
    } else {
      // Check for flexible range patterns
      const flexibleRangeMatch = filter.dateRange.match(/^last (\d+) (days|weeks|months|quarters|years)$/)
      if (flexibleRangeMatch) {
        const [, num, unit] = flexibleRangeMatch
        const unitPlural = unit === 'days' ? 'days' : unit === 'weeks' ? 'weeks' : unit === 'months' ? 'months' : unit === 'quarters' ? 'quarters' : 'years'
        setRangeType(`last_n_${unitPlural}` as DateRangeType)
        setNumberValue(parseInt(num) || 1)
      } else {
        // Check for predefined ranges
        let found = false
        for (const option of DATE_RANGE_OPTIONS) {
          if (option.value !== 'custom' && !requiresNumberInput(option.value) && convertDateRangeTypeToValue(option.value) === filter.dateRange) {
            setRangeType(option.value)
            found = true
            break
          }
        }
        if (!found) {
          setRangeType('custom')
        }
      }
    }
  }, [filter.dateRange, shouldShowDateRangeSelector])

  // Early return AFTER all hooks
  if (!schema) {
    return (
      <div className="dc:text-sm text-dc-text-muted">
        Schema not loaded
      </div>
    )
  }
  
  // Filter fields based on search term
  const filterFieldsBySearch = (fields: MetaField[]) => {
    if (!fieldSearchTerm) return fields
    const searchTerm = fieldSearchTerm.toLowerCase()
    return fields.filter(field => 
      field.name.toLowerCase().includes(searchTerm) ||
      field.title.toLowerCase().includes(searchTerm) ||
      field.shortTitle.toLowerCase().includes(searchTerm)
    )
  }
  
  const filteredQueryFields = filterFieldsBySearch(queryFields)
  const filteredAllFields = filterFieldsBySearch(allFields)
  
  // Helper function to get field type icon
  const getFieldTypeIcon = (field: MetaField) => {
    if (field.type === 'time') {
      return <TimeDimensionIcon className="dc:w-3 dc:h-3 text-dc-accent" />
    } else if (['count', 'sum', 'avg', 'min', 'max', 'countDistinct', 'countDistinctApprox', 'runningTotal', 'calculated', 'number'].includes(field.type)) {
      // Use dynamic icon based on measure type, with amber color
      const icon = getMeasureIcon(field.type, 'w-3 h-3 text-dc-warning')
      return icon
    } else {
      return <DimensionIcon className="dc:w-3 dc:h-3 text-dc-success" />
    }
  }

  // Helper function to get field type badge
  const getFieldTypeBadge = (field: MetaField) => {
    if (field.type === 'time') {
      return <span className="dc:text-xs bg-dc-time-dimension text-dc-time-dimension dc:px-1.5 dc:py-0.5 dc:rounded-sm">T</span>
    } else if (['count', 'sum', 'avg', 'min', 'max', 'countDistinct', 'number'].includes(field.type)) {
      return <span className="dc:text-xs bg-dc-measure text-dc-measure dc:px-1.5 dc:py-0.5 dc:rounded-sm">M</span>
    } else {
      return <span className="dc:text-xs bg-dc-dimension text-dc-dimension dc:px-1.5 dc:py-0.5 dc:rounded-sm">D</span>
    }
  }

  const handleFieldChange = (fieldName: string) => {
    // When field changes, reset operator and values
    const newFieldType = getFieldType(fieldName, schema)
    const newAvailableOperators = getAvailableOperators(newFieldType)
    const defaultOperator = newAvailableOperators[0]?.operator || 'equals'

    onFilterChange(index, {
      member: fieldName,
      operator: defaultOperator as any,
      values: [],
      dateRange: undefined  // Reset dateRange when field changes
    })
    setIsFieldDropdownOpen(false)
  }
  
  const handleOperatorChange = (operator: string) => {
    onFilterChange(index, {
      ...filter,
      operator: operator as any,
      values: [],           // Reset values when operator changes
      dateRange: undefined  // Reset dateRange when operator changes
    })
    setIsOperatorDropdownOpen(false)
  }
  
  const handleValuesChange = (values: any[]) => {
    onFilterChange(index, {
      ...filter,
      values
    })
  }

  // Date range handlers for time dimension filters
  const handleDateRangeChange = (dateRange: string | string[]) => {
    onFilterChange(index, {
      ...filter,
      dateRange
    })
  }

  const handleRangeTypeChange = (newRangeType: DateRangeType) => {
    setIsDateRangeDropdownOpen(false)

    if (newRangeType === 'custom') {
      // For custom, use current custom dates or default to today
      if (customDates.startDate && customDates.endDate) {
        const dateRange = customDates.startDate === customDates.endDate
          ? customDates.startDate
          : [customDates.startDate, customDates.endDate]
        handleDateRangeChange(dateRange)
      }
    } else if (requiresNumberInput(newRangeType)) {
      // For number-based ranges, use the number value
      const cubeRangeValue = convertDateRangeTypeToValue(newRangeType, numberValue)
      handleDateRangeChange(cubeRangeValue)
    } else {
      // For predefined ranges, use the converted value
      const cubeRangeValue = convertDateRangeTypeToValue(newRangeType)
      handleDateRangeChange(cubeRangeValue)
    }

    setRangeType(newRangeType)
  }

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    const newCustomDates = { ...customDates, [field]: value }
    setCustomDates(newCustomDates)

    if (rangeType === 'custom' && newCustomDates.startDate) {
      const dateRange = !newCustomDates.endDate || newCustomDates.startDate === newCustomDates.endDate
        ? newCustomDates.startDate
        : [newCustomDates.startDate, newCustomDates.endDate]
      handleDateRangeChange(dateRange)
    }
  }

  const handleNumberChange = (value: number) => {
    setNumberValue(value)

    if (requiresNumberInput(rangeType)) {
      const cubeRangeValue = convertDateRangeTypeToValue(rangeType, value)
      handleDateRangeChange(cubeRangeValue)
    }
  }

  const selectedRangeLabel = DATE_RANGE_OPTIONS.find(opt => opt.value === rangeType)?.label || 'Custom'

  return (
    <div ref={containerRef} className="bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:p-3">
      {/* Responsive layout - stacks on mobile, single row on desktop */}
      <div className="dc:flex dc:flex-col dc:sm:flex-row dc:sm:items-center dc:gap-3 dc:min-w-0 dc:max-w-full">
        {/* Row 1 on mobile: Filter icon and field selection - conditionally hidden */}
        {!hideFieldSelector && (
          <div className="dc:flex dc:items-center dc:gap-2 dc:flex-1 dc:min-w-0">
            <FilterIcon className="dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0" />

            {/* Field selection */}
            <div className="dc:relative dc:flex-1 dc:min-w-0">
            <button
              onClick={handleFieldDropdownToggle}
              className="dc:w-full dc:flex dc:items-center dc:justify-between text-left dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent dc:min-w-0"
            >
              <span className="dc:truncate">
                {selectedField ? (
                  <span className="dc:font-medium">{selectedField.name}</span>
                ) : (
                  <span className="text-dc-text-muted">Select field...</span>
                )}
              </span>
              <ChevronDownIcon className={`dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-1 dc:transition-transform ${
                isFieldDropdownOpen ? 'dc:transform dc:rotate-180' : ''
              }`} />
            </button>

            {isFieldDropdownOpen && (
              <div className="dc:absolute dc:z-20 dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg dc:max-h-80 dc:overflow-hidden">
                {/* Search input */}
                <div className="dc:p-2 dc:border-b border-dc-border">
                  <div className="dc:relative">
                    <SearchIcon className="dc:w-4 dc:h-4 dc:absolute dc:left-2 dc:top-1/2 dc:transform dc:-translate-y-1/2 text-dc-text-muted" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search fields..."
                      value={fieldSearchTerm}
                      onChange={(e) => setFieldSearchTerm(e.target.value)}
                      className="dc:w-full dc:pl-8 dc:pr-3 dc:py-1.5 dc:text-sm dc:border border-dc-border dc:rounded-sm bg-dc-surface text-dc-text dc:focus:ring-1 focus:ring-dc-accent focus:border-dc-accent"
                    />
                  </div>
                </div>

                {/* Fields list */}
                <div className="dc:max-h-60 dc:overflow-y-auto">
                  {/* Query fields section */}
                  {filteredQueryFields.length > 0 && (
                    <div>
                      <div className="dc:px-3 dc:py-1.5 dc:text-xs dc:font-medium text-dc-text-muted bg-dc-surface-secondary dc:border-b border-dc-border">
                        Fields in Query ({filteredQueryFields.length})
                      </div>
                      {filteredQueryFields.map((field) => (
                        <button
                          key={`query-${field.name}`}
                          onClick={() => handleFieldChange(field.name)}
                          className={`dc:w-full text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover dc:focus:outline-none focus:bg-dc-surface-hover ${
                            field.name === filter.member ? 'bg-dc-accent-bg text-dc-accent' : 'text-dc-text-secondary'
                          }`}
                        >
                          <div className="dc:flex dc:items-center dc:gap-2">
                            {getFieldTypeIcon(field)}
                            <div className="dc:flex-1 dc:min-w-0">
                              <div className="dc:flex dc:items-center dc:gap-2">
                                <span className="dc:font-medium dc:truncate">{field.name}</span>
                                {getFieldTypeBadge(field)}
                              </div>
                              {field.title !== field.name && (
                                <div className="dc:text-xs text-dc-text-muted dc:truncate">{field.title}</div>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* All fields section */}
                  <div>
                    {filteredQueryFields.length > 0 && (
                      <div className="dc:px-3 dc:py-1.5 dc:text-xs dc:font-medium text-dc-text-muted bg-dc-surface-secondary dc:border-b border-dc-border">
                        All Available Fields ({filteredAllFields.length})
                      </div>
                    )}
                    {filteredAllFields.map((field) => (
                      <button
                        key={`all-${field.name}`}
                        onClick={() => handleFieldChange(field.name)}
                        className={`dc:w-full text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover dc:focus:outline-none focus:bg-dc-surface-hover ${
                          field.name === filter.member ? 'bg-dc-accent-bg text-dc-accent' : 'text-dc-text-secondary'
                        }`}
                      >
                        <div className="dc:flex dc:items-center dc:gap-2">
                          {getFieldTypeIcon(field)}
                          <div className="dc:flex-1 dc:min-w-0">
                            <div className="dc:flex dc:items-center dc:gap-2">
                              <span className="dc:font-medium dc:truncate">{field.name}</span>
                              {getFieldTypeBadge(field)}
                            </div>
                            {field.title !== field.name && (
                              <div className="dc:text-xs text-dc-text-muted dc:truncate">{field.title}</div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* No results message */}
                  {filteredAllFields.length === 0 && (
                    <div className="dc:px-3 dc:py-4 dc:text-sm text-dc-text-muted text-center">
                      No fields found matching "{fieldSearchTerm}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          </div>
        )}

        {/* Row 2 on mobile: Operator and Value selection */}
        {selectedField && (
          <div className="dc:flex dc:items-center dc:gap-2 dc:flex-1 dc:sm:flex-initial dc:min-w-0">
            {/* Operator selection - conditionally hidden */}
            {!hideOperatorSelector && (
              <div className="dc:relative dc:shrink-0">
              <button
                onClick={handleOperatorDropdownToggle}
                className="dc:w-full dc:sm:w-32 dc:flex dc:items-center dc:justify-between text-left dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
              >
                <span className="dc:truncate">
                  {availableOperators.find(op => op.operator === filter.operator)?.label || filter.operator}
                </span>
                <ChevronDownIcon className={`dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-1 dc:transition-transform ${
                  isOperatorDropdownOpen ? 'dc:transform dc:rotate-180' : ''
                }`} />
              </button>

              {isOperatorDropdownOpen && (
                <div className="dc:absolute dc:z-20 dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg dc:max-h-60 dc:overflow-y-auto">
                  {availableOperators.map((operator) => (
                    <button
                      key={operator.operator}
                      onClick={() => handleOperatorChange(operator.operator)}
                      className={`dc:w-full text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover dc:focus:outline-none focus:bg-dc-surface-hover ${
                        operator.operator === filter.operator ? 'bg-dc-accent-bg text-dc-accent' : 'text-dc-text-secondary'
                      }`}
                    >
                      {operator.label}
                    </button>
                  ))}
                </div>
              )}
              </div>
            )}

            {/* Value input or Date Range Selector */}
            <div className="dc:flex-1 dc:min-w-0">
              {shouldShowDateRangeSelector ? (
                /* Date Range Selector for time dimensions with inDateRange */
                <div className="dc:flex dc:items-center dc:gap-2">
                  {/* Range type selector */}
                  <div className="dc:relative dc:shrink-0">
                    <button
                      onClick={() => {
                        setIsOperatorDropdownOpen(false)
                        setIsDateRangeDropdownOpen(!isDateRangeDropdownOpen)
                      }}
                      className="dc:w-full dc:sm:w-40 dc:flex dc:items-center dc:justify-between text-left dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
                    >
                      <span className="dc:truncate">{selectedRangeLabel}</span>
                      <ChevronDownIcon className={`dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-1 dc:transition-transform ${
                        isDateRangeDropdownOpen ? 'dc:transform dc:rotate-180' : ''
                      }`} />
                    </button>

                    {isDateRangeDropdownOpen && (
                      <div className="dc:absolute dc:z-20 dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg dc:max-h-60 dc:overflow-y-auto">
                        {DATE_RANGE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleRangeTypeChange(option.value)}
                            className={`dc:w-full text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover dc:focus:outline-none focus:bg-dc-surface-hover ${
                              option.value === rangeType ? 'bg-dc-accent-bg text-dc-accent' : 'text-dc-text-secondary'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom date inputs or number input */}
                  {rangeType === 'custom' ? (
                    <>
                      <input
                        type="date"
                        value={customDates.startDate}
                        onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                        placeholder="Start date"
                        className="dc:flex-1 dc:min-w-0 dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
                      />
                      <input
                        type="date"
                        value={customDates.endDate}
                        onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                        placeholder="End date"
                        className="dc:flex-1 dc:min-w-0 dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
                      />
                    </>
                  ) : requiresNumberInput(rangeType) ? (
                    <>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={numberValue}
                        onChange={(e) => handleNumberChange(Math.max(1, parseInt(e.target.value) || 1))}
                        placeholder="Number"
                        className="dc:flex-1 dc:min-w-0 dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
                      />
                      <div className="dc:shrink-0 dc:text-sm text-dc-text-secondary">
                        {rangeType.replace('last_n_', '').replace('_', ' ')}
                      </div>
                    </>
                  ) : null}
                </div>
              ) : (
                /* Regular FilterValueSelector for non-dateRange filters */
                <FilterValueSelector
                  fieldName={filter.member}
                  operator={filter.operator}
                  values={filter.values}
                  onValuesChange={handleValuesChange}
                  schema={schema}
                />
              )}
            </div>
          </div>
        )}
        
        {/* Row 3 on mobile: Remove button - conditionally hidden */}
        {!hideRemoveButton && (
          <div className="dc:flex dc:justify-end dc:sm:justify-start">
            <button
              onClick={() => onFilterRemove(index)}
              className="text-dc-text-muted hover:text-dc-error dc:focus:outline-none dc:shrink-0"
              title="Remove filter"
            >
              <CloseIcon className="dc:w-4 dc:h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FilterItem