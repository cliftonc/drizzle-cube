/**
 * DashboardFilterConfigModalParts
 *
 * Presentational sections extracted from DashboardFilterConfigModal (field
 * selector, operator dropdown). Markup, classes, and i18n keys are identical to
 * the previous inline JSX — pure extraction to keep the main render flat.
 */

import { getIcon } from '../../icons'
import type { MetaResponse } from '../../shared/types'
import type { SimpleFilter, FilterOperator } from '../../types'
import { useTranslation } from '../../hooks/useTranslation'
import { getFieldTitle } from '../AnalysisBuilder/utils'

const ChevronDownIcon = getIcon('chevronDown')
const DimensionIcon = getIcon('dimension')
const TimeDimensionIcon = getIcon('timeDimension')
const MeasureIcon = getIcon('measure')
const EditIcon = getIcon('edit')
const EyeIcon = getIcon('eye')
const EyeOffIcon = getIcon('eyeOff')

interface FieldSelectionSectionProps {
  localFilter: SimpleFilter
  activeSchema: MetaResponse | null
  isTimeField: boolean
  isMeasureField: boolean
  showAllFields: boolean
  setShowAllFields: (next: boolean) => void
  setShowFieldSearch: (next: boolean) => void
}

export function FieldSelectionSection({
  localFilter,
  activeSchema,
  isTimeField,
  isMeasureField,
  showAllFields,
  setShowAllFields,
  setShowFieldSearch
}: FieldSelectionSectionProps) {
  const { t } = useTranslation()
  const fieldTitle = getFieldTitle(localFilter.member, activeSchema)
  const FieldIcon = isTimeField ? TimeDimensionIcon : isMeasureField ? MeasureIcon : DimensionIcon
  const iconBgClass = isTimeField ? 'bg-dc-time-dimension' : isMeasureField ? 'bg-dc-measure' : 'bg-dc-dimension'
  const iconTextClass = isTimeField ? 'text-dc-time-dimension-text' : isMeasureField ? 'text-dc-measure-text' : 'text-dc-dimension-text'

  return (
    <div>
      <div className="dc:flex dc:items-center dc:justify-between dc:mb-2">
        <label className="dc:block dc:text-sm dc:font-medium text-dc-text-secondary">
          {t('dashboardFilter.field')}
        </label>
        <button
          onClick={() => setShowAllFields(!showAllFields)}
          className="dc:flex dc:items-center dc:gap-1 dc:text-xs dc:px-2 dc:py-1 dc:rounded hover:bg-dc-surface-hover text-dc-text-muted"
          title={showAllFields ? 'Show dashboard fields only' : 'Show all fields'}
        >
          {showAllFields ? (
            <>
              <EyeOffIcon className="dc:w-3.5 dc:h-3.5" />
              <span>{t('dashboardFilter.dashboard')}</span>
            </>
          ) : (
            <>
              <EyeIcon className="dc:w-3.5 dc:h-3.5" />
              <span>{t('dashboardFilter.all')}</span>
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
            <span className="dc:flex-1 dc:text-sm dc:font-medium text-dc-text dc:text-left">{fieldTitle}</span>
          </>
        ) : (
          <>
            <span className="dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded bg-dc-surface-tertiary text-dc-text-muted">
              <DimensionIcon className="dc:w-4 dc:h-4" />
            </span>
            <span className="dc:flex-1 dc:text-sm text-dc-text-muted dc:text-left">{t('dashboardFilter.clickToSelectField')}</span>
          </>
        )}
        <EditIcon className="dc:w-4 dc:h-4 text-dc-text-muted" />
      </button>
    </div>
  )
}

interface OperatorSectionProps {
  localFilter: SimpleFilter
  operatorLabel: string
  availableOperators: { operator: string; label: string }[]
  isOperatorDropdownOpen: boolean
  setIsOperatorDropdownOpen: (next: boolean) => void
  setIsValueDropdownOpen: (next: boolean) => void
  setIsDateRangeDropdownOpen: (next: boolean) => void
  handleOperatorChange: (operator: FilterOperator) => void
}

export function OperatorSection({
  localFilter,
  operatorLabel,
  availableOperators,
  isOperatorDropdownOpen,
  setIsOperatorDropdownOpen,
  setIsValueDropdownOpen,
  setIsDateRangeDropdownOpen,
  handleOperatorChange
}: OperatorSectionProps) {
  const { t } = useTranslation()
  return (
    <div>
      <label className="dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2">
        {t('dashboardFilter.operator')}
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
                  op.operator === localFilter.operator ? 'bg-dc-primary/10 text-dc-primary' : 'text-dc-text'
                }`}
              >
                {t(op.label)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
