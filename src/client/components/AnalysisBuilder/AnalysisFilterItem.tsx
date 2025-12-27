/**
 * AnalysisFilterItem Component
 *
 * Compact filter item for the AnalysisBuilder's narrow column layout.
 * Features:
 * - Display name for field (not just shortName)
 * - Operator + value on same row
 * - API-fetched combo box with search for dimension values
 * - Multi-value support with tags for in/notIn operators
 * - Date range selector with predefined options
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { getIcon } from '../../icons'
import type { SimpleFilter, FilterOperator } from '../../types'
import type { MetaResponse, DateRangeType } from '../../shared/types'
import {
  FILTER_OPERATORS,
  DATE_RANGE_OPTIONS
} from '../../shared/types'
import {
  getAvailableOperators,
  convertDateRangeTypeToValue,
  requiresNumberInput
} from '../../shared/utils'
import { findFieldInSchema, getFieldTitle } from './utils'
import { useFilterValues } from '../../hooks/useFilterValues'
import { useDebounce } from '../../hooks/useDebounce'

const CloseIcon = getIcon('close')
const ChevronDownIcon = getIcon('chevronDown')
const DimensionIcon = getIcon('dimension')
const TimeDimensionIcon = getIcon('timeDimension')
const MeasureIcon = getIcon('measure')

interface AnalysisFilterItemProps {
  /** The filter to display */
  filter: SimpleFilter
  /** Schema for field metadata */
  schema: MetaResponse | null
  /** Callback to remove this filter */
  onRemove: () => void
  /** Callback to update this filter */
  onUpdate: (filter: SimpleFilter) => void
  /** Optional depth for nested styling */
  depth?: number
}

export default function AnalysisFilterItem({
  filter,
  schema,
  onRemove,
  onUpdate,
  depth = 0
}: AnalysisFilterItemProps) {
  const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState(false)
  const [isValueDropdownOpen, setIsValueDropdownOpen] = useState(false)
  const [isDateRangeDropdownOpen, setIsDateRangeDropdownOpen] = useState(false)
  const [rangeType, setRangeType] = useState<DateRangeType>('this_month')
  const [numberValue, setNumberValue] = useState(1)
  const [searchText, setSearchText] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce search text for API calls
  const debouncedSearchText = useDebounce(searchText, 300)

  // Get field info
  const fieldInfo = findFieldInSchema(filter.member, schema)
  const fieldType = fieldInfo?.field.type || 'string'
  const isTimeField = fieldType === 'time'
  const isMeasureField = fieldInfo?.fieldType === 'measure'
  const isDimensionField = fieldInfo?.fieldType === 'dimension'

  // Get display title for field
  const fieldTitle = getFieldTitle(filter.member, schema)

  // Get operator metadata
  const operatorMeta = FILTER_OPERATORS[filter.operator]

  // Get available operators for this field type
  const availableOperators = getAvailableOperators(fieldType)

  // Should show date range selector
  const shouldShowDateRange = isTimeField && filter.operator === 'inDateRange'

  // Should use combo box for value selection
  const shouldShowComboBox = useMemo(() => {
    const comboOperators = ['equals', 'notEquals', 'in', 'notIn']
    return comboOperators.includes(filter.operator) && isDimensionField && !isTimeField
  }, [filter.operator, isDimensionField, isTimeField])

  // Fetch distinct values for combo box
  const {
    values: distinctValues,
    loading: valuesLoading,
    error: valuesError,
    searchValues
  } = useFilterValues(filter.member, shouldShowComboBox)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOperatorDropdownOpen(false)
        setIsValueDropdownOpen(false)
        setIsDateRangeDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load values when dropdown opens
  useEffect(() => {
    if (isValueDropdownOpen && shouldShowComboBox && searchValues) {
      searchValues('', true)
    }
  }, [isValueDropdownOpen, shouldShowComboBox, searchValues])

  // Search when debounced text changes
  useEffect(() => {
    if (isValueDropdownOpen && shouldShowComboBox && searchValues && debouncedSearchText !== undefined) {
      searchValues(debouncedSearchText)
    }
  }, [debouncedSearchText, isValueDropdownOpen, shouldShowComboBox, searchValues])

  // Sync rangeType state with filter.dateRange
  useEffect(() => {
    if (!shouldShowDateRange || !filter.dateRange) return

    if (Array.isArray(filter.dateRange)) {
      setRangeType('custom')
    } else {
      // Find matching range type
      const flexMatch = filter.dateRange.match(/^last (\d+) (days|weeks|months|quarters|years)$/)
      if (flexMatch) {
        const [, num, unit] = flexMatch
        setRangeType(`last_n_${unit}` as DateRangeType)
        setNumberValue(parseInt(num) || 1)
      } else {
        // Check predefined ranges
        let found = false
        for (const option of DATE_RANGE_OPTIONS) {
          if (option.value !== 'custom' && !requiresNumberInput(option.value)) {
            if (convertDateRangeTypeToValue(option.value) === filter.dateRange) {
              setRangeType(option.value)
              found = true
              break
            }
          }
        }
        if (!found) setRangeType('custom')
      }
    }
  }, [filter.dateRange, shouldShowDateRange])

  // Handle operator change
  const handleOperatorChange = useCallback((operator: FilterOperator) => {
    const newFilter: SimpleFilter = {
      member: filter.member,
      operator,
      values: []
    }
    onUpdate(newFilter)
    setIsOperatorDropdownOpen(false)
  }, [filter.member, onUpdate])

  // Handle value selection from combo box
  const handleValueSelect = useCallback((value: unknown) => {
    const values = filter.values || []
    if (operatorMeta?.supportsMultipleValues) {
      if (!values.includes(value)) {
        onUpdate({ ...filter, values: [...values, value] })
      }
    } else {
      onUpdate({ ...filter, values: [value] })
      setIsValueDropdownOpen(false)
    }
    setSearchText('')
  }, [filter, operatorMeta?.supportsMultipleValues, onUpdate])

  // Handle value removal
  const handleValueRemove = useCallback((valueToRemove: unknown) => {
    const values = (filter.values || []).filter(v => v !== valueToRemove)
    onUpdate({ ...filter, values })
  }, [filter, onUpdate])

  // Handle direct text/number input
  const handleDirectInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (operatorMeta?.valueType === 'number') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        onUpdate({ ...filter, values: [numValue] })
      } else if (value === '' || value === '-') {
        onUpdate({ ...filter, values: [] })
      }
    } else {
      onUpdate({ ...filter, values: value ? [value] : [] })
    }
  }, [filter, operatorMeta?.valueType, onUpdate])

  // Handle between range inputs
  const handleBetweenStartInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    const currentValues = filter.values?.length >= 2 ? filter.values : ['', '']
    const newValues = [!isNaN(value) ? value : '', currentValues[1]].filter(v => v !== '')
    onUpdate({ ...filter, values: newValues })
  }, [filter, onUpdate])

  const handleBetweenEndInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    const currentValues = filter.values?.length >= 2 ? filter.values : ['', '']
    const newValues = [currentValues[0], !isNaN(value) ? value : ''].filter(v => v !== '')
    onUpdate({ ...filter, values: newValues })
  }, [filter, onUpdate])

  // Handle date input
  const handleDateInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onUpdate({ ...filter, values: value ? [value] : [] })
  }, [filter, onUpdate])

  // Handle date range type change
  const handleRangeTypeChange = useCallback((newRangeType: DateRangeType) => {
    setRangeType(newRangeType)
    setIsDateRangeDropdownOpen(false)

    let dateRange: string | string[]
    if (newRangeType === 'custom') {
      const today = new Date().toISOString().split('T')[0]
      dateRange = [today, today]
    } else if (requiresNumberInput(newRangeType)) {
      dateRange = convertDateRangeTypeToValue(newRangeType, numberValue)
    } else {
      dateRange = convertDateRangeTypeToValue(newRangeType)
    }

    onUpdate({ ...filter, dateRange } as SimpleFilter)
  }, [filter, numberValue, onUpdate])

  // Handle number value change for "last N days/weeks/etc"
  const handleNumberValueChange = useCallback((value: number) => {
    setNumberValue(value)
    if (requiresNumberInput(rangeType)) {
      const dateRange = convertDateRangeTypeToValue(rangeType, value)
      onUpdate({ ...filter, dateRange } as SimpleFilter)
    }
  }, [filter, rangeType, onUpdate])

  // Handle custom date range inputs
  const handleCustomStartDate = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const start = e.target.value
    const currentRange = Array.isArray(filter.dateRange) ? filter.dateRange : [filter.dateRange || '', '']
    const end = currentRange[1] || start
    onUpdate({ ...filter, dateRange: [start, end] } as SimpleFilter)
  }, [filter, onUpdate])

  const handleCustomEndDate = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const end = e.target.value
    const currentRange = Array.isArray(filter.dateRange) ? filter.dateRange : ['', filter.dateRange || '']
    const start = currentRange[0] || end
    onUpdate({ ...filter, dateRange: [start, end] } as SimpleFilter)
  }, [filter, onUpdate])

  // Get current operator label
  const operatorLabel = availableOperators.find(op => op.operator === filter.operator)?.label || filter.operator

  // Get current date range label
  const dateRangeLabel = DATE_RANGE_OPTIONS.find(opt => opt.value === rangeType)?.label || 'Select range'

  // Get icon for field type
  const FieldIcon = isTimeField ? TimeDimensionIcon : isMeasureField ? MeasureIcon : DimensionIcon
  const iconColor = isTimeField ? 'text-blue-500' : isMeasureField ? 'text-amber-500' : 'text-green-500'

  // Render value input based on operator type
  const renderValueInput = () => {
    // No value required for set/notSet
    if (!operatorMeta?.requiresValues) {
      return (
        <div className="text-xs text-dc-text-muted italic py-1">
          No value required
        </div>
      )
    }

    // Date range selector for inDateRange on time fields
    if (shouldShowDateRange) {
      return (
        <div className="space-y-1.5">
          {/* Range type dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsOperatorDropdownOpen(false)
                setIsValueDropdownOpen(false)
                setIsDateRangeDropdownOpen(!isDateRangeDropdownOpen)
              }}
              className="w-full flex items-center justify-between text-left text-xs border border-dc-border rounded px-2 py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover"
            >
              <span className="truncate">{dateRangeLabel}</span>
              <ChevronDownIcon className={`w-3 h-3 text-dc-text-muted shrink-0 ml-1 transition-transform ${
                isDateRangeDropdownOpen ? 'rotate-180' : ''
              }`} />
            </button>

            {isDateRangeDropdownOpen && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-dc-surface border border-dc-border rounded shadow-lg max-h-40 overflow-y-auto">
                {DATE_RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleRangeTypeChange(option.value)}
                    className={`w-full text-left px-2 py-1.5 text-xs hover:bg-dc-surface-hover ${
                      option.value === rangeType ? 'bg-dc-primary/10 text-dc-primary' : 'text-dc-text'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Number input for "last N" ranges */}
          {requiresNumberInput(rangeType) && (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="1"
                max="1000"
                value={numberValue}
                onChange={(e) => handleNumberValueChange(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 text-xs border border-dc-border rounded px-2 py-1 bg-dc-surface text-dc-text w-16"
              />
              <span className="text-xs text-dc-text-muted">
                {rangeType.replace('last_n_', '')}
              </span>
            </div>
          )}

          {/* Custom date inputs */}
          {rangeType === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={Array.isArray(filter.dateRange) ? filter.dateRange[0] : ''}
                onChange={handleCustomStartDate}
                className="flex-1 text-xs border border-dc-border rounded px-1.5 py-1 bg-dc-surface text-dc-text"
              />
              <span className="text-xs text-dc-text-muted">to</span>
              <input
                type="date"
                value={Array.isArray(filter.dateRange) ? filter.dateRange[1] : ''}
                onChange={handleCustomEndDate}
                className="flex-1 text-xs border border-dc-border rounded px-1.5 py-1 bg-dc-surface text-dc-text"
              />
            </div>
          )}
        </div>
      )
    }

    // Between/notBetween range inputs
    if (filter.operator === 'between' || filter.operator === 'notBetween') {
      return (
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={filter.values?.[0] ?? ''}
            onChange={handleBetweenStartInput}
            placeholder="Min"
            className="flex-1 text-xs border border-dc-border rounded px-2 py-1 bg-dc-surface text-dc-text"
          />
          <span className="text-xs text-dc-text-muted">to</span>
          <input
            type="number"
            value={filter.values?.[1] ?? ''}
            onChange={handleBetweenEndInput}
            placeholder="Max"
            className="flex-1 text-xs border border-dc-border rounded px-2 py-1 bg-dc-surface text-dc-text"
          />
        </div>
      )
    }

    // Date picker for date operators
    if (operatorMeta?.valueType === 'date') {
      return (
        <input
          type="date"
          value={filter.values?.[0] || ''}
          onChange={handleDateInput}
          className="w-full text-xs border border-dc-border rounded px-2 py-1 bg-dc-surface text-dc-text"
        />
      )
    }

    // Number input
    if (operatorMeta?.valueType === 'number') {
      return (
        <input
          type="number"
          value={filter.values?.[0] ?? ''}
          onChange={handleDirectInput}
          placeholder="Enter number"
          className="w-full text-xs border border-dc-border rounded px-2 py-1 bg-dc-surface text-dc-text"
        />
      )
    }

    // Combo box for equals/notEquals/in/notIn on dimensions
    if (shouldShowComboBox) {
      return (
        <div className="space-y-1.5">
          {/* Selected values as tags */}
          {filter.values && filter.values.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {filter.values.map((value, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-0.5 bg-dc-primary/10 text-dc-primary text-xs px-1.5 py-0.5 rounded"
                >
                  <span className="max-w-[100px] truncate">{String(value)}</span>
                  <button
                    onClick={() => handleValueRemove(value)}
                    className="hover:text-red-600"
                  >
                    <CloseIcon className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => {
                setIsOperatorDropdownOpen(false)
                setIsDateRangeDropdownOpen(false)
                setIsValueDropdownOpen(!isValueDropdownOpen)
              }}
              className="w-full flex items-center justify-between text-left text-xs border border-dc-border rounded px-2 py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover"
            >
              <span className="text-dc-text-muted truncate">
                {valuesLoading ? 'Loading...' : 'Select value...'}
              </span>
              <ChevronDownIcon className={`w-3 h-3 text-dc-text-muted shrink-0 ml-1 transition-transform ${
                isValueDropdownOpen ? 'rotate-180' : ''
              }`} />
            </button>

            {isValueDropdownOpen && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-dc-surface border border-dc-border rounded shadow-lg max-h-48 overflow-hidden">
                {/* Search input */}
                <div className="p-1.5 border-b border-dc-border">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search..."
                    className="w-full text-xs border border-dc-border rounded px-2 py-1 bg-dc-surface text-dc-text"
                    autoFocus
                  />
                </div>

                {/* Values list */}
                <div className="max-h-36 overflow-y-auto">
                  {valuesLoading ? (
                    <div className="px-2 py-2 text-xs text-dc-text-muted">Loading...</div>
                  ) : valuesError ? (
                    <div className="px-2 py-2 text-xs text-red-600">Error: {valuesError}</div>
                  ) : distinctValues.length === 0 ? (
                    <div className="px-2 py-2 text-xs text-dc-text-muted">No values found</div>
                  ) : (
                    distinctValues.map((value, index) => {
                      const isSelected = filter.values?.includes(value)
                      return (
                        <button
                          key={`${value}-${index}`}
                          onClick={() => handleValueSelect(value)}
                          className={`w-full text-left px-2 py-1.5 text-xs hover:bg-dc-surface-hover ${
                            isSelected ? 'bg-dc-primary/10 text-dc-primary' : 'text-dc-text'
                          }`}
                        >
                          {String(value)}
                          {isSelected && <span className="float-right">✓</span>}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }

    // Default: text input
    return (
      <input
        type="text"
        value={filter.values?.[0] ?? ''}
        onChange={handleDirectInput}
        placeholder="Enter value..."
        className="w-full text-xs border border-dc-border rounded px-2 py-1 bg-dc-surface text-dc-text placeholder-dc-text-muted"
      />
    )
  }

  return (
    <div
      ref={containerRef}
      className={`bg-dc-surface border border-dc-border rounded-lg p-2 ${depth > 0 ? 'ml-3' : ''}`}
    >
      {/* Header: Field name and remove button */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <FieldIcon className={`w-3.5 h-3.5 ${iconColor} shrink-0`} />
          <span className="text-xs font-medium text-dc-text truncate" title={filter.member}>
            {fieldTitle}
          </span>
        </div>
        <button
          onClick={onRemove}
          className="text-dc-text-muted hover:text-red-600 transition-colors shrink-0 p-0.5"
          title="Remove filter"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Operator selector */}
      <div className="relative mb-1.5">
        <button
          onClick={() => {
            setIsValueDropdownOpen(false)
            setIsDateRangeDropdownOpen(false)
            setIsOperatorDropdownOpen(!isOperatorDropdownOpen)
          }}
          className="w-full flex items-center justify-between text-left text-xs border border-dc-border rounded px-2 py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover"
        >
          <span className="truncate">{operatorLabel}</span>
          <ChevronDownIcon className={`w-3 h-3 text-dc-text-muted shrink-0 ml-1 transition-transform ${
            isOperatorDropdownOpen ? 'rotate-180' : ''
          }`} />
        </button>

        {isOperatorDropdownOpen && (
          <div className="absolute z-30 left-0 right-0 mt-1 bg-dc-surface border border-dc-border rounded shadow-lg max-h-40 overflow-y-auto">
            {availableOperators.map((op) => (
              <button
                key={op.operator}
                onClick={() => handleOperatorChange(op.operator as FilterOperator)}
                className={`w-full text-left px-2 py-1.5 text-xs hover:bg-dc-surface-hover ${
                  op.operator === filter.operator ? 'bg-dc-primary/10 text-dc-primary' : 'text-dc-text'
                }`}
              >
                {op.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Value input */}
      {renderValueInput()}
    </div>
  )
}
