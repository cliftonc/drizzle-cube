/**
 * `total` — Cube's "rows as if no limit or offset are set".
 *
 * The interesting cases are the ones a naive `COUNT(*)` gets wrong: a grouped
 * query must count groups rather than base rows, filters must still apply, and
 * the count must be independent of the page requested.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { createTestCubesForCurrentDatabase } from './helpers/test-cubes'
import { SemanticLayerCompiler } from '../src/server'
import type { SecurityContext } from '../src/server'

const securityContext: SecurityContext = { organisationId: 1 }
const otherTenant: SecurityContext = { organisationId: 2 }

let compiler: SemanticLayerCompiler

describe('query total', () => {
  beforeAll(async () => {
    const { executor } = await createTestDatabaseExecutor()
    compiler = new SemanticLayerCompiler({ databaseExecutor: executor })
    const cubes = await createTestCubesForCurrentDatabase()
    compiler.registerCube(cubes.testEmployeesCube)
    compiler.registerCube(cubes.testDepartmentsCube)
  })

  it('is absent unless the query asks for it', async () => {
    const result = await compiler.execute(
      { dimensions: ['Employees.name'], ungrouped: true, limit: 2 },
      securityContext
    )

    expect(result.total).toBeUndefined()
  })

  it('counts every row an ungrouped query would return, ignoring the page', async () => {
    const all = await compiler.execute(
      { dimensions: ['Employees.name'], ungrouped: true },
      securityContext
    )
    const page = await compiler.execute(
      { dimensions: ['Employees.name'], ungrouped: true, limit: 2, total: true },
      securityContext
    )

    expect(page.data.length).toBe(2)
    expect(page.total).toBe(all.data.length)
    expect(page.total).toBeGreaterThan(2)
  })

  it('is the same regardless of which page is requested', async () => {
    const first = await compiler.execute(
      { dimensions: ['Employees.name'], ungrouped: true, limit: 2, offset: 0, total: true },
      securityContext
    )
    const second = await compiler.execute(
      { dimensions: ['Employees.name'], ungrouped: true, limit: 2, offset: 2, total: true },
      securityContext
    )

    expect(second.total).toBe(first.total)
  })

  it('counts groups, not base rows, for a grouped query', async () => {
    const grouped = await compiler.execute(
      { dimensions: ['Employees.departmentId'], measures: ['Employees.count'] },
      securityContext
    )
    const paged = await compiler.execute(
      {
        dimensions: ['Employees.departmentId'],
        measures: ['Employees.count'],
        limit: 1,
        total: true
      },
      securityContext
    )

    expect(paged.total).toBe(grouped.data.length)
    // Sanity: there really are more employees than departments, so a count of
    // base rows would give a different (larger) answer.
    const rows = await compiler.execute({ measures: ['Employees.count'] }, securityContext)
    expect(Number(rows.data[0]['Employees.count'])).toBeGreaterThan(paged.total!)
  })

  it('respects filters', async () => {
    const query = {
      dimensions: ['Employees.name'],
      ungrouped: true,
      filters: [{ member: 'Employees.isActive', operator: 'equals' as const, values: [true] }]
    }
    const all = await compiler.execute(query, securityContext)
    const paged = await compiler.execute({ ...query, limit: 1, total: true }, securityContext)

    expect(paged.total).toBe(all.data.length)
  })

  it('respects the security context', async () => {
    const query = { dimensions: ['Employees.name'], ungrouped: true, limit: 1, total: true }
    const mine = await compiler.execute(query, securityContext)
    const theirs = await compiler.execute(query, otherTenant)

    const allMine = await compiler.execute({ dimensions: ['Employees.name'], ungrouped: true }, securityContext)
    const allTheirs = await compiler.execute({ dimensions: ['Employees.name'], ungrouped: true }, otherTenant)

    expect(mine.total).toBe(allMine.data.length)
    expect(theirs.total).toBe(allTheirs.data.length)
    expect(mine.total).not.toBe(theirs.total)
  })

  it('counts across a join', async () => {
    const query = {
      dimensions: ['Employees.name', 'Departments.name'],
      ungrouped: true
    }
    const all = await compiler.execute(query, securityContext)
    const paged = await compiler.execute({ ...query, limit: 1, total: true }, securityContext)

    expect(paged.total).toBe(all.data.length)
  })

  it('counts the full set even when the requested page is empty', async () => {
    // A count derived from the returned rows (or from a window function) would
    // vanish here; the separate count query is what keeps it correct.
    const result = await compiler.execute(
      { dimensions: ['Employees.name'], ungrouped: true, limit: 5, offset: 10_000, total: true },
      securityContext
    )

    expect(result.data).toHaveLength(0)
    expect(result.total).toBeGreaterThan(0)
  })
})
