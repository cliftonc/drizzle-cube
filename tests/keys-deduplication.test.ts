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
    semanticLayer.registerCube(cubes.testEmployeeTeamsCube)
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

  // -----------------------------------------------------------------------
  // A. SUM correctness with known expected values
  // -----------------------------------------------------------------------
  it('SUM: returns correct deduplicated totals per team', async () => {
    const result = await semanticLayer.execute(
      {
        measures: ['Departments.totalBudget'],
        dimensions: ['Teams.name'],
        filters: [{ member: 'Employees.id', operator: 'gt', values: [0] }]
      },
      testSecurityContexts.org1
    )

    // Known expected values based on test data:
    // Each team maps to departments through employees. Keys deduplication
    // ensures each department is counted once per team.
    const expected: Record<string, number> = {
      'Frontend Team': 750000,  // Engineering(500k) + Marketing(250k)
      'Backend Team': 750000,   // Engineering(500k) + Marketing(250k)
      'DevOps Team': 800000,    // Engineering(500k) + Sales(300k)
      'Data Team': 500000,      // Engineering(500k)
      'Mobile Team': 750000,    // Engineering(500k) + Marketing(250k)
      'Security Team': 250000   // Marketing(250k)
    }

    expect(result.data.length).toBe(6)
    for (const row of result.data) {
      const team = String(row['Teams.name'])
      const actual = Number(row['Departments.totalBudget'])
      expect(actual).toBe(expected[team])
    }
  })

  // -----------------------------------------------------------------------
  // B. MIN/MAX measures
  // -----------------------------------------------------------------------
  it('MIN: returns correct minimum budget per team', async () => {
    const result = await semanticLayer.execute(
      {
        measures: ['Departments.minBudget'],
        dimensions: ['Teams.name'],
        filters: [{ member: 'Employees.id', operator: 'gt', values: [0] }]
      },
      testSecurityContexts.org1
    )

    const expected: Record<string, number> = {
      'Frontend Team': 250000,
      'Backend Team': 250000,
      'DevOps Team': 300000,
      'Data Team': 500000,
      'Mobile Team': 250000,
      'Security Team': 250000
    }

    expect(result.data.length).toBe(6)
    for (const row of result.data) {
      const team = String(row['Teams.name'])
      const actual = Number(row['Departments.minBudget'])
      expect(actual).toBe(expected[team])
    }
  })

  it('MAX: returns correct maximum budget per team', async () => {
    const result = await semanticLayer.execute(
      {
        measures: ['Departments.maxBudget'],
        dimensions: ['Teams.name'],
        filters: [{ member: 'Employees.id', operator: 'gt', values: [0] }]
      },
      testSecurityContexts.org1
    )

    const expected: Record<string, number> = {
      'Frontend Team': 500000,
      'Backend Team': 500000,
      'DevOps Team': 500000,
      'Data Team': 500000,
      'Mobile Team': 500000,
      'Security Team': 250000
    }

    expect(result.data.length).toBe(6)
    for (const row of result.data) {
      const team = String(row['Teams.name'])
      const actual = Number(row['Departments.maxBudget'])
      expect(actual).toBe(expected[team])
    }
  })

  // -----------------------------------------------------------------------
  // C. AVG decomposition (weighted average, not average-of-averages)
  // -----------------------------------------------------------------------
  it('AVG: returns correct weighted average budget per team', async () => {
    const result = await semanticLayer.execute(
      {
        measures: ['Departments.avgBudget'],
        dimensions: ['Teams.name'],
        filters: [{ member: 'Employees.id', operator: 'gt', values: [0] }]
      },
      testSecurityContexts.org1
    )

    // AVG is decomposed into sum(col)/count(col) in the agg CTE, then
    // recombined as sum(sums)/sum(counts) in the outer query.
    const expected: Record<string, number> = {
      'Frontend Team': 375000,  // (500k + 250k) / 2
      'Backend Team': 375000,   // (500k + 250k) / 2
      'DevOps Team': 400000,    // (500k + 300k) / 2
      'Data Team': 500000,      // 500k / 1
      'Mobile Team': 375000,    // (500k + 250k) / 2
      'Security Team': 250000   // 250k / 1
    }

    expect(result.data.length).toBe(6)
    for (const row of result.data) {
      const team = String(row['Teams.name'])
      const actual = Number(row['Departments.avgBudget'])
      expect(actual).toBe(expected[team])
    }
  })

  // -----------------------------------------------------------------------
  // D. Mixed measures (regular + multiplied in same query)
  // -----------------------------------------------------------------------
  it('Mixed: combines regular (Employees.totalSalary) and multiplied (Departments.totalBudget) via keysDeduplication', async () => {
    // Query by Departments.name avoids the Teams→EmployeeTeams hasMany chain.
    // The only hasMany detected is Employees→Productivity. Since Employees is
    // the SOURCE of that hasMany, it stays regular. Departments gets
    // fanOutPrevention → multiplied. This triggers keysDeduplication.
    const mixedQuery = {
      measures: ['Employees.totalSalary', 'Departments.totalBudget'],
      dimensions: ['Departments.name']
    }

    const analysis = semanticLayer.analyzeQuery(mixedQuery, testSecurityContexts.org1)
    expect(analysis.querySummary.measureStrategy).toBe('keysDeduplication')

    const result = await semanticLayer.execute(mixedQuery, testSecurityContexts.org1)
    expect(result.data.length).toBeGreaterThan(0)

    // Verify budget matches a pure Departments-only query
    const budgetOnly = await semanticLayer.execute(
      { measures: ['Departments.totalBudget'], dimensions: ['Departments.name'] },
      testSecurityContexts.org1
    )
    const expectedBudget = new Map<string, number>()
    for (const row of budgetOnly.data) {
      expectedBudget.set(String(row['Departments.name']), Number(row['Departments.totalBudget']))
    }

    // Verify salary matches a pure Employees-only query
    const salaryOnly = await semanticLayer.execute(
      { measures: ['Employees.totalSalary'], dimensions: ['Departments.name'] },
      testSecurityContexts.org1
    )
    const expectedSalary = new Map<string, number>()
    for (const row of salaryOnly.data) {
      expectedSalary.set(String(row['Departments.name']), Number(row['Employees.totalSalary']))
    }

    for (const row of result.data) {
      const dept = String(row['Departments.name'])
      const budget = Number(row['Departments.totalBudget'])
      const salary = Number(row['Employees.totalSalary'])

      expect(budget).toBe(expectedBudget.get(dept))
      expect(salary).toBe(expectedSalary.get(dept))
    }
  })

  // -----------------------------------------------------------------------
  // E. Fallback detection for unsupported types
  // -----------------------------------------------------------------------
  it('falls back to ctePreAggregateFallback for countDistinct multiplied measures', async () => {
    const query = {
      measures: ['Departments.count'],
      dimensions: ['Teams.name'],
      filters: [{ member: 'Employees.id', operator: 'gt', values: [0] }]
    }

    const analysis = semanticLayer.analyzeQuery(query, testSecurityContexts.org1)
    // countDistinct is deduplicationSafe, so it should be 'simple' strategy
    // (it passes through without needing keys dedup or CTE fallback)
    expect(analysis.querySummary.measureStrategy).not.toBe('keysDeduplication')
  })

  // -----------------------------------------------------------------------
  // F. Dry-run SQL verification
  // -----------------------------------------------------------------------
  it('generated SQL contains _keys and _pk_agg CTE names', async () => {
    const query = {
      measures: ['Departments.totalBudget'],
      dimensions: ['Teams.name'],
      filters: [{ member: 'Employees.id', operator: 'gt', values: [0] }]
    }

    const dryRun = await handleDryRun(query, testSecurityContexts.org1, semanticLayer)
    // dryRun.sql.sql is an array (parameterized format); extract the SQL string
    const generatedSql = Array.isArray(dryRun.sql?.sql)
      ? dryRun.sql.sql[0]
      : (dryRun.sql?.sql ?? '')

    expect(generatedSql).toContain('departments_keys')
    expect(generatedSql).toContain('departments_pk_agg')
  })

  it('AVG dry-run SQL contains decomposed sum/count columns', async () => {
    const query = {
      measures: ['Departments.avgBudget'],
      dimensions: ['Teams.name'],
      filters: [{ member: 'Employees.id', operator: 'gt', values: [0] }]
    }

    const dryRun = await handleDryRun(query, testSecurityContexts.org1, semanticLayer)
    const generatedSql = Array.isArray(dryRun.sql?.sql)
      ? dryRun.sql.sql[0]
      : (dryRun.sql?.sql ?? '')

    // The agg CTE should contain decomposed avg columns
    expect(generatedSql).toContain('__avg_sum__avgBudget')
    expect(generatedSql).toContain('__avg_count__avgBudget')
  })
})
