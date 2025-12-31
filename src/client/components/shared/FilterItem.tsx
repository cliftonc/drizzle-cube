/**
 * FilterItem Component
 * 
 * Renders a single filter with field selection, operator selection, and value input.
 * Handles all the logic for individual filter management.
 */

import React, { useState, useEffect, useRef } from 'react'
import { getIcon } from '../../icons'
import FilterValueSelector from './FilterValueSelector'
import type { FilterItemProps, MetaField, DateRangeType } from '../QueryBuilder/types'
import { getAllFilterableFields, getOrganizedFilterFields, getFieldType, getAvailableOperators, convertDateRangeTypeToValue, formatDateForCube, requiresNumberInput } from './utils'
import { getMeasureIcon } from '../../utils/measureIcons'
import { DATE_RANGE_OPTIONS } from '../QueryBuilder/types'

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
      <div className="text-sm text-dc-text-muted">
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
      return <TimeDimensionIcon className="w-3 h-3 text-dc-accent" />
    } else if (['count', 'sum', 'avg', 'min', 'max', 'countDistinct', 'countDistinctApprox', 'runningTotal', 'calculated', 'number'].includes(field.type)) {
      // Use dynamic icon based on measure type, with amber color
      const icon = getMeasureIcon(field.type, 'w-3 h-3 text-dc-warning')
      return icon
    } else {
      return <DimensionIcon className="w-3 h-3 text-dc-success" />
    }
  }

  // Helper function to get field type badge
  const getFieldTypeBadge = (field: MetaField) => {
    if (field.type === 'time') {
      return <span className="text-xs bg-dc-time-dimension text-dc-time-dimension px-1.5 py-0.5 rounded-sm">T</span>
    } else if (['count', 'sum', 'avg', 'min', 'max', 'countDistinct', 'number'].includes(field.type)) {
      return <span className="text-xs bg-dc-measure text-dc-measure px-1.5 py-0.5 rounded-sm">M</span>
    } else {
      return <span className="text-xs bg-dc-dimension text-dc-dimension px-1.5 py-0.5 rounded-sm">D</span>
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
    <div ref={containerRef} className="bg-dc-surface border border-dc-border rounded-lg p-3">
      {/* Responsive layout - stacks on mobile, single row on desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0 max-w-full">
        {/* Row 1 on mobile: Filter icon and field selection - conditionally hidden */}
        {!hideFieldSelector && (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FilterIcon className="w-4 h-4 text-dc-text-muted shrink-0" />

            {/* Field selection */}
            <div className="relative flex-1 min-w-0">
            <button
              onClick={handleFieldDropdownToggle}
              className="w-full flex items-center justify-between text-left text-sm border border-dc-border rounded-sm px-2 py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover focus:ring-2 focus:ring-dc-accent focus:border-dc-accent min-w-0"
            >
              <span className="truncate">
                {selectedField ? (
                  <span className="font-medium">{selectedField.name}</span>
                ) : (
                  <span className="text-dc-text-muted">Select field...</span>
                )}
              </span>
              <ChevronDownIcon className={`w-4 h-4 text-dc-text-muted shrink-0 ml-1 transition-transform ${
                isFieldDropdownOpen ? 'transform rotate-180' : ''
              }`} />
            </button>

            {isFieldDropdownOpen && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-dc-surface border border-dc-border rounded-md shadow-lg max-h-80 overflow-hidden">
                {/* Search input */}
                <div className="p-2 border-b border-dc-border">
                  <div className="relative">
                    <SearchIcon className="w-4 h-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-dc-text-muted" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search fields..."
                      value={fieldSearchTerm}
                      onChange={(e) => setFieldSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-dc-border rounded-sm bg-dc-surface text-dc-text focus:ring-1 focus:ring-dc-accent focus:border-dc-accent"
                    />
                  </div>
                </div>

                {/* Fields list */}
                <div className="max-h-60 overflow-y-auto">
                  {/* Query fields section */}
                  {filteredQueryFields.length > 0 && (
                    <div>
                      <div className="px-3 py-1.5 text-xs font-medium text-dc-text-muted bg-dc-surface-secondary border-b border-dc-border">
                        Fields in Query ({filteredQueryFields.length})
                      </div>
                      {filteredQueryFields.map((field) => (
                        <button
                          key={`query-${field.name}`}
                          onClick={() => handleFieldChange(field.name)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-dc-surface-hover focus:outline-none focus:bg-dc-surface-hover ${
                            field.name === filter.member ? 'bg-dc-accent-bg text-dc-accent' : 'text-dc-text-secondary'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {getFieldTypeIcon(field)}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium truncate">{field.name}</span>
                                {getFieldTypeBadge(field)}
                              </div>
                              {field.title !== field.name && (
                                <div className="text-xs text-dc-text-muted truncate">{field.title}</div>
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
                      <div className="px-3 py-1.5 text-xs font-medium text-dc-text-muted bg-dc-surface-secondary border-b border-dc-border">
                        All Available Fields ({filteredAllFields.length})
                      </div>
                    )}
                    {filteredAllFields.map((field) => (
                      <button
                        key={`all-${field.name}`}
                        onClick={() => handleFieldChange(field.name)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-dc-surface-hover focus:outline-none focus:bg-dc-surface-hover ${
                          field.name === filter.member ? 'bg-dc-accent-bg text-dc-accent' : 'text-dc-text-secondary'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {getFieldTypeIcon(field)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">{field.name}</span>
                              {getFieldTypeBadge(field)}
                            </div>
                            {field.title !== field.name && (
                              <div className="text-xs text-dc-text-muted truncate">{field.title}</div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* No results message */}
                  {filteredAllFields.length === 0 && (
                    <div className="px-3 py-4 text-sm text-dc-text-muted text-center">
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
          <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-0">
            {/* Operator selection - conditionally hidden */}
            {!hideOperatorSelector && (
              <div className="relative shrink-0">
              <button
                onClick={handleOperatorDropdownToggle}
                className="w-full sm:w-32 flex items-center justify-between text-left text-sm border border-dc-border rounded-sm px-2 py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
              >
                <span className="truncate">
                  {availableOperators.find(op => op.operator === filter.operator)?.label || filter.operator}
                </span>
                <ChevronDownIcon className={`w-4 h-4 text-dc-text-muted shrink-0 ml-1 transition-transform ${
                  isOperatorDropdownOpen ? 'transform rotate-180' : ''
                }`} />
              </button>

              {isOperatorDropdownOpen && (
                <div className="absolute z-20 left-0 right-0 mt-1 bg-dc-surface border border-dc-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {availableOperators.map((operator) => (
                    <button
                      key={operator.operator}
                      onClick={() => handleOperatorChange(operator.operator)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-dc-surface-hover focus:outline-none focus:bg-dc-surface-hover ${
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
            <div className="flex-1 min-w-0">
              {shouldShowDateRangeSelector ? (
                /* Date Range Selector for time dimensions with inDateRange */
                <div className="flex items-center gap-2">
                  {/* Range type selector */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => {
                        setIsOperatorDropdownOpen(false)
                        setIsDateRangeDropdownOpen(!isDateRangeDropdownOpen)
                      }}
                      className="w-full sm:w-40 flex items-center justify-between text-left text-sm border border-dc-border rounded-sm px-2 py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
                    >
                      <span className="truncate">{selectedRangeLabel}</span>
                      <ChevronDownIcon className={`w-4 h-4 text-dc-text-muted shrink-0 ml-1 transition-transform ${
                        isDateRangeDropdownOpen ? 'transform rotate-180' : ''
                      }`} />
                    </button>

                    {isDateRangeDropdownOpen && (
                      <div className="absolute z-20 left-0 right-0 mt-1 bg-dc-surface border border-dc-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {DATE_RANGE_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => handleRangeTypeChange(option.value)}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-dc-surface-hover focus:outline-none focus:bg-dc-surface-hover ${
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
                        className="flex-1 min-w-0 text-sm border border-dc-border rounded-sm px-2 py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
                      />
                      <input
                        type="date"
                        value={customDates.endDate}
                        onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                        placeholder="End date"
                        className="flex-1 min-w-0 text-sm border border-dc-border rounded-sm px-2 py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
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
                        className="flex-1 min-w-0 text-sm border border-dc-border rounded-sm px-2 py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
                      />
                      <div className="shrink-0 text-sm text-dc-text-secondary">
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
          <div className="flex justify-end sm:justify-start">
            <button
              onClick={() => onFilterRemove(index)}
              className="text-dc-text-muted hover:text-dc-error focus:outline-none shrink-0"
              title="Remove filter"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default FilterItem