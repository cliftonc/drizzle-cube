/**
 * useDashboardFilterConfigModal
 *
 * Thin orchestrator behind DashboardFilterConfigModal. It owns the small core
 * editing state (label + filter) and derives field/operator metadata, then
 * composes three focused sub-hooks, each owning a single state+effect concern:
 *
 *   - useFilterDropdowns   — which popover (operator/value/date-range) is open
 *   - useFilterValueFetch  — combo-box value search + distinct-value fetching
 *   - useDateRangeState    — date-range preset / "last N" state + sync
 *
 * The remaining field/operator/save handlers stay here. The return is grouped
 * into sub-objects by concern (`dropdowns`, `values`, `dateRange`, `field`)
 * rather than one flat bag. Behaviour is identical to the previous inline
 * implementation — same state, same effects, same handlers.
 */

import { useState, useEffect, useCallback, ChangeEvent } from 'react'
import { useTranslation } from '../../hooks/useTranslation.js'
import type { DashboardFilter, SimpleFilter, FilterOperator } from '../../types.js'
import type { MetaResponse, MetaField } from '../../shared/types.js'
import type { FieldType } from '../AnalysisBuilder/types.js'
import { DATE_RANGE_OPTIONS } from '../../shared/types.js'
import { FILTER_OPERATORS, getAvailableOperators } from '../../shared/filters/index.js'
import { findFieldInSchema, getFieldTitle } from '../AnalysisBuilder/utils/index.js'
import { computeDirectInputValues } from './dashboardFilterConfigModalUtils.js'
import { useFilterDropdowns } from './useFilterDropdowns.js'
import { useFilterValueFetch } from './useFilterValueFetch.js'
import { useDateRangeState } from './useDateRangeState.js'

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

  // Core editing state
  const [localLabel, setLocalLabel] = useState(initialFilter.label)
  const [localFilter, setLocalFilter] = useState<SimpleFilter>(initialFilter.filter as SimpleFilter)
  const [showAllFields, setShowAllFields] = useState(false)
  const [showFieldSearch, setShowFieldSearch] = useState(false)

  // Which popover dropdown is open + the click-outside container.
  const dropdowns = useFilterDropdowns()
  const { setIsOperatorDropdownOpen, setIsValueDropdownOpen, setIsDateRangeDropdownOpen } = dropdowns

  // Schema to use based on toggle
  const activeSchema = showAllFields ? fullSchema : filteredSchema

  // Sync state when filter changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalLabel(initialFilter.label)
      setLocalFilter(initialFilter.filter as SimpleFilter)
    }
  }, [initialFilter, isOpen])

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

  // Combo-box value search + distinct-value fetching.
  const values = useFilterValueFetch({
    localFilter,
    setLocalFilter,
    operatorMeta,
    shouldShowComboBox,
    isValueDropdownOpen: dropdowns.isValueDropdownOpen,
    setIsValueDropdownOpen
  })

  // Date-range preset / "last N" state + sync effect.
  const dateRange = useDateRangeState({
    localFilter,
    setLocalFilter,
    shouldShowDateRange,
    setIsDateRangeDropdownOpen
  })

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
  }, [localFilter.member, setIsOperatorDropdownOpen])

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
  const dateRangeLabel = t(DATE_RANGE_OPTIONS.find(opt => opt.value === dateRange.rangeType)?.label || 'filter.modal.selectRange')

  return {
    // Core editing state
    localLabel,
    setLocalLabel,
    localFilter,
    showAllFields,
    setShowAllFields,
    showFieldSearch,
    setShowFieldSearch,
    // Derived field/operator metadata
    field: {
      activeSchema,
      isTimeField,
      isMeasureField,
      fieldTitle,
      operatorMeta,
      availableOperators,
      operatorLabel,
      shouldShowDateRange,
      shouldShowComboBox
    },
    // Sub-hook concerns
    dropdowns,
    values,
    dateRange: { ...dateRange, dateRangeLabel },
    // Field/operator/value/save handlers owned here
    handleFieldSelected,
    handleOperatorChange,
    handleDirectInput,
    handleBetweenStartInput,
    handleBetweenEndInput,
    handleDateInput,
    handleSave
  }
}
