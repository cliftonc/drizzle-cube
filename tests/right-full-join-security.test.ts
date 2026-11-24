/**
 * Tenant isolation through RIGHT and FULL joins (GHSA-xv8c-hc26-6cq8).
 *
 * A LEFT join can carry the joined cube's tenant filter in its ON clause: the
 * joined cube is the NULL-extended side, so its rows that fail ON disappear.
 * On a RIGHT or FULL join the joined cube is the preserved side — rows that
 * fail ON come back anyway — so a filter that only lives in ON filters nothing.
 *
 * The same happens when a joined cube's own `sql` has an internal RIGHT/FULL
 * join: it runs after the cube join, so it keeps every row of its table.
 *
 * Each case runs as org 1 and checks the joined cube's values against what
 * org 1 sees when it queries that cube alone (where the filter is in WHERE).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq, or, isNull } from 'drizzle-orm'
import { QueryExecutor } from '../src/server/executor'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, QueryContext, BaseQueryDefinition } from '../src/server/types'
import { createTestDatabaseExecutor, getTestSchema, getTestDatabaseType } from './helpers/test-database'
import { testSecurityContexts } from './helpers/enhanced-test-data'

type JoinType = 'right' | 'full'
type Relationship = 'hasMany' | 'hasOne' | 'belongsTo'

// MySQL has no FULL JOIN.
const joinTypes: JoinType[] = getTestDatabaseType() === 'mysql' ? ['right'] : ['right', 'full']
const relationships: Relationship[] = ['hasMany', 'hasOne', 'belongsTo']

describe('Tenant isolation through RIGHT and FULL joins', () => {
  let executor: QueryExecutor
  let close: () => void
  let schema: Awaited<ReturnType<typeof getTestSchema>>

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    executor = new QueryExecutor(dbExecutor)
    close = cleanup
    schema = await getTestSchema()
  })

  afterAll(() => {
    if (close) close()
  })

  /** Tenant-scoped employees. */
  function tenantEmployees(): Cube {
    const { employees } = schema
    return defineCube('TenantEmployees', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: employees,
        where: eq(employees.organisationId, ctx.securityContext.organisationId)
      }),
      dimensions: {
        id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true },
        name: { name: 'name', type: 'string', sql: employees.name }
      },
      measures: {
        count: { name: 'count', type: 'count', sql: employees.id }
      }
    })
  }

  /**
   * Departments as "shared reference data": no `where` at all. The primary
   * cube's own filter can't reject the NULL-extended rows of the join.
   */
  function sharedDepartments(joinType: JoinType, relationship: Relationship, target: Cube): Cube {
    const { departments, employees } = schema
    return defineCube('SharedDepartments', {
      sql: (): BaseQueryDefinition => ({ from: departments }),
      joins: {
        TenantEmployees: {
          targetCube: () => target,
          relationship,
          sqlJoinType: joinType,
          on: [{ source: departments.id, target: employees.departmentId }]
        }
      },
      dimensions: {
        id: { name: 'id', type: 'number', sql: departments.id, primaryKey: true },
        name: { name: 'name', type: 'string', sql: departments.name }
      },
      measures: {
        count: { name: 'count', type: 'count', sql: departments.id }
      }
    })
  }

  async function org1EmployeeNames(cubes: Map<string, Cube>): Promise<Set<string>> {
    const result = await executor.execute(
      cubes,
      { dimensions: ['TenantEmployees.name'] },
      testSecurityContexts.org1
    )
    return new Set(result.data.map(r => r['TenantEmployees.name'] as string))
  }

  for (const joinType of joinTypes) {
    for (const relationship of relationships) {
      it(`${relationship} ${joinType} join: dimensions return only org 1 employees`, async () => {
        const employeesCube = tenantEmployees()
        const cubes = new Map<string, Cube>([
          ['TenantEmployees', employeesCube],
          ['SharedDepartments', sharedDepartments(joinType, relationship, employeesCube)]
        ])
        const expected = await org1EmployeeNames(cubes)
        expect(expected.size).toBeGreaterThan(0)

        const result = await executor.execute(
          cubes,
          // Two SharedDepartments dimensions so it is picked as primary.
          { dimensions: ['SharedDepartments.id', 'SharedDepartments.name', 'TenantEmployees.name'] },
          testSecurityContexts.org1
        )

        const returned = new Set(
          result.data
            .map(r => r['TenantEmployees.name'])
            .filter((n): n is string => n !== null && n !== undefined)
        )
        // No other organisation's employees ...
        for (const name of returned) expect(expected).toContain(name)
        // ... and the preserved side keeps all of org 1's.
        expect(returned).toEqual(expected)
      })
    }

    it(`hasOne ${joinType} join: measures count only org 1 employees`, async () => {
      const employeesCube = tenantEmployees()
      const cubes = new Map<string, Cube>([
        ['TenantEmployees', employeesCube],
        ['SharedDepartments', sharedDepartments(joinType, 'hasOne', employeesCube)]
      ])
      const expected = await org1EmployeeNames(cubes)

      const result = await executor.execute(
        cubes,
        { measures: ['TenantEmployees.count'], dimensions: ['SharedDepartments.name'] },
        testSecurityContexts.org1
      )
      const total = result.data.reduce((sum, r) => sum + Number(r['TenantEmployees.count'] ?? 0), 0)
      expect(total).toBe(expected.size)
    })
  }

  describe('joined cube without a primary key', () => {
    function employeesWithoutPk(): Cube {
      const { employees } = schema
      return defineCube('TenantEmployees', {
        sql: (ctx: QueryContext): BaseQueryDefinition => ({
          from: employees,
          where: eq(employees.organisationId, ctx.securityContext.organisationId)
        }),
        dimensions: {
          name: { name: 'name', type: 'string', sql: employees.name }
        },
        measures: {
          count: { name: 'count', type: 'count', sql: employees.id }
        }
      })
    }

    it('right join falls back to the plain filter in WHERE', async () => {
      const employeesCube = employeesWithoutPk()
      const cubes = new Map<string, Cube>([
        ['TenantEmployees', employeesCube],
        ['SharedDepartments', sharedDepartments('right', 'hasMany', employeesCube)]
      ])
      const expected = await org1EmployeeNames(cubes)
      const result = await executor.execute(
        cubes,
        { dimensions: ['SharedDepartments.id', 'SharedDepartments.name', 'TenantEmployees.name'] },
        testSecurityContexts.org1
      )
      const returned = new Set(result.data.map(r => r['TenantEmployees.name']))
      expect(returned).toEqual(expected)
    })

    it.skipIf(getTestDatabaseType() === 'mysql')('full join is refused instead of leaking', async () => {
      const employeesCube = employeesWithoutPk()
      const cubes = new Map<string, Cube>([
        ['TenantEmployees', employeesCube],
        ['SharedDepartments', sharedDepartments('full', 'hasMany', employeesCube)]
      ])
      await expect(executor.execute(
        cubes,
        { dimensions: ['SharedDepartments.id', 'SharedDepartments.name', 'TenantEmployees.name'] },
        testSecurityContexts.org1
      )).rejects.toThrow(/no primaryKey dimension/)
    })
  })

  describe('internal RIGHT/FULL join inside a joined cube', () => {
    for (const internalType of joinTypes) {
      for (const cubeJoinType of ['left', ...joinTypes] as const) {
        it(`internal ${internalType} join under a ${cubeJoinType} cube join returns only org 1 departments`, async () => {
          const { employees, departments, productivity } = schema

          const employeesWithDept = defineCube('EmployeesWithDept', {
            sql: (ctx: QueryContext): BaseQueryDefinition => ({
              from: employees,
              joins: [{
                table: departments,
                on: eq(employees.departmentId, departments.id),
                type: internalType
              }],
              where: eq(employees.organisationId, ctx.securityContext.organisationId)
            }),
            dimensions: {
              id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true },
              name: { name: 'name', type: 'string', sql: employees.name },
              departmentName: { name: 'departmentName', type: 'string', sql: departments.name }
            },
            measures: {
              count: { name: 'count', type: 'count', sql: employees.id }
            }
          })

          // "Mine or shared": passes a row of NULLs.
          const mineOrShared = defineCube('MineOrSharedProductivity', {
            sql: (ctx: QueryContext): BaseQueryDefinition => ({
              from: productivity,
              where: or(
                eq(productivity.organisationId, ctx.securityContext.organisationId),
                isNull(productivity.organisationId)
              )
            }),
            joins: {
              EmployeesWithDept: {
                targetCube: () => employeesWithDept,
                relationship: 'belongsTo',
                sqlJoinType: cubeJoinType,
                on: [{ source: productivity.employeeId, target: employees.id }]
              }
            },
            dimensions: {
              id: { name: 'id', type: 'number', sql: productivity.id, primaryKey: true },
              date: { name: 'date', type: 'time', sql: productivity.date }
            },
            measures: {
              count: { name: 'count', type: 'count', sql: productivity.id }
            }
          })

          const cubes = new Map<string, Cube>([
            ['EmployeesWithDept', employeesWithDept],
            ['MineOrSharedProductivity', mineOrShared]
          ])

          // What org 1 sees when it queries the cube alone (filter in WHERE).
          const allowed = new Set(
            (await executor.execute(
              cubes,
              { dimensions: ['EmployeesWithDept.departmentName'] },
              testSecurityContexts.org1
            )).data.map(r => r['EmployeesWithDept.departmentName'])
          )

          const result = await executor.execute(
            cubes,
            {
              dimensions: [
                'MineOrSharedProductivity.id',
                'MineOrSharedProductivity.date',
                'EmployeesWithDept.departmentName'
              ]
            },
            testSecurityContexts.org1
          )

          const leaked = result.data
            .map(r => r['EmployeesWithDept.departmentName'])
            .filter(n => n !== null && n !== undefined && !allowed.has(n))
          expect(leaked).toEqual([])
        })
      }
    }
  })
})
