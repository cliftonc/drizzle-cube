# API Design Specification

This document provides complete API specifications for the `drizzle-cube` module, including all interfaces, methods, and usage patterns.

## Module Exports

The `drizzle-cube` module provides three main export entry points:

```typescript
// Server-side semantic layer
import { SemanticLayerCompiler, defaultSemanticLayer } from 'drizzle-cube/server'

// React client components  
import { AnalyticsPage, CubeProvider } from 'drizzle-cube/client'

// Framework adapters
import { createCubeApp } from 'drizzle-cube/adapters/hono'
```

## Server API (`drizzle-cube/server`)

### Core Classes

#### SemanticLayerCompiler

Main class for managing and executing semantic layer operations.

```typescript
class SemanticLayerCompiler {
  constructor(dbExecutor?: DatabaseExecutor)
  
  // Configuration
  setDatabaseExecutor(executor: DatabaseExecutor): void
  
  // Cube Management
  registerCube(cube: SemanticCube): void
  getCube(name: string): CompiledCube | undefined
  getAllCubes(): CompiledCube[]
  
  // Metadata
  getMetadata(): CubeMetadata[]
}
```

**Usage:**
```typescript
import { SemanticLayerCompiler } from 'drizzle-cube/server'

const dbExecutor = {
  async execute(sql: string, params?: any[]) {
    return await db.execute(sql, params)
  }
}

const semanticLayer = new SemanticLayerCompiler(dbExecutor)
semanticLayer.registerCube(myCube)

const result = await semanticLayer.getCube('MyCube')?.queryFn(query, context)
```

#### SemanticQueryExecutor

Handles SQL generation and query execution.

```typescript
class SemanticQueryExecutor {
  constructor(dbExecutor: DatabaseExecutor)
  
  // Query Execution
  executeQuery(
    cube: SemanticCube, 
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<QueryResult>
  
  // SQL Generation (dry run)
  generateSQL(
    cube: SemanticCube, 
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): SqlResult
}
```

### Core Interfaces

#### SemanticCube

Defines the structure of a data cube.

```typescript
interface SemanticCube {
  name: string                    // Unique identifier
  title?: string                  // Display name
  description?: string            // Documentation
  sql: string | ((context: QueryContext) => SQL | string)
  dimensions: Record<string, SemanticDimension>
  measures: Record<string, SemanticMeasure>
  joins?: Record<string, SemanticJoin>
  public?: boolean               // Visibility in metadata
}
```

**Example:**
```typescript
const employeesCube: SemanticCube = {
  name: 'Employees',
  title: 'Employee Analytics',
  sql: `
    SELECT e.*, d.name as department_name
    FROM employees e
    LEFT JOIN departments d ON e.department = d.id
    WHERE e.organisation = \${SECURITY_CONTEXT.organisation}
  `,
  dimensions: {
    name: {
      name: 'name',
      title: 'Employee Name',
      type: 'string',
      sql: 'name'
    }
  },
  measures: {
    count: {
      name: 'count',
      title: 'Employee Count',
      type: 'count',
      sql: 'id'
    }
  }
}
```

#### SemanticDimension

Defines attributes that can be used for grouping and filtering.

```typescript
interface SemanticDimension {
  name: string
  title?: string
  description?: string
  type: 'string' | 'number' | 'time' | 'boolean'
  sql: string | ((context: QueryContext) => SQL | string)
  primaryKey?: boolean
  shown?: boolean
  format?: DimensionFormat
  meta?: Record<string, any>
}
```

#### SemanticMeasure

Defines aggregated values that can be calculated.

```typescript
interface SemanticMeasure {
  name: string
  title?: string
  description?: string
  type: MeasureType
  sql: string | ((context: QueryContext) => SQL | string)
  format?: MeasureFormat
  filters?: Array<{ sql: string }>
  rollingWindow?: {
    trailing?: string
    leading?: string
    offset?: string
  }
  meta?: Record<string, any>
}

type MeasureType = 
  | 'count' 
  | 'countDistinct' 
  | 'countDistinctApprox' 
  | 'sum' 
  | 'avg' 
  | 'min' 
  | 'max'
  | 'runningTotal'
  | 'number'
```

#### SemanticQuery

Represents a query to be executed against cubes.

```typescript
interface SemanticQuery {
  measures?: string[]             // e.g., ['Employees.count']
  dimensions?: string[]           // e.g., ['Employees.departmentName']
  filters?: Array<{
    member: string                // e.g., 'Employees.active'
    operator: FilterOperator
    values: any[]
  }>
  timeDimensions?: Array<{
    dimension: string             // e.g., 'Employees.startDate'
    granularity?: TimeGranularity // 'day', 'month', 'year'
    dateRange?: string | string[] // ['2024-01-01', '2024-12-31']
  }>
  limit?: number
  offset?: number
  order?: Record<string, 'asc' | 'desc'>
}
```

**Filter Operators:**
```typescript
type FilterOperator = 
  | 'equals' | 'notEquals'
  | 'contains' | 'notContains'
  | 'startsWith' | 'notStartsWith'
  | 'endsWith' | 'notEndsWith'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'set' | 'notSet'
  | 'inDateRange' | 'beforeDate' | 'afterDate'
```

#### SecurityContext

User-defined context passed to all queries.

```typescript
interface SecurityContext {
  [key: string]: any
}

// Example usage in cube SQL:
// WHERE organisation = ${SECURITY_CONTEXT.organisation}
// AND user_id = ${SECURITY_CONTEXT.userId}
```

#### DatabaseExecutor

Interface for pluggable database execution.

```typescript
interface DatabaseExecutor {
  execute(sql: string, params?: any[]): Promise<any[]>
}

// Examples:
const drizzleExecutor: DatabaseExecutor = {
  async execute(sql, params) {
    return await db.execute(sql, params)
  }
}

const postgresExecutor: DatabaseExecutor = {
  async execute(sql, params) {
    const result = await pool.query(sql, params)
    return result.rows
  }
}
```

### Utility Functions

#### SemanticLayerUtils

Helper utilities for building queries.

```typescript
export const SemanticLayerUtils = {
  // Query builder
  query: (cubeName: string) => ({
    measures: (measures: string[]) => ({
      dimensions: (dimensions?: string[]) => ({
        filters: (filters?: any[]) => ({
          limit: (limit?: number) => SemanticQuery
        })
      })
    })
  }),
  
  // Filter helpers
  filters: {
    equals: (member: string, value: any) => Filter,
    contains: (member: string, value: string) => Filter,
    greaterThan: (member: string, value: any) => Filter,
    inDateRange: (member: string, from: string, to: string) => Filter
  },
  
  // Time dimension helpers
  timeDimensions: {
    create: (
      dimension: string, 
      granularity?: TimeGranularity, 
      dateRange?: string | string[]
    ) => TimeDimension
  }
}
```

**Usage:**
```typescript
const query = SemanticLayerUtils
  .query('Employees')
  .measures(['count', 'totalFte'])
  .dimensions(['departmentName'])
  .filters([
    SemanticLayerUtils.filters.equals('active', true),
    SemanticLayerUtils.filters.contains('departmentName', 'Engineering')
  ])
  .limit(100)
```

## Client API (`drizzle-cube/client`)

### Components

#### AnalyticsPage

Main dashboard component for creating and managing analytics dashboards.

```typescript
interface AnalyticsPageProps {
  className?: string
  cubeApi?: CubeApi
  storage?: AnalyticsStorage
  onPageChange?: (pageId: string) => void
  defaultPages?: AnalyticsPageConfig[]
}

function AnalyticsPage(props: AnalyticsPageProps): JSX.Element
```

**Usage:**
```typescript
import { AnalyticsPage, createCubeClient } from 'drizzle-cube/client'

const cubeApi = createCubeClient({
  apiUrl: '/cubejs-api/v1',
  headers: () => ({ Authorization: `Bearer ${token}` })
})

<AnalyticsPage 
  cubeApi={cubeApi}
  onPageChange={(pageId) => console.log('Page changed:', pageId)}
/>
```

#### CubeProvider

React context provider for Cube.js client.

```typescript
interface CubeProviderProps {
  cubeApi: CubeApi
  children: React.ReactNode
}

function CubeProvider(props: CubeProviderProps): JSX.Element
```

### Hooks

#### useCubeQuery

React hook for executing cube queries.

```typescript
function useCubeQuery(
  query: SemanticQuery | null,
  options?: CubeQueryOptions
): {
  resultSet: ResultSet | null
  isLoading: boolean
  error: Error | null
  refetch: () => void
}
```

**Usage:**
```typescript
import { useCubeQuery } from 'drizzle-cube/client'

function MyComponent() {
  const { resultSet, isLoading, error } = useCubeQuery({
    measures: ['Employees.count'],
    dimensions: ['Employees.departmentName']
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return (
    <div>
      {resultSet?.tablePivot().map(row => (
        <div key={row['Employees.departmentName']}>
          {row['Employees.departmentName']}: {row['Employees.count']}
        </div>
      ))}
    </div>
  )
}
```

### Client Configuration

#### createCubeClient

Factory function for creating Cube API client.

```typescript
function createCubeClient(options: {
  apiUrl: string
  headers?: () => Record<string, string>
  timeout?: number
}): CubeApi
```

#### AnalyticsStorage

Interface for persisting dashboard configurations.

```typescript
interface AnalyticsStorage {
  getPages(): Promise<AnalyticsPageConfig[]>
  savePage(page: AnalyticsPageConfig): Promise<void>
  deletePage(pageId: string): Promise<void>
}

// Default localStorage implementation
const defaultStorage: AnalyticsStorage = {
  async getPages() {
    const saved = localStorage.getItem('drizzle-cube-pages')
    return saved ? JSON.parse(saved) : []
  },
  async savePage(page) {
    const pages = await this.getPages()
    const existing = pages.findIndex(p => p.id === page.id)
    if (existing >= 0) {
      pages[existing] = page
    } else {
      pages.push(page)
    }
    localStorage.setItem('drizzle-cube-pages', JSON.stringify(pages))
  },
  async deletePage(pageId) {
    const pages = await this.getPages()
    const filtered = pages.filter(p => p.id !== pageId)
    localStorage.setItem('drizzle-cube-pages', JSON.stringify(filtered))
  }
}
```

## Adapter API (`drizzle-cube/adapters/hono`)

### Main Functions

#### createCubeApp

Creates a complete Hono app with Cube.js routes.

```typescript
function createCubeApp(options: HonoAdapterOptions): Hono

interface HonoAdapterOptions {
  semanticLayer: SemanticLayerCompiler
  getSecurityContext: (c: HonoContext) => SecurityContext | Promise<SecurityContext>
  databaseExecutor?: DatabaseExecutor
  cors?: CorsConfig
  basePath?: string
}
```

#### createCubeRoutes

Creates Cube.js routes without a full app.

```typescript
function createCubeRoutes(options: HonoAdapterOptions): Hono
```

#### mountCubeRoutes

Mounts Cube.js routes on existing Hono app.

```typescript
function mountCubeRoutes(app: Hono, options: HonoAdapterOptions): Hono
```

### API Endpoints

The adapter provides three Cube.js-compatible endpoints:

#### POST/GET `/cubejs-api/v1/load`

Execute queries and return data.

**Request:**
```typescript
{
  measures?: string[]
  dimensions?: string[]
  filters?: Filter[]
  timeDimensions?: TimeDimension[]
  limit?: number
  order?: Record<string, 'asc' | 'desc'>
}
```

**Response:**
```typescript
{
  data: any[]
  annotation: {
    measures: Record<string, MeasureAnnotation>
    dimensions: Record<string, DimensionAnnotation>
    timeDimensions: Record<string, TimeDimensionAnnotation>
  }
  query: SemanticQuery
  slowQuery: boolean
}
```

#### GET `/cubejs-api/v1/meta`

Get cube metadata.

**Response:**
```typescript
{
  cubes: Array<{
    name: string
    title: string
    description?: string
    measures: MeasureMetadata[]
    dimensions: DimensionMetadata[]
    segments: any[]
  }>
}
```

#### POST/GET `/cubejs-api/v1/sql`

Generate SQL without execution.

**Response:**
```typescript
{
  sql: string
  params: any[]
  query: SemanticQuery
}
```

## Error Handling

### Server Errors

```typescript
// Cube not found
{
  error: "Cube 'CubeName' not found",
  status: 404
}

// Invalid query
{
  error: "Query must specify at least one measure or dimension",
  status: 400
}

// Database error
{
  error: "Query execution failed: <detailed message>",
  status: 500
}

// Security context error
{
  error: "No authorization header",
  status: 401
}
```

### Client Errors

```typescript
// Hook error handling
const { resultSet, isLoading, error } = useCubeQuery(query)

if (error) {
  // error.message contains user-friendly message
  // error.stack contains full stack trace (development)
}
```

## TypeScript Support

### Full Type Inference

```typescript
// Cube definition with full type safety
const myCube: SemanticCube = {
  name: 'MyCube',
  sql: 'SELECT * FROM my_table',
  dimensions: {
    id: {
      name: 'id',
      type: 'string',
      sql: 'id'
    }
  },
  measures: {
    count: {
      name: 'count',
      type: 'count',
      sql: 'id'
    }
  }
}

// Query with auto-completion
const query: SemanticQuery = {
  measures: ['MyCube.count'],      // Auto-completed
  dimensions: ['MyCube.id']        // Auto-completed
}
```

### Generic Database Executor

```typescript
interface DatabaseExecutor<T = any[]> {
  execute(sql: string, params?: any[]): Promise<T>
}

// Custom executor with typed results
class TypedExecutor implements DatabaseExecutor<MyRowType[]> {
  async execute(sql: string, params?: any[]): Promise<MyRowType[]> {
    // Implementation
  }
}
```

## Configuration Examples

### Complete Server Setup

```typescript
import { SemanticLayerCompiler, employeesCube } from 'drizzle-cube/server'
import { createCubeApp } from 'drizzle-cube/adapters/hono'

// Database executor
const dbExecutor = {
  async execute(sql: string, params?: any[]) {
    return await db.execute(sql, params)
  }
}

// Semantic layer
const semanticLayer = new SemanticLayerCompiler(dbExecutor)
semanticLayer.registerCube(employeesCube)

// Hono app
const app = createCubeApp({
  semanticLayer,
  getSecurityContext: async (c) => ({
    organisation: c.get('session').organisation.id,
    userId: c.get('session').user.id
  }),
  cors: {
    origin: ['http://localhost:3000'],
    credentials: true
  }
})

export default app
```

### Complete Client Setup

```typescript
import { AnalyticsPage, createCubeClient } from 'drizzle-cube/client'

// Cube client
const cubeApi = createCubeClient({
  apiUrl: '/cubejs-api/v1',
  headers: () => ({
    Authorization: `Bearer ${getAuthToken()}`
  })
})

// Custom storage
const dbStorage = {
  async getPages() {
    const response = await fetch('/api/analytics-pages')
    return response.json()
  },
  async savePage(page) {
    await fetch('/api/analytics-pages', {
      method: 'POST',
      body: JSON.stringify(page)
    })
  },
  async deletePage(pageId) {
    await fetch(`/api/analytics-pages/${pageId}`, {
      method: 'DELETE'
    })
  }
}

// Component
function App() {
  return (
    <AnalyticsPage 
      cubeApi={cubeApi}
      storage={dbStorage}
      className="min-h-screen"
    />
  )
}
```

This comprehensive API design ensures that the `drizzle-cube` module provides a clean, type-safe, and flexible interface for both server-side semantic layer operations and client-side analytics dashboard functionality.