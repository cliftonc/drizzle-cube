/**
 * Query Validator
 *
 * Standalone query validation against registered cubes. Extracted from
 * compiler.ts so that both the compiler and the executor can validate
 * queries without importing each other (breaks the compiler ↔ executor
 * circular dependency).
 */

import type { SemanticQuery, Cube } from './types/index.js'
import { resolveCubeReference } from './cube-utils.js'
import { getActiveQueryModes } from './query-modes.js'
import { t } from '../i18n/runtime.js'

type ValidationMode = 'regular' | 'comparison' | 'funnel' | 'flow' | 'retention'

function getActiveValidationModes(query: SemanticQuery): Exclude<ValidationMode, 'regular'>[] {
  return getActiveQueryModes(query)
}

/**
 * Validate a query against a cubes map
 * Standalone function that can be used by both compiler and executor
 */
export function validateQueryAgainstCubes(
  cubes: Map<string, Cube>,
  query: SemanticQuery
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const activeModes = getActiveValidationModes(query)
  if (activeModes.length > 1) {
    errors.push(t('server.validation.query.multipleQueryModes', { modes: activeModes.join(', ') }))
    return { isValid: false, errors }
  }

  if (activeModes.length === 1 && activeModes[0] !== 'comparison') {
    validateSpecialMode(activeModes[0], query, cubes, errors)
    return { isValid: errors.length === 0, errors }
  }

  // Track all referenced cubes
  const referencedCubes = new Set<string>()

  validateMeasures(query, cubes, errors, referencedCubes)
  validateDimensions(query, cubes, errors, referencedCubes)
  validateTimeDimensions(query, cubes, errors, referencedCubes)

  // Validate filters
  if (query.filters) {
    for (const filter of query.filters) {
      validateFilter(filter, cubes, errors, referencedCubes)
    }
  }

  // Ensure at least one cube is referenced
  if (referencedCubes.size === 0) {
    errors.push(t('server.validation.query.mustReferenceAtLeastOneCube'))
  }

  if (query.ungrouped) {
    validateUngroupedConstraints(query, cubes, errors, referencedCubes)
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/** Dispatch to the basic per-mode validator for funnel/flow/retention queries. */
function validateSpecialMode(
  mode: Exclude<ValidationMode, 'regular'>,
  query: SemanticQuery,
  cubes: Map<string, Cube>,
  errors: string[]
): void {
  if (mode === 'comparison') return
  if (mode === 'funnel') validateFunnelMode(query, cubes, errors)
  else if (mode === 'flow') validateFlowMode(query, cubes, errors)
  else if (mode === 'retention') validateRetentionMode(query, cubes, errors)
}

function validateFunnelMode(query: SemanticQuery, cubes: Map<string, Cube>, errors: string[]): void {
  // Basic funnel validation here - full validation happens in executor
  // Just ensure the cube referenced by bindingKey exists
  const bindingKey = query.funnel!.bindingKey
  if (typeof bindingKey === 'string') {
    const [cubeName] = bindingKey.split('.')
    if (cubeName && !cubes.has(cubeName)) {
      errors.push(t('server.validation.query.funnelBindingKeyCubeNotFound', { cubeName }))
    }
  } else if (Array.isArray(bindingKey)) {
    for (const mapping of bindingKey) {
      if (!cubes.has(mapping.cube)) {
        errors.push(t('server.validation.query.funnelBindingKeyCubeNotFound', { cubeName: mapping.cube }))
      }
    }
  }
}

function validateFlowMode(query: SemanticQuery, cubes: Map<string, Cube>, errors: string[]): void {
  // Basic flow validation here - full validation happens in executor
  // Just ensure the cube referenced by bindingKey exists
  const bindingKey = query.flow!.bindingKey
  if (typeof bindingKey === 'string') {
    const [cubeName] = bindingKey.split('.')
    if (cubeName && !cubes.has(cubeName)) {
      errors.push(t('server.validation.query.flowBindingKeyCubeNotFound', { cubeName }))
    }
  }
}

function validateRetentionMode(query: SemanticQuery, cubes: Map<string, Cube>, errors: string[]): void {
  const retention = query.retention!

  // Validate cube from time dimension exists
  const cubeName = extractCubeFromRetentionTimeDimension(retention.timeDimension)
  if (cubeName && !cubes.has(cubeName)) {
    errors.push(t('server.validation.query.retentionCubeNotFound', { cubeName }))
  }

  // Validate binding key cube(s) exist
  const bindingKey = retention.bindingKey
  if (typeof bindingKey === 'string') {
    const [bkCubeName] = bindingKey.split('.')
    if (bkCubeName && !cubes.has(bkCubeName)) {
      errors.push(t('server.validation.query.retentionBindingKeyCubeNotFound', { cubeName: bkCubeName }))
    }
  } else if (Array.isArray(bindingKey)) {
    for (const mapping of bindingKey) {
      if (!cubes.has(mapping.cube)) {
        errors.push(t('server.validation.query.retentionBindingKeyCubeNotFound', { cubeName: mapping.cube }))
      }
    }
  }

  // Validate breakdown dimension cubes exist
  if (retention.breakdownDimensions && Array.isArray(retention.breakdownDimensions)) {
    for (const dim of retention.breakdownDimensions) {
      const [bdCubeName] = dim.split('.')
      if (bdCubeName && !cubes.has(bdCubeName)) {
        errors.push(t('server.validation.query.retentionBreakdownCubeNotFound', { cubeName: bdCubeName }))
      }
    }
  }
}

/** Suggestion hint shown when a member's field name equals its cube name. */
function suggestionHint(fieldName: string, cubeName: string, candidates: string[]): string {
  if (fieldName !== cubeName) return ''
  const list = candidates.slice(0, 5).map(m => `'${cubeName}.${m}'`).join(', ')
  return `. Did you mean one of: ${list}?`
}

function validateMeasures(
  query: SemanticQuery,
  cubes: Map<string, Cube>,
  errors: string[],
  referencedCubes: Set<string>
): void {
  if (!query.measures) return

  for (const measure of query.measures) {
    const [cubeName, fieldName] = measure.split('.')

    if (!cubeName || !fieldName) {
      errors.push(t('server.validation.query.invalidMeasureFormat', { measure }))
      continue
    }

    referencedCubes.add(cubeName)

    const cube = cubes.get(cubeName)
    if (!cube) {
      errors.push(t('server.validation.query.cubeNotFoundForMeasure', { cubeName, measure }))
      continue
    }

    if (!cube.measures[fieldName]) {
      const hint = suggestionHint(fieldName, cubeName, Object.keys(cube.measures))
      errors.push(t('server.validation.query.measureNotFound', { fieldName, cubeName, hint }))
    }
  }
}

function validateDimensions(
  query: SemanticQuery,
  cubes: Map<string, Cube>,
  errors: string[],
  referencedCubes: Set<string>
): void {
  if (!query.dimensions) return

  for (const dimension of query.dimensions) {
    const [cubeName, fieldName] = dimension.split('.')

    if (!cubeName || !fieldName) {
      errors.push(t('server.validation.query.invalidDimensionFormat', { dimension }))
      continue
    }

    referencedCubes.add(cubeName)

    const cube = cubes.get(cubeName)
    if (!cube) {
      errors.push(t('server.validation.query.cubeNotFoundForDimension', { cubeName, dimension }))
      continue
    }

    if (!cube.dimensions[fieldName]) {
      const hint = suggestionHint(fieldName, cubeName, Object.keys(cube.dimensions))
      errors.push(t('server.validation.query.dimensionNotFound', { fieldName, cubeName, hint }))
    }
  }
}

function validateTimeDimensions(
  query: SemanticQuery,
  cubes: Map<string, Cube>,
  errors: string[],
  referencedCubes: Set<string>
): void {
  if (!query.timeDimensions) return

  for (const timeDimension of query.timeDimensions) {
    const [cubeName, fieldName] = timeDimension.dimension.split('.')

    if (!cubeName || !fieldName) {
      errors.push(t('server.validation.query.invalidTimeDimensionFormat', { dimension: timeDimension.dimension }))
      continue
    }

    referencedCubes.add(cubeName)

    const cube = cubes.get(cubeName)
    if (!cube) {
      errors.push(t('server.validation.query.cubeNotFoundForTimeDimension', { cubeName, dimension: timeDimension.dimension }))
      continue
    }

    // timeDimensions reference dimensions
    if (!cube.dimensions[fieldName]) {
      errors.push(t('server.validation.query.timeDimensionNotFound', { fieldName, cubeName }))
    }
  }
}

/** Measure types that cannot be expressed as raw columns in an ungrouped query. */
const UNGROUPED_INCOMPATIBLE_MEASURE_TYPES = new Set([
  'count', 'countDistinct', 'countDistinctApprox',
  'calculated',
  'stddev', 'stddevSamp', 'variance', 'varianceSamp',
  'median', 'p95', 'p99', 'percentile',
  'lag', 'lead', 'rank', 'denseRank', 'rowNumber',
  'ntile', 'firstValue', 'lastValue', 'movingAvg', 'movingSum'
])
const UNGROUPED_ALLOWED_MEASURE_TYPES = ['sum', 'avg', 'min', 'max', 'number']

function validateUngroupedConstraints(
  query: SemanticQuery,
  cubes: Map<string, Cube>,
  errors: string[],
  referencedCubes: Set<string>
): void {
  const hasDimensions = (query.dimensions && query.dimensions.length > 0) ||
                        (query.timeDimensions && query.timeDimensions.length > 0)
  if (!hasDimensions) {
    errors.push(t('server.validation.query.ungroupedRequiresDimension'))
  }

  // Reject incompatible query modes
  if (query.funnel) {
    errors.push(t('server.validation.query.ungroupedIncompatibleFunnel'))
  }
  if (query.flow) {
    errors.push(t('server.validation.query.ungroupedIncompatibleFlow'))
  }
  if (query.retention) {
    errors.push(t('server.validation.query.ungroupedIncompatibleRetention'))
  }

  // Reject compareDateRange
  if (query.timeDimensions?.some(td => td.compareDateRange && td.compareDateRange.length > 0)) {
    errors.push(t('server.validation.query.ungroupedIncompatibleCompareDateRange'))
  }

  // Reject fillMissingDates
  if (query.timeDimensions?.some(td => td.fillMissingDates === true)) {
    errors.push(t('server.validation.query.ungroupedIncompatibleFillMissingDates'))
  }

  validateUngroupedMeasures(query, cubes, errors)
  validateUngroupedHasManyJoins(cubes, errors, referencedCubes)
}

/** Validate measure types/filters are compatible with ungrouped queries. */
function validateUngroupedMeasures(
  query: SemanticQuery,
  cubes: Map<string, Cube>,
  errors: string[]
): void {
  if (!query.measures) return

  for (const measureName of query.measures) {
    const [cubeName, fieldName] = measureName.split('.')
    const cube = cubes.get(cubeName)
    const measure = cube?.measures[fieldName]
    if (!measure) continue

    if (UNGROUPED_INCOMPATIBLE_MEASURE_TYPES.has(measure.type)) {
      errors.push(
        `Measure '${measureName}' has type '${measure.type}' which is incompatible with ungrouped queries. ` +
        `Only ${UNGROUPED_ALLOWED_MEASURE_TYPES.join(', ')} types are allowed.`
      )
    }

    // Reject measures with filters (require CASE WHEN + aggregate)
    if (measure.filters && measure.filters.length > 0) {
      errors.push(
        `Measure '${measureName}' has filters which are incompatible with ungrouped queries ` +
        `(measure filters require aggregation)`
      )
    }
  }
}

/** Reject hasMany joins between cubes both referenced by an ungrouped query. */
function validateUngroupedHasManyJoins(
  cubes: Map<string, Cube>,
  errors: string[],
  referencedCubes: Set<string>
): void {
  for (const cubeName of referencedCubes) {
    const cube = cubes.get(cubeName)
    if (!cube?.joins) continue

    for (const [joinName, joinDef] of Object.entries(cube.joins)) {
      if (joinDef.relationship !== 'hasMany') continue

      // Check if the target cube is also referenced in this query
      const targetCube = resolveCubeReference(joinDef.targetCube, cubes)
      if (targetCube && referencedCubes.has(targetCube.name)) {
        errors.push(
          `Ungrouped queries are incompatible with hasMany relationships ` +
          `(${cubeName} → ${joinName} is hasMany)`
        )
      }
    }
  }
}

/**
 * Validate a single filter (recursive for logical filters)
 */
function validateFilter(
  filter: any,
  cubes: Map<string, Cube>,
  errors: string[],
  referencedCubes: Set<string>
): void {
  // Handle logical filters (AND/OR)
  if ('and' in filter || 'or' in filter) {
    const logicalFilters = filter.and || filter.or || []
    for (const subFilter of logicalFilters) {
      validateFilter(subFilter, cubes, errors, referencedCubes)
    }
    return
  }

  // Handle simple filter condition
  if (!('member' in filter)) {
    errors.push(t('server.validation.query.filterMustHaveMember'))
    return
  }

  const [cubeName, fieldName] = filter.member.split('.')
  
  if (!cubeName || !fieldName) {
    errors.push(t('server.validation.query.invalidFilterMemberFormat', { member: filter.member }))
    return
  }

  referencedCubes.add(cubeName)

  // Check if cube exists
  const cube = cubes.get(cubeName)
  if (!cube) {
    errors.push(t('server.validation.query.cubeNotFoundForFilter', { cubeName, member: filter.member }))
    return
  }

  // Check if field exists on cube (can be dimension or measure)
  if (!cube.dimensions[fieldName] && !cube.measures[fieldName]) {
    const hint = fieldName === cubeName
      ? `. Did you mean one of: ${[...Object.keys(cube.dimensions), ...Object.keys(cube.measures)].slice(0, 5).map(f => `'${cubeName}.${f}'`).join(', ')}?`
      : ''
    errors.push(t('server.validation.query.filterFieldNotFound', { fieldName, cubeName, hint }))
  }
}

/**
 * Extract cube name from retention time dimension (string or object format)
 */
function extractCubeFromRetentionTimeDimension(
  timeDim: string | { cube: string; dimension: string }
): string | null {
  if (typeof timeDim === 'string') {
    const [cubeName] = timeDim.split('.')
    return cubeName || null
  }
  return timeDim.cube
}
