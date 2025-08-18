# Semantic Layer

The semantic layer is the heart of Drizzle Cube. It provides a business-friendly abstraction over your database that enables consistent, secure, and performant analytics across your organization.

## What is a Semantic Layer?

A semantic layer is a **business representation** of your data that:

- **Abstracts complexity** - Hide database schema details behind business terms
- **Ensures consistency** - Single source of truth for metrics and definitions
- **Provides security** - Row and column-level access control
- **Enables self-service** - Non-technical users can explore data safely

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Applications  │────│  Semantic Layer  │────│    Database     │
│                 │    │                  │    │                 │
│ • Dashboards    │    │ • Cubes         │    │ • Tables        │
│ • Reports       │    │ • Dimensions    │    │ • Views         │
│ • APIs          │    │ • Measures      │    │ • Indexes       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Key Components

### Cubes
Business entities that represent your data models:

```typescript
export const salesCube = defineCube(schema, {
  name: 'Sales',
  title: 'Sales Transactions',
  description: 'All sales transactions with product and customer information',
  
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.sales)
      .innerJoin(schema.products, eq(schema.sales.productId, schema.products.id))
      .where(eq(schema.sales.organisationId, securityContext.organisationId)),
  
  dimensions: { /* ... */ },
  measures: { /* ... */ }
});
```

### Database Executor
Handles different database engines:

```typescript
const executor = createDatabaseExecutor(db, schema, 'postgres');
// Supports: 'postgres', 'mysql', 'sqlite'
```

### Semantic Layer Compiler
Orchestrates cubes and query execution:

```typescript
const semanticLayer = new SemanticLayerCompiler({ 
  databaseExecutor: executor 
});

semanticLayer.registerCube(salesCube);
semanticLayer.registerCube(productsCube);
semanticLayer.registerCube(customersCube);
```

## Advanced Features

### Multi-Cube Queries

Query across multiple cubes with automatic join resolution:

```json
{
  "measures": ["Sales.totalRevenue", "Products.averagePrice"],
  "dimensions": ["Products.category", "Sales.customerSegment"]
}
```

### Time Intelligence

Automatic time-based calculations:

```typescript
measures: {
  revenueGrowth: {
    sql: schema.sales.amount,
    type: 'sum',
    timeComparison: 'previousPeriod' // Compare to previous period
  },
  
  runningTotal: {
    sql: schema.sales.amount,
    type: 'runningSum' // Cumulative sum over time
  }
}
```

### Calculated Members

Create complex business logic:

```typescript
measures: {
  customerLifetimeValue: {
    sql: sql`
      (${schema.sales.amount} / ${schema.customers.acquisitionCost}) * 
      ${schema.customers.retentionRate}
    `,
    type: 'avg',
    title: 'Customer Lifetime Value'
  }
}
```

### Hierarchical Dimensions

Support drill-down analytics:

```typescript
dimensions: {
  location: {
    sql: schema.sales.region,
    type: 'string',
    hierarchy: ['country', 'region', 'city']
  }
}
```

## Security Model

### Multi-Tenant Isolation

Every cube must implement tenant isolation:

```typescript
sql: ({ db, securityContext }) => 
  db.select()
    .from(schema.data)
    .where(eq(schema.data.organisationId, securityContext.organisationId))
```

### Role-Based Access

Control access based on user roles:

```typescript
dimensions: {
  sensitiveData: {
    sql: securityContext.hasRole('admin') 
      ? schema.table.sensitiveColumn
      : sql`NULL`,
    type: 'string'
  }
}
```

### Dynamic Filtering

Apply filters based on user context:

```typescript
sql: ({ db, securityContext }) => {
  let query = db.select().from(schema.sales);
  
  if (securityContext.role === 'salesperson') {
    query = query.where(eq(schema.sales.salesPersonId, securityContext.userId));
  }
  
  return query.where(eq(schema.sales.organisationId, securityContext.organisationId));
}
```

## Performance Optimization

### Pre-aggregations

Create summary tables for fast queries:

```typescript
preAggregations: {
  monthlySales: {
    measures: ['Sales.totalRevenue', 'Sales.orderCount'],
    dimensions: ['Sales.productCategory'],
    timeDimension: 'Sales.orderDate',
    granularity: 'month',
    refreshKey: {
      every: '1 hour'
    }
  }
}
```

### Indexes

Ensure proper database indexes:

```typescript
// In your Drizzle schema
export const salesIndex = index('sales_org_date_idx')
  .on(sales.organisationId, sales.orderDate);
```

### Query Optimization

Use efficient SQL patterns:

```typescript
// ✅ Good - use joins instead of subqueries when possible
sql: ({ db }) => 
  db.select()
    .from(schema.sales)
    .innerJoin(schema.products, eq(schema.sales.productId, schema.products.id))

// ❌ Slower - subqueries can be less efficient  
sql: ({ db }) =>
  db.select()
    .from(schema.sales)
    .where(inArray(schema.sales.productId, 
      db.select({ id: schema.products.id }).from(schema.products)
    ))
```

## Data Modeling Best Practices

### Star Schema Design

Organize cubes around business processes:

```
    Customers ───┐
                 │
    Products ────┼──── Sales (Fact)
                 │
    Time ────────┘
```

### Dimensional Modeling

- **Fact tables** - Events, transactions, measurements
- **Dimension tables** - Descriptive attributes, hierarchies
- **Bridge tables** - Many-to-many relationships

### Naming Conventions

```typescript
// Cubes: Business entities (PascalCase)
export const CustomerOrders = defineCube(/* ... */);

// Dimensions: Attributes (camelCase)  
dimensions: {
  customerName: { /* ... */ },
  orderDate: { /* ... */ }
}

// Measures: Metrics (camelCase)
measures: {
  totalRevenue: { /* ... */ },
  averageOrderValue: { /* ... */ }
}
```

## Testing Your Semantic Layer

### Unit Tests

Test cube definitions:

```typescript
import { describe, it, expect } from 'vitest';
import { salesCube } from './cubes';

describe('Sales Cube', () => {
  it('should have required dimensions', () => {
    expect(salesCube.dimensions.customerName).toBeDefined();
    expect(salesCube.dimensions.orderDate).toBeDefined();
  });
  
  it('should have required measures', () => {
    expect(salesCube.measures.totalRevenue).toBeDefined();
    expect(salesCube.measures.orderCount).toBeDefined();
  });
});
```

### Integration Tests

Test query execution:

```typescript
it('should execute queries correctly', async () => {
  const result = await semanticLayer.executeQuery({
    measures: ['Sales.totalRevenue'],
    dimensions: ['Sales.productCategory']
  }, { organisationId: 1 });
  
  expect(result.data).toHaveLength(3);
  expect(result.data[0]).toHaveProperty('Sales.totalRevenue');
});
```

## Migration Strategies

### From Cube.js

Drizzle Cube is designed to be compatible with existing Cube.js schemas:

```typescript
// Cube.js schema
cube(`Sales`, {
  sql: `SELECT * FROM sales`,
  dimensions: {
    customerName: {
      sql: `customer_name`,
      type: `string`
    }
  },
  measures: {
    count: {
      type: `count`
    }
  }
});

// Equivalent Drizzle Cube
export const salesCube = defineCube(schema, {
  name: 'Sales',
  sql: ({ db }) => db.select().from(schema.sales),
  dimensions: {
    customerName: {
      sql: schema.sales.customerName,
      type: 'string'
    }
  },
  measures: {
    count: {
      sql: schema.sales.id,
      type: 'count'
    }
  }
});
```

### Gradual Migration

1. Start with one cube
2. Add type safety with Drizzle schema
3. Migrate queries one by one
4. Add security context
5. Optimize performance

## Next Steps

- [**Cubes**](/help/semantic-layer/cubes) - Deep dive into cube definitions
- [**Dimensions**](/help/semantic-layer/dimensions) - Advanced dimension patterns
- [**Measures**](/help/semantic-layer/measures) - Custom calculations and aggregations
- [**Joins**](/help/semantic-layer/joins) - Multi-cube query patterns
- [**Security**](/help/semantic-layer/security) - Advanced security patterns