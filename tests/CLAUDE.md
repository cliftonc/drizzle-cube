# Testing Architecture

This document describes the testing infrastructure for drizzle-cube, focusing on multi-database testing patterns, test utilities, and conventions for maintaining comprehensive test coverage.

## Overview

The testing system supports running tests against PostgreSQL, MySQL, and SQLite databases to ensure feature compatibility and security isolation across all supported database engines. Tests are designed to validate both functionality and security patterns.

## Multi-Database Testing Strategy

### Database Selection
Tests can run against different databases using environment variables:

```bash
npm test                    # PostgreSQL (default)
npm run test:mysql         # MySQL only
npm run test:sqlite        # SQLite only  
npm run test:all           # All databases sequentially
TEST_DB_TYPE=mysql npm test # Explicit selection
```

### Environment Configuration
- `TEST_DB_TYPE` - Controls database selection (`postgres` | `mysql` | `sqlite`)
- `TEST_DATABASE_URL` - PostgreSQL connection (default: `postgres://test:test@localhost:5433/test`)
- `MYSQL_TEST_DATABASE_URL` - MySQL connection (default: `mysql://test:test@localhost:3307/test`)
- SQLite uses in-memory databases for isolation

### Safety Mechanisms
- All test database URLs **must contain \"test\" substring** for safety
- Separate ports (5433, 3307) prevent conflicts with production databases
- Docker containers provide isolated test environments
- Fresh database connections per test ensure isolation

## Test Database Architecture

### Database-Specific Schemas
Each database has its own schema implementation in @tests/helpers/databases/:

```
helpers/databases/
├── postgres/
│   ├── schema.ts          # PostgreSQL-specific schema
│   ├── setup.ts           # Connection and migration setup
│   └── migrations/        # PostgreSQL migrations
├── mysql/
│   ├── schema.ts          # MySQL-specific schema
│   ├── setup.ts           # Connection and migration setup
│   └── migrations/        # MySQL migrations
└── sqlite/
    ├── schema.ts          # SQLite-specific schema  
    ├── setup.ts           # Connection and migration setup
    └── migrations/        # SQLite migrations
```

### Schema Consistency
While each database has separate schema files, they maintain logical consistency:
- Same table structures across databases
- Equivalent data types (with database-specific mappings)
- Identical test data seeding
- Consistent foreign key relationships

## Test Utilities System

### Core Test Helpers

**@tests/helpers/test-database.ts** - Unified database interface:
```typescript
// Dynamic schema loading based on TEST_DB_TYPE
export async function getTestSchema() {
  const dbType = getTestDatabaseType()
  // Returns database-specific schema and tables
}

// Create database executor for current test database
export async function createTestDatabaseExecutor() {
  const { schema } = await getTestSchema()
  const executor = createDatabaseExecutor(db, schema)
  return executor
}
```

**@tests/helpers/test-utilities.ts** - Query testing utilities:
```typescript
export class TestQueryBuilder {
  static create() {
    return new TestQueryBuilder()
  }
  
  measures(measures: string[]) { return this }
  dimensions(dimensions: string[]) { return this }
  filters(filters: Filter[]) { return this }
  timeDimensions(timeDimensions: TimeDimension[]) { return this }
  build(): SemanticQuery { /* ... */ }
}

export class TestExecutor {
  static async create(cubes: Cube[]) {
    // Creates executor with test database and registers cubes
  }
  
  async executeQuery(query: SemanticQuery): Promise<QueryResult> {
    // Execute with test security context
  }
  
  async validateQuery(query: SemanticQuery, expectedFields: string[]) {
    // Execute and validate result structure
  }
}
```

### Test Cube Definitions (@tests/helpers/test-cubes.ts)

**Pattern**: All test cubes implement security context filtering:
```typescript
export async function createTestCubesForCurrentDatabase() {
  const { schema, employees, departments } = await getTestSchema()
  
  const testEmployeesCube = defineCube({
    name: 'Employees',
    // REQUIRED: Security context filtering
    sql: (securityContext) => eq(employees.organisationId, securityContext.organisationId),
    
    measures: {
      count: { type: 'count', sql: () => employees.id },
      averageSalary: { type: 'avg', sql: () => employees.salary }
    },
    
    dimensions: {
      name: { type: 'string', sql: () => employees.name },
      departmentName: { type: 'string', sql: () => employees.departmentName },
      createdAt: { type: 'time', sql: () => employees.createdAt }
    }
  })
  
  return { testEmployeesCube, /* other cubes */ }
}
```

## Test Categories and Patterns

### Aggregation Tests (`aggregations-comprehensive.test.ts`)
**Focus**: Test all aggregation types across databases
```typescript
describe('Comprehensive Aggregations', () => {
  it('should handle COUNT aggregation correctly', async () => {
    const query = TestQueryBuilder.create()
      .measures(['Employees.count'])
      .build()
      
    const result = await testExecutor.executeQuery(query)
    expect(result.data[0]['Employees.count']).toBeGreaterThan(0)
  })
})
```

### Filter Tests (`filters-comprehensive.test.ts`)
**Focus**: Test all filter operators and edge cases
```typescript
it('should handle date range filters', async () => {
  const query = TestQueryBuilder.create()
    .measures(['Employees.count'])
    .filters([{
      member: 'Employees.createdAt',
      operator: 'inDateRange',
      values: ['2024-01-01', '2024-12-31']
    }])
    .build()
    
  const result = await testExecutor.executeQuery(query)
  // Validate results
})
```

### Multi-Cube Tests (`multi-cube-comprehensive.test.ts`)
**Focus**: Cross-cube queries, joins, and security isolation
```typescript
it('should handle measures from multiple cubes', async () => {
  const query = TestQueryBuilder.create()
    .measures(['Employees.count', 'Departments.count', 'Productivity.totalLines'])
    .build()
    
  const result = await testExecutor.executeQuery(query)
  // Validate multi-cube aggregation
})
```

### Security Tests (`table-prefix-security.test.ts`)
**Focus**: Ensure security context is applied to all tables
```typescript
it('should include table prefixes in multi-cube queries', async () => {
  const query = TestQueryBuilder.create()
    .measures(['Employees.count', 'Departments.count'])
    .build()
    
  const { sql } = await testExecutor.generateSql(query, securityContext)
  
  // Verify security context is applied to ALL tables
  expect(sql).toContain('employees.organisation_id = $')
  expect(sql).toContain('departments.organisation_id = $') 
})
```

### Performance Tests
**Pattern**: Measure query execution time and complexity
```typescript
it('should complete complex queries within performance threshold', async () => {
  const startTime = performance.now()
  
  const result = await testExecutor.executeQuery(complexQuery)
  
  const endTime = performance.now()
  const executionTime = endTime - startTime
  
  expect(executionTime).toBeLessThan(1000) // 1 second threshold
  expect(result.data).toBeDefined()
})
```

## Test Data Management

### Enhanced Test Data (@tests/helpers/enhanced-test-data.ts)
Provides consistent test datasets across all databases:
```typescript
export const enhancedEmployees = [
  {
    id: 1,
    name: 'John Doe',
    organisationId: 'org-1', // Security context isolation
    departmentName: 'Engineering',
    salary: 75000,
    createdAt: new Date('2024-01-15')
  },
  // More test records...
]

export const enhancedDepartments = [
  {
    id: 1,
    organisationId: 'org-1', // Security context isolation  
    name: 'Engineering',
    createdAt: new Date('2023-01-01')
  },
  // More test records...
]
```

### Test Data Seeding Pattern
```typescript
beforeEach(async () => {
  const { schema } = await getTestSchema()
  
  // Clear existing data
  await db.delete(schema.employees)
  await db.delete(schema.departments)
  
  // Seed fresh test data
  await db.insert(schema.employees).values(enhancedEmployees)
  await db.insert(schema.departments).values(enhancedDepartments)
})
```

## Global Test Setup

### Setup (@tests/setup/globalSetup.ts)
```typescript
export default async function globalSetup() {
  const dbType = getTestDatabaseType()
  
  if (dbType === 'postgres') {
    await setupPostgresDatabase()
  } else if (dbType === 'mysql') {
    await setupMySQLDatabase()  
  } else if (dbType === 'sqlite') {
    await setupSQLiteDatabase()
  }
}
```

### Docker Container Management
```typescript
// Automatically starts/stops test databases
export async function setupPostgresDatabase() {
  // Start PostgreSQL container on port 5433
  // Run migrations
  // Verify connection
}

export async function setupMySQLDatabase() {
  // Start MySQL container on port 3307
  // Run migrations  
  // Verify connection
}
```

## Framework Adapter Testing

### Adapter Test Pattern (@tests/adapters/)
```typescript
describe('Express Adapter', () => {
  let app: express.Application
  let semanticLayer: SemanticLayerCompiler
  
  beforeEach(async () => {
    semanticLayer = new SemanticLayerCompiler({ /* test config */ })
    
    app = express()
    const cubeApi = createCubeApi({
      extractSecurityContext: (req) => ({ organisationId: 'org-1' }),
      semanticLayer
    })
    app.use('/api', cubeApi)
  })
  
  it('should handle complex queries with filters', async () => {
    const response = await request(app)
      .post('/api/load')
      .send(testQuery)
      .expect(200)
      
    expect(response.body).toMatchObject({
      data: expect.any(Array),
      annotation: expect.any(Object),
      requestId: expect.any(String)
    })
  })
})
```

## Adding New Tests

### Test File Structure
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestDatabaseExecutor, getTestSchema } from './helpers/test-database'
import { createTestCubesForCurrentDatabase } from './helpers/test-cubes'
import { TestQueryBuilder, TestExecutor } from './helpers/test-utilities'

describe('New Feature Tests', () => {
  let testExecutor: TestExecutor
  
  beforeEach(async () => {
    const cubes = await createTestCubesForCurrentDatabase()
    testExecutor = await TestExecutor.create([cubes.testEmployeesCube])
  })
  
  it('should test new feature', async () => {
    const query = TestQueryBuilder.create()
      .measures(['Employees.count'])
      .build()
      
    const result = await testExecutor.executeQuery(query)
    expect(result.data).toBeDefined()
  })
})
```

### Security Testing Pattern
**Always test security context isolation**:
```typescript
it('should enforce security context isolation', async () => {
  const org1Query = TestQueryBuilder.create().measures(['Employees.count']).build()
  const org2Query = TestQueryBuilder.create().measures(['Employees.count']).build()
  
  const org1Result = await testExecutor.executeQuery(org1Query, { organisationId: 'org-1' })
  const org2Result = await testExecutor.executeQuery(org2Query, { organisationId: 'org-2' })
  
  // Results should be isolated by organization
  expect(org1Result.data[0]['Employees.count']).not.toEqual(org2Result.data[0]['Employees.count'])
})
```

## Running Tests

### Development Workflow
```bash
# Run all tests on default database (PostgreSQL)
npm test

# Run specific test file
npm test aggregations-comprehensive.test.ts

# Run with specific database
TEST_DB_TYPE=mysql npm test

# Run in watch mode for development
npm run test:watch

# Run cross-database validation
npm run test:all
```

### CI/CD Integration
Tests run automatically against all three databases in CI to ensure compatibility.

## Key Files Reference

- @tests/helpers/test-database.ts:34 - Dynamic schema loading
- @tests/helpers/test-utilities.ts:89 - TestQueryBuilder implementation
- @tests/helpers/test-cubes.ts:45 - Security context patterns in test cubes
- @tests/setup/globalSetup.ts:23 - Database initialization
- @tests/helpers/enhanced-test-data.ts:67 - Consistent test datasets

## Guard Rails

1. **Security context is mandatory** - All test cubes must implement security filtering
2. **Multi-database compatibility** - New tests must pass on PostgreSQL, MySQL, and SQLite
3. **Data isolation** - Use fresh database connections and data seeding per test
4. **Performance validation** - Include performance assertions for complex queries
5. **Safety checks** - Test database URLs must contain \"test\" substring
6. **Comprehensive coverage** - Test both success and error scenarios