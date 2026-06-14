/**
 * Axis configuration mutation utilities
 *
 * Pure helpers that transform a ChartAxisConfig in response to drag/drop,
 * removal, and reorder operations. Extracted from AnalysisChartConfigPanel so
 * the component's event handlers stay flat. All helpers return a NEW config
 * object and never mutate the input.
 */

import type { ChartAxisConfig } from '../../../types'

type AxisKey = keyof ChartAxisConfig

interface DropZoneShape {
  key: string
  maxItems?: number
  enableDualAxis?: boolean
}

/**
 * Remove a field from an axis in-place on the given (already-cloned) config.
 * Handles both array-valued and string-valued axes, deleting the axis when it
 * becomes empty.
 */
function removeFieldFromAxis(config: ChartAxisConfig, axis: string, field: string): void {
  const value = config[axis as AxisKey]
  if (Array.isArray(value)) {
    const filtered = value.filter((f) => f !== field)
    if (filtered.length === 0) {
      delete config[axis as AxisKey]
    } else {
      config[axis as AxisKey] = filtered as never
    }
  } else if (value === field) {
    delete config[axis as AxisKey]
  }
}

/**
 * Add a field to an axis in-place. Single-item axes store a string; multi-item
 * axes store a de-duplicated array.
 */
function addFieldToAxis(
  config: ChartAxisConfig,
  axis: string,
  field: string,
  isSingleItem: boolean
): void {
  if (isSingleItem) {
    config[axis as AxisKey] = field as never
    return
  }
  const toValue = config[axis as AxisKey]
  if (Array.isArray(toValue)) {
    if (!toValue.includes(field)) {
      config[axis as AxisKey] = [...toValue, field] as never
    }
  } else {
    config[axis as AxisKey] = [field] as never
  }
}

/**
 * Compute the new config after dropping `field` onto `toAxis` (optionally moving
 * it from `fromAxis`). Applies the default left/right yAxisAssignment for dual-axis
 * drop zones.
 */
export function applyAxisDrop(
  chartConfig: ChartAxisConfig,
  field: string,
  fromAxis: string,
  toAxis: string,
  dropZoneConfig: DropZoneShape | undefined
): ChartAxisConfig {
  const newConfig = { ...chartConfig }

  // Remove from old location if moving between axes
  if (fromAxis !== 'available' && fromAxis !== toAxis) {
    removeFieldFromAxis(newConfig, fromAxis, field)
  }

  // Add to new location
  addFieldToAxis(newConfig, toAxis, field, dropZoneConfig?.maxItems === 1)

  // Apply default yAxisAssignment when adding to yAxis with dual axis enabled
  if (toAxis === 'yAxis' && dropZoneConfig?.enableDualAxis) {
    const currentYAxisFields = Array.isArray(newConfig.yAxis) ? newConfig.yAxis : [field]
    const fieldIndex = currentYAxisFields.indexOf(field)
    // Default: 1st field = left, 2nd field = right, 3rd+ = left
    if (!newConfig.yAxisAssignment?.[field]) {
      newConfig.yAxisAssignment = {
        ...newConfig.yAxisAssignment,
        [field]: fieldIndex === 1 ? 'right' : 'left'
      }
    }
  }

  return newConfig
}

/**
 * Compute the new config after removing `field` from `fromAxis`, cleaning up any
 * yAxisAssignment entry.
 */
export function applyAxisRemove(
  chartConfig: ChartAxisConfig,
  field: string,
  fromAxis: string
): ChartAxisConfig {
  const newConfig = { ...chartConfig }
  removeFieldFromAxis(newConfig, fromAxis, field)

  // Clean up yAxisAssignment when removing from yAxis
  if (fromAxis === 'yAxis' && newConfig.yAxisAssignment?.[field]) {
    const { [field]: _removed, ...rest } = newConfig.yAxisAssignment
    newConfig.yAxisAssignment = Object.keys(rest).length > 0 ? rest : undefined
  }

  return newConfig
}

/**
 * Compute the new config after reordering items within `axisKey`. Returns null
 * when no reorder is applicable (non-array, single item, or no-op move).
 */
export function applyAxisReorder(
  chartConfig: ChartAxisConfig,
  fromIndex: number,
  toIndex: number,
  axisKey: string
): ChartAxisConfig | null {
  const value = chartConfig[axisKey as AxisKey]
  if (!Array.isArray(value) || value.length <= 1 || fromIndex === toIndex) {
    return null
  }

  const newConfig = { ...chartConfig }
  const newArray = [...value]
  const [movedItem] = newArray.splice(fromIndex, 1)
  newArray.splice(toIndex, 0, movedItem)
  newConfig[axisKey as AxisKey] = newArray as never
  return newConfig
}
