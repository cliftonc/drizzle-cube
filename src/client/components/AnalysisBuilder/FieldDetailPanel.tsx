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
      <div className="dc:p-6 text-center text-dc-text-muted">
        <p className="dc:text-sm">Hover over a field to see details</p>
      </div>
    )
  }

  // Get appropriate icon based on field type
  const getFieldIcon = () => {
    if (field.fieldType === 'measure') {
      const Icon = getMeasureTypeIcon(field.type)
      return Icon ? <Icon className="dc:w-6 dc:h-6" /> : null
    } else if (field.fieldType === 'timeDimension') {
      const Icon = getFieldTypeIcon('time')
      return Icon ? <Icon className="dc:w-6 dc:h-6" /> : null
    } else {
      const Icon = getFieldTypeIcon('dimension')
      return Icon ? <Icon className="dc:w-6 dc:h-6" /> : null
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
    <div className="dc:p-4">
      {/* Header with icon and title */}
      <div className="dc:flex dc:items-start dc:gap-3 dc:mb-4">
        <span
          className={`dc:shrink-0 dc:w-12 dc:h-12 dc:flex dc:items-center dc:justify-center dc:rounded-lg ${getIconBgStyle()}`}
        >
          {getFieldIcon()}
        </span>
        <div className="dc:flex-1 dc:min-w-0">
          <h3 className="dc:text-base dc:font-semibold text-dc-text dc:leading-tight">
            {field.title}
          </h3>
          <p className="dc:text-xs text-dc-text-muted dc:mt-0.5 dc:truncate">
            {field.name}
          </p>
        </div>
      </div>

      {/* Description */}
      {field.description && (
        <div className="dc:mb-4">
          <p className="dc:text-sm text-dc-text-secondary dc:leading-relaxed">
            {field.description}
          </p>
        </div>
      )}

      {/* Metadata */}
      <div className="dc:space-y-3 dc:pt-4 dc:border-t border-dc-border">
        <div className="dc:flex dc:items-center dc:justify-between">
          <span className="dc:text-xs text-dc-text-muted">Type</span>
          <span className="dc:text-sm text-dc-text dc:font-medium">{getTypeDisplay()}</span>
        </div>
        <div className="dc:flex dc:items-center dc:justify-between">
          <span className="dc:text-xs text-dc-text-muted">Cube</span>
          <span className="dc:text-sm text-dc-text dc:font-medium">{field.cubeName}</span>
        </div>
        <div className="dc:flex dc:items-center dc:justify-between">
          <span className="dc:text-xs text-dc-text-muted">Category</span>
          <span
            className={`dc:text-xs dc:px-2 dc:py-0.5 dc:rounded dc:font-medium ${
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
      <div className="dc:mt-6 dc:p-3 bg-dc-surface dc:rounded-lg">
        <p className="dc:text-xs text-dc-text-muted">
          Press <kbd className="dc:px-1 dc:py-0.5 bg-dc-surface-tertiary dc:rounded dc:text-xs">Enter</kbd> or click to add this field to your query.
        </p>
      </div>
    </div>
  )
}

export default memo(FieldDetailPanel)
