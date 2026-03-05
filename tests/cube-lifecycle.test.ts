/**
 * Tests for cube lifecycle methods: registerCube, unregisterCube, removeCube, clearCubes
 * Validates dynamic registration, removal, re-registration, and metadata cache invalidation
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest'
import { createTestDatabaseExecutor } from './helpers/test-database'
import { createTestCubesForCurrentDatabase } from './helpers/test-cubes'
import { SemanticLayerCompiler } from '../src/server'
import type { Cube, SecurityContext } from '../src/server/types'

let employeesCube: Cube<any>
let departmentsCube: Cube<any>
let productivityCube: Cube<any>
let executor: any

const securityContext: SecurityContext = { organisationId: 1 }

describe('Cube Lifecycle', () => {
  let compiler: SemanticLayerCompiler<any>

  beforeAll(async () => {
    const result = await createTestDatabaseExecutor()
    executor = result.executor

    const cubes = await createTestCubesForCurrentDatabase()
    employeesCube = cubes.testEmployeesCube
    departmentsCube = cubes.testDepartmentsCube
    productivityCube = cubes.testProductivityCube
  })

  beforeEach(() => {
    compiler = new SemanticLayerCompiler({ databaseExecutor: executor })
  })

  describe('registerCube', () => {
    it('should register a cube and make it available', () => {
      compiler.registerCube(employeesCube)

      expect(compiler.hasCube('Employees')).toBe(true)
      expect(compiler.getCube('Employees')).toBe(employeesCube)
      expect(compiler.getCubeNames()).toEqual(['Employees'])
    })

    it('should register multiple cubes', () => {
      compiler.registerCube(employeesCube)
      compiler.registerCube(departmentsCube)

      expect(compiler.getCubeNames()).toEqual(['Employees', 'Departments'])
      expect(compiler.getAllCubes()).toHaveLength(2)
    })

    it('should overwrite a cube with the same name', () => {
      compiler.registerCube(employeesCube)
      const meta1 = compiler.getMetadata()
      expect(meta1).toHaveLength(1)

      // Re-register with same name overwrites
      compiler.registerCube(employeesCube)
      expect(compiler.getAllCubes()).toHaveLength(1)
    })
  })

  describe('unregisterCube', () => {
    it('should remove an existing cube and return true', () => {
      compiler.registerCube(employeesCube)
      compiler.registerCube(departmentsCube)

      const result = compiler.unregisterCube('Employees')

      expect(result).toBe(true)
      expect(compiler.hasCube('Employees')).toBe(false)
      expect(compiler.hasCube('Departments')).toBe(true)
      expect(compiler.getCubeNames()).toEqual(['Departments'])
    })

    it('should return false for a non-existent cube', () => {
      const result = compiler.unregisterCube('NonExistent')
      expect(result).toBe(false)
    })

    it('should invalidate metadata cache after unregister', () => {
      compiler.registerCube(employeesCube)
      compiler.registerCube(departmentsCube)

      // Prime the metadata cache
      const meta1 = compiler.getMetadata()
      expect(meta1).toHaveLength(2)

      compiler.unregisterCube('Employees')

      const meta2 = compiler.getMetadata()
      expect(meta2).toHaveLength(1)
      expect(meta2[0].name).toBe('Departments')
    })

    it('should cause validation to fail for removed cube', () => {
      compiler.registerCube(employeesCube)
      compiler.unregisterCube('Employees')

      const result = compiler.validateQuery({
        measures: ['Employees.count']
      })

      expect(result.isValid).toBe(false)
      expect(result.errors[0]).toContain("Cube 'Employees' not found")
    })
  })

  describe('removeCube', () => {
    it('should work identically to unregisterCube', () => {
      compiler.registerCube(employeesCube)

      const result = compiler.removeCube('Employees')

      expect(result).toBe(true)
      expect(compiler.hasCube('Employees')).toBe(false)
    })

    it('should return false for non-existent cube', () => {
      expect(compiler.removeCube('Ghost')).toBe(false)
    })
  })

  describe('clearCubes', () => {
    it('should remove all registered cubes', () => {
      compiler.registerCube(employeesCube)
      compiler.registerCube(departmentsCube)
      compiler.registerCube(productivityCube)

      compiler.clearCubes()

      expect(compiler.getAllCubes()).toHaveLength(0)
      expect(compiler.getCubeNames()).toEqual([])
      expect(compiler.hasCube('Employees')).toBe(false)
      expect(compiler.hasCube('Departments')).toBe(false)
      expect(compiler.hasCube('Productivity')).toBe(false)
    })

    it('should invalidate metadata cache', () => {
      compiler.registerCube(employeesCube)
      const meta1 = compiler.getMetadata()
      expect(meta1).toHaveLength(1)

      compiler.clearCubes()

      const meta2 = compiler.getMetadata()
      expect(meta2).toHaveLength(0)
    })

    it('should be safe to call on empty compiler', () => {
      expect(() => compiler.clearCubes()).not.toThrow()
      expect(compiler.getAllCubes()).toHaveLength(0)
    })
  })

  describe('re-registration after removal', () => {
    it('should allow re-registering a cube after unregisterCube', () => {
      compiler.registerCube(employeesCube)
      compiler.unregisterCube('Employees')

      expect(compiler.hasCube('Employees')).toBe(false)

      compiler.registerCube(employeesCube)
      expect(compiler.hasCube('Employees')).toBe(true)

      const validation = compiler.validateQuery({
        measures: ['Employees.count']
      })
      expect(validation.isValid).toBe(true)
    })

    it('should allow registering new cubes after clearCubes', () => {
      compiler.registerCube(employeesCube)
      compiler.clearCubes()

      compiler.registerCube(departmentsCube)

      expect(compiler.getCubeNames()).toEqual(['Departments'])
      expect(compiler.getMetadata()).toHaveLength(1)
      expect(compiler.getMetadata()[0].name).toBe('Departments')
    })

    it('should execute queries after re-registration', async () => {
      compiler.registerCube(employeesCube)
      compiler.unregisterCube('Employees')
      compiler.registerCube(employeesCube)

      const result = await compiler.execute(
        { measures: ['Employees.count'] },
        securityContext
      )

      expect(result.data).toBeDefined()
      expect(result.data.length).toBeGreaterThan(0)
    })
  })

  describe('query execution after removal', () => {
    it('should fail to execute queries for removed cubes', async () => {
      compiler.registerCube(employeesCube)
      compiler.unregisterCube('Employees')

      await expect(
        compiler.execute({ measures: ['Employees.count'] }, securityContext)
      ).rejects.toThrow()
    })

    it('should fail to execute queries after clearCubes', async () => {
      compiler.registerCube(employeesCube)
      compiler.clearCubes()

      await expect(
        compiler.execute({ measures: ['Employees.count'] }, securityContext)
      ).rejects.toThrow()
    })
  })

  describe('metadata consistency', () => {
    it('should return consistent metadata through register/unregister cycles', () => {
      compiler.registerCube(employeesCube)
      compiler.registerCube(departmentsCube)

      const meta1 = compiler.getMetadata()
      expect(meta1.map(m => m.name)).toEqual(['Employees', 'Departments'])

      compiler.unregisterCube('Employees')
      const meta2 = compiler.getMetadata()
      expect(meta2.map(m => m.name)).toEqual(['Departments'])

      compiler.registerCube(productivityCube)
      const meta3 = compiler.getMetadata()
      expect(meta3.map(m => m.name)).toEqual(['Departments', 'Productivity'])

      compiler.clearCubes()
      const meta4 = compiler.getMetadata()
      expect(meta4).toEqual([])

      compiler.registerCube(employeesCube)
      const meta5 = compiler.getMetadata()
      expect(meta5.map(m => m.name)).toEqual(['Employees'])
    })
  })
})
