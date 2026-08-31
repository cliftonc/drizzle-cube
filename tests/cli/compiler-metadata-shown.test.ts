/**
 * DB-free unit tests for the `shown` flag in cube metadata generation.
 *
 * Lives in the `cli` vitest project (see vitest.config.ts): no Docker, no
 * globalSetup, no database. `buildMeasureMetadata`, `buildDimensionMetadata`
 * and `buildHierarchyMetadata` are pure functions over a `Cube` definition —
 * they never open a connection or build SQL — so they belong here rather
 * than in the DB-backed `server` project.
 */
import { describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { defineCube } from '../../src/server/cube-utils'
import {
  buildDimensionMetadata,
  buildMeasureMetadata,
  buildHierarchyMetadata
} from '../../src/server/compiler-metadata'
import type { Cube, QueryContext, BaseQueryDefinition } from '../../src/server/types'
import { employees } from '../helpers/databases/sqlite/schema'

function makeCube(overrides: Partial<Omit<Cube, 'name'>>): Cube {
  return defineCube('Widgets', {
    title: 'Widgets',
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId as number)
    }),
    dimensions: {},
    measures: {},
    ...overrides
  })
}

describe('compiler-metadata: shown flag (DB-free)', () => {
  describe('buildDimensionMetadata', () => {
    it('omits dimensions with shown: false', () => {
      const cube = makeCube({
        dimensions: {
          visible: { name: 'visible', type: 'string', sql: employees.name, shown: true },
          implicit: { name: 'implicit', type: 'string', sql: employees.email },
          hidden: { name: 'hidden', type: 'number', sql: employees.departmentId, shown: false }
        }
      })

      const dimensions = buildDimensionMetadata(cube)
      const names = dimensions.map(d => d.name)

      expect(names).toContain('Widgets.visible')
      expect(names).toContain('Widgets.implicit')
      expect(names).not.toContain('Widgets.hidden')
      expect(dimensions).toHaveLength(2)
    })
  })

  describe('buildMeasureMetadata', () => {
    it('omits measures with shown: false', () => {
      const cube = makeCube({
        measures: {
          visible: { name: 'visible', type: 'count', sql: employees.id, shown: true },
          implicit: { name: 'implicit', type: 'sum', sql: employees.salary },
          hidden: { name: 'hidden', type: 'avg', sql: employees.salary, shown: false }
        }
      })

      const measures = buildMeasureMetadata(cube)
      const names = measures.map(m => m.name)

      expect(names).toContain('Widgets.visible')
      expect(names).toContain('Widgets.implicit')
      expect(names).not.toContain('Widgets.hidden')
      expect(measures).toHaveLength(2)
    })
  })

  describe('buildHierarchyMetadata', () => {
    it('drops hidden levels but keeps a hierarchy with remaining visible levels', () => {
      const cube = makeCube({
        dimensions: {
          country: { name: 'country', type: 'string', sql: employees.name },
          region: { name: 'region', type: 'string', sql: employees.email, shown: false },
          city: { name: 'city', type: 'string', sql: employees.email }
        },
        hierarchies: {
          geo: { name: 'geo', title: 'Geography', levels: ['country', 'region', 'city'] }
        }
      })

      const hierarchies = buildHierarchyMetadata(cube)

      expect(hierarchies).toHaveLength(1)
      expect(hierarchies[0].levels).toEqual(['Widgets.country', 'Widgets.city'])
    })

    it('drops a self-qualified level (e.g. "Widgets.region") referencing a hidden dimension', () => {
      const cube = makeCube({
        dimensions: {
          country: { name: 'country', type: 'string', sql: employees.name },
          region: { name: 'region', type: 'string', sql: employees.email, shown: false }
        },
        hierarchies: {
          geo: { name: 'geo', title: 'Geography', levels: ['country', 'Widgets.region'] }
        }
      })

      const hierarchies = buildHierarchyMetadata(cube)

      expect(hierarchies).toHaveLength(1)
      expect(hierarchies[0].levels).toEqual(['Widgets.country'])
    })

    it('omits a hierarchy entirely when every level is hidden', () => {
      const cube = makeCube({
        dimensions: {
          country: { name: 'country', type: 'string', sql: employees.name, shown: false },
          region: { name: 'region', type: 'string', sql: employees.email, shown: false }
        },
        hierarchies: {
          geo: { name: 'geo', title: 'Geography', levels: ['country', 'region'] }
        }
      })

      const hierarchies = buildHierarchyMetadata(cube)

      expect(hierarchies).toHaveLength(0)
    })

    it('keeps all levels when shown is undefined for every dimension (unchanged behaviour)', () => {
      const cube = makeCube({
        dimensions: {
          country: { name: 'country', type: 'string', sql: employees.name },
          city: { name: 'city', type: 'string', sql: employees.email }
        },
        hierarchies: {
          geo: { name: 'geo', title: 'Geography', levels: ['country', 'city'] }
        }
      })

      const hierarchies = buildHierarchyMetadata(cube)

      expect(hierarchies).toHaveLength(1)
      expect(hierarchies[0].levels).toEqual(['Widgets.country', 'Widgets.city'])
    })
  })
})
