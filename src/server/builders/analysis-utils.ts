/**
 * Shared helpers for the analysis query builders (funnel / flow / retention).
 *
 * These builders bypass the logical plan and assemble SQL directly, so they
 * historically duplicated a handful of small primitives. This module centralises
 * the duplication while keeping the generated SQL byte-identical.
 */

import { and, SQL } from 'drizzle-orm'
import { t } from '../../i18n/runtime'
import type { Cube, QueryContext } from '../types'
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

/**
 * A single multi-cube field mapping (binding key or time dimension), e.g.
 * `{ cube: 'Events', dimension: 'Events.userId' }`.
 */
type FieldMapping = { cube: string; dimension: string }

/**
 * The i18n namespaces whose binding-key / time-dimension leaf keys are identical.
 * Funnel and flow share the exact same leaf keys under these two prefixes, which
 * is what lets the resolution logic below be shared. (Retention uses a different
 * leaf-key set and is intentionally not routed through here — see its builder.)
 */
type AnalysisErrorPrefix = 'server.errors.funnel' | 'server.errors.flow'

/**
 * Resolve a binding-key SQL expression for funnel/flow builders.
 *
 * Accepts a `'Cube.dim'` string or an array of `{ cube, dimension }` mappings.
 * `errorPrefix` selects the i18n namespace (the leaf keys are identical across
 * funnel and flow): `<prefix>.bindingKeyDimNotFound`, `<prefix>.noBindingKeyMapping`,
 * `<prefix>.bindingKeyMappingDimNotFound`.
 */
export function resolveBindingKeyExpr(
  bindingKey: string | FieldMapping[],
  cube: Cube,
  context: QueryContext,
  errorPrefix: AnalysisErrorPrefix
): SQL {
  if (typeof bindingKey === 'string') {
    const [, dimName] = bindingKey.split('.')
    const dimension = cube.dimensions?.[dimName]
    if (!dimension) {
      throw new Error(t(`${errorPrefix}.bindingKeyDimNotFound`, { bindingKey }))
    }
    return resolveSqlExpression(dimension.sql, context) as SQL
  }

  // Multi-cube binding key - find the mapping for this cube
  const mapping = bindingKey.find(m => m.cube === cube.name)
  if (!mapping) {
    throw new Error(t(`${errorPrefix}.noBindingKeyMapping`, { cubeName: cube.name }))
  }
  const [, dimName] = mapping.dimension.split('.')
  const dimension = cube.dimensions?.[dimName]
  if (!dimension) {
    throw new Error(t(`${errorPrefix}.bindingKeyMappingDimNotFound`, { dimension: mapping.dimension }))
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
