/**
 * FieldDetailPanel Component
 *
 * Shows detailed information about the currently focused/hovered field.
 * Displays: icon, title, description, type, cube name, and technical name.
 */

import { memo } from 'react'
import { getMeasureTypeIcon, getFieldTypeIcon } from '../../icons'
import type { FieldDetailPanelProps } from './types'

function FieldDetailPanel({ field }: FieldDetailPanelProps) {
  if (!field) {
    return (
      <div className="p-6 text-center text-dc-text-muted">
        <p className="text-sm">Hover over a field to see details</p>
      </div>
    )
  }

  // Get appropriate icon based on field type
  const getFieldIcon = () => {
    if (field.fieldType === 'measure') {
      const Icon = getMeasureTypeIcon(field.type)
      return Icon ? <Icon className="w-6 h-6" /> : null
    } else if (field.fieldType === 'timeDimension') {
      const Icon = getFieldTypeIcon('time')
      return Icon ? <Icon className="w-6 h-6" /> : null
    } else {
      const Icon = getFieldTypeIcon('dimension')
      return Icon ? <Icon className="w-6 h-6" /> : null
    }
  }

  // Get icon background color - use field type specific colors for consistency
  const getIconBgStyle = () => {
    if (field.fieldType === 'measure') {
      return 'bg-dc-measure text-dc-measure-text'
    } else if (field.fieldType === 'timeDimension') {
      return 'bg-dc-time-dimension text-dc-time-dimension-text'
    } else {
      return 'bg-dc-dimension text-dc-dimension-text'
    }
  }

  // Get type display name
  const getTypeDisplay = () => {
    if (field.fieldType === 'measure') {
      const typeMap: Record<string, string> = {
        count: 'Count',
        countDistinct: 'Count Distinct',
        countDistinctApprox: 'Count Distinct (Approx)',
        sum: 'Sum',
        avg: 'Average',
        min: 'Minimum',
        max: 'Maximum',
        runningTotal: 'Running Total',
        number: 'Number'
      }
      return typeMap[field.type] || field.type
    } else if (field.fieldType === 'timeDimension') {
      return 'Time Dimension'
    } else {
      const typeMap: Record<string, string> = {
        string: 'Text',
        number: 'Number',
        boolean: 'Boolean',
        geo: 'Geographic'
      }
      return typeMap[field.type] || 'Dimension'
    }
  }

  return (
    <div className="p-4">
      {/* Header with icon and title */}
      <div className="flex items-start gap-3 mb-4">
        <span
          className={`shrink-0 w-12 h-12 flex items-center justify-center rounded-lg ${getIconBgStyle()}`}
        >
          {getFieldIcon()}
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-dc-text leading-tight">
            {field.title}
          </h3>
          <p className="text-xs text-dc-text-muted mt-0.5 truncate">
            {field.name}
          </p>
        </div>
      </div>

      {/* Description */}
      {field.description && (
        <div className="mb-4">
          <p className="text-sm text-dc-text-secondary leading-relaxed">
            {field.description}
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="space-y-3 pt-4 border-t border-dc-border">
        <div className="flex items-center justify-between">
          <span className="text-xs text-dc-text-muted">Type</span>
          <span className="text-sm text-dc-text font-medium">{getTypeDisplay()}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-dc-text-muted">Cube</span>
          <span className="text-sm text-dc-text font-medium">{field.cubeName}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-dc-text-muted">Category</span>
          <span
            className={`text-xs px-2 py-0.5 rounded font-medium ${
              field.fieldType === 'measure'
                ? 'bg-dc-measure text-dc-measure-text'
                : field.fieldType === 'timeDimension'
                  ? 'bg-dc-time-dimension text-dc-time-dimension-text'
                  : 'bg-dc-dimension text-dc-dimension-text'
            }`}
          >
            {field.fieldType === 'measure'
              ? 'Measure'
              : field.fieldType === 'timeDimension'
                ? 'Time Dimension'
                : 'Dimension'}
          </span>
        </div>
      </div>

      {/* Usage hint */}
      <div className="mt-6 p-3 bg-dc-surface rounded-lg">
        <p className="text-xs text-dc-text-muted">
          Press <kbd className="px-1 py-0.5 bg-dc-surface-tertiary rounded text-xs">Enter</kbd> or click to add this field to your query.
        </p>
      </div>
    </div>
  )
}

export default memo(FieldDetailPanel)
