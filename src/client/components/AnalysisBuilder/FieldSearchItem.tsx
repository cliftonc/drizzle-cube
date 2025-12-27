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
      return Icon ? <Icon className="w-4 h-4" /> : null
    } else if (field.fieldType === 'timeDimension') {
      const Icon = getFieldTypeIcon('time')
      return Icon ? <Icon className="w-4 h-4" /> : null
    } else {
      const Icon = getFieldTypeIcon('dimension')
      return Icon ? <Icon className="w-4 h-4" /> : null
    }
  }

  // Get badge color based on field type
  const getBadgeStyle = () => {
    if (field.fieldType === 'measure') {
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
    } else if (field.fieldType === 'timeDimension') {
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
    } else {
      return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
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
      className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors group ${
        isFocused
          ? 'bg-dc-primary/10 ring-1 ring-dc-primary'
          : isSelected
            ? 'bg-dc-success/10'
            : 'hover:bg-dc-surface-hover'
      }`}
      {...props}
    >
      {/* Icon */}
      <span
        className={`shrink-0 w-8 h-8 flex items-center justify-center rounded-md ${
          field.fieldType === 'measure'
            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            : field.fieldType === 'timeDimension'
              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
        }`}
      >
        {getFieldIcon()}
      </span>

      {/* Title and name */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-dc-text truncate">
          {field.title}
        </div>
        <div className="text-xs text-dc-text-muted truncate">{field.name}</div>
      </div>

      {/* Type badge */}
      <span
        className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${getBadgeStyle()}`}
      >
        {getTypeLabel()}
      </span>

      {/* Selection indicator */}
      {isSelected && (
        <span className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-dc-success text-white">
          <CheckIcon className="w-3 h-3" />
        </span>
      )}
    </button>
  )
}

export default memo(FieldSearchItem)
