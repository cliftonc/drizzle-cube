# TypeScript

Drizzle Cube is built with TypeScript-first design, providing comprehensive type safety from database schema to API responses. This guide covers advanced TypeScript patterns, type inference, and best practices for building type-safe analytics.

## Overview

Drizzle Cube's type system ensures:
- **Schema-to-Query Type Safety**: Cube definitions are validated against database schema
- **Query Result Type Inference**: Results are properly typed based on requested fields
- **Security Context Typing**: Type-safe security context throughout the application
- **Framework Integration**: Full TypeScript support for all major frameworks

## Schema-First Types

### Drizzle Schema Integration

```typescript
// schema.ts - Define your database schema with Drizzle
import { pgTable, serial, varchar, timestamp, integer, boolean } from 'drizzle-orm/pg-core'

export const employees = pgTable('employees', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  departmentId: integer('department_id').references(() => departments.id),
  salary: integer('salary'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  organisationId: varchar('organisation_id', { length: 255 }).notNull()
})

export const departments = pgTable('departments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  budget: integer('budget'),
  organisationId: varchar('organisation_id', { length: 255 }).notNull()
})

// Export schema type for use throughout application
export type Schema = {
  employees: typeof employees
  departments: typeof departments
}
```

### Type-Safe Cube Definitions

```typescript
// cubes.ts - Define cubes with full type safety
import { defineCube } from 'drizzle-cube/server'
import type { Cube, QueryContext, BaseQueryDefinition } from 'drizzle-cube/server'
import { employees, departments, type Schema } from './schema'

// Fully typed cube definition
export const employeesCube: Cube<Schema> = defineCube('Employees', {
  title: 'Employee Analytics',
  description: 'Employee data and metrics',
  
  // Type-safe SQL function
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: employees, // ✅ Type-checked against schema
    joins: [{
      table: departments, // ✅ Type-checked against schema
      on: eq(employees.departmentId, departments.id), // ✅ Column types verified
      type: 'left'
    }],
    where: eq(employees.organisationId, ctx.securityContext.organisationId)
  }),
  
  // Type-safe dimensions
  dimensions: {
    id: {
      name: 'id',
      title: 'Employee ID',
      type: 'number',
      sql: employees.id, // ✅ Type-checked against schema
      primaryKey: true
    },
    name: {
      name: 'name', 
      title: 'Employee Name',
      type: 'string',
      sql: employees.name // ✅ Column exists and type matches
    },
    departmentName: {
      name: 'departmentName',
      title: 'Department',
      type: 'string',
      sql: departments.name // ✅ Available through join
    }
  },
  
  // Type-safe measures
  measures: {
    count: {
      name: 'count',
      title: 'Total Employees',
      type: 'count',
      sql: employees.id // ✅ Type-checked
    },
    avgSalary: {
      name: 'avgSalary',
      title: 'Average Salary',
      type: 'avg',
      sql: employees.salary // ✅ Numeric column verified
    }
  }
})
```

## Advanced Type Patterns

### Generic Cube Factory

Create reusable cube factories with proper typing:

```typescript
// Generic cube factory function
function createAnalyticsCube<
  TSchema extends Record<string, any>,
  TTable extends TSchema[keyof TSchema]
>(
  name: string,
  table: TTable,
  schema: TSchema,
  config: Partial<CubeConfig<TSchema>>
): Cube<TSchema> {
  return defineCube(name, {
    sql: (ctx: QueryContext<TSchema>) => ({
      from: table,
      where: eq(table.organisationId, ctx.securityContext.organisationId)
    }),
    ...config
  })
}

// Usage with full type safety
const usersCube = createAnalyticsCube(
  'Users', 
  users,     // ✅ Type-checked table
  schema,    // ✅ Schema matches
  {
    dimensions: {
      name: {
        name: 'name',
        type: 'string',
        sql: users.name // ✅ Column exists on table
      }
    }
  }
)
```

### Conditional Types for Security Context

```typescript
// Conditional security context types based on user role
type BaseSecurityContext = {
  organisationId: string
  userId: string
  userRole: 'admin' | 'manager' | 'employee'
}

type AdminContext = BaseSecurityContext & {
  userRole: 'admin'
  // Admins have access to all data
}

type ManagerContext = BaseSecurityContext & {
  userRole: 'manager'
  departmentId: string // Managers need department context
}

type EmployeeContext = BaseSecurityContext & {
  userRole: 'employee'
  // Employees only see their own data
}

type SecurityContext = AdminContext | ManagerContext | EmployeeContext

// Type-safe security context extraction
export function createSecurityContext(
  user: { id: string; organisationId: string; role: string; departmentId?: string }
): SecurityContext {
  const baseContext = {
    organisationId: user.organisationId,
    userId: user.id,
    userRole: user.role as SecurityContext['userRole']
  }

  switch (user.role) {
    case 'admin':
      return { ...baseContext, userRole: 'admin' }
    case 'manager':
      if (!user.departmentId) {
        throw new Error('Manager role requires departmentId')
      }
      return { ...baseContext, userRole: 'manager', departmentId: user.departmentId }
    case 'employee':
      return { ...baseContext, userRole: 'employee' }
    default:
      throw new Error(`Invalid user role: ${user.role}`)
  }
}
```

### Query Result Type Inference

```typescript
// Type-safe query result inference
type QueryResultType<T extends CubeQuery> = {
  [K in NonNullable<T['measures']>[number]]: number
} & {
  [K in NonNullable<T['dimensions']>[number]]: string | number | boolean
}

// Usage example
const query = {
  measures: ['Employees.count', 'Employees.avgSalary'],
  dimensions: ['Employees.departmentName', 'Employees.isActive']
} as const

type ResultType = QueryResultType<typeof query>
// Inferred type:
// {
//   'Employees.count': number
//   'Employees.avgSalary': number
//   'Employees.departmentName': string
//   'Employees.isActive': boolean
// }

// Type-safe result processing
function processResults(data: ResultType[]) {
  return data.map(row => ({
    department: row['Employees.departmentName'], // ✅ String type
    employeeCount: row['Employees.count'],       // ✅ Number type
    avgSalary: row['Employees.avgSalary'],       // ✅ Number type
    isActive: row['Employees.isActive']          // ✅ Boolean type
  }))
}
```

## Client-Side TypeScript

### Type-Safe Hook Usage

```typescript
// Type-safe query hooks
function useEmployeeMetrics(departmentId?: string) {
  const query = useMemo(() => ({
    measures: ['Employees.count', 'Employees.avgSalary'] as const,
    dimensions: ['Employees.departmentName'] as const,
    filters: departmentId ? [{
      member: 'Employees.departmentName' as const,
      operator: 'equals' as const,
      values: [departmentId]
    }] : []
  }), [departmentId])

  return useCubeQuery(query)
}

// Type-safe component with inferred result types
function EmployeeDashboard({ departmentId }: { departmentId?: string }) {
  const { resultSet, isLoading, error } = useEmployeeMetrics(departmentId)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  if (!resultSet) return <div>No data</div>

  // ✅ TypeScript knows the exact shape of rawData()
  const data = resultSet.rawData() // Type inferred from query
  
  return (
    <div>
      {data.map((row, index) => (
        <div key={index}>
          {/* ✅ All properties are type-checked */}
          Department: {row['Employees.departmentName']}
          Count: {row['Employees.count']}
          Avg Salary: ${row['Employees.avgSalary'].toLocaleString()}
        </div>
      ))}
    </div>
  )
}
```

### Chart Component Type Safety

```typescript
// Type-safe chart configuration
interface TypedChartConfig<T extends CubeQuery> {
  xAxis: NonNullable<T['dimensions']>[number][]
  yAxis: NonNullable<T['measures']>[number][]
  series?: NonNullable<T['dimensions']>[number][]
}

interface TypedChartProps<T extends CubeQuery> {
  resultSet: CubeResultSet
  chartConfig: TypedChartConfig<T>
  displayConfig?: DisplayConfig
}

// Generic chart component with type safety
function TypedBarChart<T extends CubeQuery>({
  resultSet,
  chartConfig,
  displayConfig
}: TypedChartProps<T>) {
  // ✅ chartConfig properties are type-checked against query
  // ✅ resultSet data structure is known
  return (
    <RechartsBarChart
      resultSet={resultSet}
      chartConfig={chartConfig}
      displayConfig={displayConfig}
    />
  )
}

// Usage with full type inference
const chartQuery = {
  measures: ['Employees.count'],
  dimensions: ['Employees.departmentName'],
  timeDimensions: []
} as const

function EmployeeChart() {
  const { resultSet } = useCubeQuery(chartQuery)
  
  return (
    <TypedBarChart
      resultSet={resultSet!}
      chartConfig={{
        xAxis: ['Employees.departmentName'], // ✅ Type-checked
        yAxis: ['Employees.count'],          // ✅ Type-checked
        // series: ['Employees.invalidField'] // ❌ Would cause TypeScript error
      }}
    />
  )
}
```

## Advanced Patterns

### Type-Safe Cube Registry

```typescript
// Strongly typed cube registry
class TypedCubeRegistry<TSchema extends Record<string, any>> {
  private cubes = new Map<string, Cube<TSchema>>()

  registerCube<TCube extends Cube<TSchema>>(cube: TCube): void {
    this.cubes.set(cube.name, cube)
  }

  getCube<K extends string>(name: K): Cube<TSchema> | undefined {
    return this.cubes.get(name)
  }

  getAllCubes(): Cube<TSchema>[] {
    return Array.from(this.cubes.values())
  }

  // Type-safe cube field extraction
  getCubeFields(cubeName: string): {
    dimensions: string[]
    measures: string[]
  } {
    const cube = this.getCube(cubeName)
    if (!cube) throw new Error(`Cube ${cubeName} not found`)

    return {
      dimensions: Object.keys(cube.dimensions),
      measures: Object.keys(cube.measures)
    }
  }
}

// Usage
const registry = new TypedCubeRegistry<Schema>()
registry.registerCube(employeesCube)
registry.registerCube(departmentsCube)

// ✅ Type-safe access
const empCube = registry.getCube('Employees')
const fields = registry.getCubeFields('Employees')
```

### Discriminated Unions for Query Types

```typescript
// Different query types with discriminated unions
type MetricQuery = {
  type: 'metric'
  measures: string[]
  dimensions?: never
  timeDimensions?: never
}

type DimensionalQuery = {
  type: 'dimensional'
  measures: string[]
  dimensions: string[]
  timeDimensions?: never
}

type TimeSeriesQuery = {
  type: 'timeSeries'
  measures: string[]
  dimensions?: string[]
  timeDimensions: TimeDimension[]
}

type TypedCubeQuery = MetricQuery | DimensionalQuery | TimeSeriesQuery

// Type-safe query processor
function processQuery(query: TypedCubeQuery): ProcessedQuery {
  switch (query.type) {
    case 'metric':
      // ✅ TypeScript knows dimensions is undefined
      return { ...query, groupBy: [] }
      
    case 'dimensional':
      // ✅ TypeScript knows dimensions exists
      return { ...query, groupBy: query.dimensions }
      
    case 'timeSeries':
      // ✅ TypeScript knows timeDimensions exists
      return { 
        ...query, 
        groupBy: [...(query.dimensions || []), ...query.timeDimensions.map(td => td.dimension)]
      }
  }
}
```

### Type-Safe Error Handling

```typescript
// Typed error classes
abstract class DrizzleCubeError extends Error {
  abstract readonly code: string
  abstract readonly statusCode: number
}

class SecurityContextError extends DrizzleCubeError {
  readonly code = 'SECURITY_CONTEXT_ERROR'
  readonly statusCode = 401
  
  constructor(message: string, public readonly context?: Partial<SecurityContext>) {
    super(message)
  }
}

class QueryValidationError extends DrizzleCubeError {
  readonly code = 'QUERY_VALIDATION_ERROR'
  readonly statusCode = 400
  
  constructor(message: string, public readonly query?: CubeQuery) {
    super(message)
  }
}

class DatabaseExecutionError extends DrizzleCubeError {
  readonly code = 'DATABASE_EXECUTION_ERROR'
  readonly statusCode = 500
  
  constructor(message: string, public readonly sqlError?: Error) {
    super(message)
  }
}

// Type-safe error handling
function handleDrizzleCubeError(error: DrizzleCubeError): ErrorResponse {
  switch (error.code) {
    case 'SECURITY_CONTEXT_ERROR':
      return {
        error: 'Authentication required',
        code: error.code,
        statusCode: error.statusCode
      }
      
    case 'QUERY_VALIDATION_ERROR':
      return {
        error: error.message,
        code: error.code,
        statusCode: error.statusCode,
        query: error.query // ✅ Type-safe access
      }
      
    case 'DATABASE_EXECUTION_ERROR':
      return {
        error: 'Database error occurred',
        code: error.code,
        statusCode: error.statusCode
        // Don't expose internal database errors
      }
      
    default:
      // ✅ TypeScript ensures exhaustive checking
      const _exhaustive: never = error
      throw new Error(`Unhandled error type: ${(_exhaustive as any).code}`)
  }
}
```

## Testing TypeScript

### Type-Safe Test Utilities

```typescript
// Type-safe test data factory
function createTestData<T extends Record<string, any>>(
  schema: T,
  overrides: Partial<InferSelectModel<T[keyof T]>> = {}
): InferInsertModel<T[keyof T]> {
  // Generate test data with proper types
  return {
    id: 1,
    name: 'Test Employee',
    email: 'test@example.com',
    departmentId: 1,
    salary: 50000,
    active: true,
    createdAt: new Date(),
    organisationId: 'test-org',
    ...overrides
  } as InferInsertModel<T[keyof T]>
}

// Type-safe mock security context
function createMockSecurityContext(
  overrides: Partial<SecurityContext> = {}
): SecurityContext {
  return {
    organisationId: 'test-org',
    userId: 'test-user',
    userRole: 'admin',
    ...overrides
  } as SecurityContext
}

// Type-safe test queries
const testQueries = {
  basicCount: {
    measures: ['Employees.count'],
    dimensions: []
  },
  departmentBreakdown: {
    measures: ['Employees.count', 'Employees.avgSalary'],
    dimensions: ['Employees.departmentName']
  }
} as const

// Test with full type safety
describe('TypeScript Integration', () => {
  it('should handle queries with proper types', async () => {
    const query = testQueries.departmentBreakdown
    const context = createMockSecurityContext()
    
    const result = await semanticLayer.load(query, context)
    const data = result.rawData()
    
    // ✅ TypeScript knows exact structure
    expect(data[0]['Employees.count']).toBeTypeOf('number')
    expect(data[0]['Employees.departmentName']).toBeTypeOf('string')
    expect(data[0]['Employees.avgSalary']).toBeTypeOf('number')
  })
})
```

## Best Practices

### 1. Schema-First Development

Always start with your Drizzle schema and let types flow from there:

```typescript
// ✅ Good: Schema drives types
const schema = { users, orders, products }
type Schema = typeof schema

const usersCube: Cube<Schema> = defineCube('Users', {
  sql: (ctx) => ({ from: schema.users, where: /* ... */ })
})
```

### 2. Strict Type Checking

Enable strict TypeScript settings:

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noImplicitThis": true
  }
}
```

### 3. Generic Constraint Usage

Use proper generic constraints for type safety:

```typescript
// ✅ Good: Constrained generics
function createCube<TSchema extends Record<string, any>>(
  name: string,
  config: CubeConfig<TSchema>
): Cube<TSchema> {
  return defineCube(name, config)
}

// ❌ Avoid: Unconstrained any
function createCube(name: string, config: any): any {
  return defineCube(name, config)
}
```

### 4. Type Guards

Use type guards for runtime type safety:

```typescript
function isValidQuery(query: unknown): query is CubeQuery {
  return (
    typeof query === 'object' &&
    query !== null &&
    ('measures' in query || 'dimensions' in query)
  )
}

function isCubeError(error: unknown): error is DrizzleCubeError {
  return error instanceof DrizzleCubeError
}
```

## Next Steps

- Review [Performance](/help/advanced/performance) considerations for TypeScript
- Explore [Troubleshooting](/help/advanced/troubleshooting) type-related issues
- Check out TypeScript examples in the repository
- Set up proper IDE integration for the best development experience

## Roadmap Ideas

- Enhanced type inference for complex queries
- Automatic type generation from cube definitions
- IDE plugins for Drizzle Cube development
- Type-safe schema migration tools
- Runtime type validation utilities
- Advanced generic patterns for cube composition