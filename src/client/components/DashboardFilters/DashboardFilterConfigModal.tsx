/**
 * DashboardFilterConfigModal Component
 *
 * Modal for editing dashboard filter configuration including:
 * - Filter label
 * - Field selection (via FieldSearchModal)
 * - Operator selection
 * - Value input (adapts to field/operator type)
 * - Date range selection for time dimensions
 *
 * Based on FilterConfigModal but adapted for DashboardFilter with:
 * - Label editing
 * - Clickable field section to change field
 * - "Dashboard fields only" toggle
 * - Delete action
 *
 * State, effects, and handlers live in `useDashboardFilterConfigModal`; the
 * value-input control and field/operator sections are extracted into sibling
 * components. This file is the layout shell.
 */

import { useTranslation } from '../../hooks/useTranslation'
import { getIcon } from '../../icons'
import type { DashboardFilter } from '../../types'
import type { MetaResponse } from '../../shared/types'
import FieldSearchModal from '../AnalysisBuilder/FieldSearchModal'
import { useDashboardFilterConfigModal } from './useDashboardFilterConfigModal'
import DashboardFilterValueInput from './DashboardFilterValueInput'
import { FieldSelectionSection, OperatorSection } from './DashboardFilterConfigModalParts'

const CloseIcon = getIcon('close')

interface DashboardFilterConfigModalProps {
  /** The dashboard filter being edited */
  filter: DashboardFilter
  /** Full schema (unfiltered) */
  fullSchema: MetaResponse | null
  /** Filtered schema (dashboard fields only) */
  filteredSchema: MetaResponse | null
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when user saves changes */
  onSave: (filter: DashboardFilter) => void
  /** Callback when user deletes the filter */
  onDelete: () => void
  /** Callback when user closes/cancels */
  onClose: () => void
}

export default function DashboardFilterConfigModal({
  filter: initialFilter,
  fullSchema,
  filteredSchema,
  isOpen,
  onSave,
  onDelete,
  onClose
}: DashboardFilterConfigModalProps) {
  const { t } = useTranslation()
  const modal = useDashboardFilterConfigModal({
    initialFilter,
    fullSchema,
    filteredSchema,
    isOpen,
    onSave
  })

  if (!isOpen) return null

  const {
    containerRef,
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
    activeSchema,
    isTimeField,
    isMeasureField,
    operatorMeta,
    availableOperators,
    shouldShowDateRange,
    shouldShowComboBox,
    distinctValues,
    valuesLoading,
    valuesError,
    operatorLabel,
    dateRangeLabel,
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
  } = modal

  const showFieldSection = !initialFilter.isUniversalTime
  const showOperatorSection = localFilter.member && !initialFilter.isUniversalTime
  const showValueSection = localFilter.member && !initialFilter.isUniversalTime

  return (
    <>
      {/* Modal overlay */}
      <div
        className="dc:fixed dc:inset-0 dc:z-50 dc:flex dc:items-center dc:justify-center dc:p-4"
        style={{ backgroundColor: 'var(--dc-overlay)' }}
        onClick={onClose}
      >
        <div
          ref={containerRef}
          className="bg-dc-surface dc:rounded-lg dc:border border-dc-border dc:max-w-md dc:w-full dc:max-h-[90vh] dc:overflow-auto"
          style={{ boxShadow: 'var(--dc-shadow-xl)' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="dc:flex dc:items-center dc:justify-between dc:p-4 dc:border-b border-dc-border">
            <h2 className="dc:text-lg dc:font-semibold text-dc-text">{t('dashboardFilter.editFilter')}</h2>
            <button
              onClick={onClose}
              className="dc:p-1 text-dc-text-muted hover:text-dc-text dc:transition-colors"
            >
              <CloseIcon className="dc:w-5 dc:h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="dc:p-4 dc:space-y-4">
            {/* Filter Label */}
            <div>
                <label className="dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2">
                {t('dashboardFilter.filterLabel')}
              </label>
              <input
                type="text"
                value={localLabel}
                onChange={(e) => setLocalLabel(e.target.value)}
                placeholder="Enter filter label"
                className="dc:w-full dc:text-sm dc:border border-dc-border dc:rounded dc:px-3 dc:py-2 bg-dc-surface text-dc-text"
              />
            </div>

            {/* Info box for universal time filters */}
            {initialFilter.isUniversalTime && (
              <div className="dc:p-3 dc:rounded-md bg-dc-info-bg dc:border border-dc-info-border">
                <div className="dc:text-sm dc:font-medium text-dc-info dc:mb-1">
                  {t('dashboardFilter.universalTimeFilter')}
                </div>
                <div className="dc:text-xs text-dc-text-secondary">
                  {t('dashboardFilter.universalTimeDescription')}
                </div>
              </div>
            )}

            {/* Field selection (not for universal time filters) */}
            {showFieldSection && (
              <FieldSelectionSection
                localFilter={localFilter}
                activeSchema={activeSchema}
                isTimeField={isTimeField}
                isMeasureField={isMeasureField}
                showAllFields={showAllFields}
                setShowAllFields={setShowAllFields}
                setShowFieldSearch={setShowFieldSearch}
              />
            )}

            {/* Operator selector (only if field is selected) */}
            {showOperatorSection && (
              <OperatorSection
                localFilter={localFilter}
                operatorLabel={operatorLabel}
                availableOperators={availableOperators}
                isOperatorDropdownOpen={isOperatorDropdownOpen}
                setIsOperatorDropdownOpen={setIsOperatorDropdownOpen}
                setIsValueDropdownOpen={setIsValueDropdownOpen}
                setIsDateRangeDropdownOpen={setIsDateRangeDropdownOpen}
                handleOperatorChange={handleOperatorChange}
              />
            )}

            {/* Value input (only if field is selected, not for universal time filters) */}
            {showValueSection && (
              <div>
                <label className="dc:block dc:text-sm dc:font-medium text-dc-text-secondary dc:mb-2">
                  {t('dashboardFilter.defaultValue')}
                </label>
                <DashboardFilterValueInput
                  filter={localFilter}
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
                  handleValueSelect={handleValueSelect}
                  handleValueRemove={handleValueRemove}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="dc:flex dc:items-center dc:justify-between dc:p-4 dc:border-t border-dc-border">
            <button
              onClick={onDelete}
              className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-danger hover:bg-dc-danger-bg dc:rounded dc:transition-colors"
            >
              {t('dashboardFilter.deleteFilter')}
            </button>
            <div className="dc:flex dc:items-center dc:gap-2">
              <button
                onClick={onClose}
                className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-text-secondary hover:text-dc-text dc:transition-colors"
              >
                {t('common.actions.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="dc:px-4 dc:py-2 dc:text-sm dc:font-medium text-dc-primary-content bg-dc-primary hover:bg-dc-primary-hover dc:rounded dc:transition-colors"
              >
                {t('common.actions.done')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Field Search Modal */}
      {showFieldSearch && (
        <FieldSearchModal
          isOpen={showFieldSearch}
          onClose={() => setShowFieldSearch(false)}
          onSelect={handleFieldSelected}
          mode="filter"
          schema={activeSchema}
          selectedFields={localFilter.member ? [localFilter.member] : []}
        />
      )}
    </>
  )
}
