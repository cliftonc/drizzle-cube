# Cubes

Cubes are the core building blocks of Drizzle Cube's semantic layer. A cube defines a logical data model that combines SQL queries with dimensions and measures, providing a type-safe interface for analytics queries.

## Overview

Cubes in Drizzle Cube are **Drizzle ORM-first**, meaning they leverage Drizzle's query builder for type safety and SQL injection prevention. Each cube represents a dataset that can be queried through dimensions (categorical data) and measures (metrics and aggregations).

## Basic Cube Structure

```typescript
import { eq } from 'drizzle-orm'
import { defineCube } from 'drizzle-cube/server'
import type { QueryContext, BaseQueryDefinition, Cube } from 'drizzle-cube/server'
import { employees, departments } from './schema'

export const employeesCube: Cube<Schema> = defineCube('Employees', {
  title: 'Employee Analytics',
  description: 'Employee data and metrics',
  
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: employees,
    where: eq(employees.organisationId, ctx.securityContext.organisationId)
  }),
  
  dimensions: {
    // Categorical data fields
  },
  
  measures: {
    // Metrics and aggregations
  }
})
```

## Core Concepts

### Cube Definition Function

The `defineCube()` function creates a type-safe cube definition with the following signature:

```typescript
defineCube(name: string, config: CubeConfig): Cube
```

- **name**: Unique identifier for the cube
- **config**: Configuration object containing SQL, dimensions, measures, and joins

### SQL Function

The `sql` property defines the base query for the cube using Drizzle's query builder:

```typescript
sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
  from: employees,
  joins: [
    {
      table: departments,
      on: and(
        eq(employees.departmentId, departments.id),
        eq(departments.organisationId, ctx.securityContext.organisationId)
      ),
      type: 'left'
    }
  ],
  where: eq(employees.organisationId, ctx.securityContext.organisationId)
})
```

**Key Features:**
- **Type Safety**: Uses Drizzle schema types
- **Security Context**: Automatic tenant filtering
- **Join Support**: Define table relationships
- **SQL Injection Prevention**: Parameterized queries only

## Complete Example

Here's a comprehensive cube example with all major features:

```typescript
export const productivityCube: Cube<Schema> = defineCube('Productivity', {
  title: 'Productivity Analytics',
  description: 'Daily productivity metrics including code output and deployments',
  
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
    from: productivity,
    joins: [
      {
        table: employees,
        on: and(
          eq(productivity.employeeId, employees.id),
          eq(employees.organisationId, ctx.securityContext.organisationId)
        ),
        type: 'left'
      }
    ],
    where: eq(productivity.organisationId, ctx.securityContext.organisationId)
  }),

  // Cross-cube joins for multi-cube queries
  joins: {
    Employees: {
      targetCube: () => employeesCube,
      relationship: 'belongsTo',
      on: [
        { source: productivity.employeeId, target: employees.id }
      ]
    }
  },
  
  dimensions: {
    date: {
      name: 'date',
      title: 'Date',
      type: 'time',
      sql: productivity.date
    },
    happinessLevel: {
      name: 'happinessLevel',
      title: 'Happiness Level',
      type: 'string',
      sql: sql`
        CASE 
          WHEN ${productivity.happinessIndex} >= 8 THEN 'High'
          WHEN ${productivity.happinessIndex} >= 6 THEN 'Medium'
          ELSE 'Low'
        END
      `
    }
  },
  
  measures: {
    recordCount: {
      name: 'recordCount',
      title: 'Total Records',
      type: 'count',
      sql: productivity.id
    },
    avgHappinessIndex: {
      name: 'avgHappinessIndex',
      title: 'Average Happiness',
      type: 'avg',
      sql: productivity.happinessIndex
    },
    productivityScore: {
      name: 'productivityScore',
      title: 'Productivity Score',
      type: 'avg',
      sql: sql`(${productivity.linesOfCode} + ${productivity.pullRequests} * 50 + ${productivity.liveDeployments} * 100)`,
      description: 'Composite score based on code output, reviews, and deployments'
    }
  }
})
```

## Security Context Integration

Every cube **must** include security context filtering to ensure multi-tenant security:

```typescript
sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
  from: employees,
  // REQUIRED: Filter by organisation/tenant
  where: eq(employees.organisationId, ctx.securityContext.organisationId)
})
```

**Security Best Practices:**
- Always filter by tenant/organisation ID
- Apply security context to all joined tables
- Use parameterized queries (automatic with Drizzle)
- Never construct SQL strings manually

## Advanced Features

### Complex SQL with CTEs

```typescript
sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
  with: {
    activeEmployees: ctx.db
      .select()
      .from(employees)
      .where(and(
        eq(employees.active, true),
        eq(employees.organisationId, ctx.securityContext.organisationId)
      ))
  },
  from: sql`activeEmployees`,
  where: sql`true` // Additional filtering can be applied
})
```

### Dynamic Filtering with Context

```typescript
sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => {
  const baseWhere = eq(employees.organisationId, ctx.securityContext.organisationId)
  
  // Add conditional filters based on security context
  const additionalFilters = []
  if (ctx.securityContext.departmentId) {
    additionalFilters.push(eq(employees.departmentId, ctx.securityContext.departmentId))
  }
  
  return {
    from: employees,
    where: additionalFilters.length > 0 
      ? and(baseWhere, ...additionalFilters)
      : baseWhere
  }
}
```

## Cube Registration

Register cubes with the semantic layer compiler:

```typescript
import { SemanticLayerCompiler, createDatabaseExecutor } from 'drizzle-cube/server'

const executor = createDatabaseExecutor(db, schema, 'postgres')
const semanticLayer = new SemanticLayerCompiler({ 
  databaseExecutor: executor 
})

// Register individual cubes
semanticLayer.registerCube(employeesCube)
semanticLayer.registerCube(productivityCube)

// Or register multiple cubes
const allCubes = [employeesCube, productivityCube, departmentsCube]
allCubes.forEach(cube => semanticLayer.registerCube(cube))
```

## Best Practices

1. **Always Use Security Context**: Every cube must filter by tenant/organisation
2. **Leverage Type Safety**: Use Drizzle schema types throughout
3. **Descriptive Names**: Use clear, business-friendly names and titles
4. **Document Complex Logic**: Add descriptions to calculated measures
5. **Test Thoroughly**: Verify security isolation and query correctness
6. **Follow Naming Conventions**: Use camelCase for internal names, Title Case for display

## Testing Cubes

```typescript
import { describe, it, expect } from 'vitest'
import { testEmployeesCube } from './test-cubes'

describe('Employees Cube', () => {
  it('should filter by organisation', async () => {
    const query = {
      measures: ['Employees.count'],
      dimensions: []
    }
    
    const result = await semanticLayer.load(query, {
      organisationId: 'test-org'
    })
    
    expect(result.rawData()).toHaveLength(expectedCount)
  })
})
```

## Common Patterns

### Single Table Cube
```typescript
sql: (ctx) => ({
  from: employees,
  where: eq(employees.organisationId, ctx.securityContext.organisationId)
})
```

### Multi-Table Cube with Joins
```typescript
sql: (ctx) => ({
  from: productivity,
  joins: [
    {
      table: employees,
      on: eq(productivity.employeeId, employees.id),
      type: 'left'
    }
  ],
  where: eq(productivity.organisationId, ctx.securityContext.organisationId)
})
```

### Filtered Cube (Active Records Only)
```typescript
sql: (ctx) => ({
  from: employees,
  where: and(
    eq(employees.organisationId, ctx.securityContext.organisationId),
    eq(employees.active, true)
  )
})
```

## Next Steps

- Learn about [Dimensions](/help/semantic-layer/dimensions) to understand categorical data
- Explore [Measures](/help/semantic-layer/measures) for metrics and aggregations  
- Understand [Joins](/help/semantic-layer/joins) for multi-cube relationships
- Review [Security](/help/semantic-layer/security) for multi-tenant patterns

## Roadmap Ideas

- Visual cube designer interface
- Cube validation and linting tools
- Automatic cube generation from schema
- Cube performance analytics and optimization hints