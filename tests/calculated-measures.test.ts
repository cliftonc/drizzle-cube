/**
 * Calculated Measures Comprehensive Test Suite
 *
 * Tests calculated measures functionality across all supported databases:
 * - Same-cube calculated measures
 * - Dependency resolution
 * - Circular dependency detection
 * - Template syntax validation
 * - Security context isolation
 * - Multi-database compatibility
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import { SemanticLayerCompiler } from '../src/server/compiler'
import { getTestSchema, createTestDatabaseExecutor } from './helpers/test-database'
import { QueryExecutor } from '../src/server/executor'
import { TestExecutor, TestQueryBuilder } from './helpers/test-utilities'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import type { SecurityContext, Cube } from '../src/server/types'

describe('Calculated Measures - Comprehensive Tests', () => {
  let testExecutor: TestExecutor
  let executor: QueryExecutor
  let cubes: Map<string, Cube>
  let securityContext: SecurityContext
  let schema: any
  let tables: any
  let close: () => void

  // Helper to register and use a cube
  const registerCube = (cube: Cube) => {
    // Register for validation
    const compiler = new SemanticLayerCompiler()
    compiler.registerCube(cube)

    // Add to cubes map for execution
    cubes.set(cube.name, cube)
    testExecutor = new TestExecutor(executor, cubes, securityContext)
  }

  beforeAll(async () => {
    const testData = await getTestSchema()
    schema = testData.schema
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

  describe('Basic Calculated Measures', () => {
    it('should handle simple ratio calculation', async () => {
      const tasksCube = defineCube('Tasks', {
        sql: (ctx) => ({
          from: tables.productivity,
          where: eq(tables.productivity.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          total: {
            name: 'total',
            type: 'count',
            sql: () => tables.productivity.id
          },
          highProductivity: {
            name: 'highProductivity',
            type: 'count',
            sql: () => tables.productivity.id,
            filters: [(ctx) => eq(tables.productivity.linesOfCode, 100)]
          },
          completionRatio: {
            name: 'completionRatio',
            type: 'calculated',
            calculatedSql: '{highProductivity} / NULLIF({total}, 0)'
          }
        },
        dimensions: {}
      })

      registerCube(tasksCube)

      const query = TestQueryBuilder.create()
        .measures(['Tasks.completionRatio', 'Tasks.total', 'Tasks.highProductivity'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data[0]).toHaveProperty('Tasks.completionRatio')
    })

    it('should handle calculated measure with multiple dependencies', async () => {
      const metricsCube = defineCube('Metrics', {
        sql: (ctx) => ({
          from: tables.productivity,
          where: eq(tables.productivity.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          linesOfCode: {
            name: 'linesOfCode',
            type: 'sum',
            sql: () => tables.productivity.linesOfCode
          },
          pullRequests: {
            name: 'pullRequests',
            type: 'sum',
            sql: () => tables.productivity.pullRequests
          },
          deployments: {
            name: 'deployments',
            type: 'sum',
            sql: () => tables.productivity.liveDeployments
          },
          productivityScore: {
            name: 'productivityScore',
            type: 'calculated',
            calculatedSql: '({linesOfCode} * 0.5 + {pullRequests} * 2 + {deployments} * 5) / 3'
          }
        },
        dimensions: {}
      })

      registerCube(metricsCube)

      const query = TestQueryBuilder.create()
        .measures(['Metrics.productivityScore'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data[0]).toHaveProperty('Metrics.productivityScore')
    })
  })

  describe('Dependency Resolution', () => {
    it('should resolve dependencies in correct order', async () => {
      const depCube = defineCube('Dependencies', {
        sql: (ctx) => ({
          from: tables.employees,
          where: eq(tables.employees.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          a: {
            name: 'a',
            type: 'count',
            sql: () => tables.employees.id
          },
          b: {
            name: 'b',
            type: 'calculated',
            calculatedSql: '{a} * 2'
          },
          c: {
            name: 'c',
            type: 'calculated',
            calculatedSql: '{b} + {a}'
          },
          d: {
            name: 'd',
            type: 'calculated',
            calculatedSql: '{c} * {b}'
          }
        },
        dimensions: {}
      })

      registerCube(depCube)

      // Query only the final calculated measure - should resolve all dependencies
      const queryResult = TestQueryBuilder.create().measures(['Dependencies.d']).build()
      const result = await testExecutor.executeQuery(queryResult)

      expect(result.data).toBeDefined()
      expect(result.data[0]).toHaveProperty('Dependencies.d')
    })

    it('should auto-populate dependencies array', async () => {
      const cube = defineCube('AutoDeps', {
        sql: (ctx) => ({
          from: tables.employees,
          where: eq(tables.employees.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          count: {
            name: 'count',
            type: 'count',
            sql: () => tables.employees.id
          },
          doubled: {
            name: 'doubled',
            type: 'calculated',
            calculatedSql: '{count} * 2'
            // dependencies should be auto-populated during registration
          }
        },
        dimensions: {}
      })

      registerCube(cube)

      const registeredCube = cubes.get('AutoDeps')
      expect(registeredCube).toBeDefined()
      expect(registeredCube!.measures.doubled.dependencies).toEqual(['count'])
    })
  })

  describe('Error Handling and Validation', () => {
    it('should detect circular dependencies', () => {
      expect(() => {
        const circularCube = defineCube('Circular', {
        sql: (ctx) => ({
            from: tables.employees,
            where: eq(tables.employees.organisationId, ctx.securityContext.organisationId)
          }),
          measures: {
            a: {
              name: 'a',
              type: 'calculated',
              calculatedSql: '{b} + 1'
            },
            b: {
              name: 'b',
              type: 'calculated',
              calculatedSql: '{a} + 1'
            }
          },
          dimensions: {}
        })

        registerCube(circularCube)
      }).toThrow(/circular dependency/i)
    })

    it('should reject calculated measure without calculatedSql', () => {
      expect(() => {
        const invalidCube = defineCube('Invalid', {
        sql: (ctx) => ({
            from: tables.employees,
            where: eq(tables.employees.organisationId, ctx.securityContext.organisationId)
          }),
          measures: {
            invalid: {
              name: 'invalid',
              type: 'calculated'
              // Missing calculatedSql
            } as any
          },
          dimensions: {}
        })

        registerCube(invalidCube)
      }).toThrow(/must have calculatedSql/i)
    })

    it('should validate template syntax', () => {
      expect(() => {
        const badSyntaxCube = defineCube('BadSyntax', {
        sql: (ctx) => ({
            from: tables.employees,
            where: eq(tables.employees.organisationId, ctx.securityContext.organisationId)
          }),
          measures: {
            badMeasure: {
              name: 'badMeasure',
              type: 'calculated',
              calculatedSql: '{unclosed'  // Invalid syntax - unclosed brace
            }
          },
          dimensions: {}
        })

        registerCube(badSyntaxCube)
      }).toThrow(/syntax/i)
    })

    it('should reject reference to non-existent measure', () => {
      expect(() => {
        const missingRefCube = defineCube('MissingRef', {
        sql: (ctx) => ({
            from: tables.employees,
            where: eq(tables.employees.organisationId, ctx.securityContext.organisationId)
          }),
          measures: {
            count: {
              name: 'count',
              type: 'count',
              sql: () => tables.employees.id
            },
            invalid: {
              name: 'invalid',
              type: 'calculated',
              calculatedSql: '{nonExistentMeasure} * 2'
            }
          },
          dimensions: {}
        })

        registerCube(missingRefCube)
      }).toThrow(/unknown measure/i)
    })

    it('should reject self-referencing calculated measure', () => {
      expect(() => {
        const selfRefCube = defineCube('SelfRef', {
        sql: (ctx) => ({
            from: tables.employees,
            where: eq(tables.employees.organisationId, ctx.securityContext.organisationId)
          }),
          measures: {
            recursive: {
              name: 'recursive',
              type: 'calculated',
              calculatedSql: '{recursive} + 1'
            }
          },
          dimensions: {}
        })

        registerCube(selfRefCube)
      }).toThrow(/cannot reference itself/i)
    })
  })


  describe('Complex Calculations', () => {
    it('should handle calculations with aggregations (AVG, SUM, MIN, MAX)', async () => {
      const aggCube = defineCube('Aggregations', {
        sql: (ctx) => ({
          from: tables.employees,
          where: eq(tables.employees.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          avgSalary: {
            name: 'avgSalary',
            type: 'avg',
            sql: () => tables.employees.salary
          },
          totalSalary: {
            name: 'totalSalary',
            type: 'sum',
            sql: () => tables.employees.salary
          },
          salaryRatio: {
            name: 'salaryRatio',
            type: 'calculated',
            calculatedSql: '{totalSalary} / {avgSalary}'
          }
        },
        dimensions: {}
      })

      registerCube(aggCube)

      const queryResult = TestQueryBuilder.create().measures(['Aggregations.salaryRatio']).build()
      const result = await testExecutor.executeQuery(queryResult)

      expect(result.data).toBeDefined()
      expect(result.data[0]).toHaveProperty('Aggregations.salaryRatio')
    })
  })

  describe('SQL Generation', () => {
    it('should generate valid SQL for calculated measures', async () => {
      const sqlCube = defineCube('SQL', {
        sql: (ctx) => ({
          from: tables.employees,
          where: eq(tables.employees.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          count: {
            name: 'count',
            type: 'count',
            sql: () => tables.employees.id
          },
          doubled: {
            name: 'doubled',
            type: 'calculated',
            calculatedSql: '{count} * 2'
          }
        },
        dimensions: {}
      })

      registerCube(sqlCube)

      const query = TestQueryBuilder.create()
        .measures(['SQL.doubled'])
        .build()

      const sqlResult = await executor.generateMultiCubeSQL(cubes, query, securityContext)

      expect(sqlResult.sql).toBeDefined()
      expect(typeof sqlResult.sql).toBe('string')
      expect(sqlResult.sql.length).toBeGreaterThan(0)
      // Should contain the calculated measure expression
      expect(sqlResult.sql.toLowerCase()).toContain('count')
    })
  })

  describe('Calculated Measures in Multi-Cube Queries with CTEs', () => {
    it('should correctly re-compute ratio/percentage measures from CTE base measures', async () => {
      // This test validates the fix for the activePercentage bug
      // When a calculated ratio measure is pre-aggregated in a CTE,
      // the outer query must re-compute it from base measures, not sum the pre-computed percentages

      const employeesCube = defineCube('Employees', {
        sql: (ctx) => ({
          from: tables.employees,
          where: eq(tables.employees.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          count: {
            name: 'count',
            type: 'count',
            sql: () => tables.employees.id
          },
          activeCount: {
            name: 'activeCount',
            type: 'count',
            sql: () => tables.employees.id,
            filters: [() => eq(tables.employees.active, true)]
          },
          activePercentage: {
            name: 'activePercentage',
            type: 'calculated',
            calculatedSql: '({activeCount} / NULLIF({count}, 0)) * 100'
          }
        },
        dimensions: {},
        joins: {}
      })

      const departmentsCube = defineCube('Departments', {
        sql: (ctx) => ({
          from: tables.departments,
          where: eq(tables.departments.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          count: {
            name: 'count',
            type: 'count',
            sql: () => tables.departments.id
          }
        },
        dimensions: {
          name: {
            name: 'name',
            type: 'string',
            sql: () => tables.departments.name
          }
        },
        joins: {
          Employees: {
            targetCube: () => employeesCube,
            relationship: 'hasMany',
            on: [
              { source: tables.departments.id, target: tables.employees.departmentId }
            ]
          }
        }
      })

      registerCube(employeesCube)
      registerCube(departmentsCube)

      // Query with calculated percentage measure and dimension from another cube
      // This will create a CTE for Employees cube
      const query = TestQueryBuilder.create()
        .measures(['Employees.activePercentage', 'Employees.activeCount', 'Employees.count'])
        .dimensions(['Departments.name'])
        .build()

      const result = await testExecutor.executeQuery(query)

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)

      // Verify that all rows have the calculated percentage
      for (const row of result.data) {
        expect(row).toHaveProperty('Employees.activePercentage')
        expect(row).toHaveProperty('Employees.activeCount')
        expect(row).toHaveProperty('Employees.count')
        expect(row).toHaveProperty('Departments.name')

        // Skip verification for rows with no employees
        if (row['Employees.count'] === 0 || row['Employees.count'] === null) {
          continue
        }

        // The percentage should be mathematically correct
        // activePercentage = (activeCount / count) * 100
        const expectedPercentage = (row['Employees.activeCount'] / row['Employees.count']) * 100

        // Allow for small floating point differences
        expect(Math.abs(row['Employees.activePercentage'] - expectedPercentage)).toBeLessThan(0.01)

        // Percentage should be between 0 and 100
        expect(row['Employees.activePercentage']).toBeGreaterThanOrEqual(0)
        expect(row['Employees.activePercentage']).toBeLessThanOrEqual(100)
      }
    })

    it('should generate correct SQL for calculated measures in CTEs', async () => {
      const employeesCube = defineCube('Employees', {
        sql: (ctx) => ({
          from: tables.employees,
          where: eq(tables.employees.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          count: {
            name: 'count',
            type: 'count',
            sql: () => tables.employees.id
          },
          activeCount: {
            name: 'activeCount',
            type: 'count',
            sql: () => tables.employees.id,
            filters: [() => eq(tables.employees.active, true)]
          },
          activePercentage: {
            name: 'activePercentage',
            type: 'calculated',
            calculatedSql: '({activeCount} / NULLIF({count}, 0)) * 100'
          }
        },
        dimensions: {},
        joins: {}
      })

      const departmentsCube = defineCube('Departments', {
        sql: (ctx) => ({
          from: tables.departments,
          where: eq(tables.departments.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {},
        dimensions: {
          name: {
            name: 'name',
            type: 'string',
            sql: () => tables.departments.name
          }
        },
        joins: {
          Employees: {
            targetCube: () => employeesCube,
            relationship: 'hasMany',
            on: [
              { source: tables.departments.id, target: tables.employees.departmentId }
            ]
          }
        }
      })

      registerCube(employeesCube)
      registerCube(departmentsCube)

      const query = TestQueryBuilder.create()
        .measures(['Employees.activePercentage'])
        .dimensions(['Departments.name'])
        .build()

      const sqlResult = await executor.generateMultiCubeSQL(cubes, query, securityContext)

      expect(sqlResult.sql).toBeDefined()

      // Should contain CTE
      expect(sqlResult.sql.toLowerCase()).toContain('with')

      // Should contain the base measures (activeCount, count) in the CTE
      expect(sqlResult.sql.toLowerCase()).toContain('activecount')
      expect(sqlResult.sql.toLowerCase()).toContain('count')

      // In the outer query, should recalculate percentage from summed base measures
      // Not sum(activePercentage) but rather (sum(activeCount) / sum(count)) * 100
      const lowerSql = sqlResult.sql.toLowerCase()
      const hasRecalculation = lowerSql.includes('sum') && lowerSql.includes('nullif')
      expect(hasRecalculation).toBe(true)
    })
  })
})
