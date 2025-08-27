# drizzle-cube Testing Roadmap

## Executive Summary

This document provides a comprehensive analysis of the current test coverage in drizzle-cube and outlines a roadmap for expanding the test suite to ensure robust, production-ready code. The goal is to achieve comprehensive coverage across all query types, edge cases, security scenarios, and error conditions.

### Current State
- **Good foundation**: 18 test files covering core functionality
- **Strong security coverage**: Multi-tenant isolation and SQL injection prevention
- **Multi-database support**: Tests run against PostgreSQL, MySQL, and SQLite
- **Comprehensive utilities**: TestQueryBuilder, PerformanceMeasurer, and validation helpers

### Goals
- Expand test coverage to include advanced query scenarios
- Add comprehensive negative testing
- Implement performance benchmarking
- Add code coverage reporting
- Document test organization and best practices

## Current Test Coverage Analysis

### ✅ Well Covered Areas

#### Basic Query Operations
- **Basic aggregations**: count, sum, avg, min, max, countDistinct
- **String filters**: equals, notEquals, contains, notContains, startsWith, endsWith
- **Numeric filters**: gt, gte, lt, lte
- **Null filters**: set, notSet  
- **Date filters**: inDateRange, beforeDate, afterDate
- **Logical combinations**: AND/OR filter groups

#### Time Dimensions
- **All granularities**: second, minute, hour, day, week, month, quarter, year
- **14 date range types**: today, yesterday, this week, last 7 days, etc.
- **Edge cases**: leap years, month boundaries, quarter boundaries

#### Multi-Cube Operations
- **Cross-cube queries**: Measures and dimensions from multiple cubes
- **Join detection**: Automatic JOIN vs CTE selection
- **Security isolation**: Security context applied to all tables

#### Query Options
- **Pagination**: limit, offset with edge cases
- **Ordering**: single and multi-field ordering
- **Complex combinations**: limit + offset + order together

#### Security & Validation
- **Multi-tenant isolation**: Organization-based data filtering
- **Query validation**: Cube existence, field existence, structure validation
- **SQL injection prevention**: Parameterized query testing

#### Framework Integration
- **All adapters**: Express, Fastify, Hono, Next.js
- **API compatibility**: Cube.js-compatible responses
- **Error handling**: Consistent error formats across adapters

### ❌ Missing or Limited Coverage

## Comprehensive Test Scenarios to Add

### 1. Advanced Filter Operations

#### 1.1 Missing Filter Operators
**Priority: High**

```typescript
// Current: only basic operators
type CurrentOperators = 'equals' | 'notEquals' | 'contains' | 'notContains' | 
  'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'set' | 'notSet' |
  'inDateRange' | 'beforeDate' | 'afterDate'

// Missing operators to test:
type MissingOperators = 
  | 'between'        // Range queries: salary BETWEEN 50000 AND 100000
  | 'notBetween'     // Exclusion ranges
  | 'in'             // IN clause: status IN ('active', 'pending')
  | 'notIn'          // NOT IN clause
  | 'like'           // SQL LIKE with wildcards: name LIKE 'John%'
  | 'notLike'        // NOT LIKE
  | 'ilike'          // Case-insensitive LIKE (PostgreSQL)
  | 'regex'          // Regular expression matching
  | 'notRegex'       // Negative regex
  | 'isEmpty'        // Empty string or null
  | 'isNotEmpty'     // Non-empty values
```

**Test File**: `tests/filters-advanced.test.ts`

#### 1.2 Complex Nested Filter Logic
**Priority: High**

```typescript
// Test complex nested structures like:
filters: [
  {
    and: [
      { member: 'Employees.department', operator: 'in', values: ['Engineering', 'Sales'] },
      {
        or: [
          { member: 'Employees.salary', operator: 'gte', values: [75000] },
          { member: 'Employees.experience', operator: 'gte', values: [5] }
        ]
      }
    ]
  },
  { member: 'Employees.active', operator: 'equals', values: [true] }
]
```

#### 1.3 Filter Edge Cases
**Priority: Medium**

```typescript
// Edge cases to test:
const edgeCaseTests = [
  // Empty arrays
  { member: 'Employees.name', operator: 'in', values: [] },
  
  // Very large arrays (performance)
  { member: 'Employees.id', operator: 'in', values: Array.from({length: 10000}, (_, i) => i) },
  
  // Special characters and SQL injection attempts
  { member: 'Employees.name', operator: 'contains', values: ["'; DROP TABLE employees; --"] },
  
  // Unicode and international characters
  { member: 'Employees.name', operator: 'contains', values: ['José', '北京', '🚀'] },
  
  // Very long strings
  { member: 'Employees.description', operator: 'contains', values: ['x'.repeat(10000)] },
  
  // Type mismatches
  { member: 'Employees.salary', operator: 'equals', values: ['not-a-number'] },
  
  // Date edge cases
  { member: 'Employees.createdAt', operator: 'inDateRange', values: ['invalid-date', '2024-01-01'] }
]
```

**Test File**: `tests/filters-edge-cases.test.ts`

### 2. Advanced Aggregation Functions

#### 2.1 Statistical Aggregations
**Priority: High**

```typescript
// Add to test cubes:
measures: {
  // Statistical measures
  medianSalary: {
    name: 'medianSalary',
    title: 'Median Salary',
    type: 'number', // Custom implementation needed
    sql: sql`PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${employees.salary})`
  },
  
  p90Salary: {
    name: 'p90Salary', 
    title: '90th Percentile Salary',
    type: 'number',
    sql: sql`PERCENTILE_CONT(0.9) WITHIN GROUP (ORDER BY ${employees.salary})`
  },
  
  stdDevSalary: {
    name: 'stdDevSalary',
    title: 'Salary Standard Deviation', 
    type: 'number',
    sql: sql`STDDEV(${employees.salary})`
  },
  
  varianceSalary: {
    name: 'varianceSalary',
    title: 'Salary Variance',
    type: 'number', 
    sql: sql`VARIANCE(${employees.salary})`
  }
}
```

**Test File**: `tests/aggregations-statistical.test.ts`

#### 2.2 Window Functions and Running Totals
**Priority: Medium**

```typescript
measures: {
  runningTotal: {
    name: 'runningTotal',
    title: 'Running Total Sales',
    type: 'number',
    sql: sql`SUM(${productivity.linesOfCode}) OVER (ORDER BY ${productivity.date})`
  },
  
  movingAverage: {
    name: 'movingAverage', 
    title: '7-Day Moving Average',
    type: 'number',
    sql: sql`AVG(${productivity.linesOfCode}) OVER (
      ORDER BY ${productivity.date} 
      ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
    )`
  },
  
  rank: {
    name: 'rank',
    title: 'Productivity Rank',
    type: 'number',
    sql: sql`RANK() OVER (ORDER BY ${productivity.linesOfCode} DESC)`
  }
}
```

**Test File**: `tests/aggregations-window-functions.test.ts`

#### 2.3 Complex Calculated Measures
**Priority: Medium**

```typescript
measures: {
  // Conditional aggregations
  conditionalSum: {
    name: 'conditionalSum',
    title: 'Conditional Sum',
    type: 'number',
    sql: sql`SUM(CASE WHEN ${employees.salary} > 75000 THEN ${employees.salary} ELSE 0 END)`
  },
  
  // Ratios and percentages
  salaryToMedianRatio: {
    name: 'salaryToMedianRatio',
    title: 'Salary to Median Ratio', 
    type: 'number',
    sql: sql`${employees.salary} / PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ${employees.salary}) OVER ()`
  },
  
  // String aggregations
  namesList: {
    name: 'namesList',
    title: 'Concatenated Names',
    type: 'string',
    sql: sql`STRING_AGG(${employees.name}, ', ')`
  }
}
```

**Test File**: `tests/aggregations-calculated.test.ts`

### 3. Advanced Time Dimension Features

#### 3.1 Timezone Handling
**Priority: High**

```typescript
// Test timezone-aware queries
const timezoneTests = [
  {
    dimension: 'Productivity.date',
    granularity: 'hour',
    timezone: 'America/New_York'
  },
  {
    dimension: 'Productivity.date', 
    granularity: 'day',
    timezone: 'UTC'
  },
  {
    dimension: 'Productivity.date',
    granularity: 'day',
    timezone: 'Asia/Tokyo'
  }
]

// DST transition testing
const dstTests = [
  // Spring forward (2024-03-10 in US)
  { dateRange: ['2024-03-09', '2024-03-11'], timezone: 'America/New_York' },
  
  // Fall back (2024-11-03 in US) 
  { dateRange: ['2024-11-02', '2024-11-04'], timezone: 'America/New_York' }
]
```

**Test File**: `tests/time-dimensions-timezones.test.ts`

#### 3.2 Custom Date Formats and Fiscal Years
**Priority: Medium**

```typescript
// Fiscal year calculations (April 1 - March 31)
dimensions: {
  fiscalYear: {
    name: 'fiscalYear',
    title: 'Fiscal Year',
    type: 'string',
    sql: sql`CASE 
      WHEN EXTRACT(MONTH FROM ${productivity.date}) >= 4 
      THEN EXTRACT(YEAR FROM ${productivity.date})
      ELSE EXTRACT(YEAR FROM ${productivity.date}) - 1 
    END || '-' || CASE 
      WHEN EXTRACT(MONTH FROM ${productivity.date}) >= 4 
      THEN EXTRACT(YEAR FROM ${productivity.date}) + 1
      ELSE EXTRACT(YEAR FROM ${productivity.date})
    END`
  },
  
  fiscalQuarter: {
    name: 'fiscalQuarter',
    title: 'Fiscal Quarter', 
    type: 'string',
    sql: sql`'FY' || CASE
      WHEN EXTRACT(MONTH FROM ${productivity.date}) IN (4,5,6) THEN 'Q1'
      WHEN EXTRACT(MONTH FROM ${productivity.date}) IN (7,8,9) THEN 'Q2' 
      WHEN EXTRACT(MONTH FROM ${productivity.date}) IN (10,11,12) THEN 'Q3'
      ELSE 'Q4'
    END`
  }
}
```

**Test File**: `tests/time-dimensions-fiscal.test.ts`

#### 3.3 Week Boundary Edge Cases
**Priority: Medium**

```typescript
// Week boundary tests across different standards
const weekBoundaryTests = [
  // ISO week (Monday start)
  { granularity: 'week', dateRange: ['2024-01-01', '2024-01-07'] }, // Week 1 2024
  
  // US week (Sunday start) 
  { granularity: 'week', dateRange: ['2023-12-31', '2024-01-06'] }, // Week 1 2024
  
  // Year boundary weeks
  { granularity: 'week', dateRange: ['2023-12-25', '2024-01-07'] }, // Cross-year weeks
  
  // Leap year edge cases
  { granularity: 'week', dateRange: ['2024-02-26', '2024-03-03'] } // Leap year February
]
```

**Test File**: `tests/time-dimensions-boundaries.test.ts`

### 4. Advanced Data Types and Handling

#### 4.1 JSON and Complex Data Types
**Priority: Low**

```typescript
// Add JSON fields to test schema
const extendedEmployees = pgTable('employees_extended', {
  // ... existing fields
  metadata: jsonb('metadata'), // PostgreSQL JSONB
  tags: jsonb('tags').$type<string[]>(), // Array of tags
  preferences: jsonb('preferences').$type<{
    theme: 'dark' | 'light',
    notifications: boolean,
    locale: string
  }>()
})

// JSON aggregation tests
measures: {
  uniqueTags: {
    name: 'uniqueTags',
    title: 'Unique Tags Count',
    type: 'number',
    sql: sql`COUNT(DISTINCT jsonb_array_elements_text(${extendedEmployees.tags}))`
  },
  
  darkThemeUsers: {
    name: 'darkThemeUsers',
    title: 'Dark Theme Users',
    type: 'count',
    sql: extendedEmployees.id,
    filters: [
      (ctx) => sql`${extendedEmployees.preferences}->>'theme' = 'dark'`
    ]
  }
}
```

**Test File**: `tests/data-types-json.test.ts`

#### 4.2 Geographic and Spatial Data
**Priority: Low**

```typescript
// Add spatial fields (if using PostGIS)
const locations = pgTable('locations', {
  id: serial('id').primaryKey(),
  name: text('name'),
  coordinates: geometry('coordinates', { type: 'point', srid: 4326 }),
  organizationId: text('organization_id')
})

measures: {
  averageDistance: {
    name: 'averageDistance',
    title: 'Average Distance from HQ',
    type: 'number',
    sql: sql`AVG(ST_Distance(${locations.coordinates}, ST_Point(-74.0060, 40.7128)))`
  }
}
```

**Test File**: `tests/data-types-spatial.test.ts`

### 5. Performance and Scalability Tests

#### 5.1 Large Dataset Handling
**Priority: High**

```typescript
// Performance benchmarks with large datasets
const performanceTests = [
  {
    name: 'Large result set (10k+ rows)',
    query: {
      measures: ['Employees.count'],
      dimensions: ['Employees.name', 'Employees.departmentId'],
      limit: 10000
    },
    expectedMaxTime: 2000 // 2 seconds
  },
  
  {
    name: 'Complex aggregation on large dataset',
    query: {
      measures: ['Employees.avgSalary', 'Employees.maxSalary', 'Employees.minSalary'],
      dimensions: ['Employees.departmentId'],
      filters: [
        { member: 'Employees.createdAt', operator: 'inDateRange', values: ['2020-01-01', '2024-12-31'] }
      ]
    },
    expectedMaxTime: 1000
  }
]
```

**Test File**: `tests/performance-large-datasets.test.ts`

#### 5.2 Memory Usage and Resource Management
**Priority: Medium**

```typescript
// Memory usage tests
describe('Memory Usage', () => {
  it('should not leak memory during repeated queries', async () => {
    const initialMemory = process.memoryUsage().heapUsed
    
    // Run 100 queries
    for (let i = 0; i < 100; i++) {
      await testExecutor.executeQuery(standardQuery)
    }
    
    // Force garbage collection if available
    if (global.gc) global.gc()
    
    const finalMemory = process.memoryUsage().heapUsed
    const memoryIncrease = finalMemory - initialMemory
    
    // Memory increase should be minimal (< 10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
  })
})
```

**Test File**: `tests/performance-memory.test.ts`

#### 5.3 Concurrent Query Execution
**Priority: Medium**

```typescript
// Concurrency tests
describe('Concurrent Execution', () => {
  it('should handle multiple simultaneous queries', async () => {
    const queries = Array(10).fill(null).map((_, i) => 
      testExecutor.executeQuery({
        measures: ['Employees.count'],
        filters: [
          { member: 'Employees.id', operator: 'gte', values: [i * 100] }
        ]
      })
    )
    
    const results = await Promise.all(queries)
    
    // All queries should complete successfully
    results.forEach(result => {
      expect(result.data).toBeDefined()
      expect(result.annotation).toBeDefined()
    })
  })
})
```

**Test File**: `tests/performance-concurrency.test.ts`

### 6. Error Handling and Edge Cases

#### 6.1 Invalid Query Structures
**Priority: High**

```typescript
// Comprehensive negative testing
const invalidQueries = [
  // Missing required fields
  { /* empty query */ },
  { measures: [] },
  { dimensions: [] },
  
  // Invalid field references
  { measures: ['NonExistent.measure'] },
  { dimensions: ['Invalid.field'] },
  { timeDimensions: [{ dimension: 'Missing.date' }] },
  
  // Invalid filter structures
  { 
    measures: ['Employees.count'],
    filters: [
      { member: 'Employees.name' } // Missing operator and values
    ]
  },
  
  // Invalid data types
  {
    measures: ['Employees.count'],
    limit: 'invalid' // Should be number
  },
  
  // Circular references in multi-cube queries
  // (if we support complex joins in future)
]
```

**Test File**: `tests/error-handling-invalid-queries.test.ts`

#### 6.2 Database Connection and Network Issues
**Priority: High**

```typescript
// Network failure simulation
describe('Database Failures', () => {
  it('should handle connection timeouts gracefully', async () => {
    // Mock database to simulate timeout
    const timeoutExecutor = createTimeoutMockExecutor(5000) // 5 second timeout
    
    const query = TestQueryBuilder.create()
      .measures(['Employees.count'])
      .build()
    
    await expect(timeoutExecutor.executeQuery(query))
      .rejects
      .toThrow(/timeout|connection/i)
  })
  
  it('should handle connection drops during query', async () => {
    // Test connection drop simulation
    // Implementation would depend on test database setup
  })
})
```

**Test File**: `tests/error-handling-database-failures.test.ts`

#### 6.3 Resource Exhaustion
**Priority: Medium**

```typescript
// Resource exhaustion tests
describe('Resource Limits', () => {
  it('should handle queries that exceed memory limits', async () => {
    const largeQuery = TestQueryBuilder.create()
      .measures(['Employees.count'])
      .dimensions(['Employees.name'])
      .limit(100000) // Very large limit
      .build()
      
    // Should either complete or fail gracefully
    try {
      const result = await testExecutor.executeQuery(largeQuery)
      expect(result.data.length).toBeLessThanOrEqual(100000)
    } catch (error) {
      expect(error.message).toMatch(/memory|limit|resource/i)
    }
  })
})
```

**Test File**: `tests/error-handling-resource-limits.test.ts`

### 7. Security and Authentication Tests

#### 7.1 Advanced Security Context Scenarios
**Priority: High**

```typescript
// Multi-level security contexts
const advancedSecurityTests = [
  // Hierarchical organizations
  {
    context: { organizationId: 'parent-org', subsidiaryId: 'sub-1' },
    expectation: 'Should see parent + subsidiary data'
  },
  
  // Role-based access
  {
    context: { organizationId: 'org-1', role: 'admin' },
    expectation: 'Should see all organization data'
  },
  
  {
    context: { organizationId: 'org-1', role: 'user', departmentId: 'dept-1' },
    expectation: 'Should only see department data'
  },
  
  // Time-based access (data retention policies)
  {
    context: { organizationId: 'org-1', accessLevel: 'standard' },
    expectation: 'Should only see last 2 years of data'
  }
]
```

**Test File**: `tests/security-advanced-contexts.test.ts`

#### 7.2 SQL Injection Attack Vectors
**Priority: High**

```typescript
// Comprehensive SQL injection tests
const injectionTests = [
  // Basic injection attempts
  { field: 'Employees.name', value: "'; DROP TABLE employees; --" },
  { field: 'Employees.name', value: "' UNION SELECT * FROM passwords --" },
  
  // Encoded injection attempts
  { field: 'Employees.name', value: "%27%3B%20DROP%20TABLE%20employees%3B%20--" },
  
  // Multi-step injections
  { field: 'Employees.name', value: "'; INSERT INTO admin_users VALUES ('hacker', 'password'); --" },
  
  // Function-based injections
  { field: 'Employees.salary', value: "50000; SELECT pg_sleep(10); --" },
  
  // NoSQL-style injections (for JSON fields)
  { field: 'Employees.metadata', value: "'; /**/; DROP TABLE employees; --" }
]
```

**Test File**: `tests/security-sql-injection.test.ts`

### 8. Real-World Integration Scenarios

#### 8.1 Dashboard Integration Patterns
**Priority: Medium**

```typescript
// Common dashboard query patterns
const dashboardScenarios = [
  {
    name: 'Executive Summary Dashboard',
    queries: [
      // KPI tiles
      { measures: ['Employees.count', 'Employees.activeCount'] },
      { measures: ['Departments.count'] },
      { measures: ['Productivity.totalLinesOfCode'], timeDimensions: [{ dimension: 'Productivity.date', dateRange: 'this month' }] },
      
      // Charts
      {
        measures: ['Employees.count'],
        dimensions: ['Departments.name'],
        order: { 'Employees.count': 'desc' }
      },
      
      {
        measures: ['Productivity.avgLinesOfCode'],
        timeDimensions: [{ 
          dimension: 'Productivity.date', 
          granularity: 'day',
          dateRange: 'last 30 days' 
        }]
      }
    ]
  },
  
  {
    name: 'HR Analytics Dashboard',
    queries: [
      // Demographics
      {
        measures: ['Employees.count'],
        dimensions: ['Employees.departmentId'],
        filters: [{ member: 'Employees.active', operator: 'equals', values: [true] }]
      },
      
      // Salary analysis
      {
        measures: ['Employees.avgSalary', 'Employees.minSalary', 'Employees.maxSalary'],
        dimensions: ['Employees.departmentId']
      },
      
      // Hiring trends
      {
        measures: ['Employees.count'],
        timeDimensions: [{
          dimension: 'Employees.createdAt',
          granularity: 'month',
          dateRange: 'last 12 months'
        }]
      }
    ]
  }
]
```

**Test File**: `tests/integration-dashboard-scenarios.test.ts`

#### 8.2 Caching Behavior Tests
**Priority: Medium**

```typescript
// Cache testing scenarios
describe('Query Caching', () => {
  it('should cache identical queries', async () => {
    const query = TestQueryBuilder.create()
      .measures(['Employees.count'])
      .build()
    
    const start1 = performance.now()
    const result1 = await testExecutor.executeQuery(query)
    const time1 = performance.now() - start1
    
    const start2 = performance.now() 
    const result2 = await testExecutor.executeQuery(query)
    const time2 = performance.now() - start2
    
    // Second query should be faster (cached)
    expect(time2).toBeLessThan(time1 * 0.5)
    expect(result1.data).toEqual(result2.data)
  })
})
```

**Test File**: `tests/integration-caching.test.ts`

## Test Organization and Cleanup

### Reorganize Existing Test Files

#### Current Structure Issues
1. **Overlapping coverage**: Some tests duplicate functionality
2. **Unclear boundaries**: Test files don't have clear separation of concerns
3. **Mixed abstraction levels**: Unit tests mixed with integration tests

#### Proposed Reorganization

```
tests/
├── unit/                           # Unit tests for individual components
│   ├── query-builder.test.ts       # TestQueryBuilder unit tests
│   ├── query-validator.test.ts     # QueryValidator unit tests
│   └── performance-measurer.test.ts # PerformanceMeasurer unit tests
│
├── integration/                    # Integration tests
│   ├── basic/                      # Basic integration scenarios
│   │   ├── aggregations.test.ts    # Reorganized from aggregations-comprehensive
│   │   ├── filters.test.ts         # Reorganized from filters-comprehensive
│   │   ├── time-dimensions.test.ts # Reorganized from time-dimensions-comprehensive
│   │   └── multi-cube.test.ts      # Reorganized from multi-cube-comprehensive
│   │
│   ├── advanced/                   # Advanced scenarios (new)
│   │   ├── filters-advanced.test.ts
│   │   ├── aggregations-statistical.test.ts
│   │   ├── time-dimensions-fiscal.test.ts
│   │   └── data-types-json.test.ts
│   │
│   └── real-world/                 # Real-world scenarios (new)
│       ├── dashboard-scenarios.test.ts
│       ├── caching-behavior.test.ts
│       └── concurrent-usage.test.ts
│
├── performance/                    # Performance and load tests
│   ├── large-datasets.test.ts
│   ├── memory-usage.test.ts
│   ├── concurrency.test.ts
│   └── query-optimization.test.ts
│
├── security/                       # Security-focused tests
│   ├── multi-tenant-isolation.test.ts # Reorganized from table-prefix-security
│   ├── sql-injection.test.ts
│   ├── advanced-contexts.test.ts
│   └── permission-escalation.test.ts
│
├── error-handling/                 # Error scenarios and edge cases
│   ├── invalid-queries.test.ts     # Reorganized from query-validation negative tests
│   ├── database-failures.test.ts
│   ├── resource-limits.test.ts
│   └── network-issues.test.ts
│
├── adapters/                       # Framework adapter tests (existing)
│   ├── express.test.ts
│   ├── fastify.test.ts
│   ├── hono.test.ts
│   └── nextjs.test.ts
│
├── helpers/                        # Test utilities (existing)
│   ├── test-database.ts
│   ├── test-cubes.ts
│   ├── test-utilities.ts
│   └── enhanced-test-data.ts
│
└── setup/                          # Test setup and configuration
    ├── globalSetup.ts
    ├── globalTeardown.ts
    └── vitest.config.ts
```

## Code Coverage Integration

### Setup Code Coverage Reporting

#### 1. Install Coverage Dependencies

```json
// package.json devDependencies additions
{
  "c8": "^8.0.1",
  "@vitest/coverage-c8": "^2.0.0"
}
```

#### 2. Update Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    globalSetup: './tests/setup/globalSetup.ts',
    globalTeardown: './tests/setup/globalTeardown.ts',
    coverage: {
      provider: 'c8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        'dist/',
        'examples/',
        '**/*.test.ts',
        '**/*.config.ts',
        'vite.config.*.ts'
      ],
      thresholds: {
        global: {
          lines: 80,
          functions: 80,
          branches: 70,
          statements: 80
        },
        // More strict for core server components
        'src/server/': {
          lines: 90,
          functions: 90,
          branches: 80,
          statements: 90
        }
      }
    }
  },
})
```

#### 3. Add Coverage Scripts

```json
// package.json scripts additions
{
  "test:coverage": "vitest run --coverage",
  "test:coverage:watch": "vitest --watch --coverage",
  "test:coverage:ui": "vitest --ui --coverage",
  "coverage:open": "open coverage/index.html"
}
```

#### 4. Coverage Reporting Integration

```bash
# Local development
npm run test:coverage

# CI/CD integration
npm run test:coverage -- --reporter=json --outputFile=coverage/coverage.json

# Coverage badge generation (for README)
# Use services like Codecov, Coveralls, or GitHub Actions
```

## Implementation Priority

### Phase 1: High Priority (Complete in 1-2 weeks)
1. **Advanced Filter Operations** - Between, In/NotIn, Like operators
2. **Error Handling** - Invalid queries, database failures, network issues  
3. **Security Testing** - SQL injection prevention, advanced security contexts
4. **Code Coverage Setup** - Configure coverage reporting and thresholds

### Phase 2: Medium Priority (Complete in 3-4 weeks)
1. **Statistical Aggregations** - Median, percentiles, standard deviation
2. **Performance Testing** - Large datasets, memory usage, concurrency
3. **Time Dimension Enhancements** - Timezone handling, fiscal years
4. **Real-World Scenarios** - Dashboard patterns, caching behavior

### Phase 3: Low Priority (Complete in 5-6 weeks)
1. **Advanced Data Types** - JSON, spatial data, arrays
2. **Window Functions** - Running totals, moving averages, ranking
3. **Complex Calculated Measures** - Multi-step calculations, ratios
4. **Integration Testing** - End-to-end scenarios, external dependencies

## Testing Best Practices

### 1. Test Data Management
- Use consistent test data across all scenarios
- Implement data factories for generating test scenarios
- Ensure test data isolation between test runs
- Use database transactions for test isolation where possible

### 2. Assertion Patterns
- Use descriptive assertion messages
- Test both positive and negative scenarios
- Validate not just results but also performance characteristics
- Include schema validation for complex results

### 3. Test Organization
- Group related tests in describe blocks
- Use consistent naming conventions
- Include setup and teardown for each test suite
- Document expected behavior in test descriptions

### 4. Performance Testing
- Set realistic performance thresholds
- Test with data sizes similar to production
- Monitor memory usage and connection pooling
- Include worst-case scenario testing

### 5. Security Testing
- Test all input vectors for injection attempts
- Validate security context isolation at every level
- Include edge cases for permission scenarios
- Test authentication and authorization separately

## Metrics and Success Criteria

### Code Coverage Targets
- **Overall**: 80% line coverage, 70% branch coverage
- **Server Core**: 90% line coverage, 80% branch coverage
- **Adapters**: 85% line coverage, 75% branch coverage
- **Client Components**: 75% line coverage, 65% branch coverage

### Performance Benchmarks
- **Basic queries**: < 100ms for simple aggregations
- **Complex queries**: < 1000ms for multi-cube with filters
- **Large datasets**: < 5000ms for 10k+ row results
- **Memory usage**: < 100MB heap growth per 1000 queries

### Quality Metrics
- **Zero SQL injection vulnerabilities**: All input vectors tested
- **100% security context coverage**: All cubes properly isolated
- **Zero data leakage**: Cross-tenant isolation verified
- **Graceful error handling**: All error scenarios return structured responses

## Conclusion

This comprehensive testing roadmap provides a structured approach to achieving robust test coverage for drizzle-cube. The phased implementation approach ensures that critical security and stability issues are addressed first, while advanced features and optimizations are added systematically.

The success of this testing strategy will be measured not just by coverage metrics, but by the confidence it provides in deploying drizzle-cube to production environments with complex, real-world requirements.