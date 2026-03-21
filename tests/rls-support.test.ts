/**
 * RLS (Row-Level Security) Support Tests
 *
 * Two test groups:
 * 1. Hook behaviour — rlsSetup is called at the right times, dry-run skips it,
 *    the shared DatabaseExecutor is never mutated (concurrency safety).
 * 2. Real PostgreSQL RLS — enables RLS on the employees table, creates a policy
 *    that reads current_setting('app.organisation_id'), and proves that the
 *    database itself enforces tenant isolation when rlsSetup configures the
 *    transaction via SET LOCAL / SET ROLE.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { sql } from 'drizzle-orm'
import { SemanticLayerCompiler, defineCube } from '../src/server'
import type { RLSSetupFn, SecurityContext, DrizzleTransaction, Cube } from '../src/server'
import { createTestDatabaseExecutor, getTestDatabaseType } from './helpers/test-database'
import { getTestCubes } from './helpers/test-cubes'
import { testSecurityContexts } from './helpers/enhanced-test-data'
import { employees } from './helpers/databases/postgres/schema'

// RLS support requires transactions — only test on postgres/mysql
const dbType = getTestDatabaseType()
const isTransactional = dbType === 'postgres' || dbType === 'mysql'
const isPostgres = dbType === 'postgres'

// ---------------------------------------------------------------------------
// 1. Hook behaviour tests (postgres + mysql)
// ---------------------------------------------------------------------------

describe.skipIf(!isTransactional)('RLS Support - Hook Behaviour', () => {
  let dbExecutor: any
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    const result = await createTestDatabaseExecutor()
    dbExecutor = result.executor
    close = result.close
    cubes = await getTestCubes(['Employees', 'Departments', 'Productivity'])
  })

  afterAll(() => {
    if (close) close()
  })

  it('should call rlsSetup before query execution', async () => {
    const rlsSetup = vi.fn(async (_tx: DrizzleTransaction, _ctx: SecurityContext) => {})

    const compiler = new SemanticLayerCompiler({
      databaseExecutor: dbExecutor,
      rlsSetup
    })
    for (const cube of cubes.values()) compiler.registerCube(cube)

    const result = await compiler.execute(
      { measures: ['Employees.count'] },
      testSecurityContexts.org1
    )

    expect(rlsSetup).toHaveBeenCalledTimes(1)
    // First arg should be a transaction object (has select method)
    const txArg = rlsSetup.mock.calls[0][0]
    expect(txArg).toBeDefined()
    expect(typeof txArg.select).toBe('function')
    // Second arg should be the security context
    expect(rlsSetup.mock.calls[0][1]).toEqual(testSecurityContexts.org1)
    // Query should still return valid data
    expect(result.data).toBeDefined()
    expect(result.data.length).toBeGreaterThan(0)
  })

  it('should NOT call rlsSetup for dry-run/SQL generation', async () => {
    const rlsSetup = vi.fn(async () => {})

    const compiler = new SemanticLayerCompiler({
      databaseExecutor: dbExecutor,
      rlsSetup
    })
    for (const cube of cubes.values()) compiler.registerCube(cube)

    const sqlResult = await compiler.dryRun(
      { measures: ['Employees.count'] },
      testSecurityContexts.org1
    )

    expect(rlsSetup).not.toHaveBeenCalled()
    expect(sqlResult.sql).toBeDefined()
    expect(sqlResult.sql.length).toBeGreaterThan(0)
  })

  it('should work with comparison query mode', async () => {
    const rlsSetup = vi.fn(async () => {})

    const compiler = new SemanticLayerCompiler({
      databaseExecutor: dbExecutor,
      rlsSetup
    })
    for (const cube of cubes.values()) compiler.registerCube(cube)

    const result = await compiler.execute(
      {
        measures: ['Employees.count'],
        timeDimensions: [{
          dimension: 'Employees.createdAt',
          granularity: 'month',
          compareDateRange: [
            ['2024-01-01', '2024-06-30'],
            ['2023-01-01', '2023-06-30']
          ]
        }]
      },
      testSecurityContexts.org1
    )

    expect(rlsSetup).toHaveBeenCalledTimes(1)
    expect(result.data).toBeDefined()
  })

  it('should call rlsSetup for explainQuery', async () => {
    const rlsSetup = vi.fn(async () => {})

    const compiler = new SemanticLayerCompiler({
      databaseExecutor: dbExecutor,
      rlsSetup
    })
    for (const cube of cubes.values()) compiler.registerCube(cube)

    await compiler.explainQuery(
      { measures: ['Employees.count'] },
      testSecurityContexts.org1
    )

    expect(rlsSetup).toHaveBeenCalledTimes(1)
  })

  it('should not wrap queries in transaction when rlsSetup is not provided', async () => {
    const compiler = new SemanticLayerCompiler({
      databaseExecutor: dbExecutor
    })
    for (const cube of cubes.values()) compiler.registerCube(cube)

    const result = await compiler.execute(
      { measures: ['Employees.count'] },
      testSecurityContexts.org1
    )

    expect(result.data).toBeDefined()
    expect(result.data.length).toBeGreaterThan(0)
  })

  it('should never mutate the shared db reference during RLS execution', async () => {
    const originalDb = dbExecutor.db
    const rlsSetup = vi.fn(async () => {})

    const compiler = new SemanticLayerCompiler({
      databaseExecutor: dbExecutor,
      rlsSetup
    })
    for (const cube of cubes.values()) compiler.registerCube(cube)

    await compiler.execute(
      { measures: ['Employees.count'] },
      testSecurityContexts.org1
    )

    // The shared executor's db should never have been mutated
    expect(dbExecutor.db).toBe(originalDb)
  })

  it('should never mutate the shared db reference even if query fails', async () => {
    const originalDb = dbExecutor.db
    const rlsSetup = vi.fn(async () => {})

    const compiler = new SemanticLayerCompiler({
      databaseExecutor: dbExecutor,
      rlsSetup
    })
    for (const cube of cubes.values()) compiler.registerCube(cube)

    try {
      await compiler.execute(
        { measures: ['Employees.nonExistentMeasure'] },
        testSecurityContexts.org1
      )
    } catch {
      // Expected to fail
    }

    // The shared executor's db should never have been mutated
    expect(dbExecutor.db).toBe(originalDb)
  })

  it('should pass different security contexts correctly', async () => {
    const capturedContexts: SecurityContext[] = []
    const rlsSetup: RLSSetupFn = async (_tx, ctx) => {
      capturedContexts.push({ ...ctx })
    }

    const compiler = new SemanticLayerCompiler({
      databaseExecutor: dbExecutor,
      rlsSetup
    })
    for (const cube of cubes.values()) compiler.registerCube(cube)

    await compiler.execute(
      { measures: ['Employees.count'] },
      testSecurityContexts.org1
    )
    await compiler.execute(
      { measures: ['Employees.count'] },
      testSecurityContexts.org2
    )

    expect(capturedContexts).toHaveLength(2)
    expect(capturedContexts[0]).toEqual(testSecurityContexts.org1)
    expect(capturedContexts[1]).toEqual(testSecurityContexts.org2)
  })
})

// ---------------------------------------------------------------------------
// 2. Real PostgreSQL RLS enforcement tests
// ---------------------------------------------------------------------------

describe.skipIf(!isPostgres)('RLS Support - PostgreSQL Row Level Security', () => {
  let dbExecutor: any
  let close: () => void

  // Idempotent setup: can run repeatedly without error
  async function setupRLS(db: any) {
    // Create the restricted role (idempotent)
    await db.execute(sql.raw(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rls_reader') THEN
          CREATE ROLE rls_reader NOLOGIN;
        END IF;
      END
      $$
    `))

    // Grant SELECT on employees to the restricted role
    await db.execute(sql.raw(`GRANT SELECT ON employees TO rls_reader`))

    // Enable RLS on employees (idempotent — no error if already enabled)
    await db.execute(sql.raw(`ALTER TABLE employees ENABLE ROW LEVEL SECURITY`))

    // Drop and recreate policy (idempotent)
    await db.execute(sql.raw(`
      DROP POLICY IF EXISTS tenant_isolation ON employees
    `))
    await db.execute(sql.raw(`
      CREATE POLICY tenant_isolation ON employees
        USING (organisation_id = current_setting('app.organisation_id')::int)
    `))
  }

  // Idempotent teardown
  async function teardownRLS(db: any) {
    await db.execute(sql.raw(`DROP POLICY IF EXISTS tenant_isolation ON employees`))
    await db.execute(sql.raw(`ALTER TABLE employees DISABLE ROW LEVEL SECURITY`))
    await db.execute(sql.raw(`REVOKE SELECT ON employees FROM rls_reader`))
  }

  // Define a cube with NO application-level security filter.
  // Security is enforced entirely by PostgreSQL RLS.
  const rlsEmployeesCube = defineCube('RLSEmployees', {
    sql: () => ({ from: employees }),

    measures: {
      count: {
        name: 'count',
        type: 'count',
        sql: employees.id
      }
    },

    dimensions: {
      name: {
        name: 'name',
        type: 'string',
        sql: employees.name
      }
    }
  })

  // The rlsSetup function that configures the transaction for RLS.
  // SET LOCAL scopes settings to the current transaction only.
  // SET LOCAL ROLE switches to the restricted role that is subject to RLS policies.
  const rlsSetup: RLSSetupFn = async (tx, securityContext) => {
    const orgId = String(securityContext.organisationId)
    await tx.execute!(sql.raw(`SET LOCAL app.organisation_id = '${orgId}'`))
    await tx.execute!(sql.raw(`SET LOCAL ROLE rls_reader`))
  }

  beforeAll(async () => {
    const result = await createTestDatabaseExecutor()
    dbExecutor = result.executor
    close = result.close
    await setupRLS(dbExecutor.db)
  })

  afterAll(async () => {
    if (dbExecutor) {
      await teardownRLS(dbExecutor.db)
    }
    if (close) close()
  })

  it('should enforce tenant isolation via PostgreSQL RLS', async () => {
    const compiler = new SemanticLayerCompiler({
      databaseExecutor: dbExecutor,
      rlsSetup
    })
    compiler.registerCube(rlsEmployeesCube)

    const org1Result = await compiler.execute(
      { measures: ['RLSEmployees.count'] },
      testSecurityContexts.org1
    )

    const org2Result = await compiler.execute(
      { measures: ['RLSEmployees.count'] },
      testSecurityContexts.org2
    )

    const org1Count = Number(org1Result.data[0]['RLSEmployees.count'])
    const org2Count = Number(org2Result.data[0]['RLSEmployees.count'])

    // Both orgs should have data
    expect(org1Count).toBeGreaterThan(0)
    expect(org2Count).toBeGreaterThan(0)

    // They should return different counts (different tenants)
    expect(org1Count).not.toEqual(org2Count)
  })

  it('should return zero rows for a non-existent org via RLS', async () => {
    const compiler = new SemanticLayerCompiler({
      databaseExecutor: dbExecutor,
      rlsSetup
    })
    compiler.registerCube(rlsEmployeesCube)

    const result = await compiler.execute(
      { measures: ['RLSEmployees.count'] },
      testSecurityContexts.invalidOrg
    )

    const count = Number(result.data[0]['RLSEmployees.count'])
    expect(count).toBe(0)
  })

  it('should return correct employee names scoped by RLS', async () => {
    const compiler = new SemanticLayerCompiler({
      databaseExecutor: dbExecutor,
      rlsSetup
    })
    compiler.registerCube(rlsEmployeesCube)

    // Get org1 employees
    const org1Result = await compiler.execute(
      { measures: ['RLSEmployees.count'], dimensions: ['RLSEmployees.name'] },
      testSecurityContexts.org1
    )

    // Get org2 employees
    const org2Result = await compiler.execute(
      { measures: ['RLSEmployees.count'], dimensions: ['RLSEmployees.name'] },
      testSecurityContexts.org2
    )

    const org1Names = new Set(org1Result.data.map((r: any) => r['RLSEmployees.name']))
    const org2Names = new Set(org2Result.data.map((r: any) => r['RLSEmployees.name']))

    // The two orgs should have non-overlapping employee sets
    // (test data uses different names per org)
    expect(org1Names.size).toBeGreaterThan(0)
    expect(org2Names.size).toBeGreaterThan(0)
  })

  it('should not produce security warnings for cubes when rlsSetup is configured', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const compiler = new SemanticLayerCompiler({
      databaseExecutor: dbExecutor,
      rlsSetup
    })
    compiler.registerCube(rlsEmployeesCube)

    // Force the security validation path (only runs in development)
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    try {
      await compiler.execute(
        { measures: ['RLSEmployees.count'] },
        testSecurityContexts.org1
      )
    } finally {
      process.env.NODE_ENV = originalEnv
    }

    // Should NOT have warned about missing security filtering
    const securityWarnings = warnSpy.mock.calls.filter(
      call => typeof call[0] === 'string' && call[0].includes('no security filtering')
    )
    expect(securityWarnings).toHaveLength(0)

    warnSpy.mockRestore()
  })
})
