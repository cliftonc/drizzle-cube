/**
 * Smart Chart Defaulting System
 *
 * Provides intelligent chart type selection and configuration based on
 * the user's current metrics and breakdowns selection.
 */

import type { ChartType, ChartAxisConfig } from '../types'
import type { MetricItem, BreakdownItem } from '../components/AnalysisBuilder/types'
import { chartConfigRegistry } from '../charts/chartConfigRegistry'
import type { ChartAvailability, ChartAvailabilityContext } from '../charts/chartConfigs'

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

// Re-export from chartConfigs so existing imports keep working
export type { ChartAvailability } from '../charts/chartConfigs'

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
 * Build a ChartAvailabilityContext from the current metrics/breakdowns.
 * `dimensionCount` intentionally includes time dimensions — a time dimension
 * can serve any role a regular dimension does (pie slices, heatmap axes, etc).
 */
function buildAvailabilityContext(
  metrics: MetricItem[],
  breakdowns: BreakdownItem[],
  features?: import('../types').FeaturesConfig
): ChartAvailabilityContext {
  return {
    features,
    measureCount: metrics.length,
    dimensionCount: breakdowns.length,
    timeDimensionCount: getTimeDimensions(breakdowns).length,
  }
}

/**
 * Check if a specific chart type is available given current selections.
 * Delegates to each chart's own `isAvailable` declared in its .config.ts —
 * availability requirements live next to the chart they describe, not here.
 */
export function getChartAvailability(
  chartType: ChartType,
  metrics: MetricItem[],
  breakdowns: BreakdownItem[],
  features?: import('../types').FeaturesConfig
): ChartAvailability {
  const config = chartConfigRegistry[chartType]
  if (!config || !config.isAvailable) {
    // Charts that don't declare requirements (table, markdown, unknown plugins)
    // are always available.
    return { available: true }
  }
  return config.isAvailable(buildAvailabilityContext(metrics, breakdowns, features))
}

/**
 * Get availability for all chart types
 */
export function getAllChartAvailability(
  metrics: MetricItem[],
  breakdowns: BreakdownItem[],
  features?: import('../types').FeaturesConfig
): ChartAvailabilityMap {
  // Derive chart types dynamically from the registry (includes custom plugins)
  const chartTypes = Object.keys(chartConfigRegistry) as ChartType[]

  const availability: Partial<ChartAvailabilityMap> = {}
  for (const chartType of chartTypes) {
    availability[chartType] = getChartAvailability(chartType, metrics, breakdowns, features)
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
  currentChartType: ChartType,
  features?: import('../types').FeaturesConfig
): ChartType {
  // Check if current chart type is still valid
  const currentAvailability = getChartAvailability(currentChartType, metrics, breakdowns, features)
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
  currentChartType: ChartType,
  features?: import('../types').FeaturesConfig
): SmartChartDefaults {
  // First, determine the best chart type
  const chartType = selectBestChartType(metrics, breakdowns, currentChartType, features)

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
  userManuallySelected: boolean,
  features?: import('../types').FeaturesConfig
): ChartType | null {
  // If user manually selected this chart type, only switch if it becomes invalid
  if (userManuallySelected) {
    const availability = getChartAvailability(currentChartType, metrics, breakdowns, features)
    if (availability.available) {
      return null // Keep user's choice
    }
  }

  // Check if a better chart type should be used
  const recommendedType = selectBestChartType(metrics, breakdowns, currentChartType, features)

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
