/**
 * RLS (Row-Level Security) Support Tests
 * Tests that rlsSetup is called before query execution inside a transaction,
 * and that dry-run/SQL generation does NOT trigger it.
 */

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { SemanticLayerCompiler } from '../src/server'
import type { RLSSetupFn, SecurityContext, DrizzleTransaction, Cube } from '../src/server'
import { createTestDatabaseExecutor, getTestDatabaseType } from './helpers/test-database'
import { getTestCubes } from './helpers/test-cubes'
import { testSecurityContexts } from './helpers/enhanced-test-data'

// RLS support requires transactions — only test on postgres/mysql
const dbType = getTestDatabaseType()
const isTransactional = dbType === 'postgres' || dbType === 'mysql'

describe.skipIf(!isTransactional)('RLS Support', () => {
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
    // vi.fn() wraps a function as a "spy" — it behaves normally but records
    // every call, so we can later assert how many times it was called
    // and inspect the arguments via rlsSetup.mock.calls[n][argIndex].
    const rlsSetup = vi.fn(async (_tx: DrizzleTransaction, _ctx: SecurityContext) => {
      // no-op — just verify it gets called
    })

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

  it('should restore original db reference after transaction completes', async () => {
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

    // db reference should be restored after transaction
    expect(dbExecutor.db).toBe(originalDb)
  })

  it('should restore original db reference even if query fails', async () => {
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

    // db reference should still be restored
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
