/**
 * Regression test: primary-cube measures must not be inflated by a hasMany
 * cube that only contributes a filter to the query.
 *
 * Employees wins primary-cube selection. Productivity is reached through
 * Employees.hasMany but has no measures in the query, so it gets no
 * pre-aggregation CTE and every matching productivity row repeats the employee
 * row. Employees.totalSalary must still add each qualifying employee once.
 *
 * The keys-deduplication path must also keep LEFT JOIN semantics: with a
 * Departments.hasMany(Employees) join, a department with no employees keeps its
 * row, with a null employee dimension.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { Cube } from '../src/server/types'
import { QueryExecutor } from '../src/server/executor'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import { getTestCubes } from './helpers/test-cubes'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'
import { testSecurityContexts } from './helpers/enhanced-test-data'

describe('Primary-cube measures with a filter-only hasMany cube', () => {
  let testExecutor: TestExecutor
  let queryExecutor: QueryExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  const productivityFilter = { member: 'Productivity.linesOfCode', operator: 'gt', values: [0] }

  let qualifyingEmployees: Array<{ id: number; departmentId: number | null; salary: number }>

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    close = cleanup
    cubes = await getTestCubes()
    queryExecutor = new QueryExecutor(dbExecutor)
    testExecutor = new TestExecutor(queryExecutor, cubes, testSecurityContexts.org1)

    const employees = await testExecutor.executeQuery(
      TestQueryBuilder.create()
        .measures(['Employees.totalSalary'])
        .dimensions(['Employees.id', 'Employees.departmentId'])
        .build()
    )
    const qualifying = await testExecutor.executeQuery(
      TestQueryBuilder.create()
        .measures(['Productivity.recordCount'])
        .dimensions(['Productivity.employeeId'])
        .filters([productivityFilter])
        .build()
    )
    const qualifyingIds = new Set(
      qualifying.data
        .filter(row => Number(row['Productivity.recordCount']) > 0)
        .map(row => Number(row['Productivity.employeeId']))
    )
    qualifyingEmployees = employees.data
      .filter(row => qualifyingIds.has(Number(row['Employees.id'])))
      .map(row => ({
        id: Number(row['Employees.id']),
        departmentId: row['Employees.departmentId'] == null ? null : Number(row['Employees.departmentId']),
        salary: Number(row['Employees.totalSalary'] ?? 0)
      }))
  })

  it('should keep a primary row with no hasMany match when grouped by a hasMany dimension', async () => {
    const departments = await testExecutor.executeQuery(
      TestQueryBuilder.create()
        .measures(['Departments.totalBudget'])
        .dimensions(['Departments.id', 'Departments.name'])
        .build()
    )
    const employees = await testExecutor.executeQuery(
      TestQueryBuilder.create()
        .measures(['Employees.count'])
        .dimensions(['Employees.departmentId', 'Employees.name'])
        .build()
    )
    const employeeNamesByDepartment = new Map<number, Set<string>>()
    for (const row of employees.data) {
      if (row['Employees.departmentId'] == null) continue
      const departmentId = Number(row['Employees.departmentId'])
      const names = employeeNamesByDepartment.get(departmentId) ?? new Set<string>()
      names.add(String(row['Employees.name']))
      employeeNamesByDepartment.set(departmentId, names)
    }
    const expected = new Map<string, number>()
    for (const row of departments.data) {
      const budget = Number(row['Departments.totalBudget'] ?? 0)
      const names = employeeNamesByDepartment.get(Number(row['Departments.id'])) ?? new Set([null])
      for (const name of names) {
        expected.set(`${row['Departments.name']}|${name}`, budget)
      }
    }
    expect([...expected.keys()].some(key => key.endsWith('|null'))).toBe(true)

    const { departments: departmentsTable, employees: employeesTable } = await getTestSchema()
    const departmentsCube = cubes.get('Departments')!
    const cubesWithDepartmentEmployees = new Map(cubes)
    cubesWithDepartmentEmployees.set('Departments', {
      ...departmentsCube,
      joins: {
        Employees: {
          targetCube: () => cubes.get('Employees')!,
          relationship: 'hasMany',
          on: [{ source: departmentsTable.id, target: employeesTable.departmentId }]
        }
      }
    })
    const departmentExecutor = new TestExecutor(queryExecutor, cubesWithDepartmentEmployees, testSecurityContexts.org1)

    const result = await departmentExecutor.executeQuery(
      TestQueryBuilder.create()
        .measures(['Departments.totalBudget'])
        .dimensions(['Departments.name', 'Employees.name'])
        .build()
    )

    const actual = new Map(
      result.data.map(row => [
        `${row['Departments.name']}|${row['Employees.name'] ?? null}`,
        Number(row['Departments.totalBudget'] ?? 0)
      ])
    )
    expect(actual).toEqual(expected)
  })

  afterAll(() => {
    if (close) close()
  })

  it('should not inflate a primary sum measure for a filter-only hasMany cube', async () => {
    expect(qualifyingEmployees.length).toBeGreaterThan(1)

    const result = await testExecutor.executeQuery(
      TestQueryBuilder.create()
        .measures(['Employees.totalSalary'])
        .filters([productivityFilter])
        .build()
    )

    const expectedTotal = qualifyingEmployees.reduce((total, employee) => total + employee.salary, 0)
    expect(result.data).toHaveLength(1)
    expect(Number(result.data[0]['Employees.totalSalary'])).toBe(expectedTotal)
  })

  it('should not inflate a primary sum measure grouped by a primary dimension', async () => {
    const result = await testExecutor.executeQuery(
      TestQueryBuilder.create()
        .measures(['Employees.totalSalary'])
        .dimensions(['Employees.departmentId'])
        .filters([productivityFilter])
        .build()
    )

    const expected = new Map<number | null, number>()
    for (const employee of qualifyingEmployees) {
      expected.set(employee.departmentId, (expected.get(employee.departmentId) ?? 0) + employee.salary)
    }
    const actual = new Map(
      result.data.map(row => [
        row['Employees.departmentId'] == null ? null : Number(row['Employees.departmentId']),
        Number(row['Employees.totalSalary'] ?? 0)
      ])
    )
    expect(actual).toEqual(expected)
  })
})
