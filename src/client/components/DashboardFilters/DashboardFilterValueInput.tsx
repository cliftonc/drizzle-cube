/**
 * DashboardFilterValueInput
 *
 * Presentational value-input renderer extracted from DashboardFilterConfigModal.
 * Picks the right input control for the current operator/field type (no-value,
 * date range, between, date, number, dimension combo-box, or plain text). The
 * date-range and combo-box variants are split into their own sub-components to
 * keep each piece flat. Behaviour and markup are identical to the previous
 * inline `renderValueInput`.
 */

import type { ChangeEvent } from 'react'
import { getIcon } from '../../icons/index.js'
import type { SimpleFilter, FilterOperator } from '../../types.js'
import type { DateRangeType } from '../../shared/types.js'
import { DATE_RANGE_OPTIONS } from '../../shared/types.js'
import { requiresNumberInput } from '../../shared/utils.js'
import { useTranslation } from '../../hooks/useTranslation.js'

const CloseIcon = getIcon('close')
const ChevronDownIcon = getIcon('chevronDown')

type OperatorMeta = {
  requiresValues?: boolean
  valueType?: string
  supportsMultipleValues?: boolean
} | undefined

export interface DashboardFilterValueInputProps {
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
  handleValueSelect: (value: unknown) => void
  handleValueRemove: (value: unknown) => void
}

function DateRangeInput(props: DashboardFilterValueInputProps) {
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
          <span className="dc:text-sm text-dc-text-muted">to</span>
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

function ComboBoxValuesList(props: DashboardFilterValueInputProps) {
  const { t } = useTranslation()
  const {
    filter,
    distinctValues,
    valuesLoading,
    valuesError,
    handleValueSelect
  } = props

  if (valuesLoading) {
    return <div className="dc:px-3 dc:py-2 dc:text-sm text-dc-text-muted">{t('common.loading')}</div>
  }
  if (valuesError) {
    return <div className="dc:px-3 dc:py-2 dc:text-sm text-dc-error">{t('dashboardFilter.errorPrefix')}{String(valuesError)}</div>
  }
  if (distinctValues.length === 0) {
    return <div className="dc:px-3 dc:py-2 dc:text-sm text-dc-text-muted">{t('dashboardFilter.noValuesFound')}</div>
  }

  return (
    <div className="dc:max-h-40 dc:overflow-y-auto">
      {distinctValues.map((value, index) => {
        const isSelected = filter.values?.includes(value)
        return (
          <button
            key={`${value}-${index}`}
            onClick={() => handleValueSelect(value)}
            className={`dc:w-full dc:text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover ${
              isSelected ? 'bg-dc-primary/10 text-dc-primary' : 'text-dc-text'
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

function ComboBoxInput(props: DashboardFilterValueInputProps) {
  const { t } = useTranslation()
  const {
    filter,
    isValueDropdownOpen,
    valuesLoading,
    searchText,
    setSearchText,
    setIsOperatorDropdownOpen,
    setIsValueDropdownOpen,
    setIsDateRangeDropdownOpen,
    handleValueRemove
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
                placeholder={t('dashboardFilter.search')}
                className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
                autoFocus
              />
            </div>

            {/* Values list */}
            <ComboBoxValuesList {...props} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardFilterValueInput(props: DashboardFilterValueInputProps) {
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
        {t('dashboardFilter.noValueRequired')}
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
          placeholder="Min"
          className="dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
        />
        <span className="dc:text-sm text-dc-text-muted">to</span>
        <input
          type="number"
          value={filter.values?.[1] ?? ''}
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
        placeholder="Enter number"
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
      placeholder="Enter value..."
      className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text placeholder-dc-text-muted"
    />
  )
}
