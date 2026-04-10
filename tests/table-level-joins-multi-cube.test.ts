/**
 * Regression test for cliftonc/drizzle-cube#646
 *
 * Table-level joins declared inside a cube's `sql` factory
 * (BaseQueryDefinition.joins) must be honored in three contexts:
 *  A. Single-cube query against the cube directly                (working today)
 *  B. Cross-cube query where the cube is the JOINED branch       (broken — joins-processor)
 *  C. Multi-cube query where the cube produces a multiplied      (broken — drizzle-plan-builder
 *     measure that depends on a joined column                     keys/agg CTE paths)
 *
 * The bug is that the multi-cube planner reads `cube.sql(ctx).from`
 * and `.where` but never iterates `.joins`, so any column from
 * a table-level join silently disappears from the generated SQL.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq, and } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import { QueryExecutor } from '../src/server/executor'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { TestExecutor } from './helpers/test-utilities'
import type {
  Cube,
  QueryContext,
  BaseQueryDefinition
} from '../src/server/types'

describe('Issue #646 — Table-level joins in multi-cube queries', () => {
  let testExecutor: TestExecutor
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    const executor = new QueryExecutor(dbExecutor)
    close = cleanup

    const { employees, departments, productivity } = await getTestSchema()

    // IMPORTANT: To reproduce issue #646, the cube with the table-level
    // `BaseQueryDefinition.joins` MUST be on the JOINED side of the
    // multi-cube plan, not the primary side. The primary-cube branch of
    // joins-processor.ts already iterates `joins` correctly (lines 48-65);
    // the bug lives in the joined-cube branch (lines 196-223).
    //
    // The plan picks the "most connected" cube as primary, so we put the
    // outgoing `Cube.joins` declaration on `Productivity` and leave
    // `EmployeesEnriched` with no inter-cube joins. That makes
    // Productivity the primary and EmployeesEnriched the joined branch.
    let employeesEnriched: Cube
    let productivityCube: Cube

    employeesEnriched = defineCube('EmployeesEnriched', {
      title: 'Employees with department joined at the table level',
      description: 'Cube whose sql factory uses BaseQueryDefinition.joins to pull in departments',

      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: employees,
        joins: [
          {
            table: departments,
            on: and(
              eq(employees.departmentId, departments.id),
              eq(departments.organisationId, ctx.securityContext.organisationId)
            )!,
            type: 'left'
          }
        ],
        where: eq(employees.organisationId, ctx.securityContext.organisationId)
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
        // Lives on the table-level joined `departments` table.
        // Any reference to this dimension proves the table join survived.
        departmentName: {
          name: 'departmentName',
          title: 'Department',
          type: 'string',
          sql: departments.name
        }
      },

      measures: {
        count: {
          name: 'count',
          title: 'Employee Count',
          type: 'count',
          sql: employees.id
        },
        // Counts a column from the joined table.
        deptDistinct: {
          name: 'deptDistinct',
          title: 'Distinct Departments',
          type: 'countDistinct',
          sql: departments.id
        }
      }
    })

    productivityCube = defineCube('Productivity', {
      title: 'Productivity',
      description: 'Primary fact cube — declares the inter-cube join to EmployeesEnriched',

      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: productivity,
        where: eq(productivity.organisationId, ctx.securityContext.organisationId)
      }),

      dimensions: {
        id: {
          name: 'id',
          title: 'ID',
          type: 'number',
          sql: productivity.id,
          primaryKey: true
        },
        employeeId: {
          name: 'employeeId',
          title: 'Employee ID',
          type: 'number',
          sql: productivity.employeeId
        }
      },

      measures: {
        recordCount: {
          name: 'recordCount',
          title: 'Productivity Records',
          type: 'count',
          sql: productivity.id
        }
      },

      joins: {
        EmployeesEnriched: {
          targetCube: () => employeesEnriched,
          relationship: 'belongsTo',
          on: [
            { source: productivity.employeeId, target: employees.id }
          ]
        }
      }
    })

    const cubes = new Map<string, Cube>([
      ['EmployeesEnriched', employeesEnriched],
      ['Productivity', productivityCube]
    ])

    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  // Sanity check — the single-cube path already iterates BaseQueryDefinition.joins
  // (joins-processor.ts:48-65), so this scenario should pass on main.
  it('A. honors table-level joins when querying the cube alone', async () => {
    const result = await testExecutor.executeQuery({
      measures: ['EmployeesEnriched.count'],
      dimensions: ['EmployeesEnriched.departmentName']
    })

    expect(result.data.length).toBeGreaterThan(0)
    // At least one row must carry a non-null department name (proves the LEFT JOIN ran).
    expect(
      result.data.some(row => row['EmployeesEnriched.departmentName'] != null)
    ).toBe(true)
  })

  // BUG #646 — fix site #1: src/server/physical-plan/processors/joins-processor.ts:196-223
  // The multi-cube planner reads joinCubeBase.from but ignores joinCubeBase.joins,
  // so referencing departments.name in the SELECT causes a SQL error
  // (column "departments"."name" does not exist).
  it('B. preserves table-level joins in the joined-cube branch of a multi-cube query', async () => {
    const result = await testExecutor.executeQuery({
      measures: ['Productivity.recordCount'],
      dimensions: ['EmployeesEnriched.departmentName']
    })

    expect(result.data.length).toBeGreaterThan(0)
    expect(
      result.data.every(row => 'EmployeesEnriched.departmentName' in row)
    ).toBe(true)
    // At least one row should have a real department name + non-zero record count.
    expect(
      result.data.some(
        row =>
          row['EmployeesEnriched.departmentName'] != null &&
          (row['Productivity.recordCount'] as number) > 0
      )
    ).toBe(true)
  })

  // BUG #646 — fix sites #2 & #3:
  //   src/server/physical-plan/drizzle-plan-builder.ts:467-476  (keys CTE)
  //   src/server/physical-plan/drizzle-plan-builder.ts:497-562  (agg CTE)
  // A countDistinct on a joined-table column triggers the multiplied-measure
  // path. Both the keys CTE and the agg CTE strip the intra-cube joins.
  it('C. preserves table-level joins when a multiplied measure references a joined column', async () => {
    const result = await testExecutor.executeQuery({
      measures: ['EmployeesEnriched.deptDistinct', 'Productivity.recordCount'],
      dimensions: ['Productivity.employeeId']
    })

    expect(result.data.length).toBeGreaterThan(0)
    // deptDistinct must be a real number for at least one row, not null/undefined.
    expect(
      result.data.some(row => {
        const v = row['EmployeesEnriched.deptDistinct']
        return typeof v === 'number' || (typeof v === 'string' && v.length > 0)
      })
    ).toBe(true)
  })
})
