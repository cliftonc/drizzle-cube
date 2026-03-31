/**
 * AI Query Validation Engine
 * Validate queries with helpful corrections and suggestions
 */

import { t } from '../../i18n/runtime'
import type { CubeMetadata } from '../types/metadata'
import type { SemanticQuery, Filter } from '../types/query'
import { findBestFieldMatch } from './discovery'

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
 * Levenshtein distance for fuzzy matching (copied from discovery for standalone use)
 */
function levenshteinDistance(a: string, b: string): number {
  if (a.length > 500 || b.length > 500) return a.length + b.length
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }

  return matrix[b.length][a.length]
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
      const member = filter.member
      const parts = member.split('.')
      if (parts.length !== 2) {
        errors.push({
          type: 'invalid_filter',
          message: t('server.validation.ai.invalidFilterMemberFormat', { member }),
          field: member
        })
        continue
      }

      const [cubeName, fieldName] = parts
      const cube = metadata.find(c => c.name === cubeName)

      if (!cube) {
        const cubeNames = metadata.map(c => c.name)
        const closest = findClosestField(cubeName, cubeNames)
        if (closest) {
          corrections.set(member, `${closest.field}.${fieldName}`)
        }
        errors.push({
          type: 'cube_not_found',
          message: t('server.validation.ai.cubeNotFoundInFilter', { cubeName }),
          field: member,
          suggestion: closest ? `Did you mean '${closest.field}'?` : undefined,
          correctedValue: closest ? `${closest.field}.${fieldName}` : undefined
        })
        continue
      }

      // Check if member is a valid dimension or measure
      const isDimension = cube.dimensions.some(d => d.name === member)
      const isMeasure = cube.measures.some(m => m.name === member)

      if (!isDimension && !isMeasure) {
        const allFields = [
          ...cube.dimensions.map(d => d.name.split('.').pop()!),
          ...cube.measures.map(m => m.name.split('.').pop()!)
        ]
        const closest = findClosestField(fieldName, allFields)

        if (closest) {
          const correctedField = `${cubeName}.${closest.field}`
          corrections.set(member, correctedField)
          errors.push({
            type: 'invalid_filter',
            message: t('server.validation.ai.filterFieldNotFoundWithSuggestion', { fieldName, cubeName }),
            field: member,
            suggestion: `Did you mean '${closest.field}'?`,
            correctedValue: correctedField
          })
        } else {
          errors.push({
            type: 'invalid_filter',
            message: t('server.validation.ai.filterFieldNotFound', { fieldName, cubeName }),
            field: member
          })
        }
      }
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

  // Required fields
  if (!funnel.bindingKey) {
    errors.push({
      type: 'syntax_error',
      message: t('server.validation.ai.bindingKeyRequired.funnel')
    })
  } else if (typeof funnel.bindingKey === 'string') {
    validateDimension(funnel.bindingKey, metadata, errors, corrections)
  }

  if (!funnel.timeDimension) {
    errors.push({
      type: 'syntax_error',
      message: t('server.validation.ai.timeDimensionRequired.funnel')
    })
  } else if (typeof funnel.timeDimension === 'string') {
    validateDimension(funnel.timeDimension, metadata, errors, corrections)
  }

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

  if (!flow.bindingKey) {
    errors.push({
      type: 'syntax_error',
      message: t('server.validation.ai.bindingKeyRequired.flow')
    })
  } else if (typeof flow.bindingKey === 'string') {
    validateDimension(flow.bindingKey, metadata, errors, corrections)
  }

  if (!flow.timeDimension) {
    errors.push({
      type: 'syntax_error',
      message: t('server.validation.ai.timeDimensionRequired.flow')
    })
  } else if (typeof flow.timeDimension === 'string') {
    validateDimension(flow.timeDimension, metadata, errors, corrections)
  }

  if (!flow.eventDimension) {
    errors.push({
      type: 'syntax_error',
      message: t('server.validation.ai.eventDimensionRequired')
    })
  } else if (typeof flow.eventDimension === 'string') {
    validateDimension(flow.eventDimension, metadata, errors, corrections)
  }

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

  if (!retention.bindingKey) {
    errors.push({
      type: 'syntax_error',
      message: t('server.validation.ai.bindingKeyRequired.retention')
    })
  } else if (typeof retention.bindingKey === 'string') {
    validateDimension(retention.bindingKey, metadata, errors, corrections)
  }

  if (!retention.timeDimension) {
    errors.push({
      type: 'syntax_error',
      message: t('server.validation.ai.retentionTimeDimensionRequired')
    })
  } else if (typeof retention.timeDimension === 'string') {
    validateDimension(retention.timeDimension, metadata, errors, corrections)
  }

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
export function validateQuery(
  query: SemanticQuery,
  metadata: CubeMetadata[]
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationWarning[] = []
  const corrections: Map<string, string> = new Map()

  // Detect query type and validate accordingly
  if (query.funnel) {
    validateFunnelQuery(query, metadata, errors, warnings, corrections)
    // Skip standard validation for funnel queries
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      correctedQuery: undefined // Funnel corrections not implemented yet
    }
  }

  if (query.flow) {
    validateFlowQuery(query, metadata, errors, warnings, corrections)
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      correctedQuery: undefined
    }
  }

  if (query.retention) {
    validateRetentionQuery(query, metadata, errors, warnings, corrections)
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      correctedQuery: undefined
    }
  }

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
      const [cubeName] = timeDim.dimension.split('.')
      const cube = metadata.find(c => c.name === cubeName)
      if (cube) {
        const dimension = cube.dimensions.find(d => d.name === timeDim.dimension)
        if (dimension && dimension.type !== 'time') {
          warnings.push({
            type: 'best_practice',
            message: t('server.validation.ai.dimensionNotTimeType', { dimension: timeDim.dimension, type: dimension.type }),
            field: timeDim.dimension,
            suggestion: t('server.validation.ai.suggestUseTimeDimension')
          })
        }
      }
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
  if (query.measures && query.measures.length > 10) {
    warnings.push({
      type: 'performance',
      message: t('server.validation.ai.performanceManyMeasures', { count: query.measures.length }),
      suggestion: t('server.validation.ai.suggestSplitQueries')
    })
  }

  if (query.dimensions && query.dimensions.length > 5) {
    warnings.push({
      type: 'performance',
      message: t('server.validation.ai.performanceManyDimensions', { count: query.dimensions.length }),
      suggestion: t('server.validation.ai.suggestAddDimensionFilters')
    })
  }

  // Build corrected query if we have corrections
  let correctedQuery: SemanticQuery | undefined
  if (corrections.size > 0) {
    const clonedQuery: SemanticQuery = JSON.parse(JSON.stringify(query)) // Deep clone

    if (clonedQuery.measures) {
      clonedQuery.measures = clonedQuery.measures.map(m => corrections.get(m) || m)
    }
    if (clonedQuery.dimensions) {
      clonedQuery.dimensions = clonedQuery.dimensions.map(d => corrections.get(d) || d)
    }
    if (clonedQuery.timeDimensions) {
      clonedQuery.timeDimensions = clonedQuery.timeDimensions.map(td => ({
        ...td,
        dimension: corrections.get(td.dimension) || td.dimension
      }))
    }
    // Note: Filter corrections would require recursive update
    correctedQuery = clonedQuery
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    correctedQuery: corrections.size > 0 ? correctedQuery : undefined
  }
}
