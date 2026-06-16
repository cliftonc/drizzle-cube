/**
 * FilterValueInput
 *
 * Presentational value-input renderer extracted from FilterConfigModal. Picks the
 * right input control for the current operator/field type (no-value, date range,
 * between, date, number, dimension combo-box, or plain text). The date-range and
 * combo-box variants are further split into their own sub-components to keep each
 * piece flat. Behaviour and markup are identical to the previous inline rendering.
 *
 * The props are organised into a small set of cohesive groups instead of a flat
 * bag of state + setters. Each leaf input receives only the focused group(s) it
 * needs:
 *   - `field`      — which control to render (filter + operator metadata)
 *   - `dateRange`  — date-range selector state and its handlers
 *   - `combo`      — async distinct-value combo-box state and its handlers
 *   - `inputs`     — handlers for the plain between/date/number/text inputs
 */

import type { ChangeEvent, MouseEvent, KeyboardEvent, RefObject } from 'react'
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

/** Which control to render: the filter being edited and its operator metadata. */
export interface FilterFieldContext {
  filter: SimpleFilter
  operatorMeta: OperatorMeta
  shouldShowDateRange: boolean
  shouldShowComboBox: boolean
}

/** State + handlers for the date-range selector (inDateRange on time fields). */
export interface DateRangeGroup {
  rangeType: DateRangeType
  numberValue: number
  label: string
  isOpen: boolean
  onToggle: (open: boolean) => void
  onRangeTypeChange: (rangeType: DateRangeType) => void
  onNumberValueChange: (value: number) => void
  onCustomStartDate: (e: ChangeEvent<HTMLInputElement>) => void
  onCustomEndDate: (e: ChangeEvent<HTMLInputElement>) => void
  /** Close sibling dropdowns when this one opens. */
  onOpen: () => void
}

/** Async distinct-value combo-box state + handlers (equals/in on dimensions). */
export interface ComboBoxGroup {
  isOpen: boolean
  options: unknown[]
  loading: boolean
  error: unknown
  searchText: string
  highlightedIndex: number
  listRef: RefObject<HTMLDivElement>
  onSearchTextChange: (text: string) => void
  onHighlightedIndexChange: (index: number) => void
  onSelect: (value: unknown, event?: MouseEvent | { shiftKey: boolean }) => void
  onRemove: (value: unknown) => void
  onKeyDown: (e: KeyboardEvent) => void
  /** Open the combo-box, closing sibling dropdowns. */
  onOpen: () => void
}

/** Handlers for the plain between/date/number/text inputs. */
export interface SimpleInputHandlers {
  onBetweenStart: (e: ChangeEvent<HTMLInputElement>) => void
  onBetweenEnd: (e: ChangeEvent<HTMLInputElement>) => void
  onDate: (e: ChangeEvent<HTMLInputElement>) => void
  onDirect: (e: ChangeEvent<HTMLInputElement>) => void
}

export interface FilterValueInputProps {
  field: FilterFieldContext
  dateRange: DateRangeGroup
  combo: ComboBoxGroup
  inputs: SimpleInputHandlers
}

function DateRangeInput({ filter, dateRange }: { filter: SimpleFilter; dateRange: DateRangeGroup }) {
  const { t } = useTranslation()
  const {
    rangeType,
    numberValue,
    label,
    isOpen,
    onToggle,
    onRangeTypeChange,
    onNumberValueChange,
    onCustomStartDate,
    onCustomEndDate,
    onOpen
  } = dateRange
  return (
    <div className="dc:space-y-2">
      {/* Range type dropdown */}
      <div className="dc:relative">
        <button
          onClick={() => {
            onOpen()
            onToggle(!isOpen)
          }}
          className="dc:w-full dc:flex dc:items-center dc:justify-between dc:text-left dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text hover:bg-dc-surface-hover"
        >
          <span className="dc:truncate">{label}</span>
          <ChevronDownIcon className={`dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-2 dc:transition-transform ${
            isOpen ? 'dc:rotate-180' : ''
          }`} />
        </button>

        {isOpen && (
          <div className="dc:absolute dc:z-[60] dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded dc:shadow-lg dc:max-h-48 dc:overflow-y-auto">
            {DATE_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onRangeTypeChange(option.value)}
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
            onChange={(e) => onNumberValueChange(Math.max(1, parseInt(e.target.value) || 1))}
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
            onChange={onCustomStartDate}
            className="dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded dc:px-2 dc:py-2 bg-dc-surface text-dc-text"
          />
          <span className="dc:text-sm text-dc-text-muted">{t('filter.modal.dateTo')}</span>
          <input
            type="date"
            value={Array.isArray(filter.dateRange) ? filter.dateRange[1] : ''}
            onChange={onCustomEndDate}
            className="dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded dc:px-2 dc:py-2 bg-dc-surface text-dc-text"
          />
        </div>
      )}
    </div>
  )
}

function ComboBoxValuesList({ filter, combo }: { filter: SimpleFilter; combo: ComboBoxGroup }) {
  const { t } = useTranslation()
  const { options, loading, error, highlightedIndex, listRef, onSelect } = combo

  if (loading) {
    return <div className="dc:px-3 dc:py-2 dc:text-sm text-dc-text-muted">{t('filter.modal.loading')}</div>
  }
  if (error) {
    return <div className="dc:px-3 dc:py-2 dc:text-sm text-dc-error">{t('filter.modal.errorPrefix')}{String(error)}</div>
  }
  if (options.length === 0) {
    return <div className="dc:px-3 dc:py-2 dc:text-sm text-dc-text-muted">{t('filter.modal.noValues')}</div>
  }

  return (
    <div ref={listRef} className="dc:max-h-40 dc:overflow-y-auto">
      {options.map((value, index) => {
        const isSelected = filter.values?.includes(value)
        const isHighlighted = index === highlightedIndex
        return (
          <button
            key={`${value}-${index}`}
            onClick={(e) => onSelect(value, e)}
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

function ComboBoxInput({
  filter,
  operatorMeta,
  combo
}: {
  filter: SimpleFilter
  operatorMeta: OperatorMeta
  combo: ComboBoxGroup
}) {
  const { t } = useTranslation()
  const {
    isOpen,
    loading,
    searchText,
    onSearchTextChange,
    onHighlightedIndexChange,
    onRemove,
    onKeyDown,
    onOpen
  } = combo

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
                onClick={() => onRemove(value)}
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
            onOpen()
          }}
          className="dc:w-full dc:flex dc:items-center dc:justify-between dc:text-left dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text hover:bg-dc-surface-hover"
        >
          <span className="text-dc-text-muted dc:truncate">
            {loading ? t('filter.modal.loading') : t('filter.modal.selectValue')}
          </span>
          <ChevronDownIcon className={`dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-2 dc:transition-transform ${
            isOpen ? 'dc:rotate-180' : ''
          }`} />
        </button>

        {isOpen && (
          <div className="dc:absolute dc:z-[60] dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded dc:shadow-lg dc:max-h-56 dc:overflow-hidden">
            {/* Search input with keyboard navigation */}
            <div className="dc:p-2 dc:border-b border-dc-border">
              <input
                type="text"
                value={searchText}
                onChange={(e) => {
                  onSearchTextChange(e.target.value)
                  onHighlightedIndexChange(-1)
                }}
                onKeyDown={onKeyDown}
                placeholder={t('filter.modal.search')}
                className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
                autoFocus
              />
            </div>

            {/* Values list */}
            <ComboBoxValuesList filter={filter} combo={combo} />
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

export default function FilterValueInput({ field, dateRange, combo, inputs }: FilterValueInputProps) {
  const { t } = useTranslation()
  const { filter, operatorMeta, shouldShowDateRange, shouldShowComboBox } = field
  const { onBetweenStart, onBetweenEnd, onDate, onDirect } = inputs

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
    return <DateRangeInput filter={filter} dateRange={dateRange} />
  }

  // Between/notBetween range inputs
  if (filter.operator === ('between' as FilterOperator) || filter.operator === ('notBetween' as FilterOperator)) {
    return (
      <div className="dc:flex dc:items-center dc:gap-2">
        <input
          type="number"
          value={filter.values?.[0] ?? ''}
          onChange={onBetweenStart}
          placeholder={t('filter.modal.min')}
          className="dc:flex-1 dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
        />
        <span className="dc:text-sm text-dc-text-muted">{t('filter.modal.to')}</span>
        <input
          type="number"
          value={filter.values?.[1] ?? ''}
          onChange={onBetweenEnd}
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
        onChange={onDate}
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
        onChange={onDirect}
        placeholder={t('filter.modal.enterNumber')}
        className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
      />
    )
  }

  // Combo box for equals/notEquals/in/notIn on dimensions
  if (shouldShowComboBox) {
    return <ComboBoxInput filter={filter} operatorMeta={operatorMeta} combo={combo} />
  }

  // Default: text input
  return (
    <input
      type="text"
      value={filter.values?.[0] ?? ''}
      onChange={onDirect}
      placeholder={t('filter.modal.enterValue')}
      className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text placeholder-dc-text-muted"
    />
  )
}
