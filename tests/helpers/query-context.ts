/**
 * Cast helpers for hand-built `QueryContext` fixtures.
 *
 * `QueryContext.cast` / `.tryCast` are required rather than optional so a cube
 * author can call them without `!` or `?.` — which the project's type rules
 * would otherwise force. Unit tests that construct a context by hand get them
 * from a real engine adapter here, so fixtures behave like production.
 */

import { createDatabaseAdapter } from '../../src/server/database-utils'
import { getTestDatabaseType } from './test-database'
import type { QueryContext } from '../../src/server/types'

type CastHelpers = Pick<QueryContext, 'cast' | 'tryCast'>
type EngineType = Parameters<typeof createDatabaseAdapter>[0]

/** `TestDatabaseType` includes `'both'`, which is a run mode rather than an engine. */
function resolveTestEngine(): EngineType {
  const testType = getTestDatabaseType()
  return testType === 'both' ? 'postgres' : testType
}

/** `cast` / `tryCast` bound to an engine adapter (defaults to the test engine). */
export function testCastHelpers(engineType?: EngineType): CastHelpers {
  const adapter = createDatabaseAdapter(engineType ?? resolveTestEngine())
  return {
    cast: (fieldExpr, targetType) => adapter.castToType(fieldExpr, targetType),
    tryCast: (fieldExpr, targetType) => adapter.tryCastToType(fieldExpr, targetType)
  }
}
