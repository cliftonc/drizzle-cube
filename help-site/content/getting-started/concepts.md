# Core Concepts

Understanding the fundamental concepts of Drizzle Cube is essential for building effective semantic layers. This guide covers the key concepts you'll work with.

## Semantic Layer Overview

A **semantic layer** sits between your database and your analytics applications. It provides a business-friendly abstraction over your raw data, allowing you to:

- Define business logic once and reuse it everywhere
- Ensure consistent metrics across your organization
- Provide security and access control
- Enable self-service analytics for non-technical users

## Cubes

**Cubes** are the core building blocks of your semantic layer. Each cube represents a logical business entity (like Sales, Users, Products) and contains:

- **SQL definition** - How to retrieve the data
- **Dimensions** - Attributes you can filter and group by
- **Measures** - Numeric values you want to analyze
- **Joins** - Relationships to other cubes

### Basic Cube Structure

```typescript
export const salesCube = defineCube(schema, {
  name: 'Sales',
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.sales)
      .where(eq(schema.sales.organisationId, securityContext.organisationId)),
  
  dimensions: {
    // Categorical data
  },
  
  measures: {
    // Numeric aggregations
  }
});
```

### Security Context

Every cube **must** include security filtering to ensure multi-tenant isolation:

```typescript
// ✅ Good - includes security context
sql: ({ db, securityContext }) => 
  db.select()
    .from(schema.sales)
    .where(eq(schema.sales.organisationId, securityContext.organisationId))

// ❌ Bad - no security filtering
sql: ({ db }) => db.select().from(schema.sales)
```

## Dimensions

**Dimensions** are the attributes of your data that you can:
- Filter by (WHERE clauses)
- Group by (GROUP BY clauses)  
- Use in charts as categories

### Dimension Types

#### String Dimensions
Categorical text data:

```typescript
dimensions: {
  customerName: { 
    sql: schema.sales.customerName, 
    type: 'string' 
  },
  productCategory: { 
    sql: schema.products.category, 
    type: 'string' 
  }
}
```

#### Time Dimensions
Date and timestamp fields:

```typescript
dimensions: {
  orderDate: { 
    sql: schema.sales.orderDate, 
    type: 'time' 
  },
  createdAt: { 
    sql: schema.users.createdAt, 
    type: 'time' 
  }
}
```

Time dimensions support automatic granularity:
- `year` - 2024
- `quarter` - 2024-Q1  
- `month` - 2024-01
- `week` - 2024-W01
- `day` - 2024-01-15
- `hour` - 2024-01-15 14:00

#### Number Dimensions
Numeric values used as categories:

```typescript
dimensions: {
  quantity: { 
    sql: schema.sales.quantity, 
    type: 'number' 
  },
  userId: { 
    sql: schema.sessions.userId, 
    type: 'number' 
  }
}
```

### Computed Dimensions

You can create computed dimensions using SQL expressions:

```typescript
dimensions: {
  fullName: {
    sql: sql`CONCAT(${schema.users.firstName}, ' ', ${schema.users.lastName})`,
    type: 'string',
    title: 'Full Name'
  },
  ageGroup: {
    sql: sql`
      CASE 
        WHEN age < 18 THEN 'Under 18'
        WHEN age < 35 THEN '18-34'
        WHEN age < 55 THEN '35-54'
        ELSE '55+'
      END
    `,
    type: 'string',
    title: 'Age Group'
  }
}
```

## Measures

**Measures** are the numeric values you want to analyze. They represent aggregated data and support various aggregation types.

### Aggregation Types

#### Count
Count the number of rows:

```typescript
measures: {
  orderCount: { 
    sql: schema.sales.id, 
    type: 'count',
    title: 'Total Orders'
  }
}
```

#### Sum
Add up numeric values:

```typescript
measures: {
  totalRevenue: { 
    sql: schema.sales.amount, 
    type: 'sum',
    title: 'Total Revenue'
  }
}
```

#### Average
Calculate the mean value:

```typescript
measures: {
  averageOrderValue: { 
    sql: schema.sales.amount, 
    type: 'avg',
    title: 'Average Order Value'
  }
}
```

#### Min/Max
Find minimum or maximum values:

```typescript
measures: {
  minOrderAmount: { 
    sql: schema.sales.amount, 
    type: 'min',
    title: 'Smallest Order'
  },
  maxOrderAmount: { 
    sql: schema.sales.amount, 
    type: 'max', 
    title: 'Largest Order'
  }
}
```

### Custom Measures

Create complex calculations using SQL expressions:

```typescript
measures: {
  profitMargin: {
    sql: sql`(${schema.sales.amount} - ${schema.sales.cost}) / ${schema.sales.amount} * 100`,
    type: 'avg',
    title: 'Profit Margin %',
    format: 'percent'
  },
  
  conversionRate: {
    sql: sql`
      COUNT(CASE WHEN ${schema.events.type} = 'purchase' THEN 1 END) * 100.0 / 
      COUNT(CASE WHEN ${schema.events.type} = 'visit' THEN 1 END)
    `,
    type: 'number',
    title: 'Conversion Rate %'
  }
}
```

## Data Types and Formats

### Dimension Data Types
- `string` - Text values
- `number` - Numeric values  
- `time` - Dates and timestamps
- `boolean` - True/false values

### Measure Formats
Control how measures are displayed:

```typescript
measures: {
  revenue: {
    sql: schema.sales.amount,
    type: 'sum',
    format: 'currency' // $1,234.56
  },
  
  growth: {
    sql: schema.metrics.growth,
    type: 'avg',
    format: 'percent' // 12.3%
  }
}
```

## Query Structure

When querying cubes, you specify:

### Measures
What you want to calculate:

```json
{
  "measures": ["Sales.totalRevenue", "Sales.orderCount"]
}
```

### Dimensions
How you want to group/filter the data:

```json
{
  "dimensions": ["Sales.productCategory", "Sales.customerName"]
}
```

### Time Dimensions
Time-based grouping with granularity:

```json
{
  "timeDimensions": [{
    "dimension": "Sales.orderDate",
    "granularity": "month"
  }]
}
```

### Filters
Restrict the data returned:

```json
{
  "filters": [
    {
      "member": "Sales.productCategory",
      "operator": "equals",
      "values": ["Electronics"]
    },
    {
      "member": "Sales.orderDate",
      "operator": "inDateRange", 
      "values": ["2024-01-01", "2024-12-31"]
    }
  ]
}
```

## Security and Multi-tenancy

### Organisation-based Security
Every cube should filter by organisation:

```typescript
sql: ({ db, securityContext }) => 
  db.select()
    .from(schema.sales)
    .where(eq(schema.sales.organisationId, securityContext.organisationId))
```

### Row-level Security
Filter based on user permissions:

```typescript
sql: ({ db, securityContext }) => 
  db.select()
    .from(schema.sales)
    .where(and(
      eq(schema.sales.organisationId, securityContext.organisationId),
      eq(schema.sales.salesPersonId, securityContext.userId) // User can only see their sales
    ))
```

### Column-level Security
Conditionally include sensitive data:

```typescript
dimensions: {
  customerEmail: {
    sql: securityContext.hasRole('admin') 
      ? schema.customers.email 
      : sql`'[HIDDEN]'`,
    type: 'string'
  }
}
```

## Best Practices

### Naming Conventions
- Use descriptive names: `totalRevenue` not `sum_amount`
- Be consistent: `orderCount`, `customerCount`, `productCount`
- Use camelCase for cube members

### Performance
- Add database indexes for commonly filtered dimensions
- Use appropriate data types in your schema
- Consider pre-aggregated tables for large datasets

### Documentation
- Add `title` and `description` to cube members
- Use meaningful cube and measure names
- Document business logic in comments

## Next Steps

Now that you understand the core concepts:

1. [**Explore the Semantic Layer**](/help/semantic-layer) - Advanced cube features
2. [**Learn about Joins**](/help/semantic-layer/joins) - Multi-cube queries  
3. [**Security Deep Dive**](/help/semantic-layer/security) - Advanced security patterns
4. [**Performance Optimization**](/help/advanced/performance) - Scale your semantic layer