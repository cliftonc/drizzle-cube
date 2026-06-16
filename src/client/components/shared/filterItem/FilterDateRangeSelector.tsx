/**
 * Date-range selector for FilterItem time-dimension filters: range-type
 * dropdown plus custom date inputs or a number input.
 */

import { getIcon } from '../../../icons/index.js'
import { useTranslation } from '../../../hooks/useTranslation.js'
import type { DateRangeType } from '../types.js'
import { DATE_RANGE_OPTIONS } from '../types.js'
import { requiresNumberInput } from '../utils.js'

const ChevronDownIcon = getIcon('chevronDown')

interface FilterDateRangeSelectorProps {
  rangeType: DateRangeType
  selectedRangeLabel: string
  numberValue: number
  customDates: { startDate: string; endDate: string }
  isDropdownOpen: boolean
  onDropdownToggle: () => void
  onRangeTypeChange: (rangeType: DateRangeType) => void
  onCustomDateChange: (field: 'startDate' | 'endDate', value: string) => void
  onNumberChange: (value: number) => void
}

const INPUT_CLASS =
  'dc:flex-1 dc:min-w-0 dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent'

export function FilterDateRangeSelector({
  rangeType,
  selectedRangeLabel,
  numberValue,
  customDates,
  isDropdownOpen,
  onDropdownToggle,
  onRangeTypeChange,
  onCustomDateChange,
  onNumberChange
}: FilterDateRangeSelectorProps) {
  const { t } = useTranslation()

  return (
    <div className="dc:flex dc:items-center dc:gap-2">
      {/* Range type selector */}
      <div className="dc:relative dc:shrink-0">
        <button
          onClick={onDropdownToggle}
          className="dc:w-full dc:sm:w-40 dc:flex dc:items-center dc:justify-between dc:text-left dc:text-sm dc:border border-dc-border dc:rounded-sm dc:px-2 dc:py-1 bg-dc-surface text-dc-text hover:bg-dc-surface-hover dc:focus:ring-2 focus:ring-dc-accent focus:border-dc-accent"
        >
          <span className="dc:truncate">{selectedRangeLabel}</span>
          <ChevronDownIcon className={`dc:w-4 dc:h-4 text-dc-text-muted dc:shrink-0 dc:ml-1 dc:transition-transform ${
            isDropdownOpen ? 'dc:transform dc:rotate-180' : ''
          }`} />
        </button>

        {isDropdownOpen && (
          <div className="dc:absolute dc:z-20 dc:left-0 dc:right-0 dc:mt-1 bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg dc:max-h-60 dc:overflow-y-auto">
            {DATE_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => onRangeTypeChange(option.value)}
                className={`dc:w-full dc:text-left dc:px-3 dc:py-2 dc:text-sm hover:bg-dc-surface-hover dc:focus:outline-none focus:bg-dc-surface-hover ${
                  option.value === rangeType ? 'bg-dc-accent-bg text-dc-accent' : 'text-dc-text-secondary'
                }`}
              >
                {t(option.label)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Custom date inputs or number input */}
      {rangeType === 'custom' ? (
        <>
          <input
            type="date"
            value={customDates.startDate}
            onChange={(e) => onCustomDateChange('startDate', e.target.value)}
            placeholder="Start date"
            className={INPUT_CLASS}
          />
          <input
            type="date"
            value={customDates.endDate}
            onChange={(e) => onCustomDateChange('endDate', e.target.value)}
            placeholder="End date"
            className={INPUT_CLASS}
          />
        </>
      ) : requiresNumberInput(rangeType) ? (
        <>
          <input
            type="number"
            min="1"
            max="1000"
            value={numberValue}
            onChange={(e) => onNumberChange(Math.max(1, parseInt(e.target.value) || 1))}
            placeholder="Number"
            className={INPUT_CLASS}
          />
          <div className="dc:shrink-0 dc:text-sm text-dc-text-secondary">
            {rangeType.replace('last_n_', '').replace('_', ' ')}
          </div>
        </>
      ) : null}
    </div>
  )
}
