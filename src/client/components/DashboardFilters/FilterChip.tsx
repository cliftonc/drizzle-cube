/**
 * FilterChip Component
 *
 * Compact display of field-specific filters as clickable chips.
 * Clicking opens a popover for inline value editing.
 */

import React, { useState, useRef, useCallback } from 'react'
import { getIcon } from '../../icons/index.js'
import FilterValuePopover from './FilterValuePopover.js'
import { formatFilterValueDisplay } from '../shared/utils.js'
import type { DashboardFilter, CubeMeta, SimpleFilter } from '../../types.js'
import { useTranslation } from '../../hooks/useTranslation.js'

const CloseIcon = getIcon('close')
const EditIcon = getIcon('edit')

interface FilterChipProps {
  filter: DashboardFilter
  schema: CubeMeta | null
  isEditMode: boolean
  readOnly?: boolean
  readOnlyDescriptionId?: string
  onChange: (updatedFilter: DashboardFilter) => void
  onEdit?: () => void
  onRemove?: () => void
}

const FilterChip: React.FC<FilterChipProps> = ({
  filter,
  schema,
  isEditMode,
  readOnly = false,
  readOnlyDescriptionId,
  onChange,
  onEdit,
  onRemove
}) => {
  const { t } = useTranslation()
  const [showPopover, setShowPopover] = useState(false)
  const chipRef = useRef<HTMLDivElement>(null)

  // Get filter details
  const simpleFilter = filter.filter as SimpleFilter
  const { label } = filter
  const { operator, dateRange } = simpleFilter
  const values = operator === 'inDateRange' && dateRange
    ? (Array.isArray(dateRange) ? dateRange : [dateRange])
    : simpleFilter.values

  // Format value display
  const valueDisplay = formatFilterValueDisplay(values || [], operator)

  /**
   * Keep the saved date range and picker values in sync, including an empty range.
   * @param newValues - Values emitted by the inline picker.
   */
  const handleValueChange = useCallback((newValues: NonNullable<SimpleFilter['values']>) => {
    const updatedFilter = { ...simpleFilter, values: newValues }
    if (simpleFilter.operator === 'inDateRange') {
      const dateValues = newValues.some(value => value !== '') ? newValues : []
      updatedFilter.values = []
      if (dateValues.length === 0) {
        delete updatedFilter.dateRange
      } else {
        updatedFilter.dateRange = dateValues.length === 1 ? dateValues[0] : dateValues
      }
    }
    onChange({ ...filter, filter: updatedFilter })
  }, [filter, simpleFilter, onChange])

  // Handle chip click - open popover in view mode, or edit in edit mode
  const handleChipClick = useCallback(() => {
    if (readOnly) return
    if (isEditMode) {
      // In edit mode, clicking opens the full modal
      onEdit?.()
    } else {
      // In view mode, show inline popover for value editing
      setShowPopover(true)
    }
  }, [isEditMode, onEdit, readOnly])

  // Don't show chips for group filters
  if (!('member' in filter.filter)) {
    return null
  }

  return (
    <div ref={chipRef} className="dc:relative dc:inline-flex">
      <div
        role={!isEditMode ? 'button' : undefined}
        tabIndex={!isEditMode ? 0 : undefined}
        aria-disabled={readOnly || undefined}
        aria-describedby={readOnly ? readOnlyDescriptionId : undefined}
        onKeyDown={event => {
          if (!isEditMode && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault()
            handleChipClick()
          }
        }}
        className={`
          dc:inline-flex dc:items-center dc:gap-1 dc:px-2 dc:py-1 dc:rounded-sm dc:text-xs
          dc:border dc:transition-colors
          ${readOnly ? 'dc:opacity-50 dc:cursor-not-allowed' : 'dc:cursor-pointer'}
          ${isEditMode ? 'dc:pr-1' : ''}
        `}
        style={{
          backgroundColor: 'var(--dc-surface)',
          borderColor: 'var(--dc-border)',
          color: 'var(--dc-text)'
        }}
        onClick={handleChipClick}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--dc-surface-hover)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'var(--dc-surface)'
        }}
        title={readOnly ? t('dashboard.filterControlledByHost') : `${label} ${valueDisplay}`}
      >
        <span className="dc:font-medium dc:truncate dc:max-w-[100px]">{label}</span>
        {valueDisplay && (
          <>
            <span style={{ color: 'var(--dc-text-secondary)' }}>{valueDisplay}</span>
          </>
        )}

        {/* Edit mode: show edit and remove buttons */}
        {isEditMode && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit?.()
              }}
              className="dc:p-0.5 dc:rounded-sm dc:transition-colors"
              style={{ color: 'var(--dc-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--dc-text)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--dc-text-secondary)'
              }}
            >
              <EditIcon className="dc:w-3 dc:h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemove?.()
              }}
              className="dc:p-0.5 dc:rounded-sm dc:transition-colors"
              style={{ color: 'var(--dc-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--dc-error)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--dc-text-secondary)'
              }}
            >
              <CloseIcon className="dc:w-3 dc:h-3" />
            </button>
          </>
        )}
      </div>

      {/* Value editing popover (view mode only) */}
      {showPopover && !isEditMode && !readOnly && (
        <FilterValuePopover
          filter={simpleFilter}
          schema={schema}
          onValuesChange={handleValueChange}
          onClose={() => setShowPopover(false)}
          anchorRef={chipRef}
        />
      )}
    </div>
  )
}

export default FilterChip
