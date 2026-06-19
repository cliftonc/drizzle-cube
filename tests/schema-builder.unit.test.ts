import { describe, it, expect } from 'vitest'
import {
  toCubeRef,
  buildMeasureRefs,
  buildDimensionRefs,
  buildTimeDimensionRefs,
  buildLogicalSchema,
  buildCTESchema
} from '../src/server/logical-plan/schema-builder'
import type { Cube, SemanticQuery } from '../src/server/types'

/**
 * These tests exercise schema derivation in complete isolation — no
 * LogicalPlanner, no QueryContext, no database. Cubes are minimal in-memory
 * fixtures; the derivers only need the cube to exist in the registry and the
 * member name to split on '.'.
 */
function createCube(name: string): Cube {
  return {
    name,
    sql: () => ({ from: {} as any }),
    dimensions: {
      id: { name: 'id', type: 'number', sql: {} as any, primaryKey: true }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: {} as any }
    }
  }
}

function createCubes(...names: string[]): Map<string, Cube> {
  return new Map(names.map(name => [name, createCube(name)]))
}

describe('schema-builder', () => {
  describe('toCubeRef', () => {
    it('wraps a cube into a CubeRef', () => {
      const cube = createCube('Employees')
      expect(toCubeRef(cube)).toEqual({ name: 'Employees', cube })
    })
  })

  describe('buildMeasureRefs', () => {
    it('derives measure refs with split name, localName and cube ref', () => {
      const cubes = createCubes('Employees')
      const query: SemanticQuery = { measures: ['Employees.count'] }

      const refs = buildMeasureRefs(query, cubes)

      expect(refs).toHaveLength(1)
      expect(refs[0]).toMatchObject({
        name: 'Employees.count',
        localName: 'count'
      })
      expect(refs[0].cube).toEqual({ name: 'Employees', cube: cubes.get('Employees') })
    })

    it('returns [] when query has no measures', () => {
      expect(buildMeasureRefs({}, createCubes('Employees'))).toEqual([])
    })

    it('throws when the referenced cube is missing', () => {
      const query: SemanticQuery = { measures: ['Unknown.count'] }
      expect(() => buildMeasureRefs(query, createCubes('Employees'))).toThrow(/Unknown/)
    })
  })

  describe('buildDimensionRefs', () => {
    it('derives dimension refs', () => {
      const cubes = createCubes('Employees')
      const query: SemanticQuery = { dimensions: ['Employees.id'] }

      const refs = buildDimensionRefs(query, cubes)

      expect(refs).toHaveLength(1)
      expect(refs[0]).toMatchObject({ name: 'Employees.id', localName: 'id' })
      expect(refs[0].cube.name).toBe('Employees')
    })

    it('returns [] when query has no dimensions', () => {
      expect(buildDimensionRefs({}, createCubes('Employees'))).toEqual([])
    })

    it('throws when the referenced cube is missing', () => {
      const query: SemanticQuery = { dimensions: ['Unknown.id'] }
      expect(() => buildDimensionRefs(query, createCubes('Employees'))).toThrow(/Unknown/)
    })
  })

  describe('buildTimeDimensionRefs', () => {
    it('carries granularity, dateRange, fillMissingDates and compareDateRange through', () => {
      const cubes = createCubes('Employees')
      const query: SemanticQuery = {
        timeDimensions: [
          {
            dimension: 'Employees.createdAt',
            granularity: 'month',
            dateRange: ['2024-01-01', '2024-12-31'],
            fillMissingDates: true,
            compareDateRange: [['2023-01-01', '2023-12-31']]
          }
        ]
      }

      const refs = buildTimeDimensionRefs(query, cubes)

      expect(refs).toHaveLength(1)
      expect(refs[0]).toMatchObject({
        name: 'Employees.createdAt',
        localName: 'createdAt',
        granularity: 'month',
        dateRange: ['2024-01-01', '2024-12-31'],
        fillMissingDates: true,
        compareDateRange: [['2023-01-01', '2023-12-31']]
      })
      expect(refs[0].cube.name).toBe('Employees')
    })

    it('returns [] when query has no timeDimensions', () => {
      expect(buildTimeDimensionRefs({}, createCubes('Employees'))).toEqual([])
    })

    it('throws when the referenced cube is missing', () => {
      const query: SemanticQuery = {
        timeDimensions: [{ dimension: 'Unknown.createdAt', granularity: 'day' }]
      }
      expect(() => buildTimeDimensionRefs(query, createCubes('Employees'))).toThrow(/Unknown/)
    })
  })

  describe('buildLogicalSchema', () => {
    it('composes measures, dimensions and timeDimensions', () => {
      const cubes = createCubes('Employees', 'Departments')
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['Departments.id'],
        timeDimensions: [{ dimension: 'Employees.createdAt', granularity: 'day' }]
      }

      const schema = buildLogicalSchema(query, cubes)

      expect(schema.measures.map(m => m.name)).toEqual(['Employees.count'])
      expect(schema.dimensions.map(d => d.name)).toEqual(['Departments.id'])
      expect(schema.timeDimensions.map(t => t.name)).toEqual(['Employees.createdAt'])
    })

    it('returns empty arrays for an empty query', () => {
      expect(buildLogicalSchema({}, createCubes('Employees'))).toEqual({
        measures: [],
        dimensions: [],
        timeDimensions: []
      })
    })
  })

  describe('buildCTESchema', () => {
    it('derives a measures-only schema', () => {
      const cubes = createCubes('Employees')
      const cteInfo = { measures: ['Employees.count'] } as any

      const schema = buildCTESchema(cteInfo, cubes)

      expect(schema.dimensions).toEqual([])
      expect(schema.timeDimensions).toEqual([])
      expect(schema.measures).toHaveLength(1)
      expect(schema.measures[0]).toMatchObject({ name: 'Employees.count', localName: 'count' })
      expect(schema.measures[0].cube.name).toBe('Employees')
    })

    it('does NOT throw on a missing cube (preserved prior behavior)', () => {
      const cteInfo = { measures: ['Unknown.count'] } as any
      const schema = buildCTESchema(cteInfo, createCubes('Employees'))
      expect(schema.measures[0]).toMatchObject({ name: 'Unknown.count', localName: 'count' })
      expect(schema.measures[0].cube).toEqual({ name: 'Unknown', cube: undefined })
    })
  })
})
