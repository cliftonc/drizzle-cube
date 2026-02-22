import { describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'

import { CTEBuilder } from '../src/server/builders/cte-builder'
import { getTestSchema } from './helpers/test-database'
import type { Cube, PhysicalQueryPlan } from '../src/server/types'

function renderSql(sqlExpr: any): string {
  const rendered = sqlExpr.toQuery({
    escapeName: (name: string) => `"${name}"`,
    escapeParam: (index: number) => `$${index + 1}`,
    escapeString: (value: string) => `'${value.replace(/'/g, "''")}'`
  })
  return rendered.sql
}

describe('CTEBuilder CTE-to-CTE join rewriting', () => {
  it('uses upstream CTE alias when join source cube is also pre-aggregated', async () => {
    const { employees, departments } = await getTestSchema()

    const departmentsCube = {
      name: 'Departments',
      sql: () => ({ from: departments }),
      dimensions: {
        id: { name: 'id', type: 'number', sql: departments.id, primaryKey: true }
      },
      measures: {}
    } as unknown as Cube

    const employeesCube = {
      name: 'Employees',
      sql: () => ({ from: employees }),
      dimensions: {
        id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true },
        departmentId: { name: 'departmentId', type: 'number', sql: employees.departmentId }
      },
      measures: {}
    } as unknown as Cube

    const queryPlan: PhysicalQueryPlan = {
      primaryCube: departmentsCube,
      joinCubes: [
        {
          cube: employeesCube,
          alias: 'employees',
          joinType: 'left',
          joinCondition: eq(departments.id as any, employees.departmentId as any)
        }
      ],
      preAggregationCTEs: [
        {
          cube: departmentsCube,
          alias: 'departments',
          cteAlias: 'departments_agg',
          joinKeys: [
            {
              sourceColumn: 'id',
              targetColumn: 'id',
              sourceColumnObj: departments.id as any,
              targetColumnObj: departments.id as any
            }
          ],
          measures: ['Departments.totalBudget'],
          cteType: 'aggregate',
          cteReason: 'fanOutPrevention'
        },
        {
          cube: employeesCube,
          alias: 'employees',
          cteAlias: 'employees_agg',
          joinKeys: [
            {
              sourceColumn: 'id',
              targetColumn: 'department_id',
              sourceColumnObj: departments.id as any,
              targetColumnObj: employees.departmentId as any
            }
          ],
          measures: ['Employees.count'],
          cteType: 'aggregate',
          cteReason: 'hasMany'
        }
      ]
    }

    const builder = new CTEBuilder({} as any)
    const joinCondition = builder.buildCTEJoinCondition(
      queryPlan.joinCubes[0],
      'employees_agg',
      queryPlan
    )

    const sqlText = renderSql(joinCondition)
    expect(sqlText).toContain('"departments_agg"."id" = "employees_agg"."department_id"')
    expect(sqlText).not.toContain('"departments"."id" = "employees_agg"."department_id"')
  })
})

