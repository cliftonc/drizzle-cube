/**
 * Tests for comprehensive invalid query structure handling
 * Extends basic query validation with comprehensive negative testing
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { 
  createTestDatabaseExecutor
} from './helpers/test-database'
import { 
  SemanticLayerCompiler
} from '../src/server'
import type { 
  Cube, 
  SemanticQuery
} from '../src/server/types'
import { createTestCubesForCurrentDatabase } from './helpers/test-cubes'

let employeesCube: Cube<any>
let departmentsCube: Cube<any>
let productivityCube: Cube<any>

describe('Error Handling - Invalid Query Structures', () => {
  let compiler: SemanticLayerCompiler<any>

  beforeAll(async () => {
    const { executor } = await createTestDatabaseExecutor()
    
    const { testEmployeesCube, testDepartmentsCube, testProductivityCube } = 
      await createTestCubesForCurrentDatabase()
    
    employeesCube = testEmployeesCube
    departmentsCube = testDepartmentsCube
    productivityCube = testProductivityCube
    
    compiler = new SemanticLayerCompiler({ databaseExecutor: executor })
    compiler.registerCube(employeesCube)
    compiler.registerCube(departmentsCube)
    compiler.registerCube(productivityCube)
  })

  describe('Missing Required Fields', () => {
    it('should reject completely empty query object', () => {
      const query: SemanticQuery = {}
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Query must reference at least one cube through measures, dimensions, or filters')
    })

    it('should reject query with only empty arrays', () => {
      const query: SemanticQuery = {
        measures: [],
        dimensions: [],
        filters: []
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Query must reference at least one cube through measures, dimensions, or filters')
    })

    it('should reject query with null arrays', () => {
      const query: SemanticQuery = {
        measures: null as any,
        dimensions: null as any
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject query with undefined fields that should be arrays', () => {
      const query: SemanticQuery = {
        measures: undefined as any,
        dimensions: ['Employees.name'] // Valid dimension to ensure query isn't empty
      }
      
      const result = compiler.validateQuery(query)
      // Should still be valid since dimensions are provided
      expect(result.isValid).toBe(true)
    })
  })

  describe('Invalid Field References', () => {
    it('should reject non-existent cube in measures', () => {
      const query: SemanticQuery = {
        measures: ['NonExistentCube.count', 'AnotherFakeCube.sum']
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Cube 'NonExistentCube' not found (referenced in measure 'NonExistentCube.count')")
      expect(result.errors).toContain("Cube 'AnotherFakeCube' not found (referenced in measure 'AnotherFakeCube.sum')")
    })

    it('should reject non-existent measures on valid cubes', () => {
      const query: SemanticQuery = {
        measures: ['Employees.nonExistentMeasure', 'Employees.anotherFakeMeasure']
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Measure 'nonExistentMeasure' not found on cube 'Employees'")
      expect(result.errors).toContain("Measure 'anotherFakeMeasure' not found on cube 'Employees'")
    })

    it('should reject non-existent dimensions', () => {
      const query: SemanticQuery = {
        dimensions: ['Employees.fakeField', 'Departments.anotherFakeField']
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Dimension 'fakeField' not found on cube 'Employees'")
      expect(result.errors).toContain("Dimension 'anotherFakeField' not found on cube 'Departments'")
    })

    it('should reject time dimensions on non-existent fields', () => {
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

    it('should allow time dimensions on actual time fields', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        timeDimensions: [{
          dimension: 'Employees.createdAt', // This is a valid time field
          granularity: 'day'
        }]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })

  describe('Invalid Filter Structures', () => {
    it('should reject filters with missing member', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [{
          member: undefined as any,
          operator: 'equals',
          values: ['test']
        }]
      }
      
      // This will cause a runtime error when trying to split undefined
      expect(() => compiler.validateQuery(query)).toThrow()
    })

    it('should reject filters without member property', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [{
          operator: 'equals',
          values: ['test']
        } as any] // Missing member property
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Filter must have a member field')
    })

    it('should reject filters on non-existent fields', () => {
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

    it('should reject complex nested filter structures with invalid members', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [{
          and: [
            {
              member: 'Employees.validName',
              operator: 'equals',
              values: ['John']
            },
            {
              or: [
                {
                  member: 'Employees.nonExistentField',
                  operator: 'gt',
                  values: [100]
                },
                {
                  member: 'NonExistentCube.field',
                  operator: 'lt',
                  values: [50]
                }
              ]
            }
          ]
        }]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      // Should contain errors for both non-existent field and non-existent cube
      expect(result.errors.some(error => error.includes('nonExistentField'))).toBe(true)
      expect(result.errors.some(error => error.includes('NonExistentCube'))).toBe(true)
    })
  })

  describe('Invalid Data Types and Type Mismatches', () => {
    it('should accept valid limit and offset values', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        limit: 100,
        offset: 10
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept valid granularity values', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        timeDimensions: [{
          dimension: 'Employees.createdAt',
          granularity: 'day'
        }]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    // Note: The current validation system doesn't validate data types for limit/offset/granularity
    // These would cause runtime errors later during query execution rather than validation errors
    it('should validate query structure but not data types at validation stage', () => {
      // The current validator focuses on field existence, not data type validation
      // Data type errors would surface during query execution
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        limit: 'string' as any // This would fail at execution time, not validation time
      }
      
      // Current validation system doesn't check data types, so this passes validation
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(true) // Validation only checks field existence
    })
  })

  describe('Invalid Format Strings', () => {
    it('should reject measures without proper cube.field format', () => {
      const query: SemanticQuery = {
        measures: ['InvalidFormat', '', 'TooManyDots.Field.Extra']
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Invalid measure format: InvalidFormat. Expected format: 'CubeName.fieldName'")
      expect(result.errors).toContain("Invalid measure format: . Expected format: 'CubeName.fieldName'")
      // TooManyDots.Field.Extra will be parsed as cube='TooManyDots', field='Field.Extra' and likely fail cube lookup
      expect(result.errors.some(error => error.includes('TooManyDots'))).toBe(true)
    })

    it('should reject dimensions without proper cube.field format', () => {
      const query: SemanticQuery = {
        dimensions: ['NoDotsAtAll', 'Too.Many.Dots.Here', '.StartsWithDot', 'EndsWithDot.']
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Invalid dimension format: NoDotsAtAll. Expected format: 'CubeName.fieldName'")
      expect(result.errors.some(error => error.includes('Too.Many.Dots.Here'))).toBe(true)
      expect(result.errors.some(error => error.includes('.StartsWithDot'))).toBe(true)
      expect(result.errors.some(error => error.includes('EndsWithDot.'))).toBe(true)
    })

    it('should reject filter members without proper cube.field format', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [{
          member: 'InvalidFilterFormat',
          operator: 'equals',
          values: ['test']
        }]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Invalid filter member format: InvalidFilterFormat. Expected format: 'CubeName.fieldName'")
    })

    it('should reject time dimension without proper cube.field format', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        timeDimensions: [{
          dimension: 'InvalidTimeDimensionFormat',
          granularity: 'day'
        }]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors.some(error => error.includes('InvalidTimeDimensionFormat'))).toBe(true)
    })
  })

  describe('Inconsistent Multi-Cube Queries', () => {
    it('should handle mix of valid and invalid cubes in measures', () => {
      const query: SemanticQuery = {
        measures: [
          'Employees.count',        // Valid
          'InvalidCube.count',      // Invalid cube
          'Employees.invalidField', // Valid cube, invalid field
          'Departments.count'       // Valid
        ]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Cube 'InvalidCube' not found (referenced in measure 'InvalidCube.count')")
      expect(result.errors).toContain("Measure 'invalidField' not found on cube 'Employees'")
    })

    it('should handle circular or invalid relationships in multi-cube queries', () => {
      // Test with cubes that might not have proper relationships
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        dimensions: ['Departments.name'],
        filters: [{
          member: 'Productivity.nonExistentField',
          operator: 'gt',
          values: [100]
        }]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Filter field 'nonExistentField' not found on cube 'Productivity' (must be a dimension or measure)")
    })
  })

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle extremely long field names', () => {
      const longFieldName = 'a'.repeat(1000)
      const query: SemanticQuery = {
        measures: [`Employees.${longFieldName}`]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain(`Measure '${longFieldName}' not found on cube 'Employees'`)
    })

    it('should handle special characters in field names', () => {
      const specialFieldNames = [
        'field-with-dashes',
        'field_with_underscores',
        'field with spaces',
        'field$with$symbols',
        'field@with@symbols',
        'field#with#hash'
      ]
      
      const query: SemanticQuery = {
        measures: specialFieldNames.map(field => `Employees.${field}`)
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      // All should be invalid field names
      specialFieldNames.forEach(fieldName => {
        expect(result.errors).toContain(`Measure '${fieldName}' not found on cube 'Employees'`)
      })
    })

    it('should handle unicode characters in field names', () => {
      const unicodeFields = [
        'José',
        '北京',
        '🚀',
        'Müller',
        'naïve'
      ]
      
      const query: SemanticQuery = {
        dimensions: unicodeFields.map(field => `Employees.${field}`)
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      unicodeFields.forEach(fieldName => {
        expect(result.errors).toContain(`Dimension '${fieldName}' not found on cube 'Employees'`)
      })
    })

    it('should handle very large filter values arrays', () => {
      const largeValuesArray = Array.from({ length: 10000 }, (_, i) => i)
      
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [{
          member: 'Employees.nonExistentField',
          operator: 'in',
          values: largeValuesArray
        }]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Filter field 'nonExistentField' not found on cube 'Employees' (must be a dimension or measure)")
    })

    it('should handle deeply nested filter structures', () => {
      // Create a deeply nested AND/OR structure
      const createNestedFilter = (depth: number): any => {
        if (depth === 0) {
          return {
            member: 'Employees.nonExistentField',
            operator: 'equals',
            values: ['value']
          }
        }
        
        return {
          and: [
            {
              member: 'Employees.name',
              operator: 'equals',
              values: ['valid']
            },
            {
              or: [
                createNestedFilter(depth - 1),
                {
                  member: `Employees.nested${depth}`,
                  operator: 'gt',
                  values: [depth]
                }
              ]
            }
          ]
        }
      }
      
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [createNestedFilter(5)]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain("Filter field 'nonExistentField' not found on cube 'Employees' (must be a dimension or measure)")
      // Should also contain errors for nested fields
      expect(result.errors.some(error => error.includes('nested'))).toBe(true)
    })
  })

  describe('Malformed Query Objects', () => {
    it('should handle query with wrong property types', () => {
      const query: SemanticQuery = {
        measures: 'Employees.count' as any, // Should be array
        dimensions: 123 as any, // Should be array
        filters: 'invalid' as any // Should be array
      }
      
      // These will cause runtime errors when validation tries to iterate
      expect(() => compiler.validateQuery(query)).toThrow()
    })

    it('should handle query with nested objects where arrays expected', () => {
      const query: SemanticQuery = {
        measures: { field: 'Employees.count' } as any, // Should be array
        dimensions: { field: 'Employees.name' } as any // Should be array
      }
      
      // These will cause runtime errors when validation tries to iterate
      expect(() => compiler.validateQuery(query)).toThrow()
    })

    it('should handle malformed filter objects that cause runtime errors', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [
          'not an object' as any, // This will cause 'in' operator to fail
          123 as any,
          { invalid: 'structure' } as any, // Missing member property
          null as any
        ]
      }
      
      // These will cause runtime errors during validation
      expect(() => compiler.validateQuery(query)).toThrow()
    })

    it('should handle filters with invalid structure gracefully where possible', () => {
      const query: SemanticQuery = {
        measures: ['Employees.count'],
        filters: [{
          // Missing member property
          operator: 'equals',
          values: ['test']
        } as any]
      }
      
      const result = compiler.validateQuery(query)
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Filter must have a member field')
    })
  })
})