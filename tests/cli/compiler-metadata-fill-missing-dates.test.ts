/**
 * DB-free unit tests for a time dimension's `fillMissingDates` in cube
 * metadata (issue #1368). Charts read it to decide whether to fill gaps.
 */
import { describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { defineCube } from '../../src/server/cube-utils'
import { buildDimensionMetadata } from '../../src/server/compiler-metadata'
import type { QueryContext, BaseQueryDefinition } from '../../src/server/types'
import { employees } from '../helpers/databases/sqlite/schema'

describe('compiler-metadata: fillMissingDates (DB-free)', () => {
  it('exposes a time dimension\'s fillMissingDates only when declared', () => {
    const cube = defineCube('Snapshots', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: employees,
        where: eq(employees.organisationId, ctx.securityContext.organisationId as number)
      }),
      dimensions: {
        snapshotDate: { name: 'snapshotDate', type: 'time', sql: employees.createdAt, fillMissingDates: false },
        createdAt: { name: 'createdAt', type: 'time', sql: employees.createdAt }
      },
      measures: {}
    })

    const byName = new Map(buildDimensionMetadata(cube).map(d => [d.name, d]))

    expect(byName.get('Snapshots.snapshotDate')?.fillMissingDates).toBe(false)
    expect(byName.get('Snapshots.createdAt')).not.toHaveProperty('fillMissingDates')
  })
})
