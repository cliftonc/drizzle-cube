import type { ChartAvailabilityContext, ChartAvailability, DisplayOptionConfig } from './chartConfigs.js'

/**
 * Shared building blocks for chart `*.config.ts` files.
 *
 * Most chart configs repeated the same `isAvailable` guard and the same
 * display-option definitions (target line, Y-axis format, stacking, …).
 * These factories centralise that boilerplate so each chart config only
 * declares what is genuinely unique to it.
 */

/**
 * Standard availability rule shared by most chart types: at least one measure
 * and at least one dimension (regular or time) must be selected.
 */
export function requiresMeasureAndDimension({
  measureCount,
  dimensionCount
}: ChartAvailabilityContext): ChartAvailability {
  if (measureCount < 1) return { available: false, reason: 'chart.availability.requiresMeasure' }
  if (dimensionCount < 1) return { available: false, reason: 'chart.availability.requiresDimension' }
  return { available: true }
}

/**
 * Availability rule for charts that only need a single measure (KPI-style
 * charts and gauges): at least one measure, no dimension requirement.
 */
export function requiresMeasure({ measureCount }: ChartAvailabilityContext): ChartAvailability {
  if (measureCount < 1) return { available: false, reason: 'chart.availability.requiresMeasure' }
  return { available: true }
}

/** Target-line display option (single value or comma-separated spread). */
export const targetDisplayOption: DisplayOptionConfig = {
  key: 'target',
  label: 'chart.option.target.label',
  type: 'string',
  placeholder: 'e.g., 100 or 50,75 for spread',
  description: 'chart.option.target.description'
}

/** Connect-nulls toggle for line/area charts. */
export const connectNullsDisplayOption: DisplayOptionConfig = {
  key: 'connectNulls',
  label: 'chart.option.connectNulls.label',
  type: 'boolean',
  defaultValue: false,
  description: 'chart.option.connectNulls.description'
}

/** Left Y-axis numeric format control (dual-axis charts). */
export const leftYAxisFormatDisplayOption: DisplayOptionConfig = {
  key: 'leftYAxisFormat',
  label: 'chart.option.leftYAxisFormat.label',
  type: 'axisFormat',
  description: 'chart.option.leftYAxisFormat.description'
}

/** Right Y-axis numeric format control (dual-axis charts). */
export const rightYAxisFormatDisplayOption: DisplayOptionConfig = {
  key: 'rightYAxisFormat',
  label: 'chart.option.rightYAxisFormat.label',
  type: 'axisFormat',
  description: 'chart.option.rightYAxisFormat.description'
}

/**
 * Single value-format control used by charts that only have one numeric scale
 * (pie, radar, radial bar, treemap). Stored under `leftYAxisFormat` for
 * backward compatibility with existing saved configs.
 */
export function valueFormatDisplayOption(
  description = 'chart.option.valueFormat.description'
): DisplayOptionConfig {
  return {
    key: 'leftYAxisFormat',
    label: 'chart.option.valueFormat.label',
    type: 'axisFormat',
    description
  }
}

/**
 * Stacking-mode select shared by bar and area charts. `description` differs
 * per chart (bar vs area series wording).
 */
export function stackTypeDisplayOption(description: string): DisplayOptionConfig {
  return {
    key: 'stackType',
    label: 'chart.option.stacking.label',
    type: 'select',
    defaultValue: 'none',
    options: [
      { value: 'none', label: 'chart.option.accentBorder.none' },
      { value: 'normal', label: 'chart.option.stacking.stacked' },
      { value: 'percent', label: 'chart.option.stacking.percent' }
    ],
    description
  }
}
