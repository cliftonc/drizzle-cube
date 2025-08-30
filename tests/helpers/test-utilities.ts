/**
 * Comprehensive test utilities for drizzle-cube testing
 * Provides helpers for query generation, validation, and performance measurement
 */

import type { 
  SemanticQuery, 
  QueryResult, 
  SecurityContext,
  FilterOperator,
  TimeGranularity
} from '../../src/server/types'
import type { QueryExecutor } from '../../src/server/executor'
import type { Cube } from '../../src/server/types'

/**
 * Query builder helper for comprehensive testing
 */
export class TestQueryBuilder {
  private query: SemanticQuery = {}

  measures(measures: string[]): TestQueryBuilder {
    this.query.measures = measures
    return this
  }

  dimensions(dimensions: string[]): TestQueryBuilder {
    this.query.dimensions = dimensions
    return this
  }

  timeDimensions(timeDims: Array<{
    dimension: string
    granularity?: TimeGranularity
    dateRange?: string | string[]
  }>): TestQueryBuilder {
    this.query.timeDimensions = timeDims
    return this
  }

  filters(filters: Array<{ member: string; operator: FilterOperator; values: any[] }>): TestQueryBuilder {
    this.query.filters = filters
    return this
  }

  filter(member: string, operator: FilterOperator, values: any[]): TestQueryBuilder {
    if (!this.query.filters) {
      this.query.filters = []
    }
    this.query.filters.push({ member, operator, values })
    return this
  }

  andFilter(filters: Array<{ member: string; operator: FilterOperator; values: any[] }>): TestQueryBuilder {
    if (!this.query.filters) {
      this.query.filters = []
    }
    this.query.filters.push({
      and: filters.map(f => ({ member: f.member, operator: f.operator, values: f.values }))
    })
    return this
  }

  orFilter(filters: Array<{ member: string; operator: FilterOperator; values: any[] }>): TestQueryBuilder {
    if (!this.query.filters) {
      this.query.filters = []
    }
    this.query.filters.push({
      or: filters.map(f => ({ member: f.member, operator: f.operator, values: f.values }))
    })
    return this
  }

  limit(limit: number): TestQueryBuilder {
    this.query.limit = limit
    return this
  }

  offset(offset: number): TestQueryBuilder {
    this.query.offset = offset
    return this
  }

  order(orderBy: Record<string, 'asc' | 'desc'>): TestQueryBuilder {
    this.query.order = orderBy
    return this
  }

  build(): SemanticQuery {
    return { ...this.query }
  }

  static create(): TestQueryBuilder {
    return new TestQueryBuilder()
  }
}

/**
 * Performance measurement utilities
 */
export class PerformanceMeasurer {
  private measurements: Array<{
    name: string
    duration: number
    timestamp: number
    metadata?: any
  }> = []

  async measure<T>(name: string, fn: () => Promise<T>, metadata?: any): Promise<T> {
    const start = performance.now()
    try {
      const result = await fn()
      const duration = performance.now() - start
      this.measurements.push({
        name,
        duration,
        timestamp: Date.now(),
        metadata
      })
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.measurements.push({
        name: `${name} (error)`,
        duration,
        timestamp: Date.now(),
        metadata: { ...metadata, error: error instanceof Error ? error.message : 'Unknown error' }
      })
      throw error
    }
  }

  getStats(namePattern?: string): {
    count: number
    totalDuration: number
    avgDuration: number
    minDuration: number
    maxDuration: number
    measurements: typeof this.measurements
  } {
    const filtered = namePattern 
      ? this.measurements.filter(m => m.name.includes(namePattern))
      : this.measurements

    if (filtered.length === 0) {
      return {
        count: 0,
        totalDuration: 0,
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        measurements: []
      }
    }

    const durations = filtered.map(m => m.duration)
    return {
      count: filtered.length,
      totalDuration: durations.reduce((sum, d) => sum + d, 0),
      avgDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      measurements: filtered
    }
  }

  clear(): void {
    this.measurements = []
  }

  getLatestMeasurement(): typeof this.measurements[0] | undefined {
    return this.measurements[this.measurements.length - 1]
  }

  getAllMeasurements(): typeof this.measurements {
    return [...this.measurements]
  }
}

/**
 * Query result validation utilities
 */
export class QueryValidator {
  static validateQueryResult(result: QueryResult, expectedFields: string[]): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Check basic structure
    if (!result) {
      errors.push('Result is null or undefined')
      return { isValid: false, errors }
    }

    if (!result.data) {
      errors.push('Result.data is missing')
    }

    if (!Array.isArray(result.data)) {
      errors.push('Result.data is not an array')
    }

    if (!result.annotation) {
      errors.push('Result.annotation is missing')
    }

    // Check that all expected fields are present in the data
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      const actualFields = Object.keys(result.data[0])
      const missingFields = expectedFields.filter(field => !actualFields.includes(field))
      const extraFields = actualFields.filter(field => !expectedFields.includes(field))

      if (missingFields.length > 0) {
        errors.push(`Missing expected fields: ${missingFields.join(', ')}`)
      }

      if (extraFields.length > 0) {
        errors.push(`Unexpected extra fields: ${extraFields.join(', ')}`)
      }
    }

    // Validate annotation structure
    if (result.annotation) {
      if (!result.annotation.measures) {
        errors.push('Result.annotation.measures is missing')
      }
      if (!result.annotation.dimensions) {
        errors.push('Result.annotation.dimensions is missing')
      }
      if (!result.annotation.timeDimensions) {
        errors.push('Result.annotation.timeDimensions is missing')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateDataTypes(result: QueryResult, typeExpectations: Record<string, string>): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!result.data || !Array.isArray(result.data) || result.data.length === 0) {
      return { isValid: true, errors } // No data to validate
    }

    const sampleRow = result.data[0]
    
    for (const [field, expectedType] of Object.entries(typeExpectations)) {
      if (!(field in sampleRow)) {
        continue // Field not present, skip validation
      }

      const actualValue = sampleRow[field]
      const actualType = actualValue === null ? 'null' : typeof actualValue

      let isValidType = false
      
      switch (expectedType) {
        case 'string':
          isValidType = actualType === 'string'
          break
        case 'number':
          isValidType = actualType === 'number' && !isNaN(actualValue)
          break
        case 'boolean':
          isValidType = actualType === 'boolean'
          break
        case 'date':
          isValidType = actualValue instanceof Date || (typeof actualValue === 'string' && !isNaN(Date.parse(actualValue)))
          break
        case 'null':
          isValidType = actualValue === null
          break
        case 'string|null':
          isValidType = actualType === 'string' || actualValue === null
          break
        case 'number|null':
          isValidType = (actualType === 'number' && !isNaN(actualValue)) || actualValue === null
          break
        default:
          isValidType = true // Unknown expected type, skip validation
      }

      if (!isValidType) {
        errors.push(`Field '${field}' expected type '${expectedType}' but got '${actualType}' (value: ${JSON.stringify(actualValue)})`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  static validateRowCount(result: QueryResult, expectedCount: number | { min?: number; max?: number }): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!result.data || !Array.isArray(result.data)) {
      errors.push('Result.data is not an array')
      return { isValid: false, errors }
    }

    const actualCount = result.data.length

    if (typeof expectedCount === 'number') {
      if (actualCount !== expectedCount) {
        errors.push(`Expected exactly ${expectedCount} rows but got ${actualCount}`)
      }
    } else {
      if (expectedCount.min !== undefined && actualCount < expectedCount.min) {
        errors.push(`Expected at least ${expectedCount.min} rows but got ${actualCount}`)
      }
      if (expectedCount.max !== undefined && actualCount > expectedCount.max) {
        errors.push(`Expected at most ${expectedCount.max} rows but got ${actualCount}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

/**
 * Test data generators for various scenarios
 */
export class TestDataGenerator {
  /**
   * Generate all possible filter operator test cases
   */
  static generateFilterTestCases(): Array<{
    name: string
    member: string
    operator: FilterOperator
    values: any[]
    description: string
  }> {
    return [
      // String operators
      {
        name: 'equals-string',
        member: 'Employees.name',
        operator: 'equals',
        values: ['Alex Chen'],
        description: 'Test exact string match'
      },
      {
        name: 'equals-multiple-values',
        member: 'Employees.name',
        operator: 'equals',
        values: ['Alex Chen', 'Sarah Johnson'],
        description: 'Test multiple exact matches (IN clause)'
      },
      {
        name: 'notEquals-string',
        member: 'Employees.name',
        operator: 'notEquals',
        values: ['Alex Chen'],
        description: 'Test string exclusion'
      },
      {
        name: 'contains-case-insensitive',
        member: 'Employees.name',
        operator: 'contains',
        values: ['alex'],
        description: 'Test case-insensitive substring match'
      },
      {
        name: 'notContains',
        member: 'Employees.name',
        operator: 'notContains',
        values: ['Test'],
        description: 'Test substring exclusion'
      },
      {
        name: 'startsWith',
        member: 'Employees.name',
        operator: 'startsWith',
        values: ['Alex'],
        description: 'Test prefix matching'
      },
      {
        name: 'endsWith',
        member: 'Employees.name',
        operator: 'endsWith',
        values: ['Chen'],
        description: 'Test suffix matching'
      },

      // Number operators
      {
        name: 'gt-number',
        member: 'Employees.salary',
        operator: 'gt',
        values: [100000],
        description: 'Test greater than for numbers'
      },
      {
        name: 'gte-number',
        member: 'Employees.salary',
        operator: 'gte',
        values: [100000],
        description: 'Test greater than or equal for numbers'
      },
      {
        name: 'lt-number',
        member: 'Employees.salary',
        operator: 'lt',
        values: [80000],
        description: 'Test less than for numbers'
      },
      {
        name: 'lte-number',
        member: 'Employees.salary',
        operator: 'lte',
        values: [80000],
        description: 'Test less than or equal for numbers'
      },

      // Boolean operators
      {
        name: 'equals-boolean-true',
        member: 'Employees.isActive',
        operator: 'equals',
        values: [true],
        description: 'Test boolean true matching'
      },
      {
        name: 'equals-boolean-false',
        member: 'Employees.isActive',
        operator: 'equals',
        values: [false],
        description: 'Test boolean false matching'
      },

      // NULL operators
      {
        name: 'set-not-null',
        member: 'Employees.email',
        operator: 'set',
        values: [],
        description: 'Test field is not NULL'
      },
      {
        name: 'notSet-is-null',
        member: 'Employees.email',
        operator: 'notSet',
        values: [],
        description: 'Test field is NULL'
      },

      // Date operators
      {
        name: 'inDateRange',
        member: 'Employees.createdAt',
        operator: 'inDateRange',
        values: ['2022-01-01', '2024-12-31'],
        description: 'Test date range filtering'
      },
      {
        name: 'beforeDate',
        member: 'Employees.createdAt',
        operator: 'beforeDate',
        values: ['2023-01-01'],
        description: 'Test before date filtering'
      },
      {
        name: 'afterDate',
        member: 'Employees.createdAt',
        operator: 'afterDate',
        values: ['2023-01-01'],
        description: 'Test after date filtering'
      }
    ]
  }

  /**
   * Generate all possible time granularity test cases
   */
  static generateTimeGranularityTestCases(): Array<{
    name: string
    granularity: TimeGranularity
    description: string
    expectedPattern?: RegExp
  }> {
    return [
      {
        name: 'second',
        granularity: 'second',
        description: 'Test second-level granularity',
        expectedPattern: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
      },
      {
        name: 'minute',
        granularity: 'minute',
        description: 'Test minute-level granularity',
        expectedPattern: /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00/
      },
      {
        name: 'hour',
        granularity: 'hour',
        description: 'Test hour-level granularity',
        expectedPattern: /\d{4}-\d{2}-\d{2}T\d{2}:00:00/
      },
      {
        name: 'day',
        granularity: 'day',
        description: 'Test day-level granularity',
        expectedPattern: /\d{4}-\d{2}-\d{2}T00:00:00/
      },
      {
        name: 'week',
        granularity: 'week',
        description: 'Test week-level granularity (Monday start)'
      },
      {
        name: 'month',
        granularity: 'month',
        description: 'Test month-level granularity',
        expectedPattern: /\d{4}-\d{2}-01T00:00:00/
      },
      {
        name: 'quarter',
        granularity: 'quarter',
        description: 'Test quarter-level granularity'
      },
      {
        name: 'year',
        granularity: 'year',
        description: 'Test year-level granularity',
        expectedPattern: /\d{4}-01-01T00:00:00/
      }
    ]
  }

  /**
   * Generate complex query scenarios for testing
   */
  static generateComplexQueryScenarios(): Array<{
    name: string
    query: SemanticQuery
    description: string
    expectedResultStructure: {
      fields: string[]
      rowCountRange: { min: number; max: number }
      dataTypes: Record<string, string>
    }
  }> {
    return [
      {
        name: 'multi-measure-with-dimensions',
        query: {
          measures: ['Employees.count', 'Employees.totalSalary', 'Employees.avgSalary'],
          dimensions: ['Employees.departmentName'],
          filters: [
            { member: 'Employees.isActive', operator: 'equals', values: [true] }
          ],
          order: { 'Employees.count': 'desc' }
        },
        description: 'Multiple measures with grouping dimension and filter',
        expectedResultStructure: {
          fields: ['Employees.count', 'Employees.totalSalary', 'Employees.avgSalary', 'Employees.departmentName'],
          rowCountRange: { min: 1, max: 20 },
          dataTypes: {
            'Employees.count': 'number',
            'Employees.totalSalary': 'number',
            'Employees.avgSalary': 'number',
            'Employees.departmentName': 'string|null'
          }
        }
      },
      {
        name: 'time-dimension-with-aggregation',
        query: {
          measures: ['Productivity.totalLinesOfCode', 'Productivity.avgHappinessIndex'],
          timeDimensions: [
            { dimension: 'Productivity.date', granularity: 'month' }
          ],
          filters: [
            { member: 'Productivity.date', operator: 'inDateRange', values: ['2024-01-01', '2024-06-30'] }
          ],
          order: { 'Productivity.date': 'asc' }
        },
        description: 'Time dimension aggregation with date range filter',
        expectedResultStructure: {
          fields: ['Productivity.totalLinesOfCode', 'Productivity.avgHappinessIndex', 'Productivity.date'],
          rowCountRange: { min: 1, max: 12 },
          dataTypes: {
            'Productivity.totalLinesOfCode': 'number',
            'Productivity.avgHappinessIndex': 'number',
            'Productivity.date': 'date'
          }
        }
      },
      {
        name: 'complex-logical-filters',
        query: {
          measures: ['Employees.count'],
          dimensions: ['Employees.name', 'Employees.departmentName'],
          filters: [
            {
              or: [
                { member: 'Employees.salary', operator: 'gt', values: [120000] },
                {
                  and: [
                    { member: 'Employees.departmentName', operator: 'equals', values: ['Engineering'] },
                    { member: 'Employees.createdAt', operator: 'afterDate', values: ['2022-01-01'] }
                  ]
                }
              ]
            }
          ]
        },
        description: 'Complex nested AND/OR logical filters',
        expectedResultStructure: {
          fields: ['Employees.count', 'Employees.name', 'Employees.departmentName'],
          rowCountRange: { min: 0, max: 50 },
          dataTypes: {
            'Employees.count': 'number',
            'Employees.name': 'string',
            'Employees.departmentName': 'string|null'
          }
        }
      }
    ]
  }
}

/**
 * Test execution helper
 */
export class TestExecutor {
  constructor(
    private executor: QueryExecutor,
    private cubes: Map<string, Cube>,
    private securityContext: SecurityContext
  ) {}

  async executeQuery(query: SemanticQuery): Promise<QueryResult> {
    return this.executor.execute(this.cubes, query, this.securityContext)
  }

  async executeWithPerformance(
    query: SemanticQuery,
    measurer: PerformanceMeasurer,
    testName: string
  ): Promise<QueryResult> {
    return measurer.measure(testName, () => this.executeQuery(query), { query })
  }

  async validateQuery(
    query: SemanticQuery,
    expectedFields: string[],
    typeExpectations?: Record<string, string>
  ): Promise<{
    result: QueryResult
    validation: { isValid: boolean; errors: string[] }
  }> {
    const result = await this.executeQuery(query)
    let validation = QueryValidator.validateQueryResult(result, expectedFields)
    
    if (typeExpectations && validation.isValid) {
      const typeValidation = QueryValidator.validateDataTypes(result, typeExpectations)
      validation = {
        isValid: validation.isValid && typeValidation.isValid,
        errors: [...validation.errors, ...typeValidation.errors]
      }
    }

    return { result, validation }
  }
}

/**
 * SQL injection test utilities
 */
export class SecurityTestUtils {
  static generateSQLInjectionTestCases(): Array<{
    name: string
    maliciousInput: any
    description: string
  }> {
    return [
      {
        name: 'sql-injection-string',
        maliciousInput: "'; DROP TABLE employees; --",
        description: 'Classic SQL injection attempt'
      },
      {
        name: 'sql-injection-union',
        maliciousInput: "' UNION SELECT * FROM employees --",
        description: 'UNION-based SQL injection'
      },
      {
        name: 'sql-injection-boolean',
        maliciousInput: "' OR '1'='1",
        description: 'Boolean-based SQL injection'
      },
      {
        name: 'sql-injection-comment',
        maliciousInput: "admin'/*",
        description: 'Comment-based SQL injection'
      },
      {
        name: 'xss-script-tag',
        maliciousInput: "<script>alert('xss')</script>",
        description: 'XSS attempt in field value'
      },
      {
        name: 'null-byte-injection',
        maliciousInput: "admin\x00",
        description: 'Null byte injection attempt'
      }
    ]
  }

  static validateNoSQLInjection(result: QueryResult): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Check that we got a result (not an error)
    if (!result) {
      errors.push('Query resulted in null/undefined result (possible injection success)')
    }

    // Check that data structure is as expected
    if (!result.data || !Array.isArray(result.data)) {
      errors.push('Query result data structure is unexpected (possible injection)')
    }

    // Check that we didn't get unexpected fields that might indicate injection
    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      const firstRow = result.data[0]
      const fieldNames = Object.keys(firstRow)
      
      // Look for suspicious field names that might indicate successful injection
      const suspiciousFields = fieldNames.filter(field => 
        field.toLowerCase().includes('password') ||
        field.toLowerCase().includes('secret') ||
        field.toLowerCase().includes('token') ||
        field.includes('*') ||
        field.includes(';')
      )

      if (suspiciousFields.length > 0) {
        errors.push(`Suspicious field names detected: ${suspiciousFields.join(', ')}`)
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// All utilities are exported individually above