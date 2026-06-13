/**
 * Regression guard: junction-table tenant security WHERE.
 *
 * For belongsToMany relationships the junction table's `securitySql` filter must
 * appear in the generated SQL's WHERE clause (m2m semantics require dropping
 * non-matching junction rows, not NULL-padding them). The junction table's
 * `organisation_id` column is referenced ONLY by that security filter — the join
 * conditions use the FK columns (employee_id / team_id / department_id) — so its
 * presence in the SQL is a precise proxy for the security predicate.
 *
 * This is intentionally a behaviour guard around the logical-plan IR refactor
 * (#851 PR3 stage 3): the junction security must survive moving join-condition
 * materialization out of the planner and into the physical builder.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { QueryExecutor } from '../src/server/executor'
import { getTestCubes } from './helpers/test-cubes'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import type { Cube, SemanticQuery } from '../src/server/types'

/** Strip identifier quoting so the assertion is engine-agnostic. */
function normalize(sql: string): string {
  return sql.replace(/["`]/g, '')
}

describe('Junction-table security WHERE (belongsToMany)', () => {
  let executor: QueryExecutor
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes()
  })

  afterAll(() => {
    if (close) close()
  })

  it('applies junction security on employee_teams for an Employees→Teams query', async () => {
    const query: SemanticQuery = {
      measures: ['Employees.count'],
      dimensions: ['Teams.name']
    }

    const { sql } = await executor.generateMultiCubeSQL(cubes, query, testSecurityContexts.org1)
    const normalized = normalize(sql)

    // The junction table is present (the m2m join was emitted) ...
    expect(normalized).toContain('employee_teams')
    // ... and its tenant filter (the only reference to its organisation_id) is too.
    expect(normalized).toContain('employee_teams.organisation_id')
  })

  it('keeps junction security scoped to the request security context', async () => {
    const query: SemanticQuery = {
      measures: ['Employees.count'],
      dimensions: ['Teams.name']
    }

    const { sql, params } = await executor.generateMultiCubeSQL(cubes, query, testSecurityContexts.org2)
    const normalized = normalize(sql)

    // Junction security predicate present and parameterised with the org2 context.
    expect(normalized).toContain('employee_teams.organisation_id')
    expect(params).toContain(2)
  })
})
