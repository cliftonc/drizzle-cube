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
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import { createTestCubesForCurrentDatabase } from './helpers/test-cubes'
import { SemanticLayerCompiler, buildAttributeDimensions } from '../src/server'
import type { Cube, SecurityContext, QueryContext } from '../src/server'

let executor: any
let schema: any
let employeesCube: Cube

const securityContext: SecurityContext = { organisationId: 1 }

/** The two "attributes" — real team ids seeded for organisation 1. */
const attributeDefs = [
  { id: 1, name: 'Platform role' },
  { id: 2, name: 'Product role' }
]

function buildDimensions(overrides: Record<string, 'string' | 'number' | 'time'> = {}, shown?: boolean) {
  return buildAttributeDimensions({
    attributes: attributeDefs,
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
  })

  describe('dimension shape', () => {
    it('derives the member name from the attribute id and the title from its name', () => {
      const dimensions = buildDimensions()

      expect(Object.keys(dimensions)).toEqual(['attr_1', 'attr_2'])
      expect(dimensions.attr_1.name).toBe('attr_1')
      expect(dimensions.attr_1.title).toBe('Platform role')
    })

    it('keeps the member name stable when the attribute is renamed', () => {
      const before = buildDimensions()
      const renamed = buildAttributeDimensions({
        attributes: [{ id: 1, name: 'Platform responsibility' }],
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
      expect(renamed.attr_1.title).toBe('Platform responsibility')
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
        { dimensions: ['Employees.attr_1'], measures: ['Employees.count'] },
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
        { dimensions: ['Employees.name', 'Employees.attr_1'], ungrouped: true, limit: 20 },
        securityContext
      )

      expect(result.data.length).toBeGreaterThan(0)
      // Every row has the key present; a record with no value for the attribute
      // yields null rather than dropping the row.
      for (const row of result.data) {
        expect(row).toHaveProperty('Employees.attr_1')
      }
      expect(result.data.some(row => row['Employees.attr_1'] !== null)).toBe(true)
    })

    it('filters on a generated dimension', async () => {
      const unfiltered = await compiler.execute(
        { dimensions: ['Employees.name', 'Employees.attr_1'], ungrouped: true },
        securityContext
      )
      const known = unfiltered.data.find(row => row['Employees.attr_1'] !== null)
      expect(known).toBeDefined()
      const value = known!['Employees.attr_1']

      const filtered = await compiler.execute(
        {
          dimensions: ['Employees.name', 'Employees.attr_1'],
          filters: [{ member: 'Employees.attr_1', operator: 'equals', values: [String(value)] }],
          ungrouped: true
        },
        securityContext
      )

      expect(filtered.data.length).toBeGreaterThan(0)
      expect(filtered.data.every(row => row['Employees.attr_1'] === value)).toBe(true)
      expect(filtered.data.length).toBeLessThan(unfiltered.data.length)
    })

    it('sorts on a generated dimension', async () => {
      const result = await compiler.execute(
        {
          dimensions: ['Employees.name', 'Employees.attr_1'],
          order: { 'Employees.attr_1': 'asc' },
          ungrouped: true
        },
        securityContext
      )

      const values = result.data
        .map(row => row['Employees.attr_1'])
        .filter((v): v is string => v !== null && v !== undefined)

      expect(values).toEqual([...values].sort())
    })

    it('does not leak values belonging to another tenant', async () => {
      const otherTenant = await compiler.execute(
        { dimensions: ['Employees.name', 'Employees.attr_1'], ungrouped: true },
        { organisationId: 999 }
      )

      expect(otherTenant.data.every(row => row['Employees.attr_1'] === null)).toBe(true)
    })
  })

  describe('alias safety: the subquery references the base table directly', () => {
    // Generated dimensions hard-reference their base Drizzle table, while the
    // planner derives aliases independently. This is the case the spec said to
    // verify rather than assume.
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

    it('works when the cube is joined to another cube', async () => {
      const result = await compiler.execute(
        {
          dimensions: ['Employees.attr_1', 'Departments.name'],
          measures: ['Employees.count']
        },
        securityContext
      )

      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data.some(row => row['Employees.attr_1'] !== null)).toBe(true)
    })

    it('works alongside a measure from a second fact cube', async () => {
      const result = await compiler.execute(
        {
          dimensions: ['Employees.attr_1'],
          measures: ['Employees.count', 'Productivity.totalLinesOfCode']
        },
        securityContext
      )

      expect(result.data.length).toBeGreaterThan(0)
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
          ...buildDimensions({ '1': 'number' })
        }
      })

      const result = await compiler.execute(
        { dimensions: ['EmployeesNumeric.name', 'EmployeesNumeric.attr_1'], ungrouped: true, limit: 10 },
        securityContext
      )

      expect(result.data.length).toBeGreaterThan(0)
      expect(result.data.every(row => row['EmployeesNumeric.attr_1'] === null)).toBe(true)
    })
  })
})
