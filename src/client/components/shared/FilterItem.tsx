/**
 * FilterItem Component
 *
 * Renders a single filter with field selection, operator selection, and value input.
 * Handles all the logic for individual filter management.
 */

import React, { useState, useEffect, useRef } from 'react'
import { getIcon } from '../../icons/index.js'
import FilterValueSelector from './FilterValueSelector.js'
import type { FilterItemProps, MetaField, DateRangeType } from './types.js'
import { getAllFilterableFields, getOrganizedFilterFields, getFieldType, getAvailableOperators, convertDateRangeTypeToValue, formatDateForCube, requiresNumberInput } from './utils.js'
import { DATE_RANGE_OPTIONS } from './types.js'
import { useTranslation } from '../../hooks/useTranslation.js'
import { resolveDateRangeState } from './filterItem/dateRangeSync.js'
import { FilterFieldDropdown } from './filterItem/FilterFieldDropdown.js'
import { FilterDateRangeSelector } from './filterItem/FilterDateRangeSelector.js'

const CloseIcon = getIcon('close')
const ChevronDownIcon = getIcon('chevronDown')

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
  const { t } = useTranslation()
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
    if (!shouldShowDateRangeSelector) return

    const resolved = resolveDateRangeState(filter.dateRange)
    if (!resolved) return

    setRangeType(resolved.rangeType)
    if (resolved.customDates) setCustomDates(resolved.customDates)
    if (resolved.numberValue !== undefined) setNumberValue(resolved.numberValue)
  }, [filter.dateRange, shouldShowDateRangeSelector])

  // Early return AFTER all hooks
  if (!schema) {
    return (
      <div className="dc:text-sm text-dc-text-muted">
        {t('filter.shared.schemaNotLoaded')}
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

  const selectedRangeLabel = t(DATE_RANGE_OPTIONS.find(opt => opt.value === rangeType)?.label || 'dateRange.custom')

  return (
    <div ref={containerRef} className="bg-dc-surface dc:border border-dc-border dc:rounded-lg dc:p-3">
      {/* Responsive layout - stacks on mobile, single row on desktop */}
      <div className="dc:flex dc:flex-col dc:sm:flex-row dc:sm:items-center dc:gap-3 dc:min-w-0 dc:max-w-full">
        {/* Row 1 on mobile: Filter icon and field selection - conditionally hidden */}
        {!hideFieldSelector && (
          <FilterFieldDropdown
            isOpen={isFieldDropdownOpen}
            selectedField={selectedField}
            selectedMember={filter.member}
            fieldSearchTerm={fieldSearchTerm}
            filteredQueryFields={filteredQueryFields}
            filteredAllFields={filteredAllFields}
            searchInputRef={searchInputRef}
            onToggle={handleFieldDropdownToggle}
            onSearchTermChange={setFieldSearchTerm}
            onFieldChange={handleFieldChange}
          />
        )}

        {/* Row 2 on mobile: Operator and Value selection */}
        {selectedField && (
          <div className="dc:flex dc:items-center dc:gap-2 dc:flex-1 dc:sm:flex-initial dc:min-w-0">
            {/* Operator selection - conditionally hidden */}
            {!hideOperatorSelector && (
              <div className="dc:relative dc:shrink-0">
              <button
                onClick={handleOperatorDropdownToggle}
                className="dc:w-full dc:sm:w-32 dc:flex dc:items-center dc:justify-between dc:text-left dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
              >
                <span className="dc:truncate">
                  {t(availableOperators.find(op => op.operator === filter.operator)?.label || filter.operator)}
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
                      className={`dc:w-full dc:text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover dc:focus:outline-none focus:bg-dc-surface-hover ${
                        operator.operator === filter.operator ? 'bg-dc-accent-bg text-dc-accent' : 'text-dc-text-secondary'
                      }`}
                    >
                      {t(operator.label)}
                    </button>
                  ))}
                </div>
              )}
              </div>
            )}

            {/* Value input or Date Range Selector */}
            <div className="dc:flex-1 dc:min-w-0">
              {shouldShowDateRangeSelector ? (
                <FilterDateRangeSelector
                  rangeType={rangeType}
                  selectedRangeLabel={selectedRangeLabel}
                  numberValue={numberValue}
                  customDates={customDates}
                  isDropdownOpen={isDateRangeDropdownOpen}
                  onDropdownToggle={() => {
                    setIsOperatorDropdownOpen(false)
                    setIsDateRangeDropdownOpen(!isDateRangeDropdownOpen)
                  }}
                  onRangeTypeChange={handleRangeTypeChange}
                  onCustomDateChange={handleCustomDateChange}
                  onNumberChange={handleNumberChange}
                />
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
