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
    <div ref={chipRef} className="relative inline-flex">
      <div
        className={`
          inline-flex items-center gap-1 px-2 py-1 rounded text-xs
          border transition-colors cursor-pointer
          ${isEditMode ? 'pr-1' : ''}
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
        <span className="font-medium truncate max-w-[100px]">{label}</span>
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
              className="p-0.5 rounded transition-colors"
              style={{ color: 'var(--dc-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--dc-text)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--dc-text-secondary)'
              }}
            >
              <EditIcon className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRemove?.()
              }}
              className="p-0.5 rounded transition-colors"
              style={{ color: 'var(--dc-text-secondary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--dc-error)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--dc-text-secondary)'
              }}
            >
              <CloseIcon className="w-3 h-3" />
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
