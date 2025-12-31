/**
 * FilterConfigModal Component
 *
 * Modal for configuring filter settings with full UI for:
 * - Field selection with search
 * - Operator selection
 * - Value input (varies by operator and field type)
 * - Date range selection
 * - Multi-value support
 */

import React, { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react'
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

interface FilterConfigModalProps {
  /** The filter being edited */
  filter: SimpleFilter
  /** Schema for field metadata */
  schema: MetaResponse | null
  /** Callback when user saves changes */
  onSave: (filter: SimpleFilter) => void
  /** Callback when user cancels */
  onCancel: () => void
  /** Element to position the modal near */
  anchorElement?: HTMLElement | null
}

export default function FilterConfigModal({
  filter: initialFilter,
  schema,
  onSave,
  onCancel,
  anchorElement
}: FilterConfigModalProps) {
  const [filter, setFilter] = useState<SimpleFilter>(initialFilter)
  const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState(false)
  const [isValueDropdownOpen, setIsValueDropdownOpen] = useState(false)
  const [isDateRangeDropdownOpen, setIsDateRangeDropdownOpen] = useState(false)
  const [rangeType, setRangeType] = useState<DateRangeType>('this_month')
  const [numberValue, setNumberValue] = useState(1)
  const [searchText, setSearchText] = useState('')
  const [modalPosition, setModalPosition] = useState<{ top?: number; bottom?: number; left: number } | null>(null)
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
  const operatorMeta = FILTER_OPERATORS[filter.operator as FilterOperator]

  // Get available operators for this field type
  const availableOperators = getAvailableOperators(fieldType)

  // Should show date range selector
  const shouldShowDateRange = isTimeField && filter.operator === 'inDateRange'

  // Should use combo box for value selection
  const shouldShowComboBox = useCallback(() => {
    const comboOperators = ['equals', 'notEquals', 'in', 'notIn']
    return comboOperators.includes(filter.operator) && isDimensionField && !isTimeField
  }, [filter.operator, isDimensionField, isTimeField])()

  // Fetch distinct values for combo box
  const {
    values: distinctValues,
    loading: valuesLoading,
    error: valuesError,
    searchValues
  } = useFilterValues(filter.member, shouldShowComboBox)

  // Calculate modal position relative to anchor element
  useEffect(() => {
    if (!anchorElement) {
      setModalPosition(null)
      return
    }

    const rect = anchorElement.getBoundingClientRect()
    const modalHeight = 500 // Approximate modal height
    const spaceAbove = rect.top
    const spaceBelow = window.innerHeight - rect.bottom
    const modalWidth = 400 // Modal max-width

    // Determine if modal should appear above or below
    const shouldAppearAbove = spaceAbove > modalHeight || spaceAbove > spaceBelow

    // Calculate left position (try to align with anchor, but keep within viewport)
    const left = Math.max(16, Math.min(rect.left, window.innerWidth - modalWidth - 16))

    if (shouldAppearAbove) {
      // Position above the anchor
      setModalPosition({
        bottom: window.innerHeight - rect.top + 8,
        left
      })
    } else {
      // Position below the anchor
      setModalPosition({
        top: rect.bottom + 8,
        left
      })
    }
  }, [anchorElement])

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
      // Find matching range type - prioritize "last N" patterns
      // Match "last N days/weeks/months/quarters/years"
      const flexMatch = filter.dateRange.match(/^last (\d+) (days|weeks|months|quarters|years)$/)
      // Match singular forms: "last day/week/month/quarter/year" (when N=1)
      const singularMatch = !flexMatch && filter.dateRange.match(/^last (day|week|month|quarter|year)$/)

      if (flexMatch) {
        const [, num, unit] = flexMatch
        setRangeType(`last_n_${unit}` as DateRangeType)
        setNumberValue(parseInt(num) || 1)
      } else if (singularMatch) {
        // Handle singular forms as "last_n_*" with value of 1
        const [, unit] = singularMatch
        const pluralUnit = unit === 'day' ? 'days' :
                           unit === 'week' ? 'weeks' :
                           unit === 'month' ? 'months' :
                           unit === 'quarter' ? 'quarters' : 'years'
        setRangeType(`last_n_${pluralUnit}` as DateRangeType)
        setNumberValue(1)
      } else {
        // Check predefined ranges (only if not a "last N" pattern)
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
    setFilter({
      member: filter.member,
      operator,
      values: []
    })
    setIsOperatorDropdownOpen(false)
  }, [filter.member])

  // Handle value selection from combo box
  const handleValueSelect = useCallback((value: unknown) => {
    const values = filter.values || []
    if (operatorMeta?.supportsMultipleValues) {
      if (!values.includes(value)) {
        setFilter({ ...filter, values: [...values, value] })
      }
    } else {
      setFilter({ ...filter, values: [value] })
      setIsValueDropdownOpen(false)
    }
    setSearchText('')
  }, [filter, operatorMeta?.supportsMultipleValues])

  // Handle value removal
  const handleValueRemove = useCallback((valueToRemove: unknown) => {
    const values = (filter.values || []).filter((v: unknown) => v !== valueToRemove)
    setFilter({ ...filter, values })
  }, [filter])

  // Handle direct text/number input
  const handleDirectInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (operatorMeta?.valueType === 'number') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        setFilter({ ...filter, values: [numValue] })
      } else if (value === '' || value === '-') {
        setFilter({ ...filter, values: [] })
      }
    } else {
      setFilter({ ...filter, values: value ? [value] : [] })
    }
  }, [filter, operatorMeta?.valueType])

  // Handle between range inputs
  const handleBetweenStartInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    const currentValues = filter.values?.length >= 2 ? filter.values : ['', '']
    const newValues = [!isNaN(value) ? value : '', currentValues[1]].filter(v => v !== '')
    setFilter({ ...filter, values: newValues })
  }, [filter])

  const handleBetweenEndInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    const currentValues = filter.values?.length >= 2 ? filter.values : ['', '']
    const newValues = [currentValues[0], !isNaN(value) ? value : ''].filter(v => v !== '')
    setFilter({ ...filter, values: newValues })
  }, [filter])

  // Handle date input
  const handleDateInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFilter({ ...filter, values: value ? [value] : [] })
  }, [filter])

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

    setFilter({ ...filter, dateRange } as SimpleFilter)
  }, [filter, numberValue])

  // Handle number value change for "last N days/weeks/etc"
  const handleNumberValueChange = useCallback((value: number) => {
    setNumberValue(value)
    if (requiresNumberInput(rangeType)) {
      const dateRange = convertDateRangeTypeToValue(rangeType, value)
      setFilter({ ...filter, dateRange } as SimpleFilter)
    }
  }, [filter, rangeType])

  // Handle custom date range inputs
  const handleCustomStartDate = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const start = e.target.value
    const currentRange = Array.isArray(filter.dateRange) ? filter.dateRange : [filter.dateRange || '', '']
    const end = currentRange[1] || start
    setFilter({ ...filter, dateRange: [start, end] } as SimpleFilter)
  }, [filter])

  const handleCustomEndDate = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const end = e.target.value
    const currentRange = Array.isArray(filter.dateRange) ? filter.dateRange : ['', filter.dateRange || '']
    const start = currentRange[0] || end
    setFilter({ ...filter, dateRange: [start, end] } as SimpleFilter)
  }, [filter])

  // Get current operator label
  const operatorLabel = availableOperators.find(op => op.operator === filter.operator)?.label || filter.operator

  // Get current date range label
  const dateRangeLabel = DATE_RANGE_OPTIONS.find(opt => opt.value === rangeType)?.label || 'Select range'

  // Get icon for field type
  const FieldIcon = isTimeField ? TimeDimensionIcon : isMeasureField ? MeasureIcon : DimensionIcon

  // Render value input based on operator type
  const renderValueInput = () => {
    // No value required for set/notSet
    if (!operatorMeta?.requiresValues) {
      return (
        <div className="text-sm text-dc-text-muted italic py-2">
          No value required
        </div>
      )
    }

    // Date range selector for inDateRange on time fields
    if (shouldShowDateRange) {
      return (
        <div className="space-y-2">
          {/* Range type dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setIsOperatorDropdownOpen(false)
                setIsValueDropdownOpen(false)
                setIsDateRangeDropdownOpen(!isDateRangeDropdownOpen)
              }}
              className="w-full flex items-center justify-between text-left text-sm border border-dc-border rounded px-3 py-2 bg-dc-surface text-dc-text hover:bg-dc-surface-hover"
            >
              <span className="truncate">{dateRangeLabel}</span>
              <ChevronDownIcon className={`w-4 h-4 text-dc-text-muted shrink-0 ml-2 transition-transform ${
                isDateRangeDropdownOpen ? 'rotate-180' : ''
              }`} />
            </button>

            {isDateRangeDropdownOpen && (
              <div className="absolute z-[60] left-0 right-0 mt-1 bg-dc-surface border border-dc-border rounded shadow-lg max-h-48 overflow-y-auto">
                {DATE_RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleRangeTypeChange(option.value)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-dc-surface-hover ${
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
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="1000"
                value={numberValue}
                onChange={(e) => handleNumberValueChange(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 text-sm border border-dc-border rounded px-3 py-2 bg-dc-surface text-dc-text w-20"
              />
              <span className="text-sm text-dc-text-muted">
                {rangeType.replace('last_n_', '')}
              </span>
            </div>
          )}

          {/* Custom date inputs */}
          {rangeType === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={Array.isArray(filter.dateRange) ? filter.dateRange[0] : ''}
                onChange={handleCustomStartDate}
                className="flex-1 text-sm border border-dc-border rounded px-2 py-2 bg-dc-surface text-dc-text"
              />
              <span className="text-sm text-dc-text-muted">to</span>
              <input
                type="date"
                value={Array.isArray(filter.dateRange) ? filter.dateRange[1] : ''}
                onChange={handleCustomEndDate}
                className="flex-1 text-sm border border-dc-border rounded px-2 py-2 bg-dc-surface text-dc-text"
              />
            </div>
          )}
        </div>
      )
    }

    // Between/notBetween range inputs
    if (filter.operator === 'between' || filter.operator === 'notBetween') {
      return (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={filter.values?.[0] ?? ''}
            onChange={handleBetweenStartInput}
            placeholder="Min"
            className="flex-1 text-sm border border-dc-border rounded px-3 py-2 bg-dc-surface text-dc-text"
          />
          <span className="text-sm text-dc-text-muted">to</span>
          <input
            type="number"
            value={filter.values?.[1] ?? ''}
            onChange={handleBetweenEndInput}
            placeholder="Max"
            className="flex-1 text-sm border border-dc-border rounded px-3 py-2 bg-dc-surface text-dc-text"
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
          className="w-full text-sm border border-dc-border rounded px-3 py-2 bg-dc-surface text-dc-text"
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
          className="w-full text-sm border border-dc-border rounded px-3 py-2 bg-dc-surface text-dc-text"
        />
      )
    }

    // Combo box for equals/notEquals/in/notIn on dimensions
    if (shouldShowComboBox) {
      return (
        <div className="space-y-2">
          {/* Selected values as tags */}
          {filter.values && filter.values.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {filter.values.map((value: unknown, index: number) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 bg-dc-primary/10 text-dc-primary text-sm px-2 py-1 rounded"
                >
                  <span className="max-w-[150px] truncate">{String(value)}</span>
                  <button
                    onClick={() => handleValueRemove(value)}
                    className="hover:text-dc-danger"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
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
              className="w-full flex items-center justify-between text-left text-sm border border-dc-border rounded px-3 py-2 bg-dc-surface text-dc-text hover:bg-dc-surface-hover"
            >
              <span className="text-dc-text-muted truncate">
                {valuesLoading ? 'Loading...' : 'Select value...'}
              </span>
              <ChevronDownIcon className={`w-4 h-4 text-dc-text-muted shrink-0 ml-2 transition-transform ${
                isValueDropdownOpen ? 'rotate-180' : ''
              }`} />
            </button>

            {isValueDropdownOpen && (
              <div className="absolute z-[60] left-0 right-0 mt-1 bg-dc-surface border border-dc-border rounded shadow-lg max-h-56 overflow-hidden">
                {/* Search input */}
                <div className="p-2 border-b border-dc-border">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search..."
                    className="w-full text-sm border border-dc-border rounded px-3 py-2 bg-dc-surface text-dc-text"
                    autoFocus
                  />
                </div>

                {/* Values list */}
                <div className="max-h-40 overflow-y-auto">
                  {valuesLoading ? (
                    <div className="px-3 py-2 text-sm text-dc-text-muted">Loading...</div>
                  ) : valuesError ? (
                    <div className="px-3 py-2 text-sm text-dc-error">Error: {valuesError}</div>
                  ) : distinctValues.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-dc-text-muted">No values found</div>
                  ) : (
                    distinctValues.map((value, index) => {
                      const isSelected = filter.values?.includes(value)
                      return (
                        <button
                          key={`${value}-${index}`}
                          onClick={() => handleValueSelect(value)}
                          className={`w-full text-left px-3 py-2 text-sm hover:bg-dc-surface-hover ${
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
        className="w-full text-sm border border-dc-border rounded px-3 py-2 bg-dc-surface text-dc-text placeholder-dc-text-muted"
      />
    )
  }

  // Determine modal positioning style
  const getModalStyle = (): React.CSSProperties => {
    if (modalPosition) {
      return {
        position: 'fixed',
        ...modalPosition,
        maxWidth: '400px',
        width: '100%'
      }
    }
    return {}
  }

  const modalClassName = modalPosition
    ? 'bg-dc-surface rounded-lg shadow-xl'
    : 'bg-dc-surface rounded-lg shadow-xl max-w-md w-full'

  return (
    <>
      {/* Modal overlay */}
      <div
        className={`fixed inset-0 bg-dc-overlay z-50 ${modalPosition ? '' : 'flex items-center justify-center p-4'}`}
        onClick={onCancel}
      >
        <div
          ref={containerRef}
          className={modalClassName}
          style={getModalStyle()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-dc-border">
            <h2 className="text-lg font-semibold text-dc-text">Edit Filter</h2>
            <button
              onClick={onCancel}
              className="p-1 text-dc-text-muted hover:text-dc-text transition-colors"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-4 space-y-4">
            {/* Field display */}
            <div>
              <label className="block text-sm font-medium text-dc-text-secondary mb-2">
                Field
              </label>
              <div className="flex items-center gap-2 p-3 bg-dc-surface-secondary rounded">
                <FieldIcon className="w-5 h-5 text-dc-filter-text" />
                <span className="text-sm font-medium text-dc-text">{fieldTitle}</span>
              </div>
            </div>

            {/* Operator selector */}
            <div>
              <label className="block text-sm font-medium text-dc-text-secondary mb-2">
                Operator
              </label>
              <div className="relative">
                <button
                  onClick={() => {
                    setIsValueDropdownOpen(false)
                    setIsDateRangeDropdownOpen(false)
                    setIsOperatorDropdownOpen(!isOperatorDropdownOpen)
                  }}
                  className="w-full flex items-center justify-between text-left text-sm border border-dc-border rounded px-3 py-2 bg-dc-surface text-dc-text hover:bg-dc-surface-hover"
                >
                  <span className="truncate">{operatorLabel}</span>
                  <ChevronDownIcon className={`w-4 h-4 text-dc-text-muted shrink-0 ml-2 transition-transform ${
                    isOperatorDropdownOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {isOperatorDropdownOpen && (
                  <div className="absolute z-[60] left-0 right-0 mt-1 bg-dc-surface border border-dc-border rounded shadow-lg max-h-48 overflow-y-auto">
                    {availableOperators.map((op) => (
                      <button
                        key={op.operator}
                        onClick={() => handleOperatorChange(op.operator as FilterOperator)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-dc-surface-hover ${
                          op.operator === filter.operator ? 'bg-dc-primary/10 text-dc-primary' : 'text-dc-text'
                        }`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Value input */}
            <div>
              <label className="block text-sm font-medium text-dc-text-secondary mb-2">
                Value
              </label>
              {renderValueInput()}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 p-4 border-t border-dc-border">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-dc-text-secondary hover:text-dc-text transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(filter)}
              className="px-4 py-2 text-sm font-medium text-dc-primary-content bg-dc-primary hover:bg-dc-primary-hover rounded transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
