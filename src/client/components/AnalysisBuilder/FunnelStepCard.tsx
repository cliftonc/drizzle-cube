/**
 * FunnelStepCard Component
 *
 * Individual funnel step card with:
 * - Editable step name
 * - Filter configuration
 * - Time-to-convert selector (optional)
 * - Drag handle and remove button
 *
 * Note: Cube is inherited from the top-level funnel configuration
 */

import React, { memo, useCallback, useState, useRef, useEffect, useMemo } from 'react'
import type { CubeMeta, Filter, FunnelStepState } from '../../types'
import type { MetaResponse } from '../../shared/types'
import { getIcon } from '../../icons'
import AnalysisFilterSection from './AnalysisFilterSection'
import { getRelatedCubesSchema } from './utils/fieldUtils'

const DragHandleIcon = getIcon('menu')
const CloseIcon = getIcon('close')
const ChevronDownIcon = getIcon('chevronDown')
const CheckIcon = getIcon('check')
const TimeDimensionIcon = getIcon('timeDimension')

// Common time-to-convert durations
const TIME_TO_CONVERT_OPTIONS = [
  { value: null, label: 'No limit' },
  { value: 'PT1H', label: '1 hour' },
  { value: 'PT6H', label: '6 hours' },
  { value: 'PT12H', label: '12 hours' },
  { value: 'P1D', label: '1 day' },
  { value: 'P3D', label: '3 days' },
  { value: 'P7D', label: '7 days' },
  { value: 'P14D', label: '14 days' },
  { value: 'P30D', label: '30 days' },
  { value: 'P90D', label: '90 days' },
]

export interface FunnelStepCardProps {
  /** The step state */
  step: FunnelStepState
  /** Index of this step (0-based) */
  stepIndex: number
  /** Whether this step is currently active/selected */
  isActive: boolean
  /** Whether this step can be removed (false if only 1 step) */
  canRemove: boolean
  /** Cube metadata for filter field selection */
  schema: CubeMeta | null

  // Actions
  /** Select this step */
  onSelect: () => void
  /** Remove this step */
  onRemove: () => void
  /** Update this step */
  onUpdate: (updates: Partial<FunnelStepState>) => void
}

/**
 * FunnelStepCard displays a single funnel step with inline editing
 */
const FunnelStepCard = memo(function FunnelStepCard({
  step,
  stepIndex,
  isActive,
  canRemove,
  schema,
  onSelect,
  onRemove,
  onUpdate,
}: FunnelStepCardProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [showTimeDropdown, setShowTimeDropdown] = useState(false)
  // Local state for name editing - only syncs to store on blur/Enter
  const [localName, setLocalName] = useState(step.name)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const timeDropdownRef = useRef<HTMLDivElement>(null)

  // Sync localName when step.name changes externally (e.g., undo/redo, load from URL)
  useEffect(() => {
    setLocalName(step.name)
  }, [step.name])

  // Focus name input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])

  // Close time dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (timeDropdownRef.current && !timeDropdownRef.current.contains(event.target as Node)) {
        setShowTimeDropdown(false)
      }
    }
    if (showTimeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showTimeDropdown])

  // Handle name change - local state only, no store update
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalName(e.target.value)
    },
    []
  )

  // Handle name key events - blur on Enter (triggers save), revert on Escape
  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        // Blur triggers handleNameBlur which saves the name
        e.currentTarget.blur()
      } else if (e.key === 'Escape') {
        // Revert to original name and exit editing
        setLocalName(step.name)
        setIsEditingName(false)
      }
    },
    [step.name]
  )

  // Handle name blur - save to store only if changed
  const handleNameBlur = useCallback(() => {
    const trimmedName = localName.trim()
    if (trimmedName !== step.name) {
      // Use trimmed name or default to "Step N" if empty
      onUpdate({ name: trimmedName || `Step ${stepIndex + 1}` })
    }
    setIsEditingName(false)
  }, [localName, step.name, onUpdate, stepIndex])

  // Handle time-to-convert selection
  const handleTimeSelect = useCallback(
    (value: string | null) => {
      onUpdate({ timeToConvert: value || undefined })
      setShowTimeDropdown(false)
    },
    [onUpdate]
  )

  // Handle filter changes
  const handleFiltersChange = useCallback(
    (filters: Filter[]) => {
      onUpdate({ filters })
    },
    [onUpdate]
  )

  // Get display label for time-to-convert
  const timeToConvertLabel = step.timeToConvert
    ? TIME_TO_CONVERT_OPTIONS.find((o) => o.value === step.timeToConvert)?.label || step.timeToConvert
    : 'No limit'

  // Get schema for filters - includes related cubes for cross-cube filtering
  // When a cube is selected, include the cube itself plus all related cubes via join relationships
  // This enables filtering by dimensions from related cubes (e.g., filter Events by Users.active)
  const cubeSchema: MetaResponse | null = useMemo(() => {
    if (!schema) return null

    // Cast schema to MetaResponse format for compatibility
    const metaSchema: MetaResponse = {
      cubes: schema.cubes.map((c) => ({
        ...c,
        description: c.description || '',
      })),
    }

    // If a specific cube is selected, include it and all related cubes
    if (step.cube) {
      return getRelatedCubesSchema(step.cube, metaSchema)
    }

    // No specific cube selected - show all cubes
    return metaSchema
  }, [schema, step.cube])

  return (
    <div
      className={`
        bg-dc-surface dc:border dc:rounded-lg dc:transition-all dc:cursor-pointer
        ${isActive
          ? 'border-dc-primary dc:ring-1 ring-dc-primary'
          : 'border-dc-border hover:border-dc-text-muted'
        }
      `}
      onClick={onSelect}
    >
      {/* Header Row */}
      <div className="dc:flex dc:items-center dc:gap-2 dc:px-3 dc:py-2 dc:border-b border-dc-border">
        {/* Drag Handle */}
        <div className="dc:cursor-grab dc:active:cursor-grabbing text-dc-text-muted hover:text-dc-text">
          {DragHandleIcon && <DragHandleIcon className="dc:w-4 dc:h-4" />}
        </div>

        {/* Step Number */}
        <span className="dc:flex-shrink-0 dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded-full bg-dc-primary/10 text-dc-primary dc:text-xs dc:font-medium">
          {stepIndex + 1}
        </span>

        {/* Step Name */}
        {isEditingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={localName}
            onChange={handleNameChange}
            onKeyDown={handleNameKeyDown}
            onBlur={handleNameBlur}
            onClick={(e) => e.stopPropagation()}
            className="dc:flex-1 dc:px-1.5 dc:py-0.5 dc:text-sm dc:font-medium bg-dc-surface dc:border border-dc-primary dc:rounded text-dc-text dc:focus:outline-none"
            placeholder="Step name"
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsEditingName(true)
            }}
            className="dc:flex-1 text-left dc:text-sm dc:font-medium text-dc-text hover:text-dc-primary dc:truncate"
            title="Click to edit name"
          >
            {step.name || `Step ${stepIndex + 1}`}
          </button>
        )}

        {/* Remove Button */}
        {canRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
            className="dc:p-1 dc:rounded hover:bg-dc-danger-bg text-dc-text-muted hover:text-dc-error dc:transition-colors"
            title="Remove step"
          >
            {CloseIcon && <CloseIcon className="dc:w-4 dc:h-4" />}
          </button>
        )}
      </div>

      {/* Body - Only visible when active */}
      {isActive && (
        <div className="dc:px-3 dc:py-3 dc:space-y-4" onClick={(e) => e.stopPropagation()}>
          {/* Filters - only dimensions allowed for funnel step filters */}
          <AnalysisFilterSection
            filters={step.filters}
            schema={cubeSchema}
            onFiltersChange={handleFiltersChange}
            dimensionsOnly
          />

          {/* Time to Convert (only for steps after the first) */}
          {stepIndex > 0 && (
            <div>
              <label className="dc:flex dc:items-center dc:gap-1.5 dc:text-xs dc:font-medium text-dc-text-muted dc:mb-1">
                {TimeDimensionIcon && <TimeDimensionIcon className="dc:w-3.5 dc:h-3.5" />}
                Time Window
              </label>
              <div ref={timeDropdownRef} className="dc:relative">
                <button
                  type="button"
                  onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                  className={`
                    dc:flex dc:items-center dc:justify-between dc:w-full dc:px-2.5 dc:py-1.5 dc:text-sm
                    bg-dc-surface dc:border border-dc-border dc:rounded
                    dc:transition-colors hover:border-dc-primary dc:cursor-pointer
                    ${showTimeDropdown ? 'border-dc-primary dc:ring-1 ring-dc-primary' : ''}
                  `}
                >
                  <span className={step.timeToConvert ? 'text-dc-text' : 'text-dc-text-muted'}>
                    {timeToConvertLabel}
                  </span>
                  {ChevronDownIcon && (
                    <ChevronDownIcon
                      className={`dc:w-4 dc:h-4 text-dc-text-muted dc:transition-transform ${showTimeDropdown ? 'dc:rotate-180' : ''}`}
                    />
                  )}
                </button>

                {showTimeDropdown && (
                  <div className="dc:absolute dc:z-50 dc:mt-1 dc:left-0 dc:right-0 bg-dc-surface dc:border border-dc-border dc:rounded-md dc:shadow-lg dc:max-h-48 dc:overflow-y-auto">
                    {TIME_TO_CONVERT_OPTIONS.map((option) => (
                      <button
                        key={option.value || 'none'}
                        onClick={() => handleTimeSelect(option.value)}
                        className={`
                          dc:flex dc:items-center dc:justify-between dc:w-full dc:px-3 dc:py-1.5 dc:text-sm
                          dc:transition-colors
                          ${step.timeToConvert === option.value ||
                            (!step.timeToConvert && option.value === null)
                            ? 'bg-dc-primary-bg text-dc-primary'
                            : 'text-dc-text hover:bg-dc-surface-hover'
                          }
                        `}
                      >
                        <span>{option.label}</span>
                        {(step.timeToConvert === option.value ||
                          (!step.timeToConvert && option.value === null)) &&
                          CheckIcon && <CheckIcon className="dc:w-4 dc:h-4" />}
                      </button>
                    ))}
                    <div className="dc:px-3 dc:py-2 dc:border-t border-dc-border dc:text-xs text-dc-text-muted">
                      Max time from previous step to qualify
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed view - show filter count when not active */}
      {!isActive && (
        <div className="dc:px-3 dc:py-2 dc:text-xs text-dc-text-muted">
          {step.filters.length > 0 && (
            <span>{step.filters.length} filter{step.filters.length !== 1 ? 's' : ''}</span>
          )}
          {step.timeToConvert && stepIndex > 0 && (
            <span className={step.filters.length > 0 ? 'dc:ml-2' : ''}>
              {step.filters.length > 0 ? '• ' : ''}within {timeToConvertLabel.toLowerCase()}
            </span>
          )}
          {step.filters.length === 0 && !step.timeToConvert && (
            <span className="dc:italic">No filters configured</span>
          )}
        </div>
      )}
    </div>
  )
})

export default FunnelStepCard
