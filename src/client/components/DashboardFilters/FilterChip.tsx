/**
 * FilterChip Component
 *
 * Compact display of non-date filters as clickable chips.
 * Clicking opens a popover for inline value editing.
 */

import React, { useState, useRef, useCallback } from 'react'
import { getIcon } from '../../icons'
import FilterValuePopover from './FilterValuePopover'
import { formatFilterValueDisplay } from '../shared/utils'
import type { DashboardFilter, CubeMeta, SimpleFilter } from '../../types'

const CloseIcon = getIcon('close')
const EditIcon = getIcon('edit')

interface FilterChipProps {
  filter: DashboardFilter
  schema: CubeMeta | null
  isEditMode: boolean
  onChange: (updatedFilter: DashboardFilter) => void
  onEdit?: () => void
  onRemove?: () => void
}

const FilterChip: React.FC<FilterChipProps> = ({
  filter,
  schema,
  isEditMode,
  onChange,
  onEdit,
  onRemove
}) => {
  const [showPopover, setShowPopover] = useState(false)
  const chipRef = useRef<HTMLDivElement>(null)

  // Get filter details
  const simpleFilter = filter.filter as SimpleFilter
  const { label } = filter
  const { operator, values } = simpleFilter

  // Format value display
  const valueDisplay = formatFilterValueDisplay(values || [], operator)

  // Handle value change from popover
  const handleValueChange = useCallback((newValues: any[]) => {
    onChange({
      ...filter,
      filter: {
        ...simpleFilter,
        values: newValues
      }
    })
  }, [filter, simpleFilter, onChange])

  // Handle chip click - open popover in view mode, or edit in edit mode
  const handleChipClick = useCallback(() => {
    if (isEditMode) {
      // In edit mode, clicking opens the full modal
      onEdit?.()
    } else {
      // In view mode, show inline popover for value editing
      setShowPopover(true)
    }
  }, [isEditMode, onEdit])

  // Don't show chips for group filters
  if (!('member' in filter.filter)) {
    return null
  }

  return (
    <div ref={chipRef} className="dc:relative dc:inline-flex">
      <div
        className={`
          dc:inline-flex dc:items-center dc:gap-1 dc:px-2 dc:py-1 dc:rounded dc:text-xs
          dc:border dc:transition-colors dc:cursor-pointer
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
        title={`${label} ${valueDisplay}`}
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
              className="dc:p-0.5 dc:rounded dc:transition-colors"
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
              className="dc:p-0.5 dc:rounded dc:transition-colors"
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
      {showPopover && !isEditMode && (
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
