/**
 * DashboardFilterItem Component
 *
 * Compact filter chip for dashboard filters.
 * Displays filter as a chip with icon, label/field name, operator, and value preview.
 * Clicking the chip opens a modal for editing the filter configuration.
 */

import { getIcon } from '../../icons'
import type { DashboardFilter, SimpleFilter } from '../../types'
import type { MetaResponse } from '../../shared/types'
import { FILTER_OPERATORS } from '../../shared/types'
import { findFieldInSchema, getFieldTitle } from '../AnalysisBuilder/utils'

const CloseIcon = getIcon('close')
const DimensionIcon = getIcon('dimension')
const TimeDimensionIcon = getIcon('timeDimension')
const MeasureIcon = getIcon('measure')

interface DashboardFilterItemProps {
  /** The dashboard filter to display */
  filter: DashboardFilter
  /** Schema for field metadata */
  schema: MetaResponse | null
  /** Callback when filter chip is clicked (opens edit modal) */
  onClick: () => void
  /** Callback to remove this filter */
  onRemove: () => void
}

export default function DashboardFilterItem({
  filter,
  schema,
  onClick,
  onRemove
}: DashboardFilterItemProps) {
  // For dashboard filters, the filter.filter is the SimpleFilter
  const simpleFilter = filter.filter as SimpleFilter

  // Universal time filters have special display
  if (filter.isUniversalTime) {
    const dateRangeDisplay = formatDateRangeDisplay(simpleFilter)

    return (
      <div className="flex items-start gap-2 px-2 py-1.5 bg-dc-surface-secondary rounded-lg group hover:bg-dc-surface-tertiary transition-all duration-150">
        {/* Time icon for universal filter */}
        <span className="w-6 h-6 flex items-center justify-center rounded bg-dc-time-dimension text-dc-time-dimension-text flex-shrink-0 mt-0.5">
          {TimeDimensionIcon && <TimeDimensionIcon className="w-4 h-4" />}
        </span>

        {/* Filter description - clickable to edit */}
        <button
          onClick={onClick}
          className="flex-1 min-w-0 text-left"
          title={`${filter.label}: ${dateRangeDisplay}`}
        >
          <div className="text-sm text-dc-text break-words">
            <span className="font-medium">{filter.label}</span>
            <span className="text-dc-text-muted mx-1">=</span>
            <span className="text-dc-primary">{dateRangeDisplay || '(not set)'}</span>
          </div>
        </button>

        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="p-1 text-dc-text-muted hover:text-dc-danger opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
          title="Remove filter"
        >
          {CloseIcon && <CloseIcon className="w-4 h-4" />}
        </button>
      </div>
    )
  }

  // Regular filter display
  const fieldName = simpleFilter.member

  // Get field info to determine icon
  const fieldInfo = findFieldInSchema(fieldName, schema)
  const fieldType = fieldInfo?.field.type || 'string'
  const isTimeField = fieldType === 'time'
  const isMeasureField = fieldInfo?.fieldType === 'measure'

  // Get display title for field
  const fieldTitle = getFieldTitle(fieldName, schema)

  // Get operator metadata
  const operatorMeta = FILTER_OPERATORS[simpleFilter.operator]
  const operatorLabel = operatorMeta?.label || simpleFilter.operator

  // Format value display
  const valueDisplay = formatValueDisplay(simpleFilter, operatorMeta)

  // Get appropriate icon and colors based on field type
  const FieldIcon = isTimeField ? TimeDimensionIcon : isMeasureField ? MeasureIcon : DimensionIcon
  const iconBgClass = isTimeField ? 'bg-dc-time-dimension' : isMeasureField ? 'bg-dc-measure' : 'bg-dc-dimension'
  const iconTextClass = isTimeField ? 'text-dc-time-dimension-text' : isMeasureField ? 'text-dc-measure-text' : 'text-dc-dimension-text'

  // Check if filter needs configuration
  const needsConfiguration = !fieldName || (operatorMeta?.requiresValues && (!simpleFilter.values || simpleFilter.values.length === 0) && !simpleFilter.dateRange)

  return (
    <div className="flex items-start gap-2 px-2 py-1.5 bg-dc-surface-secondary rounded-lg group hover:bg-dc-surface-tertiary transition-all duration-150">
      {/* Field type icon with appropriate background color */}
      <span className={`w-6 h-6 flex items-center justify-center rounded ${iconBgClass} ${iconTextClass} flex-shrink-0 mt-0.5`}>
        {FieldIcon && <FieldIcon className="w-4 h-4" />}
      </span>

      {/* Filter description - clickable to edit */}
      <button
        onClick={onClick}
        className="flex-1 min-w-0 text-left"
        title={needsConfiguration ? `${filter.label}: Click to configure` : `${filter.label}: ${fieldTitle} ${operatorLabel} ${valueDisplay}`}
      >
        <div className="text-sm text-dc-text break-words">
          {needsConfiguration ? (
            <>
              <span className="font-medium">{filter.label}</span>
              <span className="text-dc-text-muted ml-1 italic">Click to configure</span>
            </>
          ) : (
            <>
              <span className="font-medium">{filter.label}</span>
              <span className="text-dc-text-muted">: </span>
              <span className="text-dc-text-secondary">{fieldTitle}</span>
              <span className="text-dc-text-muted mx-1">{operatorLabel}</span>
              <span className="text-dc-primary">{valueDisplay}</span>
            </>
          )}
        </div>
      </button>

      {/* Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        className="p-1 text-dc-text-muted hover:text-dc-danger opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5"
        title="Remove filter"
      >
        {CloseIcon && <CloseIcon className="w-4 h-4" />}
      </button>
    </div>
  )
}

/**
 * Formats the filter value(s) for display in the chip.
 * Handles various value types and multiple values.
 */
function formatValueDisplay(filter: SimpleFilter, operatorMeta: { requiresValues?: boolean } | undefined): string {
  // No value required for set/notSet operators
  if (!operatorMeta?.requiresValues) {
    return ''
  }

  // Handle date range
  if (filter.dateRange) {
    return formatDateRangeDisplay(filter)
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

/**
 * Formats date range for display
 */
function formatDateRangeDisplay(filter: SimpleFilter): string {
  // Check dateRange property first
  if (filter.dateRange) {
    if (Array.isArray(filter.dateRange)) {
      return `${filter.dateRange[0]} to ${filter.dateRange[1]}`
    }
    return filter.dateRange
  }

  // Fall back to values (for universal time filters that may store range in values)
  const values = filter.values || []
  if (values.length === 1 && typeof values[0] === 'string') {
    return values[0]
  }
  if (values.length === 2) {
    return `${values[0]} to ${values[1]}`
  }

  return ''
}
