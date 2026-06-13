/**
 * Query Validator
 *
 * Standalone query validation against registered cubes. Extracted from
 * compiler.ts so that both the compiler and the executor can validate
 * queries without importing each other (breaks the compiler ↔ executor
 * circular dependency).
 */

import type { SemanticQuery, Cube } from './types'
import { resolveCubeReference } from './cube-utils'
import { getActiveQueryModes } from './query-modes'
import { t } from '../i18n/runtime'

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

  const specialValidators: Record<Exclude<ValidationMode, 'regular' | 'comparison'>, () => void> = {
    funnel: () => {
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
    },
    flow: () => {
      // Basic flow validation here - full validation happens in executor
      // Just ensure the cube referenced by bindingKey exists
      const bindingKey = query.flow!.bindingKey
      if (typeof bindingKey === 'string') {
        const [cubeName] = bindingKey.split('.')
        if (cubeName && !cubes.has(cubeName)) {
          errors.push(t('server.validation.query.flowBindingKeyCubeNotFound', { cubeName }))
        }
      }
    },
    retention: () => {
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
  }

  if (activeModes.length === 1 && activeModes[0] !== 'comparison') {
    const mode = activeModes[0]
    specialValidators[mode as keyof typeof specialValidators]()
    return { isValid: errors.length === 0, errors }
  }

  // Track all referenced cubes
  const referencedCubes = new Set<string>()

  // Validate measures
  if (query.measures) {
    for (const measure of query.measures) {
      const [cubeName, fieldName] = measure.split('.')
      
      if (!cubeName || !fieldName) {
        errors.push(t('server.validation.query.invalidMeasureFormat', { measure }))
        continue
      }

      referencedCubes.add(cubeName)

      // Check if cube exists
      const cube = cubes.get(cubeName)
      if (!cube) {
        errors.push(t('server.validation.query.cubeNotFoundForMeasure', { cubeName, measure }))
        continue
      }

      // Check if measure exists on cube
      if (!cube.measures[fieldName]) {
        const hint = fieldName === cubeName
          ? `. Did you mean one of: ${Object.keys(cube.measures).slice(0, 5).map(m => `'${cubeName}.${m}'`).join(', ')}?`
          : ''
        errors.push(t('server.validation.query.measureNotFound', { fieldName, cubeName, hint }))
      }
    }
  }

  // Validate dimensions
  if (query.dimensions) {
    for (const dimension of query.dimensions) {
      const [cubeName, fieldName] = dimension.split('.')
      
      if (!cubeName || !fieldName) {
        errors.push(t('server.validation.query.invalidDimensionFormat', { dimension }))
        continue
      }

      referencedCubes.add(cubeName)

      // Check if cube exists
      const cube = cubes.get(cubeName)
      if (!cube) {
        errors.push(t('server.validation.query.cubeNotFoundForDimension', { cubeName, dimension }))
        continue
      }

      // Check if dimension exists on cube
      if (!cube.dimensions[fieldName]) {
        const hint = fieldName === cubeName
          ? `. Did you mean one of: ${Object.keys(cube.dimensions).slice(0, 5).map(d => `'${cubeName}.${d}'`).join(', ')}?`
          : ''
        errors.push(t('server.validation.query.dimensionNotFound', { fieldName, cubeName, hint }))
      }
    }
  }

  // Validate timeDimensions
  if (query.timeDimensions) {
    for (const timeDimension of query.timeDimensions) {
      const [cubeName, fieldName] = timeDimension.dimension.split('.')
      
      if (!cubeName || !fieldName) {
        errors.push(t('server.validation.query.invalidTimeDimensionFormat', { dimension: timeDimension.dimension }))
        continue
      }

      referencedCubes.add(cubeName)

      // Check if cube exists
      const cube = cubes.get(cubeName)
      if (!cube) {
        errors.push(t('server.validation.query.cubeNotFoundForTimeDimension', { cubeName, dimension: timeDimension.dimension }))
        continue
      }

      // Check if dimension exists on cube (timeDimensions reference dimensions)
      if (!cube.dimensions[fieldName]) {
        errors.push(t('server.validation.query.timeDimensionNotFound', { fieldName, cubeName }))
      }
    }
  }

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

  // Validate ungrouped query constraints
  if (query.ungrouped) {
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

    // Validate measure types — only raw-column-compatible types allowed
    const allowedUngroupedTypes = new Set(['sum', 'avg', 'min', 'max', 'number'])
    const incompatibleTypes = new Set([
      'count', 'countDistinct', 'countDistinctApprox',
      'calculated',
      'stddev', 'stddevSamp', 'variance', 'varianceSamp',
      'median', 'p95', 'p99', 'percentile',
      'lag', 'lead', 'rank', 'denseRank', 'rowNumber',
      'ntile', 'firstValue', 'lastValue', 'movingAvg', 'movingSum'
    ])

    if (query.measures) {
      for (const measureName of query.measures) {
        const [cubeName, fieldName] = measureName.split('.')
        const cube = cubes.get(cubeName)
        if (cube && cube.measures[fieldName]) {
          const measure = cube.measures[fieldName]

          if (incompatibleTypes.has(measure.type)) {
            errors.push(
              `Measure '${measureName}' has type '${measure.type}' which is incompatible with ungrouped queries. ` +
              `Only ${[...allowedUngroupedTypes].join(', ')} types are allowed.`
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
    }

    // Reject hasMany joins between referenced cubes
    for (const cubeName of referencedCubes) {
      const cube = cubes.get(cubeName)
      if (cube && cube.joins) {
        for (const [joinName, joinDef] of Object.entries(cube.joins)) {
          if (joinDef.relationship === 'hasMany') {
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
    }
  }

  return {
    isValid: errors.length === 0,
    errors
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
