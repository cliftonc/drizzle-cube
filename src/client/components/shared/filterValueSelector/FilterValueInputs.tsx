/**
 * Presentational leaf inputs for FilterValueSelector. Each renders one input
 * variant; the parent component dispatches to the appropriate one.
 */

import React from 'react'
import { getIcon } from '../../../icons/index.js'
import { useTranslation } from '../../../hooks/useTranslation.js'

const ChevronDownIcon = getIcon('chevronDown')
const CloseIcon = getIcon('close')

const INPUT_CLASS =
  'dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent'

type ChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => void

export function NoValueInput() {
  return (
    <div className="dc:text-sm text-dc-text-muted dc:italic">
      No value required
    </div>
  )
}

interface DateRangeInputProps {
  values: any[]
  onStartChange: ChangeHandler
  onEndChange: ChangeHandler
}

export function DateRangeInput({ values, onStartChange, onEndChange }: DateRangeInputProps) {
  return (
    <div className="dc:flex dc:items-center dc:space-x-2">
      <input type="date" value={values[0] || ''} onChange={onStartChange} className={INPUT_CLASS} />
      <span className="dc:text-sm text-dc-text-muted">to</span>
      <input type="date" value={values[1] || ''} onChange={onEndChange} className={INPUT_CLASS} />
    </div>
  )
}

interface BetweenInputProps {
  values: any[]
  onStartChange: ChangeHandler
  onEndChange: ChangeHandler
}

export function BetweenInput({ values, onStartChange, onEndChange }: BetweenInputProps) {
  return (
    <div className="dc:flex dc:items-center dc:space-x-2">
      <input
        type="number"
        value={values[0] !== undefined && values[0] !== null ? values[0] : ''}
        onChange={onStartChange}
        placeholder="Min"
        className={INPUT_CLASS}
      />
      <span className="dc:text-sm text-dc-text-muted">to</span>
      <input
        type="number"
        value={values[1] !== undefined && values[1] !== null ? values[1] : ''}
        onChange={onEndChange}
        placeholder="Max"
        className={INPUT_CLASS}
      />
    </div>
  )
}

interface SingleDateInputProps {
  values: any[]
  onChange: ChangeHandler
}

export function SingleDateInput({ values, onChange }: SingleDateInputProps) {
  return <input type="date" value={values[0] || ''} onChange={onChange} className={INPUT_CLASS} />
}

interface NumberInputProps {
  values: any[]
  onChange: ChangeHandler
}

export function NumberInput({ values, onChange }: NumberInputProps) {
  return (
    <input
      type="number"
      value={values[0] !== undefined && values[0] !== null ? values[0] : ''}
      onChange={onChange}
      placeholder="Enter number"
      className={INPUT_CLASS}
    />
  )
}

interface TextInputProps {
  values: any[]
  onChange: ChangeHandler
  valueType: string
}

export function TextInput({ values, onChange, valueType }: TextInputProps) {
  return (
    <input
      type="text"
      value={values[0] !== undefined && values[0] !== null ? values[0] : ''}
      onChange={onChange}
      placeholder={`Enter ${valueType} value`}
      className={INPUT_CLASS}
    />
  )
}

interface ValueChipProps {
  value: any
  onRemove: () => void
}

/** A single removable selected-value chip. */
function ValueChip({ value, onRemove }: ValueChipProps) {
  return (
    <div className="dc:inline-flex dc:items-center bg-dc-time-dimension text-dc-time-dimension dc:text-xs dc:px-2 dc:py-1 dc:rounded-sm dc:border border-dc-time-dimension">
      <span className="dc:mr-1">{String(value)}</span>
      <button onClick={onRemove} className="text-dc-accent hover:text-dc-accent focus:outline-hidden">
        <CloseIcon className="dc:w-3 dc:h-3" />
      </button>
    </div>
  )
}

interface MultiDateInputProps {
  values: any[]
  onValuesChange: (values: any[]) => void
  onValueRemove: (value: any) => void
}

export function MultiDateInput({ values, onValuesChange, onValueRemove }: MultiDateInputProps) {
  return (
    <div className="dc:space-y-2 dc:min-w-0 dc:max-w-full">
      {/* Selected dates display */}
      {values.length > 0 && (
        <div className="dc:flex dc:flex-wrap dc:gap-1 dc:max-w-full">
          {values.map((value, index) => (
            <ValueChip key={index} value={value} onRemove={() => onValueRemove(value)} />
          ))}
        </div>
      )}

      {/* Add new date */}
      <input
        type="date"
        onChange={(e) => {
          if (e.target.value && !values.includes(e.target.value)) {
            onValuesChange([...values, e.target.value])
            e.target.value = '' // Clear the input
          }
        }}
        className={INPUT_CLASS}
        placeholder="Add date..."
      />
    </div>
  )
}

interface ComboBoxInputProps {
  dropdownRef: React.RefObject<HTMLDivElement>
  supportsMultipleValues: boolean
  values: any[]
  isOpen: boolean
  searchText: string
  hasLoadedInitial: boolean
  valuesLoading: boolean
  valuesError: any
  distinctValues: any[]
  onValuesChange: (values: any[]) => void
  onValueRemove: (value: any) => void
  onValueSelect: (value: any) => void
  onToggle: () => void
  onSearchChange: ChangeHandler
}

/** Selected-values header for the combo box (single or multi). */
function ComboBoxSelection({
  supportsMultipleValues,
  values,
  onValueRemove,
  onClear
}: {
  supportsMultipleValues: boolean
  values: any[]
  onValueRemove: (value: any) => void
  onClear: () => void
}) {
  if (values.length === 0) return null

  if (supportsMultipleValues) {
    return (
      <div className="dc:flex dc:flex-wrap dc:gap-1 dc:mb-2 dc:max-w-full">
        {values.map((value, index) => (
          <ValueChip key={index} value={value} onRemove={() => onValueRemove(value)} />
        ))}
      </div>
    )
  }

  return (
    <div className="dc:mb-2">
      <ValueChip value={values[0]} onRemove={onClear} />
    </div>
  )
}

/** Body of the open dropdown (loading / error / empty / value list). */
function ComboBoxMenu({
  searchText,
  valuesLoading,
  valuesError,
  distinctValues,
  values,
  onValueSelect,
  onSearchChange
}: {
  searchText: string
  valuesLoading: boolean
  valuesError: any
  distinctValues: any[]
  values: any[]
  onValueSelect: (value: any) => void
  onSearchChange: ChangeHandler
}) {
  const { t } = useTranslation()

  const renderList = () => {
    if (valuesLoading) {
      return (
        <div className="dc:p-2 dc:text-sm text-dc-text-muted">
          {searchText ? t('filter.shared.valueSelector.searching') : t('filter.shared.valueSelector.loadingValues')}
        </div>
      )
    }
    if (valuesError) {
      return (
        <div className="dc:p-2 dc:text-sm text-dc-error">
          {t('filter.shared.valueSelector.errorLoading', { error: valuesError })}
        </div>
      )
    }
    if (distinctValues.length === 0) {
      return (
        <div className="dc:p-2 dc:text-sm text-dc-text-muted">
          {searchText ? t('filter.shared.valueSelector.noMatchingValues') : t('filter.shared.valueSelector.noValuesAvailable')}
        </div>
      )
    }
    return distinctValues.map((value, index) => {
      const isSelected = values.includes(value)
      return (
        <button
          key={`${value}-${index}`}
          onClick={() => onValueSelect(value)}
          className={`dc:w-full dc:text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover focus:outline-hidden focus:bg-dc-surface-hover ${
            isSelected ? 'bg-dc-accent-bg text-dc-accent' : 'text-dc-text-secondary'
          }`}
        >
          {String(value)}
          {isSelected && <span className="dc:float-right text-dc-accent">✓</span>}
        </button>
      )
    })
  }

  return (
    <div className="dc:absolute dc:z-30 dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg dc:max-h-60 dc:overflow-y-auto">
      {/* Search input */}
      <div className="dc:p-2 dc:border-b border-dc-border">
        <input
          type="text"
          value={searchText}
          onChange={onSearchChange}
          placeholder={t('filter.shared.valueSelector.searchValues')}
          className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
          autoFocus
        />
      </div>

      {/* Values list */}
      <div className="dc:max-h-48 dc:overflow-y-auto">{renderList()}</div>
    </div>
  )
}

export function ComboBoxInput({
  dropdownRef,
  supportsMultipleValues,
  values,
  isOpen,
  searchText,
  hasLoadedInitial,
  valuesLoading,
  valuesError,
  distinctValues,
  onValuesChange,
  onValueRemove,
  onValueSelect,
  onToggle,
  onSearchChange
}: ComboBoxInputProps) {
  const { t } = useTranslation()

  return (
    <div className="dc:relative dc:min-w-0 dc:max-w-full" ref={dropdownRef}>
      <ComboBoxSelection
        supportsMultipleValues={supportsMultipleValues}
        values={values}
        onValueRemove={onValueRemove}
        onClear={() => onValuesChange([])}
      />

      {/* Dropdown trigger */}
      <button
        onClick={onToggle}
        className="dc:w-full dc:text-left dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent dc:flex dc:items-center dc:justify-between dc:min-w-0"
      >
        <span className="text-dc-text-muted dc:truncate">
          {valuesLoading && !hasLoadedInitial ? t('filter.shared.valueSelector.loadingValues') : t('filter.shared.valueSelector.selectValue')}
        </span>
        <ChevronDownIcon className="dc:w-4 dc:h-4 text-dc-text-muted" />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <ComboBoxMenu
          searchText={searchText}
          valuesLoading={valuesLoading}
          valuesError={valuesError}
          distinctValues={distinctValues}
          values={values}
          onValueSelect={onValueSelect}
          onSearchChange={onSearchChange}
        />
      )}
    </div>
  )
}
