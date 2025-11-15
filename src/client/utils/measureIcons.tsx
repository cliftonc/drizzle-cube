import React from 'react'
import {
  ScaleIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  ArrowTrendingUpIcon,
  BeakerIcon,
  Bars3BottomLeftIcon,
  FingerPrintIcon,
  ChartBarSquareIcon,
  PlusCircleIcon,
  HashtagIcon,
} from '@heroicons/react/24/solid'

/**
 * Get the appropriate icon component for a given measure type
 * All icons use amber coloring for consistency
 */
export function getMeasureIcon(
  measureType: string | undefined,
  className: string = 'w-4 h-4'
): React.ReactElement {
  // Default to ChartBarIcon equivalent if type is unknown
  const IconComponent = measureTypeIconMap[measureType || ''] || Bars3BottomLeftIcon

  return <IconComponent className={className} />
}

/**
 * Mapping of measure types to their corresponding Heroicons
 * Using a hybrid approach:
 * - Semantic icons for avg, min, max, runningTotal, calculated
 * - Chart/count icons for count variants, sum, number
 */
const measureTypeIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  // Count variants (chart-based)
  count: Bars3BottomLeftIcon,
  countDistinct: FingerPrintIcon,
  countDistinctApprox: ChartBarSquareIcon,

  // Aggregations (semantic)
  sum: PlusCircleIcon,
  avg: ScaleIcon,
  min: ArrowDownCircleIcon,
  max: ArrowUpCircleIcon,

  // Advanced (semantic)
  runningTotal: ArrowTrendingUpIcon,
  calculated: BeakerIcon,

  // Numeric (chart-based)
  number: HashtagIcon,
}

/**
 * Get all available measure type icons
 * Useful for documentation or UI that shows all measure types
 */
export function getAllMeasureIcons(): Record<string, React.ReactElement> {
  const icons: Record<string, React.ReactElement> = {}

  for (const [type, IconComponent] of Object.entries(measureTypeIconMap)) {
    icons[type] = <IconComponent className="w-4 h-4" />
  }

  return icons
}
