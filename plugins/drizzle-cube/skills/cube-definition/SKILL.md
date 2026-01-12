---
name: cube-definition
description: Create and configure Drizzle Cube semantic layer cube definitions with proper security context, measures, dimensions, and joins.
---

# Cube Definition Skill

This skill helps you create properly structured cube definitions for Drizzle Cube's semantic layer.

## Core Concepts

Drizzle Cube is **Drizzle ORM-first**. All cubes reference Drizzle schema columns directly for compile-time validation and SQL injection protection.

## Basic Cube Structure

```typescript
import { defineCube } from 'drizzle-cube/server'
import { eq } from 'drizzle-orm'
import { employees } from './schema'

export const employeesCube = defineCube({
  name: 'Employees',

  // REQUIRED: Security context filter for multi-tenant isolation
  sql: (securityContext) => eq(employees.organisationId, securityContext.organisationId),

  measures: {
    count: {
      type: 'count',
      sql: () => employees.id
    },
    totalSalary: {
      type: 'sum',
      sql: () => employees.salary
    },
    averageSalary: {
      type: 'avg',
      sql: () => employees.salary
    }
  },

  dimensions: {
    id: {
      type: 'number',
      sql: () => employees.id,
      primaryKey: true
    },
    name: {
      type: 'string',
      sql: () => employees.name
    },
    email: {
      type: 'string',
      sql: () => employees.email
    },
    createdAt: {
      type: 'time',
      sql: () => employees.createdAt
    }
  }
})
```

## CRITICAL: Security Context

**Every cube MUST implement security filtering.** This is mandatory for multi-tenant data isolation.

```typescript
// REQUIRED pattern - filter by security context
sql: (securityContext) => eq(table.organisationId, securityContext.organisationId)

// For multiple conditions
sql: (securityContext) => and(
  eq(table.organisationId, securityContext.organisationId),
  eq(table.isDeleted, false)
)
```

The security context is passed to every query execution:
```typescript
const result = await semanticLayer.execute(query, {
  organisationId: 'org-123',
  userId: 'user-456'
})
```

## Measure Types

| Type | Description | Example |
|------|-------------|---------|
| `count` | Count rows | `{ type: 'count', sql: () => table.id }` |
| `countDistinct` | Count unique values | `{ type: 'countDistinct', sql: () => table.userId }` |
| `sum` | Sum numeric values | `{ type: 'sum', sql: () => table.amount }` |
| `avg` | Average numeric values | `{ type: 'avg', sql: () => table.price }` |
| `min` | Minimum value | `{ type: 'min', sql: () => table.date }` |
| `max` | Maximum value | `{ type: 'max', sql: () => table.score }` |

### Filtered Measures

Apply filters within measures:

```typescript
measures: {
  activeCount: {
    type: 'count',
    sql: () => employees.id,
    filters: [{ sql: () => eq(employees.isActive, true) }]
  },
  highValueOrders: {
    type: 'sum',
    sql: () => orders.amount,
    filters: [{ sql: () => gt(orders.amount, 1000) }]
  }
}
```

## Dimension Types

| Type | Description | Example |
|------|-------------|---------|
| `string` | Text values | `{ type: 'string', sql: () => table.name }` |
| `number` | Numeric values | `{ type: 'number', sql: () => table.quantity }` |
| `boolean` | True/false values | `{ type: 'boolean', sql: () => table.isActive }` |
| `time` | Date/timestamp values | `{ type: 'time', sql: () => table.createdAt }` |

### Primary Key Dimension

Mark the primary key for proper aggregations:

```typescript
dimensions: {
  id: {
    type: 'number',
    sql: () => table.id,
    primaryKey: true  // Important for multi-cube queries
  }
}
```

## Cube Joins (Relationships)

### Relationship Types

| Type | Description | SQL Join |
|------|-------------|----------|
| `belongsTo` | Many-to-one | INNER JOIN |
| `hasOne` | One-to-one | LEFT JOIN |
| `hasMany` | One-to-many | LEFT JOIN (with CTE) |
| `belongsToMany` | Many-to-many | LEFT JOIN (through junction) |

### belongsTo Example (Many-to-One)

```typescript
export const employeesCube = defineCube({
  name: 'Employees',
  sql: (ctx) => eq(employees.organisationId, ctx.organisationId),

  joins: {
    Departments: {
      targetCube: () => departmentsCube,
      relationship: 'belongsTo',
      on: [
        { source: employees.departmentId, target: departments.id }
      ]
    }
  },

  measures: { /* ... */ },
  dimensions: { /* ... */ }
})
```

### hasMany Example (One-to-Many)

```typescript
export const departmentsCube = defineCube({
  name: 'Departments',
  sql: (ctx) => eq(departments.organisationId, ctx.organisationId),

  joins: {
    Employees: {
      targetCube: () => employeesCube,
      relationship: 'hasMany',
      on: [
        { source: departments.id, target: employees.departmentId }
      ]
    }
  },

  measures: { /* ... */ },
  dimensions: { /* ... */ }
})
```

### belongsToMany Example (Many-to-Many)

Use when relating through a junction table:

```typescript
export const employeesCube = defineCube({
  name: 'Employees',
  sql: (ctx) => eq(employees.organisationId, ctx.organisationId),

  joins: {
    Projects: {
      targetCube: () => projectsCube,
      relationship: 'belongsToMany',
      on: [],  // Not used for belongsToMany
      through: {
        table: employeeProjects,  // Junction table
        sourceKey: [
          { source: employees.id, target: employeeProjects.employeeId }
        ],
        targetKey: [
          { source: employeeProjects.projectId, target: projects.id }
        ],
        // Optional: Security filter for junction table
        securitySql: (securityContext) =>
          eq(employeeProjects.organisationId, securityContext.organisationId)
      }
    }
  }
})
```

## Star Schema Pattern

For fact-dimension-fact joins, the dimension cube MUST define `hasMany` relationships back to all fact cubes:

```typescript
// Dimension cube - MUST define hasMany to both facts
export const productsCube = defineCube({
  name: 'Products',
  sql: (ctx) => eq(products.organisationId, ctx.organisationId),

  joins: {
    Sales: {
      targetCube: () => salesCube,
      relationship: 'hasMany',
      on: [{ source: products.id, target: sales.productId }]
    },
    Inventory: {
      targetCube: () => inventoryCube,
      relationship: 'hasMany',
      on: [{ source: products.id, target: inventory.productId }]
    }
  },

  dimensions: {
    name: { type: 'string', sql: () => products.name },
    category: { type: 'string', sql: () => products.category }
  }
})

// Fact cube #1
export const salesCube = defineCube({
  name: 'Sales',
  sql: (ctx) => eq(sales.organisationId, ctx.organisationId),

  joins: {
    Products: {
      targetCube: () => productsCube,
      relationship: 'belongsTo',
      on: [{ source: sales.productId, target: products.id }]
    }
  },

  measures: {
    totalRevenue: { type: 'sum', sql: () => sales.revenue }
  }
})

// Fact cube #2
export const inventoryCube = defineCube({
  name: 'Inventory',
  sql: (ctx) => eq(inventory.organisationId, ctx.organisationId),

  joins: {
    Products: {
      targetCube: () => productsCube,
      relationship: 'belongsTo',
      on: [{ source: inventory.productId, target: products.id }]
    }
  },

  measures: {
    totalStock: { type: 'sum', sql: () => inventory.stockLevel }
  }
})
```

## Registering Cubes

```typescript
import { SemanticLayerCompiler } from 'drizzle-cube/server'

const semanticLayer = new SemanticLayerCompiler({
  drizzle: db,
  schema: schema
})

// Register cubes
semanticLayer.registerCube(employeesCube)
semanticLayer.registerCube(departmentsCube)

// Execute queries
const result = await semanticLayer.execute({
  measures: ['Employees.count'],
  dimensions: ['Departments.name']
}, securityContext)
```

## Common Patterns

### Calculated Dimension

```typescript
dimensions: {
  fullName: {
    type: 'string',
    sql: () => sql`${employees.firstName} || ' ' || ${employees.lastName}`
  }
}
```

### Date Extraction

```typescript
dimensions: {
  createdYear: {
    type: 'number',
    sql: () => sql`EXTRACT(YEAR FROM ${orders.createdAt})`
  }
}
```

### Conditional Measure

```typescript
measures: {
  completedOrders: {
    type: 'count',
    sql: () => orders.id,
    filters: [{ sql: () => eq(orders.status, 'completed') }]
  }
}
```

## Security Best Practices

1. **Always include security context filter** - Never skip the `sql` function
2. **Filter junction tables** - Use `securitySql` in `belongsToMany` relationships
3. **Use Drizzle query builder** - Never construct raw SQL strings
4. **Test security isolation** - Verify queries return only authorized data

## Database Support

Cubes work identically across:
- PostgreSQL
- MySQL
- SQLite

The database type is auto-detected from your Drizzle instance.
