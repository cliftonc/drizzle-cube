/**
 * Multi-Query Validation Utilities
 *
 * Pure functions for validating multi-query configurations.
 * These help detect issues like measure collisions and granularity mismatches.
 */

import type { CubeQuery } from '../types'

// TimeDimension type extracted from CubeQuery
type TimeDimension = NonNullable<CubeQuery['timeDimensions']>[number]

/**
 * Validation error for multi-query configuration
 */
export interface MultiQueryValidationError {
  type: 'missing_time_dimension' | 'granularity_mismatch' | 'missing_merge_key'
  queryIndex: number
  message: string
  details?: {
    field?: string
    expectedGranularity?: string
    actualGranularity?: string
  }
}

/**
 * Validation warning for multi-query configuration
 */
export interface MultiQueryValidationWarning {
  type: 'measure_collision' | 'asymmetric_date_range'
  queryIndices: number[]
  message: string
  affectedMeasures?: string[]
}

/**
 * Result of multi-query validation
 */
export interface MultiQueryValidationResult {
  isValid: boolean
  errors: MultiQueryValidationError[]
  warnings: MultiQueryValidationWarning[]
}

/**
 * Extract time dimension info from a query
 */
export function extractTimeDimensions(query: CubeQuery): TimeDimension[] {
  return query.timeDimensions || []
}

/**
 * Validate that all queries have matching time dimension granularities
 * Only relevant for 'merge' strategy where data needs to align
 */
export function validateTimeDimensionAlignment(queries: CubeQuery[]): MultiQueryValidationError[] {
  const errors: MultiQueryValidationError[] = []

  if (queries.length < 2) return errors

  // Get time dimensions from first query as reference
  const q1TimeDims = extractTimeDimensions(queries[0])
  if (q1TimeDims.length === 0) return errors // No time dimensions to validate

  // Check each subsequent query
  for (let i = 1; i < queries.length; i++) {
    const qTimeDims = extractTimeDimensions(queries[i])

    // Check if query has time dimensions
    if (qTimeDims.length === 0 && q1TimeDims.length > 0) {
      errors.push({
        type: 'missing_time_dimension',
        queryIndex: i,
        message: `Query ${i + 1} is missing time dimension "${q1TimeDims[0].dimension}"`,
        details: { field: q1TimeDims[0].dimension }
      })
      continue
    }

    // Check granularity matches
    for (const refTimeDim of q1TimeDims) {
      const matchingDim = qTimeDims.find(td => td.dimension === refTimeDim.dimension)
      if (matchingDim && matchingDim.granularity !== refTimeDim.granularity) {
        errors.push({
          type: 'granularity_mismatch',
          queryIndex: i,
          message: `Query ${i + 1} uses "${matchingDim.granularity}" granularity but Query 1 uses "${refTimeDim.granularity}"`,
          details: {
            field: refTimeDim.dimension,
            expectedGranularity: refTimeDim.granularity,
            actualGranularity: matchingDim.granularity
          }
        })
      }
    }
  }

  return errors
}

/**
 * Validate that merge keys exist in all queries
 */
export function validateMergeKeys(queries: CubeQuery[], mergeKeys: string[]): MultiQueryValidationError[] {
  const errors: MultiQueryValidationError[] = []

  if (queries.length < 2 || mergeKeys.length === 0) return errors

  for (let i = 0; i < queries.length; i++) {
    const query = queries[i]
    const allFields = new Set([
      ...(query.dimensions || []),
      ...(query.timeDimensions?.map(td => td.dimension) || [])
    ])

    for (const key of mergeKeys) {
      if (!allFields.has(key)) {
        errors.push({
          type: 'missing_merge_key',
          queryIndex: i,
          message: `Query ${i + 1} is missing merge dimension "${key}"`,
          details: { field: key }
        })
      }
    }
  }

  return errors
}

/**
 * Detect when the same measure appears in multiple queries
 * This is a warning since the first value wins in merge mode
 */
export function detectMeasureCollisions(queries: CubeQuery[]): MultiQueryValidationWarning[] {
  const warnings: MultiQueryValidationWarning[] = []

  if (queries.length < 2) return warnings

  // Count occurrences of each measure
  const measureCounts = new Map<string, number[]>()

  queries.forEach((query, index) => {
    query.measures?.forEach(measure => {
      if (!measureCounts.has(measure)) {
        measureCounts.set(measure, [])
      }
      measureCounts.get(measure)!.push(index)
    })
  })

  // Find collisions
  const collisions: string[] = []
  const collisionIndices = new Set<number>()

  measureCounts.forEach((indices, measure) => {
    if (indices.length > 1) {
      collisions.push(measure)
      indices.forEach(i => collisionIndices.add(i))
    }
  })

  if (collisions.length > 0) {
    warnings.push({
      type: 'measure_collision',
      queryIndices: Array.from(collisionIndices).sort(),
      message: `Measure${collisions.length > 1 ? 's' : ''} "${collisions.join('", "')}" appear${collisions.length === 1 ? 's' : ''} in multiple queries - first value will be used`,
      affectedMeasures: collisions
    })
  }

  return warnings
}

/**
 * Check if queries have different date ranges
 */
export function detectAsymmetricDateRanges(queries: CubeQuery[]): MultiQueryValidationWarning[] {
  const warnings: MultiQueryValidationWarning[] = []

  if (queries.length < 2) return warnings

  // Get date ranges from each query's time dimensions
  const dateRanges = queries.map(q => {
    const timeDim = q.timeDimensions?.[0]
    return timeDim?.dateRange
  })

  // Check if any are different
  const uniqueRanges = new Set(dateRanges.map(r => JSON.stringify(r)))
  if (uniqueRanges.size > 1) {
    warnings.push({
      type: 'asymmetric_date_range',
      queryIndices: queries.map((_, i) => i),
      message: 'Queries have different date ranges - some data points may be missing in merged results'
    })
  }

  return warnings
}

/**
 * Validate a multi-query configuration
 * For 'merge' strategy: strict validation (errors block execution)
 * For 'concat' strategy: only warnings
 */
export function validateMultiQueryConfig(
  queries: CubeQuery[],
  mergeStrategy: 'concat' | 'merge',
  mergeKeys: string[] = []
): MultiQueryValidationResult {
  const errors: MultiQueryValidationError[] = []
  const warnings: MultiQueryValidationWarning[] = []

  if (queries.length < 2) {
    return { isValid: true, errors, warnings }
  }

  // Always detect measure collisions (warning)
  warnings.push(...detectMeasureCollisions(queries))

  // Always detect asymmetric date ranges (warning)
  warnings.push(...detectAsymmetricDateRanges(queries))

  // For merge strategy, validate alignment
  if (mergeStrategy === 'merge') {
    errors.push(...validateTimeDimensionAlignment(queries))
    if (mergeKeys.length > 0) {
      errors.push(...validateMergeKeys(queries, mergeKeys))
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Check if a multi-query configuration is valid for execution
 */
export function isMultiQueryValid(queries: CubeQuery[]): boolean {
  return queries.filter(q =>
    (q.measures?.length || 0) +
    (q.dimensions?.length || 0) +
    (q.timeDimensions?.length || 0) > 0
  ).length >= 2
}

/**
 * Get human-readable validation summary
 */
export function getValidationSummary(result: MultiQueryValidationResult): string {
  if (result.isValid && result.warnings.length === 0) {
    return 'Configuration is valid'
  }

  const parts: string[] = []

  if (result.errors.length > 0) {
    parts.push(`${result.errors.length} error${result.errors.length > 1 ? 's' : ''}`)
  }

  if (result.warnings.length > 0) {
    parts.push(`${result.warnings.length} warning${result.warnings.length > 1 ? 's' : ''}`)
  }

  return parts.join(', ')
}
