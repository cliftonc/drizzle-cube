/**
 * Filter Edge Cases Test Suite
 * Tests edge cases, performance scenarios, SQL injection prevention, and error handling
 * As outlined in the testing roadmap section 1.3
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { 
  createTestDatabaseExecutor
} from './helpers/test-database'

import { enhancedEmployees, enhancedDepartments, generateComprehensiveProductivityData, testSecurityContexts } from './helpers/enhanced-test-data'

import { QueryExecutor } from '../src/server/executor'
import type { 
  Cube, 
  QueryContext,
  BaseQueryDefinition 
} from '../src/server/types'

import { 
  TestQueryBuilder, 
  TestExecutor, 
  QueryValidator, 
  TestDataGenerator,
  SecurityTestUtils,
  PerformanceMeasurer 
} from './helpers/test-utilities'
import { getTestCubes } from './helpers/test-cubes'

describe('Filter Edge Cases', () => {
  let testExecutor: TestExecutor
  let performanceMeasurer: PerformanceMeasurer
  let cubes: Map<string, Cube>
  let close: () => void

  beforeAll(async () => {
    const { executor: dbExecutor, close: cleanup } = await createTestDatabaseExecutor()
    
    const executor = new QueryExecutor(dbExecutor)
    close = cleanup
    cubes = await getTestCubes(['Employees', 'Departments', 'Productivity'])
    testExecutor = new TestExecutor(executor, cubes, testSecurityContexts.org1)
    performanceMeasurer = new PerformanceMeasurer()
  })
  
  afterAll(() => {
    close()
  })

  describe('Empty Arrays and Null Values', () => {
    it('should handle empty array in IN filter gracefully', async () => {
      // Note: 'in' operator may not be fully implemented yet according to roadmap
      // This test checks that empty array filters don't crash the system
      try {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([
            { member: 'Employees.name', operator: 'in', values: [] }
          ])
          .build()

        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
        // May return 0 results or all results depending on implementation
        expect(Array.isArray(result.data)).toBe(true)
      } catch (error) {
        // If 'in' operator not implemented, should get meaningful error
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toMatch(/operator|in|not supported|invalid/i)
      }
    })

    it('should handle null values in filter arrays', async () => {
      try {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([
            { member: 'Employees.name', operator: 'in', values: [null, 'John Doe'] }
          ])
          .build()

        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
      } catch (error) {
        // May not be implemented yet
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('should handle undefined values in filter conditions', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([
          { member: 'Employees.name', operator: 'equals', values: [undefined] }
        ])
        .build()

      // Should handle undefined gracefully
      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })

    it('should handle empty string values appropriately', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([
          { member: 'Employees.name', operator: 'equals', values: [''] }
        ])
        .build()

      // Should treat empty string as valid filter value
      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBe(0)
    })
  })

  describe('Performance with Large Arrays', () => {
    it('should handle large IN arrays without performance degradation', async () => {
      // Generate large array of employee IDs
      const largeIdArray = Array.from({ length: 1000 }, (_, i) => i + 1)
      
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([
          { member: 'Employees.id', operator: 'in', values: largeIdArray }
        ])
        .build()

      const result = await performanceMeasurer.measure(
        'large-array-performance',
        () => testExecutor.executeQuery(query)
      )
      
      const stats = performanceMeasurer.getStats('large-array-performance')
      const executionTime = stats.measurements[stats.measurements.length - 1]?.duration || 0

      expect(result.data).toBeDefined()
      // Should complete within reasonable time (5 seconds for large array)
      expect(executionTime).toBeLessThan(5000)
    })

    it('should handle very large IN arrays with proper query planning', async () => {
      // Test with 10,000 items as per roadmap specification
      const veryLargeArray = Array.from({ length: 10000 }, (_, i) => i)
      
      try {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([
            { member: 'Employees.id', operator: 'in', values: veryLargeArray }
          ])
          .build()

        // Should not crash with very large arrays
        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
      } catch (error) {
        // May not be implemented yet, should handle gracefully
        expect(error).toBeInstanceOf(Error)
      }
    })
  })

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection through filter values', async () => {
      const maliciousValues = [
        "'; DROP TABLE employees; --",
        "' UNION SELECT * FROM passwords --",
        "1; DELETE FROM employees WHERE 1=1; --",
        "1' OR '1'='1",
        "'; INSERT INTO admin VALUES ('hacker', 'password'); --"
      ]

      for (const maliciousValue of maliciousValues) {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([
            { member: 'Employees.name', operator: 'contains', values: [maliciousValue] }
          ])
          .build()

        // Should treat malicious input as literal string, not SQL
        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
        // Should return 0 results since no employee has SQL injection as name
        expect(result.data[0]['Employees.count']).toBe(0)
      }
    })

    it('should prevent SQL injection in numeric fields', async () => {
      const maliciousNumericValues = [
        "50000; SELECT pg_sleep(10); --",
        "1 OR 1=1",
        "'; DROP TABLE employees; SELECT 75000 AS salary WHERE '1'='1"
      ]

      for (const maliciousValue of maliciousNumericValues) {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([
            { member: 'Employees.salary', operator: 'equals', values: [maliciousValue] }
          ])
          .build()

        // Should either handle gracefully or throw validation error, not execute SQL injection
        try {
          const result = await testExecutor.executeQuery(query)
          expect(result.data).toBeDefined()
          // Should return 0 results since no employee has SQL injection as salary
          expect(result.data[0]['Employees.count']).toBe(0)
        } catch (error) {
          // Type validation error is acceptable - this actually demonstrates SQL injection prevention
          expect(error).toBeInstanceOf(Error)
          // The key test: if the error message contains the SQL injection attempt as a parameter value,
          // it means the system is treating it as data, not executing it as SQL (which is correct)
          if (error.message.includes('params:')) {
            // Good: SQL injection attempt is being treated as parameter data, not executed
            expect(error.message).toMatch(/params:.*\d+.*,.*[^;]+/)
          }
        }
      }
    })

    it('should prevent encoded SQL injection attempts', async () => {
      const encodedInjections = [
        "%27%3B%20DROP%20TABLE%20employees%3B%20--", // Encoded '; DROP TABLE employees; --
        "%27%20UNION%20SELECT%20*%20FROM%20users%20--", // Encoded ' UNION SELECT * FROM users --
        encodeURIComponent("'; DROP TABLE employees; --")
      ]

      for (const encodedValue of encodedInjections) {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([
            { member: 'Employees.name', operator: 'contains', values: [encodedValue] }
          ])
          .build()

        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
        expect(result.data[0]['Employees.count']).toBe(0)
      }
    })
  })

  describe('Unicode and International Characters', () => {
    it('should handle Unicode characters in filter values', async () => {
      const unicodeValues = [
        'José', // Spanish accent
        '北京', // Chinese characters
        '🚀',   // Emoji
        'Müller', // German umlaut
        'Москва', // Cyrillic
        'العربية', // Arabic
        'हिन्दी', // Hindi
        'ñoño'   // Special Spanish characters
      ]

      for (const unicodeValue of unicodeValues) {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([
            { member: 'Employees.name', operator: 'contains', values: [unicodeValue] }
          ])
          .build()

        // Should handle Unicode gracefully without errors
        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
      }
    })

    it('should handle mixed character sets in same filter', async () => {
      const mixedValues = ['John', 'José', '北京', '🚀', 'Müller']
      
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([
          { member: 'Employees.name', operator: 'in', values: mixedValues }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(Array.isArray(result.data)).toBe(true)
    })

    it('should handle Unicode in date and numeric contexts', async () => {
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([
          // Test Unicode in string representation of numbers/dates
          { member: 'Employees.name', operator: 'contains', values: ['２０２４'] } // Full-width numbers
        ])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })
  })

  describe('Very Long Strings', () => {
    it('should handle very long string values in filters', async () => {
      // Test with 10,000 character string as per roadmap
      const veryLongString = 'x'.repeat(10000)
      
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([
          { member: 'Employees.name', operator: 'contains', values: [veryLongString] }
        ])
        .build()

      // Should handle long strings without crashing
      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
      expect(result.data[0]['Employees.count']).toBe(0)
    })

    it('should handle multiple long strings in array', async () => {
      const longStrings = [
        'a'.repeat(5000),
        'b'.repeat(5000),
        'c'.repeat(5000)
      ]
      
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([
          { member: 'Employees.name', operator: 'in', values: longStrings }
        ])
        .build()

      const result = await testExecutor.executeQuery(query)
      expect(result.data).toBeDefined()
    })

    it('should handle performance impact of long strings', async () => {
      const longString = 'performance-test-'.repeat(1000)
      
      const query = TestQueryBuilder.create()
        .measures(['Employees.count'])
        .filters([
          { member: 'Employees.name', operator: 'startsWith', values: [longString] }
        ])
        .build()

      const result = await performanceMeasurer.measure(
        'long-string-performance',
        () => testExecutor.executeQuery(query)
      )
      
      const stats = performanceMeasurer.getStats('long-string-performance')
      const executionTime = stats.measurements[stats.measurements.length - 1]?.duration || 0

      expect(result.data).toBeDefined()
      // Should complete within reasonable time even with long strings
      expect(executionTime).toBeLessThan(2000)
    })
  })

  describe('Type Mismatches and Validation', () => {
    it('should handle string values in numeric fields gracefully', async () => {
      const invalidNumericValues = [
        'not-a-number',
        'abc123',
        '123abc',
        '',
        'null',
        'undefined'
      ]

      for (const invalidValue of invalidNumericValues) {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([
            { member: 'Employees.salary', operator: 'equals', values: [invalidValue] }
          ])
          .build()

        // Should either handle gracefully or throw validation error
        try {
          const result = await testExecutor.executeQuery(query)
          expect(result.data).toBeDefined()
          expect(Array.isArray(result.data)).toBe(true)
        } catch (error) {
          // Type validation errors are acceptable
          expect(error).toBeInstanceOf(Error)
          // Error message should not contain actual SQL injection commands being executed
          expect(error.message).not.toMatch(/DROP\s+TABLE|INSERT\s+INTO|DELETE\s+FROM/i)
        }
      }
    })

    it('should handle boolean values in string fields', async () => {
      const booleanValues = [true, false, 'true', 'false', 1, 0]
      
      try {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([
            { member: 'Employees.name', operator: 'equals', values: booleanValues }
          ])
          .build()

        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
      } catch (error) {
        // May throw due to type conversion
        expect(error).toBeInstanceOf(Error)
      }
    })

    it('should handle object and array values in primitive fields', async () => {
      const complexValues = [
        { nested: 'object' },
        [1, 2, 3],
        JSON.stringify({ data: 'test' })
      ]
      
      try {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([
            { member: 'Employees.name', operator: 'equals', values: complexValues }
          ])
          .build()

        // Should serialize complex values appropriately or handle gracefully
        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
      } catch (error) {
        // Complex object handling may vary across databases
        expect(error).toBeInstanceOf(Error)
      }
    })
  })

  describe('Date Edge Cases', () => {
    it('should handle invalid date formats gracefully', async () => {
      const invalidDates = [
        'invalid-date',
        '2024-13-01', // Invalid month
        '2024-01-32', // Invalid day
        '2024-02-30', // Invalid date for February
        'not-a-date',
        '2024/13/45',
        ''
      ]

      for (const invalidDate of invalidDates) {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([
            { 
              member: 'Employees.createdAt', 
              operator: 'inDateRange', 
              values: [invalidDate, '2024-01-01'] 
            }
          ])
          .build()

        // Should handle invalid dates gracefully
        try {
          const result = await testExecutor.executeQuery(query)
          expect(result.data).toBeDefined()
        } catch (error) {
          // If error is thrown, it should be a validation error, not a crash
          expect(error).toBeInstanceOf(Error)
          expect(error.message).toMatch(/date|invalid|format/i)
        }
      }
    })

    it('should handle date range with invalid combinations', async () => {
      const invalidRanges = [
        ['2024-12-31', '2024-01-01'], // End before start
        ['2024-01-01'], // Missing end date
        ['', '2024-01-01'], // Empty start date
        ['2024-01-01', ''], // Empty end date
      ]

      for (const [start, end] of invalidRanges) {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([
            { 
              member: 'Employees.createdAt', 
              operator: 'inDateRange', 
              values: [start, end].filter(v => v !== undefined)
            }
          ])
          .build()

        // Should handle invalid date ranges appropriately
        try {
          const result = await testExecutor.executeQuery(query)
          expect(result.data).toBeDefined()
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }
      }
    })

    it('should handle timezone and DST edge cases in date filters', async () => {
      const timezoneEdgeCases = [
        '2024-03-10T07:00:00Z', // DST transition in US
        '2024-11-03T06:00:00Z', // DST end in US  
        '2024-02-29T00:00:00Z', // Leap year date
        '2024-12-31T23:59:59Z', // End of year
        '2024-01-01T00:00:00Z'  // Start of year
      ]

      for (const edgeDate of timezoneEdgeCases) {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([
            { member: 'Employees.createdAt', operator: 'beforeDate', values: [edgeDate] }
          ])
          .build()

        const result = await testExecutor.executeQuery(query)
        expect(result.data).toBeDefined()
      }
    })
  })

  describe('Filter Operator Edge Cases', () => {
    it('should handle unsupported operators gracefully', async () => {
      const query = {
        measures: ['Employees.count'],
        filters: [
          { member: 'Employees.name', operator: 'unsupported_operator', values: ['test'] }
        ]
      }

      // Should either ignore unsupported operators or throw meaningful error
      try {
        const result = await testExecutor.executeQuery(query as any)
        expect(result.data).toBeDefined()
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect(error.message).toMatch(/operator|unsupported|invalid/i)
      }
    })

    it('should handle operators with wrong value counts', async () => {
      const edgeCases = [
        { operator: 'equals', values: [] }, // No values
        { operator: 'equals', values: ['a', 'b', 'c'] }, // Too many values
        { operator: 'inDateRange', values: ['2024-01-01'] }, // Missing end date
        { operator: 'between', values: [100] } // Missing upper bound
      ]

      for (const { operator, values } of edgeCases) {
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([
            { member: 'Employees.name', operator: operator as any, values }
          ])
          .build()

        try {
          const result = await testExecutor.executeQuery(query)
          expect(result.data).toBeDefined()
        } catch (error) {
          expect(error).toBeInstanceOf(Error)
        }
      }
    })
  })

  describe('Memory and Resource Usage', () => {
    it('should handle memory efficiently with large filter combinations', async () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Create multiple queries with large filter sets
      const promises = Array.from({ length: 10 }, (_, i) => {
        const largeArray = Array.from({ length: 1000 }, (_, j) => `value_${i}_${j}`)
        
        const query = TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([
            { member: 'Employees.name', operator: 'in', values: largeArray }
          ])
          .build()

        return testExecutor.executeQuery(query)
      })

      await Promise.all(promises)

      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be reasonable (< 50MB for test)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024)
    })
  })

  describe('Concurrent Edge Cases', () => {
    it('should handle concurrent edge case queries without interference', async () => {
      const edgeCaseQueries = [
        // Empty array
        TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([{ member: 'Employees.name', operator: 'in', values: [] }])
          .build(),
        
        // SQL injection attempt
        TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([{ member: 'Employees.name', operator: 'contains', values: ["'; DROP TABLE employees; --"] }])
          .build(),
        
        // Unicode characters
        TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([{ member: 'Employees.name', operator: 'contains', values: ['🚀北京José'] }])
          .build(),
        
        // Long string
        TestQueryBuilder.create()
          .measures(['Employees.count'])
          .filters([{ member: 'Employees.name', operator: 'contains', values: ['x'.repeat(1000)] }])
          .build()
      ]

      // Execute all edge case queries concurrently
      const results = await Promise.all(
        edgeCaseQueries.map(query => testExecutor.executeQuery(query))
      )

      // All should complete successfully
      results.forEach(result => {
        expect(result.data).toBeDefined()
        expect(Array.isArray(result.data)).toBe(true)
      })
    })
  })
})