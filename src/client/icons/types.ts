import type { IconifyIcon } from '@iconify/types'
import type { ComponentType, CSSProperties } from 'react'

/**
 * Icon categories for organization and filtering
 */
export type IconCategory =
  | 'action'      // UI actions (close, add, edit, delete, etc.)
  | 'field'       // Field types (measure, dimension, time)
  | 'chart'       // Chart type icons
  | 'measure'     // Measure type icons (count, avg, sum, etc.)
  | 'state'       // Status indicators (success, warning, error, etc.)
  | 'navigation'  // Navigation icons (chevron, arrow, etc.)

/**
 * Standard icon component props
 */
export interface IconProps {
  className?: string
  'aria-hidden'?: boolean
  style?: CSSProperties
}

/**
 * Icon component type that can be used in JSX
 */
export type IconComponent = ComponentType<IconProps>

/**
 * Icon definition with Iconify data and metadata
 */
export interface IconDefinition {
  /** The Iconify icon data */
  icon: IconifyIcon
  /** Category for filtering/organization */
  category: IconCategory
  /** Optional description */
  description?: string
}

/**
 * Complete icon registry with all available icons
 */
export interface IconRegistry {
  // Action icons
  close: IconDefinition
  add: IconDefinition
  edit: IconDefinition
  delete: IconDefinition
  refresh: IconDefinition
  copy: IconDefinition
  duplicate: IconDefinition
  settings: IconDefinition
  filter: IconDefinition
  share: IconDefinition
  expand: IconDefinition
  collapse: IconDefinition
  search: IconDefinition
  menu: IconDefinition
  run: IconDefinition
  check: IconDefinition
  link: IconDefinition
  eye: IconDefinition
  eyeOff: IconDefinition
  adjustments: IconDefinition
  desktop: IconDefinition
  table: IconDefinition
  sun: IconDefinition
  moon: IconDefinition
  ellipsisHorizontal: IconDefinition
  documentText: IconDefinition
  bookOpen: IconDefinition
  codeBracket: IconDefinition

  // Field type icons
  measure: IconDefinition
  dimension: IconDefinition
  timeDimension: IconDefinition
  segment: IconDefinition

  // Chart type icons
  chartBar: IconDefinition
  chartLine: IconDefinition
  chartArea: IconDefinition
  chartPie: IconDefinition
  chartScatter: IconDefinition
  chartBubble: IconDefinition
  chartRadar: IconDefinition
  chartRadialBar: IconDefinition
  chartTreemap: IconDefinition
  chartTable: IconDefinition
  chartActivityGrid: IconDefinition
  chartKpiNumber: IconDefinition
  chartKpiDelta: IconDefinition
  chartKpiText: IconDefinition
  chartMarkdown: IconDefinition

  // Measure type icons
  measureCount: IconDefinition
  measureCountDistinct: IconDefinition
  measureCountDistinctApprox: IconDefinition
  measureSum: IconDefinition
  measureAvg: IconDefinition
  measureMin: IconDefinition
  measureMax: IconDefinition
  measureRunningTotal: IconDefinition
  measureCalculated: IconDefinition
  measureNumber: IconDefinition

  // State icons
  success: IconDefinition
  warning: IconDefinition
  error: IconDefinition
  info: IconDefinition
  loading: IconDefinition
  sparkles: IconDefinition

  // Navigation icons
  chevronUp: IconDefinition
  chevronDown: IconDefinition
  chevronLeft: IconDefinition
  chevronRight: IconDefinition
  chevronUpDown: IconDefinition
  arrowUp: IconDefinition
  arrowDown: IconDefinition
  arrowRight: IconDefinition
  arrowPath: IconDefinition
}

/**
 * Type for icon registry keys
 */
export type IconName = keyof IconRegistry

/**
 * Partial icon registry for user overrides
 * Users can provide just the IconifyIcon or a full IconDefinition
 */
export type PartialIconRegistry = Partial<{
  [K in keyof IconRegistry]: IconifyIcon | Partial<IconDefinition>
}>
