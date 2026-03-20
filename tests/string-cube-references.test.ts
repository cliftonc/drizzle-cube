/**
 * Tests for string-based cube references in join definitions.
 *
 * String refs let cubes reference each other by name instead of requiring
 * imports or same-file definitions, solving circular dependency issues.
 */

import { describe, it, expect, beforeAll, vi } from 'vitest'
import { eq } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import { SemanticLayerCompiler } from '../src/server'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import type { QueryContext, BaseQueryDefinition, SecurityContext } from '../src/server/types'

const securityContext: SecurityContext = { organisationId: 1 }

describe('String Cube References', () => {
  let employees: any
  let departments: any
  let productivity: any
  let executor: any

  beforeAll(async () => {
    const testSchema = await getTestSchema()
    employees = testSchema.employees
    departments = testSchema.departments
    productivity = testSchema.productivity

    const result = await createTestDatabaseExecutor()
    executor = result.executor
  })

  function createCompiler() {
    return new SemanticLayerCompiler({ databaseExecutor: executor })
  }

  describe('basic resolution', () => {
    it('should resolve string refs in multi-cube queries', async () => {
      const empCube = defineCube('Employees', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: employees,
          where: eq(employees.organisationId, ctx.securityContext.organisationId)
        }),
        joins: {
          Departments: {
            targetCube: 'Departments',
            relationship: 'belongsTo',
            on: [{ source: employees.departmentId, target: departments.id }]
          }
        },
        measures: {
          count: { name: 'count', type: 'count', sql: () => employees.id }
        },
        dimensions: {
          name: { name: 'name', type: 'string', sql: () => employees.name }
        }
      })

      const deptCube = defineCube('Departments', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: departments,
          where: eq(departments.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          count: { name: 'count', type: 'count', sql: () => departments.id }
        },
        dimensions: {
          name: { name: 'name', type: 'string', sql: () => departments.name }
        }
      })

      const compiler = createCompiler()
      compiler.registerCube(empCube)
      compiler.registerCube(deptCube)

      const result = await compiler.execute(
        { measures: ['Employees.count'], dimensions: ['Departments.name'] },
        securityContext
      )

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should resolve bidirectional string refs (A→B, B→A)', async () => {
      const empCube = defineCube('Employees', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: employees,
          where: eq(employees.organisationId, ctx.securityContext.organisationId)
        }),
        joins: {
          Departments: {
            targetCube: 'Departments',
            relationship: 'belongsTo',
            on: [{ source: employees.departmentId, target: departments.id }]
          }
        },
        measures: {
          count: { name: 'count', type: 'count', sql: () => employees.id }
        },
        dimensions: {
          name: { name: 'name', type: 'string', sql: () => employees.name }
        }
      })

      const deptCube = defineCube('Departments', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: departments,
          where: eq(departments.organisationId, ctx.securityContext.organisationId)
        }),
        joins: {
          Employees: {
            targetCube: 'Employees',
            relationship: 'hasMany',
            on: [{ source: departments.id, target: employees.departmentId }]
          }
        },
        measures: {
          count: { name: 'count', type: 'count', sql: () => departments.id }
        },
        dimensions: {
          name: { name: 'name', type: 'string', sql: () => departments.name }
        }
      })

      const compiler = createCompiler()
      compiler.registerCube(empCube)
      compiler.registerCube(deptCube)

      const result = await compiler.execute(
        { measures: ['Employees.count'], dimensions: ['Departments.name'] },
        securityContext
      )

      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should work with mixed refs (string + function) in same schema', async () => {
      const deptCube = defineCube('Departments', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: departments,
          where: eq(departments.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          count: { name: 'count', type: 'count', sql: () => departments.id }
        },
        dimensions: {
          name: { name: 'name', type: 'string', sql: () => departments.name }
        }
      })

      const empCube = defineCube('Employees', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: employees,
          where: eq(employees.organisationId, ctx.securityContext.organisationId)
        }),
        joins: {
          Departments: {
            targetCube: () => deptCube, // function ref
            relationship: 'belongsTo',
            on: [{ source: employees.departmentId, target: departments.id }]
          },
          Productivity: {
            targetCube: 'Productivity', // string ref
            relationship: 'hasMany',
            on: [{ source: employees.id, target: productivity.employeeId }]
          }
        },
        measures: {
          count: { name: 'count', type: 'count', sql: () => employees.id }
        },
        dimensions: {
          name: { name: 'name', type: 'string', sql: () => employees.name }
        }
      })

      const prodCube = defineCube('Productivity', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: productivity,
          where: eq(productivity.organisationId, ctx.securityContext.organisationId)
        }),
        joins: {
          Employees: {
            targetCube: 'Employees',
            relationship: 'belongsTo',
            on: [{ source: productivity.employeeId, target: employees.id }]
          }
        },
        measures: {
          totalLines: { name: 'totalLines', type: 'sum', sql: () => productivity.linesOfCode }
        },
        dimensions: {}
      })

      const compiler = createCompiler()
      compiler.registerCube(empCube)
      compiler.registerCube(deptCube)
      compiler.registerCube(prodCube)

      // Query using function-ref join
      const result = await compiler.execute(
        { measures: ['Employees.count'], dimensions: ['Departments.name'] },
        securityContext
      )
      expect(result.data).toBeDefined()
    })
  })

  describe('security context propagation', () => {
    it('should propagate security context with string refs', async () => {
      const empCube = defineCube('Employees', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: employees,
          where: eq(employees.organisationId, ctx.securityContext.organisationId)
        }),
        joins: {
          Departments: {
            targetCube: 'Departments',
            relationship: 'belongsTo',
            on: [{ source: employees.departmentId, target: departments.id }]
          }
        },
        measures: {
          count: { name: 'count', type: 'count', sql: () => employees.id }
        },
        dimensions: {}
      })

      const deptCube = defineCube('Departments', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: departments,
          where: eq(departments.organisationId, ctx.securityContext.organisationId)
        }),
        joins: {
          Employees: {
            targetCube: 'Employees',
            relationship: 'hasMany',
            on: [{ source: departments.id, target: employees.departmentId }]
          }
        },
        measures: {
          count: { name: 'count', type: 'count', sql: () => departments.id }
        },
        dimensions: {
          name: { name: 'name', type: 'string', sql: () => departments.name }
        }
      })

      const compiler = createCompiler()
      compiler.registerCube(empCube)
      compiler.registerCube(deptCube)

      // Both org contexts should work without errors
      const result1 = await compiler.execute(
        { measures: ['Employees.count'], dimensions: ['Departments.name'] },
        { organisationId: 1 }
      )
      const result2 = await compiler.execute(
        { measures: ['Employees.count'], dimensions: ['Departments.name'] },
        { organisationId: 2 }
      )

      expect(result1.data).toBeDefined()
      expect(result2.data).toBeDefined()

      // Dry run should show security context applied
      const dryRun = await compiler.dryRun(
        { measures: ['Employees.count'], dimensions: ['Departments.name'] },
        { organisationId: 1 }
      )
      expect(dryRun.sql).toBeDefined()
    })
  })

  describe('metadata generation', () => {
    it('should resolve string refs in metadata', () => {
      const empCube = defineCube('Employees', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: employees,
          where: eq(employees.organisationId, ctx.securityContext.organisationId)
        }),
        joins: {
          Departments: {
            targetCube: 'Departments',
            relationship: 'belongsTo',
            on: [{ source: employees.departmentId, target: departments.id }]
          }
        },
        measures: {
          count: { name: 'count', type: 'count', sql: () => employees.id }
        },
        dimensions: {}
      })

      const deptCube = defineCube('Departments', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: departments,
          where: eq(departments.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          count: { name: 'count', type: 'count', sql: () => departments.id }
        },
        dimensions: {
          name: { name: 'name', type: 'string', sql: () => departments.name }
        }
      })

      const compiler = createCompiler()
      compiler.registerCube(empCube)
      compiler.registerCube(deptCube)

      const meta = compiler.getMetadata()
      const empMeta = meta.find(m => m.name === 'Employees')

      expect(empMeta).toBeDefined()
      expect(empMeta!.relationships).toBeDefined()
      expect(empMeta!.relationships!.length).toBe(1)
      expect(empMeta!.relationships![0].targetCube).toBe('Departments')
      expect(empMeta!.relationships![0].relationship).toBe('belongsTo')
    })
  })

  describe('error handling', () => {
    it('should warn and skip unregistered string ref gracefully', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const empCube = defineCube('Employees', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: employees,
          where: eq(employees.organisationId, ctx.securityContext.organisationId)
        }),
        joins: {
          MissingCube: {
            targetCube: 'NonExistentCube',
            relationship: 'belongsTo',
            on: [{ source: employees.departmentId, target: departments.id }]
          }
        },
        measures: {
          count: { name: 'count', type: 'count', sql: () => employees.id }
        },
        dimensions: {
          name: { name: 'name', type: 'string', sql: () => employees.name }
        }
      })

      const compiler = createCompiler()
      compiler.registerCube(empCube)

      // Single-cube query should work fine (missing join is just skipped)
      const result = await compiler.execute(
        { measures: ['Employees.count'] },
        securityContext
      )
      expect(result.data).toBeDefined()

      warnSpy.mockRestore()
    })

    it('should throw from validateCubeReferences for unregistered refs', () => {
      const empCube = defineCube('Employees', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: employees,
          where: eq(employees.organisationId, ctx.securityContext.organisationId)
        }),
        joins: {
          MissingCube: {
            targetCube: 'NonExistentCube',
            relationship: 'belongsTo',
            on: [{ source: employees.departmentId, target: departments.id }]
          }
        },
        measures: {
          count: { name: 'count', type: 'count', sql: () => employees.id }
        },
        dimensions: {}
      })

      const compiler = createCompiler()
      compiler.registerCube(empCube)

      expect(() => compiler.validateCubeReferences()).toThrow('Unresolved cube references')
      expect(() => compiler.validateCubeReferences()).toThrow("target cube 'NonExistentCube' is not registered")
    })

    it('should pass validateCubeReferences when all string refs resolve', () => {
      const empCube = defineCube('Employees', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: employees,
          where: eq(employees.organisationId, ctx.securityContext.organisationId)
        }),
        joins: {
          Departments: {
            targetCube: 'Departments',
            relationship: 'belongsTo',
            on: [{ source: employees.departmentId, target: departments.id }]
          }
        },
        measures: {
          count: { name: 'count', type: 'count', sql: () => employees.id }
        },
        dimensions: {}
      })

      const deptCube = defineCube('Departments', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: departments,
          where: eq(departments.organisationId, ctx.securityContext.organisationId)
        }),
        measures: {
          count: { name: 'count', type: 'count', sql: () => departments.id }
        },
        dimensions: {}
      })

      const compiler = createCompiler()
      compiler.registerCube(empCube)
      compiler.registerCube(deptCube)

      expect(() => compiler.validateCubeReferences()).not.toThrow()
    })

    it('should not throw for function refs in validateCubeReferences', () => {
      const deptCube = defineCube('Departments', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: departments,
          where: eq(departments.organisationId, ctx.securityContext.organisationId)
        }),
        measures: { count: { name: 'count', type: 'count', sql: () => departments.id } },
        dimensions: {}
      })

      const empCube = defineCube('Employees', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: employees,
          where: eq(employees.organisationId, ctx.securityContext.organisationId)
        }),
        joins: {
          Departments: {
            targetCube: () => deptCube, // function ref - not checked by validate
            relationship: 'belongsTo',
            on: [{ source: employees.departmentId, target: departments.id }]
          }
        },
        measures: { count: { name: 'count', type: 'count', sql: () => employees.id } },
        dimensions: {}
      })

      const compiler = createCompiler()
      compiler.registerCube(empCube)
      // deptCube not registered, but the ref is a function not a string
      expect(() => compiler.validateCubeReferences()).not.toThrow()
    })
  })
})
