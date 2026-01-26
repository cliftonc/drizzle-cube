/**
 * FieldSearchItem Component
 *
 * A single field item in the search results list.
 * Shows field icon, title, type badge, and selection state.
 */

import { memo } from 'react'
import { getIcon, getMeasureTypeIcon, getFieldTypeIcon } from '../../icons'
import type { FieldSearchItemProps } from './types'

const CheckIcon = getIcon('check')

function FieldSearchItem({
  field,
  isSelected,
  isFocused,
  onClick,
  onMouseEnter,
  ...props
}: FieldSearchItemProps & { 'data-field-index'?: number }) {
  // Get appropriate icon based on field type
  const getFieldIcon = () => {
    if (field.fieldType === 'measure') {
      const Icon = getMeasureTypeIcon(field.type)
      return Icon ? <Icon className="dc:w-4 dc:h-4" /> : null
    } else if (field.fieldType === 'timeDimension') {
      const Icon = getFieldTypeIcon('time')
      return Icon ? <Icon className="dc:w-4 dc:h-4" /> : null
    } else {
      const Icon = getFieldTypeIcon('dimension')
      return Icon ? <Icon className="dc:w-4 dc:h-4" /> : null
    }
  }

  // Get badge color based on field type
  const getBadgeStyle = () => {
    if (field.fieldType === 'measure') {
      return 'bg-dc-measure text-dc-measure-text'
    } else if (field.fieldType === 'timeDimension') {
      return 'bg-dc-time-dimension text-dc-time-dimension-text'
    } else {
      return 'bg-dc-dimension text-dc-dimension-text'
    }
  }

  // Get short type label
  const getTypeLabel = () => {
    if (field.fieldType === 'measure') {
      return field.type.charAt(0).toUpperCase() + field.type.slice(1)
    } else if (field.fieldType === 'timeDimension') {
      return 'Time'
    } else {
      return 'Dim'
    }
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`dc:w-full text-left dc:px-3 dc:py-2 dc:rounded-lg dc:flex dc:items-center dc:gap-3 dc:transition-colors dc:group ${
        isFocused
          ? 'bg-dc-primary/10 dc:ring-1 ring-dc-primary'
          : isSelected
            ? 'bg-dc-success/10'
            : 'hover:bg-dc-surface-hover'
      }`}
      {...props}
    >
      {/* Icon */}
      <span
        className={`dc:shrink-0 dc:w-8 dc:h-8 dc:flex dc:items-center dc:justify-center dc:rounded-md ${
          field.fieldType === 'measure'
            ? 'bg-dc-measure text-dc-measure-text'
            : field.fieldType === 'timeDimension'
              ? 'bg-dc-time-dimension text-dc-time-dimension-text'
              : 'bg-dc-dimension text-dc-dimension-text'
        }`}
      >
        {getFieldIcon()}
      </span>

      {/* Title and name */}
      <div className="dc:flex-1 dc:min-w-0">
        <div className="dc:text-sm dc:font-medium text-dc-text dc:truncate">
          {field.title}
        </div>
        <div className="dc:text-xs text-dc-text-muted dc:truncate">{field.name}</div>
      </div>

      {/* Type badge */}
      <span
        className={`dc:shrink-0 dc:px-2 dc:py-0.5 dc:rounded dc:text-xs dc:font-medium ${getBadgeStyle()}`}
      >
        {getTypeLabel()}
      </span>

      {/* Selection indicator */}
      {isSelected && (
        <span className="dc:shrink-0 dc:w-5 dc:h-5 dc:flex dc:items-center dc:justify-center dc:rounded-full bg-dc-success text-white">
          <CheckIcon className="dc:w-3 dc:h-3" />
        </span>
      )}
    </button>
  )
}

export default memo(FieldSearchItem)
