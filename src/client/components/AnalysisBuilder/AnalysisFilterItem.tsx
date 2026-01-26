/**
 * AnalysisFilterItem Component
 *
 * Compact filter chip for the AnalysisBuilder's narrow column layout.
 * Displays filter as a chip with icon, field name, operator, and value.
 * Clicking the chip opens a modal for editing the filter configuration.
 */

import { useState, useRef } from 'react'
import { getIcon } from '../../icons'
import type { SimpleFilter } from '../../types'
import type { MetaResponse } from '../../shared/types'
import { FILTER_OPERATORS } from '../../shared/types'
import { getFieldTitle, findFieldInSchema } from './utils'
import FilterConfigModal from './FilterConfigModal'

const CloseIcon = getIcon('close')
const DimensionIcon = getIcon('dimension')
const TimeDimensionIcon = getIcon('timeDimension')
const MeasureIcon = getIcon('measure')

interface AnalysisFilterItemProps {
  /** The filter to display */
  filter: SimpleFilter
  /** Schema for field metadata */
  schema: MetaResponse | null
  /** Callback to remove this filter */
  onRemove: () => void
  /** Callback to update this filter */
  onUpdate: (filter: SimpleFilter) => void
}

export default function AnalysisFilterItem({
  filter,
  schema,
  onRemove,
  onUpdate
}: AnalysisFilterItemProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Get field info to determine icon
  const fieldInfo = findFieldInSchema(filter.member, schema)
  const fieldType = fieldInfo?.field.type || 'string'
  const isTimeField = fieldType === 'time'
  const isMeasureField = fieldInfo?.fieldType === 'measure'

  // Get display title for field
  const fieldTitle = getFieldTitle(filter.member, schema)

  // Get operator metadata
  const operatorMeta = FILTER_OPERATORS[filter.operator]
  const operatorLabel = operatorMeta?.label || filter.operator

  // Format value display
  const valueDisplay = formatValueDisplay(filter, operatorMeta)

  // Get appropriate icon and colors based on field type
  const FieldIcon = isTimeField ? TimeDimensionIcon : isMeasureField ? MeasureIcon : DimensionIcon
  const iconBgClass = isTimeField ? 'bg-dc-time-dimension' : isMeasureField ? 'bg-dc-measure' : 'bg-dc-dimension'
  const iconTextClass = isTimeField ? 'text-dc-time-dimension-text' : isMeasureField ? 'text-dc-measure-text' : 'text-dc-dimension-text'

  return (
    <>
      <div
        className="dc:flex dc:items-start dc:gap-2 dc:px-2 dc:py-1.5 bg-dc-surface-secondary dc:rounded-lg dc:group hover:bg-dc-surface-tertiary dc:transition-all dc:duration-150 dc:w-full"
      >
        {/* Field type icon with appropriate background color */}
        <span className={`dc:w-6 dc:h-6 dc:flex dc:items-center dc:justify-center dc:rounded ${iconBgClass} ${iconTextClass} dc:flex-shrink-0 dc:mt-0.5`}>
          {FieldIcon && <FieldIcon className="dc:w-4 dc:h-4" />}
        </span>

        {/* Filter description - clickable to edit */}
        <button
          ref={buttonRef}
          onClick={() => setIsModalOpen(true)}
          className="dc:flex-1 dc:min-w-0 text-left"
          title={`${fieldTitle} ${operatorLabel} ${valueDisplay}`}
        >
          <div className="dc:text-sm text-dc-text dc:break-words">
            <span className="dc:font-medium">{fieldTitle}</span>
            <span className="text-dc-text-muted dc:mx-1">{operatorLabel}</span>
            <span className="text-dc-primary">{valueDisplay}</span>
          </div>
        </button>

        {/* Remove button */}
        <button
          onClick={onRemove}
          className="dc:p-1 text-dc-text-muted hover:text-dc-danger dc:opacity-100 dc:sm:opacity-0 dc:sm:group-hover:opacity-100 dc:transition-opacity dc:flex-shrink-0 dc:mt-0.5"
          title="Remove filter"
        >
          {CloseIcon && <CloseIcon className="dc:w-4 dc:h-4" />}
        </button>
      </div>

      {/* Filter configuration modal */}
      {isModalOpen && (
        <FilterConfigModal
          filter={filter}
          schema={schema}
          onSave={(updatedFilter) => {
            onUpdate(updatedFilter)
            setIsModalOpen(false)
          }}
          onCancel={() => setIsModalOpen(false)}
          anchorElement={buttonRef.current}
        />
      )}
    </>
  )
}

/**
 * Formats the filter value(s) for display in the chip.
 * Handles various value types and multiple values.
 */
function formatValueDisplay(filter: SimpleFilter, operatorMeta: any): string {
  // No value required for set/notSet operators
  if (!operatorMeta?.requiresValues) {
    return ''
  }

  // Handle date range
  if (filter.dateRange) {
    if (Array.isArray(filter.dateRange)) {
      return `${filter.dateRange[0]} to ${filter.dateRange[1]}`
    }
    return filter.dateRange
  }

  const values = filter.values || []

  // No values selected
  if (values.length === 0) {
    return '(empty)'
  }

  // Single value
  if (values.length === 1) {
    return String(values[0])
  }

  // Two values
  if (values.length === 2) {
    return `${values[0]}, ${values[1]}`
  }

  // More than two values - show first two plus count
  return `${values[0]}, ${values[1]}, +${values.length - 2} more`
}
