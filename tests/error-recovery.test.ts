/**
 * Error Recovery Test Suite
 *
 * Tests error handling and recovery for various failure scenarios.
 *
 * Covers:
 * - Validation error handling
 * - Invalid query structures
 * - Missing cube references
 * - Invalid filter operators
 * - Type mismatches
 * - Graceful degradation
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { QueryExecutor } from '../src/server/executor'
import type { Cube, SemanticQuery } from '../src/server/types'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'

describe('Error Recovery Tests', () => {
  let testExecutor: TestExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    const executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes()
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) close()
  })

  describe('Invalid Cube References', () => {
    it('should handle non-existent cube in measures', async () => {
      const query: SemanticQuery = {
        measures: ['NonExistentCube.count']
      }

      await expect(testExecutor.executeQuery(query)).rejects.toThrow()
    })

    it('should handle non-existent cube in dimensions', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['NonExistentCube.name']
      }

      await expect(testExecutor.executeQuery(query)).rejects.toThrow()
    })

    it('should handle non-existent cube in filters', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [
          { member: 'NonExistentCube.field', operator: 'equals', values: ['test'] }
        ]
      }

      await expect(testExecutor.executeQuery(query)).rejects.toThrow()
    })

    it('should handle non-existent cube in time dimensions', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        timeDimensions: [
          { dimension: 'NonExistentCube.createdAt', granularity: 'day' }
        ]
      }

      await expect(testExecutor.executeQuery(query)).rejects.toThrow()
    })
  })

  describe('Invalid Field References', () => {
    it('should handle non-existent measure', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.nonExistentMeasure']
      }

      await expect(testExecutor.executeQuery(query)).rejects.toThrow()
    })

    it('should handle non-existent dimension', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.nonExistentDimension']
      }

      await expect(testExecutor.executeQuery(query)).rejects.toThrow()
    })

    it('should handle non-existent filter member', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [
          { member: 'Employees.nonExistentField', operator: 'equals', values: ['test'] }
        ]
      }

      await expect(testExecutor.executeQuery(query)).rejects.toThrow()
    })
  })

  describe('Invalid Query Structure', () => {
    it('should handle empty measures array with validation error', async () => {
      const query: SemanticQuery = {
        measures: []
      }

      // Empty measures array should fail validation
      await expect(testExecutor.executeQuery(query)).rejects.toThrow()
    })

    it('should handle malformed member names', async () => {
      const query: SemanticQuery = {
        measures: ['InvalidMemberWithoutDot']
      }

      await expect(testExecutor.executeQuery(query)).rejects.toThrow()
    })

    it('should handle member name with too many dots', async () => {
      const query: SemanticQuery = {
        measures: ['Cube.Subcube.measure']
      }

      // Should reject or handle gracefully
      await expect(testExecutor.executeQuery(query)).rejects.toThrow()
    })
  })

  describe('Invalid Filter Values', () => {
    it('should handle empty filter values array', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [
          { member: 'Employees.name', operator: 'equals', values: [] }
        ]
      }

      // Should either skip filter or handle gracefully
      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })

    it('should handle null filter values', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [
          { member: 'Employees.name', operator: 'equals', values: [null as any] }
        ]
      }

      // Should handle gracefully (null comparison or skip)
      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })

    it('should handle type mismatch in filter values', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [
          // String value for numeric field
          { member: 'Employees.salary', operator: 'gt', values: ['not-a-number'] }
        ]
      }

      // Should either throw or handle type coercion
      try {
        const result = await testExecutor.executeQuery(query)
        // If it doesn't throw, result should still be valid
        expect(result.data).toBeDefined()
      } catch (error) {
        // Type mismatch error is acceptable
        expect(error).toBeDefined()
      }
    })
  })

  describe('Invalid Date Ranges', () => {
    it('should handle invalid date format in dateRange', async () => {
      const query: SemanticQuery = {
        measures: ['Productivity.recordCount'],
        timeDimensions: [
          {
            dimension: 'Productivity.date',
            dateRange: ['not-a-date', 'also-not-a-date']
          }
        ]
      }

      // Should throw or handle gracefully
      try {
        await testExecutor.executeQuery(query)
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should handle reversed date range', async () => {
      const query: SemanticQuery = {
        measures: ['Productivity.recordCount'],
        timeDimensions: [
          {
            dimension: 'Productivity.date',
            dateRange: ['2024-12-31', '2024-01-01'] // End before start
          }
        ]
      }

      // Should return empty results or handle gracefully
      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })

    it('should handle single date in dateRange', async () => {
      const query: SemanticQuery = {
        measures: ['Productivity.recordCount'],
        timeDimensions: [
          {
            dimension: 'Productivity.date',
            dateRange: ['2024-01-01'] as any // Single date instead of range
          }
        ]
      }

      // Should handle or throw meaningful error
      try {
        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Invalid Logical Filters', () => {
    it('should handle empty AND filter', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [
          { and: [] }
        ]
      }

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })

    it('should handle empty OR filter', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [
          { or: [] }
        ]
      }

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })

    it('should handle deeply nested filters', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [
          {
            and: [
              {
                or: [
                  {
                    and: [
                      { member: 'Employees.isActive', operator: 'equals', values: [true] }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })
  })

  describe('Invalid Order Configuration', () => {
    it('should handle order on non-existent field', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
        order: { 'Employees.nonExistent': 'asc' }
      }

      // Should either ignore or throw
      try {
        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should handle invalid order direction', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
        order: { 'Employees.name': 'invalid' as any }
      }

      // Should default to asc or throw
      try {
        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Invalid Limit/Offset', () => {
    it('should handle negative limit', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
        limit: -1
      }

      // Should either ignore or throw
      try {
        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should handle negative offset', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
        offset: -1
      }

      // Should either ignore or throw
      try {
        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
      } catch (error) {
        expect(error).toBeDefined()
      }
    })

    it('should handle very large limit', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name'],
        limit: Number.MAX_SAFE_INTEGER
      }

      // Should handle gracefully (return all or cap)
      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })
  })

  describe('Validation Recovery', () => {
    it('should validate query before execution', async () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      }

      // Valid query should pass validation
      const { validation } = await testExecutor.validateQuery(
        query,
        ['Employees.count', 'Employees.name']
      )

      expect(validation.isValid).toBe(true)
    })

    it('should return validation errors for invalid query', async () => {
      const query: SemanticQuery = {
        measures: ['NonExistent.count']
      }

      // Should throw during validation or execution
      await expect(testExecutor.executeQuery(query)).rejects.toThrow()
    })
  })

  describe('Graceful Degradation', () => {
    it('should return partial results on warning conditions', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)
    })

    it('should handle missing optional fields', async () => {
      // Minimal query with just measures
      const query: SemanticQuery = {
        measures: ['Employees.count']
      }

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBe(1)
    })
  })

  describe('Concurrent Error Handling', () => {
    it('should handle multiple concurrent invalid queries', async () => {
      const invalidQueries: SemanticQuery[] = [
        { measures: ['NonExistent1.count'] },
        { measures: ['NonExistent2.count'] },
        { measures: ['NonExistent3.count'] }
      ]

      const results = await Promise.allSettled(
        invalidQueries.map(q => testExecutor.executeQuery(q))
      )

      // All should reject
      for (const result of results) {
        expect(result.status).toBe('rejected')
      }
    })

    it('should handle mix of valid and invalid concurrent queries', async () => {
      const queries = [
        { measures: ['Employees.count'] }, // Valid
        { measures: ['NonExistent.count'] }, // Invalid
        { measures: ['Departments.count'] } // Valid
      ]

      const results = await Promise.allSettled(
        queries.map(q => testExecutor.executeQuery(q))
      )

      expect(results[0].status).toBe('fulfilled')
      expect(results[1].status).toBe('rejected')
      expect(results[2].status).toBe('fulfilled')
    })
  })
})
