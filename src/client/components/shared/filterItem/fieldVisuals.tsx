/**
 * Field type icon/badge helpers for the FilterItem field dropdown.
 */

import { getIcon } from '../../../icons/index.js'
import { getMeasureIcon } from '../../../utils/measureIcons.js'
import type { MetaField } from '../types.js'

const DimensionIcon = getIcon('dimension')
const TimeDimensionIcon = getIcon('timeDimension')

const MEASURE_ICON_TYPES = [
  'count', 'sum', 'avg', 'min', 'max', 'countDistinct',
  'countDistinctApprox', 'runningTotal', 'calculated', 'number'
]

const MEASURE_BADGE_TYPES = ['count', 'sum', 'avg', 'min', 'max', 'countDistinct', 'number']

/** Icon for a field based on its type. */
export function getFieldTypeIcon(field: MetaField) {
  if (field.type === 'time') {
    return <TimeDimensionIcon className="dc:w-3 dc:h-3 text-dc-accent" />
  }
  if (MEASURE_ICON_TYPES.includes(field.type)) {
    // Use dynamic icon based on measure type, with amber color
    return getMeasureIcon(field.type, 'w-3 h-3 text-dc-warning')
  }
  return <DimensionIcon className="dc:w-3 dc:h-3 text-dc-success" />
}

/** Single-letter badge for a field based on its type. */
export function getFieldTypeBadge(field: MetaField) {
  if (field.type === 'time') {
    return <span className="dc:text-xs bg-dc-time-dimension text-dc-time-dimension dc:px-1.5 dc:py-0.5 dc:rounded-sm">T</span>
  }
  if (MEASURE_BADGE_TYPES.includes(field.type)) {
    return <span className="dc:text-xs bg-dc-measure text-dc-measure dc:px-1.5 dc:py-0.5 dc:rounded-sm">M</span>
  }
  return <span className="dc:text-xs bg-dc-dimension text-dc-dimension dc:px-1.5 dc:py-0.5 dc:rounded-sm">D</span>
}
