/**
 * DashboardFilterConfigModal Component
 *
 * Modal for editing dashboard filter configuration including:
 * - Filter label
 * - Field selection (via FieldSearchModal)
 * - Operator selection
 * - Value input (adapts to field/operator type)
 * - Date range selection for time dimensions
 *
 * Based on FilterConfigModal but adapted for DashboardFilter with:
 * - Label editing
 * - Clickable field section to change field
 * - "Dashboard fields only" toggle
 * - Delete action
 */

import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react'
import { getIcon } from '../../icons'
import type { DashboardFilter, SimpleFilter, FilterOperator } from '../../types'
import type { MetaResponse, DateRangeType, MetaField } from '../../shared/types'
import type { FieldType } from '../AnalysisBuilder/types'
import { FILTER_OPERATORS, DATE_RANGE_OPTIONS } from '../../shared/types'
import {
  getAvailableOperators,
  convertDateRangeTypeToValue,
  requiresNumberInput
} from '../../shared/utils'
import { findFieldInSchema, getFieldTitle } from '../AnalysisBuilder/utils'
import { useFilterValues } from '../../hooks/useFilterValues'
import { useDebounce } from '../../hooks/useDebounce'
import FieldSearchModal from '../AnalysisBuilder/FieldSearchModal'

const CloseIcon = getIcon('close')
const ChevronDownIcon = getIcon('chevronDown')
const DimensionIcon = getIcon('dimension')
const TimeDimensionIcon = getIcon('timeDimension')
const MeasureIcon = getIcon('measure')
const EditIcon = getIcon('edit')
const EyeIcon = getIcon('eye')
const EyeOffIcon = getIcon('eyeOff')

interface DashboardFilterConfigModalProps {
  /** The dashboard filter being edited */
  filter: DashboardFilter
  /** Full schema (unfiltered) */
  fullSchema: MetaResponse | null
  /** Filtered schema (dashboard fields only) */
  filteredSchema: MetaResponse | null
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when user saves changes */
  onSave: (filter: DashboardFilter) => void
  /** Callback when user deletes the filter */
  onDelete: () => void
  /** Callback when user closes/cancels */
  onClose: () => void
}

export default function DashboardFilterConfigModal({
  filter: initialFilter,
  fullSchema,
  filteredSchema,
  isOpen,
  onSave,
  onDelete,
  onClose
}: DashboardFilterConfigModalProps) {
  // Local state for editing
  const [localLabel, setLocalLabel] = useState(initialFilter.label)
  const [localFilter, setLocalFilter] = useState<SimpleFilter>(initialFilter.filter as SimpleFilter)
  const [showAllFields, setShowAllFields] = useState(false)
  const [showFieldSearch, setShowFieldSearch] = useState(false)

  // Dropdown state
  const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState(false)
  const [isValueDropdownOpen, setIsValueDropdownOpen] = useState(false)
  const [isDateRangeDropdownOpen, setIsDateRangeDropdownOpen] = useState(false)

  // Date range state
  const [rangeType, setRangeType] = useState<DateRangeType>('this_month')
  const [numberValue, setNumberValue] = useState(1)
  const [searchText, setSearchText] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)

  // Schema to use based on toggle
  const activeSchema = showAllFields ? fullSchema : filteredSchema

  // Sync state when filter changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalLabel(initialFilter.label)
      setLocalFilter(initialFilter.filter as SimpleFilter)
    }
  }, [initialFilter, isOpen])

  // Debounce search text for API calls
  const debouncedSearchText = useDebounce(searchText, 300)

  // Get field info
  const fieldInfo = findFieldInSchema(localFilter.member, activeSchema)
  const fieldType = fieldInfo?.field.type || 'string'
  const isTimeField = fieldType === 'time'
  const isMeasureField = fieldInfo?.fieldType === 'measure'
  const isDimensionField = fieldInfo?.fieldType === 'dimension'

  // Get display title for field
  const fieldTitle = getFieldTitle(localFilter.member, activeSchema)

  // Get operator metadata
  const operatorMeta = FILTER_OPERATORS[localFilter.operator as FilterOperator]

  // Get available operators for this field type
  const availableOperators = getAvailableOperators(fieldType)

  // Should show date range selector
  const shouldShowDateRange = isTimeField && localFilter.operator === 'inDateRange'

  // Should use combo box for value selection
  const shouldShowComboBox = (() => {
    const comboOperators = ['equals', 'notEquals', 'in', 'notIn']
    return comboOperators.includes(localFilter.operator) && isDimensionField && !isTimeField
  })()

  // Fetch distinct values for combo box
  const {
    values: distinctValues,
    loading: valuesLoading,
    error: valuesError,
    searchValues
  } = useFilterValues(localFilter.member, shouldShowComboBox)

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
    if (!shouldShowDateRange || !localFilter.dateRange) return

    if (Array.isArray(localFilter.dateRange)) {
      setRangeType('custom')
    } else {
      const flexMatch = localFilter.dateRange.match(/^last (\d+) (days|weeks|months|quarters|years)$/)
      const singularMatch = !flexMatch && localFilter.dateRange.match(/^last (day|week|month|quarter|year)$/)

      if (flexMatch) {
        const [, num, unit] = flexMatch
        setRangeType(`last_n_${unit}` as DateRangeType)
        setNumberValue(parseInt(num) || 1)
      } else if (singularMatch) {
        const [, unit] = singularMatch
        const pluralUnit = unit === 'day' ? 'days' :
                          unit === 'week' ? 'weeks' :
                          unit === 'month' ? 'months' :
                          unit === 'quarter' ? 'quarters' : 'years'
        setRangeType(`last_n_${pluralUnit}` as DateRangeType)
        setNumberValue(1)
      } else {
        let found = false
        for (const option of DATE_RANGE_OPTIONS) {
          if (option.value !== 'custom' && !requiresNumberInput(option.value)) {
            if (convertDateRangeTypeToValue(option.value) === localFilter.dateRange) {
              setRangeType(option.value)
              found = true
              break
            }
          }
        }
        if (!found) setRangeType('custom')
      }
    }
  }, [localFilter.dateRange, shouldShowDateRange])

  // Handle field selection from FieldSearchModal
  const handleFieldSelected = useCallback((field: MetaField, _fieldType: FieldType) => {
    // Reset operator and values when changing field
    const newFieldType = field.type
    const newOperators = getAvailableOperators(newFieldType)
    const defaultOperator = newOperators[0]?.operator || 'equals'

    setLocalFilter({
      member: field.name,
      operator: defaultOperator as FilterOperator,
      values: []
    })
    setShowFieldSearch(false)
  }, [])

  // Handle operator change
  const handleOperatorChange = useCallback((operator: FilterOperator) => {
    setLocalFilter({
      member: localFilter.member,
      operator,
      values: []
    })
    setIsOperatorDropdownOpen(false)
  }, [localFilter.member])

  // Handle value selection from combo box
  const handleValueSelect = useCallback((value: unknown) => {
    const values = localFilter.values || []
    if (operatorMeta?.supportsMultipleValues) {
      if (!values.includes(value)) {
        setLocalFilter({ ...localFilter, values: [...values, value] })
      }
    } else {
      setLocalFilter({ ...localFilter, values: [value] })
      setIsValueDropdownOpen(false)
    }
    setSearchText('')
  }, [localFilter, operatorMeta?.supportsMultipleValues])

  // Handle value removal
  const handleValueRemove = useCallback((valueToRemove: unknown) => {
    const values = (localFilter.values || []).filter((v: unknown) => v !== valueToRemove)
    setLocalFilter({ ...localFilter, values })
  }, [localFilter])

  // Handle direct text/number input
  const handleDirectInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (operatorMeta?.valueType === 'number') {
      const numValue = parseFloat(value)
      if (!isNaN(numValue)) {
        setLocalFilter({ ...localFilter, values: [numValue] })
      } else if (value === '' || value === '-') {
        setLocalFilter({ ...localFilter, values: [] })
      }
    } else {
      setLocalFilter({ ...localFilter, values: value ? [value] : [] })
    }
  }, [localFilter, operatorMeta?.valueType])

  // Handle between range inputs
  const handleBetweenStartInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    const currentValues = localFilter.values?.length >= 2 ? localFilter.values : ['', '']
    const newValues = [!isNaN(value) ? value : '', currentValues[1]].filter(v => v !== '')
    setLocalFilter({ ...localFilter, values: newValues })
  }, [localFilter])

  const handleBetweenEndInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    const currentValues = localFilter.values?.length >= 2 ? localFilter.values : ['', '']
    const newValues = [currentValues[0], !isNaN(value) ? value : ''].filter(v => v !== '')
    setLocalFilter({ ...localFilter, values: newValues })
  }, [localFilter])

  // Handle date input
  const handleDateInput = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalFilter({ ...localFilter, values: value ? [value] : [] })
  }, [localFilter])

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

    setLocalFilter({ ...localFilter, dateRange } as SimpleFilter)
  }, [localFilter, numberValue])

  // Handle number value change for "last N days/weeks/etc"
  const handleNumberValueChange = useCallback((value: number) => {
    setNumberValue(value)
    if (requiresNumberInput(rangeType)) {
      const dateRange = convertDateRangeTypeToValue(rangeType, value)
      setLocalFilter({ ...localFilter, dateRange } as SimpleFilter)
    }
  }, [localFilter, rangeType])

  // Handle custom date range inputs
  const handleCustomStartDate = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const start = e.target.value
    const currentRange = Array.isArray(localFilter.dateRange) ? localFilter.dateRange : [localFilter.dateRange || '', '']
    const end = currentRange[1] || start
    setLocalFilter({ ...localFilter, dateRange: [start, end] } as SimpleFilter)
  }, [localFilter])

  const handleCustomEndDate = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const end = e.target.value
    const currentRange = Array.isArray(localFilter.dateRange) ? localFilter.dateRange : ['', localFilter.dateRange || '']
    const start = currentRange[0] || end
    setLocalFilter({ ...localFilter, dateRange: [start, end] } as SimpleFilter)
  }, [localFilter])

  // Handle save
  const handleSave = useCallback(() => {
    if (!localLabel.trim()) {
      alert('Filter label is required')
      return
    }

    // Don't require field selection for universal time filters
    if (!initialFilter.isUniversalTime && !localFilter.member) {
      alert('Please select a field for the filter')
      return
    }

    const updatedFilter: DashboardFilter = {
      id: initialFilter.id,
      label: localLabel,
      filter: localFilter,
      ...(initialFilter.isUniversalTime && { isUniversalTime: true })
    }

    onSave(updatedFilter)
  }, [initialFilter.id, initialFilter.isUniversalTime, localLabel, localFilter, onSave])

  // Get current operator label
  const operatorLabel = availableOperators.find(op => op.operator === localFilter.operator)?.label || localFilter.operator

  // Get current date range label
  const dateRangeLabel = DATE_RANGE_OPTIONS.find(opt => opt.value === rangeType)?.label || 'Select range'

  // Get icon for field type
  const FieldIcon = isTimeField ? TimeDimensionIcon : isMeasureField ? MeasureIcon : DimensionIcon
  const iconBgClass = isTimeField ? 'bg-dc-time-dimension' : isMeasureField ? 'bg-dc-measure' : 'bg-dc-dimension'
  const iconTextClass = isTimeField ? 'text-dc-time-dimension-text' : isMeasureField ? 'text-dc-measure-text' : 'text-dc-dimension-text'

  if (!isOpen) return null

  // Render value input based on operator type
  const renderValueInput = () => {
    // No value required for set/notSet
    if (!operatorMeta?.requiresValues) {
      return (
        <div className="dc:text-sm text-dc-text-muted dc:italic dc:py-2">
          No value required
        </div>
      )
    }

    // Date range selector for inDateRange on time fields
    if (shouldShowDateRange) {
      return (
        <div className="dc:space-y-2">
          {/* Range type dropdown */}
          <div className="dc:relative">
            <button
              onClick={() => {
                setIsOperatorDropdownOpen(false)
                setIsValueDropdownOpen(false)
                setIsDateRangeDropdownOpen(!isDateRangeDropdownOpen)
              }}
              className="dc:w-full dc:flex dc:items-center dc:justify-between text-left dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text hover:bg-dc-surface-hover"
            >
              <span className="dc:truncate">{dateRangeLabel}</span>
              <ChevronDownIcon className={`dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-2 dc:transition-transform ${
                isDateRangeDropdownOpen ? 'dc:rotate-180' : ''
              }`} />
            </button>

            {isDateRangeDropdownOpen && (
              <div className="dc:absolute dc:z-[60] dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded dc:shadow-lg dc:max-h-48 dc:overflow-y-auto">
                {DATE_RANGE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleRangeTypeChange(option.value)}
                    className={`dc:w-full text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover ${
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
            <div className="dc:flex dc:items-center dc:gap-2">
              <input
                type="number"
                min="1"
                max="1000"
                value={numberValue}
                onChange={(e) => handleNumberValueChange(Math.max(1, parseInt(e.target.value) || 1))}
                className="dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text dc:w-20"
              />
              <span className="dc:text-sm text-dc-text-muted">
                {rangeType.replace('last_n_', '')}
              </span>
            </div>
          )}

          {/* Custom date inputs */}
          {rangeType === 'custom' && (
            <div className="dc:flex dc:items-center dc:gap-2">
              <input
                type="date"
                value={Array.isArray(localFilter.dateRange) ? localFilter.dateRange[0] : ''}
                onChange={handleCustomStartDate}
                className="dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded dc:px-2 dc:py-2 bg-dc-surface text-dc-text"
              />
              <span className="dc:text-sm text-dc-text-muted">to</span>
              <input
                type="date"
                value={Array.isArray(localFilter.dateRange) ? localFilter.dateRange[1] : ''}
                onChange={handleCustomEndDate}
                className="dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded dc:px-2 dc:py-2 bg-dc-surface text-dc-text"
              />
            </div>
          )}
        </div>
      )
    }

    // Between/notBetween range inputs
    if (localFilter.operator === 'between' || localFilter.operator === 'notBetween') {
      return (
        <div className="dc:flex dc:items-center dc:gap-2">
          <input
            type="number"
            value={localFilter.values?.[0] ?? ''}
            onChange={handleBetweenStartInput}
            placeholder="Min"
            className="dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
          />
          <span className="dc:text-sm text-dc-text-muted">to</span>
          <input
            type="number"
            value={localFilter.values?.[1] ?? ''}
            onChange={handleBetweenEndInput}
            placeholder="Max"
            className="dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
          />
        </div>
      )
    }

    // Date picker for date operators
    if (operatorMeta?.valueType === 'date') {
      return (
        <input
          type="date"
          value={localFilter.values?.[0] || ''}
          onChange={handleDateInput}
          className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
        />
      )
    }

    // Number input
    if (operatorMeta?.valueType === 'number') {
      return (
        <input
          type="number"
          value={localFilter.values?.[0] ?? ''}
          onChange={handleDirectInput}
          placeholder="Enter number"
          className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
        />
      )
    }

    // Combo box for equals/notEquals/in/notIn on dimensions
    if (shouldShowComboBox) {
      return (
        <div className="dc:space-y-2">
          {/* Selected values as tags */}
          {localFilter.values && localFilter.values.length > 0 && (
            <div className="dc:flex dc:flex-wrap dc:gap-1.5">
              {localFilter.values.map((value: unknown, index: number) => (
                <span
                  key={index}
                  className="dc:inline-flex dc:items-center dc:gap-1 bg-dc-primary/10 text-dc-primary dc:text-sm dc:px-2 dc:py-1 dc:rounded"
                >
                  <span className="dc:max-w-[150px] dc:truncate">{String(value)}</span>
                  <button
                    onClick={() => handleValueRemove(value)}
                    className="hover:text-dc-danger"
                  >
                    <CloseIcon className="dc:w-3.5 dc:h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Dropdown trigger */}
          <div className="dc:relative">
            <button
              onClick={() => {
                setIsOperatorDropdownOpen(false)
                setIsDateRangeDropdownOpen(false)
                setIsValueDropdownOpen(!isValueDropdownOpen)
              }}
              className="dc:w-full dc:flex dc:items-center dc:justify-between text-left dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text hover:bg-dc-surface-hover"
            >
              <span className="text-dc-text-muted dc:truncate">
                {valuesLoading ? 'Loading...' : 'Select value...'}
              </span>
              <ChevronDownIcon className={`dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-2 dc:transition-transform ${
                isValueDropdownOpen ? 'dc:rotate-180' : ''
              }`} />
            </button>

            {isValueDropdownOpen && (
              <div className="dc:absolute dc:z-[60] dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded dc:shadow-lg dc:max-h-56 dc:overflow-hidden">
                {/* Search input */}
                <div className="dc:p-2 dc:border-b border-dc-border">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search..."
                    className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
                    autoFocus
                  />
                </div>

                {/* Values list */}
                <div className="dc:max-h-40 dc:overflow-y-auto">
                  {valuesLoading ? (
                    <div className="dc:px-3 dc:py-2 dc:text-sm text-dc-text-muted">Loading...</div>
                  ) : valuesError ? (
                    <div className="dc:px-3 dc:py-2 dc:text-sm text-dc-error">Error: {valuesError}</div>
                  ) : distinctValues.length === 0 ? (
                    <div className="dc:px-3 dc:py-2 dc:text-sm text-dc-text-muted">No values found</div>
                  ) : (
                    distinctValues.map((value, index) => {
                      const isSelected = localFilter.values?.includes(value)
                      return (
                        <button
                          key={`${value}-${index}`}
                          onClick={() => handleValueSelect(value)}
                          className={`dc:w-full text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover ${
                            isSelected ? 'bg-dc-primary/10 text-dc-primary' : 'text-dc-text'
                          }`}
                        >
                          {String(value)}
                          {isSelected && <span className="dc:float-right">✓</span>}
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
        value={localFilter.values?.[0] ?? ''}
        onChange={handleDirectInput}
        placeholder="Enter value..."
        className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text placeholder-dc-text-muted"
      />
    )
  }

  return (
    <>
      {/* Modal overlay */}
      <div
        className="dc:fixed dc:inset-0 dc:z-50 dc:flex dc:items-center dc:justify-center dc:p-4"
        style={{ backgroundColor: 'var(--dc-overlay)' }}
        onClick={onClose}
      >
        <div
          ref={containerRef}
          className="bg-dc-surface dc:rounded-lg dc:border border-dc-border dc:max-w-md dc:w-full dc:max-h-[90vh] dc:overflow-auto"
          style={{ boxShadow: 'var(--dc-shadow-xl)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="dc:flex dc:items-center dc:justify-between dc:p-4 dc:border-b border-dc-border">
            <h2 className="dc:text-lg dc:font-semibold text-dc-text">Edit Filter</h2>
            <button
              onClick={onClose}
              className="dc:p-1 text-dc-text-muted hover:text-dc-text dc:transition-colors"
            >
              <CloseIcon className="dc:w-5 dc:h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="dc:p-4 dc:space-y-4">
            {/* Filter Label */}
            <div>
              <label className="dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2">
                Filter Label
              </label>
              <input
                type="text"
                value={localLabel}
                onChange={(e) => setLocalLabel(e.target.value)}
                placeholder="Enter filter label"
                className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
              />
            </div>

            {/* Info box for universal time filters */}
            {initialFilter.isUniversalTime && (
              <div className="dc:p-3 dc:rounded-md bg-dc-info-bg dc:border border-dc-info-border">
                <div className="dc:text-sm dc:font-medium text-dc-info dc:mb-1">
                  Universal Time Filter
                </div>
                <div className="dc:text-xs text-dc-text-secondary">
                  This filter applies to all time dimensions in mapped portlets.
                  Users can select the date range when viewing the dashboard.
                </div>
              </div>
            )}

            {/* Field selection (not for universal time filters) */}
            {!initialFilter.isUniversalTime && (
              <div>
                <div className="dc:flex dc:items-center dc:justify-between dc:mb-2">
                  <label className="dc:block dc:text-sm dc:font-medium text-dc-text-secondary">
                    Field
                  </label>
                  <button
                    onClick={() => setShowAllFields(!showAllFields)}
                    className="dc:flex dc:items-center dc:gap-1 dc:text-xs dc:px-2 dc:py-1 dc:rounded hover:bg-dc-surface-hover text-dc-text-muted"
                    title={showAllFields ? 'Show dashboard fields only' : 'Show all fields'}
                  >
                    {showAllFields ? (
                      <>
                        <EyeOffIcon className="dc:w-3.5 dc:h-3.5" />
                        <span>Dashboard</span>
                      </>
                    ) : (
                      <>
                        <EyeIcon className="dc:w-3.5 dc:h-3.5" />
                        <span>All</span>
                      </>
                    )}
                  </button>
                </div>
                <button
                  onClick={() => setShowFieldSearch(true)}
                  className="dc:w-full dc:flex dc:items-center dc:gap-2 dc:p-3 bg-dc-surface-secondary dc:rounded hover:bg-dc-surface-tertiary dc:transition-colors"
                >
                  {localFilter.member ? (
                    <>
                      <span className={`dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded ${iconBgClass} ${iconTextClass}`}>
                        {FieldIcon && <FieldIcon className="dc:w-4 dc:h-4" />}
                      </span>
                      <span className="dc:flex-1 dc:text-sm dc:font-medium text-dc-text text-left">{fieldTitle}</span>
                    </>
                  ) : (
                    <>
                      <span className="dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded bg-dc-surface-tertiary text-dc-text-muted">
                        <DimensionIcon className="dc:w-4 dc:h-4" />
                      </span>
                      <span className="dc:flex-1 dc:text-sm text-dc-text-muted text-left">Click to select a field</span>
                    </>
                  )}
                  <EditIcon className="dc:w-4 dc:h-4 text-dc-text-muted" />
                </button>
              </div>
            )}

            {/* Operator selector (only if field is selected) */}
            {(localFilter.member || initialFilter.isUniversalTime) && !initialFilter.isUniversalTime && (
              <div>
                <label className="dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2">
                  Operator
                </label>
                <div className="dc:relative">
                  <button
                    onClick={() => {
                      setIsValueDropdownOpen(false)
                      setIsDateRangeDropdownOpen(false)
                      setIsOperatorDropdownOpen(!isOperatorDropdownOpen)
                    }}
                    className="dc:w-full dc:flex dc:items-center dc:justify-between text-left dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text hover:bg-dc-surface-hover"
                  >
                    <span className="dc:truncate">{operatorLabel}</span>
                    <ChevronDownIcon className={`dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-2 dc:transition-transform ${
                      isOperatorDropdownOpen ? 'dc:rotate-180' : ''
                    }`} />
                  </button>

                  {isOperatorDropdownOpen && (
                    <div className="dc:absolute dc:z-[60] dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded dc:shadow-lg dc:max-h-48 dc:overflow-y-auto">
                      {availableOperators.map((op) => (
                        <button
                          key={op.operator}
                          onClick={() => handleOperatorChange(op.operator as FilterOperator)}
                          className={`dc:w-full text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover ${
                            op.operator === localFilter.operator ? 'bg-dc-primary/10 text-dc-primary' : 'text-dc-text'
                          }`}
                        >
                          {op.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Value input (only if field is selected, not for universal time filters) */}
            {localFilter.member && !initialFilter.isUniversalTime && (
              <div>
                <label className="dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2">
                  Default Value
                </label>
                {renderValueInput()}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="dc:flex dc:items-center dc:justify-between dc:p-4 dc:border-t border-dc-border">
            <button
              onClick={onDelete}
              className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-danger hover:bg-dc-danger-bg dc:rounded dc:transition-colors"
            >
              Delete Filter
            </button>
            <div className="dc:flex dc:items-center dc:gap-2">
              <button
                onClick={onClose}
                className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-text-secondary hover:text-dc-text dc:transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-primary-content bg-dc-primary hover:bg-dc-primary-hover dc:rounded dc:transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Field Search Modal */}
      {showFieldSearch && (
        <FieldSearchModal
          isOpen={showFieldSearch}
          onClose={() => setShowFieldSearch(false)}
          onSelect={handleFieldSelected}
          mode="filter"
          schema={activeSchema}
          selectedFields={localFilter.member ? [localFilter.member] : []}
        />
      )}
    </>
  )
}
