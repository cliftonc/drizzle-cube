/**
 * FilterValueInput
 *
 * Presentational value-input renderer extracted from FilterConfigModal. Picks the
 * right input control for the current operator/field type (no-value, date range,
 * between, date, number, dimension combo-box, or plain text). The date-range and
 * combo-box variants are further split into their own sub-components to keep each
 * piece flat. Behaviour and markup are identical to the previous inline rendering.
 */

import type { ChangeEvent, MouseEvent, KeyboardEvent, RefObject } from 'react'
import { getIcon } from '../../icons'
import type { SimpleFilter, FilterOperator } from '../../types'
import type { DateRangeType } from '../../shared/types'
import { DATE_RANGE_OPTIONS } from '../../shared/types'
import { requiresNumberInput } from '../../shared/utils'
import { useTranslation } from '../../hooks/useTranslation'

const CloseIcon = getIcon('close')
const ChevronDownIcon = getIcon('chevronDown')

type OperatorMeta = {
  requiresValues?: boolean
  valueType?: string
  supportsMultipleValues?: boolean
} | undefined

export interface FilterValueInputProps {
  filter: SimpleFilter
  operatorMeta: OperatorMeta
  shouldShowDateRange: boolean
  shouldShowComboBox: boolean
  // Date range
  rangeType: DateRangeType
  numberValue: number
  dateRangeLabel: string
  isDateRangeDropdownOpen: boolean
  setIsOperatorDropdownOpen: (open: boolean) => void
  setIsValueDropdownOpen: (open: boolean) => void
  setIsDateRangeDropdownOpen: (open: boolean) => void
  handleRangeTypeChange: (rangeType: DateRangeType) => void
  handleNumberValueChange: (value: number) => void
  handleCustomStartDate: (e: ChangeEvent<HTMLInputElement>) => void
  handleCustomEndDate: (e: ChangeEvent<HTMLInputElement>) => void
  // Between/number/date/text
  handleBetweenStartInput: (e: ChangeEvent<HTMLInputElement>) => void
  handleBetweenEndInput: (e: ChangeEvent<HTMLInputElement>) => void
  handleDateInput: (e: ChangeEvent<HTMLInputElement>) => void
  handleDirectInput: (e: ChangeEvent<HTMLInputElement>) => void
  // Combo box
  isValueDropdownOpen: boolean
  distinctValues: unknown[]
  valuesLoading: boolean
  valuesError: unknown
  searchText: string
  setSearchText: (text: string) => void
  highlightedIndex: number
  setHighlightedIndex: (index: number) => void
  valueListRef: RefObject<HTMLDivElement>
  handleValueSelect: (value: unknown, event?: MouseEvent | { shiftKey: boolean }) => void
  handleValueRemove: (value: unknown) => void
  handleValueKeyDown: (e: KeyboardEvent) => void
}

function DateRangeInput(props: FilterValueInputProps) {
  const { t } = useTranslation()
  const {
    filter,
    rangeType,
    numberValue,
    dateRangeLabel,
    isDateRangeDropdownOpen,
    setIsOperatorDropdownOpen,
    setIsValueDropdownOpen,
    setIsDateRangeDropdownOpen,
    handleRangeTypeChange,
    handleNumberValueChange,
    handleCustomStartDate,
    handleCustomEndDate
  } = props
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
          className="dc:w-full dc:flex dc:items-center dc:justify-between dc:text-left dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text hover:bg-dc-surface-hover"
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
                className={`dc:w-full dc:text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover ${
                  option.value === rangeType ? 'bg-dc-primary/10 text-dc-primary' : 'text-dc-text'
                }`}
              >
                {t(option.label)}
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
            value={Array.isArray(filter.dateRange) ? filter.dateRange[0] : ''}
            onChange={handleCustomStartDate}
            className="dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded dc:px-2 dc:py-2 bg-dc-surface text-dc-text"
          />
          <span className="dc:text-sm text-dc-text-muted">{t('filter.modal.dateTo')}</span>
          <input
            type="date"
            value={Array.isArray(filter.dateRange) ? filter.dateRange[1] : ''}
            onChange={handleCustomEndDate}
            className="dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded dc:px-2 dc:py-2 bg-dc-surface text-dc-text"
          />
        </div>
      )}
    </div>
  )
}

function ComboBoxValuesList(props: FilterValueInputProps) {
  const { t } = useTranslation()
  const {
    filter,
    distinctValues,
    valuesLoading,
    valuesError,
    highlightedIndex,
    valueListRef,
    handleValueSelect
  } = props

  if (valuesLoading) {
    return <div className="dc:px-3 dc:py-2 dc:text-sm text-dc-text-muted">{t('filter.modal.loading')}</div>
  }
  if (valuesError) {
    return <div className="dc:px-3 dc:py-2 dc:text-sm text-dc-error">{t('filter.modal.errorPrefix')}{String(valuesError)}</div>
  }
  if (distinctValues.length === 0) {
    return <div className="dc:px-3 dc:py-2 dc:text-sm text-dc-text-muted">{t('filter.modal.noValues')}</div>
  }

  return (
    <div ref={valueListRef} className="dc:max-h-40 dc:overflow-y-auto">
      {distinctValues.map((value, index) => {
        const isSelected = filter.values?.includes(value)
        const isHighlighted = index === highlightedIndex
        return (
          <button
            key={`${value}-${index}`}
            onClick={(e) => handleValueSelect(value, e)}
            className={`dc:w-full dc:text-left dc:px-3 dc:py-2 dc:text-sm dc:transition-colors ${
              isHighlighted ? 'bg-dc-surface-hover' : ''
            } ${
              isSelected ? 'bg-dc-primary/10 text-dc-primary' : 'text-dc-text hover:bg-dc-surface-hover'
            }`}
          >
            {String(value)}
            {isSelected && <span className="dc:float-right">✓</span>}
          </button>
        )
      })}
    </div>
  )
}

function ComboBoxInput(props: FilterValueInputProps) {
  const { t } = useTranslation()
  const {
    filter,
    operatorMeta,
    isValueDropdownOpen,
    valuesLoading,
    searchText,
    setSearchText,
    setHighlightedIndex,
    setIsOperatorDropdownOpen,
    setIsValueDropdownOpen,
    setIsDateRangeDropdownOpen,
    handleValueRemove,
    handleValueKeyDown
  } = props

  return (
    <div className="dc:space-y-2">
      {/* Selected values as tags */}
      {filter.values && filter.values.length > 0 && (
        <div className="dc:flex dc:flex-wrap dc:gap-1.5">
          {filter.values.map((value: unknown, index: number) => (
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
          className="dc:w-full dc:flex dc:items-center dc:justify-between dc:text-left dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text hover:bg-dc-surface-hover"
        >
          <span className="text-dc-text-muted dc:truncate">
            {valuesLoading ? t('filter.modal.loading') : t('filter.modal.selectValue')}
          </span>
          <ChevronDownIcon className={`dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-2 dc:transition-transform ${
            isValueDropdownOpen ? 'dc:rotate-180' : ''
          }`} />
        </button>

        {isValueDropdownOpen && (
          <div className="dc:absolute dc:z-[60] dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded dc:shadow-lg dc:max-h-56 dc:overflow-hidden">
            {/* Search input with keyboard navigation */}
            <div className="dc:p-2 dc:border-b border-dc-border">
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value)
                  setHighlightedIndex(-1)
                }}
                onKeyDown={handleValueKeyDown}
                placeholder={t('filter.modal.search')}
                className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
                autoFocus
              />
            </div>

            {/* Values list */}
            <ComboBoxValuesList {...props} />
          </div>
        )}
      </div>

      {/* Helper text for multi-select */}
      {operatorMeta?.supportsMultipleValues && (
        <p className="dc:text-xs text-dc-text-muted">
          {t('filter.modal.multiSelectHint')}
        </p>
      )}
    </div>
  )
}

export default function FilterValueInput(props: FilterValueInputProps) {
  const { t } = useTranslation()
  const {
    filter,
    operatorMeta,
    shouldShowDateRange,
    shouldShowComboBox,
    handleBetweenStartInput,
    handleBetweenEndInput,
    handleDateInput,
    handleDirectInput
  } = props

  // No value required for set/notSet
  if (!operatorMeta?.requiresValues) {
    return (
      <div className="dc:text-sm text-dc-text-muted dc:italic dc:py-2">
        {t('filter.modal.noValueRequired')}
      </div>
    )
  }

  // Date range selector for inDateRange on time fields
  if (shouldShowDateRange) {
    return <DateRangeInput {...props} />
  }

  // Between/notBetween range inputs
  if (filter.operator === ('between' as FilterOperator) || filter.operator === ('notBetween' as FilterOperator)) {
    return (
      <div className="dc:flex dc:items-center dc:gap-2">
        <input
          type="number"
          value={filter.values?.[0] ?? ''}
          onChange={handleBetweenStartInput}
          placeholder={t('filter.modal.min')}
          className="dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
        />
        <span className="dc:text-sm text-dc-text-muted">{t('filter.modal.to')}</span>
        <input
          type="number"
          value={filter.values?.[1] ?? ''}
          onChange={handleBetweenEndInput}
          placeholder={t('filter.modal.max')}
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
        value={filter.values?.[0] || ''}
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
        value={filter.values?.[0] ?? ''}
        onChange={handleDirectInput}
        placeholder={t('filter.modal.enterNumber')}
        className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
      />
    )
  }

  // Combo box for equals/notEquals/in/notIn on dimensions
  if (shouldShowComboBox) {
    return <ComboBoxInput {...props} />
  }

  // Default: text input
  return (
    <input
      type="text"
      value={filter.values?.[0] ?? ''}
      onChange={handleDirectInput}
      placeholder={t('filter.modal.enterValue')}
      className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text placeholder-dc-text-muted"
    />
  )
}
