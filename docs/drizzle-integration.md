# Drizzle ORM Integration Guide

This document explains how drizzle-cube leverages Drizzle ORM as its core SQL building and execution engine, providing type safety, security, and performance benefits.

## Why Drizzle is Required

drizzle-cube is designed as a **Drizzle-first** semantic layer that requires Drizzle ORM. This is not just a dependency choice - it's fundamental to the architecture:

### 1. Type Safety from Database to API
```typescript
// With Drizzle schema types
const employeesCube = defineCube(schema, {
  name: 'Employees',
  sql: ({ db }) => db.select().from(schema.employees),
  dimensions: {
    name: { sql: schema.employees.name },        // Fully typed
    email: { sql: schema.employees.email }       // TypeScript knows this is a string
  },
  measures: {
    count: { sql: schema.employees.id, type: 'count' }  // Type-safe aggregation
  }
})
```

### 2. SQL Injection Prevention
```typescript
// Drizzle automatically parameterizes all values
const condition = eq(schema.employees.active, true)        // Safe
const filter = like(schema.employees.name, '%john%')       // Parameterized

// Instead of unsafe string concatenation:
// `employees.active = ${userInput}`  // VULNERABLE!
```

### 3. Query Optimization
- **Prepared Statements**: Drizzle generates prepared statements for better performance
- **Query Planning**: Database can optimize repeated queries
- **Connection Pooling**: Leverages Drizzle's connection management

### 4. Developer Experience
- **IntelliSense**: Full autocomplete for table and column names
- **Compile-time Errors**: Catch typos and schema mismatches before runtime
- **Refactoring Safety**: Schema changes are caught by TypeScript

## Basic Setup

### 1. Install Dependencies
```bash
npm install drizzle-orm drizzle-cube
npm install @drizzle-team/postgres-js postgres  # For PostgreSQL
```

### 2. Define Your Schema
```typescript
// schema.ts
import { pgTable, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core'

export const employees = pgTable('employees', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  active: boolean('active').default(true),
  departmentId: integer('department_id'),
  organisationId: integer('organisation_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
})

export const departments = pgTable('departments', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  organisationId: integer('organisation_id').notNull()
})

// Export schema for drizzle-cube
export const schema = { employees, departments }
export type Schema = typeof schema
```

### 3. Create Drizzle Instance
```typescript
// database.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { schema } from './schema'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)
export const db = drizzle(client, { schema })
```

### 4. Setup drizzle-cube
```typescript
// semantic-layer.ts
import { SemanticLayerCompiler } from 'drizzle-cube/server'
import { createCubeApp } from 'drizzle-cube/adapters/hono'
import { db, schema } from './database'

const semanticLayer = new SemanticLayerCompiler({
  drizzle: db,
  schema
})

// Register cubes (see cube definitions below)
semanticLayer.registerCube(employeesCube)

// Create API
const app = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (c) => ({
    organisationId: c.get('session')?.organisationId
  })
})
```

## Cube Definitions with Drizzle

### Basic Cube with Schema References
```typescript
import { defineCube } from 'drizzle-cube/server'
import { sql, eq, and } from 'drizzle-orm'
import { schema } from './schema'

export const employeesCube = defineCube(schema, {
  name: 'Employees',
  title: 'Employee Analytics',
  
  // Base SQL using Drizzle query builder
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.employees)
      .leftJoin(schema.departments, eq(schema.employees.departmentId, schema.departments.id))
      .where(eq(schema.employees.organisationId, securityContext.organisationId)),
  
  dimensions: {
    id: { 
      sql: schema.employees.id, 
      type: 'number', 
      primaryKey: true 
    },
    name: { 
      sql: schema.employees.name, 
      type: 'string',
      title: 'Employee Name'
    },
    email: { 
      sql: schema.employees.email, 
      type: 'string' 
    },
    department: { 
      sql: schema.departments.name, 
      type: 'string',
      title: 'Department Name'
    },
    isActive: { 
      sql: schema.employees.active, 
      type: 'boolean',
      title: 'Active Status'
    },
    createdAt: { 
      sql: schema.employees.createdAt, 
      type: 'time',
      title: 'Hire Date'
    }
  },
  
  measures: {
    count: {
      sql: schema.employees.id,
      type: 'count',
      title: 'Total Employees'
    },
    activeCount: {
      sql: schema.employees.id,
      type: 'count',
      title: 'Active Employees',
      filters: [{ sql: eq(schema.employees.active, true) }]
    }
  }
})
```

### Advanced Cube with Complex SQL
```typescript
export const departmentAnalyticsCube = defineCube(schema, {
  name: 'DepartmentAnalytics',
  
  // Complex SQL with CTEs and window functions
  sql: ({ db, securityContext }) => sql`
    WITH department_stats AS (
      SELECT 
        d.id,
        d.name,
        COUNT(e.id) as employee_count,
        AVG(e.salary) as avg_salary,
        ROW_NUMBER() OVER (ORDER BY COUNT(e.id) DESC) as size_rank
      FROM ${schema.departments} d
      LEFT JOIN ${schema.employees} e ON d.id = e.department_id
      WHERE d.organisation_id = ${securityContext.organisationId}
        AND (e.active = true OR e.id IS NULL)
      GROUP BY d.id, d.name
    )
    SELECT * FROM department_stats
  `,
  
  dimensions: {
    name: { sql: sql`name`, type: 'string' },
    sizeRank: { sql: sql`size_rank`, type: 'number', title: 'Size Ranking' }
  },
  
  measures: {
    employeeCount: { sql: sql`employee_count`, type: 'number' },
    avgSalary: { sql: sql`avg_salary`, type: 'number', format: 'currency' }
  }
})
```

## Filter Operations with Drizzle

drizzle-cube automatically converts semantic filters to Drizzle operators:

### Supported Filter Operators
```typescript
// String operations
'equals'      → eq(field, value)
'notEquals'   → ne(field, value)  
'contains'    → like(field, `%${value}%`)
'startsWith'  → like(field, `${value}%`)
'endsWith'    → like(field, `%${value}`)

// Numeric operations  
'gt'  → gt(field, value)
'gte' → gte(field, value)
'lt'  → lt(field, value)  
'lte' → lte(field, value)

// Null checks
'set'    → isNotNull(field)
'notSet' → isNull(field)

// Date operations
'inDateRange' → and(gte(field, startDate), lte(field, endDate))
'beforeDate'  → lt(field, date)
'afterDate'   → gt(field, date)
```

### Example Query with Filters
```typescript
const query = {
  measures: ['Employees.count', 'Employees.activeCount'],
  dimensions: ['Employees.department'],
  filters: [
    { member: 'Employees.active', operator: 'equals', values: [true] },
    { member: 'Employees.name', operator: 'contains', values: ['john'] },
    { member: 'Employees.createdAt', operator: 'inDateRange', values: ['2024-01-01', '2024-12-31'] }
  ]
}

// This generates safe, parameterized SQL:
// WHERE employees.active = $1 
//   AND employees.name ILIKE $2 
//   AND employees.created_at BETWEEN $3 AND $4
// Params: [true, '%john%', '2024-01-01', '2024-12-31']
```

## Aggregations with Drizzle

### Standard Aggregations
```typescript
measures: {
  count: { sql: schema.employees.id, type: 'count' },
  countDistinct: { sql: schema.employees.departmentId, type: 'countDistinct' },
  sum: { sql: schema.employees.salary, type: 'sum' },
  avg: { sql: schema.employees.salary, type: 'avg' },
  min: { sql: schema.employees.salary, type: 'min' },
  max: { sql: schema.employees.salary, type: 'max' }
}
```

### Custom Aggregations with Drizzle Functions
```typescript
import { sum, count, avg } from 'drizzle-orm'

measures: {
  totalSalary: { 
    sql: sum(schema.employees.salary),
    type: 'number',
    format: 'currency'
  },
  avgSalaryByDept: {
    sql: sql`${avg(schema.employees.salary)} OVER (PARTITION BY ${schema.employees.departmentId})`,
    type: 'number',
    format: 'currency'
  }
}
```

## Security Context Integration

### Automatic Context Injection
```typescript
const semanticLayer = new SemanticLayerCompiler({
  drizzle: db,
  schema,
  securityContext: {
    // This context is automatically available in all cube SQL
    getOrganisationId: (context) => context.organisationId,
    getUserId: (context) => context.userId
  }
})
```

### Using Security Context in Cubes
```typescript
export const secureEmployeesCube = defineCube(schema, {
  name: 'Employees',
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.organisationId, securityContext.organisationId),
          // Additional security constraints
          eq(schema.employees.active, true)
        )
      ),
  // ... rest of cube definition
})
```

## Performance Optimization

### Query Optimization
```typescript
// Drizzle automatically optimizes:
// 1. Uses prepared statements
// 2. Efficient JOIN generation  
// 3. Proper indexing hints
// 4. Connection pooling

const optimizedCube = defineCube(schema, {
  sql: ({ db }) => 
    db.select({
      // Select only needed columns
      employeeId: schema.employees.id,
      employeeName: schema.employees.name,
      departmentName: schema.departments.name
    })
    .from(schema.employees)
    .innerJoin(schema.departments, eq(schema.employees.departmentId, schema.departments.id))
    .where(eq(schema.employees.active, true))
    // Drizzle will use indexes on active and departmentId
})
```

### Pre-aggregation Support
```typescript
// Future: Support for Drizzle materialized views
const preAggregatedCube = defineCube(schema, {
  sql: ({ db }) => db.select().from(schema.employeeStatsView),
  preAggregations: {
    main: {
      measures: ['count', 'avgSalary'],
      dimensions: ['department'],
      refreshKey: { every: '1 hour' }
    }
  }
})
```

## Migration Guide

### From String-based SQL
```typescript
// Old approach (unsafe)
const oldCube = {
  sql: `SELECT * FROM employees WHERE organisation_id = '${organisationId}'`,  // SQL injection risk!
  dimensions: {
    name: { sql: 'name' }  // No type safety
  }
}

// New approach (safe and typed)  
const newCube = defineCube(schema, {
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.employees)
      .where(eq(schema.employees.organisationId, securityContext.organisationId)),  // Safe!
  dimensions: {
    name: { sql: schema.employees.name }  // Fully typed!
  }
})
```

### Converting Filters
```typescript
// Old: Manual string building
const buildFilter = (field, value) => `${field} = '${value}'`  // Unsafe!

// New: Drizzle operators
const buildFilter = (field, value) => eq(field, value)  // Safe and typed!
```

## Advanced Features

### Subqueries
```typescript
const complexCube = defineCube(schema, {
  sql: ({ db, securityContext }) => {
    const departmentCounts = db
      .select({
        departmentId: schema.employees.departmentId,
        employeeCount: count(schema.employees.id)
      })
      .from(schema.employees)
      .where(eq(schema.employees.organisationId, securityContext.organisationId))
      .groupBy(schema.employees.departmentId)
      .as('dept_counts')
    
    return db
      .select({
        departmentName: schema.departments.name,
        employeeCount: departmentCounts.employeeCount
      })
      .from(schema.departments)
      .innerJoin(departmentCounts, eq(schema.departments.id, departmentCounts.departmentId))
  }
})
```

### JSON Operations (PostgreSQL)
```typescript
import { jsonb } from 'drizzle-orm/pg-core'

const jsonCube = defineCube(schema, {
  dimensions: {
    skillLevel: { 
      sql: sql`${schema.employees.metadata}->>'skill_level'`,
      type: 'string'
    },
    certifications: {
      sql: sql`jsonb_array_length(${schema.employees.metadata}->'certifications')`,
      type: 'number'
    }
  }
})
```

## Troubleshooting

### Common Issues

1. **Schema Type Errors**
   ```typescript
   // Problem: Schema not properly typed
   const cube = defineCube(schema, {
     dimensions: {
       name: { sql: schema.employee.name }  // Typo: 'employee' vs 'employees'
     }
   })
   
   // Solution: TypeScript will catch this at compile time
   ```

2. **Security Context Missing**
   ```typescript
   // Problem: Forgetting to filter by organisation
   sql: ({ db }) => db.select().from(schema.employees)  // Exposes all orgs!
   
   // Solution: Always use security context
   sql: ({ db, securityContext }) => 
     db.select()
       .from(schema.employees)
       .where(eq(schema.employees.organisationId, securityContext.organisationId))
   ```

3. **Performance Issues**
   ```typescript
   // Problem: Missing indexes
   // Solution: Ensure your schema has proper indexes
   export const employees = pgTable('employees', {
     // ...
     organisationId: integer('organisation_id').notNull(),
     departmentId: integer('department_id')
   }, (table) => ({
     orgIndex: index('employees_org_idx').on(table.organisationId),
     deptIndex: index('employees_dept_idx').on(table.departmentId)
   }))
   ```

## Best Practices

1. **Always Use Security Context**: Every cube should filter by organisation/tenant
2. **Leverage Schema Types**: Let TypeScript catch errors at compile time  
3. **Use Prepared Statements**: Drizzle handles this automatically
4. **Index Your Queries**: Ensure database indexes match your cube dimensions
5. **Test Your Cubes**: Write tests to verify cube output and performance
6. **Monitor Query Performance**: Use database query analysis tools

## Next Steps

- Explore the [API Reference](./api-reference.md) for complete interface documentation
- See [Example Applications](../examples/) for real-world usage patterns
- Check out [Performance Tuning](./performance.md) for optimization strategies