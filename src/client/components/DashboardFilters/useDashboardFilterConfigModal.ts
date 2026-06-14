/**
 * useDashboardFilterConfigModal
 *
 * State + effects + handlers backing DashboardFilterConfigModal. Extracted from
 * the component so the render stays flat. Behaviour is identical to the previous
 * inline implementation — same state, same effects, same handlers.
 */

import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react'
import { useTranslation } from '../../hooks/useTranslation'
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
import { deriveRangeFromDateRange, computeDirectInputValues } from './dashboardFilterConfigModalUtils'

interface UseDashboardFilterConfigModalParams {
  initialFilter: DashboardFilter
  fullSchema: MetaResponse | null
  filteredSchema: MetaResponse | null
  isOpen: boolean
  onSave: (filter: DashboardFilter) => void
}

export function useDashboardFilterConfigModal({
  initialFilter,
  fullSchema,
  filteredSchema,
  isOpen,
  onSave
}: UseDashboardFilterConfigModalParams) {
  const { t } = useTranslation()

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
    if (!shouldShowDateRange) return
    const derived = deriveRangeFromDateRange(localFilter.dateRange)
    if (!derived) return
    setRangeType(derived.rangeType)
    if (derived.numberValue !== undefined) {
      setNumberValue(derived.numberValue)
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
    const nextValues = computeDirectInputValues(e.target.value, operatorMeta?.valueType)
    if (nextValues === null) return
    setLocalFilter({ ...localFilter, values: nextValues })
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
      alert(t('dashboardFilter.filterLabelRequired'))
      return
    }

    // Don't require field selection for universal time filters
    if (!initialFilter.isUniversalTime && !localFilter.member) {
      alert(t('dashboardFilter.selectFieldRequired'))
      return
    }

    const updatedFilter: DashboardFilter = {
      id: initialFilter.id,
      label: localLabel,
      filter: localFilter,
      ...(initialFilter.isUniversalTime && { isUniversalTime: true })
    }

    onSave(updatedFilter)
  }, [initialFilter.id, initialFilter.isUniversalTime, localLabel, localFilter, onSave, t])

  // Get current operator label
  const operatorLabel = t(availableOperators.find(op => op.operator === localFilter.operator)?.label || localFilter.operator)

  // Get current date range label
  const dateRangeLabel = t(DATE_RANGE_OPTIONS.find(opt => opt.value === rangeType)?.label || 'filter.modal.selectRange')

  return {
    // refs
    containerRef,
    // state
    localLabel,
    setLocalLabel,
    localFilter,
    showAllFields,
    setShowAllFields,
    showFieldSearch,
    setShowFieldSearch,
    isOperatorDropdownOpen,
    setIsOperatorDropdownOpen,
    isValueDropdownOpen,
    setIsValueDropdownOpen,
    isDateRangeDropdownOpen,
    setIsDateRangeDropdownOpen,
    rangeType,
    numberValue,
    searchText,
    setSearchText,
    // derived
    activeSchema,
    isTimeField,
    isMeasureField,
    fieldTitle,
    operatorMeta,
    availableOperators,
    shouldShowDateRange,
    shouldShowComboBox,
    distinctValues,
    valuesLoading,
    valuesError,
    operatorLabel,
    dateRangeLabel,
    // handlers
    handleFieldSelected,
    handleOperatorChange,
    handleValueSelect,
    handleValueRemove,
    handleDirectInput,
    handleBetweenStartInput,
    handleBetweenEndInput,
    handleDateInput,
    handleRangeTypeChange,
    handleNumberValueChange,
    handleCustomStartDate,
    handleCustomEndDate,
    handleSave
  }
}
