import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, QueryContext, SemanticQuery } from '../src/server/types'
import { QueryExecutor } from '../src/server/executor'
import { createTestDatabaseExecutor, getTestDatabaseType, getTestSchema } from './helpers/test-database'
import { TestExecutor } from './helpers/test-utilities'
import { testSecurityContexts } from './helpers/enhanced-test-data'

async function createCubes(): Promise<Map<string, Cube>> {
  const { employees, timeEntries } = await getTestSchema()

  const employeesCube = defineCube('Employees', {
    sql: (ctx: QueryContext) => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),
    dimensions: {
      id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true },
      departmentId: { name: 'departmentId', type: 'number', sql: employees.departmentId }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: employees.id },
      activeCount: {
        name: 'activeCount',
        type: 'count',
        sql: employees.id,
        filters: [() => eq(employees.active, true)]
      },
      activePercentage: {
        name: 'activePercentage',
        type: 'calculated',
        calculatedSql: '({activeCount} / NULLIF({count}, 0)) * 100'
      },
      commentedActivePercentage: {
        name: 'commentedActivePercentage',
        type: 'calculated',
        calculatedSql: '({activeCount} /* active over all */ / NULLIF({count}, 0)) * 100'
      },
      activeCountPlusOne: {
        name: 'activeCountPlusOne',
        type: 'calculated',
        calculatedSql: '{activeCount} + 1.0'
      },
      previousActivePercentage: {
        name: 'previousActivePercentage',
        type: 'lag',
        windowConfig: {
          measure: 'activePercentage',
          operation: 'raw',
          orderBy: [{ field: 'departmentId', direction: 'asc' }]
        }
      },
      activeCountPlusOneRatio: {
        name: 'activeCountPlusOneRatio',
        type: 'lag',
        windowConfig: {
          measure: 'activeCountPlusOne',
          operation: 'ratio',
          orderBy: [{ field: 'departmentId', direction: 'asc' }]
        }
      }
    }
  })

  const timeEntriesCube = defineCube('TimeEntries', {
    sql: (ctx: QueryContext) => ({
      from: timeEntries,
      where: eq(timeEntries.organisationId, ctx.securityContext.organisationId)
    }),
    dimensions: {
      id: { name: 'id', type: 'number', sql: timeEntries.id, primaryKey: true },
      departmentId: { name: 'departmentId', type: 'number', sql: timeEntries.departmentId }
    },
    measures: {
      totalHours: { name: 'totalHours', type: 'sum', sql: timeEntries.hours },
      totalBillableHours: { name: 'totalBillableHours', type: 'sum', sql: timeEntries.billableHours },
      billableShare: {
        name: 'billableShare',
        type: 'calculated',
        calculatedSql: '{totalBillableHours} / NULLIF({totalHours}, 0)'
      }
    }
  })

  return new Map([
    ['Employees', employeesCube],
    ['TimeEntries', timeEntriesCube]
  ])
}

describe('Calculated measures of a single cube', () => {
  let testExecutor: TestExecutor
  let close: () => void
  let activeCounts: Map<number, number>
  let expected: Map<number, number>

  const byDepartment: Pick<SemanticQuery, 'dimensions' | 'filters' | 'order'> = {
    dimensions: ['Employees.departmentId'],
    filters: [{ member: 'Employees.departmentId', operator: 'set', values: [] }],
    order: { 'Employees.departmentId': 'asc' }
  }

  async function measureByDepartment(query: SemanticQuery, measure: string): Promise<Map<number, number | null>> {
    const result = await testExecutor.executeQuery(query)
    return new Map(result.data.map(row => [
      Number(row['Employees.departmentId']),
      row[measure] === null ? null : Number(row[measure])
    ]))
  }

  beforeAll(async () => {
    const created = await createTestDatabaseExecutor()
    close = created.close
    testExecutor = new TestExecutor(new QueryExecutor(created.executor), await createCubes(), testSecurityContexts.org1)

    const counts = await testExecutor.executeQuery({ ...byDepartment, measures: ['Employees.activeCount', 'Employees.count'] })
    activeCounts = new Map(counts.data.map(row => [
      Number(row['Employees.departmentId']),
      Number(row['Employees.activeCount'])
    ]))
    expected = new Map(counts.data.map(row => [
      Number(row['Employees.departmentId']),
      Number(row['Employees.activeCount']) / Number(row['Employees.count']) * 100
    ]))
  })

  afterAll(() => {
    close?.()
  })

  it('should divide the counts of a ratio without truncating', async () => {
    expect([...expected.values()].some(percentage => percentage > 0 && percentage < 100)).toBe(true)

    const actual = await measureByDepartment(
      { ...byDepartment, measures: ['Employees.activePercentage'] },
      'Employees.activePercentage'
    )

    expect([...actual.keys()]).toEqual([...expected.keys()])
    for (const [departmentId, percentage] of expected) {
      expect(actual.get(departmentId)).toBeCloseTo(percentage, 2)
    }
  })

  it('should keep a block comment after a numerator as a comment', async () => {
    const actual = await measureByDepartment(
      { ...byDepartment, measures: ['Employees.commentedActivePercentage'] },
      'Employees.commentedActivePercentage'
    )

    expect([...actual.keys()]).toEqual([...expected.keys()])
  })

  it('should divide two real sums in double precision, or decimal sums at MySQL decimal scale', async () => {
    const result = await testExecutor.executeQuery({
      dimensions: ['TimeEntries.departmentId'],
      measures: ['TimeEntries.totalBillableHours', 'TimeEntries.totalHours', 'TimeEntries.billableShare']
    })
    expect(result.data.length).toBeGreaterThan(0)

    for (const row of result.data) {
      const billableShare = Number(row['TimeEntries.totalBillableHours']) / Number(row['TimeEntries.totalHours'])
      const error = Math.abs(Number(row['TimeEntries.billableShare']) - billableShare)
      if (getTestDatabaseType() === 'mysql') {
        expect(error).toBeLessThanOrEqual(0.5e-6)
      } else {
        expect(error / billableShare).toBeLessThan(1e-12)
      }
    }
  })

  it('should filter groups on a calculated measure', async () => {
    const qualifying = [...expected].filter(([, percentage]) => percentage > 60 && percentage < 100).map(([departmentId]) => departmentId)
    expect(qualifying.length).toBeGreaterThan(0)
    expect(qualifying.length).toBeLessThan(expected.size)

    const actual = await measureByDepartment(
      {
        ...byDepartment,
        measures: ['Employees.count'],
        filters: [
          ...byDepartment.filters!,
          { member: 'Employees.activePercentage', operator: 'gt', values: [60] },
          { member: 'Employees.activePercentage', operator: 'lt', values: [100] }
        ]
      },
      'Employees.count'
    )

    expect([...actual.keys()]).toEqual(qualifying)
  })

  it('should compute a window function over a calculated measure', async () => {
    const departmentIds = [...expected.keys()]
    expect(departmentIds.length).toBeGreaterThan(1)

    const actual = await measureByDepartment(
      { ...byDepartment, measures: ['Employees.previousActivePercentage'] },
      'Employees.previousActivePercentage'
    )

    expect([...actual.keys()]).toEqual(departmentIds)
    expect(actual.get(departmentIds[0])).toBeNull()
    for (let index = 1; index < departmentIds.length; index++) {
      expect(actual.get(departmentIds[index])).toBeCloseTo(expected.get(departmentIds[index - 1])!, 2)
    }
  })

  it('should divide the whole calculated base in a window ratio', async () => {
    const departmentIds = [...activeCounts.keys()]
    expect(new Set(activeCounts.values()).size).toBeGreaterThan(1)

    const actual = await measureByDepartment(
      { ...byDepartment, measures: ['Employees.activeCountPlusOneRatio'] },
      'Employees.activeCountPlusOneRatio'
    )

    expect([...actual.keys()]).toEqual(departmentIds)
    for (let index = 1; index < departmentIds.length; index++) {
      const current = activeCounts.get(departmentIds[index])! + 1
      const previous = activeCounts.get(departmentIds[index - 1])! + 1
      expect(actual.get(departmentIds[index])).toBeCloseTo(current / previous, 4)
    }
  })
})
