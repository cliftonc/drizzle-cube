/**
 * Funnel Validation Utilities
 *
 * Provides validation for funnel configurations including:
 * - Binding key validation
 * - Step query validation
 * - Cross-cube compatibility checks
 */

import type { CubeQuery, CubeMeta } from '../types'
import type {
  FunnelBindingKey,
  FunnelConfig,
  FunnelStep,
  FunnelValidationError,
  FunnelValidationResult,
} from '../types/funnel'
import { getCubeNameFromQuery } from './funnelExecution'

/**
 * Validate that a binding key dimension exists in the given cubes
 */
export function validateBindingKeyExists(
  bindingKey: FunnelBindingKey,
  meta: CubeMeta | null
): FunnelValidationError[] {
  const errors: FunnelValidationError[] = []

  if (!meta?.cubes) {
    return errors // Can't validate without metadata
  }

  if (typeof bindingKey.dimension === 'string') {
    // Simple dimension - check it exists
    const [cubeName, dimName] = bindingKey.dimension.split('.')
    const cube = meta.cubes.find((c) => c.name === cubeName)

    if (!cube) {
      errors.push({
        type: 'binding_key',
        message: `Cube "${cubeName}" not found for binding key`,
      })
    } else {
      const dim = cube.dimensions?.find((d) => d.name === bindingKey.dimension)
      if (!dim) {
        errors.push({
          type: 'binding_key',
          message: `Dimension "${dimName}" not found in cube "${cubeName}"`,
        })
      }
    }
  } else {
    // Cross-cube mappings - validate each
    for (const mapping of bindingKey.dimension) {
      const cube = meta.cubes.find((c) => c.name === mapping.cube)

      if (!cube) {
        errors.push({
          type: 'cross_cube',
          message: `Cube "${mapping.cube}" not found for binding key mapping`,
        })
      } else {
        const dim = cube.dimensions?.find((d) => d.name === mapping.dimension)
        if (!dim) {
          errors.push({
            type: 'cross_cube',
            message: `Dimension "${mapping.dimension}" not found in cube "${mapping.cube}"`,
          })
        }
      }
    }
  }

  return errors
}

/**
 * Validate that each step has a valid query
 */
export function validateStepQueries(
  steps: FunnelStep[]
): FunnelValidationError[] {
  const errors: FunnelValidationError[] = []

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    const query = step.query

    // Check that query has at least one field
    const hasFields =
      (query.measures && query.measures.length > 0) ||
      (query.dimensions && query.dimensions.length > 0) ||
      (query.timeDimensions && query.timeDimensions.length > 0)

    if (!hasFields) {
      errors.push({
        type: 'step_query',
        message: `Step ${i + 1} "${step.name}" has no measures, dimensions, or time dimensions`,
        stepIndex: i,
      })
    }
  }

  return errors
}

/**
 * Check if binding key can be resolved for a given query
 */
export function canResolveBindingKey(
  bindingKey: FunnelBindingKey,
  query: CubeQuery
): boolean {
  if (typeof bindingKey.dimension === 'string') {
    // Simple case - binding key applies universally
    return true
  }

  // Cross-cube case - check if query's cube has a mapping
  const cubeName = getCubeNameFromQuery(query)
  if (!cubeName) return false

  return bindingKey.dimension.some((m) => m.cube === cubeName)
}

/**
 * Validate binding key for all funnel steps
 */
export function validateBindingKeyForSteps(
  bindingKey: FunnelBindingKey,
  steps: FunnelStep[]
): FunnelValidationError[] {
  const errors: FunnelValidationError[] = []

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i]
    if (!canResolveBindingKey(bindingKey, step.query)) {
      const cubeName = getCubeNameFromQuery(step.query) || 'unknown'
      errors.push({
        type: 'cross_cube',
        message: `Step ${i + 1} uses cube "${cubeName}" but no binding key mapping exists for it`,
        stepIndex: i,
      })
    }
  }

  return errors
}

/**
 * Validate time window format (ISO 8601 duration)
 */
export function validateTimeWindow(
  duration: string | undefined
): FunnelValidationError | null {
  if (!duration) return null

  // Basic ISO 8601 duration validation
  // Formats: P1D, P7D, PT1H, PT30M, P1DT12H, etc.
  const durationRegex = /^P(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?(?:T(?:\d+H)?(?:\d+M)?(?:\d+S)?)?$/

  if (!durationRegex.test(duration)) {
    return {
      type: 'time_window',
      message: `Invalid time window format "${duration}". Expected ISO 8601 duration (e.g., P7D, PT1H)`,
    }
  }

  return null
}

/**
 * Validate complete funnel configuration
 */
export function validateFunnelConfig(
  config: FunnelConfig,
  meta: CubeMeta | null
): FunnelValidationResult {
  const errors: FunnelValidationError[] = []
  const warnings: FunnelValidationError[] = []

  // Check minimum steps
  if (config.steps.length < 2) {
    errors.push({
      type: 'general',
      message: 'Funnel requires at least 2 steps',
    })
  }

  // Validate binding key
  if (!config.bindingKey?.dimension) {
    errors.push({
      type: 'binding_key',
      message: 'Binding key dimension is required',
    })
  } else {
    // Check binding key exists in cubes
    errors.push(...validateBindingKeyExists(config.bindingKey, meta))

    // Check binding key can be resolved for all steps
    errors.push(...validateBindingKeyForSteps(config.bindingKey, config.steps))
  }

  // Validate step queries
  errors.push(...validateStepQueries(config.steps))

  // Validate time windows
  for (let i = 0; i < config.steps.length; i++) {
    const step = config.steps[i]
    const timeError = validateTimeWindow(step.timeToConvert)
    if (timeError) {
      timeError.stepIndex = i
      errors.push(timeError)
    }
  }

  // Validate global time window
  const globalTimeError = validateTimeWindow(config.globalTimeWindow)
  if (globalTimeError) {
    errors.push(globalTimeError)
  }

  // Add warnings for potential issues
  if (config.steps.length > 5) {
    warnings.push({
      type: 'general',
      message: 'Funnels with more than 5 steps may have reduced performance',
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Quick check if minimum funnel requirements are met
 */
export function isMinimumFunnelConfigValid(
  bindingKey: FunnelBindingKey | null,
  queryCount: number
): { isValid: boolean; message?: string } {
  if (queryCount < 2) {
    return { isValid: false, message: 'Add at least 2 steps for funnel' }
  }

  if (!bindingKey?.dimension) {
    return { isValid: false, message: 'Select a binding key dimension' }
  }

  if (typeof bindingKey.dimension === 'string' && !bindingKey.dimension) {
    return { isValid: false, message: 'Select a binding key dimension' }
  }

  if (Array.isArray(bindingKey.dimension) && bindingKey.dimension.length === 0) {
    return { isValid: false, message: 'Select a binding key dimension' }
  }

  return { isValid: true }
}

/**
 * Get available dimensions that can serve as binding keys
 * These should be dimensions that identify entities (e.g., user IDs, order IDs)
 */
export function getAvailableBindingKeyDimensions(
  meta: CubeMeta | null
): Array<{ cube: string; dimension: string; label: string }> {
  if (!meta?.cubes) return []

  const dimensions: Array<{ cube: string; dimension: string; label: string }> = []

  for (const cube of meta.cubes) {
    if (!cube.dimensions) continue

    for (const dim of cube.dimensions) {
      // Only include string/number dimensions (not time dimensions)
      // as potential binding keys
      if (dim.type === 'string' || dim.type === 'number') {
        dimensions.push({
          cube: cube.name,
          dimension: dim.name,
          label: dim.title || dim.shortTitle || dim.name.split('.')[1] || dim.name,
        })
      }
    }
  }

  return dimensions
}

/**
 * Get the display label for a binding key
 */
export function getBindingKeyLabel(
  bindingKey: FunnelBindingKey | null
): string {
  if (!bindingKey?.dimension) return 'Select binding key...'

  if (typeof bindingKey.dimension === 'string') {
    const parts = bindingKey.dimension.split('.')
    return parts[1] || bindingKey.dimension
  }

  // Cross-cube - show first mapping
  if (bindingKey.dimension.length > 0) {
    const first = bindingKey.dimension[0]
    const parts = first.dimension.split('.')
    return `${parts[1] || first.dimension} (${bindingKey.dimension.length} cubes)`
  }

  return 'Select binding key...'
}
