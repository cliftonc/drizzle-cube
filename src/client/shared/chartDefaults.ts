/**
 * Smart Chart Defaulting System
 *
 * Provides intelligent chart type selection and configuration based on
 * the user's current metrics and breakdowns selection.
 */

import type { ChartType, ChartAxisConfig } from '../types'
import type { MetricItem, BreakdownItem } from '../components/AnalysisBuilder/types'

// ============================================================================
// Types
// ============================================================================

/**
 * Result of smart chart defaults calculation
 */
export interface SmartChartDefaults {
  /** The recommended chart type */
  chartType: ChartType
  /** The auto-configured chart axis settings */
  chartConfig: ChartAxisConfig
}

/**
 * Availability status for a chart type
 */
export interface ChartAvailability {
  /** Whether the chart type can be used with current selections */
  available: boolean
  /** Reason why the chart is unavailable (for tooltip) */
  reason?: string
}

/**
 * Map of chart type availability statuses
 */
export type ChartAvailabilityMap = Record<ChartType, ChartAvailability>

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a breakdown is a time dimension
 */
function isTimeDimension(breakdown: BreakdownItem): boolean {
  return breakdown.isTimeDimension
}

/**
 * Get the first time dimension from breakdowns, if any
 */
function getFirstTimeDimension(breakdowns: BreakdownItem[]): BreakdownItem | undefined {
  return breakdowns.find(isTimeDimension)
}

/**
 * Get the first non-time dimension from breakdowns, if any
 */
function getFirstDimension(breakdowns: BreakdownItem[]): BreakdownItem | undefined {
  return breakdowns.find((b) => !b.isTimeDimension)
}

/**
 * Get all non-time dimensions
 */
function getDimensions(breakdowns: BreakdownItem[]): BreakdownItem[] {
  return breakdowns.filter((b) => !b.isTimeDimension)
}

/**
 * Get all time dimensions
 */
function getTimeDimensions(breakdowns: BreakdownItem[]): BreakdownItem[] {
  return breakdowns.filter(isTimeDimension)
}

// ============================================================================
// Chart Availability
// ============================================================================

/**
 * Check if a specific chart type is available given current selections
 */
export function getChartAvailability(
  chartType: ChartType,
  metrics: MetricItem[],
  breakdowns: BreakdownItem[]
): ChartAvailability {
  const measureCount = metrics.length
  const dimensionCount = getDimensions(breakdowns).length
  const timeDimensionCount = getTimeDimensions(breakdowns).length
  const totalBreakdowns = breakdowns.length

  switch (chartType) {
    // Always available charts
    case 'table':
    case 'markdown':
      return { available: true }

    // Measure-only charts (KPI Number, KPI Text)
    case 'kpiNumber':
    case 'kpiText':
      if (measureCount < 1) {
        return { available: false, reason: 'Requires at least 1 measure' }
      }
      return { available: true }

    // Bar chart - needs dimension for categories + measure for values
    case 'bar':
      if (measureCount < 1) {
        return { available: false, reason: 'Requires at least 1 measure' }
      }
      if (totalBreakdowns < 1) {
        return { available: false, reason: 'Requires at least 1 breakdown for categories' }
      }
      return { available: true }

    // KPI Delta - needs dimension for ordering + measure for values
    case 'kpiDelta':
      if (measureCount < 1) {
        return { available: false, reason: 'Requires at least 1 measure' }
      }
      if (totalBreakdowns < 1) {
        return { available: false, reason: 'Requires at least 1 breakdown for ordering' }
      }
      return { available: true }

    // Line and area charts - need dimension/time + measure
    case 'line':
    case 'area':
      if (measureCount < 1) {
        return { available: false, reason: 'Requires at least 1 measure' }
      }
      if (totalBreakdowns < 1) {
        return { available: false, reason: 'Requires a breakdown (dimension or time)' }
      }
      return { available: true }

    // Pie chart - needs dimension (not time) + measure
    case 'pie':
      if (measureCount < 1) {
        return { available: false, reason: 'Requires 1 measure' }
      }
      if (dimensionCount < 1) {
        return { available: false, reason: 'Requires 1 dimension (not time dimension)' }
      }
      return { available: true }

    // Scatter - needs measure + any breakdown
    case 'scatter':
      if (measureCount < 1) {
        return { available: false, reason: 'Requires at least 1 measure' }
      }
      // Scatter can work with just measures (x and y from different measures)
      // or with dimension + measure
      if (measureCount < 2 && totalBreakdowns < 1) {
        return { available: false, reason: 'Requires 2 measures or 1 measure + 1 breakdown' }
      }
      return { available: true }

    // Bubble - needs 2+ measures and 1+ breakdown (dimension or time dimension for series)
    case 'bubble':
      if (measureCount < 2) {
        return { available: false, reason: 'Requires at least 2 measures' }
      }
      if (totalBreakdowns < 1) {
        return { available: false, reason: 'Requires at least 1 breakdown for series grouping' }
      }
      return { available: true }

    // Radar - needs dimension + measure
    case 'radar':
      if (measureCount < 1) {
        return { available: false, reason: 'Requires at least 1 measure' }
      }
      if (dimensionCount < 1) {
        return { available: false, reason: 'Requires at least 1 dimension' }
      }
      return { available: true }

    // Radial Bar - needs dimension + measure
    case 'radialBar':
      if (measureCount < 1) {
        return { available: false, reason: 'Requires at least 1 measure' }
      }
      if (dimensionCount < 1) {
        return { available: false, reason: 'Requires at least 1 dimension' }
      }
      return { available: true }

    // Treemap - needs dimension + measure
    case 'treemap':
      if (measureCount < 1) {
        return { available: false, reason: 'Requires at least 1 measure' }
      }
      if (dimensionCount < 1) {
        return { available: false, reason: 'Requires at least 1 dimension' }
      }
      return { available: true }

    // Activity Grid - needs time dimension + measure
    case 'activityGrid':
      if (measureCount < 1) {
        return { available: false, reason: 'Requires at least 1 measure' }
      }
      if (timeDimensionCount < 1) {
        return { available: false, reason: 'Requires a time dimension' }
      }
      return { available: true }

    default:
      // Unknown chart type - assume available
      return { available: true }
  }
}

/**
 * Get availability for all chart types
 */
export function getAllChartAvailability(
  metrics: MetricItem[],
  breakdowns: BreakdownItem[]
): ChartAvailabilityMap {
  // Chart types in alphabetical order (matching ChartTypeSelector display)
  const chartTypes: ChartType[] = [
    'activityGrid',
    'area',
    'bar',
    'bubble',
    'kpiDelta',
    'kpiNumber',
    'kpiText',
    'line',
    'markdown',
    'pie',
    'radar',
    'radialBar',
    'scatter',
    'table',
    'treemap'
  ]

  const availability: Partial<ChartAvailabilityMap> = {}
  for (const chartType of chartTypes) {
    availability[chartType] = getChartAvailability(chartType, metrics, breakdowns)
  }

  return availability as ChartAvailabilityMap
}

// ============================================================================
// Smart Chart Type Selection
// ============================================================================

/**
 * Select the best chart type based on current metrics and breakdowns
 *
 * Priority order:
 * 1. If current chart type is still valid, keep it (preserve user intent)
 * 2. If current chart becomes invalid, switch to best alternative:
 *    - Has time dimension → line
 *    - Has dimension + measure → bar
 *    - Has measures only → bar (or kpiNumber if single measure + no breakdowns)
 *    - No fields → keep current
 */
export function selectBestChartType(
  metrics: MetricItem[],
  breakdowns: BreakdownItem[],
  currentChartType: ChartType
): ChartType {
  // Check if current chart type is still valid
  const currentAvailability = getChartAvailability(currentChartType, metrics, breakdowns)
  if (currentAvailability.available) {
    return currentChartType
  }

  // No fields selected - keep current
  if (metrics.length === 0 && breakdowns.length === 0) {
    return currentChartType
  }

  const hasTimeDimension = getTimeDimensions(breakdowns).length > 0
  const hasDimension = getDimensions(breakdowns).length > 0
  const hasMeasure = metrics.length > 0

  // Priority selection logic
  if (hasTimeDimension && hasMeasure) {
    // Time series data → line chart
    return 'line'
  }

  if (hasDimension && hasMeasure) {
    // Categorical data with measures → bar chart
    return 'bar'
  }

  if (hasMeasure && !hasDimension && !hasTimeDimension) {
    // Measures only, no breakdowns → KPI number (works with just measures)
    return 'kpiNumber'
  }

  // Fallback to table as most versatile (works with any combination)
  return 'table'
}

// ============================================================================
// Smart Chart Config Defaults
// ============================================================================

/**
 * Get smart default chart configuration based on chart type and selections
 */
export function getSmartChartDefaults(
  metrics: MetricItem[],
  breakdowns: BreakdownItem[],
  currentChartType: ChartType
): SmartChartDefaults {
  // First, determine the best chart type
  const chartType = selectBestChartType(metrics, breakdowns, currentChartType)

  // Then, auto-configure the chart axes based on chart type
  const chartConfig = buildChartConfig(chartType, metrics, breakdowns)

  return { chartType, chartConfig }
}

/**
 * Build optimal chart configuration for a given chart type
 */
function buildChartConfig(
  chartType: ChartType,
  metrics: MetricItem[],
  breakdowns: BreakdownItem[]
): ChartAxisConfig {
  const timeDimension = getFirstTimeDimension(breakdowns)
  const dimension = getFirstDimension(breakdowns)
  const dimensions = getDimensions(breakdowns)
  const allBreakdowns = breakdowns

  switch (chartType) {
    case 'line':
    case 'area':
      // Line/Area: xAxis = first time dimension (prefer) or dimension
      // yAxis = all measures, series = optional second dimension
      return {
        xAxis: timeDimension
          ? [timeDimension.field]
          : dimension
            ? [dimension.field]
            : [],
        yAxis: metrics.map((m) => m.field),
        series:
          dimensions.length > 1
            ? [dimensions[1].field]
            : dimension && timeDimension
              ? [dimension.field]
              : []
      }

    case 'bar':
      // Bar: xAxis = first dimension (prefer non-time), yAxis = all measures
      return {
        xAxis: dimension
          ? [dimension.field]
          : timeDimension
            ? [timeDimension.field]
            : [],
        yAxis: metrics.map((m) => m.field),
        series:
          dimensions.length > 1
            ? [dimensions[1].field]
            : timeDimension && dimension
              ? [timeDimension.field]
              : []
      }

    case 'pie':
      // Pie: xAxis = first dimension (exactly 1), yAxis = first measure (exactly 1)
      return {
        xAxis: dimension ? [dimension.field] : [],
        yAxis: metrics.length > 0 ? [metrics[0].field] : []
      }

    case 'scatter':
      // Scatter: xAxis = first dimension or measure, yAxis = first/second measure
      if (metrics.length >= 2) {
        return {
          xAxis: [metrics[0].field],
          yAxis: [metrics[1].field],
          series: dimension ? [dimension.field] : []
        }
      }
      return {
        xAxis: allBreakdowns.length > 0 ? [allBreakdowns[0].field] : [],
        yAxis: metrics.length > 0 ? [metrics[0].field] : [],
        series: dimensions.length > 1 ? [dimensions[1].field] : []
      }

    case 'bubble':
      // Bubble: xAxis = first measure, yAxis = second measure, sizeField = third measure (or second if only 2)
      // series = first breakdown (dimension or time dimension) for grouping/coloring
      return {
        xAxis: metrics.length > 0 ? [metrics[0].field] : [],
        yAxis: metrics.length > 1 ? [metrics[1].field] : [],
        sizeField: metrics.length > 2 ? metrics[2].field : metrics.length > 1 ? metrics[1].field : undefined,
        series: dimension ? [dimension.field] : timeDimension ? [timeDimension.field] : []
      }

    case 'radar':
    case 'radialBar':
    case 'treemap':
      // These all use dimension for categories and measure for values
      return {
        xAxis: dimension ? [dimension.field] : [],
        yAxis: metrics.length > 0 ? [metrics[0].field] : []
      }

    case 'activityGrid':
      // Activity Grid: dateField = time dimension, valueField = measure
      return {
        dateField: timeDimension ? [timeDimension.field] : [],
        valueField: metrics.length > 0 ? [metrics[0].field] : []
      }

    case 'kpiNumber':
    case 'kpiDelta':
    case 'kpiText':
      // KPI charts: just need the measure
      return {
        yAxis: metrics.length > 0 ? [metrics[0].field] : []
      }

    case 'table':
      // Table: include all fields
      return {
        xAxis: [
          ...breakdowns.map((b) => b.field),
          ...metrics.map((m) => m.field)
        ]
      }

    case 'markdown':
      // Markdown doesn't need chart config
      return {}

    default:
      // Default fallback - x = first breakdown, y = all measures
      return {
        xAxis: allBreakdowns.length > 0 ? [allBreakdowns[0].field] : [],
        yAxis: metrics.map((m) => m.field)
      }
  }
}

// ============================================================================
// Update Logic for AnalysisBuilder
// ============================================================================

/**
 * Determine if chart type should be auto-switched based on selections change
 *
 * Returns the new chart type if a switch is recommended, or null if no change needed.
 *
 * @param metrics - Current metrics selection
 * @param breakdowns - Current breakdowns selection
 * @param currentChartType - Current chart type
 * @param userManuallySelected - Whether user manually selected the current chart type
 */
export function shouldAutoSwitchChartType(
  metrics: MetricItem[],
  breakdowns: BreakdownItem[],
  currentChartType: ChartType,
  userManuallySelected: boolean
): ChartType | null {
  // If user manually selected this chart type, only switch if it becomes invalid
  if (userManuallySelected) {
    const availability = getChartAvailability(currentChartType, metrics, breakdowns)
    if (availability.available) {
      return null // Keep user's choice
    }
  }

  // Check if a better chart type should be used
  const recommendedType = selectBestChartType(metrics, breakdowns, currentChartType)

  // Only suggest switch if recommended type is different
  if (recommendedType !== currentChartType) {
    return recommendedType
  }

  return null
}

/**
 * Check if a chart config field references valid fields from metrics/breakdowns
 */
function isValidConfigField(
  fieldValue: string | string[] | undefined,
  validFields: Set<string>
): boolean {
  if (!fieldValue) return false
  if (Array.isArray(fieldValue)) {
    return fieldValue.length > 0 && fieldValue.every((f) => validFields.has(f))
  }
  return validFields.has(fieldValue)
}

/**
 * Merge existing chart config with smart defaults
 * Only fills in missing or invalid fields, preserves valid existing config
 */
export function mergeChartConfigWithDefaults(
  existingConfig: ChartAxisConfig,
  smartDefaults: ChartAxisConfig,
  metrics: MetricItem[],
  breakdowns: BreakdownItem[]
): ChartAxisConfig {
  // Build set of valid field names
  const validFields = new Set<string>([
    ...metrics.map((m) => m.field),
    ...breakdowns.map((b) => b.field)
  ])

  const result: ChartAxisConfig = {}

  // For each key in smart defaults, use existing value if valid, otherwise use default
  const allKeys = new Set([
    ...Object.keys(existingConfig),
    ...Object.keys(smartDefaults)
  ]) as Set<keyof ChartAxisConfig>

  for (const key of allKeys) {
    const existingValue = existingConfig[key]
    const defaultValue = smartDefaults[key]

    // Check if existing value is valid
    if (isValidConfigField(existingValue as string | string[] | undefined, validFields)) {
      // Keep existing valid config
      result[key] = existingValue as any
    } else if (defaultValue !== undefined) {
      // Use smart default
      result[key] = defaultValue as any
    }
    // If neither exists or is valid, leave undefined
  }

  return result
}
