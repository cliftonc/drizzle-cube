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
  const nameInputRef = useRef<HTMLInputElement>(null)
  const timeDropdownRef = useRef<HTMLDivElement>(null)

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

  // Handle name change
  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate({ name: e.target.value })
    },
    [onUpdate]
  )

  const handleNameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        setIsEditingName(false)
      } else if (e.key === 'Escape') {
        setIsEditingName(false)
      }
    },
    []
  )

  const handleNameBlur = useCallback(() => {
    setIsEditingName(false)
  }, [])

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
        bg-dc-surface border rounded-lg transition-all cursor-pointer
        ${isActive
          ? 'border-dc-primary ring-1 ring-dc-primary'
          : 'border-dc-border hover:border-dc-text-muted'
        }
      `}
      onClick={onSelect}
    >
      {/* Header Row */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-dc-border">
        {/* Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing text-dc-text-muted hover:text-dc-text">
          {DragHandleIcon && <DragHandleIcon className="w-4 h-4" />}
        </div>

        {/* Step Number */}
        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-dc-primary/10 text-dc-primary text-xs font-medium">
          {stepIndex + 1}
        </span>

        {/* Step Name */}
        {isEditingName ? (
          <input
            ref={nameInputRef}
            type="text"
            value={step.name}
            onChange={handleNameChange}
            onKeyDown={handleNameKeyDown}
            onBlur={handleNameBlur}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 px-1.5 py-0.5 text-sm font-medium bg-dc-surface border border-dc-primary rounded text-dc-text focus:outline-none"
            placeholder="Step name"
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsEditingName(true)
            }}
            className="flex-1 text-left text-sm font-medium text-dc-text hover:text-dc-primary truncate"
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
            className="p-1 rounded hover:bg-dc-danger-bg text-dc-text-muted hover:text-dc-error transition-colors"
            title="Remove step"
          >
            {CloseIcon && <CloseIcon className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Body - Only visible when active */}
      {isActive && (
        <div className="px-3 py-3 space-y-4" onClick={(e) => e.stopPropagation()}>
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
              <label className="flex items-center gap-1.5 text-xs font-medium text-dc-text-muted mb-1">
                {TimeDimensionIcon && <TimeDimensionIcon className="w-3.5 h-3.5" />}
                Time Window
              </label>
              <div ref={timeDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                  className={`
                    flex items-center justify-between w-full px-2.5 py-1.5 text-sm
                    bg-dc-surface border border-dc-border rounded
                    transition-colors hover:border-dc-primary cursor-pointer
                    ${showTimeDropdown ? 'border-dc-primary ring-1 ring-dc-primary' : ''}
                  `}
                >
                  <span className={step.timeToConvert ? 'text-dc-text' : 'text-dc-text-muted'}>
                    {timeToConvertLabel}
                  </span>
                  {ChevronDownIcon && (
                    <ChevronDownIcon
                      className={`w-4 h-4 text-dc-text-muted transition-transform ${showTimeDropdown ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>

                {showTimeDropdown && (
                  <div className="absolute z-50 mt-1 left-0 right-0 bg-dc-surface border border-dc-border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {TIME_TO_CONVERT_OPTIONS.map((option) => (
                      <button
                        key={option.value || 'none'}
                        onClick={() => handleTimeSelect(option.value)}
                        className={`
                          flex items-center justify-between w-full px-3 py-1.5 text-sm
                          transition-colors
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
                          CheckIcon && <CheckIcon className="w-4 h-4" />}
                      </button>
                    ))}
                    <div className="px-3 py-2 border-t border-dc-border text-xs text-dc-text-muted">
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
        <div className="px-3 py-2 text-xs text-dc-text-muted">
          {step.filters.length > 0 && (
            <span>{step.filters.length} filter{step.filters.length !== 1 ? 's' : ''}</span>
          )}
          {step.timeToConvert && stepIndex > 0 && (
            <span className={step.filters.length > 0 ? 'ml-2' : ''}>
              {step.filters.length > 0 ? '• ' : ''}within {timeToConvertLabel.toLowerCase()}
            </span>
          )}
          {step.filters.length === 0 && !step.timeToConvert && (
            <span className="italic">No filters configured</span>
          )}
        </div>
      )}
    </div>
  )
})

export default FunnelStepCard
