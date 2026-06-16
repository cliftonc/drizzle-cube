/**
 * AI Query Validation Engine — helpers
 * Pure step extractions for validation.ts. Behaviour and emitted errors/warnings
 * are identical to the original inline logic; these helpers reduce per-function
 * complexity without changing output.
 */

import { t } from '../../i18n/runtime.js'
import type { TranslationKey } from '../../i18n/types.js'
import type { CubeMetadata } from '../types/metadata.js'
import type { SemanticQuery, Filter } from '../types/query.js'
import type { ValidationError, ValidationWarning } from './validation.js'

/** Validate that a required event-stream field is present and (if a string) a valid dimension. */
export function validateRequiredDimensionField(
  value: unknown,
  missingMessageKey: TranslationKey,
  validateDimension: (dimension: string, errors: ValidationError[]) => void,
  errors: ValidationError[]
): void {
  if (!value) {
    errors.push({ type: 'syntax_error', message: t(missingMessageKey) })
  } else if (typeof value === 'string') {
    validateDimension(value, errors)
  }
}

/** Apply field-name corrections to a measures/dimensions string array. */
export function applyCorrectionsToList(list: string[], corrections: Map<string, string>): string[] {
  return list.map(item => corrections.get(item) || item)
}

/** Build the corrected query by applying field corrections (returns undefined if none). */
export function buildCorrectedQuery(
  query: SemanticQuery,
  corrections: Map<string, string>
): SemanticQuery | undefined {
  if (corrections.size === 0) return undefined

  const clonedQuery: SemanticQuery = JSON.parse(JSON.stringify(query)) // Deep clone

  if (clonedQuery.measures) {
    clonedQuery.measures = applyCorrectionsToList(clonedQuery.measures, corrections)
  }
  if (clonedQuery.dimensions) {
    clonedQuery.dimensions = applyCorrectionsToList(clonedQuery.dimensions, corrections)
  }
  if (clonedQuery.timeDimensions) {
    clonedQuery.timeDimensions = clonedQuery.timeDimensions.map(td => ({
      ...td,
      dimension: corrections.get(td.dimension) || td.dimension
    }))
  }
  // Note: Filter corrections would require recursive update
  return clonedQuery
}

/** Push performance/best-practice warnings for an oversized standard query. */
export function collectPerformanceWarnings(
  query: SemanticQuery,
  warnings: ValidationWarning[]
): void {
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
}

/** Warn when a declared time dimension is not actually of time type. */
export function checkTimeDimensionType(
  dimensionRef: string,
  metadata: CubeMetadata[],
  warnings: ValidationWarning[]
): void {
  const [cubeName] = dimensionRef.split('.')
  const cube = metadata.find(c => c.name === cubeName)
  if (!cube) return
  const dimension = cube.dimensions.find(d => d.name === dimensionRef)
  if (dimension && dimension.type !== 'time') {
    warnings.push({
      type: 'best_practice',
      message: t('server.validation.ai.dimensionNotTimeType', { dimension: dimensionRef, type: dimension.type }),
      field: dimensionRef,
      suggestion: t('server.validation.ai.suggestUseTimeDimension')
    })
  }
}

/** Validate a single member-style filter (cube + field existence). */
export function validateMemberFilter(
  filter: Extract<Filter, { member: string }>,
  metadata: CubeMetadata[],
  errors: ValidationError[],
  corrections: Map<string, string>,
  findClosestField: (fieldName: string, available: string[]) => { field: string; distance: number } | null
): void {
  const member = filter.member
  const parts = member.split('.')
  if (parts.length !== 2) {
    errors.push({
      type: 'invalid_filter',
      message: t('server.validation.ai.invalidFilterMemberFormat', { member }),
      field: member
    })
    return
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
    return
  }

  // Check if member is a valid dimension or measure
  const isDimension = cube.dimensions.some(d => d.name === member)
  const isMeasure = cube.measures.some(m => m.name === member)
  if (isDimension || isMeasure) return

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
