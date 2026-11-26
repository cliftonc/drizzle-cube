import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { aliasedTable, and, eq, gte, sql } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import type { BaseQueryDefinition, Cube, CubeJoin, QueryContext, SemanticQuery } from '../src/server/types'
import { QueryExecutor } from '../src/server/executor'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import { TestExecutor } from './helpers/test-utilities'
import { testSecurityContexts } from './helpers/enhanced-test-data'

async function createCubes(): Promise<Map<string, Cube>> {
  const { employees, departments, productivity } = await getTestSchema()

  let employeesCube: Cube
  let departmentsCube: Cube
  let activeEmployeesCube: Cube
  let productivityCube: Cube

  departmentsCube = defineCube('Departments', {
    sql: (ctx: QueryContext) => ({
      from: departments,
      where: eq(departments.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      Employees: {
        targetCube: () => employeesCube,
        relationship: 'hasMany',
        on: [{ source: departments.id, target: employees.departmentId }]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: departments.id, primaryKey: true },
      name: { name: 'name', type: 'string', sql: departments.name },
      size: {
        name: 'size',
        type: 'string',
        sql: sql`CASE WHEN ${departments.budget} >= 200000 THEN 'large' ELSE 'small' END`
      }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: departments.id }
    }
  })

  employeesCube = defineCube('Employees', {
    sql: (ctx: QueryContext) => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      Departments: {
        targetCube: () => departmentsCube,
        relationship: 'belongsTo',
        on: [{ source: employees.departmentId, target: departments.id }]
      },
      ActiveEmployees: {
        targetCube: () => activeEmployeesCube,
        relationship: 'hasMany',
        on: [{ source: employees.id, target: employees.id }]
      },
      Productivity: {
        targetCube: () => productivityCube,
        relationship: 'hasMany',
        on: [{ source: employees.id, target: productivity.employeeId }]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true },
      departmentId: { name: 'departmentId', type: 'number', sql: employees.departmentId },
      label: { name: 'label', type: 'string', sql: sql`COALESCE(${employees.email}, 'none')` },
      createdAt: { name: 'createdAt', type: 'time', sql: employees.createdAt }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: employees.id },
      countWithDefault: { name: 'countWithDefault', type: 'count', sql: sql`COALESCE(${employees.id}, 0)` },
      distinctWithDefault: { name: 'distinctWithDefault', type: 'countDistinct', sql: sql`COALESCE(${employees.id}, 0)` },
      countRows: { name: 'countRows', type: 'number', sql: sql`COUNT(*)` },
      firstDepartmentCount: {
        name: 'firstDepartmentCount', type: 'number', sql: sql`COUNT(${employees.id})`,
        filters: [() => eq(employees.departmentId, 1)]
      },
      countRemainder: { name: 'countRemainder', type: 'calculated', calculatedSql: '{count} % {count}' },
      totalSalary: { name: 'totalSalary', type: 'sum', sql: employees.salary },
      distinctCount: { name: 'distinctCount', type: 'number', sql: sql`COUNT(DISTINCT ${employees.id})` },
      organisations: { name: 'organisations', type: 'countDistinct', sql: employees.organisationId },
      doubled: { name: 'doubled', type: 'calculated', calculatedSql: '{distinctCount} * 2' },
      quadrupled: { name: 'quadrupled', type: 'calculated', calculatedSql: '{doubled} * 2' },
      withOrganisations: { name: 'withOrganisations', type: 'calculated', calculatedSql: '{count} + {organisations}' },
      withSalary: { name: 'withSalary', type: 'calculated', calculatedSql: '{count} + {totalSalary}' },
      organisationsPerEmployee: { name: 'organisationsPerEmployee', type: 'calculated', calculatedSql: '{organisations} / NULLIF({count}, 0)' },
      organisationsPerHundred: { name: 'organisationsPerHundred', type: 'calculated', calculatedSql: '{organisationsPerEmployee} * 100' },
      unguardedRatio: { name: 'unguardedRatio', type: 'calculated', calculatedSql: '{distinctCount} / {count}' },
      unguardedPercent: { name: 'unguardedPercent', type: 'calculated', calculatedSql: '{unguardedRatio} * 100' },
      commented: { name: 'commented', type: 'calculated', calculatedSql: '{count} * 2 /* doubled */' },
      runningCount: { name: 'runningCount', type: 'movingSum', windowConfig: { measure: 'distinctCount' } }
    }
  })

  activeEmployeesCube = defineCube('ActiveEmployees', {
    sql: (ctx: QueryContext) => ({
      from: employees,
      where: and(eq(employees.active, true), eq(employees.organisationId, ctx.securityContext.organisationId))
    }),
    dimensions: {
      id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true }
    },
    measures: {
      distinctCount: { name: 'distinctCount', type: 'number', sql: sql`COUNT(DISTINCT ${employees.id})` }
    }
  })

  productivityCube = defineCube('Productivity', {
    sql: (ctx: QueryContext) => ({
      from: productivity,
      where: eq(productivity.organisationId, ctx.securityContext.organisationId)
    }),
    dimensions: {
      id: { name: 'id', type: 'number', sql: productivity.id, primaryKey: true },
      happinessIndex: { name: 'happinessIndex', type: 'number', sql: productivity.happinessIndex }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: productivity.id },
      distinctCount: { name: 'distinctCount', type: 'number', sql: sql`COUNT(DISTINCT ${productivity.id})` }
    }
  })

  return new Map([
    ['Departments', departmentsCube],
    ['Employees', employeesCube],
    ['ActiveEmployees', activeEmployeesCube],
    ['Productivity', productivityCube]
  ])
}

describe('Measures of a lone hasMany cube joined without a pre-aggregation CTE', () => {
  let testExecutor: TestExecutor
  let close: () => void
  let departments: Array<{ id: number; name: string; size: string }>
  let employeeDepartments: number[]

  beforeAll(async () => {
    const created = await createTestDatabaseExecutor()
    close = created.close
    testExecutor = new TestExecutor(new QueryExecutor(created.executor), await createCubes(), testSecurityContexts.org1)
    departments = (await testExecutor.executeQuery({ dimensions: ['Departments.id', 'Departments.name', 'Departments.size'] })).data
      .map(row => ({ id: Number(row['Departments.id']), name: String(row['Departments.name']), size: String(row['Departments.size']) }))
    employeeDepartments = (await testExecutor.executeQuery({ dimensions: ['Employees.id', 'Employees.departmentId'] })).data
      .filter(row => row['Employees.departmentId'] != null)
      .map(row => Number(row['Employees.departmentId']))
  })

  afterAll(() => {
    close?.()
  })

  function expected(group: (department: { id: number; name: string; size: string }) => string, value: (employees: number) => number, included = departments) {
    const totals = new Map<string, number>()
    for (const department of included) {
      const employees = employeeDepartments.filter(id => id === department.id).length
      totals.set(group(department), (totals.get(group(department)) ?? 0) + employees)
    }
    return Object.fromEntries([...totals].map(([key, employees]) => [key, value(employees)]))
  }

  async function rows(query: SemanticQuery, dimension: string): Promise<Record<string, unknown>> {
    const result = await testExecutor.executeQuery(query)
    const [measure] = query.measures ?? []
    return Object.fromEntries(result.data.map(row => [String(row[dimension]), row[measure] == null ? null : Number(row[measure])]))
  }

  it('should count every employee of a size group, where main returns the count of its largest department', async () => {
    const departmentsWithEmployees = (size: string) => departments.filter(department => department.size === size && employeeDepartments.includes(department.id))
    expect(['large', 'small'].some(size => departmentsWithEmployees(size).length > 1)).toBe(true)

    expect(await rows({ measures: ['Employees.distinctCount'], dimensions: ['Departments.size'] }, 'Departments.size'))
      .toEqual(expected(department => department.size, employees => employees))
  })

  it('should count each organisation once per size group, where main adds up one per department', async () => {
    expect(await rows({ measures: ['Employees.organisations'], dimensions: ['Departments.size'] }, 'Departments.size'))
      .toEqual(expected(department => department.size, employees => employees > 0 ? 1 : 0))
  })

  it('should count a department with no employees as zero, where main returns null', async () => {
    const counts = expected(department => String(department.id), employees => employees)
    expect(Object.values(counts)).toContain(0)

    for (const measure of ['Employees.count', 'Employees.distinctCount']) {
      expect(await rows({ measures: [measure], dimensions: ['Departments.id'] }, 'Departments.id')).toEqual(counts)
    }
  })

  it('should retain departments with zero pre-aggregated counts when filtering for zero', async () => {
    const emptyIds = departments.filter(department => !employeeDepartments.includes(department.id))
      .map(department => department.id).sort((a, b) => a - b)
    expect(emptyIds.length).toBeGreaterThan(0)

    const query: SemanticQuery = {
      dimensions: ['Departments.id'],
      measures: ['Employees.count', 'Employees.organisations', 'Employees.totalSalary'],
      filters: [{ member: 'Employees.count', operator: 'equals', values: [0] }],
      order: { 'Departments.id': 'asc' }
    }
    const { data } = await testExecutor.executeQuery(query)
    expect(data.map(row => Number(row['Departments.id']))).toEqual(emptyIds)
    for (const row of data) {
      expect(row['Employees.count']).not.toBeNull()
      expect(Number(row['Employees.count'])).toBe(0)
      expect(row['Employees.organisations']).not.toBeNull()
      expect(Number(row['Employees.organisations'])).toBe(0)
      expect(row['Employees.totalSalary']).toBeNull()
    }
  })

  it.each(['countWithDefault', 'distinctWithDefault'])('should exclude a missing child from %s', async field => {
    const expectedCounts = expected(department => String(department.id), employees => employees)
    expect(Object.values(expectedCounts)).toContain(0)

    await expect(rows({
      dimensions: ['Departments.id'],
      measures: [`Employees.${field}`]
    }, 'Departments.id')).resolves.toEqual(expectedCounts)
  })

  it('should keep a raw row count inside pre-aggregation', async () => {
    const expectedCounts = expected(department => String(department.id), employees => employees)
    const result = await rows({
      dimensions: ['Departments.id'],
      measures: ['Employees.countRows']
    }, 'Departments.id')

    expect(result).toEqual(Object.fromEntries(
      Object.entries(expectedCounts).map(([id, count]) => [id, count || null])
    ))
  })

  it('should group a filtered raw count by its child key before the parent join', async () => {
    const counts = expected(department => String(department.id), employees => employees)
    const result = await rows({
      dimensions: ['Departments.id'],
      measures: ['Employees.firstDepartmentCount']
    }, 'Departments.id')

    expect(result).toEqual(Object.fromEntries(Object.entries(counts).map(
      ([id, count]) => [id, id === '1' ? count : null]
    )))
  })

  it('should evaluate a remainder formula before joining to empty parents', async () => {
    const counts = expected(department => String(department.id), employees => employees)
    const result = await rows({
      dimensions: ['Departments.id'],
      measures: ['Employees.countRemainder']
    }, 'Departments.id')

    expect(result).toEqual(Object.fromEntries(Object.entries(counts).map(
      ([id, count]) => [id, count > 0 ? 0 : null]
    )))
  })

  it('should count only the employees of departments that a primary-key filter keeps', async () => {
    const kept = departments.filter(department => employeeDepartments.includes(department.id)).slice(0, 3)

    expect(await rows({
      measures: ['Employees.distinctCount'],
      dimensions: ['Departments.size'],
      filters: [{ member: 'Departments.id', operator: 'equals', values: kept.map(department => department.id) }]
    }, 'Departments.size')).toEqual(expected(department => department.size, employees => employees, kept))
  })

  it('should build calculated measures from the counts of every employee of a size group, where main doubles the count of its largest department', async () => {
    const result = await testExecutor.executeQuery({ measures: ['Employees.doubled', 'Employees.quadrupled', 'Employees.withOrganisations'], dimensions: ['Departments.size'] })

    const values = (measure: string) => Object.fromEntries(result.data.map(row => [String(row['Departments.size']), Number(row[measure])]))
    expect(values('Employees.doubled')).toEqual(expected(department => department.size, employees => employees * 2))
    expect(values('Employees.quadrupled')).toEqual(expected(department => department.size, employees => employees * 4))
    expect(values('Employees.withOrganisations')).toEqual(expected(department => department.size, employees => employees + (employees > 0 ? 1 : 0)))
  })

  it('should divide the organisations of each size group by its employees, where main adds up the ratio per department', async () => {
    const result = await testExecutor.executeQuery({ measures: ['Employees.organisationsPerEmployee', 'Employees.organisationsPerHundred'], dimensions: ['Departments.size'] })

    const employees = expected(department => department.size, count => count)
    const organisations = expected(department => department.size, count => count > 0 ? 1 : 0)
    for (const row of result.data) {
      const size = String(row['Departments.size'])
      expect(Number(row['Employees.organisationsPerEmployee'])).toBeCloseTo(organisations[size] / employees[size], 3)
      expect(Number(row['Employees.organisationsPerHundred'])).toBeCloseTo(organisations[size] * 100 / employees[size], 1)
    }
    expect(result.data).toHaveLength(Object.keys(employees).length)
  })

  it('should give a department with no employees zero calculated counts and no ratio, where main returns null for both', async () => {
    const counts = expected(department => String(department.id), employees => employees)
    const empty = Object.keys(counts).filter(id => counts[id] === 0)
    expect(empty.length).toBeGreaterThan(0)

    const result = await testExecutor.executeQuery({ measures: ['Employees.organisationsPerEmployee', 'Employees.doubled'], dimensions: ['Departments.id'] })
    const emptyRows = result.data.filter(row => empty.includes(String(row['Departments.id'])))
    expect(emptyRows).toHaveLength(empty.length)
    for (const row of emptyRows) {
      expect(row['Employees.doubled']).not.toBeNull()
      expect(Number(row['Employees.doubled'])).toBe(0)
      expect(row['Employees.organisationsPerEmployee']).toBeNull()
    }
  })

  it('should keep the pre-aggregation for an unguarded ratio, so a department with no employees gives null and no division by zero', async () => {
    const counts = expected(department => String(department.id), employees => employees)

    const result = await testExecutor.executeQuery({ measures: ['Employees.unguardedRatio', 'Employees.unguardedPercent'], dimensions: ['Departments.id'] })
    expect(result.data).toHaveLength(Object.keys(counts).length)
    for (const row of result.data) {
      const id = String(row['Departments.id'])
      if (counts[id] === 0) {
        expect(row['Employees.unguardedRatio']).toBeNull()
        expect(row['Employees.unguardedPercent']).toBeNull()
      } else {
        expect(Number(row['Employees.unguardedRatio'])).toBe(1)
        expect(Number(row['Employees.unguardedPercent'])).toBe(100)
      }
    }
  })

  it('should order, page and total the department counts', async () => {
    const counts = Object.entries(expected(department => String(department.id), employees => employees))
      .map(([id, count]) => ({ id: Number(id), count }))
      .sort((a, b) => b.count - a.count || a.id - b.id)

    const result = await testExecutor.executeQuery({
      measures: ['Employees.count'],
      dimensions: ['Departments.id'],
      order: { 'Employees.count': 'desc', 'Departments.id': 'asc' },
      limit: 3,
      offset: 1,
      total: true
    })

    expect(result.data.map(row => ({ id: Number(row['Departments.id']), count: Number(row['Employees.count']) }))).toEqual(counts.slice(1, 4))
    expect(result.total).toBe(counts.length)
  })
})

describe('Queries off the plain-join list keep the pre-aggregation CTE', () => {
  let queryExecutor: QueryExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    const created = await createTestDatabaseExecutor()
    close = created.close
    queryExecutor = new QueryExecutor(created.executor)
    cubes = await createCubes()
  })

  afterAll(() => {
    close?.()
  })

  async function plannedSql(query: SemanticQuery, adjust: (cubes: Map<string, Cube>) => Map<string, Cube> = map => map): Promise<string> {
    return (await queryExecutor.generateMultiCubeSQL(adjust(new Map(cubes)), query, testSecurityContexts.org1)).sql
  }

  function withPlannedJoin(change: (join: CubeJoin) => CubeJoin) {
    return (map: Map<string, Cube>) => {
      const departmentsCube = map.get('Departments')!
      return map.set('Departments', { ...departmentsCube, joins: { Employees: change(departmentsCube.joins!.Employees) } })
    }
  }

  function withOwnJoin(cubeName: string) {
    return (map: Map<string, Cube>) => {
      const cube = map.get(cubeName)!
      return map.set(cubeName, {
        ...cube,
        sql: (ctx: QueryContext) => ({ ...cube.sql(ctx), joins: [{ table: departmentsTable, type: 'left' as const, on: sql`1 = 1` }] })
      })
    }
  }

  let departmentsTable: Awaited<ReturnType<typeof getTestSchema>>['departments']
  let employeesTable: Awaited<ReturnType<typeof getTestSchema>>['employees']

  beforeAll(async () => {
    const schema = await getTestSchema()
    departmentsTable = schema.departments
    employeesTable = schema.employees
  })

  const s1 = { measures: ['Employees.distinctCount'], dimensions: ['Departments.size'] }

  it('should plan the allowed shape as a plain join', async () => {
    for (const query of [
      s1,
      { measures: ['Employees.count'], dimensions: ['Departments.name'] },
      { measures: ['Employees.organisations'], dimensions: ['Departments.name'], filters: [{ member: 'Departments.id', operator: 'gt' as const, values: [0] }] },
      { measures: ['Employees.quadrupled', 'Employees.withOrganisations'], dimensions: ['Departments.size'] },
      { measures: ['Employees.organisationsPerEmployee', 'Employees.organisationsPerHundred'], dimensions: ['Departments.size'] }
    ]) {
      expect(await plannedSql(query)).not.toContain('employees_agg')
    }
  })

  it.each<[string, SemanticQuery, ((cubes: Map<string, Cube>) => Map<string, Cube>)?]>([
    ['a sum measure', { ...s1, measures: ['Employees.totalSalary'] }],
    ['a calculated measure over a measure off the list', { ...s1, measures: ['Employees.withSalary'] }],
    ['a calculated measure that divides without NULLIF', { ...s1, measures: ['Employees.unguardedRatio'] }],
    ['a calculated measure over one that divides without NULLIF', { ...s1, measures: ['Employees.unguardedPercent'] }],
    ['a calculated measure with a comment', { ...s1, measures: ['Employees.commented'] }],
    ['a window measure over the cube (S19)', { ...s1, measures: ['Employees.runningCount'] }],
    ['a primary-cube measure next to it', { ...s1, measures: ['Employees.distinctCount', 'Departments.count'] }],
    ['a measure filter (S18)', { ...s1, filters: [{ member: 'Employees.distinctCount', operator: 'gt', values: [1] }] }],
    ['a primary-cube filter off the primary key', { ...s1, filters: [{ member: 'Departments.name', operator: 'set', values: [] }] }],
    ['a filter on its own dimension', { ...s1, filters: [{ member: 'Employees.departmentId', operator: 'set', values: [] }] }],
    ['a date range on its own time dimension', { ...s1, timeDimensions: [{ dimension: 'Employees.createdAt', dateRange: ['2000-01-01', '2100-01-01'] }] }],
    ['a time dimension at two granularities (S20)', { ...s1, timeDimensions: [{ dimension: 'Employees.createdAt', granularity: 'day' }, { dimension: 'Employees.createdAt', granularity: 'month' }] }],
    ['its own join-key dimension (S17)', { ...s1, dimensions: ['Departments.size', 'Employees.departmentId'] }],
    ['its own expression dimension', { ...s1, dimensions: ['Departments.size', 'Employees.label'] }],
    ['a cube joined through it (downstream keys, S21)', { ...s1, dimensions: ['Departments.size', 'Productivity.happinessIndex'] }],
    ['a join compared with its own operator', s1, withPlannedJoin(join => ({ ...join, on: join.on.map(pair => ({ ...pair, as: (source, target) => gte(source, target) })) }))],
    ['an inner planned join', s1, withPlannedJoin(join => ({ ...join, sqlJoinType: 'inner' }))],
    ['a right planned join', s1, withPlannedJoin(join => ({ ...join, sqlJoinType: 'right' }))],
    ['a join from a column other than the primary key', s1, withPlannedJoin(join => ({ ...join, on: [{ source: departmentsTable.organisationId, target: employeesTable.organisationId }] }))],
    ['a join on two key pairs', s1, withPlannedJoin(join => ({ ...join, on: [...join.on, { source: departmentsTable.organisationId, target: employeesTable.organisationId }] }))],
    ['a primary cube that joins a table of its own (S16)', s1, withOwnJoin('Departments')],
    ['a hasMany cube that joins a table of its own', s1, withOwnJoin('Employees')],
    ['a hasMany cube on the primary cube table', { measures: ['ActiveEmployees.distinctCount'], dimensions: ['Employees.id'] }],
    ['a funnel', { ...s1, funnel: { bindingKey: 'Employees.id', timeDimension: 'Employees.createdAt', steps: [] } }],
    ['a flow', { ...s1, flow: { bindingKey: 'Employees.id', timeDimension: 'Employees.createdAt', eventDimension: 'Employees.label', startingStep: { name: 'start', filter: { member: 'Employees.label', operator: 'equals', values: ['none'] } }, stepsBefore: 1, stepsAfter: 1 } }],
    ['a retention', { ...s1, retention: { timeDimension: 'Employees.createdAt', bindingKey: 'Employees.id', dateRange: { start: '2024-01-01', end: '2024-12-31' }, granularity: 'week', periods: 2, retentionType: 'classic' } }],
    ['a hasMany cube reached through another cube', { measures: ['Productivity.distinctCount'], dimensions: ['Departments.size'] }]
  ])('should keep the CTE for %s', async (_shape, query, adjust) => {
    expect(await plannedSql(query, adjust)).toMatch(/_agg/)
  })

  it('should plan the allowed shape as a plain join when another cube only filters it, because that cube is tested for existence and not joined', async () => {
    const query: SemanticQuery = { ...s1, filters: [{ member: 'Productivity.happinessIndex', operator: 'gt', values: [5] }] }

    expect(await plannedSql(query)).not.toMatch(/_agg/)
  })
})

async function createDeclaredJoinCubes(): Promise<Map<string, Cube>> {
  const { employees, departments, timeEntries } = await getTestSchema()

  let departmentsCube: Cube
  let employeesCube: Cube
  let timeEntriesCube: Cube

  departmentsCube = defineCube('Departments', {
    sql: (ctx: QueryContext) => ({
      from: departments,
      where: eq(departments.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      Employees: {
        targetCube: () => employeesCube,
        relationship: 'hasMany',
        on: [{ source: departments.id, target: employees.departmentId }]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: departments.id, primaryKey: true },
      name: { name: 'name', type: 'string', sql: departments.name }
    },
    measures: {}
  })

  employeesCube = defineCube('Employees', {
    sql: (ctx: QueryContext) => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      Departments: {
        targetCube: () => departmentsCube,
        relationship: 'belongsTo',
        on: [{ source: employees.departmentId, target: departments.id }],
        preferredFor: ['Departments']
      },
      TimeEntries: {
        targetCube: () => timeEntriesCube,
        relationship: 'hasMany',
        on: [{ source: employees.departmentId, target: timeEntries.departmentId }],
        preferredFor: ['TimeEntries']
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true },
      departmentId: { name: 'departmentId', type: 'number', sql: employees.departmentId }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: employees.id },
      distinctCount: { name: 'distinctCount', type: 'number', sql: sql`COUNT(DISTINCT ${employees.id})` }
    }
  })

  timeEntriesCube = defineCube('TimeEntries', {
    sql: (ctx: QueryContext) => ({
      from: timeEntries,
      where: eq(timeEntries.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      Departments: {
        targetCube: () => departmentsCube,
        relationship: 'belongsTo',
        on: [{ source: timeEntries.departmentId, target: departments.id }],
        preferredFor: ['Departments']
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: timeEntries.id, primaryKey: true },
      departmentId: { name: 'departmentId', type: 'number', sql: timeEntries.departmentId },
      allocationType: { name: 'allocationType', type: 'string', sql: timeEntries.allocationType }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: timeEntries.id }
    }
  })

  return new Map([
    ['Departments', departmentsCube],
    ['Employees', employeesCube],
    ['TimeEntries', timeEntriesCube]
  ])
}

describe('A lone hasMany cube whose join to the primary cube it declares itself', () => {
  let queryExecutor: QueryExecutor
  let cubes: Map<string, Cube>
  let testExecutor: TestExecutor
  let close: () => void
  let employeesByDepartment: Map<string, number>

  beforeAll(async () => {
    const created = await createTestDatabaseExecutor()
    close = created.close
    queryExecutor = new QueryExecutor(created.executor)
    cubes = await createDeclaredJoinCubes()
    testExecutor = new TestExecutor(queryExecutor, cubes, testSecurityContexts.org1)
    const departmentNames = new Map((await testExecutor.executeQuery({ dimensions: ['Departments.id', 'Departments.name'] })).data
      .map(row => [Number(row['Departments.id']), String(row['Departments.name'])]))
    employeesByDepartment = new Map([...departmentNames.values()].map(name => [name, 0]))
    for (const row of (await testExecutor.executeQuery({ dimensions: ['Employees.id', 'Employees.departmentId'] })).data) {
      const name = departmentNames.get(Number(row['Employees.departmentId']))
      if (name !== undefined) employeesByDepartment.set(name, employeesByDepartment.get(name)! + 1)
    }
  })

  afterAll(() => {
    close?.()
  })

  it('should count each employee once through the join that the employee cube declares to the department', async () => {
    const query: SemanticQuery = { measures: ['Employees.count', 'Employees.distinctCount'], dimensions: ['Departments.name'] }

    const result = await testExecutor.executeQuery(query)

    expect((await queryExecutor.generateMultiCubeSQL(cubes, query, testSecurityContexts.org1)).sql).not.toMatch(/_agg/)
    for (const measure of ['Employees.count', 'Employees.distinctCount']) {
      expect(new Map(result.data.map(row => [String(row['Departments.name']), Number(row[measure])]))).toEqual(employeesByDepartment)
    }
  })

  it('should count each employee once in a department whose key a matching time entry carries', async () => {
    const entries = (await testExecutor.executeQuery({
      measures: ['TimeEntries.count'],
      dimensions: ['TimeEntries.departmentId', 'TimeEntries.allocationType']
    })).data
    const allocationType = String(entries[0]['TimeEntries.allocationType'])
    const matching = new Set(entries
      .filter(row => row['TimeEntries.allocationType'] === allocationType)
      .map(row => Number(row['TimeEntries.departmentId'])))
    const names = new Map((await testExecutor.executeQuery({ dimensions: ['Departments.id', 'Departments.name'] })).data
      .map(row => [String(row['Departments.name']), Number(row['Departments.id'])]))
    const expected = new Map([...employeesByDepartment].filter(([name, count]) => count > 0 && matching.has(names.get(name)!)))
    expect([...entries].filter(row => row['TimeEntries.allocationType'] === allocationType).some(row => Number(row['TimeEntries.count']) > 1)).toBe(true)

    const result = await testExecutor.executeQuery({
      measures: ['Employees.count'],
      dimensions: ['Departments.name'],
      filters: [{ member: 'TimeEntries.allocationType', operator: 'equals', values: [allocationType] }]
    })

    expect(new Map(result.data
      .filter(row => Number(row['Employees.count'] ?? 0) > 0)
      .map(row => [String(row['Departments.name']), Number(row['Employees.count'])]))).toEqual(expected)
  })
})

async function createInternalJoinCubes(internalJoins: 'aliased' | 'withTeams' | 'primaryTable' | 'rawSql'): Promise<Map<string, Cube>> {
  const { employees, departments, employeeTeams } = await getTestSchema()
  const homeDepartment = aliasedTable(departments, 'home_department')

  let departmentsCube: Cube
  let staffCube: Cube

  const internalJoinsFor = (): NonNullable<BaseQueryDefinition['joins']> => {
    const homeJoin = {
      table: homeDepartment,
      on: and(eq(employees.departmentId, homeDepartment.id), gte(homeDepartment.budget, 250000))!,
      type: 'inner' as const
    }
    if (internalJoins === 'withTeams') return [homeJoin, { table: employeeTeams, on: eq(employees.id, employeeTeams.employeeId), type: 'left' }]
    if (internalJoins === 'primaryTable') return [{ table: departments, on: eq(employees.departmentId, departments.id), type: 'inner' }]
    if (internalJoins === 'rawSql') return [homeJoin, { table: sql`(select 1 as one) as one_row`, on: sql`1 = 1`, type: 'left' }]
    return [homeJoin]
  }

  departmentsCube = defineCube('Departments', {
    sql: (ctx: QueryContext) => ({
      from: departments,
      where: eq(departments.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      Staff: {
        targetCube: () => staffCube,
        relationship: 'hasMany',
        on: [{ source: departments.id, target: employees.departmentId }]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: departments.id, primaryKey: true }
    },
    measures: {}
  })

  staffCube = defineCube('Staff', {
    sql: (ctx: QueryContext): BaseQueryDefinition => ({
      from: employees,
      joins: internalJoinsFor(),
      where: internalJoins === 'primaryTable'
        ? eq(employees.organisationId, ctx.securityContext.organisationId)
        : and(eq(employees.organisationId, ctx.securityContext.organisationId), eq(homeDepartment.organisationId, ctx.securityContext.organisationId))!
    }),
    dimensions: {
      id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true },
      departmentId: { name: 'departmentId', type: 'number', sql: employees.departmentId }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: employees.id },
      distinctCount: { name: 'distinctCount', type: 'number', sql: sql`COUNT(DISTINCT ${employees.id})` },
      distinctIds: { name: 'distinctIds', type: 'countDistinct', sql: employees.id }
    }
  })

  return new Map([
    ['Departments', departmentsCube],
    ['Staff', staffCube]
  ])
}

describe('A lone hasMany cube with internal joins of its own', () => {
  let queryExecutor: QueryExecutor
  let close: () => void
  let departmentIds: number[]
  let staffedDepartments: Set<number>

  beforeAll(async () => {
    const created = await createTestDatabaseExecutor()
    close = created.close
    queryExecutor = new QueryExecutor(created.executor)
    const plain = new TestExecutor(queryExecutor, await createCubes(), testSecurityContexts.org1)
    departmentIds = (await plain.executeQuery({ dimensions: ['Departments.id'] })).data.map(row => Number(row['Departments.id']))
    staffedDepartments = new Set((await plain.executeQuery({ dimensions: ['Employees.id', 'Employees.departmentId'] })).data
      .map(row => Number(row['Employees.departmentId'])))
  })

  afterAll(() => {
    close?.()
  })

  const measures = ['Staff.count', 'Staff.distinctCount', 'Staff.distinctIds']

  async function compare(internalJoins: Parameters<typeof createInternalJoinCubes>[0]) {
    const cubes = await createInternalJoinCubes(internalJoins)
    const testExecutor = new TestExecutor(queryExecutor, cubes, testSecurityContexts.org1)
    const alone = new Map((await testExecutor.executeQuery({ measures, dimensions: ['Staff.departmentId'] })).data
      .map(row => [Number(row['Staff.departmentId']), row]))
    const query: SemanticQuery = { measures, dimensions: ['Departments.id'] }
    const result = new Map((await testExecutor.executeQuery(query)).data.map(row => [Number(row['Departments.id']), row]))
    const value = (row: Record<string, unknown> | undefined, measure: string) => row?.[measure] == null ? null : Number(row[measure])
    return {
      sql: (await queryExecutor.generateMultiCubeSQL(cubes, query, testSecurityContexts.org1)).sql,
      expected: (measure: string) => new Map(departmentIds.map(id => [id, value(alone.get(id), measure) ?? 0])),
      actual: (measure: string) => new Map(departmentIds.map(id => [id, value(result.get(id), measure)]))
    }
  }

  it('should keep a department whose employees the internal join drops, with zero counts', async () => {
    const { sql: plannedSql, expected, actual } = await compare('aliased')
    expect([...expected('Staff.count')].some(([id, count]) => count === 0 && staffedDepartments.has(id))).toBe(true)

    expect(plannedSql).not.toMatch(/_agg/)
    for (const measure of measures) {
      expect(actual(measure)).toEqual(expected(measure))
    }
  })

  it('should count the rows a one-to-many internal join adds and distinct employees once', async () => {
    const { sql: plannedSql, expected, actual } = await compare('withTeams')
    expect([...expected('Staff.count')].some(([id, count]) => count > expected('Staff.distinctIds').get(id)!)).toBe(true)

    expect(plannedSql).not.toMatch(/_agg/)
    for (const measure of measures) {
      expect(actual(measure)).toEqual(expected(measure))
    }
  })

  it.each([
    ['an internal join on the primary cube table', 'primaryTable' as const],
    ['an internal join on raw SQL', 'rawSql' as const]
  ])('should keep the CTE for %s', async (_shape, internalJoins) => {
    const { sql: plannedSql, expected, actual } = await compare(internalJoins)

    expect(plannedSql).toMatch(/_agg/)
    for (const measure of measures) {
      expect(new Map([...actual(measure)].map(([id, count]) => [id, count ?? 0]))).toEqual(expected(measure))
    }
  })
})
