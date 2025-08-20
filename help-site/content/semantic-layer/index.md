# Semantic Layer

The semantic layer is the heart of Drizzle Cube. It provides a business-friendly abstraction over your database that enables consistent, secure, and performant analytics across your organization.

## What is a Semantic Layer?

A semantic layer is a **business representation** of your data that:

- **Abstracts complexity** - Hide database schema details behind business terms
- **Ensures consistency** - Single source of truth for metrics and definitions
- **Provides security** - Row and column-level access control
- **Enables self-service** - Non-technical users can explore data safely

## Architecture Overview

<div style="display: flex; justify-content: center; align-items: center; gap: 20px; margin: 20px 0; font-family: monospace;">
  <div style="border: 2px solid #374151; border-radius: 8px; padding: 16px; background: #f9fafb; min-width: 140px;">
    <div style="font-weight: bold; text-align: center; margin-bottom: 8px;">Applications</div>
    <div style="font-size: 14px; color: #6b7280;">
      • Dashboards<br>
      • Reports<br>
      • APIs
    </div>
  </div>
  
  <div style="color: #6b7280; font-size: 24px;">→</div>
  
  <div style="border: 2px solid #059669; border-radius: 8px; padding: 16px; background: #f0fdf4; min-width: 140px;">
    <div style="font-weight: bold; text-align: center; margin-bottom: 8px; color: #059669;">Semantic Layer</div>
    <div style="font-size: 14px; color: #6b7280;">
      • Cubes<br>
      • Dimensions<br>
      • Measures
    </div>
  </div>
  
  <div style="color: #6b7280; font-size: 24px;">→</div>
  
  <div style="border: 2px solid #374151; border-radius: 8px; padding: 16px; background: #f9fafb; min-width: 140px;">
    <div style="font-weight: bold; text-align: center; margin-bottom: 8px;">Database</div>
    <div style="font-size: 14px; color: #6b7280;">
      • Tables<br>
      • Views<br>
      • Indexes
    </div>
  </div>
</div>

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
// Supported: 'postgres' (including Neon), 'mysql'
// Coming soon: 'sqlite'
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

### Time Intelligence *(Coming Soon)*

Time-based calculations are planned for future releases. Currently, time dimensions are supported for grouping data by time periods using standard SQL aggregation patterns.

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

## Migration and Interoperability

### Drizzle Cube ↔ [Cube.js](https://cube.dev) Migration

Drizzle Cube and [Cube.js](https://cube.dev) are designed to be compatible, allowing migration in both directions depending on your needs:

**Drizzle Cube → [Cube.js](https://cube.dev)**: As your analytics requirements become more complex, you might need [Cube.js](https://cube.dev)'s advanced features like pre-aggregations, caching layers, or enterprise tooling. The similar schema structure makes this transition smooth.

**[Cube.js](https://cube.dev) → Drizzle Cube**: If you want stronger type safety, Drizzle ORM integration, or simpler deployment patterns, you can migrate to Drizzle Cube while maintaining API compatibility.

```typescript
// [Cube.js](https://cube.dev) schema
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

// Equivalent Drizzle Cube (bidirectional compatibility)
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

### When to Choose Each Platform

**Choose Drizzle Cube when:**
- You want type safety and Drizzle ORM integration
- You prefer simpler deployment (single process, no Redis)
- You need strong SQL injection protection
- Your analytics needs are moderate complexity

**Consider [Cube.js](https://cube.dev) when:**
- You need advanced pre-aggregation strategies
- You require horizontal scaling with caching layers
- You want enterprise features and commercial support
- You have complex analytics requirements across large datasets

### Migration Path

1. **Start small** - Begin with one cube in either direction
2. **Maintain compatibility** - Both platforms support similar query APIs
3. **Gradual transition** - Migrate cubes and queries incrementally  
4. **Test thoroughly** - Validate query results during migration
5. **Update clients** - Frontend applications often require minimal changes

## Next Steps

- [**Cubes**](/help/semantic-layer/cubes) - Deep dive into cube definitions
- [**Dimensions**](/help/semantic-layer/dimensions) - Advanced dimension patterns
- [**Measures**](/help/semantic-layer/measures) - Custom calculations and aggregations
- [**Joins**](/help/semantic-layer/joins) - Multi-cube query patterns
- [**Security**](/help/semantic-layer/security) - Advanced security patterns