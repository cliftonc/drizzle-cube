/**
 * AI Query Validation Engine
 * Validate queries with helpful corrections and suggestions
 */

import { t } from '../../i18n/runtime.js'
import type { CubeMetadata } from '../types/metadata.js'
import type { SemanticQuery, Filter } from '../types/query.js'
import { findBestFieldMatch, levenshteinDistance } from './discovery.js'
import {
  validateRequiredDimensionField,
  buildCorrectedQuery,
  collectPerformanceWarnings,
  checkTimeDimensionType,
  validateMemberFilter,
} from './validation-helpers.js'

/**
 * Validation result with corrections
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  correctedQuery?: SemanticQuery
}

/**
 * Validation error with optional correction
 */
export interface ValidationError {
  type: 'cube_not_found' | 'measure_not_found' | 'dimension_not_found' | 'invalid_filter' | 'invalid_time_dimension' | 'syntax_error'
  message: string
  field?: string
  suggestion?: string
  correctedValue?: string
}

/**
 * Validation warning (query will work but may have issues)
 */
export interface ValidationWarning {
  type: 'ambiguous_field' | 'performance' | 'best_practice'
  message: string
  field?: string
  suggestion?: string
}

/**
 * Find closest match for a field name
 */
function findClosestField(
  fieldName: string,
  availableFields: string[]
): { field: string; distance: number } | null {
  let bestMatch: { field: string; distance: number } | null = null

  for (const field of availableFields) {
    const distance = levenshteinDistance(fieldName.toLowerCase(), field.toLowerCase())
    // Allow matches within reasonable edit distance (e.g., typos)
    if (distance <= 3 && (!bestMatch || distance < bestMatch.distance)) {
      bestMatch = { field, distance }
    }
  }

  return bestMatch
}

/**
 * Validate a measure reference
 */
function validateMeasure(
  measure: string,
  metadata: CubeMetadata[],
  errors: ValidationError[],
  corrections: Map<string, string>
): void {
  const parts = measure.split('.')
  if (parts.length !== 2) {
    errors.push({
      type: 'syntax_error',
      message: t('server.validation.ai.invalidMeasureFormat', { measure }),
      field: measure
    })
    return
  }

  const [cubeName, measureName] = parts
  const cube = metadata.find(c => c.name === cubeName)

  if (!cube) {
    // Try to find similar cube name
    const cubeNames = metadata.map(c => c.name)
    const closest = findClosestField(cubeName, cubeNames)

    if (closest) {
      errors.push({
        type: 'cube_not_found',
        message: t('server.validation.ai.cubeNotFoundWithSuggestion', { cubeName }),
        field: measure,
        suggestion: `Did you mean '${closest.field}'?`,
        correctedValue: `${closest.field}.${measureName}`
      })
      corrections.set(measure, `${closest.field}.${measureName}`)
    } else {
      errors.push({
        type: 'cube_not_found',
        message: t('server.validation.ai.cubeNotFoundWithAvailable', { cubeName }),
        field: measure,
        suggestion: `Available cubes: ${cubeNames.join(', ')}`
      })
    }
    return
  }

  const measureExists = cube.measures.some(m => m.name === measure)
  if (!measureExists) {
    // Try fuzzy match using discovery
    const match = findBestFieldMatch(metadata, measureName, 'measure')
    if (match && match.cube === cubeName) {
      errors.push({
        type: 'measure_not_found',
        message: t('server.validation.ai.measureNotFoundWithSuggestion', { measureName, cubeName }),
        field: measure,
        suggestion: `Did you mean '${match.field}'?`,
        correctedValue: match.field
      })
      corrections.set(measure, match.field)
    } else {
      const availableMeasures = cube.measures.map(m => m.name.split('.').pop()!)
      const closest = findClosestField(measureName, availableMeasures)

      if (closest) {
        const correctedField = `${cubeName}.${closest.field}`
        errors.push({
          type: 'measure_not_found',
          message: t('server.validation.ai.measureNotFoundWithSuggestion', { measureName, cubeName }),
          field: measure,
          suggestion: `Did you mean '${closest.field}'?`,
          correctedValue: correctedField
        })
        corrections.set(measure, correctedField)
      } else {
        errors.push({
          type: 'measure_not_found',
          message: t('server.validation.ai.measureNotFoundWithAvailable', { measureName, cubeName }),
          field: measure,
          suggestion: `Available measures: ${availableMeasures.slice(0, 5).join(', ')}${availableMeasures.length > 5 ? '...' : ''}`
        })
      }
    }
  }
}

/**
 * Validate a dimension reference
 */
function validateDimension(
  dimension: string,
  metadata: CubeMetadata[],
  errors: ValidationError[],
  corrections: Map<string, string>
): void {
  const parts = dimension.split('.')
  if (parts.length !== 2) {
    errors.push({
      type: 'syntax_error',
      message: t('server.validation.ai.invalidDimensionFormat', { dimension }),
      field: dimension
    })
    return
  }

  const [cubeName, dimensionName] = parts
  const cube = metadata.find(c => c.name === cubeName)

  if (!cube) {
    const cubeNames = metadata.map(c => c.name)
    const closest = findClosestField(cubeName, cubeNames)

    if (closest) {
      errors.push({
        type: 'cube_not_found',
        message: t('server.validation.ai.cubeNotFoundWithSuggestion', { cubeName }),
        field: dimension,
        suggestion: `Did you mean '${closest.field}'?`,
        correctedValue: `${closest.field}.${dimensionName}`
      })
      corrections.set(dimension, `${closest.field}.${dimensionName}`)
    } else {
      errors.push({
        type: 'cube_not_found',
        message: t('server.validation.ai.cubeNotFoundWithAvailable', { cubeName }),
        field: dimension,
        suggestion: `Available cubes: ${cubeNames.join(', ')}`
      })
    }
    return
  }

  const dimensionExists = cube.dimensions.some(d => d.name === dimension)
  if (!dimensionExists) {
    const match = findBestFieldMatch(metadata, dimensionName, 'dimension')
    if (match && match.cube === cubeName) {
      errors.push({
        type: 'dimension_not_found',
        message: t('server.validation.ai.dimensionNotFoundWithSuggestion', { dimensionName, cubeName }),
        field: dimension,
        suggestion: `Did you mean '${match.field}'?`,
        correctedValue: match.field
      })
      corrections.set(dimension, match.field)
    } else {
      const availableDimensions = cube.dimensions.map(d => d.name.split('.').pop()!)
      const closest = findClosestField(dimensionName, availableDimensions)

      if (closest) {
        const correctedField = `${cubeName}.${closest.field}`
        errors.push({
          type: 'dimension_not_found',
          message: t('server.validation.ai.dimensionNotFoundWithSuggestion', { dimensionName, cubeName }),
          field: dimension,
          suggestion: `Did you mean '${closest.field}'?`,
          correctedValue: correctedField
        })
        corrections.set(dimension, correctedField)
      } else {
        errors.push({
          type: 'dimension_not_found',
          message: t('server.validation.ai.dimensionNotFoundWithAvailable', { dimensionName, cubeName }),
          field: dimension,
          suggestion: `Available dimensions: ${availableDimensions.slice(0, 5).join(', ')}${availableDimensions.length > 5 ? '...' : ''}`
        })
      }
    }
  }
}

/**
 * Validate filters recursively
 */
function validateFilters(
  filters: Filter[],
  metadata: CubeMetadata[],
  errors: ValidationError[],
  corrections: Map<string, string>
): void {
  for (const filter of filters) {
    // Handle logical filters (AND/OR)
    if ('and' in filter && Array.isArray(filter.and)) {
      validateFilters(filter.and, metadata, errors, corrections)
      continue
    }
    if ('or' in filter && Array.isArray(filter.or)) {
      validateFilters(filter.or, metadata, errors, corrections)
      continue
    }

    // Handle simple filter
    if ('member' in filter) {
      validateMemberFilter(filter, metadata, errors, corrections, findClosestField)
    }
  }
}

/**
 * Validate funnel query structure
 */
function validateFunnelQuery(
  query: SemanticQuery,
  metadata: CubeMetadata[],
  errors: ValidationError[],
  warnings: ValidationWarning[],
  corrections: Map<string, string>
): void {
  const funnel = query.funnel
  if (!funnel) return

  const dim = (value: string, errs: ValidationError[]): void => validateDimension(value, metadata, errs, corrections)

  // Required fields
  validateRequiredDimensionField(funnel.bindingKey, 'server.validation.ai.bindingKeyRequired.funnel', dim, errors)
  validateRequiredDimensionField(funnel.timeDimension, 'server.validation.ai.timeDimensionRequired.funnel', dim, errors)

  if (!funnel.steps || !Array.isArray(funnel.steps)) {
    errors.push({
      type: 'syntax_error',
      message: t('server.validation.ai.funnelStepsRequired')
    })
  } else if (funnel.steps.length < 2) {
    errors.push({
      type: 'syntax_error',
      message: t('server.validation.ai.funnelRequiresSteps')
    })
  } else {
    // Validate each step's filter
    for (let i = 0; i < funnel.steps.length; i++) {
      const step = funnel.steps[i]
      if (!step.name) {
        warnings.push({
          type: 'best_practice',
          message: t('server.validation.ai.stepMissingName', { step: i + 1 }),
          suggestion: t('server.validation.ai.suggestAddStepNames')
        })
      }
      if (step.filter && 'member' in step.filter) {
        validateFilters([step.filter], metadata, errors, corrections)
      }
    }
  }
}

/**
 * Validate flow query structure
 */
function validateFlowQuery(
  query: SemanticQuery,
  metadata: CubeMetadata[],
  errors: ValidationError[],
  warnings: ValidationWarning[],
  corrections: Map<string, string>
): void {
  const flow = query.flow
  if (!flow) return

  const dim = (value: string, errs: ValidationError[]): void => validateDimension(value, metadata, errs, corrections)

  validateRequiredDimensionField(flow.bindingKey, 'server.validation.ai.bindingKeyRequired.flow', dim, errors)
  validateRequiredDimensionField(flow.timeDimension, 'server.validation.ai.timeDimensionRequired.flow', dim, errors)
  validateRequiredDimensionField(flow.eventDimension, 'server.validation.ai.eventDimensionRequired', dim, errors)

  if (flow.stepsBefore === undefined && flow.stepsAfter === undefined) {
    warnings.push({
      type: 'best_practice',
      message: t('server.validation.ai.stepsBothMissing'),
      suggestion: t('server.validation.ai.suggestSetSteps')
    })
  }
}

/**
 * Validate retention query structure
 */
function validateRetentionQuery(
  query: SemanticQuery,
  metadata: CubeMetadata[],
  errors: ValidationError[],
  warnings: ValidationWarning[],
  corrections: Map<string, string>
): void {
  const retention = query.retention
  if (!retention) return

  const dim = (value: string, errs: ValidationError[]): void => validateDimension(value, metadata, errs, corrections)

  validateRequiredDimensionField(retention.bindingKey, 'server.validation.ai.bindingKeyRequired.retention', dim, errors)
  validateRequiredDimensionField(retention.timeDimension, 'server.validation.ai.retentionTimeDimensionRequired', dim, errors)

  if (!retention.granularity) {
    warnings.push({
      type: 'best_practice',
      message: t('server.validation.ai.granularityNotSpecified'),
      suggestion: t('server.validation.ai.suggestSpecifyGranularity')
    })
  }

  if (!retention.periods) {
    warnings.push({
      type: 'best_practice',
      message: t('server.validation.ai.periodsNotSpecified'),
      suggestion: t('server.validation.ai.suggestSpecifyPeriods')
    })
  }
}

/**
 * Validate a query with helpful corrections
 */
/** Dispatch an analysis-mode (funnel/flow/retention) query to its validator, if any. */
function validateAnalysisMode(
  query: SemanticQuery,
  metadata: CubeMetadata[],
  errors: ValidationError[],
  warnings: ValidationWarning[],
  corrections: Map<string, string>
): boolean {
  if (query.funnel) {
    validateFunnelQuery(query, metadata, errors, warnings, corrections)
    return true
  }
  if (query.flow) {
    validateFlowQuery(query, metadata, errors, warnings, corrections)
    return true
  }
  if (query.retention) {
    validateRetentionQuery(query, metadata, errors, warnings, corrections)
    return true
  }
  return false
}

/** Run standard measure/dimension/timeDimension/filter validation for a non-analysis query. */
function validateStandardQuery(
  query: SemanticQuery,
  metadata: CubeMetadata[],
  errors: ValidationError[],
  warnings: ValidationWarning[],
  corrections: Map<string, string>
): void {
  // Validate measures
  if (query.measures) {
    for (const measure of query.measures) {
      validateMeasure(measure, metadata, errors, corrections)
    }
  }

  // Validate dimensions
  if (query.dimensions) {
    for (const dimension of query.dimensions) {
      validateDimension(dimension, metadata, errors, corrections)
    }
  }

  // Validate timeDimensions
  if (query.timeDimensions) {
    for (const timeDim of query.timeDimensions) {
      validateDimension(timeDim.dimension, metadata, errors, corrections)
      // Check that the dimension is a time type
      checkTimeDimensionType(timeDim.dimension, metadata, warnings)
    }
  }

  // Validate filters
  if (query.filters) {
    validateFilters(query.filters, metadata, errors, corrections)
  }

  // Check for empty query
  if (!query.measures?.length && !query.dimensions?.length) {
    errors.push({
      type: 'syntax_error',
      message: t('server.validation.ai.emptyQuery')
    })
  }

  // Performance warnings
  collectPerformanceWarnings(query, warnings)
}

export function validateQuery(
  query: SemanticQuery,
  metadata: CubeMetadata[]
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const corrections: Map<string, string> = new Map()

  // Detect query type and validate accordingly.
  // Analysis-mode queries skip standard validation and corrections.
  if (validateAnalysisMode(query, metadata, errors, warnings, corrections)) {
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      correctedQuery: undefined // Analysis-mode corrections not implemented yet
    }
  }

  validateStandardQuery(query, metadata, errors, warnings, corrections)

  // Build corrected query if we have corrections
  const correctedQuery = buildCorrectedQuery(query, corrections)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    correctedQuery
  }
}
