/**
 * Database Error Handling Test Suite
 * Tests that actual database errors are properly surfaced to users
 * and that type: 'number' measures with raw SQL aggregations work correctly
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { sql, eq } from 'drizzle-orm'
import {
  createTestDatabaseExecutor,
  getTestSchema
} from './helpers/test-database'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { QueryExecutor } from '../src/server/executor'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, QueryContext, BaseQueryDefinition, SecurityContext } from '../src/server/types'

describe('Database Error Handling', () => {
  let executor: QueryExecutor
  let cubes: Map<string, Cube>
  let securityContext: SecurityContext
  let tables: any
  let close: () => void

  beforeAll(async () => {
    const testData = await getTestSchema()
    tables = {
      employees: testData.employees,
      departments: testData.departments,
      productivity: testData.productivity
    }

    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = new Map()
    securityContext = testSecurityContexts.org1
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  describe('Error message extraction', () => {
    it('should surface actual database error messages for invalid column references', async () => {
      // Create a cube that references a non-existent column
      const badColumnCube = defineCube('BadColumnCube', {
        sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
          from: tables.employees,
          where: eq(tables.employees.organisationId, ctx.securityContext.organisationId)
        }),
        dimensions: {},
        measures: {
          badColumn: {
            name: 'badColumn',
            title: 'Bad Column',
            type: 'number',
            sql: sql`COUNT(${sql.identifier('nonexistent_column_xyz')})`
          }
        }
      })

      cubes.set('BadColumnCube', badColumnCube)

      const query = {
        measures: ['BadColumnCube.badColumn']
      }

      try {
        await executor.execute(cubes, query, securityContext)
        expect.fail('Expected query to throw an error')
      } catch (error: any) {
        // The error should contain "Query execution failed"
        expect(error.message).toContain('Query execution failed')

        // The error should contain meaningful information about what went wrong
        // For PostgreSQL, this includes the column name or error about it not existing
        console.log('Captured error for bad column:', error.message)

        // The error should NOT just be a generic "Failed query" message
        // It should contain either a PostgreSQL error code or a meaningful description
        const hasDetails =
          error.message.includes('column') ||
          error.message.includes('42') || // PostgreSQL error codes start with 42 for syntax/schema errors
          error.message.includes('nonexistent') ||
          error.message.includes('does not exist')

        expect(hasDetails).toBe(true)
      }
    })
  })

  describe('type: number measures with time dimensions', () => {
    it('should add GROUP BY for type: number measures when time dimension has granularity', async () => {
      // Create a cube similar to the user's DiscoveryFlow cube
      // Using type: 'number' with a raw SQL aggregate
      const numberTypeCube = defineCube('NumberTypeCube', {
        sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
          from: tables.employees,
          where: eq(tables.employees.organisationId, ctx.securityContext.organisationId)
        }),
        dimensions: {
          createdAt: {
            name: 'createdAt',
            title: 'Created At',
            type: 'time',
            sql: tables.employees.createdAt
          }
        },
        measures: {
          // This is the pattern that was failing - type: 'number' with raw SQL COUNT
          count: {
            name: 'count',
            title: 'Employee Count',
            type: 'number', // User uses 'number' for output type
            sql: sql`COUNT(DISTINCT ${tables.employees.id})`
          }
        }
      })

      cubes.set('NumberTypeCube', numberTypeCube)

      // This query should now work (after the fix) because GROUP BY should be added
      const query = {
        measures: ['NumberTypeCube.count'],
        timeDimensions: [{
          dimension: 'NumberTypeCube.createdAt',
          granularity: 'week'
        }]
      }

      // Execute the query - it should succeed (not throw GROUP BY error)
      const result = await executor.execute(cubes, query, securityContext)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)

      // Verify results have the expected structure
      if (result.data.length > 0) {
        expect(result.data[0]).toHaveProperty('NumberTypeCube.count')
        expect(result.data[0]).toHaveProperty('NumberTypeCube.createdAt')
      }
    })

    it('should work with multiple type: number measures using raw SQL aggregations', async () => {
      // Create a cube with multiple number-type measures
      const multiMeasureCube = defineCube('MultiMeasureCube', {
        sql: (ctx: QueryContext<any>): BaseQueryDefinition => ({
          from: tables.employees,
          where: eq(tables.employees.organisationId, ctx.securityContext.organisationId)
        }),
        dimensions: {
          createdAt: {
            name: 'createdAt',
            title: 'Created At',
            type: 'time',
            sql: tables.employees.createdAt
          }
        },
        measures: {
          totalCount: {
            name: 'totalCount',
            title: 'Total Count',
            type: 'number',
            sql: sql`COUNT(${tables.employees.id})`
          },
          distinctCount: {
            name: 'distinctCount',
            title: 'Distinct Count',
            type: 'number',
            sql: sql`COUNT(DISTINCT ${tables.employees.id})`
          },
          avgSalary: {
            name: 'avgSalary',
            title: 'Average Salary',
            type: 'number',
            sql: sql`AVG(${tables.employees.salary})`
          }
        }
      })

      cubes.set('MultiMeasureCube', multiMeasureCube)

      const query = {
        measures: ['MultiMeasureCube.totalCount', 'MultiMeasureCube.distinctCount', 'MultiMeasureCube.avgSalary'],
        timeDimensions: [{
          dimension: 'MultiMeasureCube.createdAt',
          granularity: 'month'
        }]
      }

      // Execute - should succeed with GROUP BY
      const result = await executor.execute(cubes, query, securityContext)

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })
  })
})
