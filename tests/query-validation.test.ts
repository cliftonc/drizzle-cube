/**
 * Tests for query validation logic
 * Validates that cube and field existence checks work correctly
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { 
  createTestDatabase,   
  testSchema,
  employees,
  departments
} from './helpers/test-database'
import type { TestSchema } from './helpers/test-database'

import { 
  SemanticLayerCompiler,
  createPostgresExecutor
} from '../src/server'

import { defineCube } from '../src/server/types-drizzle'
import type { 
  Cube, 
  QueryContext,
  BaseQueryDefinition,
  SemanticQuery
} from '../src/server/types-drizzle'

// Create test cubes
const employeesCube: Cube<TestSchema> = defineCube('Employees', {
  title: 'Employees Cube',
  description: 'Test cube for validation',
  
  sql: (ctx: QueryContext<TestSchema>): BaseQueryDefinition => ({
    from: employees,
    where: eq(employees.organisationId, ctx.securityContext.organisationId)
  }),
  
  dimensions: {
    id: { sql: employees.id, type: 'number' },
    name: { sql: employees.name, type: 'string' },
    email: { sql: employees.email, type: 'string' },
    startDate: { sql: employees.startDate, type: 'time' }
  },
  
  measures: {
    count: { sql: employees.id, type: 'count' },
    avgSalary: { sql: employees.salary, type: 'avg' }
  }
})

const departmentsCube: Cube<TestSchema> = defineCube('Departments', {
  title: 'Departments Cube',
  description: 'Test cube for validation',
  
  sql: (ctx: QueryContext<TestSchema>): BaseQueryDefinition => ({
    from: departments,
    where: eq(departments.organisationId, ctx.securityContext.organisationId)
  }),
  
  dimensions: {
    id: { sql: departments.id, type: 'number' },
    name: { sql: departments.name, type: 'string' }
  },
  
  measures: {
    count: { sql: departments.id, type: 'count' }
  }
})

describe('Query Validation', () => {
  let compiler: SemanticLayerCompiler<TestSchema>

  beforeAll(async () => {
    // Create database and executor
    const db = await createTestDatabase()
    const executor = createPostgresExecutor(db, testSchema)
    
    // Create compiler and register cubes
    compiler = new SemanticLayerCompiler({ databaseExecutor: executor })
    compiler.registerCube(employeesCube)
    compiler.registerCube(departmentsCube)
  })

  describe('Cube existence validation', () => {
    it('should pass validation for existing cubes', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['Employees.name']
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation for non-existent cube in measures', () => {
      const query: SemanticQuery = {
        measures: ['NonExistentCube.count']
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Cube 'NonExistentCube' not found (referenced in measure 'NonExistentCube.count')")
    })

    it('should fail validation for non-existent cube in dimensions', () => {
      const query: SemanticQuery = {
        dimensions: ['NonExistentCube.name']
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Cube 'NonExistentCube' not found (referenced in dimension 'NonExistentCube.name')")
    })
  })

  describe('Field existence validation', () => {
    it('should fail validation for non-existent measure', () => {
      const query: SemanticQuery = {
        measures: ['Employees.nonExistentMeasure']
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Measure 'nonExistentMeasure' not found on cube 'Employees'")
    })

    it('should fail validation for non-existent dimension', () => {
      const query: SemanticQuery = {
        dimensions: ['Employees.nonExistentDimension']
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Dimension 'nonExistentDimension' not found on cube 'Employees'")
    })

    it('should pass validation for existing measures and dimensions', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count', 'Departments.count'],
        dimensions: ['Employees.name', 'Departments.name']
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('TimeDimensions validation', () => {
    it('should pass validation for existing time dimension', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        timeDimensions: [{
          dimension: 'Employees.startDate',
          granularity: 'month'
        }]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation for non-existent time dimension', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        timeDimensions: [{
          dimension: 'Employees.nonExistentDate',
          granularity: 'month'
        }]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("TimeDimension 'nonExistentDate' not found on cube 'Employees' (must be a dimension with time type)")
    })

    it('should fail validation for time dimension on non-existent cube', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        timeDimensions: [{
          dimension: 'NonExistentCube.startDate',
          granularity: 'month'
        }]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Cube 'NonExistentCube' not found (referenced in timeDimension 'NonExistentCube.startDate')")
    })
  })

  describe('Filters validation', () => {
    it('should pass validation for filter on existing dimension', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [{
          member: 'Employees.name',
          operator: 'contains',
          values: ['John']
        }]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should pass validation for filter on existing measure', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [{
          member: 'Employees.avgSalary',
          operator: 'gt',
          values: [50000]
        }]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation for filter on non-existent field', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [{
          member: 'Employees.nonExistentField',
          operator: 'equals',
          values: ['value']
        }]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Filter field 'nonExistentField' not found on cube 'Employees' (must be a dimension or measure)")
    })

    it('should fail validation for filter on non-existent cube', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [{
          member: 'NonExistentCube.name',
          operator: 'equals',
          values: ['value']
        }]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Cube 'NonExistentCube' not found (referenced in filter 'NonExistentCube.name')")
    })
  })

  describe('Format validation', () => {
    it('should fail validation for invalid measure format', () => {
      const query: SemanticQuery = {
        measures: ['InvalidFormat']
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Invalid measure format: InvalidFormat. Expected format: 'CubeName.fieldName'")
    })

    it('should fail validation for invalid dimension format', () => {
      const query: SemanticQuery = {
        dimensions: ['InvalidFormat']
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Invalid dimension format: InvalidFormat. Expected format: 'CubeName.fieldName'")
    })

    it('should fail validation for invalid filter format', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [{
          member: 'InvalidFormat',
          operator: 'equals',
          values: ['value']
        }]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Invalid filter member format: InvalidFormat. Expected format: 'CubeName.fieldName'")
    })
  })

  describe('Empty query validation', () => {
    it('should fail validation for completely empty query', () => {
      const query: SemanticQuery = {}
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Query must reference at least one cube through measures, dimensions, or filters')
    })

    it('should fail validation for query with empty arrays', () => {
      const query: SemanticQuery = {
        measures: [],
        dimensions: [],
        filters: []
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Query must reference at least one cube through measures, dimensions, or filters')
    })
  })

  describe('Multi-cube validation', () => {
    it('should pass validation for valid multi-cube query', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count', 'Departments.count'],
        dimensions: ['Employees.name', 'Departments.name']
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail validation when one cube in multi-cube query does not exist', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count', 'NonExistentCube.count'],
        dimensions: ['Employees.name']
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Cube 'NonExistentCube' not found (referenced in measure 'NonExistentCube.count')")
    })
  })
})