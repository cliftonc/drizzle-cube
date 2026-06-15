/**
 * Shared helpers for the analysis query builders (funnel / flow / retention).
 *
 * These builders bypass the logical plan and assemble SQL directly, so they
 * historically duplicated a handful of small primitives. This module centralises
 * the duplication while keeping the generated SQL byte-identical.
 */

import { and, SQL } from 'drizzle-orm'
import { t } from '../../i18n/runtime'
import type { Cube, Filter, QueryContext } from '../types'
import { resolveSqlExpression } from '../cube-utils'

/**
 * Type for CTE objects created by db.$with()
 * These can be used with db.with(...ctes).select().from(cte)
 */
export type WithSubquery = ReturnType<ReturnType<any['$with']>['as']>

/**
 * Combine an array of WHERE/JOIN conditions into a single SQL expression.
 *
 * - `[]`            → undefined (no condition)
 * - single element  → that element verbatim
 * - multiple        → `and(...conditions)`
 *
 * Mirrors the inline `conditions.length === 1 ? conditions[0] : and(...conditions) as SQL`
 * pattern that was duplicated across the analysis builders.
 */
export function combineWhere(conditions: SQL[]): SQL | undefined {
  if (conditions.length === 0) return undefined
  if (conditions.length === 1) return conditions[0]
  return and(...conditions) as SQL
}

/** The combinator + children of a client-style group filter. */
export interface GroupFilterParts {
  /** True for an AND group, false for OR. */
  isAnd: boolean
  filters: Filter[]
}

/**
 * Normalise a client-style group filter.
 *
 * The analysis UIs sometimes emit groups as `{ type: 'and' | 'or', filters: [...] }`
 * rather than the canonical `{ and: [...] }` / `{ or: [...] }` (this shape is not part
 * of the `Filter` type; the builders accept it defensively). Returns the group's
 * combinator + children, or `null` if `filter` isn't a client group filter.
 */
export function asGroupFilter(filter: Filter): GroupFilterParts | null {
  if ('type' in filter && 'filters' in filter) {
    const group = filter as unknown as { type?: unknown; filters?: Filter[] }
    if (group.type === 'and' || group.type === 'or') {
      return { isAnd: group.type === 'and', filters: group.filters ?? [] }
    }
  }
  return null
}

/**
 * A single multi-cube field mapping (binding key or time dimension), e.g.
 * `{ cube: 'Events', dimension: 'Events.userId' }`.
 */
type FieldMapping = { cube: string; dimension: string }

/**
 * The i18n namespaces whose binding-key / time-dimension leaf keys are identical.
 * Funnel and flow share the exact same leaf keys under these two prefixes, which
 * is what lets the resolution logic below be shared. (Retention uses a different
 * leaf-key set — see `bindingKeyErrorsForPrefix` vs the bespoke config it passes.)
 */
type AnalysisErrorPrefix = 'server.errors.funnel' | 'server.errors.flow'

/**
 * Extract the dimension name from a `'Cube.dim'` or bare `'dim'` reference.
 * (`'Cube.dim'` → `'dim'`, `'dim'` → `'dim'`.) Funnel/flow only ever pass the
 * qualified form, so this is a strict superset of their old `.split('.')[1]`.
 */
export function extractDimensionName(dimension: string): string {
  const parts = dimension.split('.')
  return parts.length > 1 ? parts[1] : parts[0]
}

/**
 * Builders of the i18n error strings thrown while resolving a binding key.
 * Each builder receives the resolved context so callers can preserve their exact
 * existing message keys/params (funnel/flow and retention use different leaf keys).
 */
export interface BindingKeyErrors {
  /** Array form: no mapping in the array matched the current cube. */
  noMapping: (ctx: { cubeName: string }) => string
  /** The cube named in the key/mapping was not found in the `cubes` registry. */
  cubeNotFound?: (ctx: { cubeName: string }) => string
  /** String form: the binding-key dimension was not found on the resolved cube. */
  keyDimNotFound: (ctx: { bindingKey: string; cubeName: string; dimName: string }) => string
  /** Array form: the mapped dimension was not found on the resolved cube. */
  mappingDimNotFound: (ctx: { dimension: string; cubeName: string; dimName: string }) => string
}

/**
 * Build the binding-key error messages for funnel/flow from their shared i18n
 * namespace (the leaf keys are identical across the two prefixes).
 */
export function bindingKeyErrorsForPrefix(errorPrefix: AnalysisErrorPrefix): BindingKeyErrors {
  return {
    noMapping: ({ cubeName }) => t(`${errorPrefix}.noBindingKeyMapping`, { cubeName }),
    keyDimNotFound: ({ bindingKey }) => t(`${errorPrefix}.bindingKeyDimNotFound`, { bindingKey }),
    mappingDimNotFound: ({ dimension }) => t(`${errorPrefix}.bindingKeyMappingDimNotFound`, { dimension })
  }
}

/**
 * Resolve the cube a binding-key dimension lives on.
 *
 * - Without a `cubes` registry (funnel/flow): the dimension is resolved on the
 *   passed `cube` and the key's cube part is ignored.
 * - With a `cubes` registry (retention's multi-cube model): the dimension is
 *   resolved on the cube *named in the key/mapping*, looked up in the registry.
 */
function resolveBindingKeyCube(
  cube: Cube,
  namedCube: string,
  cubes: Map<string, Cube> | undefined,
  errors: BindingKeyErrors
): Cube {
  if (!cubes) return cube
  const target = cubes.get(namedCube)
  if (!target) {
    throw new Error(errors.cubeNotFound!({ cubeName: namedCube }))
  }
  return target
}

/**
 * Resolve a binding-key SQL expression for the analysis builders.
 *
 * Accepts a `'Cube.dim'` string or an array of `{ cube, dimension }` mappings.
 * `errors` supplies the i18n messages (funnel/flow share one leaf-key set via
 * `bindingKeyErrorsForPrefix`; retention passes its own). When `cubes` is given,
 * the dimension is resolved on the cube named in the key (retention's multi-cube
 * semantics); otherwise it is resolved on `cube` (funnel/flow).
 */
export function resolveBindingKeyExpr(
  bindingKey: string | FieldMapping[],
  cube: Cube,
  context: QueryContext,
  errors: BindingKeyErrors,
  cubes?: Map<string, Cube>
): SQL {
  if (typeof bindingKey === 'string') {
    const [namedCube] = bindingKey.split('.')
    const dimName = extractDimensionName(bindingKey)
    const targetCube = resolveBindingKeyCube(cube, namedCube, cubes, errors)
    const dimension = targetCube.dimensions?.[dimName]
    if (!dimension) {
      throw new Error(errors.keyDimNotFound({ bindingKey, cubeName: namedCube, dimName }))
    }
    return resolveSqlExpression(dimension.sql, context) as SQL
  }

  // Multi-cube binding key - find the mapping for this cube
  const mapping = bindingKey.find(m => m.cube === cube.name)
  if (!mapping) {
    throw new Error(errors.noMapping({ cubeName: cube.name }))
  }
  const dimName = extractDimensionName(mapping.dimension)
  const targetCube = resolveBindingKeyCube(cube, mapping.cube, cubes, errors)
  const dimension = targetCube.dimensions?.[dimName]
  if (!dimension) {
    throw new Error(errors.mappingDimNotFound({ dimension: mapping.dimension, cubeName: mapping.cube, dimName }))
  }
  return resolveSqlExpression(dimension.sql, context) as SQL
}

/**
 * Resolve a time-dimension SQL expression for funnel/flow builders.
 *
 * Accepts a `'Cube.dim'` string or an array of `{ cube, dimension }` mappings.
 * `errorPrefix` selects the i18n namespace (the leaf keys are identical across
 * funnel and flow): `<prefix>.timeDimNotFound`, `<prefix>.noTimeDimMapping`,
 * `<prefix>.timeDimMappingNotFound`.
 */
export function resolveTimeDimensionExpr(
  timeDimension: string | FieldMapping[],
  cube: Cube,
  context: QueryContext,
  errorPrefix: AnalysisErrorPrefix
): SQL {
  if (typeof timeDimension === 'string') {
    const [, dimName] = timeDimension.split('.')
    const dimension = cube.dimensions?.[dimName]
    if (!dimension) {
      throw new Error(t(`${errorPrefix}.timeDimNotFound`, { timeDimension }))
    }
    return resolveSqlExpression(dimension.sql, context) as SQL
  }

  // Multi-cube time dimension - find the mapping for this cube
  const mapping = timeDimension.find(m => m.cube === cube.name)
  if (!mapping) {
    throw new Error(t(`${errorPrefix}.noTimeDimMapping`, { cubeName: cube.name }))
  }
  const [, dimName] = mapping.dimension.split('.')
  const dimension = cube.dimensions?.[dimName]
  if (!dimension) {
    throw new Error(t(`${errorPrefix}.timeDimMappingNotFound`, { dimension: mapping.dimension }))
  }
  return resolveSqlExpression(dimension.sql, context) as SQL
}
