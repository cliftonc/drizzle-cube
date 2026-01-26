/**
 * FilterValuePopover Component
 *
 * Inline popover for editing filter values.
 * Uses FilterValueSelector for the actual value input.
 */

import React, { useEffect, useRef, useCallback } from 'react'
import FilterValueSelector from '../shared/FilterValueSelector'
import type { SimpleFilter, CubeMeta } from '../../types'
import type { MetaResponse } from '../../shared/types'

interface FilterValuePopoverProps {
  filter: SimpleFilter
  schema: CubeMeta | null
  onValuesChange: (values: any[]) => void
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement>
}

// Convert CubeMeta to MetaResponse format
function convertToMetaResponse(cubeMeta: CubeMeta | null): MetaResponse | null {
  if (!cubeMeta) return null

  return {
    cubes: cubeMeta.cubes.map(cube => ({
      name: cube.name,
      title: cube.title || cube.name,
      description: cube.description || '',
      measures: cube.measures.map(m => ({
        name: m.name,
        title: m.title || m.name,
        type: m.type,
        description: '',
        shortTitle: m.shortTitle || m.title || m.name
      })),
      dimensions: cube.dimensions.map(d => ({
        name: d.name,
        title: d.title || d.name,
        type: d.type,
        description: '',
        shortTitle: d.shortTitle || d.title || d.name
      })),
      segments: cube.segments?.map(s => ({
        name: s.name,
        title: s.title || s.name,
        type: s.type,
        description: '',
        shortTitle: s.shortTitle || s.title || s.name
      })) || []
    }))
  }
}

const FilterValuePopover: React.FC<FilterValuePopoverProps> = ({
  filter,
  schema,
  onValuesChange,
  onClose,
  anchorRef
}) => {
  const popoverRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    // Delay adding listener to prevent immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }, 0)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose, anchorRef])

  // Handle value change
  const handleValuesChange = useCallback((newValues: any[]) => {
    onValuesChange(newValues)
  }, [onValuesChange])

  // Convert schema to MetaResponse format
  const metaResponse = convertToMetaResponse(schema)

  return (
    <div
      ref={popoverRef}
      className="dc:absolute dc:top-full dc:left-0 dc:mt-1 dc:z-50 dc:border dc:rounded-lg dc:shadow-lg dc:p-3 dc:min-w-[220px]"
      style={{
        backgroundColor: 'var(--dc-surface)',
        borderColor: 'var(--dc-border)',
        boxShadow: 'var(--dc-shadow-lg)'
      }}
    >
      {/* Filter label */}
      <div
        className="dc:text-xs dc:font-medium dc:mb-2"
        style={{ color: 'var(--dc-text-secondary)' }}
      >
        Edit value
      </div>

      {/* Value selector */}
      <div className="dc:min-w-[180px]">
        <FilterValueSelector
          fieldName={filter.member}
          operator={filter.operator}
          values={filter.values || []}
          onValuesChange={handleValuesChange}
          schema={metaResponse}
        />
      </div>

      {/* Action buttons */}
      <div className="dc:flex dc:justify-end dc:gap-2 dc:mt-3 dc:pt-2 dc:border-t" style={{ borderColor: 'var(--dc-border)' }}>
        <button
          type="button"
          onClick={onClose}
          className="dc:px-3 dc:py-1 dc:text-xs dc:font-medium dc:rounded dc:border dc:transition-colors"
          style={{
            borderColor: 'var(--dc-border)',
            color: 'var(--dc-text-secondary)',
            backgroundColor: 'transparent'
          }}
        >
          Close
        </button>
      </div>
    </div>
  )
}

export default FilterValuePopover
