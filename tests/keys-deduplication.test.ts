import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { handleDryRun } from '../src/adapters/utils'
import { createTestCubesForCurrentDatabase } from './helpers/test-cubes'
import {
  createTestSemanticLayer,
  getTestDatabaseType
} from './helpers/test-database'
import { testSecurityContexts } from './helpers/enhanced-test-data'

const dbType = getTestDatabaseType()

describe(`Keys Deduplication (${dbType})`, () => {
  let semanticLayer: any
  let close: () => void

  beforeAll(async () => {
    const created = await createTestSemanticLayer()
    semanticLayer = created.semanticLayer
    close = created.close

    const cubes = await createTestCubesForCurrentDatabase()
    semanticLayer.registerCube(cubes.testEmployeesCube)
    semanticLayer.registerCube(cubes.testDepartmentsCube)
    semanticLayer.registerCube(cubes.testTeamsCube)
    semanticLayer.registerCube(cubes.testProductivityCube)
  })

  afterAll(() => {
    if (close) {
      close()
    }
  })

  it('shows keysDeduplication strategy in analysis and dry-run metadata', async () => {
    const query = {
      measures: ['Departments.totalBudget'],
      dimensions: ['Teams.name'],
      filters: [
        { member: 'Employees.id', operator: 'gt', values: [0] }
      ]
    }

    const analysis = semanticLayer.analyzeQuery(query, testSecurityContexts.org1)
    expect(analysis.querySummary.measureStrategy).toBe('keysDeduplication')

    const strategyStep = analysis.planningTrace?.steps.find(
      (step: any) => step.phase === 'measure_strategy'
    )
    expect(strategyStep?.details?.strategy).toBe('keysDeduplication')

    const dryRun = await handleDryRun(query, testSecurityContexts.org1, semanticLayer)
    expect(dryRun.analysis?.querySummary?.measureStrategy).toBe('keysDeduplication')
  })

  it('aggregates multiplied budget by team using deduplicated team-department keys', async () => {
    const byTeamAndDepartment = await semanticLayer.execute(
      {
        measures: ['Departments.totalBudget'],
        dimensions: ['Teams.name', 'Departments.name'],
        filters: [
          { member: 'Employees.id', operator: 'gt', values: [0] }
        ]
      },
      testSecurityContexts.org1
    )

    const expectedByTeam = new Map<string, number>()
    for (const row of byTeamAndDepartment.data) {
      const team = String(row['Teams.name'] ?? '')
      const budget = Number(row['Departments.totalBudget'] ?? 0)
      expectedByTeam.set(team, (expectedByTeam.get(team) ?? 0) + budget)
    }

    const byTeam = await semanticLayer.execute(
      {
        measures: ['Departments.totalBudget'],
        dimensions: ['Teams.name'],
        filters: [
          { member: 'Employees.id', operator: 'gt', values: [0] }
        ]
      },
      testSecurityContexts.org1
    )

    expect(byTeam.data.length).toBeGreaterThan(0)
    for (const row of byTeam.data) {
      const team = String(row['Teams.name'] ?? '')
      const actual = Number(row['Departments.totalBudget'] ?? 0)
      const expected = expectedByTeam.get(team)
      expect(expected).toBeDefined()
      expect(actual).toBe(expected)
    }
  })
})
