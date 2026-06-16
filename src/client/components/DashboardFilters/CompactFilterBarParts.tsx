/**
 * CompactFilterBarParts
 *
 * Presentational sub-components and the desktop/mobile layouts extracted from
 * CompactFilterBar. Markup, classes, and i18n keys are identical to the previous
 * inline JSX — pure extraction to keep the main render flat.
 */

import type { RefObject } from 'react'
import { getIcon } from '../../icons/index.js'
import DatePresetChips from './DatePresetChips.js'
import CustomDateDropdown from './CustomDateDropdown.js'
import XTDDropdown from './XTDDropdown.js'
import FilterChip from './FilterChip.js'
import type { DashboardFilter, CubeMeta } from '../../types.js'
import { useTranslation } from '../../hooks/useTranslation.js'

const AddIcon = getIcon('add')
const CalendarIcon = getIcon('timeDimension')
const ChevronDownIcon = getIcon('chevronDown')
const FilterIcon = getIcon('filter')

export interface CompactFilterBarViewProps {
  schema: CubeMeta | null
  isEditMode: boolean
  onAddFilter?: () => void
  onEditFilter?: (filterId: string) => void
  onRemoveFilter?: (filterId: string) => void
  currentDateRange: string | string[] | null
  activePresetId: string | null
  activeXTDId: string | null
  nonDateFilters: DashboardFilter[]
  dateRangeTooltip: string | null
  showCustomDropdown: boolean
  setShowCustomDropdown: (next: boolean) => void
  showXTDDropdown: boolean
  setShowXTDDropdown: (next: boolean) => void
  customButtonRef: RefObject<HTMLButtonElement>
  xtdButtonRef: RefObject<HTMLButtonElement>
  handlePresetSelect: (presetValue: string) => void
  handleXTDSelect: (xtdValue: string) => void
  handleCustomDateSelect: (dateRange: string | string[]) => void
  handleFilterChange: (filterId: string, updatedFilter: DashboardFilter) => void
}

function AddFilterButton({
  isEditMode,
  onAddFilter,
  withHoverHandlers
}: {
  isEditMode: boolean
  onAddFilter?: () => void
  withHoverHandlers: boolean
}) {
  if (!isEditMode || !onAddFilter) return null
  return (
    <button
      type="button"
      onClick={onAddFilter}
      className="dc:flex dc:items-center dc:gap-1 dc:px-2 dc:py-1 dc:rounded dc:text-xs dc:font-medium dc:border dc:transition-colors"
      style={{
        borderColor: 'var(--dc-border)',
        color: 'var(--dc-text-secondary)',
        backgroundColor: 'transparent'
      }}
      onMouseEnter={withHoverHandlers ? (e) => {
        e.currentTarget.style.backgroundColor = 'var(--dc-surface-hover)'
      } : undefined}
      onMouseLeave={withHoverHandlers ? (e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      } : undefined}
    >
      <AddIcon className="dc:w-3.5 dc:h-3.5" />
    </button>
  )
}

function NonDateFilterChips({
  nonDateFilters,
  schema,
  isEditMode,
  onEditFilter,
  onRemoveFilter,
  handleFilterChange
}: Pick<
  CompactFilterBarViewProps,
  'nonDateFilters' | 'schema' | 'isEditMode' | 'onEditFilter' | 'onRemoveFilter' | 'handleFilterChange'
>) {
  return (
    <>
      {nonDateFilters.map(filter => (
        <FilterChip
          key={filter.id}
          filter={filter}
          schema={schema}
          isEditMode={isEditMode}
          onChange={(updatedFilter) => handleFilterChange(filter.id, updatedFilter)}
          onEdit={() => onEditFilter?.(filter.id)}
          onRemove={() => onRemoveFilter?.(filter.id)}
        />
      ))}
    </>
  )
}

function CustomDateButton({
  props,
  showLabel,
  withTitle
}: {
  props: CompactFilterBarViewProps
  showLabel: boolean
  withTitle: boolean
}) {
  const { t } = useTranslation()
  const {
    activePresetId,
    dateRangeTooltip,
    showCustomDropdown,
    setShowCustomDropdown,
    setShowXTDDropdown,
    customButtonRef,
    currentDateRange,
    handleCustomDateSelect
  } = props
  return (
    <div className="dc:relative">
      <button
        ref={customButtonRef}
        type="button"
        onClick={() => {
          setShowCustomDropdown(!showCustomDropdown)
          setShowXTDDropdown(false)
        }}
        title={withTitle ? (activePresetId === 'custom' && dateRangeTooltip ? dateRangeTooltip : 'Custom date range') : undefined}
        className={`
          dc:flex dc:items-center dc:gap-1 dc:px-2.5 dc:py-1 dc:rounded dc:text-xs dc:font-medium dc:border
          dc:transition-colors${withTitle ? ' dc:focus:outline-none dc:focus:ring-2 dc:focus:ring-offset-1' : ''}
        `}
        style={{
          backgroundColor: activePresetId === 'custom' ? 'var(--dc-primary)' : 'var(--dc-surface)',
          color: activePresetId === 'custom' ? 'white' : 'var(--dc-text)',
          borderColor: activePresetId === 'custom' ? 'transparent' : 'var(--dc-border)'
        }}
      >
        <CalendarIcon className="dc:w-3 dc:h-3" />
        <span>{t('dateRange.custom')}</span>
        {showLabel && <ChevronDownIcon className="dc:w-3 dc:h-3" />}
      </button>

      {showCustomDropdown && (
        <CustomDateDropdown
          isOpen={showCustomDropdown}
          onClose={() => setShowCustomDropdown(false)}
          onDateRangeChange={handleCustomDateSelect}
          currentDateRange={currentDateRange as string | string[] | undefined}
          anchorRef={customButtonRef}
        />
      )}
    </div>
  )
}

function XTDButton({
  props,
  withTitle
}: {
  props: CompactFilterBarViewProps
  withTitle: boolean
}) {
  const {
    activeXTDId,
    dateRangeTooltip,
    showXTDDropdown,
    setShowXTDDropdown,
    setShowCustomDropdown,
    xtdButtonRef,
    handleXTDSelect
  } = props
  return (
    <div className="dc:relative">
      <button
        ref={xtdButtonRef}
        type="button"
        onClick={() => {
          setShowXTDDropdown(!showXTDDropdown)
          setShowCustomDropdown(false)
        }}
        title={withTitle ? (activeXTDId && dateRangeTooltip ? dateRangeTooltip : 'X to Date options') : undefined}
        className={`
          dc:flex dc:items-center dc:gap-1 dc:px-2.5 dc:py-1 dc:rounded dc:text-xs dc:font-medium dc:border
          dc:transition-colors${withTitle ? ' dc:focus:outline-none dc:focus:ring-2 dc:focus:ring-offset-1' : ''}
        `}
        style={{
          backgroundColor: activeXTDId ? 'var(--dc-primary)' : 'var(--dc-surface)',
          color: activeXTDId ? 'white' : 'var(--dc-text)',
          borderColor: activeXTDId ? 'transparent' : 'var(--dc-border)'
        }}
      >
        <span>XTD</span>
        <ChevronDownIcon className="dc:w-3 dc:h-3" />
      </button>

      {showXTDDropdown && (
        <XTDDropdown
          isOpen={showXTDDropdown}
          onClose={() => setShowXTDDropdown(false)}
          onSelect={handleXTDSelect}
          currentXTD={activeXTDId}
          anchorRef={xtdButtonRef}
        />
      )}
    </div>
  )
}

export function DesktopLayout(props: CompactFilterBarViewProps) {
  const { activePresetId, activeXTDId, nonDateFilters, handlePresetSelect, isEditMode, onAddFilter } = props
  return (
    <div className="dc:hidden dc:md:flex dc:items-center dc:gap-2 dc:px-3 dc:py-2">
      {/* Filter Icon */}
      <FilterIcon
        className="dc:w-4 dc:h-4 dc:shrink-0"
        style={{ color: 'var(--dc-text-secondary)' }}
      />

      {/* Date Preset Chips */}
      <DatePresetChips
        activePreset={activePresetId !== 'custom' && !activeXTDId ? activePresetId : null}
        onPresetSelect={handlePresetSelect}
      />

      {/* Custom Date Button */}
      <CustomDateButton props={props} showLabel withTitle />

      {/* XTD Button */}
      <XTDButton props={props} withTitle />

      {/* Separator */}
      {nonDateFilters.length > 0 && (
        <div
          className="dc:h-5 dc:w-px dc:mx-1"
          style={{ backgroundColor: 'var(--dc-border)' }}
        />
      )}

      {/* Non-date Filter Chips */}
      <div className="dc:flex dc:items-center dc:gap-1.5 dc:flex-wrap">
        <NonDateFilterChips {...props} />
      </div>

      {/* Add Filter Button (Edit Mode) */}
      <AddFilterButton isEditMode={isEditMode} onAddFilter={onAddFilter} withHoverHandlers />
    </div>
  )
}

export function MobileLayout(props: CompactFilterBarViewProps) {
  const { activePresetId, activeXTDId, nonDateFilters, handlePresetSelect, isEditMode, onAddFilter } = props
  return (
    <div className="dc:md:hidden">
      {/* Presets row with horizontal scroll */}
      <div className="dc:flex dc:items-center dc:gap-2 dc:overflow-x-auto dc:px-3 dc:py-2 scrollbar-thin">
        {/* Filter Icon */}
        <FilterIcon
          className="dc:w-4 dc:h-4 dc:shrink-0"
          style={{ color: 'var(--dc-text-secondary)' }}
        />
        <DatePresetChips
          activePreset={activePresetId !== 'custom' && !activeXTDId ? activePresetId : null}
          onPresetSelect={handlePresetSelect}
        />
      </div>

      {/* Custom, XTD, and Add buttons */}
      <div
        className="dc:flex dc:items-center dc:justify-between dc:px-3 dc:py-2 dc:border-t"
        style={{ borderColor: 'var(--dc-border)' }}
      >
        <div className="dc:flex dc:items-center dc:gap-2">
          {/* Custom Button */}
          <CustomDateButton props={props} showLabel={false} withTitle={false} />

          {/* XTD Button */}
          <XTDButton props={props} withTitle={false} />
        </div>

        {/* Add Filter Button (Edit Mode) */}
        <AddFilterButton isEditMode={isEditMode} onAddFilter={onAddFilter} withHoverHandlers={false} />
      </div>

      {/* Non-date Filter Chips (Mobile) */}
      {nonDateFilters.length > 0 && (
        <div
          className="dc:px-3 dc:py-2 dc:border-t"
          style={{ borderColor: 'var(--dc-border)' }}
        >
          <div className="dc:flex dc:items-center dc:gap-1.5 dc:flex-wrap">
            <NonDateFilterChips {...props} />
          </div>
        </div>
      )}
    </div>
  )
}
