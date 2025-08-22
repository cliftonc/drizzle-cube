# Semantic Layer

The semantic layer is the heart of Drizzle Cube. It transforms your raw database tables into business-friendly concepts that anyone can understand and query safely.

## What is a Semantic Layer?

A semantic layer is a **business representation** of your data that:

- **Abstracts complexity** - Hide database schema details behind business terms
- **Ensures consistency** - Single source of truth for metrics and definitions  
- **Enables self-service** - Non-technical users can explore data confidently
- **Provides structure** - Organize data into logical business entities

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

## Core Concepts

The semantic layer is built on three fundamental concepts:

### 1. Cubes
**Cubes** are business entities that represent the main subjects you want to analyze - like Sales, Customers, or Products. Each cube defines how to query a specific dataset.

```typescript
import { defineCube } from 'drizzle-cube/server';
import { eq } from 'drizzle-orm';
import * as schema from './schema';

export const salesCube = defineCube('Sales', {
  title: 'Sales Transactions',
  sql: (ctx) => ({
    from: schema.sales,
    leftJoin: [
      { table: schema.products, on: eq(schema.sales.productId, schema.products.id) },
      { table: schema.customers, on: eq(schema.sales.customerId, schema.customers.id) }
    ]
  }),
  
  dimensions: {
    // What you can filter and group by
  },
  
  measures: {
    // What you want to calculate and analyze
  }
});
```

### 2. Dimensions
**Dimensions** are the descriptive attributes of your data - the "what", "when", "where", and "who" that you use to slice and filter your analysis.

```typescript
dimensions: {
  customerName: {
    name: 'customerName',
    title: 'Customer Name',
    type: 'string',
    sql: schema.customers.name
  },
  productCategory: {
    name: 'productCategory', 
    title: 'Product Category',
    type: 'string',
    sql: schema.products.category
  },
  orderDate: {
    name: 'orderDate',
    title: 'Order Date',
    type: 'time',
    sql: schema.sales.orderDate
  }
}
```

### 3. Measures
**Measures** are the numeric calculations you want to perform - counts, sums, averages, and other aggregations that provide business insights.

```typescript
measures: {
  totalSales: {
    name: 'totalSales',
    title: 'Total Sales',
    type: 'sum',
    sql: schema.sales.amount
  },
  orderCount: {
    name: 'orderCount', 
    title: 'Number of Orders',
    type: 'count',
    sql: schema.sales.id
  },
  averageOrderValue: {
    name: 'averageOrderValue',
    title: 'Average Order Value', 
    type: 'avg',
    sql: schema.sales.amount
  }
}
```

## Complete Example

Here's a complete cube definition that brings together all three concepts:

```typescript
import { defineCube } from 'drizzle-cube/server';
import { eq } from 'drizzle-orm';
import * as schema from './schema';

export const salesCube = defineCube('Sales', {
  title: 'Sales Transactions',
  description: 'All sales data with customer and product information',
  
  sql: (ctx) => ({
    from: schema.sales,
    leftJoin: [
      { table: schema.products, on: eq(schema.sales.productId, schema.products.id) },
      { table: schema.customers, on: eq(schema.sales.customerId, schema.customers.id) }
    ]
  }),
  
  dimensions: {
    customerName: {
      name: 'customerName',
      title: 'Customer Name',
      type: 'string',
      sql: schema.customers.name
    },
    productName: {
      name: 'productName',
      title: 'Product Name', 
      type: 'string',
      sql: schema.products.name
    },
    productCategory: {
      name: 'productCategory',
      title: 'Product Category',
      type: 'string', 
      sql: schema.products.category
    },
    orderDate: {
      name: 'orderDate',
      title: 'Order Date',
      type: 'time',
      sql: schema.sales.orderDate
    }
  },
  
  measures: {
    totalSales: {
      name: 'totalSales',
      title: 'Total Sales',
      type: 'sum',
      sql: schema.sales.amount
    },
    orderCount: {
      name: 'orderCount',
      title: 'Number of Orders',
      type: 'count', 
      sql: schema.sales.id
    },
    averageOrderValue: {
      name: 'averageOrderValue',
      title: 'Average Order Value',
      type: 'avg',
      sql: schema.sales.amount
    },
    totalQuantity: {
      name: 'totalQuantity',
      title: 'Total Quantity Sold',
      type: 'sum',
      sql: schema.sales.quantity
    }
  }
});
```

## How Queries Work

Once you've defined your cube, you can query it using a simple JSON structure:

```json
{
  "measures": ["Sales.totalSales", "Sales.orderCount"],
  "dimensions": ["Sales.productCategory", "Sales.customerName"],
  "timeDimensions": [{
    "dimension": "Sales.orderDate",
    "granularity": "month"
  }],
  "filters": [{
    "member": "Sales.productCategory", 
    "operator": "equals",
    "values": ["Electronics"]
  }]
}
```

This query will:
1. **Sum up total sales** and **count orders** (measures)
2. **Group by** product category and customer name (dimensions)  
3. **Group by month** using the order date (time dimension)
4. **Filter to** only Electronics products (filter)

## Common Patterns

### Basic Aggregations
```typescript
measures: {
  // Count records
  recordCount: { type: 'count', sql: schema.table.id },
  
  // Sum amounts
  totalRevenue: { type: 'sum', sql: schema.table.amount },
  
  // Calculate averages  
  avgOrderValue: { type: 'avg', sql: schema.table.orderValue },
  
  // Find min/max values
  minPrice: { type: 'min', sql: schema.table.price },
  maxPrice: { type: 'max', sql: schema.table.price }
}
```

### Time Dimensions
```typescript
dimensions: {
  createdDate: {
    type: 'time',
    sql: schema.table.createdAt
  },
  updatedDate: {
    type: 'time', 
    sql: schema.table.updatedAt
  }
}
```

### Categorical Dimensions  
```typescript
dimensions: {
  status: {
    type: 'string',
    sql: schema.table.status
  },
  category: {
    type: 'string',
    sql: schema.table.category  
  },
  isActive: {
    type: 'boolean',
    sql: schema.table.isActive
  }
}
```

## Next Steps

- [**Cubes**](/help/semantic-layer/cubes) - Deep dive into cube definitions
- [**Dimensions**](/help/semantic-layer/dimensions) - Advanced dimension patterns
- [**Measures**](/help/semantic-layer/measures) - Custom calculations and aggregations
- [**Joins**](/help/semantic-layer/joins) - Multi-cube query patterns
- [**Security**](/help/semantic-layer/security) - Advanced security patterns