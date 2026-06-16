/**
 * FilterValueSelector Component
 *
 * Smart input component that adapts to operator type:
 * - Combo box for equals/notEquals with API-fetched values
 * - Number input for numeric operators
 * - Date picker for date operators
 * - No input for set/notSet operators
 */

import React from 'react'
import type { FilterValueSelectorProps } from './types.js'
import {
  useFilterValueSelectorState,
  COMBO_OPERATORS
} from './filterValueSelector/useFilterValueSelectorState.js'
import {
  NoValueInput,
  DateRangeInput,
  BetweenInput,
  SingleDateInput,
  NumberInput,
  TextInput,
  MultiDateInput,
  ComboBoxInput
} from './filterValueSelector/FilterValueInputs.js'

const FilterValueSelector: React.FC<FilterValueSelectorProps> = (props) => {
  const { operator, values, onValuesChange } = props
  const state = useFilterValueSelectorState(props)
  const {
    operatorMeta,
    isOpen,
    searchText,
    hasLoadedInitial,
    dropdownRef,
    isTimeDimension,
    shouldShowComboBox,
    distinctValues,
    valuesLoading,
    valuesError,
    handleDropdownToggle,
    handleSearchChange,
    handleValueSelect,
    handleValueRemove,
    handleDirectInput,
    handleDateInput,
    handleDateRangeEndInput,
    handleBetweenStartInput,
    handleBetweenEndInput
  } = state

  // No input needed for set/notSet
  if (!operatorMeta.requiresValues) {
    return <NoValueInput />
  }

  if (operator === 'inDateRange') {
    return (
      <DateRangeInput
        values={values}
        onStartChange={handleDateInput}
        onEndChange={handleDateRangeEndInput}
      />
    )
  }

  if (operator === 'between' || operator === 'notBetween') {
    return (
      <BetweenInput
        values={values}
        onStartChange={handleBetweenStartInput}
        onEndChange={handleBetweenEndInput}
      />
    )
  }

  if (operatorMeta.valueType === 'date') {
    return <SingleDateInput values={values} onChange={handleDateInput} />
  }

  if (operatorMeta.valueType === 'number') {
    return <NumberInput values={values} onChange={handleDirectInput} />
  }

  // Time dimension with equals/notEquals/in/notIn - use date picker
  if (isTimeDimension && COMBO_OPERATORS.includes(operator)) {
    if (operatorMeta.supportsMultipleValues) {
      return (
        <MultiDateInput
          values={values}
          onValuesChange={onValuesChange}
          onValueRemove={handleValueRemove}
        />
      )
    }
    return <SingleDateInput values={values} onChange={handleDateInput} />
  }

  if (shouldShowComboBox) {
    return (
      <ComboBoxInput
        dropdownRef={dropdownRef}
        supportsMultipleValues={operatorMeta.supportsMultipleValues}
        values={values}
        isOpen={isOpen}
        searchText={searchText}
        hasLoadedInitial={hasLoadedInitial}
        valuesLoading={valuesLoading}
        valuesError={valuesError}
        distinctValues={distinctValues}
        onValuesChange={onValuesChange}
        onValueRemove={handleValueRemove}
        onValueSelect={handleValueSelect}
        onToggle={handleDropdownToggle}
        onSearchChange={handleSearchChange}
      />
    )
  }

  // Fallback to text input
  return <TextInput values={values} onChange={handleDirectInput} valueType={operatorMeta.valueType} />
}

export default FilterValueSelector
