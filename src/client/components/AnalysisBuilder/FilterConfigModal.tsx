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
import { deriveRangeFromDateRange } from './filterConfigModalUtils'
import FilterValueInput from './FilterValueInput'
import { useFilterValues } from '../../hooks/useFilterValues'
import { useDebounce } from '../../hooks/useDebounce'
import { useTranslation } from '../../hooks/useTranslation'

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
  const { t } = useTranslation()
  const [filter, setFilter] = useState<SimpleFilter>(initialFilter)
  const [isOperatorDropdownOpen, setIsOperatorDropdownOpen] = useState(false)
  const [isValueDropdownOpen, setIsValueDropdownOpen] = useState(false)
  const [isDateRangeDropdownOpen, setIsDateRangeDropdownOpen] = useState(false)
  const [rangeType, setRangeType] = useState<DateRangeType>('this_month')
  const [numberValue, setNumberValue] = useState(1)
  const [searchText, setSearchText] = useState('')
  const [modalPosition, setModalPosition] = useState<{ top?: number; bottom?: number; left: number } | null>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const valueListRef = useRef<HTMLDivElement>(null)

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
    // Reset highlighted index when dropdown opens/closes
    if (!isValueDropdownOpen) {
      setHighlightedIndex(-1)
    }
  }, [isValueDropdownOpen, shouldShowComboBox, searchValues])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && valueListRef.current) {
      const highlightedElement = valueListRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex])

  // Search when debounced text changes
  useEffect(() => {
    if (isValueDropdownOpen && shouldShowComboBox && searchValues && debouncedSearchText !== undefined) {
      searchValues(debouncedSearchText)
    }
  }, [debouncedSearchText, isValueDropdownOpen, shouldShowComboBox, searchValues])

  // Sync rangeType state with filter.dateRange
  useEffect(() => {
    if (!shouldShowDateRange) return
    const derived = deriveRangeFromDateRange(filter.dateRange)
    if (!derived) return
    setRangeType(derived.rangeType)
    if (derived.numberValue !== undefined) {
      setNumberValue(derived.numberValue)
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
  const handleValueSelect = useCallback((value: unknown, event?: React.MouseEvent | { shiftKey: boolean }) => {
    const isShiftHeld = event?.shiftKey ?? false
    const values = filter.values || []

    if (operatorMeta?.supportsMultipleValues) {
      if (values.includes(value)) {
        // Toggle off - remove the value
        setFilter({ ...filter, values: values.filter((v: unknown) => v !== value) })
      } else {
        // Add the value
        setFilter({ ...filter, values: [...values, value] })
      }
      // Close dropdown unless shift is held
      if (!isShiftHeld) {
        setIsValueDropdownOpen(false)
      }
    } else {
      setFilter({ ...filter, values: [value] })
      setIsValueDropdownOpen(false)
    }
    setSearchText('')
    setHighlightedIndex(-1)
  }, [filter, operatorMeta?.supportsMultipleValues])

  // Handle value removal
  const handleValueRemove = useCallback((valueToRemove: unknown) => {
    const values = (filter.values || []).filter((v: unknown) => v !== valueToRemove)
    setFilter({ ...filter, values })
  }, [filter])

  // Handle keyboard navigation in value dropdown
  const handleValueKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isValueDropdownOpen || distinctValues.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev < distinctValues.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : distinctValues.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0 && highlightedIndex < distinctValues.length) {
          handleValueSelect(distinctValues[highlightedIndex], { shiftKey: e.shiftKey })
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsValueDropdownOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }, [isValueDropdownOpen, distinctValues, highlightedIndex, handleValueSelect])

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
  const operatorLabel = t(availableOperators.find(op => op.operator === filter.operator)?.label || filter.operator)

  // Get current date range label
  const dateRangeLabel = t(DATE_RANGE_OPTIONS.find(opt => opt.value === rangeType)?.label || 'filter.modal.selectRange')

  // Get icon for field type
  const FieldIcon = isTimeField ? TimeDimensionIcon : isMeasureField ? MeasureIcon : DimensionIcon

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
    ? 'bg-dc-surface rounded-lg border border-dc-border'
    : 'bg-dc-surface rounded-lg border border-dc-border max-w-md w-full'

  return (
    <>
      {/* Modal overlay */}
      <div
        className={`dc:fixed dc:inset-0 bg-dc-overlay dc:z-50 ${modalPosition ? '' : 'dc:flex dc:items-center dc:justify-center dc:p-4'}`}
        onClick={onCancel}
      >
        <div
          ref={containerRef}
          className={modalClassName}
          style={{ ...getModalStyle(), boxShadow: 'var(--dc-shadow-xl)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="dc:flex dc:items-center dc:justify-between dc:p-4 dc:border-b border-dc-border">
            <h2 className="dc:text-lg dc:font-semibold text-dc-text">{t('filter.modal.title')}</h2>
            <button
              onClick={onCancel}
              className="dc:p-1 text-dc-text-muted hover:text-dc-text dc:transition-colors"
            >
              <CloseIcon className="dc:w-5 dc:h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="dc:p-4 dc:space-y-4">
            {/* Field display */}
            <div>
              <label className="dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2">
                {t('filter.modal.fieldLabel')}
              </label>
              <div className="dc:flex dc:items-center dc:gap-2 dc:p-3 bg-dc-surface-secondary dc:rounded">
                <FieldIcon className="dc:w-5 dc:h-5 text-dc-filter-text" />
                <span className="dc:text-sm dc:font-medium text-dc-text">{fieldTitle}</span>
              </div>
            </div>

            {/* Operator selector */}
            <div>
              <label className="dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2">
                {t('filter.modal.operatorLabel')}
              </label>
              <div className="dc:relative">
                <button
                  onClick={() => {
                    setIsValueDropdownOpen(false)
                    setIsDateRangeDropdownOpen(false)
                    setIsOperatorDropdownOpen(!isOperatorDropdownOpen)
                  }}
                  className="dc:w-full dc:flex dc:items-center dc:justify-between dc:text-left dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text hover:bg-dc-surface-hover"
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
                        className={`dc:w-full dc:text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover ${
                          op.operator === filter.operator ? 'bg-dc-primary/10 text-dc-primary' : 'text-dc-text'
                        }`}
                      >
                        {t(op.label)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Value input */}
            <div>
              <label className="dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2">
                {t('filter.modal.valueLabel')}
              </label>
              <FilterValueInput
                filter={filter}
                operatorMeta={operatorMeta}
                shouldShowDateRange={shouldShowDateRange}
                shouldShowComboBox={shouldShowComboBox}
                rangeType={rangeType}
                numberValue={numberValue}
                dateRangeLabel={dateRangeLabel}
                isDateRangeDropdownOpen={isDateRangeDropdownOpen}
                setIsOperatorDropdownOpen={setIsOperatorDropdownOpen}
                setIsValueDropdownOpen={setIsValueDropdownOpen}
                setIsDateRangeDropdownOpen={setIsDateRangeDropdownOpen}
                handleRangeTypeChange={handleRangeTypeChange}
                handleNumberValueChange={handleNumberValueChange}
                handleCustomStartDate={handleCustomStartDate}
                handleCustomEndDate={handleCustomEndDate}
                handleBetweenStartInput={handleBetweenStartInput}
                handleBetweenEndInput={handleBetweenEndInput}
                handleDateInput={handleDateInput}
                handleDirectInput={handleDirectInput}
                isValueDropdownOpen={isValueDropdownOpen}
                distinctValues={distinctValues}
                valuesLoading={valuesLoading}
                valuesError={valuesError}
                searchText={searchText}
                setSearchText={setSearchText}
                highlightedIndex={highlightedIndex}
                setHighlightedIndex={setHighlightedIndex}
                valueListRef={valueListRef}
                handleValueSelect={handleValueSelect}
                handleValueRemove={handleValueRemove}
                handleValueKeyDown={handleValueKeyDown}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="dc:flex dc:items-center dc:justify-end dc:gap-2 dc:p-4 dc:border-t border-dc-border">
            <button
              onClick={onCancel}
              className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-text-secondary hover:text-dc-text dc:transition-colors"
            >
              {t('common.actions.cancel')}
            </button>
            <button
              onClick={() => onSave(filter)}
              className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-primary-content bg-dc-primary hover:bg-dc-primary-hover dc:rounded dc:transition-colors"
            >
              {t('common.actions.save')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
