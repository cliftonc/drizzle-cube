/**
 * Tests for buildAttributeDimensions — generated dimensions over an EAV
 * junction table.
 *
 * `employee_teams` stands in for the junction table: employee_id is the record
 * key, team_id the attribute key, role the value, organisation_id the security
 * scope. Using a real seeded table means the generated SQL is executed, not
 * merely inspected.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { createTestDatabaseExecutor, getTestSchema, getTestDatabaseType, skipIfDatabend } from './helpers/test-database'
import { createTestCubesForCurrentDatabase } from './helpers/test-cubes'
import { SemanticLayerCompiler, buildAttributeDimensions } from '../src/server'
import type { Cube, SecurityContext, QueryContext } from '../src/server'

let executor: any
let schema: any
let employeesCube: Cube

const securityContext: SecurityContext = { organisationId: 1 }

/**
 * The two "attributes" — team ids that organisation 1 actually has rows for.
 *
 * Read from the seeded data rather than hardcoded: Postgres identity sequences
 * are not reset between runs, so team ids there are in the thousands. Literal
 * ids matched nothing and every generated dimension came back null, which the
 * assertions could not tell apart from a broken subquery.
 */
let attributeIds: Array<string | number> = []

/** Member name of the nth seeded attribute, e.g. `Employees.attr_1018`. */
function member(cube: string, index = 0): string {
  return `${cube}.attr_${attributeIds[index]}`
}

async function loadSeededAttributeIds(): Promise<Array<string | number>> {
  const rows = await executor.execute(
    executor.db
      .select({ attributeId: schema.employeeTeams.teamId })
      .from(schema.employeeTeams)
      .where(eq(schema.employeeTeams.organisationId, 1))
  )
  // Read positionally — Snowflake upper-cases column names.
  const ids: number[] = (rows as Record<string, unknown>[])
    .map(row => Number(Object.values(row)[0]))
  return [...new Set(ids)].sort((a, b) => a - b).slice(0, 2)
}

function buildDimensions(overrides: Record<string, 'string' | 'number' | 'time'> = {}, shown?: boolean) {
  return buildAttributeDimensions({
    attributes: attributeIds.map((id, index) => ({
      id,
      name: index === 0 ? 'Platform role' : 'Product role'
    })),
    valueTable: schema.employeeTeams,
    recordKey: schema.employees.id,
    foreignKey: schema.employeeTeams.employeeId,
    attributeKey: schema.employeeTeams.teamId,
    valueColumn: schema.employeeTeams.role,
    security: (ctx: QueryContext) =>
      eq(schema.employeeTeams.organisationId, ctx.securityContext.organisationId),
    types: overrides,
    shown
  })
}

describe('buildAttributeDimensions', () => {
  beforeAll(async () => {
    const result = await createTestDatabaseExecutor()
    executor = result.executor
    schema = await getTestSchema()
    employeesCube = (await createTestCubesForCurrentDatabase()).testEmployeesCube
    attributeIds = await loadSeededAttributeIds()
    expect(attributeIds).toHaveLength(2)
  })

  describe('dimension shape', () => {
    it('derives the member name from the attribute id and the title from its name', () => {
      const dimensions = buildDimensions()
      const name = `attr_${attributeIds[0]}`

      expect(Object.keys(dimensions)).toEqual(attributeIds.map(id => `attr_${id}`))
      expect(dimensions[name].name).toBe(name)
      expect(dimensions[name].title).toBe('Platform role')
    })

    it('keeps the member name stable when the attribute is renamed', () => {
      const before = buildDimensions()
      const renamed = buildAttributeDimensions({
        attributes: [{ id: attributeIds[0], name: 'Platform responsibility' }],
        valueTable: schema.employeeTeams,
        recordKey: schema.employees.id,
        foreignKey: schema.employeeTeams.employeeId,
        attributeKey: schema.employeeTeams.teamId,
        valueColumn: schema.employeeTeams.role,
        security: (ctx: QueryContext) =>
          eq(schema.employeeTeams.organisationId, ctx.securityContext.organisationId)
      })

      // Saved dashboards keep resolving; only the header text changes.
      expect(Object.keys(renamed)[0]).toBe(Object.keys(before)[0])
      expect(renamed[`attr_${attributeIds[0]}`].title).toBe('Platform responsibility')
    })

    it('resolves types in order: explicit override, then the attribute, then string', () => {
      const dimensions = buildAttributeDimensions({
        attributes: [
          { id: 'a', name: 'A', valueType: 'number' },
          { id: 'b', name: 'B', valueType: 'number' },
          { id: 'c', name: 'C' }
        ],
        valueTable: schema.employeeTeams,
        recordKey: schema.employees.id,
        foreignKey: schema.employeeTeams.employeeId,
        attributeKey: schema.employeeTeams.teamId,
        valueColumn: schema.employeeTeams.role,
        security: (ctx: QueryContext) =>
          eq(schema.employeeTeams.organisationId, ctx.securityContext.organisationId),
        types: { a: 'string' }
      })

      expect(dimensions.attr_a.type).toBe('string')   // override wins
      expect(dimensions.attr_b.type).toBe('number')   // from the attribute
      expect(dimensions.attr_c.type).toBe('string')   // default
    })

    it('honours a custom prefix and passes shown through', () => {
      const dimensions = buildAttributeDimensions({
        attributes: [{ id: 1, name: 'A' }],
        valueTable: schema.employeeTeams,
        recordKey: schema.employees.id,
        foreignKey: schema.employeeTeams.employeeId,
        attributeKey: schema.employeeTeams.teamId,
        valueColumn: schema.employeeTeams.role,
        security: (ctx: QueryContext) =>
          eq(schema.employeeTeams.organisationId, ctx.securityContext.organisationId),
        namePrefix: 'custom_',
        shown: false
      })

      expect(Object.keys(dimensions)).toEqual(['custom_1'])
      expect(dimensions.custom_1.shown).toBe(false)
    })

    it('rejects an attribute with no id', () => {
      expect(() => buildAttributeDimensions({
        attributes: [{ id: '', name: 'A' }],
        valueTable: schema.employeeTeams,
        recordKey: schema.employees.id,
        foreignKey: schema.employeeTeams.employeeId,
        attributeKey: schema.employeeTeams.teamId,
        valueColumn: schema.employeeTeams.role,
        security: (ctx: QueryContext) =>
          eq(schema.employeeTeams.organisationId, ctx.securityContext.organisationId)
      })).toThrow()
    })
  })

  describe('generated SQL', () => {
    let compiler: SemanticLayerCompiler

    beforeAll(() => {
      compiler = new SemanticLayerCompiler({ databaseExecutor: executor })
      compiler.registerCube({
        ...employeesCube,
        dimensions: { ...employeesCube.dimensions, ...buildDimensions() }
      })
    })

    it('scopes the subquery by the security context and limits it to one row', async () => {
      const { sql } = await compiler.dryRun(
        { dimensions: [member('Employees')], measures: ['Employees.count'] },
        securityContext
      )

      expect(sql).toMatch(/organisation_id/i)
      // The SQL formatter may break LIMIT across lines.
      expect(sql).toMatch(/LIMIT\s+1/i)
      // The security predicate must sit inside the correlated subquery, not
      // only on the outer query — otherwise the lookup crosses tenants.
      const subquery = sql.slice(sql.search(/\(\s*SELECT/i), sql.search(/LIMIT\s+1/i))
      expect(subquery).toMatch(/organisation_id/i)
    })

    it('executes, returning the joined value per record', async () => {
      const result = await compiler.execute(
        { dimensions: ['Employees.name', member('Employees')], ungrouped: true, limit: 20 },
        securityContext
      )

      expect(result.data.length).toBeGreaterThan(0)
      // Every row has the key present; a record with no value for the attribute
      // yields null rather than dropping the row.
      for (const row of result.data) {
        expect(row).toHaveProperty(member('Employees'))
      }
      expect(result.data.some(row => row[member('Employees')] !== null)).toBe(true)
    })

    it('filters on a generated dimension', async () => {
      const unfiltered = await compiler.execute(
        { dimensions: ['Employees.name', member('Employees')], ungrouped: true },
        securityContext
      )
      const known = unfiltered.data.find(row => row[member('Employees')] !== null)
      expect(known).toBeDefined()
      const value = known![member('Employees')]

      const filtered = await compiler.execute(
        {
          dimensions: ['Employees.name', member('Employees')],
          filters: [{ member: member('Employees'), operator: 'equals', values: [String(value)] }],
          ungrouped: true
        },
        securityContext
      )

      expect(filtered.data.length).toBeGreaterThan(0)
      expect(filtered.data.every(row => row[member('Employees')] === value)).toBe(true)
      expect(filtered.data.length).toBeLessThan(unfiltered.data.length)
    })

    it('sorts on a generated dimension', async () => {
      const result = await compiler.execute(
        {
          dimensions: ['Employees.name', member('Employees')],
          order: { [member('Employees')]: 'asc' },
          ungrouped: true
        },
        securityContext
      )

      const values = result.data
        .map(row => row[member('Employees')])
        .filter((v): v is string => v !== null && v !== undefined)

      expect(values).toEqual([...values].sort())
    })

    it('does not leak values belonging to another tenant', async () => {
      const otherTenant = await compiler.execute(
        { dimensions: ['Employees.name', member('Employees')], ungrouped: true },
        { organisationId: 999 }
      )

      expect(otherTenant.data.every(row => row[member('Employees')] === null)).toBe(true)
    })
  })

  describe('joined cubes, and the grouping limitation', () => {
    // Generated dimensions hard-reference their base Drizzle table, while the
    // planner derives aliases independently. Verified rather than assumed.
    let compiler: SemanticLayerCompiler

    beforeAll(async () => {
      compiler = new SemanticLayerCompiler({ databaseExecutor: executor })
      const cubes = await createTestCubesForCurrentDatabase()
      compiler.registerCube({
        ...employeesCube,
        dimensions: { ...employeesCube.dimensions, ...buildDimensions() }
      })
      compiler.registerCube(cubes.testDepartmentsCube)
      compiler.registerCube(cubes.testProductivityCube)
    })

    it('works ungrouped when the cube is joined to another cube', async () => {
      const result = await compiler.execute(
        {
          dimensions: [member('Employees'), 'Departments.name'],
          ungrouped: true,
          limit: 20
        },
        securityContext
      )

      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data.some(row => row[member('Employees')] !== null)).toBe(true)
    })

    // Databend rejects a correlated scalar subquery in GROUP BY outright
    // ("Scalar subquery can't return more than one row"), even with LIMIT 1 —
    // an engine limitation of the generated-dimension approach, not of this
    // query. Databend is not covered by CI, so record it here rather than
    // leaving a red test nobody sees.
    it.skipIf(skipIfDatabend())('works in a grouped query when the record key is also grouped', async () => {
      // The subquery correlates on the record key, so that key must itself be
      // grouped. Postgres rejects the alternative outright ("subquery uses
      // ungrouped column ... from outer query"), and MySQL does the same under
      // only_full_group_by.
      const result = await compiler.execute(
        {
          dimensions: ['Employees.id', member('Employees')],
          measures: ['Employees.count']
        },
        securityContext
      )

      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data.some(row => row[member('Employees')] !== null)).toBe(true)
    })

    it('is rejected by strict engines when grouped without the record key', async () => {
      // Documents a real limitation rather than asserting it away. SQLite is
      // permissive here; Postgres and MySQL are not, so the expectation is
      // engine-dependent.
      const run = () => compiler.execute(
        { dimensions: [member('Employees'), 'Departments.name'], measures: ['Employees.count'] },
        securityContext
      )

      if (getTestDatabaseType() === 'sqlite') {
        await expect(run()).resolves.toBeDefined()
      } else {
        await expect(run()).rejects.toThrow()
      }
    })
  })

  describe('numeric attributes use a tolerant cast', () => {
    it('yields NULL for unparseable text instead of failing the query', async () => {
      const compiler = new SemanticLayerCompiler({ databaseExecutor: executor })
      compiler.registerCube({
        ...employeesCube,
        name: 'EmployeesNumeric',
        dimensions: {
          ...employeesCube.dimensions,
          // 'role' holds words, so every value is unparseable as a number —
          // the strict cast would fail the whole query on Postgres.
          ...buildDimensions({ [String(attributeIds[0])]: 'number' })
        }
      })

      const result = await compiler.execute(
        { dimensions: ['EmployeesNumeric.name', member('EmployeesNumeric')], ungrouped: true, limit: 10 },
        securityContext
      )

      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data.every(row => row[member('EmployeesNumeric')] === null)).toBe(true)
    })
  })
})
