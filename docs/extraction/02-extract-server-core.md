# Phase 2: Extract Server Core

**Objective**: Extract the semantic layer from Fintune into a framework-agnostic server module.

**Duration**: 4-6 hours  
**Prerequisites**: Phase 1 completed successfully

## Overview

We'll extract the semantic layer from `/src/server-libs/semantic-layer/` and convert it into a standalone, framework-agnostic module that can work with any web framework.

## Step 1: Copy Core Files

Copy these files from the Fintune project to your drizzle-cube module:

```bash
# From Fintune project root, copy to drizzle-cube/src/server/
cp src/server-libs/semantic-layer/compiler.ts [drizzle-cube]/src/server/
cp src/server-libs/semantic-layer/executor.ts [drizzle-cube]/src/server/
cp src/server-libs/semantic-layer/join-resolver.ts [drizzle-cube]/src/server/
cp src/server-libs/semantic-layer/yaml-loader.ts [drizzle-cube]/src/server/
cp src/server-libs/semantic-layer/yaml-types.ts [drizzle-cube]/src/server/
cp src/server-libs/semantic-layer/examples.ts [drizzle-cube]/src/server/

# Copy the types file but we'll modify it significantly
cp src/server-libs/semantic-layer/types.ts [drizzle-cube]/src/server/
```

**Note**: Do NOT copy `index.ts` - we'll create a new one. Do NOT copy the `/cubes/` folder - we'll create example cubes instead.

## Step 2: Update types.ts

Replace the content of `src/server/types.ts` with this framework-agnostic version:

```typescript
/**
 * Core types for Drizzle Cube semantic layer
 * Framework-agnostic definitions
 */

export interface SecurityContext {
  [key: string]: any
}

export interface DatabaseExecutor {
  execute(sql: string, params?: any[]): Promise<any[]>
}

export interface SemanticCube {
  name: string
  title?: string
  description?: string
  sql: string | ((context: QueryContext) => SQL | string)
  dimensions: Record<string, SemanticDimension>
  measures: Record<string, SemanticMeasure>
  joins?: Record<string, SemanticJoin>
  public?: boolean
}

export interface SemanticDimension {
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

export interface SemanticMeasure {
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

export interface SemanticJoin {
  sql: string
  relationship: 'belongsTo' | 'hasOne' | 'hasMany'
}

export type MeasureType = 
  | 'count' 
  | 'countDistinct' 
  | 'countDistinctApprox' 
  | 'sum' 
  | 'avg' 
  | 'min' 
  | 'max'
  | 'runningTotal'
  | 'number'

export type MeasureFormat = 'currency' | 'percent' | 'number' | 'integer'
export type DimensionFormat = 'currency' | 'percent' | 'number' | 'date' | 'datetime'
export type TimeGranularity = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'

export interface SemanticQuery {
  measures?: string[]
  dimensions?: string[]
  filters?: Array<{
    member: string
    operator: FilterOperator
    values: any[]
  }>
  timeDimensions?: Array<{
    dimension: string
    granularity?: TimeGranularity
    dateRange?: string | string[]
  }>
  limit?: number
  offset?: number
  order?: Record<string, 'asc' | 'desc'>
}

export type FilterOperator = 
  | 'equals' 
  | 'notEquals' 
  | 'contains' 
  | 'notContains'
  | 'startsWith'
  | 'notStartsWith'
  | 'endsWith'
  | 'notEndsWith'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'set'
  | 'notSet'
  | 'inDateRange'
  | 'beforeDate'
  | 'afterDate'

export interface QueryContext {
  securityContext: SecurityContext
  cube: CompiledCube
  query: SemanticQuery
  table: {
    [column: string]: string
  }
}

export interface CompiledCube extends SemanticCube {
  queryFn: (query: SemanticQuery, context: SecurityContext) => Promise<QueryResult>
}

export interface QueryResult {
  data: any[]
  annotation: {
    measures: Record<string, MeasureAnnotation>
    dimensions: Record<string, DimensionAnnotation>
    segments: Record<string, any>
    timeDimensions: Record<string, TimeDimensionAnnotation>
  }
}

export interface MeasureAnnotation {
  title: string
  shortTitle: string
  type: MeasureType
  format?: MeasureFormat
}

export interface DimensionAnnotation {
  title: string
  shortTitle: string
  type: string
  format?: DimensionFormat
}

export interface TimeDimensionAnnotation {
  title: string
  shortTitle: string
  type: string
  granularity?: TimeGranularity
}

export interface SqlResult {
  sql: string
  params?: any[]
}

export interface CubeMetadata {
  name: string
  title: string
  description?: string
  measures: MeasureMetadata[]
  dimensions: DimensionMetadata[]
  segments: any[]
}

export interface MeasureMetadata {
  name: string
  title: string
  shortTitle: string
  type: MeasureType
  format?: MeasureFormat
  description?: string
}

export interface DimensionMetadata {
  name: string
  title: string
  shortTitle: string
  type: string
  format?: DimensionFormat
  description?: string
}

// Helper type for SQL template literals (if using drizzle)
export interface SQL {
  sql: string
  params?: any[]
}
```

## Step 3: Update compiler.ts

Open `src/server/compiler.ts` and make these changes:

1. **Update imports** at the top:

```typescript
import type { 
  SemanticCube, 
  CompiledCube, 
  SemanticQuery, 
  QueryResult, 
  SecurityContext,
  DatabaseExecutor,
  CubeMetadata,
  MeasureMetadata,
  DimensionMetadata,
  QueryContext,
  SQL
} from './types'
import { SemanticQueryExecutor } from './executor'
```

2. **Replace the SemanticLayerCompiler class** with this framework-agnostic version:

```typescript
export class SemanticLayerCompiler {
  private cubes: Map<string, CompiledCube> = new Map()
  private dbExecutor?: DatabaseExecutor

  constructor(dbExecutor?: DatabaseExecutor) {
    this.dbExecutor = dbExecutor
  }

  setDatabaseExecutor(executor: DatabaseExecutor): void {
    this.dbExecutor = executor
  }

  registerCube(cube: SemanticCube): void {
    // Validate cube definition
    this.validateCube(cube)

    // Compile the cube
    const compiledCube = this.compileCube(cube)
    
    this.cubes.set(cube.name, compiledCube)
  }

  getCube(name: string): CompiledCube | undefined {
    return this.cubes.get(name)
  }

  getAllCubes(): CompiledCube[] {
    return Array.from(this.cubes.values())
  }

  getMetadata(): CubeMetadata[] {
    return Array.from(this.cubes.values()).map(cube => this.generateCubeMetadata(cube))
  }

  private validateCube(cube: SemanticCube): void {
    if (!cube.name) {
      throw new Error('Cube must have a name')
    }
    if (!cube.sql) {
      throw new Error(`Cube ${cube.name} must have SQL definition`)
    }
    if (!cube.measures || Object.keys(cube.measures).length === 0) {
      throw new Error(`Cube ${cube.name} must have at least one measure`)
    }
    // Add more validation as needed
  }

  private compileCube(cube: SemanticCube): CompiledCube {
    const queryFn = async (query: SemanticQuery, securityContext: SecurityContext): Promise<QueryResult> => {
      if (!this.dbExecutor) {
        throw new Error('Database executor not configured. Call setDatabaseExecutor() first.')
      }

      const executor = new SemanticQueryExecutor(this.dbExecutor)
      return executor.executeQuery(cube, query, securityContext)
    }

    return {
      ...cube,
      queryFn
    }
  }

  private generateCubeMetadata(cube: CompiledCube): CubeMetadata {
    const measures: MeasureMetadata[] = Object.entries(cube.measures).map(([key, measure]) => ({
      name: `${cube.name}.${key}`,
      title: measure.title || key,
      shortTitle: measure.title || key,
      type: measure.type,
      format: measure.format,
      description: measure.description
    }))

    const dimensions: DimensionMetadata[] = Object.entries(cube.dimensions).map(([key, dimension]) => ({
      name: `${cube.name}.${key}`,
      title: dimension.title || key,
      shortTitle: dimension.title || key,
      type: dimension.type,
      format: dimension.format,
      description: dimension.description
    }))

    return {
      name: cube.name,
      title: cube.title || cube.name,
      description: cube.description,
      measures,
      dimensions,
      segments: [] // Add segments support later if needed
    }
  }
}

// Export singleton instance
export const semanticLayer = new SemanticLayerCompiler()
```

## Step 4: Update executor.ts

Open `src/server/executor.ts` and make these changes:

1. **Update imports**:

```typescript
import type { 
  SemanticCube, 
  SemanticQuery, 
  QueryResult, 
  SecurityContext,
  DatabaseExecutor,
  FilterOperator,
  TimeGranularity,
  QueryContext,
  SQL,
  MeasureAnnotation,
  DimensionAnnotation,
  TimeDimensionAnnotation
} from './types'
```

2. **Replace the class constructor and database references**:

```typescript
export class SemanticQueryExecutor {
  constructor(private dbExecutor: DatabaseExecutor) {}

  async executeQuery(
    cube: SemanticCube, 
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): Promise<QueryResult> {
    try {
      // Generate SQL
      const sqlResult = this.generateSQL(cube, query, securityContext)
      
      // Execute query
      const data = await this.dbExecutor.execute(sqlResult.sql, sqlResult.params)
      
      // Generate annotations
      const annotation = this.generateAnnotations(cube, query)
      
      return {
        data,
        annotation
      }
    } catch (error) {
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  generateSQL(
    cube: SemanticCube, 
    query: SemanticQuery, 
    securityContext: SecurityContext
  ): { sql: string; params?: any[] } {
    // ... rest of the SQL generation logic stays the same
    // but replace any database-specific calls with generic SQL
  }

  // ... rest of the methods stay mostly the same
  // Remove any database-specific imports or calls
}
```

3. **Find and replace** these patterns throughout the file:

- Replace `c.get('db')` with `this.dbExecutor`
- Remove any Hono context (`c`) references
- Replace Drizzle-specific SQL calls with generic SQL strings
- Replace `${SECURITY_CONTEXT.organisation}` with variable substitution

4. **Update the variable substitution** in the `substituteSecurityVariables` method:

```typescript
private substituteSecurityVariables(sqlTemplate: string, securityContext: SecurityContext): string {
  let sql = sqlTemplate
  
  // Replace security context variables
  Object.entries(securityContext).forEach(([key, value]) => {
    const placeholder = `\${SECURITY_CONTEXT.${key}}`
    sql = sql.replaceAll(placeholder, `'${value}'`)
  })
  
  return sql
}
```

## Step 5: Create New index.ts

Create a new `src/server/index.ts`:

```typescript
/**
 * Drizzle Cube - Semantic Layer for Drizzle ORM
 * Framework-agnostic semantic layer with Cube.js compatibility
 */

// Export main classes
export { SemanticLayerCompiler, semanticLayer } from './compiler'
export { SemanticQueryExecutor } from './executor'

// Export all types
export type {
  // Core interfaces
  SemanticCube,
  SemanticDimension,
  SemanticMeasure,
  SemanticJoin,
  SemanticQuery,
  SecurityContext,
  DatabaseExecutor,
  
  // Query types
  QueryContext,
  QueryResult,
  SqlResult,
  
  // Metadata types  
  CubeMetadata,
  MeasureMetadata,
  DimensionMetadata,
  
  // Annotation types
  MeasureAnnotation,
  DimensionAnnotation,
  TimeDimensionAnnotation,
  
  // Enum types
  MeasureType,
  MeasureFormat,
  DimensionFormat,
  TimeGranularity,
  FilterOperator,
  
  // Compiled types
  CompiledCube,
  
  // SQL helper
  SQL
} from './types'

// Export utilities
export { loadYamlCubesFromFile } from './yaml-loader'

// Re-export examples for documentation
export * from './examples'

/**
 * Main semantic layer instance
 * Use this for simple single-instance usage
 */
export const defaultSemanticLayer = semanticLayer

/**
 * Create a new semantic layer instance
 * Use this when you need multiple isolated instances
 */
export function createSemanticLayer(dbExecutor?: DatabaseExecutor) {
  return new SemanticLayerCompiler(dbExecutor)
}

/**
 * Utility functions for working with the semantic layer
 */
export const SemanticLayerUtils = {
  /**
   * Create a simple query builder
   */
  query: (cubeName: string) => {
    const createQuery = (
      measures: string[], 
      dimensions: string[] = [],
      filters: any[] = [],
      timeDimensions: any[] = [],
      limit?: number,
      order?: Record<string, 'asc' | 'desc'>
    ) => ({
      measures,
      dimensions,
      filters,
      timeDimensions,
      limit,
      order
    })

    return {
      measures: (measures: string[]) => ({
        dimensions: (dimensions: string[] = []) => ({
          filters: (filters: any[] = []) => ({
            timeDimensions: (timeDimensions: any[] = []) => ({
              limit: (limit?: number) => ({
                order: (order?: Record<string, 'asc' | 'desc'>) => 
                  createQuery(measures, dimensions, filters, timeDimensions, limit, order)
              }),
              order: (order?: Record<string, 'asc' | 'desc'>) => 
                createQuery(measures, dimensions, filters, timeDimensions, undefined, order)
            }),
            limit: (limit?: number) => ({
              order: (order?: Record<string, 'asc' | 'desc'>) => 
                createQuery(measures, dimensions, filters, [], limit, order)
            }),
            order: (order?: Record<string, 'asc' | 'desc'>) => 
              createQuery(measures, dimensions, filters, [], undefined, order)
          }),
          timeDimensions: (timeDimensions: any[] = []) => ({
            filters: (filters: any[] = []) => ({
              limit: (limit?: number) => ({
                order: (order?: Record<string, 'asc' | 'desc'>) => 
                  createQuery(measures, dimensions, filters, timeDimensions, limit, order)
              }),
              order: (order?: Record<string, 'asc' | 'desc'>) => 
                createQuery(measures, dimensions, filters, timeDimensions, undefined, order)
            }),
            limit: (limit?: number) => ({
              order: (order?: Record<string, 'asc' | 'desc'>) => 
                createQuery(measures, dimensions, [], timeDimensions, limit, order)
            }),
            order: (order?: Record<string, 'asc' | 'desc'>) => 
              createQuery(measures, dimensions, [], timeDimensions, undefined, order)
          }),
          limit: (limit?: number) => ({
            order: (order?: Record<string, 'asc' | 'desc'>) => 
              createQuery(measures, dimensions, [], [], limit, order)
          }),
          order: (order?: Record<string, 'asc' | 'desc'>) => 
            createQuery(measures, dimensions, [], [], undefined, order)
        }),
        filters: (filters: any[] = []) => ({
          dimensions: (dimensions: string[] = []) => ({
            timeDimensions: (timeDimensions: any[] = []) => ({
              limit: (limit?: number) => ({
                order: (order?: Record<string, 'asc' | 'desc'>) => 
                  createQuery(measures, dimensions, filters, timeDimensions, limit, order)
              }),
              order: (order?: Record<string, 'asc' | 'desc'>) => 
                createQuery(measures, dimensions, filters, timeDimensions, undefined, order)
            }),
            limit: (limit?: number) => ({
              order: (order?: Record<string, 'asc' | 'desc'>) => 
                createQuery(measures, dimensions, filters, [], limit, order)
            }),
            order: (order?: Record<string, 'asc' | 'desc'>) => 
              createQuery(measures, dimensions, filters, [], undefined, order)
          }),
          timeDimensions: (timeDimensions: any[] = []) => ({
            dimensions: (dimensions: string[] = []) => ({
              limit: (limit?: number) => ({
                order: (order?: Record<string, 'asc' | 'desc'>) => 
                  createQuery(measures, dimensions, filters, timeDimensions, limit, order)
              }),
              order: (order?: Record<string, 'asc' | 'desc'>) => 
                createQuery(measures, dimensions, filters, timeDimensions, undefined, order)
            }),
            limit: (limit?: number) => ({
              order: (order?: Record<string, 'asc' | 'desc'>) => 
                createQuery(measures, [], filters, timeDimensions, limit, order)
            }),
            order: (order?: Record<string, 'asc' | 'desc'>) => 
              createQuery(measures, [], filters, timeDimensions, undefined, order)
          }),
          limit: (limit?: number) => ({
            order: (order?: Record<string, 'asc' | 'desc'>) => 
              createQuery(measures, [], filters, [], limit, order)
          }),
          order: (order?: Record<string, 'asc' | 'desc'>) => 
            createQuery(measures, [], filters, [], undefined, order)
        })
      })
    }
  },

  /**
   * Create filters
   */
  filters: {
    equals: (member: string, value: any) => ({ member, operator: 'equals' as const, values: [value] }),
    notEquals: (member: string, value: any) => ({ member, operator: 'notEquals' as const, values: [value] }),
    contains: (member: string, value: string) => ({ member, operator: 'contains' as const, values: [value] }),
    greaterThan: (member: string, value: any) => ({ member, operator: 'gt' as const, values: [value] }),
    lessThan: (member: string, value: any) => ({ member, operator: 'lt' as const, values: [value] }),
    inDateRange: (member: string, from: string, to: string) => ({ 
      member, 
      operator: 'inDateRange' as const, 
      values: [from, to] 
    }),
    set: (member: string) => ({ member, operator: 'set' as const, values: [] }),
    notSet: (member: string) => ({ member, operator: 'notSet' as const, values: [] })
  },

  /**
   * Create time dimensions
   */
  timeDimensions: {
    create: (dimension: string, granularity?: TimeGranularity, dateRange?: string | string[]) => ({
      dimension,
      granularity,
      dateRange
    })
  }
}
```

## Step 6: Create Example Cubes

Create `src/server/example-cubes.ts`:

```typescript
import type { SemanticCube } from './types'

/**
 * Example cube definitions for documentation and testing
 * These show the basic patterns for defining cubes
 */

export const employeesCube: SemanticCube = {
  name: 'Employees',
  title: 'Employee Analytics',
  description: 'Employee data for workforce analysis',
  sql: `
    SELECT 
      e.id,
      e.name,
      e.email,
      e.active,
      e.fte_basis,
      e.start_date,
      e.end_date,
      d.name as department_name,
      s.name as supplier_name,
      s.internal as supplier_internal
    FROM employees e
    LEFT JOIN departments d ON e.department = d.id
    LEFT JOIN suppliers s ON e.supplier = s.id
    WHERE e.organisation = \${SECURITY_CONTEXT.organisation}
  `,
  
  dimensions: {
    id: {
      name: 'id',
      title: 'Employee ID',
      type: 'string',
      sql: 'id',
      primaryKey: true
    },
    name: {
      name: 'name',
      title: 'Employee Name',
      type: 'string',
      sql: 'name'
    },
    email: {
      name: 'email',
      title: 'Email',
      type: 'string',
      sql: 'email'
    },
    active: {
      name: 'active',
      title: 'Active Status',
      type: 'boolean',
      sql: 'active'
    },
    departmentName: {
      name: 'departmentName',
      title: 'Department',
      type: 'string',
      sql: 'department_name'
    },
    supplierName: {
      name: 'supplierName',
      title: 'Supplier',
      type: 'string',
      sql: 'supplier_name'
    },
    supplierType: {
      name: 'supplierType',
      title: 'Supplier Type',
      type: 'string',
      sql: "CASE WHEN supplier_internal THEN 'Internal' ELSE 'External' END"
    },
    startDate: {
      name: 'startDate',
      title: 'Start Date',
      type: 'time',
      sql: 'start_date'
    }
  },
  
  measures: {
    count: {
      name: 'count',
      title: 'Employee Count',
      type: 'count',
      sql: 'id'
    },
    activeCount: {
      name: 'activeCount',
      title: 'Active Employees',
      type: 'count',
      sql: 'id',
      filters: [{ sql: 'active = true' }]
    },
    totalFte: {
      name: 'totalFte',
      title: 'Total FTE',
      type: 'sum',
      sql: 'fte_basis',
      format: 'number'
    },
    averageFte: {
      name: 'averageFte',
      title: 'Average FTE',
      type: 'avg',
      sql: 'fte_basis',
      format: 'number'
    }
  }
}

export const departmentsCube: SemanticCube = {
  name: 'Departments',
  title: 'Department Analytics',
  description: 'Organizational department data',
  sql: `
    SELECT 
      d.id,
      d.name,
      d.description,
      COUNT(e.id) as employee_count
    FROM departments d
    LEFT JOIN employees e ON d.id = e.department AND e.active = true
    WHERE d.organisation = \${SECURITY_CONTEXT.organisation}
    GROUP BY d.id, d.name, d.description
  `,
  
  dimensions: {
    id: {
      name: 'id',
      title: 'Department ID',
      type: 'string',
      sql: 'id',
      primaryKey: true
    },
    name: {
      name: 'name',
      title: 'Department Name',
      type: 'string',
      sql: 'name'
    },
    description: {
      name: 'description',
      title: 'Description',
      type: 'string',
      sql: 'description'
    }
  },
  
  measures: {
    count: {
      name: 'count',
      title: 'Department Count',
      type: 'count',
      sql: 'id'
    },
    employeeCount: {
      name: 'employeeCount',
      title: 'Employee Count',
      type: 'sum',
      sql: 'employee_count'
    }
  }
}

// Example showing joins between cubes
export const employeeDepartmentsCube: SemanticCube = {
  name: 'EmployeeDepartments',
  title: 'Employee Department Analysis',
  description: 'Combined employee and department analytics',
  sql: `
    SELECT 
      e.id as employee_id,
      e.name as employee_name,
      e.active,
      e.fte_basis,
      d.id as department_id,
      d.name as department_name
    FROM employees e
    LEFT JOIN departments d ON e.department = d.id
    WHERE e.organisation = \${SECURITY_CONTEXT.organisation}
  `,
  
  dimensions: {
    employeeName: {
      name: 'employeeName',
      title: 'Employee Name',
      type: 'string',
      sql: 'employee_name'
    },
    departmentName: {
      name: 'departmentName',
      title: 'Department Name',
      type: 'string',
      sql: 'department_name'
    },
    active: {
      name: 'active',
      title: 'Active',
      type: 'boolean',
      sql: 'active'
    }
  },
  
  measures: {
    employeeCount: {
      name: 'employeeCount',
      title: 'Employee Count',
      type: 'count',
      sql: 'employee_id'
    },
    activeEmployeeCount: {
      name: 'activeEmployeeCount',
      title: 'Active Employee Count',
      type: 'count',
      sql: 'employee_id',
      filters: [{ sql: 'active = true' }]
    },
    totalFte: {
      name: 'totalFte',
      title: 'Total FTE',
      type: 'sum',
      sql: 'fte_basis'
    }
  }
}

export const exampleCubes = [
  employeesCube,
  departmentsCube,
  employeeDepartmentsCube
]
```

## Step 7: Update Other Files

1. **Update yaml-loader.ts**: Remove any Hono/framework dependencies
2. **Update join-resolver.ts**: Make it work with generic SQL
3. **Update examples.ts**: Use the new API

## Step 8: Test the Build

Run the build to verify everything compiles:

```bash
npm run build:server
```

## Step 9: Create Simple Test

Create `tests/server.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { SemanticLayerCompiler, employeesCube } from '../src/server'

// Mock database executor for testing
const mockDbExecutor = {
  async execute(sql: string, params?: any[]) {
    return [
      { id: '1', name: 'John Doe', department_name: 'Engineering', active: true, fte_basis: 1.0 },
      { id: '2', name: 'Jane Smith', department_name: 'Marketing', active: true, fte_basis: 0.8 }
    ]
  }
}

describe('Semantic Layer Server', () => {
  it('should create and register cubes', () => {
    const compiler = new SemanticLayerCompiler(mockDbExecutor)
    compiler.registerCube(employeesCube)
    
    const cube = compiler.getCube('Employees')
    expect(cube).toBeDefined()
    expect(cube?.name).toBe('Employees')
  })

  it('should generate metadata', () => {
    const compiler = new SemanticLayerCompiler(mockDbExecutor)
    compiler.registerCube(employeesCube)
    
    const metadata = compiler.getMetadata()
    expect(metadata).toHaveLength(1)
    expect(metadata[0].name).toBe('Employees')
  })

  it('should execute queries', async () => {
    const compiler = new SemanticLayerCompiler(mockDbExecutor)
    compiler.registerCube(employeesCube)
    
    const cube = compiler.getCube('Employees')
    const result = await cube?.queryFn(
      { measures: ['count'], dimensions: ['departmentName'] },
      { organisation: 'test-org' }
    )
    
    expect(result).toBeDefined()
    expect(result?.data).toHaveLength(2)
  })
})
```

Run the test:

```bash
npm test
```

## ✅ Checkpoint

You should now have:
- [ ] Framework-agnostic semantic layer core
- [ ] All files compile without errors
- [ ] Tests pass
- [ ] Example cubes that demonstrate the API
- [ ] Security context is completely configurable
- [ ] No dependencies on Hono or any specific framework

**Common issues**:
- **Import errors**: Verify all import paths are correct
- **Type errors**: Make sure TypeScript is configured properly
- **Build errors**: Check that all dependencies are framework-agnostic

---

**Next Step**: Proceed to [03-create-adapters.md](./03-create-adapters.md)