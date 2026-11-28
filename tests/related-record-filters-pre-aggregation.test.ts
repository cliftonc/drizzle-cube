/**
 * A cube used only for filtering restricts a joined measure cube on the keys
 * of each join that the two declare to one another, whichever cube the join
 * plan reaches the filter cube from.
 *
 * Topology:
 *   Departments (primary) ──hasMany──→ BookedEntries (measures)
 *   Departments ──hasMany──→ Staff ──hasMany──→ BookedEntries
 *   BookedEntries ──belongsTo──→ Bookers ──hasMany, on other columns──→ BookedEntries
 *   BookedEntries ──belongsTo──→ LinkedEntries ──hasMany, key roles swapped──→ BookedEntries
 *   BookedEntries ──belongsToMany through employees──→ BookerColleagues ──hasMany──→ BookedEntries
 *   BookedEntries ──hasMany, on its department column──→ Colleagues ──belongsTo──→ Departments
 *   BookedEntries ──belongsToMany through employees──→ Officemates ←──hasMany── Departments
 *   BookedEntries ──hasMany, on its department column──→ Workmates
 *   BookedEntries ──hasMany, on its department column, then belongsTo, on its employee column──→ Reviewers ←──hasMany── Departments
 *
 * `departmentJoin` names the cube that declares the join between Departments
 * and BookedEntries. With `BookedEntries`, only BookedEntries declares it, as
 * `belongsTo`. With `both`, each cube declares it, BookedEntries prefers its
 * own for Departments, and Colleagues prefers its own join to Departments.
 * With `unbookedDepartmentId`, BookedEntries leaves out the entries of one
 * department.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { and, eq, ne } from 'drizzle-orm'
import { defineCube } from '../src/server/cube-utils'
import type { Cube, Filter, QueryContext } from '../src/server/types'
import { QueryExecutor } from '../src/server/executor'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import { TestExecutor } from './helpers/test-utilities'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { onRowLevelJoin } from './helpers/row-level-filter'

async function createCubes(
  { unbookedDepartmentId, departmentJoin = 'Departments' }: {
    unbookedDepartmentId?: number
    departmentJoin?: 'Departments' | 'BookedEntries' | 'both'
  } = {}
): Promise<Map<string, Cube>> {
  const { employees, departments, timeEntries } = await getTestSchema()

  let bookedEntriesCube: Cube
  let staffCube: Cube
  let bookersCube: Cube
  let linkedEntriesCube: Cube
  let bookerColleaguesCube: Cube
  let colleaguesCube: Cube
  let officematesCube: Cube
  let workmatesCube: Cube
  let reviewersCube: Cube

  const departmentsCube = defineCube('Departments', {
    sql: (ctx: QueryContext) => ({
      from: departments,
      where: eq(departments.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      ...(departmentJoin !== 'BookedEntries' && {
        BookedEntries: {
          targetCube: () => bookedEntriesCube,
          relationship: 'hasMany',
          on: [{ source: departments.id, target: timeEntries.departmentId }]
        }
      }),
      Staff: {
        targetCube: () => staffCube,
        relationship: 'hasMany',
        on: [{ source: departments.id, target: employees.departmentId }]
      },
      Officemates: {
        targetCube: () => officematesCube,
        relationship: 'hasMany',
        on: [{ source: departments.id, target: employees.departmentId }]
      },
      Reviewers: {
        targetCube: () => reviewersCube,
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

  bookedEntriesCube = defineCube('BookedEntries', {
    sql: (ctx: QueryContext) => ({
      from: timeEntries,
      where: and(
        eq(timeEntries.organisationId, ctx.securityContext.organisationId),
        unbookedDepartmentId === undefined ? undefined : ne(timeEntries.departmentId, unbookedDepartmentId)
      )
    }),
    joins: {
      ...(departmentJoin !== 'Departments' && {
        Departments: {
          targetCube: () => departmentsCube,
          relationship: 'belongsTo',
          on: [{ source: timeEntries.departmentId, target: departments.id }],
          ...(departmentJoin === 'both' && { preferredFor: ['Departments'] })
        }
      }),
      Bookers: {
        targetCube: () => bookersCube,
        relationship: 'belongsTo',
        on: [{ source: timeEntries.employeeId, target: employees.id }]
      },
      LinkedEntries: {
        targetCube: () => linkedEntriesCube,
        relationship: 'belongsTo',
        on: [{ source: timeEntries.employeeId, target: timeEntries.id }]
      },
      Colleagues: {
        targetCube: () => colleaguesCube,
        relationship: 'hasMany',
        on: [{ source: timeEntries.departmentId, target: employees.departmentId }],
        preferredFor: ['Colleagues']
      },
      BookerColleagues: {
        targetCube: () => bookerColleaguesCube,
        relationship: 'belongsToMany',
        on: [],
        preferredFor: ['BookerColleagues'],
        through: {
          table: employees,
          sourceKey: [{ source: timeEntries.employeeId, target: employees.id }],
          targetKey: [{ source: employees.departmentId, target: employees.departmentId }]
        }
      },
      Officemates: {
        targetCube: () => officematesCube,
        relationship: 'belongsToMany',
        on: [],
        through: {
          table: employees,
          sourceKey: [{ source: timeEntries.employeeId, target: employees.id }],
          targetKey: [{ source: employees.departmentId, target: employees.departmentId }]
        }
      },
      Workmates: {
        targetCube: () => workmatesCube,
        relationship: 'hasMany',
        on: [{ source: timeEntries.departmentId, target: employees.departmentId }]
      },
      Reviewers: {
        targetCube: () => reviewersCube,
        relationship: 'hasMany',
        on: [{ source: timeEntries.departmentId, target: employees.departmentId }]
      },
      BookingReviewers: {
        targetCube: () => reviewersCube,
        relationship: 'belongsTo',
        on: [{ source: timeEntries.employeeId, target: employees.id }]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: timeEntries.id, primaryKey: true },
      employeeId: { name: 'employeeId', type: 'number', sql: timeEntries.employeeId },
      departmentId: { name: 'departmentId', type: 'number', sql: timeEntries.departmentId }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: timeEntries.id }
    }
  })

  staffCube = defineCube('Staff', {
    sql: (ctx: QueryContext) => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      BookedEntries: {
        targetCube: () => bookedEntriesCube,
        relationship: 'hasMany',
        on: [{ source: employees.id, target: timeEntries.employeeId }]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true }
    },
    measures: {}
  })

  bookersCube = defineCube('Bookers', {
    sql: (ctx: QueryContext) => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      BookedEntries: {
        targetCube: () => bookedEntriesCube,
        relationship: 'hasMany',
        on: [{ source: employees.departmentId, target: timeEntries.departmentId }]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true }
    },
    measures: {}
  })

  linkedEntriesCube = defineCube('LinkedEntries', {
    sql: (ctx: QueryContext) => ({
      from: timeEntries,
      where: eq(timeEntries.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      BookedEntries: {
        targetCube: () => bookedEntriesCube,
        relationship: 'hasMany',
        on: [{ source: timeEntries.employeeId, target: timeEntries.id }]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: timeEntries.id, primaryKey: true }
    },
    measures: {}
  })

  bookerColleaguesCube = defineCube('BookerColleagues', {
    sql: (ctx: QueryContext) => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      BookedEntries: {
        targetCube: () => bookedEntriesCube,
        relationship: 'hasMany',
        on: [{ source: employees.id, target: timeEntries.employeeId }]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true }
    },
    measures: {}
  })

  colleaguesCube = defineCube('Colleagues', {
    sql: (ctx: QueryContext) => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      Departments: {
        targetCube: () => departmentsCube,
        relationship: 'belongsTo',
        on: [{ source: employees.departmentId, target: departments.id }],
        ...(departmentJoin === 'both' && { preferredFor: ['Departments'] })
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true },
      departmentId: { name: 'departmentId', type: 'number', sql: employees.departmentId }
    },
    measures: {}
  })

  const employeesById = (name: string) => defineCube(name, {
    sql: (ctx: QueryContext) => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),
    dimensions: {
      id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true }
    },
    measures: {}
  })
  officematesCube = employeesById('Officemates')
  workmatesCube = employeesById('Workmates')
  reviewersCube = employeesById('Reviewers')

  return new Map([
    ['Departments', departmentsCube],
    ['BookedEntries', bookedEntriesCube],
    ['Staff', staffCube],
    ['Bookers', bookersCube],
    ['LinkedEntries', linkedEntriesCube],
    ['BookerColleagues', bookerColleaguesCube],
    ['Colleagues', colleaguesCube],
    ['Officemates', officematesCube],
    ['Workmates', workmatesCube],
    ['Reviewers', reviewersCube]
  ])
}

describe('Filters on cubes used only for filtering that join a joined measure cube themselves', () => {
  let dbExecutor: Awaited<ReturnType<typeof createTestDatabaseExecutor>>['executor']
  let testExecutor: TestExecutor
  let close: () => void

  beforeAll(async () => {
    const created = await createTestDatabaseExecutor()
    dbExecutor = created.executor
    close = created.close
    testExecutor = new TestExecutor(new QueryExecutor(dbExecutor), await createCubes(), testSecurityContexts.org1)
  })

  afterAll(() => {
    close?.()
  })

  const entriesByDepartment = async (filters: Filter[]) => (await testExecutor.executeQuery({
    measures: ['BookedEntries.count'],
    dimensions: ['Departments.name'],
    filters
  })).data
    .map(row => ({ department: String(row['Departments.name']), count: Number(row['BookedEntries.count'] ?? 0) }))
    .filter(row => row.count > 0)
    .sort((a, b) => a.department.localeCompare(b.department))

  const colleaguesByDepartment = async () => {
    const colleagues = new Map<number, number[]>()
    for (const row of (await testExecutor.executeQuery({
      dimensions: ['Colleagues.id', 'Colleagues.departmentId'],
      filters: [{ member: 'Colleagues.departmentId', operator: 'set', values: [] }],
      order: { 'Colleagues.id': 'asc' }
    })).data) {
      const departmentId = Number(row['Colleagues.departmentId'])
      colleagues.set(departmentId, [...(colleagues.get(departmentId) ?? []), Number(row['Colleagues.id'])])
    }
    return colleagues
  }

  const bookersOfOneDepartment = async () => {
    const booked = new Set((await testExecutor.executeQuery({ dimensions: ['BookedEntries.employeeId'] })).data
      .map(row => Number(row['BookedEntries.employeeId'])))
    return [...(await colleaguesByDepartment()).values()].map(ids => ids.filter(id => booked.has(id))).find(ids => ids.length > 1) ?? []
  }

  it('should restrict the measure cube through a filter cube that the primary cube joins directly', async () => {
    const [{ 'Departments.id': departmentId }] = (await testExecutor.executeQuery({
      dimensions: ['Departments.id'],
      order: { 'Departments.id': 'asc' }
    })).data
    const [{ 'BookedEntries.employeeId': employeeId }] = (await testExecutor.executeQuery({
      dimensions: ['BookedEntries.employeeId'],
      filters: [{ member: 'BookedEntries.departmentId', operator: 'equals', values: [departmentId] }],
      order: { 'BookedEntries.employeeId': 'asc' }
    })).data
    const expected = await entriesByDepartment([
      { member: 'BookedEntries.employeeId', operator: 'equals', values: [employeeId] },
      { member: 'Departments.id', operator: 'equals', values: [departmentId] }
    ])
    const result = await entriesByDepartment([
      { member: 'Staff.id', operator: 'equals', values: [employeeId] },
      { member: 'Departments.id', operator: 'equals', values: [departmentId] }
    ])

    expect(expected.length).toBe(1)
    expect(result).toEqual(expected)
  })

  it('should restrict the measure cube through a filter cube that joins it back on other columns', async () => {
    const departmentsBooked = new Map<number, Set<number>>()
    for (const row of (await testExecutor.executeQuery({ dimensions: ['BookedEntries.employeeId', 'BookedEntries.departmentId'] })).data) {
      const employeeId = Number(row['BookedEntries.employeeId'])
      departmentsBooked.set(employeeId, new Set([...(departmentsBooked.get(employeeId) ?? []), Number(row['BookedEntries.departmentId'])]))
    }
    const [[departmentId, employeeId]] = [...await colleaguesByDepartment()]
      .flatMap(([department, ids]) => ids.map(id => [department, id]))
      .filter(([, id]) => (departmentsBooked.get(id) ?? new Set()).size > 1)
    const expected = await entriesByDepartment([
      { member: 'BookedEntries.employeeId', operator: 'equals', values: [employeeId] },
      { member: 'BookedEntries.departmentId', operator: 'equals', values: [departmentId] }
    ])
    const result = await entriesByDepartment([{ member: 'Bookers.id', operator: 'equals', values: [employeeId] }])

    expect(expected.length).toBe(1)
    expect(result).toEqual(expected)
  })

  it('should restrict the measure cube through a filter cube on its table that joins it back with the key roles swapped', async () => {
    const [{ 'BookedEntries.employeeId': linkedId }] = (await testExecutor.executeQuery({
      dimensions: ['BookedEntries.employeeId'],
      order: { 'BookedEntries.employeeId': 'asc' }
    })).data
    const [{ 'BookedEntries.employeeId': linkedEmployeeId }] = (await testExecutor.executeQuery({
      dimensions: ['BookedEntries.employeeId'],
      filters: [{ member: 'BookedEntries.id', operator: 'equals', values: [linkedId] }]
    })).data
    const unrestricted = await entriesByDepartment([
      { member: 'BookedEntries.employeeId', operator: 'equals', values: [linkedId] }
    ])
    const expected = await entriesByDepartment([
      { member: 'BookedEntries.employeeId', operator: 'equals', values: [linkedId] },
      { member: 'BookedEntries.id', operator: 'equals', values: [linkedEmployeeId] }
    ])
    const result = await entriesByDepartment([{ member: 'LinkedEntries.id', operator: 'equals', values: [linkedId] }])

    expect(unrestricted).not.toEqual(expected)
    expect(result).toEqual(expected)
  })

  it('should restrict the measure cube through a filter cube that it joins through a junction table on the same keys', async () => {
    const bookers = await bookersOfOneDepartment()
    const expected = await entriesByDepartment([{ member: 'BookedEntries.employeeId', operator: 'equals', values: [bookers[0]] }])
    const departmentWide = await entriesByDepartment([{ member: 'BookedEntries.employeeId', operator: 'in', values: bookers }])
    const result = await entriesByDepartment([{ member: 'BookerColleagues.id', operator: 'equals', values: [bookers[0]] }])

    expect(departmentWide).not.toEqual(expected)
    expect(result).toEqual(expected)
  })

  it('should restrict the measure cube as the row-level plan does through a filter cube that it joins through a junction table', async () => {
    const bookerIds = await bookersOfOneDepartment()
    const officemate: Filter = { member: 'Officemates.id', operator: 'equals', values: [bookerIds[0]] }
    const rowLevel = await entriesByDepartment([onRowLevelJoin(officemate)])
    const throughJunction = await entriesByDepartment([{ member: 'BookedEntries.employeeId', operator: 'in', values: bookerIds }])

    expect(rowLevel.length).toBeGreaterThan(0)
    expect(throughJunction).not.toEqual(rowLevel)
    expect(await entriesByDepartment([officemate])).toEqual(rowLevel)
  })

  it('should count each record once through a filter cube that only the measure cube joins', async () => {
    const [departmentId, colleagueIds] = [...await colleaguesByDepartment()].find(([, ids]) => ids.length > 1) ?? [0, []]
    const workmates: Filter = { member: 'Workmates.id', operator: 'in', values: colleagueIds }
    const expected = await entriesByDepartment([{ member: 'Departments.id', operator: 'equals', values: [departmentId] }])

    expect(expected.length).toBe(1)
    expect(await entriesByDepartment([onRowLevelJoin(workmates)])).not.toEqual(expected)
    expect(await entriesByDepartment([workmates])).toEqual(expected)
  })

  it('should restrict the measure cube as the row-level plan does through a filter cube that it declares two joins to', async () => {
    const [bookerId] = await bookersOfOneDepartment()
    const reviewer: Filter = { member: 'Reviewers.id', operator: 'equals', values: [bookerId] }
    const rowLevel = await entriesByDepartment([onRowLevelJoin(reviewer)])
    const departmentWide = await entriesByDepartment([{ member: 'Colleagues.id', operator: 'equals', values: [bookerId] }])

    expect(rowLevel.length).toBeGreaterThan(0)
    expect(departmentWide).not.toEqual(rowLevel)
    expect(await entriesByDepartment([reviewer])).toEqual(rowLevel)
  })

  it('should count each record once through a filter cube that the measure cube joins on the column that joins it to the primary cube', async () => {
    const [departmentId, colleagueIds] = [...await colleaguesByDepartment()].find(([, ids]) => ids.length > 1) ?? [0, []]
    const expected = await entriesByDepartment([{ member: 'Departments.id', operator: 'equals', values: [departmentId] }])
    const result = await entriesByDepartment([{ member: 'Colleagues.id', operator: 'in', values: colleagueIds }])

    expect(colleagueIds.length).toBeGreaterThan(1)
    expect(expected.length).toBe(1)
    expect(result).toEqual(expected)
  })

  it.each([
    ['only the measure cube declares', 'BookedEntries'],
    ['both cubes declare', 'both']
  ] as const)('should count each record once through that filter cube when %s the join to the primary cube', async (_declares, departmentJoin) => {
    const declared = new TestExecutor(
      new QueryExecutor(dbExecutor),
      await createCubes({ departmentJoin }),
      testSecurityContexts.org1
    )
    const entries = async (filters: Filter[]) => (await declared.executeQuery({
      measures: ['BookedEntries.count'],
      dimensions: ['Departments.name'],
      filters
    })).data
      .map(row => ({ department: String(row['Departments.name']), count: Number(row['BookedEntries.count'] ?? 0) }))
      .filter(row => row.count > 0)
    const [departmentId, colleagueIds] = [...await colleaguesByDepartment()].find(([, ids]) => ids.length > 1) ?? [0, []]
    const expected = await entriesByDepartment([{ member: 'Departments.id', operator: 'equals', values: [departmentId] }])

    expect(colleagueIds.length).toBeGreaterThan(1)
    expect(expected.length).toBe(1)
    expect(await entries([{ member: 'Colleagues.id', operator: 'in', values: colleagueIds }])).toEqual(expected)
  })

  it('should keep no record without measure cube rows when the measure cube joins the filter cube', async () => {
    const [departmentId, colleagueIds] = [...await colleaguesByDepartment()].find(([, ids]) => ids.length > 1) ?? [0, []]
    const unbooked = new TestExecutor(
      new QueryExecutor(dbExecutor),
      await createCubes({ unbookedDepartmentId: departmentId }),
      testSecurityContexts.org1
    )
    const departments = async (filters: Filter[]) => (await unbooked.executeQuery({
      measures: ['BookedEntries.count'],
      dimensions: ['Departments.name'],
      filters
    })).data
    const colleagues: Filter = { member: 'Colleagues.id', operator: 'in', values: colleagueIds }

    expect(colleagueIds.length).toBeGreaterThan(1)
    expect(await departments([onRowLevelJoin(colleagues)])).toEqual([])
    expect(await departments([colleagues])).toEqual([])
  })
})

/**
 * A cube that the query groups by, joined both from the primary cube and from
 * the measure cube. With the filter-only cube joined row by row, the measure
 * cube is pre-aggregated and the grouping cube joins its rows.
 *
 * Topology:
 *   Employees (primary) ──hasMany──→ Entries (measures) ──belongsTo──→ Departments
 *   Employees ──belongsTo──→ Departments ──hasMany──→ Bookings (filter)
 *
 * With `ofDepartment`, Employees joins the entries of its department instead
 * of its own, on the column that joins it to Departments, and Entries leaves
 * out the entries of one department.
 */
async function createGroupingCubes(ofDepartment?: { unbooked: number }): Promise<Map<string, Cube>> {
  const { employees, departments, timeEntries } = await getTestSchema()

  let entriesCube: Cube
  let departmentsCube: Cube
  let bookingsCube: Cube

  const employeesCube = defineCube('Employees', {
    sql: (ctx: QueryContext) => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      Entries: {
        targetCube: () => entriesCube,
        relationship: 'hasMany',
        on: ofDepartment
          ? [{ source: employees.departmentId, target: timeEntries.departmentId }]
          : [{ source: employees.id, target: timeEntries.employeeId }]
      },
      Departments: {
        targetCube: () => departmentsCube,
        relationship: 'belongsTo',
        on: [{ source: employees.departmentId, target: departments.id }]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true },
      name: { name: 'name', type: 'string', sql: employees.name }
    },
    measures: {}
  })

  entriesCube = defineCube('Entries', {
    sql: (ctx: QueryContext) => ({
      from: timeEntries,
      where: and(
        eq(timeEntries.organisationId, ctx.securityContext.organisationId),
        ofDepartment && ne(timeEntries.departmentId, ofDepartment.unbooked)
      )
    }),
    joins: {
      Departments: {
        targetCube: () => departmentsCube,
        relationship: 'belongsTo',
        on: [{ source: timeEntries.departmentId, target: departments.id }]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: timeEntries.id, primaryKey: true },
      employeeId: { name: 'employeeId', type: 'number', sql: timeEntries.employeeId },
      departmentId: { name: 'departmentId', type: 'number', sql: timeEntries.departmentId }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: timeEntries.id }
    }
  })

  departmentsCube = defineCube('Departments', {
    sql: (ctx: QueryContext) => ({
      from: departments,
      where: eq(departments.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      Bookings: {
        targetCube: () => bookingsCube,
        relationship: 'hasMany',
        on: [{ source: departments.id, target: timeEntries.departmentId }]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: departments.id, primaryKey: true }
    },
    measures: {}
  })

  bookingsCube = defineCube('Bookings', {
    sql: (ctx: QueryContext) => ({
      from: timeEntries,
      where: eq(timeEntries.organisationId, ctx.securityContext.organisationId)
    }),
    dimensions: {
      id: { name: 'id', type: 'number', sql: timeEntries.id, primaryKey: true },
      departmentId: { name: 'departmentId', type: 'number', sql: timeEntries.departmentId }
    },
    measures: {}
  })

  return new Map([
    ['Employees', employeesCube],
    ['Entries', entriesCube],
    ['Departments', departmentsCube],
    ['Bookings', bookingsCube]
  ])
}

/**
 * A filter-only cube that the measure cube joins on two columns, where the
 * primary cube's join to it compares one of those pairs and another column.
 *
 * Topology:
 *   Units (primary) ──hasMany, on two columns──→ Entries (measures)
 *   Units ──hasMany, on its department and its id──→ Staff (filter)
 *   Entries ──belongsTo, both columns on its department──→ Staff
 */
async function createCompositeKeyCubes(): Promise<Map<string, Cube>> {
  const { employees, departments, timeEntries } = await getTestSchema()

  let entriesCube: Cube
  let staffCube: Cube

  const unitsCube = defineCube('Units', {
    sql: (ctx: QueryContext) => ({
      from: departments,
      where: eq(departments.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      Entries: {
        targetCube: () => entriesCube,
        relationship: 'hasMany',
        on: [
          { source: departments.id, target: timeEntries.departmentId },
          { source: departments.id, target: timeEntries.employeeId }
        ]
      },
      Staff: {
        targetCube: () => staffCube,
        relationship: 'hasMany',
        on: [
          { source: departments.id, target: employees.departmentId },
          { source: departments.id, target: employees.id }
        ]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: departments.id, primaryKey: true }
    },
    measures: {}
  })

  entriesCube = defineCube('Entries', {
    sql: (ctx: QueryContext) => ({
      from: timeEntries,
      where: eq(timeEntries.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      Staff: {
        targetCube: () => staffCube,
        relationship: 'belongsTo',
        on: [
          { source: timeEntries.departmentId, target: employees.departmentId },
          { source: timeEntries.employeeId, target: employees.departmentId }
        ]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: timeEntries.id, primaryKey: true },
      employeeId: { name: 'employeeId', type: 'number', sql: timeEntries.employeeId },
      departmentId: { name: 'departmentId', type: 'number', sql: timeEntries.departmentId }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: timeEntries.id }
    }
  })

  staffCube = defineCube('Staff', {
    sql: (ctx: QueryContext) => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),
    dimensions: {
      id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true },
      departmentId: { name: 'departmentId', type: 'number', sql: employees.departmentId }
    },
    measures: {}
  })

  return new Map([
    ['Units', unitsCube],
    ['Entries', entriesCube],
    ['Staff', staffCube]
  ])
}

/**
 * A measure cube joined by `hasOne`, which the row-level plan pre-aggregates
 * only because the filter-only cube multiplies rows. The measure cube joins
 * the filter-only cube itself, on other columns than the primary cube does.
 *
 * Topology:
 *   Employees (primary) ──hasOne──→ Departments (measures) ──hasMany──→ Entries (filter)
 *   Employees ──hasMany──→ Entries
 */
async function createHasOneCubes(): Promise<Map<string, Cube>> {
  const { employees, departments, timeEntries } = await getTestSchema()

  let departmentsCube: Cube
  let entriesCube: Cube

  const employeesCube = defineCube('Employees', {
    sql: (ctx: QueryContext) => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      Departments: {
        targetCube: () => departmentsCube,
        relationship: 'hasOne',
        on: [{ source: employees.departmentId, target: departments.id }]
      },
      Entries: {
        targetCube: () => entriesCube,
        relationship: 'hasMany',
        on: [{ source: employees.id, target: timeEntries.employeeId }]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true },
      departmentId: { name: 'departmentId', type: 'number', sql: employees.departmentId }
    },
    measures: {}
  })

  departmentsCube = defineCube('Departments', {
    sql: (ctx: QueryContext) => ({
      from: departments,
      where: eq(departments.organisationId, ctx.securityContext.organisationId)
    }),
    joins: {
      Entries: {
        targetCube: () => entriesCube,
        relationship: 'hasMany',
        on: [{ source: departments.id, target: timeEntries.departmentId }]
      }
    },
    dimensions: {
      id: { name: 'id', type: 'number', sql: departments.id, primaryKey: true }
    },
    measures: {
      count: { name: 'count', type: 'count', sql: departments.id }
    }
  })

  entriesCube = defineCube('Entries', {
    sql: (ctx: QueryContext) => ({
      from: timeEntries,
      where: eq(timeEntries.organisationId, ctx.securityContext.organisationId)
    }),
    dimensions: {
      id: { name: 'id', type: 'number', sql: timeEntries.id, primaryKey: true },
      departmentId: { name: 'departmentId', type: 'number', sql: timeEntries.departmentId }
    },
    measures: {}
  })

  return new Map([
    ['Employees', employeesCube],
    ['Departments', departmentsCube],
    ['Entries', entriesCube]
  ])
}

describe('Filters on cubes used only for filtering beside a cube that a joined measure cube joins itself', () => {
  let dbExecutor: Awaited<ReturnType<typeof createTestDatabaseExecutor>>['executor']
  let close: () => void

  beforeAll(async () => {
    const created = await createTestDatabaseExecutor()
    dbExecutor = created.executor
    close = created.close
  })

  afterAll(() => {
    close?.()
  })

  it('should keep joining a grouping cube on the measure cube rows when the filter-only cube hangs from it', async () => {
    const testExecutor = new TestExecutor(new QueryExecutor(dbExecutor), await createGroupingCubes(), testSecurityContexts.org1)
    const [{ 'Bookings.id': bookingId, 'Bookings.departmentId': departmentId }] = (await testExecutor.executeQuery({
      dimensions: ['Bookings.id', 'Bookings.departmentId'],
      filters: [{ member: 'Bookings.departmentId', operator: 'set', values: [] }],
      order: { 'Bookings.id': 'asc' },
      limit: 1
    })).data
    const byEmployee = (rows: Record<string, unknown>[], idMember: string) => rows
      .map(row => ({ employeeId: Number(row[idMember]), count: Number(row['Entries.count'] ?? 0) }))
      .filter(row => row.count > 0)
      .sort((a, b) => a.employeeId - b.employeeId)
    const expected = byEmployee((await testExecutor.executeQuery({
      measures: ['Entries.count'],
      dimensions: ['Entries.employeeId'],
      filters: [{ member: 'Entries.departmentId', operator: 'equals', values: [departmentId] }]
    })).data, 'Entries.employeeId')
    const result = byEmployee((await testExecutor.executeQuery({
      measures: ['Entries.count'],
      dimensions: ['Employees.id', 'Employees.name', 'Departments.id'],
      filters: [{ member: 'Bookings.id', operator: 'equals', values: [bookingId] }]
    })).data, 'Employees.id')

    expect(expected.length).toBeGreaterThan(0)
    expect(result).toEqual(expected)
  })

  it('should keep no record without measure cube rows when the measure cube joins the grouping cube on the column that joins it to the primary cube', async () => {
    const [{ 'Bookings.id': bookingId, 'Bookings.departmentId': departmentId }] = (await new TestExecutor(
      new QueryExecutor(dbExecutor),
      await createGroupingCubes(),
      testSecurityContexts.org1
    ).executeQuery({
      dimensions: ['Bookings.id', 'Bookings.departmentId'],
      filters: [{ member: 'Bookings.departmentId', operator: 'set', values: [] }],
      order: { 'Bookings.id': 'asc' },
      limit: 1
    })).data
    const testExecutor = new TestExecutor(
      new QueryExecutor(dbExecutor),
      await createGroupingCubes({ unbooked: Number(departmentId) }),
      testSecurityContexts.org1
    )
    const staff = (await testExecutor.executeQuery({
      dimensions: ['Employees.id'],
      filters: [{ member: 'Departments.id', operator: 'equals', values: [departmentId] }]
    })).data
    const entries = async (filters: Filter[]) => (await testExecutor.executeQuery({
      measures: ['Entries.count'],
      dimensions: ['Employees.id', 'Departments.id'],
      filters
    })).data
    const booking: Filter = { member: 'Bookings.id', operator: 'equals', values: [bookingId] }

    expect(staff.length).toBeGreaterThan(0)
    expect(await entries([onRowLevelJoin(booking)])).toEqual([])
    expect(await entries([booking])).toEqual([])
  })

  it('should keep the measure cube restriction when the planned join compares one more column than the declared join', async () => {
    const testExecutor = new TestExecutor(new QueryExecutor(dbExecutor), await createCompositeKeyCubes(), testSecurityContexts.org1)
    const ownEntries = new Map((await testExecutor.executeQuery({
      measures: ['Entries.count'],
      dimensions: ['Entries.departmentId', 'Entries.employeeId']
    })).data
      .filter(row => Number(row['Entries.departmentId']) === Number(row['Entries.employeeId']))
      .map(row => [Number(row['Entries.departmentId']), Number(row['Entries.count'])]))
    const [staff] = (await testExecutor.executeQuery({
      dimensions: ['Staff.id', 'Staff.departmentId'],
      filters: [{ member: 'Staff.departmentId', operator: 'set', values: [] }],
      order: { 'Staff.id': 'asc' }
    })).data
      .map(row => ({ id: Number(row['Staff.id']), departmentId: Number(row['Staff.departmentId']) }))
      .filter(({ id, departmentId }) => id !== departmentId && (ownEntries.get(departmentId) ?? 0) > 0)
    const result = (await testExecutor.executeQuery({
      measures: ['Entries.count'],
      dimensions: ['Units.id'],
      filters: [{ member: 'Staff.id', operator: 'equals', values: [staff.id] }]
    })).data
      .map(row => ({ unitId: Number(row['Units.id']), count: Number(row['Entries.count'] ?? 0) }))
      .filter(row => row.count > 0)

    expect(result).toEqual([{ unitId: staff.departmentId, count: ownEntries.get(staff.departmentId) }])
  })

  it('should test the filter cube from a measure cube joined by hasOne when only the filter cube makes the row-level plan pre-aggregate it', async () => {
    const testExecutor = new TestExecutor(new QueryExecutor(dbExecutor), await createHasOneCubes(), testSecurityContexts.org1)
    const staffed = new Map<number, number>()
    for (const row of (await testExecutor.executeQuery({ dimensions: ['Employees.id', 'Employees.departmentId'] })).data) {
      const departmentId = Number(row['Employees.departmentId'])
      staffed.set(departmentId, (staffed.get(departmentId) ?? 0) + 1)
    }
    const [{ 'Entries.id': entryId }] = (await testExecutor.executeQuery({
      dimensions: ['Entries.id', 'Entries.departmentId'],
      order: { 'Entries.id': 'asc' }
    })).data.filter(row => (staffed.get(Number(row['Entries.departmentId'])) ?? 0) > 1)
    const departmentsByEmployee = async (filters: Filter[]) => (await testExecutor.executeQuery({
      measures: ['Departments.count'],
      dimensions: ['Employees.id'],
      filters
    })).data
      .map(row => ({ employeeId: Number(row['Employees.id']), count: Number(row['Departments.count'] ?? 0) }))
      .sort((a, b) => a.employeeId - b.employeeId)
    const entry: Filter = { member: 'Entries.id', operator: 'equals', values: [entryId] }
    const rowLevel = await departmentsByEmployee([onRowLevelJoin(entry)])

    expect(rowLevel.length).toBeGreaterThan(1)
    expect(await departmentsByEmployee([entry])).toEqual(rowLevel)
  })
})
