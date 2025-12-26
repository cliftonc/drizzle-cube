import React from 'react'
import { getMeasureTypeIcon } from '../icons'

/**
 * Get the appropriate icon component for a given measure type
 * All icons use amber coloring for consistency
 */
export function getMeasureIcon(
  measureType: string | undefined,
  className: string = 'w-4 h-4'
): React.ReactElement {
  const IconComponent = getMeasureTypeIcon(measureType)
  return <IconComponent className={className} />
}

/**
 * Get all available measure type icons
 * Useful for documentation or UI that shows all measure types
 */
export function getAllMeasureIcons(): Record<string, React.ReactElement> {
  const types = ['count', 'countDistinct', 'countDistinctApprox', 'sum', 'avg', 'min', 'max', 'runningTotal', 'calculated', 'number']
  const icons: Record<string, React.ReactElement> = {}

  for (const type of types) {
    const IconComponent = getMeasureTypeIcon(type)
    icons[type] = <IconComponent className="w-4 h-4" />
  }

  return icons
}
