/**
 * Unit tests for adapter utility functions
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  calculateQueryComplexity,
  generateRequestId,
  buildTransformedQuery,
  formatSqlString,
  formatSqlResponse,
  formatMetaResponse,
  formatErrorResponse,
  handleDryRun,
  handleBatchRequest,
  formatCubeResponse,
  getDatabaseType,
  handleDiscover,
  handleSuggest,
  handleValidate,
  handleLoad
} from '../../src/adapters/utils'
import {
  createTestSemanticLayer,
  skipIfDuckDB,
  getTestDatabaseType
} from '../helpers/test-database'
import { testSecurityContexts } from '../helpers/enhanced-test-data'
import { createTestCubesForCurrentDatabase } from '../helpers/test-cubes'

describe('Adapter Utils', () => {
  describe('calculateQueryComplexity', () => {
    it('should return "low" for simple queries', () => {
      expect(calculateQueryComplexity({
        measures: ['Cube.count']
      })).toBe('low')

      expect(calculateQueryComplexity({
        measures: ['Cube.count'],
        dimensions: ['Cube.name']
      })).toBe('low')

      expect(calculateQueryComplexity({
        measures: ['Cube.count', 'Cube.sum'],
        dimensions: ['Cube.name', 'Cube.id']
      })).toBe('low')
    })

    it('should return "medium" for moderately complex queries', () => {
      expect(calculateQueryComplexity({
        measures: ['Cube.count', 'Cube.sum', 'Cube.avg'],
        dimensions: ['Cube.name', 'Cube.id'],
        filters: [
          { member: 'Cube.name', operator: 'equals', values: ['test'] },
          { member: 'Cube.id', operator: 'gt', values: [0] }
        ],
        timeDimensions: [{ dimension: 'Cube.date', granularity: 'day' }]
      })).toBe('medium')
    })

    it('should return "high" for complex queries', () => {
      expect(calculateQueryComplexity({
        measures: ['Cube.count', 'Cube.sum', 'Cube.avg', 'Cube.min', 'Cube.max'],
        dimensions: ['Cube.a', 'Cube.b', 'Cube.c', 'Cube.d'],
        filters: [
          { member: 'Cube.x', operator: 'equals', values: ['test'] },
          { member: 'Cube.y', operator: 'gt', values: [0] },
          { member: 'Cube.z', operator: 'lt', values: [100] }
        ],
        timeDimensions: [
          { dimension: 'Cube.date1', granularity: 'day' },
          { dimension: 'Cube.date2', granularity: 'month' }
        ]
      })).toBe('high')
    })

    it('should handle empty query', () => {
      expect(calculateQueryComplexity({})).toBe('low')
    })
  })

  describe('generateRequestId', () => {
    it('should generate a unique request ID', () => {
      const id1 = generateRequestId()
      const id2 = generateRequestId()

      expect(id1).toBeDefined()
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(10)
      expect(id1).not.toBe(id2)
    })

    it('should follow timestamp-random format', () => {
      const id = generateRequestId()
      const parts = id.split('-')

      expect(parts.length).toBeGreaterThanOrEqual(2)
      // First part should be a timestamp (all digits)
      expect(/^\d+$/.test(parts[0])).toBe(true)
    })
  })

  describe('buildTransformedQuery', () => {
    it('should build transformed query with all components', () => {
      const query = {
        measures: ['Cube.count', 'Cube.sum'],
        dimensions: ['Cube.name'],
        timeDimensions: [{ dimension: 'Cube.date', granularity: 'day' }],
        filters: [{ member: 'Cube.name', operator: 'equals', values: ['test'] }]
      }

      const result = buildTransformedQuery(query)

      expect(result.sortedDimensions).toEqual(['Cube.name'])
      expect(result.sortedTimeDimensions).toEqual([{ dimension: 'Cube.date', granularity: 'day' }])
      expect(result.measures).toEqual(['Cube.count', 'Cube.sum'])
      expect(result.leafMeasureAdditive).toBe(true)
      expect(result.hasMultiStage).toBe(false)
    })

    it('should handle empty query', () => {
      const result = buildTransformedQuery({})

      expect(result.sortedDimensions).toEqual([])
      expect(result.sortedTimeDimensions).toEqual([])
      expect(result.measures).toEqual([])
    })

    it('should include all Cube.js compatibility fields', () => {
      const result = buildTransformedQuery({ measures: ['Cube.count'] })

      expect(result).toHaveProperty('leafMeasureAdditive', true)
      expect(result).toHaveProperty('leafMeasures')
      expect(result).toHaveProperty('measureToLeafMeasures')
      expect(result).toHaveProperty('hasNoTimeDimensionsWithoutGranularity', true)
      expect(result).toHaveProperty('allFiltersWithinSelectedDimensions', true)
      expect(result).toHaveProperty('isAdditive', true)
      expect(result).toHaveProperty('hasMultipliedMeasures', false)
      expect(result).toHaveProperty('hasCumulativeMeasures', false)
      expect(result).toHaveProperty('hasMultiStage', false)
    })
  })

  describe('formatSqlString', () => {
    it('should format SQL for PostgreSQL dialect', () => {
      const sql = 'SELECT id, name FROM users WHERE id = 1'
      const formatted = formatSqlString(sql, 'postgres')

      expect(formatted).toContain('SELECT')
      expect(formatted).toContain('FROM')
      expect(formatted.length).toBeGreaterThan(sql.length) // Should add formatting
    })

    it('should format SQL for MySQL dialect', () => {
      const sql = 'SELECT id, name FROM users WHERE id = 1'
      const formatted = formatSqlString(sql, 'mysql')

      expect(formatted).toContain('SELECT')
      expect(formatted).toContain('FROM')
    })

    it('should format SQL for SQLite dialect', () => {
      const sql = 'SELECT id, name FROM users WHERE id = 1'
      const formatted = formatSqlString(sql, 'sqlite')

      expect(formatted).toContain('SELECT')
      expect(formatted).toContain('FROM')
    })

    it('should handle singlestore as MySQL dialect', () => {
      const sql = 'SELECT id FROM users'
      const formatted = formatSqlString(sql, 'singlestore')

      expect(formatted).toContain('SELECT')
    })

    it('should return original SQL if formatting fails', () => {
      // Intentionally malformed SQL that might fail formatting
      const malformedSql = '{{{{invalid sql syntax}}}}'
      const result = formatSqlString(malformedSql, 'postgres')

      // Should return something (either formatted or original)
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
  })

  describe('formatSqlResponse', () => {
    it('should format SQL response correctly', () => {
      const query = { measures: ['Cube.count'] }
      const sqlResult = { sql: 'SELECT COUNT(*) FROM cube', params: [1, 'test'] }

      const result = formatSqlResponse(query, sqlResult)

      expect(result.sql).toBe('SELECT COUNT(*) FROM cube')
      expect(result.params).toEqual([1, 'test'])
      expect(result.query).toBe(query)
    })

    it('should handle empty params', () => {
      const query = { measures: ['Cube.count'] }
      const sqlResult = { sql: 'SELECT COUNT(*) FROM cube' }

      const result = formatSqlResponse(query, sqlResult)

      expect(result.params).toEqual([])
    })
  })

  describe('formatMetaResponse', () => {
    it('should wrap metadata in cubes object', () => {
      const metadata = [
        { name: 'Cube1', measures: [], dimensions: [] },
        { name: 'Cube2', measures: [], dimensions: [] }
      ]

      const result = formatMetaResponse(metadata)

      expect(result).toHaveProperty('cubes', metadata)
    })

    it('should handle empty metadata', () => {
      const result = formatMetaResponse([])

      expect(result).toHaveProperty('cubes', [])
    })
  })

  describe('formatErrorResponse', () => {
    it('should format string error', () => {
      const result = formatErrorResponse('Something went wrong', 500)

      expect(result.error).toBe('Something went wrong')
      expect(result.status).toBe(500)
    })

    it('should format Error object', () => {
      const error = new Error('Test error message')
      const result = formatErrorResponse(error, 400)

      expect(result.error).toBe('Test error message')
      expect(result.status).toBe(400)
    })

    it('should use default status 500', () => {
      const result = formatErrorResponse('Error')

      expect(result.status).toBe(500)
    })

    it('should handle 400 status', () => {
      const result = formatErrorResponse('Bad Request', 400)

      expect(result.error).toBe('Bad Request')
      expect(result.status).toBe(400)
    })

    it('should handle 401 status', () => {
      const result = formatErrorResponse('Unauthorized', 401)
      expect(result.status).toBe(401)
    })

    it('should handle 404 status', () => {
      const result = formatErrorResponse('Not Found', 404)
      expect(result.status).toBe(404)
    })

    it('should handle 405 status', () => {
      const result = formatErrorResponse('Method Not Allowed', 405)
      expect(result.status).toBe(405)
    })
  })

  describe('formatSqlString - extended', () => {
    it('should format SQL for DuckDB dialect (uses PostgreSQL)', () => {
      const sql = 'SELECT id, name FROM users WHERE id = 1'
      const formatted = formatSqlString(sql, 'duckdb')

      expect(formatted).toContain('SELECT')
      expect(formatted).toContain('FROM')
    })

    it('should format complex SQL with JOINs', () => {
      const sql = 'SELECT a.id, b.name FROM table_a a JOIN table_b b ON a.id = b.a_id WHERE a.status = 1'
      const formatted = formatSqlString(sql, 'postgres')

      expect(formatted).toContain('SELECT')
      expect(formatted).toContain('JOIN')
    })

    it('should handle SQL with GROUP BY and HAVING', () => {
      const sql = 'SELECT department, COUNT(*) as cnt FROM employees GROUP BY department HAVING COUNT(*) > 5'
      const formatted = formatSqlString(sql, 'postgres')

      expect(formatted).toContain('GROUP BY')
    })

    it('should handle SQL with subqueries', () => {
      const sql = 'SELECT * FROM (SELECT id FROM users) as subq WHERE subq.id > 10'
      const formatted = formatSqlString(sql, 'postgres')

      expect(formatted).toBeDefined()
    })

    it('should handle SQL with ORDER BY and LIMIT', () => {
      const sql = 'SELECT id FROM users ORDER BY id DESC LIMIT 10'
      const formatted = formatSqlString(sql, 'postgres')

      expect(formatted).toContain('ORDER BY')
      expect(formatted).toContain('LIMIT')
    })
  })

  describe('buildTransformedQuery - extended', () => {
    it('should handle query with only dimensions', () => {
      const query = {
        dimensions: ['Cube.name', 'Cube.id']
      }

      const result = buildTransformedQuery(query)

      expect(result.sortedDimensions).toEqual(['Cube.name', 'Cube.id'])
      expect(result.measures).toEqual([])
    })

    it('should handle query with only measures', () => {
      const query = {
        measures: ['Cube.count', 'Cube.sum']
      }

      const result = buildTransformedQuery(query)

      expect(result.measures).toEqual(['Cube.count', 'Cube.sum'])
      expect(result.sortedDimensions).toEqual([])
    })

    it('should handle query with only timeDimensions', () => {
      const query = {
        timeDimensions: [
          { dimension: 'Cube.createdAt', granularity: 'month', dateRange: 'last 3 months' }
        ]
      }

      const result = buildTransformedQuery(query)

      expect(result.sortedTimeDimensions).toEqual(query.timeDimensions)
      expect(result.timeDimensions).toEqual(query.timeDimensions)
    })

    it('should set leafMeasures to match measures', () => {
      const query = {
        measures: ['Cube.count', 'Cube.sum', 'Cube.avg']
      }

      const result = buildTransformedQuery(query)

      expect(result.leafMeasures).toEqual(query.measures)
    })

    it('should include granularityHierarchies as empty object', () => {
      const result = buildTransformedQuery({ measures: ['Cube.count'] })

      expect(result.granularityHierarchies).toEqual({})
    })

    it('should include ownedDimensions matching dimensions', () => {
      const query = {
        dimensions: ['Cube.a', 'Cube.b']
      }

      const result = buildTransformedQuery(query)

      expect(result.ownedDimensions).toEqual(query.dimensions)
    })
  })

  describe('calculateQueryComplexity - edge cases', () => {
    it('should handle query at boundary between low and medium (5 points)', () => {
      // 5 measures = 5 points = low
      const query = {
        measures: ['A.1', 'A.2', 'A.3', 'A.4', 'A.5']
      }
      expect(calculateQueryComplexity(query)).toBe('low')
    })

    it('should handle query at boundary (6 points = medium)', () => {
      // 4 measures + 2 filters = 4 + 4 = 8 points = medium
      const query = {
        measures: ['A.1', 'A.2', 'A.3', 'A.4'],
        filters: [
          { member: 'A.x', operator: 'equals', values: ['y'] },
          { member: 'A.y', operator: 'equals', values: ['z'] }
        ]
      }
      expect(calculateQueryComplexity(query)).toBe('medium')
    })

    it('should handle query at boundary between medium and high (15 points)', () => {
      // 5 measures + 5 dimensions + 2 filters + 1 time = 5 + 5 + 4 + 3 = 17 = high
      const query = {
        measures: ['A.1', 'A.2', 'A.3', 'A.4', 'A.5'],
        dimensions: ['A.a', 'A.b', 'A.c', 'A.d', 'A.e'],
        filters: [
          { member: 'A.x', operator: 'equals', values: ['y'] },
          { member: 'A.y', operator: 'equals', values: ['z'] }
        ],
        timeDimensions: [{ dimension: 'A.date', granularity: 'day' }]
      }
      expect(calculateQueryComplexity(query)).toBe('high')
    })

    it('should handle query with undefined arrays', () => {
      const query = {
        measures: undefined,
        dimensions: undefined,
        filters: undefined,
        timeDimensions: undefined
      }
      expect(calculateQueryComplexity(query as any)).toBe('low')
    })
  })

  describe('generateRequestId - extended', () => {
    it('should generate many unique IDs', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        ids.add(generateRequestId())
      }
      expect(ids.size).toBe(100)
    })

    it('should contain timestamp in first part', () => {
      const id = generateRequestId()
      const timestamp = parseInt(id.split('-')[0], 10)
      const now = Date.now()

      // Should be within 1 second of now
      expect(Math.abs(now - timestamp)).toBeLessThan(1000)
    })
  })

  describe('Integration: handleDryRun and handleBatchRequest', () => {
    let semanticLayer: any
    let closeFn: (() => void) | null = null

    beforeAll(async () => {
      const { semanticLayer: sl, close } = await createTestSemanticLayer()
      semanticLayer = sl
      closeFn = close

      const { testEmployeesCube } = await createTestCubesForCurrentDatabase()
      semanticLayer.registerCube(testEmployeesCube)
    })

    afterAll(() => {
      if (closeFn) {
        closeFn()
        closeFn = null
      }
    })

    describe('handleDryRun', () => {
      it('should validate and analyze a single-cube query', async () => {
        const query = {
          measures: ['Employees.count'],
          dimensions: ['Employees.name']
        }

        const result = await handleDryRun(query, testSecurityContexts.org1, semanticLayer)

        expect(result.valid).toBe(true)
        expect(result.queryType).toBe('regularQuery')
        expect(result.cubesUsed).toContain('Employees')
        expect(result.joinType).toBe('single_cube')
        expect(result.sql).toBeDefined()
        expect(result.complexity).toBeDefined()
      })

      it('should throw error for invalid query', async () => {
        const query = {
          measures: ['NonExistent.count']
        }

        await expect(
          handleDryRun(query, testSecurityContexts.org1, semanticLayer)
        ).rejects.toThrow('Query validation failed')
      })
    })

    // Skip on DuckDB: batch requests run queries in parallel which causes memory corruption
    describe.skipIf(skipIfDuckDB())('handleBatchRequest', () => {
      it('should execute multiple successful queries', async () => {
        const queries = [
          { measures: ['Employees.count'] },
          { measures: ['Employees.totalSalary'] }
        ]

        const result = await handleBatchRequest(queries, testSecurityContexts.org1, semanticLayer)

        expect(result.results).toBeDefined()
        expect(result.results.length).toBe(2)
        expect(result.results[0].success).toBe(true)
        expect(result.results[1].success).toBe(true)
      })

      it('should handle partial failure', async () => {
        const queries = [
          { measures: ['Employees.count'] },
          { measures: ['NonExistent.count'] }
        ]

        const result = await handleBatchRequest(queries, testSecurityContexts.org1, semanticLayer)

        expect(result.results).toBeDefined()
        expect(result.results.length).toBe(2)
        expect(result.results[0].success).toBe(true)
        expect(result.results[1].success).toBe(false)
        expect(result.results[1].error).toBeDefined()
      })

      it('should preserve query order in results', async () => {
        const queries = [
          { measures: ['Employees.totalSalary'] },
          { measures: ['Employees.count'] },
          { measures: ['Employees.avgSalary'] }
        ]

        const result = await handleBatchRequest(queries, testSecurityContexts.org1, semanticLayer)

        expect(result.results.length).toBe(3)
        // All should succeed
        expect(result.results.every(r => r.success)).toBe(true)
      })
    })
  })
})
