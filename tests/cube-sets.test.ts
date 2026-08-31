/**
 * Tests for per-tenant cube sets: registration, resolution from the security
 * context, metadata partitioning, cache-key isolation and boot observability.
 *
 * The governing invariant these cover: cube *contents* are only ever reachable
 * through a security context, and two tenants whose cube sets differ can never
 * share a cached result.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { createTestCubesForCurrentDatabase } from './helpers/test-cubes'
import { SemanticLayerCompiler, BASE_CUBE_SET_ID, SINGLE_TENANT_CONTEXT } from '../src/server'
import { generateCacheKey } from '../src/server/cache-utils'
import type { Cube, SecurityContext, CubeSetRegistrationInfo } from '../src/server'

let employeesCube: Cube
let departmentsCube: Cube
let executor: any

const tenantA: SecurityContext = { organisationId: 1 }
const tenantB: SecurityContext = { organisationId: 2 }

/** A copy of a cube carrying one extra dimension, standing in for a generated per-tenant field. */
function withExtraDimension(cube: Cube, dimensionName: string): Cube {
  const [firstDimension] = Object.values(cube.dimensions)
  return {
    ...cube,
    dimensions: {
      ...cube.dimensions,
      [dimensionName]: { ...firstDimension, name: dimensionName, title: dimensionName }
    }
  }
}

describe('Cube sets (per-tenant cube definitions)', () => {
  let compiler: SemanticLayerCompiler

  beforeAll(async () => {
    const result = await createTestDatabaseExecutor()
    executor = result.executor

    const cubes = await createTestCubesForCurrentDatabase()
    employeesCube = cubes.testEmployeesCube
    departmentsCube = cubes.testDepartmentsCube
  })

  describe('backward compatibility', () => {
    beforeEach(() => {
      compiler = new SemanticLayerCompiler({ databaseExecutor: executor })
    })

    it('serves the base set to every context when no mapping is configured', () => {
      compiler.registerCube(employeesCube)

      expect(compiler.getCubeNames(tenantA)).toEqual(['Employees'])
      expect(compiler.getCubeNames(tenantB)).toEqual(['Employees'])
      expect(compiler.getCubeNames(SINGLE_TENANT_CONTEXT)).toEqual(['Employees'])
      expect(compiler.getMetadata(tenantA)).toHaveLength(1)
    })

    it('reports no cube sets when none are registered', () => {
      compiler.registerCube(employeesCube)

      expect(compiler.getCubeSetIds()).toEqual([])
      expect(compiler.getCubeSetStats()).toMatchObject({ setCount: 0, cubeCount: 0 })
    })
  })

  describe('resolution from the security context', () => {
    beforeEach(() => {
      compiler = new SemanticLayerCompiler({
        databaseExecutor: executor,
        contextToCubeSetId: (ctx) => String(ctx.organisationId)
      })
      compiler.registerCube(employeesCube)
    })

    it('serves a tenant its own cubes, overlaying the base set by name', () => {
      compiler.registerCubeSet('1', [withExtraDimension(employeesCube, 'attr_health'), departmentsCube])

      expect(compiler.getCubeNames(tenantA).sort()).toEqual(['Departments', 'Employees'])
      expect(compiler.getCube('Employees', tenantA)?.dimensions.attr_health).toBeDefined()
    })

    it('does not leak one tenant’s cubes or dimensions to another', () => {
      compiler.registerCubeSet('1', [withExtraDimension(employeesCube, 'attr_health'), departmentsCube])

      expect(compiler.getCubeNames(tenantB)).toEqual(['Employees'])
      expect(compiler.hasCube('Departments', tenantB)).toBe(false)
      expect(compiler.getCube('Employees', tenantB)?.dimensions.attr_health).toBeUndefined()
    })

    it('falls back to the base set for a tenant with no registered set', () => {
      compiler.registerCubeSet('1', [departmentsCube])

      expect(compiler.getCubeNames(tenantB)).toEqual(['Employees'])
    })

    it('throws for an unregistered set under missingCubeSet: throw', () => {
      const strict = new SemanticLayerCompiler({
        databaseExecutor: executor,
        contextToCubeSetId: (ctx) => String(ctx.organisationId),
        missingCubeSet: 'throw'
      })
      strict.registerCube(employeesCube)
      strict.registerCubeSet('1', [departmentsCube])

      expect(() => strict.getCubeNames(tenantB)).toThrow(/cube set/i)
      expect(strict.getCubeNames(tenantA)).toBeDefined()
    })

    it('rejects the reserved base-set id', () => {
      expect(() => compiler.registerCubeSet(BASE_CUBE_SET_ID, [departmentsCube])).toThrow()
    })

    it('never reuses a cache key after unregister/re-register with different cubes', () => {
      const generations: number[] = []
      const observed = new SemanticLayerCompiler({
        databaseExecutor: executor,
        contextToCubeSetId: (ctx) => String(ctx.organisationId),
        onCubeSetRegistered: (info) => generations.push(info.generation)
      })
      observed.registerCube(employeesCube)

      observed.registerCubeSet('1', [departmentsCube])
      observed.unregisterCubeSet('1')
      observed.registerCubeSet('1', [withExtraDimension(departmentsCube, 'attr_owner')])

      // A per-set counter would restart at 1 here and reproduce the first
      // registration's cache key, serving results built from the old cubes.
      expect(generations[1]).toBeGreaterThan(generations[0])
    })

    it('returns a tenant to the base set when its cube set is unregistered', () => {
      compiler.registerCubeSet('1', [departmentsCube])
      expect(compiler.hasCube('Departments', tenantA)).toBe(true)

      expect(compiler.unregisterCubeSet('1')).toBe(true)
      expect(compiler.hasCube('Departments', tenantA)).toBe(false)
      expect(compiler.unregisterCubeSet('1')).toBe(false)
    })

    it('propagates a later base-cube registration into existing sets', () => {
      compiler.registerCubeSet('1', [withExtraDimension(employeesCube, 'attr_health')])
      compiler.registerCube(departmentsCube)

      // The set keeps its overlay and gains the new base cube.
      expect(compiler.getCubeNames(tenantA).sort()).toEqual(['Departments', 'Employees'])
      expect(compiler.getCube('Employees', tenantA)?.dimensions.attr_health).toBeDefined()
    })
  })

  describe('metadata partitioning', () => {
    beforeEach(() => {
      compiler = new SemanticLayerCompiler({
        databaseExecutor: executor,
        contextToCubeSetId: (ctx) => String(ctx.organisationId)
      })
      compiler.registerCube(employeesCube)
    })

    it('returns each tenant its own metadata', () => {
      compiler.registerCubeSet('1', [departmentsCube])

      expect(compiler.getMetadata(tenantA).map(c => c.name).sort()).toEqual(['Departments', 'Employees'])
      expect(compiler.getMetadata(tenantB).map(c => c.name)).toEqual(['Employees'])
    })

    it('caches metadata per set and invalidates only the re-registered set', () => {
      compiler.registerCubeSet('1', [departmentsCube])
      compiler.registerCubeSet('2', [departmentsCube])

      const beforeA = compiler.getMetadata(tenantA)
      const beforeB = compiler.getMetadata(tenantB)
      expect(compiler.getMetadata(tenantA)).toBe(beforeA)   // cached

      compiler.registerCubeSet('1', [withExtraDimension(departmentsCube, 'attr_owner')])

      expect(compiler.getMetadata(tenantA)).not.toBe(beforeA)  // invalidated
      expect(compiler.getMetadata(tenantB)).toBe(beforeB)      // untouched
    })

    it('invalidates every set when a base cube changes', () => {
      compiler.registerCubeSet('1', [departmentsCube])
      const before = compiler.getMetadata(tenantA)

      compiler.registerCube(withExtraDimension(employeesCube, 'attr_extra'))

      expect(compiler.getMetadata(tenantA)).not.toBe(before)
    })
  })

  describe('cache-key isolation', () => {
    const query = { measures: ['Employees.count'] }

    it('separates identical security contexts whose cube sets differ', () => {
      const keyA = generateCacheKey(query, tenantA, {}, '1:1.1')
      const keyB = generateCacheKey(query, tenantA, {}, '2:1.1')

      expect(keyA).not.toBe(keyB)
    })

    it('still separates cube sets when the security context is excluded from the key', () => {
      const config = { includeSecurityContext: false }
      const keyA = generateCacheKey(query, tenantA, config, '1:1.1')
      const keyB = generateCacheKey(query, tenantB, config, '2:1.1')

      expect(keyA).not.toBe(keyB)
    })

    it('still separates cube sets under a lossy custom security-context serializer', () => {
      const config = { securityContextSerializer: () => 'constant' }
      const keyA = generateCacheKey(query, tenantA, config, '1:1.1')
      const keyB = generateCacheKey(query, tenantB, config, '2:1.1')

      expect(keyA).not.toBe(keyB)
    })

    it('changes when a set is re-registered, so a retyped dimension is never served stale', () => {
      const before = generateCacheKey(query, tenantA, {}, '1:1.1')
      const after = generateCacheKey(query, tenantA, {}, '1:1.2')

      expect(before).not.toBe(after)
    })

    it('is unchanged from today when no cube set key is supplied', () => {
      expect(generateCacheKey(query, tenantA, {})).toBe(generateCacheKey(query, tenantA, {}, undefined))
    })
  })

  describe('end-to-end: the resolved set reaches execution and validation', () => {
    beforeEach(() => {
      compiler = new SemanticLayerCompiler({
        databaseExecutor: executor,
        contextToCubeSetId: (ctx) => String(ctx.organisationId)
      })
      compiler.registerCube(employeesCube)
      compiler.registerCubeSet('2', [withExtraDimension(employeesCube, 'attr_health')])
    })

    it('validates a tenant-only dimension for that tenant and rejects it for others', () => {
      const query = { measures: ['Employees.count'], dimensions: ['Employees.attr_health'] }

      expect(compiler.validateQuery(query, tenantB).isValid).toBe(true)

      const forA = compiler.validateQuery(query, tenantA)
      expect(forA.isValid).toBe(false)
      expect(forA.errors.join(' ')).toMatch(/attr_health/)
    })

    it('executes a query against the tenant-only dimension', async () => {
      const result = await compiler.execute(
        { measures: ['Employees.count'], dimensions: ['Employees.attr_health'] },
        tenantB
      )

      expect(result.data).toBeDefined()
      expect(result.annotation?.dimensions).toHaveProperty('Employees.attr_health')
    })

    it('generates SQL for the tenant’s cube, not the base cube', async () => {
      const { sql } = await compiler.dryRun(
        { measures: ['Employees.count'], dimensions: ['Employees.attr_health'] },
        tenantB
      )

      expect(sql).toBeTruthy()
      await expect(
        compiler.dryRun({ measures: ['Employees.count'], dimensions: ['Employees.attr_health'] }, tenantA)
      ).rejects.toThrow()
    })
  })

  describe('the invariant: cube contents need a security context', () => {
    it('requires a security context on every public cube-reading method', () => {
      const proto = SemanticLayerCompiler.prototype

      // Function.length counts leading required parameters, so this fails if
      // any of these regains an optional/absent context.
      expect(proto.getMetadata.length).toBe(1)
      expect(proto.getCubeNames.length).toBe(1)
      expect(proto.getAllCubes.length).toBe(1)
      expect(proto.getAllCubesMap.length).toBe(1)
      expect(proto.validateQuery.length).toBe(2)
      expect(proto.getCube.length).toBe(2)
      expect(proto.hasCube.length).toBe(2)
    })

    it('keeps set lifecycle free of a security context — registration defines tenancy', () => {
      const proto = SemanticLayerCompiler.prototype

      expect(proto.registerCubeSet.length).toBe(2)     // (setId, cubes)
      expect(proto.unregisterCubeSet.length).toBe(1)   // (setId)
      expect(proto.getCubeSetStats.length).toBe(0)
    })
  })

  describe('boot observability', () => {
    it('reports each registration through onCubeSetRegistered', () => {
      const seen: CubeSetRegistrationInfo[] = []
      const observed = new SemanticLayerCompiler({
        databaseExecutor: executor,
        contextToCubeSetId: (ctx) => String(ctx.organisationId),
        onCubeSetRegistered: (info) => seen.push(info)
      })
      observed.registerCube(employeesCube)

      observed.registerCubeSet('1', [withExtraDimension(employeesCube, 'attr_health')])
      observed.registerCubeSet('1', [withExtraDimension(employeesCube, 'attr_health')])

      expect(seen).toHaveLength(2)
      expect(seen[0].setId).toBe('1')
      expect(seen[1].generation).toBeGreaterThan(seen[0].generation)
      expect(seen[0].dimensionCount).toBe(Object.keys(employeesCube.dimensions).length + 1)
      expect(seen[0].durationMs).toBeGreaterThanOrEqual(0)
    })

    it('aggregates registration cost across sets', () => {
      const observed = new SemanticLayerCompiler({
        databaseExecutor: executor,
        contextToCubeSetId: (ctx) => String(ctx.organisationId)
      })
      observed.registerCube(employeesCube)
      observed.registerCubeSet('1', [departmentsCube])
      observed.registerCubeSet('2', [departmentsCube])

      const stats = observed.getCubeSetStats()
      expect(stats.setCount).toBe(2)
      expect(stats.cubeCount).toBe(4)          // 2 cubes (base + overlay) per set
      expect(stats.totalRegistrationMs).toBeGreaterThanOrEqual(0)
      expect(stats.slowestSet?.setId).toBeDefined()
    })
  })
})
