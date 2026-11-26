import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { aliasedTable, and, eq, lt, sql } from 'drizzle-orm'
import type { BaseQueryDefinition, Cube, DatabaseExecutor, Filter, QueryContext, SemanticQuery } from '../src/server/types'
import { QueryExecutor } from '../src/server/executor'
import { defineCube } from '../src/server/cube-utils'
import { createTestDatabaseExecutor, getTestDatabaseType, getTestSchema } from './helpers/test-database'
import { getTestCubes } from './helpers/test-cubes'
import { TestExecutor } from './helpers/test-utilities'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { onRowLevelJoin } from './helpers/row-level-filter'

describe('Filters on cubes used only for filtering', () => {
  let testExecutor: TestExecutor
  let dbExecutor: DatabaseExecutor
  let close: () => void

  beforeAll(async () => {
    const database = await createTestDatabaseExecutor()
    dbExecutor = database.executor
    close = database.close
    testExecutor = new TestExecutor(new QueryExecutor(dbExecutor), await getTestCubes(), testSecurityContexts.org1)
  })

  afterAll(() => {
    close?.()
  })

  async function measure(name: string, filters: Filter[]): Promise<number> {
    const query: SemanticQuery = { measures: [name], filters }
    const result = await testExecutor.executeQuery(query)
    return Number(result.data[0]?.[name] ?? 0)
  }

  async function distinctValues(dimension: string, filters: Filter[] = []): Promise<Array<string | number>> {
    const result = await testExecutor.executeQuery({ dimensions: [dimension], filters })
    return result.data.map(row => row[dimension] as string | number).filter(value => value !== null)
  }

  async function measureForIds(name: string, idMember: string, ids: Array<string | number>): Promise<number> {
    if (ids.length === 0) return 0
    return measure(name, [{ member: idMember, operator: 'in', values: ids }])
  }

  it('should count each employee once when a hasMany filter matches several rows and a measure filter applies', async () => {
    const dayOff: Filter = { member: 'Productivity.isDayOff', operator: 'equals', values: [true] }
    const employeeIds = await distinctValues('Productivity.employeeId', [dayOff])
    const expected = await measureForIds('Employees.totalSalary', 'Employees.id', employeeIds)
    const withEmployees: Filter = { member: 'Employees.count', operator: 'gt', values: [0] }

    expect(employeeIds.length).toBeGreaterThan(0)
    expect(await measure('Employees.totalSalary', [dayOff, withEmployees])).toBe(expected)
  })

  async function staffSquadsAndDays(): Promise<Map<string, Cube>> {
    const { employees, teams, employeeTeams, productivity } = await getTestSchema()
    const squads: Cube = defineCube('Squads', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: teams,
        where: eq(teams.organisationId, ctx.securityContext.organisationId as number)
      }),
      dimensions: { name: { name: 'name', type: 'string', sql: teams.name } },
      measures: {}
    })
    const days: Cube = defineCube('Days', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: productivity,
        where: eq(productivity.organisationId, ctx.securityContext.organisationId as number)
      }),
      dimensions: {
        isDayOff: { name: 'isDayOff', type: 'boolean', sql: productivity.daysOff },
        staffId: { name: 'staffId', type: 'number', sql: productivity.employeeId }
      },
      measures: {}
    })
    const staff: Cube = defineCube('Staff', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: employees,
        where: eq(employees.organisationId, ctx.securityContext.organisationId as number)
      }),
      joins: {
        Squads: {
          targetCube: () => squads,
          relationship: 'belongsToMany',
          on: [],
          through: {
            table: employeeTeams,
            sourceKey: [{ source: employees.id, target: employeeTeams.employeeId }],
            targetKey: [{ source: employeeTeams.teamId, target: teams.id }],
            securitySql: securityContext => eq(employeeTeams.organisationId, securityContext.organisationId as number)
          }
        },
        Days: { targetCube: () => days, relationship: 'hasMany', on: [{ source: employees.id, target: productivity.employeeId }] }
      },
      dimensions: { id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true } },
      measures: { totalSalary: { name: 'totalSalary', type: 'sum', sql: employees.salary } }
    })
    return new Map([['Staff', staff], ['Squads', squads], ['Days', days]])
  }

  it('should count each employee once per team when a hasMany filter and a measure filter apply beside a team dimension', async () => {
    const cubes = await staffSquadsAndDays()
    const execute = (query: SemanticQuery) => new QueryExecutor(dbExecutor).execute(cubes, query, testSecurityContexts.org1)
    const salaryByTeam = async (filters: Filter[]) => (await execute({ measures: ['Staff.totalSalary'], dimensions: ['Squads.name'], filters, order: { 'Squads.name': 'asc' } })).data
    const dayOff: Filter = { member: 'Days.isDayOff', operator: 'equals', values: [true] }
    const withSalary: Filter = { member: 'Staff.totalSalary', operator: 'gt', values: [0] }
    const staffIds = (await execute({ dimensions: ['Days.staffId'], filters: [dayOff] })).data
      .map(row => row['Days.staffId'])
      .filter(value => value !== null)

    expect(staffIds.length).toBeGreaterThan(0)
    expect(await salaryByTeam([dayOff, withSalary])).toEqual(
      await salaryByTeam([{ member: 'Staff.id', operator: 'in', values: staffIds }, withSalary])
    )
  })

  it('should count each membership once per team when the filter-only cube hangs from the measure cube', async () => {
    const dayOff: Filter = { member: 'Productivity.isDayOff', operator: 'equals', values: [true] }
    const employeeIds = new Set((await distinctValues('Productivity.employeeId', [dayOff])).map(Number))
    const memberships = await testExecutor.executeQuery({
      measures: ['EmployeeTeams.count'],
      dimensions: ['EmployeeTeams.teamId', 'EmployeeTeams.employeeId']
    })
    const expected = new Map<number, number>()
    for (const row of memberships.data) {
      if (!employeeIds.has(Number(row['EmployeeTeams.employeeId']))) continue
      const teamId = Number(row['EmployeeTeams.teamId'])
      expected.set(teamId, (expected.get(teamId) ?? 0) + Number(row['EmployeeTeams.count']))
    }

    const result = await testExecutor.executeQuery({
      measures: ['EmployeeTeams.count'],
      dimensions: ['Teams.id'],
      filters: [dayOff]
    })
    const actual = new Map(
      result.data
        .map(row => [Number(row['Teams.id']), Number(row['EmployeeTeams.count'])] as const)
        .filter(([, count]) => count > 0)
    )

    expect(expected.size).toBeGreaterThan(0)
    expect(actual).toEqual(expected)
  })

  it('should count each membership once for one team when a filter on the team key applies beside the filter-only cube', async () => {
    const dayOff: Filter = { member: 'Productivity.isDayOff', operator: 'equals', values: [true] }
    const employeeIds = await distinctValues('Productivity.employeeId', [dayOff])
    const [{ 'EmployeeTeams.teamId': teamId }] = (await testExecutor.executeQuery({
      dimensions: ['EmployeeTeams.teamId'],
      filters: [{ member: 'EmployeeTeams.employeeId', operator: 'in', values: employeeIds }],
      order: { 'EmployeeTeams.teamId': 'asc' }
    })).data
    const expected = await measure('EmployeeTeams.count', [
      { member: 'EmployeeTeams.teamId', operator: 'equals', values: [teamId] },
      { member: 'EmployeeTeams.employeeId', operator: 'in', values: employeeIds }
    ])

    const result = await testExecutor.executeQuery({
      measures: ['EmployeeTeams.count'],
      dimensions: ['Teams.id'],
      filters: [dayOff, { member: 'Teams.id', operator: 'equals', values: [teamId] }]
    })

    expect(expected).toBeGreaterThan(0)
    expect(result.data.map(row => [row['Teams.id'], Number(row['EmployeeTeams.count'])])).toEqual([[teamId, expected]])
  })

  async function leadWhoIsAlsoAMember(): Promise<{ name: unknown; ledTeams: Set<unknown>; teamsWithALead: Set<unknown> }> {
    const memberships = (await testExecutor.executeQuery({
      dimensions: ['EmployeeTeams.teamId', 'EmployeeTeams.role', 'EmployeeTeams.employeeId']
    })).data
    const leads = memberships.filter(row => row['EmployeeTeams.role'] === 'lead')
    const candidates = [...new Set(leads.map(row => Number(row['EmployeeTeams.employeeId'])))].sort((a, b) => a - b).map(employeeId => ({
      employeeId,
      ledTeams: new Set(leads.filter(row => Number(row['EmployeeTeams.employeeId']) === employeeId).map(row => row['EmployeeTeams.teamId'])),
      teamsWithALead: new Set(leads
        .map(row => row['EmployeeTeams.teamId'])
        .filter(teamId => memberships.some(row => row['EmployeeTeams.teamId'] === teamId && Number(row['EmployeeTeams.employeeId']) === employeeId)))
    }))
    const [lead] = candidates.filter(candidate => candidate.teamsWithALead.size > candidate.ledTeams.size)
    const [name] = await distinctValues('Employees.name', [{ member: 'Employees.id', operator: 'equals', values: [lead.employeeId] }])
    return { name, ledTeams: lead.ledTeams, teamsWithALead: lead.teamsWithALead }
  }

  it('should count a team once when one membership meets the filters on both cubes along its path', async () => {
    const lead = await leadWhoIsAlsoAMember()
    const result = await testExecutor.executeQuery({
      measures: ['Teams.count'],
      dimensions: ['Teams.id'],
      filters: [
        { member: 'EmployeeTeams.role', operator: 'equals', values: ['lead'] },
        { member: 'Employees.name', operator: 'equals', values: [lead.name] },
        { member: 'Teams.count', operator: 'gt', values: [0] }
      ]
    })

    expect(lead.teamsWithALead.size).toBeGreaterThan(lead.ledTeams.size)
    expect(new Set(result.data.map(row => row['Teams.id']))).toEqual(lead.ledTeams)
    expect(result.data.map(row => Number(row['Teams.count']))).toEqual(result.data.map(() => 1))
  })

  it('should answer as the row-level plan does when that plan starts from a cube the query only filters by', async () => {
    const lead = await leadWhoIsAlsoAMember()
    const isLead: Filter = { member: 'EmployeeTeams.role', operator: 'equals', values: ['lead'] }
    const named: Filter = { member: 'Employees.name', operator: 'equals', values: [lead.name] }
    const withTeams: Filter = { member: 'Teams.count', operator: 'gt', values: [0] }
    const cubes = await getTestCubes()
    const joined = await outcome(cubes, { measures: ['Teams.count'], filters: [onRowLevelJoin(isLead), onRowLevelJoin(named), withTeams] })

    expect(await outcome(cubes, { measures: ['Teams.count'], filters: [isLead, named, withTeams] })).toEqual(joined)
  })

  it('should test filters on two cubes along the join path the planner prefers against one membership', async () => {
    const memberships = (await testExecutor.executeQuery({
      dimensions: ['EmployeeTeams.teamId', 'EmployeeTeams.role', 'EmployeeTeams.employeeId', 'Teams.name']
    })).data
    const employeesWith = (match: (row: Record<string, unknown>) => boolean) =>
      new Set(memberships.filter(match).map(row => row['EmployeeTeams.employeeId']))
    const [role, teamName] = memberships
      .map(row => [row['EmployeeTeams.role'], row['Teams.name']] as [string, string])
      .find(([candidateRole, candidateTeam]) => {
        const inTeamWithRole = employeesWith(row => row['EmployeeTeams.role'] === candidateRole && row['Teams.name'] === candidateTeam)
        const withRole = employeesWith(row => row['EmployeeTeams.role'] === candidateRole)
        const inTeam = employeesWith(row => row['Teams.name'] === candidateTeam)
        return [...withRole].filter(id => inTeam.has(id)).length > inTeamWithRole.size
      }) ?? []
    const expected = employeesWith(row => row['EmployeeTeams.role'] === role && row['Teams.name'] === teamName).size

    expect(role).toBeDefined()
    expect(await measure('Employees.count', [
      { member: 'EmployeeTeams.role', operator: 'equals', values: [role] },
      { member: 'Teams.name', operator: 'equals', values: [teamName] }
    ])).toBe(expected)
  })

  it('should not require a related row when a filter on a filter-only cube has no values', async () => {
    const allEmployees = await distinctValues('Employees.id')

    expect(await measure('Employees.count', [{ member: 'EmployeeTeams.role', operator: 'in', values: [] }])).toBe(allEmployees.length)
  })

  it('should keep only the rows of the joined cube that meet the filter when the join fans out', async () => {
    const memberships = (await testExecutor.executeQuery({ dimensions: ['EmployeeTeams.teamId', 'EmployeeTeams.employeeId'] })).data
    const employeeId = memberships[0]['EmployeeTeams.employeeId'] as number
    const [employeeName] = await distinctValues('Employees.name', [{ member: 'Employees.id', operator: 'equals', values: [employeeId] }])

    const result = await testExecutor.executeQuery({
      dimensions: ['Teams.id', 'Teams.name', 'EmployeeTeams.employeeId'],
      filters: [{ member: 'Employees.name', operator: 'equals', values: [employeeName] }]
    })

    expect(result.data.length).toBeGreaterThan(0)
    expect(new Set(result.data.map(row => row['EmployeeTeams.employeeId']))).toEqual(new Set([employeeId]))
  })

  it('should count the same employees for a negative filter on a filter-only cube as when the query joins that cube', async () => {
    const [excludedTeam] = await distinctValues('Teams.name')
    const notInTeam: Filter = { member: 'Teams.name', operator: 'notEquals', values: [excludedTeam] }

    expect(await measure('Employees.count', [notInTeam])).toBe(await measure('Employees.count', [onRowLevelJoin(notInTeam)]))
  })

  it('should count employees with no membership for an unset role as when the query joins the membership cube', async () => {
    const noRole: Filter = { member: 'EmployeeTeams.role', operator: 'notSet', values: [] }
    const allEmployees = await distinctValues('Employees.id')

    const joined = await measure('Employees.count', [{ or: [noRole] }])
    expect(joined).toBeGreaterThan(0)
    expect(joined).toBeLessThan(allEmployees.length)
    expect(await measure('Employees.count', [noRole])).toBe(joined)
  })

  it('should require a team for a filter on the team cube that has no values, as the inner join does', async () => {
    const noTeamNames: Filter = { member: 'Teams.name', operator: 'in', values: [] }
    const allEmployees = await distinctValues('Employees.id')

    const joined = await measure('Employees.count', [{ or: [noTeamNames] }])
    expect(joined).toBeLessThan(allEmployees.length)
    expect(await measure('Employees.count', [noTeamNames])).toBe(joined)
  })

  it('should require a membership that meets the junction security for a filter on a belongsToMany cube with no values or only dropped values', async () => {
    const cubes = await staffSquadsAndDays()
    const execute = (query: SemanticQuery) => new QueryExecutor(dbExecutor).execute(cubes, query, testSecurityContexts.org1)
    const staffIds = async (filters: Filter[]) => (await execute({ dimensions: ['Staff.id'], filters, order: { 'Staff.id': 'asc' } })).data
    const everyone = await staffIds([])

    for (const values of [[], [''], ['\x00']]) {
      const noSquadNames: Filter = { member: 'Squads.name', operator: 'in', values }
      const joined = await staffIds([{ or: [noSquadNames] }])
      expect(joined.length).toBeGreaterThan(0)
      expect(joined.length).toBeLessThan(everyone.length)
      expect(await staffIds([noSquadNames])).toEqual(joined)
    }
  })

  it('should generate the SQL of the row-level join for a filter on a filter-only cube that has no values or only dropped values', async () => {
    const executor = new QueryExecutor(dbExecutor)
    const sqlOf = (cubes: Map<string, Cube>, query: SemanticQuery) => executor.generateMultiCubeSQL(cubes, query, testSecurityContexts.org1)
    const shared = await getTestCubes()
    const staffCubes = await staffSquadsAndDays()
    const queries: Array<[Map<string, Cube>, SemanticQuery, string]> = [
      [shared, { measures: ['Employees.totalSalary'] }, 'EmployeeTeams.role'],
      [shared, { measures: ['Employees.count'] }, 'Teams.name'],
      [staffCubes, { dimensions: ['Staff.id'] }, 'Squads.name']
    ]

    for (const values of [[], [''], ['\x00']]) {
      for (const [cubes, query, member] of queries) {
        const noValues: Filter = { member, operator: 'in', values }
        const joined = await sqlOf(cubes, { ...query, filters: [{ or: [noValues] }] })
        expect(joined.sql).toMatch(/ join /i)
        expect(await sqlOf(cubes, { ...query, filters: [noValues] })).toEqual(joined)
      }
    }
  })

  async function accountsAndSales(accountsName = 'Accounts'): Promise<{ accounts: Cube; sales: Cube }> {
    const { employees, departments } = await getTestSchema()
    const representative = aliasedTable(employees, 'account_representative')
    const accounts: Cube = defineCube(accountsName, {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: departments,
        where: eq(departments.organisationId, ctx.securityContext.organisationId as number),
        joins: [{
          table: representative,
          on: and(
            eq(representative.departmentId, departments.id),
            eq(representative.organisationId, departments.organisationId),
            eq(representative.email, 'alex.chen@company.com')
          )!,
          type: 'left'
        }]
      }),
      joins: { Sales: { targetCube: () => sales, relationship: 'hasOne', on: [{ source: representative.id, target: employees.id }] } },
      dimensions: { name: { name: 'name', type: 'string', sql: departments.name } },
      measures: { count: { name: 'count', type: 'countDistinct', sql: departments.id } }
    })
    const sales: Cube = defineCube('Sales', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: employees,
        where: eq(employees.organisationId, ctx.securityContext.organisationId as number)
      }),
      joins: { [accountsName]: { targetCube: () => accounts, relationship: 'belongsTo', on: [{ source: employees.departmentId, target: departments.id }] } },
      dimensions: {},
      measures: {
        count: { name: 'count', type: 'count', sql: employees.id },
        accountCount: { name: 'accountCount', type: 'calculated', calculatedSql: `{${accountsName}.count}` }
      }
    })
    return { accounts, sales }
  }

  function cubeMap(...cubes: Cube[]): Map<string, Cube> {
    return new Map(cubes.map(cube => [cube.name, cube]))
  }

  async function salesCount(cubes: Map<string, Cube>, filters: Filter[]): Promise<number> {
    const result = await new QueryExecutor(dbExecutor).execute(cubes, { measures: ['Sales.count'], filters }, testSecurityContexts.org1)
    return Number(result.data[0]?.['Sales.count'] ?? 0)
  }

  async function accountWithItsOwnSale(accounts: Cube, sales: Cube): Promise<{ name: unknown; headcount: number }> {
    const ownSales = (await new QueryExecutor(dbExecutor).execute(
      cubeMap(accounts, sales),
      { dimensions: [`${accounts.name}.name`], measures: ['Sales.count'] },
      testSecurityContexts.org1
    )).data.filter(row => Number(row['Sales.count']) > 0).map(row => row[`${accounts.name}.name`])
    const headcounts = (await testExecutor.executeQuery({
      dimensions: ['Departments.name'],
      measures: ['Employees.count'],
      filters: [{ member: 'Departments.name', operator: 'in', values: ownSales }]
    })).data
    const account = headcounts.find(row => Number(row['Employees.count']) > 1)
    return { name: account?.['Departments.name'], headcount: Number(account?.['Employees.count']) }
  }

  it('should follow the row-level join path for a negative filter when the existence path would start from another cube', async () => {
    const { accounts, sales } = await accountsAndSales()
    const cubes = cubeMap(accounts, sales)
    const department = await staffedDepartment()
    const notInAccount: Filter = { member: 'Accounts.name', operator: 'notEquals', values: [department.name] }
    const notInEither: Filter = { or: [notInAccount, { member: 'Accounts.name', operator: 'notEquals', values: ['No such account'] }] }

    expect(await salesCount(cubes, [notInAccount])).toBe(await salesCount(cubes, [onRowLevelJoin(notInAccount)]))
    expect(await salesCount(cubes, [notInEither])).toBe(await salesCount(cubes, [onRowLevelJoin(notInEither)]))
  })

  it.each<[string, (name: unknown) => Filter]>([
    ['a filter', name => ({ member: 'Accounts.name', operator: 'equals', values: [name] })],
    ['an or group', name => ({
      or: [
        { member: 'Accounts.name', operator: 'equals', values: [name] },
        { member: 'Accounts.name', operator: 'equals', values: ['No such account'] }
      ]
    })]
  ])('should test %s through the join of the row-level plan when each cube declares another join to the other', async (_, inAccount) => {
    const { accounts, sales } = await accountsAndSales()
    const cubes = cubeMap(accounts, sales)
    const account = await accountWithItsOwnSale(accounts, sales)
    const filter = inAccount(account.name)

    expect(account.headcount).toBeGreaterThan(1)
    expect(await salesCount(cubes, [onRowLevelJoin(filter)])).toBe(1)
    expect(await salesCount(cubes, [filter])).toBe(1)
  })

  it.each([
    ['a measure of the cube it counts', 'Sales.count'],
    ['a calculated measure that reads the filtered cube', 'Sales.accountCount']
  ])('should count the sales of the row-level plan beside an or group on %s that stays on the row-level join', async (_, measured) => {
    const { accounts, sales } = await accountsAndSales()
    const cubes = cubeMap(accounts, sales)
    const account = await accountWithItsOwnSale(accounts, sales)
    const inAccount: Filter = { member: 'Accounts.name', operator: 'equals', values: [account.name] }
    const counted: Filter = {
      or: [
        { member: measured, operator: 'gt', values: [0] },
        { member: 'Sales.count', operator: 'notSet', values: [] }
      ]
    }

    expect(account.headcount).toBeGreaterThan(1)
    expect(await salesCount(cubes, [onRowLevelJoin(inAccount), counted])).toBe(1)
    expect(await salesCount(cubes, [inAccount, counted])).toBe(1)
  })

  async function accountsZonesAndNoSales(): Promise<{ accounts: Cube; zones: Cube; sales: Cube }> {
    const { employees, departments, timeEntries } = await getTestSchema()
    const zones: Cube = defineCube('Zones', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: departments,
        where: eq(departments.organisationId, ctx.securityContext.organisationId as number)
      }),
      dimensions: { name: { name: 'name', type: 'string', sql: departments.name } },
      measures: { count: { name: 'count', type: 'countDistinct', sql: departments.id } }
    })
    const accounts: Cube = defineCube('Accounts', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: employees,
        where: eq(employees.organisationId, ctx.securityContext.organisationId as number)
      }),
      joins: { Zones: { targetCube: () => zones, relationship: 'hasOne', on: [{ source: employees.departmentId, target: departments.id }] } },
      dimensions: { id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true } },
      measures: {}
    })
    const sales: Cube = defineCube('Sales', {
      sql: (): BaseQueryDefinition => ({ from: timeEntries, where: lt(timeEntries.id, 0) }),
      joins: { Zones: { targetCube: () => zones, relationship: 'belongsTo', on: [{ source: timeEntries.departmentId, target: departments.id }] } },
      dimensions: { id: { name: 'id', type: 'number', sql: timeEntries.id, primaryKey: true } },
      measures: { count: { name: 'count', type: 'count', sql: timeEntries.id } }
    })
    return { accounts, zones, sales }
  }

  async function outcome(cubes: Map<string, Cube>, query: SemanticQuery): Promise<Array<Record<string, unknown>> | 'fails'> {
    return new QueryExecutor(dbExecutor).execute(cubes, query, testSecurityContexts.org1).then(result => result.data, () => 'fails')
  }

  async function accountInAZone(cubes: Map<string, Cube>): Promise<Filter> {
    const [account] = (await new QueryExecutor(dbExecutor).execute(
      cubes, { dimensions: ['Accounts.id', 'Zones.name'], order: { 'Accounts.id': 'asc' } }, testSecurityContexts.org1
    )).data.filter(row => row['Zones.name'] !== null)
    return { member: 'Accounts.id', operator: 'equals', values: [account['Accounts.id']] }
  }

  it('should keep the group of a record with no measure rows when only the filtered cube declares the join', async () => {
    const { employees, departments } = await getTestSchema()
    const sales: Cube = defineCube('Sales', {
      sql: (): BaseQueryDefinition => ({ from: employees, where: lt(employees.id, 0) }),
      dimensions: { id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true } },
      measures: { count: { name: 'count', type: 'count', sql: employees.id } }
    })
    const accounts: Cube = defineCube('Accounts', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: departments,
        where: eq(departments.organisationId, ctx.securityContext.organisationId as number)
      }),
      joins: { Sales: { targetCube: () => sales, relationship: 'hasOne', on: [{ source: departments.id, target: employees.departmentId }] } },
      dimensions: { name: { name: 'name', type: 'string', sql: departments.name } },
      measures: {}
    })
    const cubes = cubeMap(accounts, sales)
    const department = await staffedDepartment()
    const inAccount: Filter = { member: 'Accounts.name', operator: 'equals', values: [department.name] }
    const salesById = (filters: Filter[]) => outcome(cubes, { measures: ['Sales.count'], dimensions: ['Sales.id'], filters })
    const joined = await salesById([onRowLevelJoin(inAccount)])

    expect(joined).toEqual([{ 'Sales.id': null, 'Sales.count': 0 }])
    expect(await salesById([inAccount])).toEqual(joined)
  })

  it('should keep the records with no measure rows for an unset filter that stays on the row-level join', async () => {
    const { accounts, zones, sales } = await accountsZonesAndNoSales()
    const cubes = cubeMap(accounts, zones, sales)
    const inAccount = await accountInAZone(cubes)
    const noSale: Filter = { member: 'Sales.id', operator: 'notSet', values: [] }
    const zoneNames = (filters: Filter[]) => outcome(cubes, { dimensions: ['Zones.name'], filters })
    const joined = await zoneNames([onRowLevelJoin(inAccount), noSale])

    expect(joined).toHaveLength(1)
    expect(await zoneNames([inAccount, noSale])).toEqual(joined)
  })

  it('should answer as the row-level plan does for an or group of measure filters on two cubes that stays on the row-level join', async () => {
    const { accounts, zones, sales } = await accountsZonesAndNoSales()
    const cubes = cubeMap(accounts, zones, sales)
    const inAccount = await accountInAZone(cubes)
    const counted: Filter = {
      or: [
        { member: 'Zones.count', operator: 'gt', values: [0] },
        { member: 'Sales.count', operator: 'notSet', values: [] }
      ]
    }
    const salesCounted = (filters: Filter[]) => outcome(cubes, { measures: ['Sales.count'], filters })
    const joined = await salesCounted([onRowLevelJoin(inAccount), counted])

    expect(await salesCounted([inAccount, counted])).toEqual(joined)
  })

  async function staffBetweenDepartmentsAndTeams(joinType: 'inner' | 'left' | 'right' | 'full'): Promise<Map<string, Cube>> {
    const { employees, departments, teams, employeeTeams } = await getTestSchema()
    const departmentCube: Cube = defineCube('Departments', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: departments,
        where: eq(departments.organisationId, ctx.securityContext.organisationId as number)
      }),
      dimensions: { id: { name: 'id', type: 'number', sql: departments.id, primaryKey: true } },
      measures: { count: { name: 'count', type: 'count', sql: departments.id } }
    })
    const teamCube: Cube = defineCube('Teams', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: teams,
        where: eq(teams.organisationId, ctx.securityContext.organisationId as number)
      }),
      dimensions: { id: { name: 'id', type: 'number', sql: teams.id, primaryKey: true } },
      measures: { count: { name: 'count', type: 'count', sql: teams.id } }
    })
    const staff: Cube = defineCube('Employees', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: employees,
        where: eq(employees.organisationId, ctx.securityContext.organisationId as number)
      }),
      joins: {
        Departments: {
          targetCube: () => departmentCube,
          relationship: 'belongsTo',
          sqlJoinType: joinType,
          on: [{ source: employees.departmentId, target: departments.id }]
        },
        Teams: {
          targetCube: () => teamCube,
          relationship: 'belongsToMany',
          sqlJoinType: joinType,
          on: [],
          through: {
            table: employeeTeams,
            sourceKey: [{ source: employees.id, target: employeeTeams.employeeId }],
            targetKey: [{ source: employeeTeams.teamId, target: teams.id }],
            securitySql: securityContext => eq(employeeTeams.organisationId, securityContext.organisationId as number)
          }
        }
      },
      dimensions: { id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true } },
      measures: { count: { name: 'count', type: 'count', sql: employees.id } }
    })
    return cubeMap(staff, departmentCube, teamCube)
  }

  async function countsByTeam(cubes: Map<string, Cube>, measure: string, filters: Filter[]): Promise<string[]> {
    const { data } = await new QueryExecutor(dbExecutor).execute(cubes, { dimensions: ['Teams.id'], measures: [measure], filters }, testSecurityContexts.org1)
    return data.map(row => `${String(row['Teams.id'])}:${Number(row[measure])}`).sort()
  }

  for (const joinType of ['inner', 'left', 'right', 'full'] as const) {
    it.skipIf(joinType === 'full' && getTestDatabaseType() === 'mysql')(
      `should count each department once per team when the query filters the cube that joins them (${joinType} join)`,
      async () => {
        const cubes = await staffBetweenDepartmentsAndTeams(joinType)
        const staffed: Filter = { member: 'Employees.id', operator: 'gt', values: [0] }
        const joined = await countsByTeam(cubes, 'Departments.count', [onRowLevelJoin(staffed)])

        expect(joined).not.toEqual(await countsByTeam(cubes, 'Employees.count', [onRowLevelJoin(staffed)]))
        expect(await countsByTeam(cubes, 'Departments.count', [staffed])).toEqual(joined)
      }
    )
  }

  it('should keep the row-level plan when it declares a join between two cubes that stay joined on other keys', async () => {
    const { departments, timeEntries } = await getTestSchema()
    const { accounts: territories, sales } = await accountsAndSales('Territories')
    const entries: Cube = defineCube('Entries', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: timeEntries,
        where: eq(timeEntries.organisationId, ctx.securityContext.organisationId as number)
      }),
      joins: { Territories: { targetCube: () => territories, relationship: 'belongsTo', on: [{ source: timeEntries.departmentId, target: departments.id }] } },
      dimensions: { hours: { name: 'hours', type: 'number', sql: timeEntries.hours } },
      measures: {}
    })
    const cubes = cubeMap(entries, sales, territories)
    const territory = await accountWithItsOwnSale(territories, sales)
    const inTerritory = onRowLevelJoin({ member: 'Territories.name', operator: 'equals', values: [territory.name] })
    const worked: Filter = { member: 'Entries.hours', operator: 'gt', values: [0] }
    const joined = await salesCount(cubes, [inTerritory, onRowLevelJoin(worked)])

    expect(joined).toBeGreaterThan(1)
    expect(joined).not.toBe(territory.headcount)
    expect(await salesCount(cubes, [inTerritory, worked])).toBe(joined)
  })

  it('should keep the row-level plan when it declares the junction join on the filter-only cube', async () => {
    const { employees, teams, employeeTeams } = await getTestSchema()
    const squads: Cube = defineCube('Squads', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: teams,
        where: eq(teams.organisationId, ctx.securityContext.organisationId as number)
      }),
      joins: {
        Staff: {
          targetCube: () => staff,
          relationship: 'belongsToMany',
          on: [],
          through: {
            table: employeeTeams,
            sourceKey: [{ source: teams.id, target: employeeTeams.teamId }],
            targetKey: [{ source: employeeTeams.employeeId, target: employees.id }],
            securitySql: securityContext => [
              eq(employeeTeams.organisationId, securityContext.organisationId as number),
              eq(employeeTeams.role, 'lead')
            ]
          }
        }
      },
      dimensions: { name: { name: 'name', type: 'string', sql: teams.name } },
      measures: {}
    })
    const staff: Cube = defineCube('Staff', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: employees,
        where: eq(employees.organisationId, ctx.securityContext.organisationId as number)
      }),
      joins: {
        Squads: {
          targetCube: () => squads,
          relationship: 'belongsToMany',
          on: [],
          through: {
            table: employeeTeams,
            sourceKey: [{ source: employees.id, target: employeeTeams.employeeId }],
            targetKey: [{ source: employeeTeams.teamId, target: teams.id }],
            securitySql: securityContext => eq(employeeTeams.organisationId, securityContext.organisationId as number)
          }
        }
      },
      dimensions: {},
      measures: { count: { name: 'count', type: 'count', sql: employees.id } }
    })
    const cubes = cubeMap(squads, staff)
    const staffCount = async (filters: Filter[]) => Number((await new QueryExecutor(dbExecutor).execute(
      cubes, { measures: ['Staff.count'], filters }, testSecurityContexts.org1
    )).data[0]?.['Staff.count'] ?? 0)
    const inSquad: Filter = { member: 'Squads.name', operator: 'set', values: [] }
    const leads = await measure('EmployeeTeams.count', [{ member: 'EmployeeTeams.role', operator: 'equals', values: ['lead'] }])
    const members = await measure('EmployeeTeams.count', [])

    expect(leads).toBeGreaterThan(0)
    expect(leads).toBeLessThan(members)
    expect(await staffCount([onRowLevelJoin(inSquad)])).toBe(leads)
    expect(await staffCount([inSquad])).toBe(leads)
  })

  async function staffAndUnits(): Promise<Map<string, Cube>> {
    const { employees, departments, employeeTeams } = await getTestSchema()
    const memberships: Cube = defineCube('Memberships', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: employeeTeams,
        where: eq(employeeTeams.organisationId, ctx.securityContext.organisationId as number)
      }),
      dimensions: { role: { name: 'role', type: 'string', sql: employeeTeams.role } },
      measures: {}
    })
    const staff: Cube = defineCube('Staff', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: employees,
        where: eq(employees.organisationId, ctx.securityContext.organisationId as number)
      }),
      dimensions: { id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true } },
      measures: {
        count: { name: 'count', type: 'count', sql: employees.id },
        unitCount: { name: 'unitCount', type: 'calculated', calculatedSql: '{Units.count}' },
        unitRank: { name: 'unitRank', type: 'rank', windowConfig: { measure: 'Units.count' } }
      },
      joins: {
        Memberships: { targetCube: () => memberships, relationship: 'hasMany', on: [{ source: employees.id, target: employeeTeams.employeeId }] }
      }
    })
    const units: Cube = defineCube('Units', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: departments,
        where: eq(departments.organisationId, ctx.securityContext.organisationId as number)
      }),
      dimensions: { name: { name: 'name', type: 'string', sql: departments.name } },
      measures: {
        count: { name: 'count', type: 'countDistinct', sql: departments.id },
        staffCount: { name: 'staffCount', type: 'calculated', calculatedSql: '{Staff.count}' }
      },
      joins: {
        Staff: { targetCube: () => staff, relationship: 'hasOne', on: [{ source: departments.id, target: employees.departmentId }] }
      }
    })
    return new Map([['Staff', staff], ['Units', units], ['Memberships', memberships]])
  }

  async function staffedDepartment(): Promise<{ name: unknown; headcount: number }> {
    const headcounts = (await testExecutor.executeQuery({ dimensions: ['Departments.name'], measures: ['Employees.count'] })).data
    const staffed = headcounts.find(row => Number(row['Employees.count']) > 0)
    return { name: staffed?.['Departments.name'], headcount: Number(staffed?.['Employees.count']) }
  }

  it('should match employees through a hasOne join declared on the filter-only cube', async () => {
    const department = await staffedDepartment()
    const result = await new QueryExecutor(dbExecutor).execute(
      await staffAndUnits(),
      { measures: ['Staff.count'], filters: [{ member: 'Units.name', operator: 'equals', values: [department.name] }] },
      testSecurityContexts.org1
    )

    expect(department.name).toBeDefined()
    expect(Number(result.data[0]?.['Staff.count'])).toBe(department.headcount)
  })

  async function membersAndPeers(): Promise<Map<string, Cube>> {
    const { employees } = await getTestSchema()
    const scoped = (ctx: QueryContext): BaseQueryDefinition => ({
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId as number)
    })
    const peers: Cube = defineCube('Peers', {
      sql: scoped,
      dimensions: { id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true } },
      measures: { count: { name: 'count', type: 'count', sql: employees.id } }
    })
    const members: Cube = defineCube('Members', {
      sql: scoped,
      joins: {
        Peers: {
          targetCube: () => peers,
          relationship: 'hasMany',
          on: [
            { source: employees.departmentId, target: employees.departmentId },
            { source: employees.organisationId, target: employees.organisationId }
          ]
        }
      },
      dimensions: {
        id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true },
        departmentId: { name: 'departmentId', type: 'number', sql: employees.departmentId }
      },
      measures: { count: { name: 'count', type: 'count', sql: employees.id } }
    })
    return new Map([['Members', members], ['Peers', peers]])
  }

  async function sameTableDepartment(cubes: Map<string, Cube>): Promise<{ employeeId: unknown; colleagues: number; everyone: number }> {
    const execute = (query: SemanticQuery) => new QueryExecutor(dbExecutor).execute(cubes, query, testSecurityContexts.org1)
    const [first] = (await execute({
      dimensions: ['Members.id', 'Members.departmentId'],
      filters: [{ member: 'Members.departmentId', operator: 'set', values: [] }],
      order: { 'Members.id': 'asc' }
    })).data
    const colleagues = (await execute({
      measures: ['Members.count'],
      filters: [{ member: 'Members.departmentId', operator: 'equals', values: [first['Members.departmentId']] }]
    })).data
    const everyone = (await execute({ measures: ['Members.count'] })).data
    return { employeeId: first['Members.id'], colleagues: Number(colleagues[0]['Members.count']), everyone: Number(everyone[0]['Members.count']) }
  }

  it('should count only the peers in the filtered member\'s department when both cubes read one table', async () => {
    const cubes = await membersAndPeers()
    const department = await sameTableDepartment(cubes)
    const result = await new QueryExecutor(dbExecutor).execute(
      cubes,
      { measures: ['Peers.count'], filters: [{ member: 'Members.id', operator: 'equals', values: [department.employeeId] }] },
      testSecurityContexts.org1
    )

    expect(department.colleagues).toBeLessThan(department.everyone)
    expect(Number(result.data[0]?.['Peers.count'])).toBe(department.colleagues)
  })

  it('should count only the members in the filtered peer\'s department when both cubes read one table', async () => {
    const cubes = await membersAndPeers()
    const department = await sameTableDepartment(cubes)
    const result = await new QueryExecutor(dbExecutor).execute(
      cubes,
      { measures: ['Members.count'], filters: [{ member: 'Peers.id', operator: 'equals', values: [department.employeeId] }] },
      testSecurityContexts.org1
    )

    expect(department.colleagues).toBeLessThan(department.everyone)
    expect(Number(result.data[0]?.['Members.count'])).toBe(department.colleagues)
  })

  it('should join a filtered cube that a calculated measure reads', async () => {
    const cubes = await staffAndUnits()
    const department = await staffedDepartment()
    const filters: Filter[] = [{ member: 'Units.name', operator: 'equals', values: [department.name] }]
    const execute = (measures: string[]) => new QueryExecutor(dbExecutor).execute(cubes, { measures, filters }, testSecurityContexts.org1)

    const withUnits = await execute(['Staff.unitCount', 'Units.count'])
    const result = await execute(['Staff.unitCount'])

    expect(Number(withUnits.data[0]?.['Staff.unitCount'])).toBe(1)
    expect(result.data[0]?.['Staff.unitCount']).toEqual(withUnits.data[0]?.['Staff.unitCount'])
  })

  it('should join the cube a window measure reads when filtering on it', async () => {
    const cubes = await staffAndUnits()
    const department = await staffedDepartment()
    const filters: Filter[] = [{ member: 'Units.name', operator: 'equals', values: [department.name] }]
    const execute = (measures: string[]) => new QueryExecutor(dbExecutor).execute(cubes, { measures, filters }, testSecurityContexts.org1)

    const withUnits = await execute(['Staff.unitRank', 'Units.count'])
    const result = await execute(['Staff.unitRank'])

    expect(withUnits.data[0]?.['Staff.unitRank']).toBeDefined()
    expect(result.data[0]?.['Staff.unitRank']).toEqual(withUnits.data[0]?.['Staff.unitRank'])
  })

  it('should join the cube a calculated measure reads when the filter is on a cube beyond it', async () => {
    const cubes = await staffAndUnits()
    const filters: Filter[] = [{ member: 'Memberships.role', operator: 'equals', values: ['lead'] }]
    const execute = (measures: string[]) => new QueryExecutor(dbExecutor).execute(cubes, { measures, filters }, testSecurityContexts.org1)

    const withStaff = await execute(['Units.staffCount', 'Staff.count'])
    const result = await execute(['Units.staffCount'])

    expect(Number(withStaff.data[0]?.['Units.staffCount'])).toBeGreaterThan(0)
    expect(result.data[0]?.['Units.staffCount']).toEqual(withStaff.data[0]?.['Units.staffCount'])
  })

  it.each<[string, Filter]>([
    ['an or group', {
      or: [
        { member: 'Units.staffCount', operator: 'gt', values: [0] },
        { member: 'Units.count', operator: 'notSet', values: [] }
      ]
    }],
    ['a filter', { member: 'Units.staffCount', operator: 'notSet', values: [] }]
  ])('should join the cube that a calculated measure reads in %s that stays on the row-level join', async (_, onStaffCount) => {
    const cubes = await staffAndUnits()
    const hasId: Filter = { member: 'Staff.id', operator: 'gt', values: [0] }
    const unitNames = async (filters: Filter[]) => (await new QueryExecutor(dbExecutor).execute(
      cubes, { dimensions: ['Units.name'], filters, order: { 'Units.name': 'asc' } }, testSecurityContexts.org1
    )).data.map(row => row['Units.name'])
    const staffed = await unitNames([onRowLevelJoin(hasId)])

    expect(staffed.length).toBeGreaterThan(0)
    expect(await unitNames([hasId, onStaffCount])).toEqual(await unitNames([onRowLevelJoin(hasId), onStaffCount]))
  })

  async function timeEntryPaths(employeeTimeEntries: 'hasMany' | 'hasOne', preferTimeEntriesForDepartments: boolean): Promise<Map<string, Cube>> {
    const { employees, departments, timeEntries } = await getTestSchema()
    const departmentsCube: Cube = defineCube('Departments', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: departments,
        where: eq(departments.organisationId, ctx.securityContext.organisationId as number)
      }),
      joins: {
        TimeEntries: { targetCube: () => timeEntriesCube, relationship: 'hasMany', on: [{ source: departments.id, target: timeEntries.departmentId }] },
        Employees: { targetCube: () => employeesCube, relationship: 'hasMany', on: [{ source: departments.id, target: employees.departmentId }] }
      },
      dimensions: {
        id: { name: 'id', type: 'number', sql: departments.id, primaryKey: true },
        name: { name: 'name', type: 'string', sql: departments.name }
      },
      measures: {}
    })
    const employeesCube: Cube = defineCube('Employees', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: employees,
        where: eq(employees.organisationId, ctx.securityContext.organisationId as number)
      }),
      joins: {
        Departments: { targetCube: () => departmentsCube, relationship: 'belongsTo', on: [{ source: employees.departmentId, target: departments.id }] },
        TimeEntries: {
          targetCube: () => timeEntriesCube,
          relationship: employeeTimeEntries,
          on: [{ source: employees.id, target: timeEntries.employeeId }],
          preferredFor: preferTimeEntriesForDepartments ? ['Departments'] : undefined
        }
      },
      dimensions: {
        id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true },
        departmentId: { name: 'departmentId', type: 'number', sql: employees.departmentId }
      },
      measures: { count: { name: 'count', type: 'count', sql: employees.id } }
    })
    const timeEntriesCube: Cube = defineCube('TimeEntries', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: timeEntries,
        where: eq(timeEntries.organisationId, ctx.securityContext.organisationId as number)
      }),
      joins: {
        Employees: { targetCube: () => employeesCube, relationship: 'belongsTo', on: [{ source: timeEntries.employeeId, target: employees.id }] },
        Departments: { targetCube: () => departmentsCube, relationship: 'belongsTo', on: [{ source: timeEntries.departmentId, target: departments.id }] }
      },
      dimensions: {
        employeeId: { name: 'employeeId', type: 'number', sql: timeEntries.employeeId },
        departmentId: { name: 'departmentId', type: 'number', sql: timeEntries.departmentId }
      },
      measures: { count: { name: 'count', type: 'count', sql: timeEntries.id } }
    })
    return new Map([['Departments', departmentsCube], ['Employees', employeesCube], ['TimeEntries', timeEntriesCube]])
  }

  async function firstDepartment(cubes: Map<string, Cube>): Promise<{ id: number; name: string }> {
    const [department] = (await new QueryExecutor(dbExecutor).execute(
      cubes,
      { dimensions: ['Departments.id', 'Departments.name'], order: { 'Departments.id': 'asc' } },
      testSecurityContexts.org1
    )).data
    return { id: department['Departments.id'] as number, name: department['Departments.name'] as string }
  }

  it('should test the filter-only cube from the measure cube, not from the cube that leads the query', async () => {
    const cubes = await timeEntryPaths('hasOne', false)
    const department = await firstDepartment(cubes)
    const execute = (query: SemanticQuery) => new QueryExecutor(dbExecutor).execute(cubes, query, testSecurityContexts.org1)
    const entriesByEmployee = (rows: Array<Record<string, unknown>>, idMember: string) => rows
      .map(row => ({ employeeId: row[idMember], entries: Number(row['TimeEntries.count']) }))
      .sort((a, b) => Number(a.employeeId) - Number(b.employeeId))

    const expected = entriesByEmployee((await execute({
      measures: ['TimeEntries.count'],
      dimensions: ['TimeEntries.employeeId'],
      filters: [{ member: 'TimeEntries.departmentId', operator: 'equals', values: [department.id] }]
    })).data, 'TimeEntries.employeeId')
    const filtered: SemanticQuery = {
      measures: ['TimeEntries.count'],
      dimensions: ['Employees.id'],
      filters: [{ member: 'Departments.name', operator: 'equals', values: [department.name] }]
    }
    const result = entriesByEmployee((await execute(filtered)).data, 'Employees.id')
    const { sql } = await new QueryExecutor(dbExecutor).generateMultiCubeSQL(cubes, filtered, testSecurityContexts.org1)

    expect(expected.length).toBeGreaterThan(0)
    expect(result).toEqual(expected)
    expect(sql).not.toMatch(/join\s+\S*departments/i)
  })

  async function departmentWithTimeEntries(cubes: Map<string, Cube>): Promise<{ name: string; staff: Set<unknown>; headcount: number }> {
    const department = await firstDepartment(cubes)
    const execute = (query: SemanticQuery) => new QueryExecutor(dbExecutor).execute(cubes, query, testSecurityContexts.org1)
    const staff = new Set((await execute({
      dimensions: ['TimeEntries.employeeId'],
      filters: [{ member: 'TimeEntries.departmentId', operator: 'equals', values: [department.id] }]
    })).data.map(row => row['TimeEntries.employeeId']))
    const employeesInDepartment = await execute({
      measures: ['Employees.count'],
      filters: [{ member: 'Employees.departmentId', operator: 'equals', values: [department.id] }]
    })
    return { name: department.name, staff, headcount: Number(employeesInDepartment.data[0]['Employees.count']) }
  }

  it('should reach the filter-only cube through the join marked preferredFor it when the row-level plan starts from the same cube', async () => {
    const cubes = await timeEntryPaths('hasMany', true)
    const department = await departmentWithTimeEntries(cubes)
    const result = await new QueryExecutor(dbExecutor).execute(cubes, {
      measures: ['Employees.count'],
      dimensions: ['Employees.id'],
      filters: [{ member: 'Departments.name', operator: 'equals', values: [department.name] }]
    }, testSecurityContexts.org1)

    expect(department.headcount).not.toBe(department.staff.size)
    expect(new Set(result.data.map(row => row['Employees.id']))).toEqual(department.staff)
    expect(result.data.map(row => Number(row['Employees.count']))).toEqual(result.data.map(() => 1))
  })

  it('should keep the row-level plan when it reaches the filter-only cube without the cube that a preferredFor hint leads through', async () => {
    const cubes = await timeEntryPaths('hasMany', true)
    const department = await departmentWithTimeEntries(cubes)
    const inDepartment: Filter = { member: 'Departments.name', operator: 'equals', values: [department.name] }
    const count = async (filters: Filter[]) => Number((await new QueryExecutor(dbExecutor).execute(
      cubes, { measures: ['Employees.count'], filters }, testSecurityContexts.org1
    )).data[0]['Employees.count'])

    expect(department.headcount).not.toBe(department.staff.size)
    expect(await count([onRowLevelJoin(inDepartment)])).toBe(department.headcount)
    expect(await count([inDepartment])).toBe(department.headcount)
  })

  const codedALotOrLittle: Filter = {
    or: [
      { member: 'Productivity.linesOfCode', operator: 'gt', values: [500] },
      { member: 'Productivity.linesOfCode', operator: 'lt', values: [10] }
    ]
  }
  const leadOrMember: Filter = {
    or: [
      { member: 'EmployeeTeams.role', operator: 'equals', values: ['lead'] },
      { member: 'EmployeeTeams.role', operator: 'equals', values: ['member'] }
    ]
  }

  async function salaryByDepartment(filters: Filter[]): Promise<Array<Record<string, unknown>>> {
    const result = await testExecutor.executeQuery({
      measures: ['Employees.totalSalary'],
      dimensions: ['Employees.departmentId'],
      filters,
      order: { 'Employees.departmentId': 'asc' }
    })
    return result.data
  }

  it.each([
    ['productivity rows', 'Productivity.employeeId', 'Productivity.recordCount', codedALotOrLittle],
    ['memberships', 'EmployeeTeams.employeeId', 'EmployeeTeams.count', leadOrMember]
  ])('should count each employee once when several %s meet an or group on their cube', async (_rows, employeeIdDimension, rowCount, group) => {
    const employeeIds = await distinctValues(employeeIdDimension, [group])
    const theseEmployees: Filter = { member: 'Employees.id', operator: 'in', values: employeeIds }

    expect(employeeIds.length).toBeGreaterThan(0)
    expect(await measure(rowCount, [group])).toBeGreaterThan(employeeIds.length)
    expect(await measure('Employees.totalSalary', [group])).toBe(await measure('Employees.totalSalary', [theseEmployees]))
    expect(await salaryByDepartment([group])).toEqual(await salaryByDepartment([theseEmployees]))
    for (const name of ['Employees.count', 'Employees.avgSalary', 'Employees.minSalary', 'Employees.maxSalary']) {
      expect(await measure(name, [group])).toBeCloseTo(await measure(name, [theseEmployees]), 6)
    }
  })

  it('should require one membership to meet an or group and another filter on its cube', async () => {
    const leadOrInDevOps: Filter = {
      or: [
        { member: 'EmployeeTeams.role', operator: 'equals', values: ['lead'] },
        { member: 'EmployeeTeams.teamId', operator: 'equals', values: [3] }
      ]
    }
    const inBackend: Filter = { member: 'EmployeeTeams.teamId', operator: 'equals', values: [2] }
    const inOneMembership = await distinctValues('EmployeeTeams.employeeId', [leadOrInDevOps, inBackend])
    const inBackendIds = await distinctValues('EmployeeTeams.employeeId', [inBackend])
    const inAnyMembership = (await distinctValues('EmployeeTeams.employeeId', [leadOrInDevOps])).filter(id => inBackendIds.includes(id))

    expect(inOneMembership.length).toBeGreaterThan(0)
    expect(inAnyMembership.length).toBeGreaterThan(inOneMembership.length)
    expect(await measure('Employees.totalSalary', [leadOrInDevOps, inBackend]))
      .toBe(await measureForIds('Employees.totalSalary', 'Employees.id', inOneMembership))
  })

  it('should count each employee once for or groups on two filter-only cubes', async () => {
    const memberIds = await distinctValues('EmployeeTeams.employeeId', [leadOrMember])
    const employeeIds = (await distinctValues('Productivity.employeeId', [codedALotOrLittle])).filter(id => memberIds.includes(id))

    expect(employeeIds.length).toBeGreaterThan(0)
    expect(await measure('Employees.totalSalary', [codedALotOrLittle, leadOrMember]))
      .toBe(await measureForIds('Employees.totalSalary', 'Employees.id', employeeIds))
  })

  it.each<[string, Filter]>([
    ['a negative condition', {
      or: [
        { member: 'EmployeeTeams.role', operator: 'notEquals', values: ['member'] },
        { member: 'EmployeeTeams.teamId', operator: 'equals', values: [2] }
      ]
    }],
    ['an and group', {
      or: [
        { and: [{ member: 'EmployeeTeams.role', operator: 'equals', values: ['lead'] }, { member: 'EmployeeTeams.teamId', operator: 'equals', values: [1] }] },
        { and: [{ member: 'EmployeeTeams.role', operator: 'equals', values: ['member'] }, { member: 'EmployeeTeams.teamId', operator: 'equals', values: [2] }] }
      ]
    }],
    ['another or group', {
      or: [
        { or: [{ member: 'EmployeeTeams.role', operator: 'equals', values: ['lead'] }] },
        { member: 'EmployeeTeams.teamId', operator: 'equals', values: [2] }
      ]
    }],
    ['one condition', { or: [{ member: 'EmployeeTeams.teamId', operator: 'in', values: [1, 2] }] }]
  ])('should count each employee once for an or group on a filter-only cube that holds %s', async (_content, group) => {
    const employeeIds = await distinctValues('EmployeeTeams.employeeId', [group])

    expect(employeeIds.length).toBeGreaterThan(0)
    expect(await measure('EmployeeTeams.count', [group])).toBeGreaterThan(employeeIds.length)
    expect(await measure('Employees.totalSalary', [group])).toBe(await measureForIds('Employees.totalSalary', 'Employees.id', employeeIds))
  })

  it('should count each employee once for an or group on a filter-only cube that holds a date range', async () => {
    const inFirstWeekOrBusy: Filter = {
      or: [
        { member: 'Productivity.date', operator: 'inDateRange', values: [], dateRange: ['2024-03-01', '2024-03-07'] },
        { member: 'Productivity.linesOfCode', operator: 'gt', values: [900] }
      ]
    }
    const employeeIds = await distinctValues('Productivity.employeeId', [inFirstWeekOrBusy])

    expect(employeeIds.length).toBeGreaterThan(0)
    expect(await measure('Productivity.recordCount', [inFirstWeekOrBusy])).toBeGreaterThan(employeeIds.length)
    expect(await measure('Employees.totalSalary', [inFirstWeekOrBusy])).toBe(await measureForIds('Employees.totalSalary', 'Employees.id', employeeIds))
  })

  it('should keep employees with no membership for an or group that holds an unset role', async () => {
    const lead: Filter = { member: 'EmployeeTeams.role', operator: 'equals', values: ['lead'] }
    const leadOrNoRole: Filter = { or: [lead, { member: 'EmployeeTeams.role', operator: 'notSet', values: [] }] }
    const everyone = await distinctValues('Employees.id')
    const members = await distinctValues('EmployeeTeams.employeeId')
    const leads = await distinctValues('EmployeeTeams.employeeId', [lead])

    expect(leads.length).toBeGreaterThan(0)
    expect(everyone.length).toBeGreaterThan(members.length)
    expect(await measure('Employees.count', [leadOrNoRole])).toBe(everyone.length - members.length + leads.length)
  })

  it('should count each staff member once for an or group on a cube joined through a junction table', async () => {
    const cubes = await staffSquadsAndDays()
    const salary = async (filters: Filter[]) => Number((await new QueryExecutor(dbExecutor).execute(
      cubes, { measures: ['Staff.totalSalary'], filters }, testSecurityContexts.org1
    )).data[0]?.['Staff.totalSalary'] ?? 0)
    const squadNames = ['Frontend Team', 'Backend Team']
    const inEitherSquad: Filter = { or: squadNames.map(name => ({ member: 'Squads.name', operator: 'equals', values: [name] })) }
    const memberships = (await testExecutor.executeQuery({ dimensions: ['EmployeeTeams.employeeId', 'Teams.name'] })).data
      .filter(row => squadNames.includes(String(row['Teams.name'])))
    const staffIds = [...new Set(memberships.map(row => Number(row['EmployeeTeams.employeeId'])))]

    expect(staffIds.length).toBeGreaterThan(0)
    expect(memberships.length).toBeGreaterThan(staffIds.length)
    expect(await salary([inEitherSquad])).toBe(await measureForIds('Employees.totalSalary', 'Employees.id', staffIds))
  })

  it('should apply an or group of measure filters on a cube that the query names nowhere else', async () => {
    const noSuchHeadcount: Filter = {
      or: [
        { member: 'Employees.count', operator: 'lt', values: [0] },
        { member: 'Employees.count', operator: 'gt', values: [1000000] }
      ]
    }

    expect(await measure('Productivity.recordCount', [])).toBeGreaterThan(0)
    expect(await measure('Productivity.recordCount', [noSuchHeadcount])).toBe(0)
  })

  it('should keep the row-level join for an or group on a cube that the query groups by', async () => {
    const salaryByDayOff = async (filters: Filter[]) => (await testExecutor.executeQuery({
      measures: ['Employees.totalSalary'],
      dimensions: ['Productivity.isDayOff'],
      filters,
      order: { 'Productivity.isDayOff': 'asc' }
    })).data

    expect(await salaryByDayOff([codedALotOrLittle])).toEqual(await salaryByDayOff([onRowLevelJoin(codedALotOrLittle)]))
  })
  async function staffAndMemberships(): Promise<Map<string, Cube>> {
    const { employees, employeeTeams, teams } = await getTestSchema()
    const builtFor = new WeakSet<QueryContext>()
    const memberships: Cube = defineCube('Memberships', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: employeeTeams,
        joins: [{ table: teams, on: eq(employeeTeams.teamId, teams.id), type: 'left' }],
        where: eq(employeeTeams.organisationId, ctx.securityContext.organisationId as number)
      }),
      dimensions: {
        teamId: { name: 'teamId', type: 'number', sql: employeeTeams.teamId },
        role: { name: 'role', type: 'string', sql: () => employeeTeams.role },
        teamName: { name: 'teamName', type: 'string', sql: teams.name },
        roleOrNone: { name: 'roleOrNone', type: 'string', sql: sql`coalesce(${employeeTeams.role}, 'none')` },
        roleBuiltOnce: {
          name: 'roleBuiltOnce',
          type: 'string',
          sql: (ctx: QueryContext) => {
            if (builtFor.has(ctx)) throw new Error('The role dimension was built twice for one query')
            builtFor.add(ctx)
            return employeeTeams.role
          }
        }
      },
      measures: {}
    })
    const staff: Cube = defineCube('Staff', {
      sql: (ctx: QueryContext): BaseQueryDefinition => ({
        from: employees,
        where: eq(employees.organisationId, ctx.securityContext.organisationId as number)
      }),
      joins: { Memberships: { targetCube: () => memberships, relationship: 'hasMany', on: [{ source: employees.id, target: employeeTeams.employeeId }] } },
      dimensions: { id: { name: 'id', type: 'number', sql: employees.id, primaryKey: true } },
      measures: { count: { name: 'count', type: 'count', sql: employees.id } }
    })
    return new Map([['Staff', staff], ['Memberships', memberships]])
  }

  async function staffCount(cubes: Map<string, Cube>, filters: Filter[]): Promise<number> {
    const result = await new QueryExecutor(dbExecutor).execute(cubes, { measures: ['Staff.count'], filters }, testSecurityContexts.org1)
    return Number(result.data[0]?.['Staff.count'] ?? 0)
  }

  it('should keep the records with no related row for a filter on a dimension that turns a missing value into the filtered one', async () => {
    const cubes = await staffAndMemberships()
    const noRole: Filter = { member: 'Memberships.roleOrNone', operator: 'equals', values: ['none'] }
    const everyone = await distinctValues('Employees.id')
    const members = await distinctValues('EmployeeTeams.employeeId')

    const lead: Filter = { member: 'EmployeeTeams.role', operator: 'equals', values: ['lead'] }
    const leads = await distinctValues('EmployeeTeams.employeeId', [lead])
    const leadOrNoRole: Filter = { or: [{ member: 'Memberships.role', operator: 'equals', values: ['lead'] }, noRole] }

    expect(everyone.length).toBeGreaterThan(members.length)
    expect(await staffCount(cubes, [noRole])).toBe(everyone.length - members.length)
    expect(await measure('EmployeeTeams.count', [lead])).toBe(leads.length)
    expect(await staffCount(cubes, [leadOrNoRole])).toBe(leads.length + everyone.length - members.length)
  })

  it.each<[string, Filter, Filter]>([
    [
      'of a table that the cube joins inside itself',
      { member: 'Memberships.teamName', operator: 'in', values: ['Frontend Team', 'Backend Team'] },
      { member: 'Teams.name', operator: 'in', values: ['Frontend Team', 'Backend Team'] }
    ],
    [
      'that a function of the query context returns',
      { member: 'Memberships.role', operator: 'in', values: ['lead', 'member'] },
      { member: 'EmployeeTeams.role', operator: 'in', values: ['lead', 'member'] }
    ]
  ])('should count each staff member once for a filter on a column %s', async (_column, filter, sameFilterOnMemberships) => {
    const cubes = await staffAndMemberships()
    const staffIds = await distinctValues('EmployeeTeams.employeeId', [sameFilterOnMemberships])

    expect(staffIds.length).toBeGreaterThan(0)
    expect(await measure('EmployeeTeams.count', [sameFilterOnMemberships])).toBeGreaterThan(staffIds.length)
    expect(await staffCount(cubes, [filter])).toBe(staffIds.length)
  })

  it('should keep the row-level join for a filter on a dimension whose function fails when the planner calls it', async () => {
    const cubes = await staffAndMemberships()
    const hasRole: Filter = { member: 'Memberships.role', operator: 'set', values: [] }
    const memberships = await staffCount(cubes, [onRowLevelJoin(hasRole)])

    expect(memberships).toBeGreaterThan(await staffCount(cubes, [hasRole]))
    expect(await staffCount(cubes, [{ member: 'Memberships.roleBuiltOnce', operator: 'set', values: [] }])).toBe(memberships)
  })

  it('should require one related row to meet a filter on a computed dimension and a filter on a column of its cube', async () => {
    const cubes = await staffAndMemberships()
    const lead: Filter = { member: 'EmployeeTeams.role', operator: 'equals', values: ['lead'] }
    const inBackend: Filter = { member: 'EmployeeTeams.teamId', operator: 'equals', values: [2] }
    const leadsInBackend = await distinctValues('EmployeeTeams.employeeId', [lead, inBackend])
    const backendIds = await distinctValues('EmployeeTeams.employeeId', [inBackend])
    const leadsWithABackendMembership = (await distinctValues('EmployeeTeams.employeeId', [lead])).filter(id => backendIds.includes(id))

    expect(leadsInBackend.length).toBeGreaterThan(0)
    expect(leadsWithABackendMembership.length).toBeGreaterThan(leadsInBackend.length)
    expect(await staffCount(cubes, [
      { member: 'Memberships.roleOrNone', operator: 'equals', values: ['lead'] },
      { member: 'Memberships.teamId', operator: 'equals', values: [2] }
    ])).toBe(leadsInBackend.length)
  })
})
