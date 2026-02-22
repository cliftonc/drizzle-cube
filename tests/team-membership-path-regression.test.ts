import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { handleDryRun } from '../src/adapters/utils'
import { createTestCubesForCurrentDatabase } from './helpers/test-cubes'
import { createTestSemanticLayer, getTestDatabaseType } from './helpers/test-database'
import { testSecurityContexts } from './helpers/enhanced-test-data'

const dbType = getTestDatabaseType()

describe(`Team Membership Path Regression (${dbType})`, () => {
  let semanticLayer: any
  let close: () => void

  const query = {
    measures: ['Employees.count', 'EmployeeTeams.count'],
    dimensions: ['Teams.name']
  }

  beforeAll(async () => {
    const created = await createTestSemanticLayer()
    semanticLayer = created.semanticLayer
    close = created.close

    const cubes = await createTestCubesForCurrentDatabase()
    semanticLayer.registerCube(cubes.testEmployeesCube)
    semanticLayer.registerCube(cubes.testDepartmentsCube)
    semanticLayer.registerCube(cubes.testProductivityCube)
    semanticLayer.registerCube(cubes.testTimeEntriesCube)
    semanticLayer.registerCube(cubes.testTeamsCube)
    semanticLayer.registerCube(cubes.testEmployeeTeamsCube)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  it('executes Teams.name + Employees.count + EmployeeTeams.count without invalid alias joins', async () => {
    const result = await semanticLayer.execute(query, testSecurityContexts.org1)

    expect(result.data.length).toBeGreaterThan(0)
    for (const row of result.data) {
      expect(Number(row['Employees.count'] ?? 0)).toBeGreaterThanOrEqual(0)
      expect(Number(row['EmployeeTeams.count'] ?? 0)).toBeGreaterThanOrEqual(0)
      expect(typeof row['Teams.name']).toBe('string')
    }

    const sqlResult = await semanticLayer.dryRun(query, testSecurityContexts.org1)
    const sqlText = sqlResult.sql.toLowerCase()

    expect(sqlText).toContain('employee_teams')
    expect(sqlText).toContain('employees_agg')
    expect(sqlText).toContain('employeeteams_agg')
    expect(sqlText).not.toContain('departments')
  })

  it('surfaces membership-path planning in analysis and dry-run response', async () => {
    const analysis = semanticLayer.analyzeQuery(query, testSecurityContexts.org1)
    const employeesPath = analysis.joinPaths.find((path: any) => path.targetCube === 'Employees')

    expect(employeesPath?.pathFound).toBe(true)
    expect(employeesPath?.path?.[0]?.fromCube).toBe('Teams')
    expect(employeesPath?.path?.[0]?.toCube).toBe('EmployeeTeams')

    const dryRun = await handleDryRun(query, testSecurityContexts.org1, semanticLayer)
    expect(dryRun.analysis).toBeDefined()

    const dryRunEmployeesPath = dryRun.analysis?.joinPaths?.find(
      (path: any) => path.targetCube === 'Employees'
    )

    expect(dryRunEmployeesPath?.pathFound).toBe(true)
    expect(dryRunEmployeesPath?.path?.[0]?.toCube).toBe('EmployeeTeams')
  })

  it('executes Teams.name + Employees.count + Productivity.totalLinesOfCode + EmployeeTeams.count', async () => {
    const multiMeasureQuery = {
      measures: ['Employees.count', 'Productivity.totalLinesOfCode', 'EmployeeTeams.count'],
      dimensions: ['Teams.name']
    }

    const result = await semanticLayer.execute(multiMeasureQuery, testSecurityContexts.org1)
    expect(result.data.length).toBeGreaterThan(0)

    for (const row of result.data) {
      expect(typeof row['Teams.name']).toBe('string')
      expect(Number(row['Employees.count'] ?? 0)).toBeGreaterThanOrEqual(0)
      expect(Number(row['Productivity.totalLinesOfCode'] ?? 0)).toBeGreaterThanOrEqual(0)
      expect(Number(row['EmployeeTeams.count'] ?? 0)).toBeGreaterThanOrEqual(0)
    }

    const sqlResult = await semanticLayer.dryRun(multiMeasureQuery, testSecurityContexts.org1)
    const sqlText = sqlResult.sql.toLowerCase()

    expect(sqlText).toContain('productivity_agg')
    expect(sqlText).toContain('employees_agg')
    expect(sqlText).toContain('employeeteams_agg')
  })
})
