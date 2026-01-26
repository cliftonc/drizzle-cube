/**
 * FunnelStepList Component
 *
 * Vertical list of funnel steps with drag-and-drop reordering.
 * Each step can be configured with a name, cube, and filters.
 */

import React, { memo, useCallback, useState } from 'react'
import type { CubeMeta, FunnelStepState } from '../../types'
import { getIcon } from '../../icons'
import FunnelStepCard from './FunnelStepCard'
import SectionHeading from './SectionHeading'

const AddIcon = getIcon('add')

export interface FunnelStepListProps {
  /** Array of funnel steps */
  steps: FunnelStepState[]
  /** Index of currently active step */
  activeStepIndex: number
  /** Cube metadata for cube/field selection */
  schema: CubeMeta | null

  // Actions
  /** Add a new step */
  onAddStep: () => void
  /** Remove a step by index */
  onRemoveStep: (index: number) => void
  /** Update a step */
  onUpdateStep: (index: number, updates: Partial<FunnelStepState>) => void
  /** Select a step */
  onSelectStep: (index: number) => void
  /** Reorder steps (drag and drop) */
  onReorderSteps: (fromIndex: number, toIndex: number) => void
}

/**
 * FunnelStepList displays a vertical list of funnel steps
 * with drag-and-drop reordering support.
 */
const FunnelStepList = memo(function FunnelStepList({
  steps,
  activeStepIndex,
  schema,
  onAddStep,
  onRemoveStep,
  onUpdateStep,
  onSelectStep,
  onReorderSteps,
}: FunnelStepListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Drag handlers
  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }, [draggedIndex])

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorderSteps(draggedIndex, index)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [draggedIndex, onReorderSteps])

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }, [])

  return (
    <div className="dc:space-y-4">
      {/* Header */}
      <div className="dc:flex dc:items-center dc:justify-between">
        <SectionHeading>
          Funnel Steps
          {steps.length > 0 && (
            <span className="dc:ml-1.5 dc:text-xs dc:font-normal text-dc-text-muted dc:normal-case dc:tracking-normal">
              ({steps.length})
            </span>
          )}
        </SectionHeading>
      </div>

      {/* Step List */}
      {steps.length === 0 ? (
        <div className="text-center dc:py-8">
          <p className="dc:text-sm text-dc-text-muted dc:mb-3">
            No steps defined. Add at least 2 steps to create a funnel.
          </p>
          <button
            onClick={onAddStep}
            className="dc:inline-flex dc:items-center dc:gap-1.5 dc:px-3 dc:py-1.5 dc:text-sm dc:font-medium text-dc-primary bg-dc-primary/10 dc:rounded-md hover:bg-dc-primary/20 dc:transition-colors"
          >
            <AddIcon className="dc:w-4 dc:h-4" />
            Add First Step
          </button>
        </div>
      ) : (
        <div className="dc:space-y-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`dc:transition-all ${
                draggedIndex === index ? 'dc:opacity-50' : ''
              } ${
                dragOverIndex === index
                  ? 'dc:border-t-2 border-dc-primary dc:pt-1'
                  : ''
              }`}
            >
              <FunnelStepCard
                step={step}
                stepIndex={index}
                isActive={index === activeStepIndex}
                canRemove={steps.length > 1}
                schema={schema}
                onSelect={() => onSelectStep(index)}
                onRemove={() => onRemoveStep(index)}
                onUpdate={(updates) => onUpdateStep(index, updates)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add Step Button */}
      {steps.length > 0 && (
        <button
          onClick={onAddStep}
          className="dc:flex dc:items-center dc:justify-center dc:gap-1.5 dc:w-full dc:py-2 dc:text-sm dc:font-medium text-dc-text-secondary bg-dc-surface dc:border-2 dc:border-dashed border-dc-border dc:rounded-lg hover:border-dc-primary hover:text-dc-primary hover:bg-dc-primary/5 dc:transition-colors"
        >
          <AddIcon className="dc:w-4 dc:h-4" />
          Add Step
        </button>
      )}

      {/* Validation Hint */}
      {steps.length === 1 && (
        <p className="dc:text-xs text-dc-warning text-center">
          Add at least one more step to create a valid funnel
        </p>
      )}
    </div>
  )
})

export default FunnelStepList
