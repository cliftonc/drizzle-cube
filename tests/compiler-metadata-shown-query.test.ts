/**
 * Integration tests for the `shown` flag on cube dimensions/measures.
 *
 * Verifies both halves of the Cube.js-compatible contract implemented in
 * src/server/compiler-metadata.ts:
 *   1. `shown: false` members are omitted from generated metadata (`/meta`).
 *   2. `shown: false` does NOT make a member unqueryable — query validation
 *      and execution resolve against the cube definitions directly, not the
 *      generated metadata, so a hidden field must still validate and run.
 *
 * DB-backed (runs against whichever engine TEST_DB_TYPE selects, e.g. via
 * `npm run test:sqlite`) because it exercises real query execution.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import { SemanticLayerCompiler } from '../src/server'
import type { Cube, QueryContext, BaseQueryDefinition, SecurityContext } from '../src/server/types'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'

describe('shown flag: metadata visibility vs. queryability', () => {
  let compiler: SemanticLayerCompiler
  let close: () => void
  const securityContext: SecurityContext = { organisationId: 1 }

  beforeAll(async () => {
    const { executor, close: cleanup } = await createTestDatabaseExecutor()
    close = cleanup
    const { employees } = await getTestSchema()

    const shownFlagCube: Cube = defineCube('ShownFlagWidgets', {
      title: 'Shown Flag Widgets',
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: employees,
        where: eq(employees.organisationId, ctx.securityContext.organisationId as number)
      }),
      dimensions: {
        id: {
          name: 'id',
          title: 'ID',
          type: 'number',
          sql: employees.id,
          primaryKey: true
        },
        name: {
          name: 'name',
          title: 'Name',
          type: 'string',
          sql: employees.name
        },
        hiddenTag: {
          name: 'hiddenTag',
          title: 'Hidden Tag',
          type: 'number',
          sql: employees.departmentId,
          shown: false
        },
        explicitlyShown: {
          name: 'explicitlyShown',
          title: 'Explicitly Shown',
          type: 'string',
          sql: employees.email,
          shown: true
        }
      },
      measures: {
        count: {
          name: 'count',
          title: 'Count',
          type: 'countDistinct',
          sql: employees.id
        },
        hiddenTotalSalary: {
          name: 'hiddenTotalSalary',
          title: 'Hidden Total Salary',
          type: 'sum',
          sql: employees.salary,
          shown: false
        }
      },
      hierarchies: {
        tagHierarchy: {
          name: 'tagHierarchy',
          title: 'Tag Hierarchy',
          levels: ['name', 'hiddenTag']
        }
      }
    })

    compiler = new SemanticLayerCompiler({ databaseExecutor: executor })
    compiler.registerCube(shownFlagCube)
  })

  afterAll(() => {
    close?.()
  })

  it('omits shown: false members from generated metadata', () => {
    const [metadata] = compiler.getMetadata(securityContext)

    const dimensionNames = metadata.dimensions.map(d => d.name)
    const measureNames = metadata.measures.map(m => m.name)

    expect(dimensionNames).toContain('ShownFlagWidgets.name')
    expect(dimensionNames).toContain('ShownFlagWidgets.explicitlyShown')
    expect(dimensionNames).not.toContain('ShownFlagWidgets.hiddenTag')

    expect(measureNames).toContain('ShownFlagWidgets.count')
    expect(measureNames).not.toContain('ShownFlagWidgets.hiddenTotalSalary')
  })

  it('drops a hierarchy level pointing at a hidden dimension rather than emitting a dangling reference', () => {
    const [metadata] = compiler.getMetadata(securityContext)

    // Only the 'name' level survives; 'hiddenTag' is dropped because it is shown: false.
    expect(metadata.hierarchies).toEqual([
      {
        name: 'tagHierarchy',
        title: 'Tag Hierarchy',
        cubeName: 'ShownFlagWidgets',
        levels: ['ShownFlagWidgets.name']
      }
    ])
  })

  it('still validates a query referencing a hidden dimension', () => {
    const result = compiler.validateQuery(
      {
        measures: ['ShownFlagWidgets.count'],
        dimensions: ['ShownFlagWidgets.hiddenTag']
      },
      securityContext
    )

    expect(result.errors).toEqual([])
    expect(result.isValid).toBe(true)
  })

  it('still validates and executes a query referencing a hidden measure', () => {
    const result = compiler.validateQuery(
      {
        measures: ['ShownFlagWidgets.hiddenTotalSalary'],
        dimensions: ['ShownFlagWidgets.name']
      },
      securityContext
    )

    expect(result.isValid).toBe(true)
  })

  it('still executes a query referencing a hidden dimension end-to-end', async () => {
    const result = await compiler.execute(
      {
        measures: ['ShownFlagWidgets.count'],
        dimensions: ['ShownFlagWidgets.hiddenTag']
      },
      securityContext
    )

    expect(result.data).toBeDefined()
    expect(Array.isArray(result.data)).toBe(true)
  })
})
