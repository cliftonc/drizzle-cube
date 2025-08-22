# Scaling Your SaaS with Drizzle Cube

One of Drizzle Cube's greatest strengths is its ability to grow with your SaaS business. The semantic layer provides a stable abstraction that allows you to evolve your data architecture without breaking your reports, dashboards, and analytics.

## The Scaling Journey

### 🌱 Small SaaS: Direct Database Queries

**Perfect for:** Startups, MVPs, small teams (< 10k users, < 1GB data)

When you're starting out, simplicity is key. Drizzle Cube connects directly to your operational database:

```typescript
// Simple setup - queries run directly on your main database
const db = drizzle(postgres(DATABASE_URL), { schema })
const executor = createDatabaseExecutor(db, schema, 'postgres')

export const salesCube = defineCube('Sales', {
  sql: (ctx) => ({
    from: schema.orders,
    where: eq(schema.orders.organisationId, ctx.securityContext.organisationId)
  }),
      
  dimensions: {
    customerName: { 
      sql: schema.orders.customerName, 
      type: 'string' 
    },
    orderDate: { 
      sql: schema.orders.createdAt, 
      type: 'time' 
    }
  },
  
  measures: {
    totalRevenue: { 
      sql: schema.orders.amount, 
      type: 'sum' 
    },
    orderCount: { 
      sql: schema.orders.id, 
      type: 'count' 
    }
  }
})
```

**Benefits:**
- ✅ Zero additional infrastructure
- ✅ Real-time data (no sync delays)
- ✅ Simple deployment and maintenance
- ✅ Perfect for rapid iteration

**When to scale:** Query performance degrades, reports impact app performance, or you hit ~1GB of data.

### 🚀 Growing SaaS: Optimized Data Layer

**Perfect for:** Scale-ups, established products (10k-1M users, 1-100GB data)

As you grow, you need better performance without complexity. Add materialized views or read replicas:

#### Option A: Materialized Views

```sql
-- Create materialized views for heavy aggregations
CREATE MATERIALIZED VIEW daily_sales_summary AS
SELECT 
    organisation_id,
    date_trunc('day', created_at) as order_date,
    count(*) as order_count,
    sum(amount) as total_revenue,
    avg(amount) as avg_order_value
FROM orders 
GROUP BY organisation_id, date_trunc('day', created_at);

-- Refresh periodically (via cron job)
REFRESH MATERIALIZED VIEW daily_sales_summary;
```

Update your cube to use the optimized view:

```typescript
export const salesCube = defineCube('Sales', {
  // Same interface, different underlying source
  sql: (ctx) => ({
    from: schema.dailySalesSummary,  // Now using materialized view
    where: eq(schema.dailySalesSummary.organisationId, ctx.securityContext.organisationId)
  }),
      
  dimensions: {
    orderDate: { 
      sql: schema.dailySalesSummary.orderDate, 
      type: 'time' 
    }
  },
  
  measures: {
    // Pre-aggregated - much faster queries
    totalRevenue: { 
      sql: schema.dailySalesSummary.totalRevenue, 
      type: 'sum' 
    },
    orderCount: { 
      sql: schema.dailySalesSummary.orderCount, 
      type: 'sum' 
    }
  }
})
```

#### Option B: Read Replica

```typescript
// Set up dedicated analytics database connection
const analyticsDb = drizzle(postgres(ANALYTICS_DATABASE_URL), { schema })

// Same cubes, different database - zero code changes to dashboards!
const app = createCubeApp({
  cubes: [salesCube],  // Same cube definitions
  drizzle: analyticsDb,  // Different database connection
  schema,
  extractSecurityContext: async (c) => ({
    organisationId: c.get('user')?.organisationId
  })
})

// All existing dashboards continue working unchanged
```

**Benefits:**
- ✅ 10-100x query performance improvement  
- ✅ Zero impact on production application
- ✅ All existing reports continue working unchanged
- ✅ Gradual migration (can optimize cube by cube)

**When to scale:** Query complexity increases, need sub-second dashboard loads, or approaching 100GB.

### 🏢 Enterprise SaaS: Data Lake + Warehouse

**Perfect for:** Large enterprises (1M+ users, 100GB+ data, complex analytics)

For massive scale, integrate with modern data stack while keeping your semantic layer:

#### Option A: Data Lake Integration

```typescript
// Connect to your data warehouse (Snowflake, BigQuery, Redshift)
import { drizzle } from 'drizzle-orm/snowflake-sdk'

const warehouseDb = drizzle(snowflakeConnection, { schema })
const executor = createDatabaseExecutor(warehouseDb, schema, 'snowflake')

export const salesCube = defineCube('Sales', {
  sql: (ctx) => ({
    from: schema.ordersFact,  // Now querying data warehouse fact table
    joins: [{
      type: 'inner',
      table: schema.customerDim,
      condition: eq(schema.ordersFact.customerId, schema.customerDim.id)
    }],
    where: eq(schema.ordersFact.organisationId, ctx.securityContext.organisationId)
  }),
      
  // Same dimensions and measures - dashboards still work!
  dimensions: {
    customerSegment: { 
      sql: schema.customerDim.segment, 
      type: 'string' 
    },
    orderDate: { 
      sql: schema.ordersFact.orderDate, 
      type: 'time' 
    }
  },
  
  measures: {
    totalRevenue: { 
      sql: schema.ordersFact.revenue, 
      type: 'sum' 
    },
    orderCount: { 
      sql: schema.ordersFact.id, 
      type: 'count' 
    }
  }
})
```

#### Option B: Hybrid Cube.dev Integration

Move your infra to https://cube.dev and your queries can remain the same.

**Benefits:**
- ✅ Handles billions of rows with sub-second response
- ✅ Advanced features: ML predictions, real-time streaming
- ✅ Your application code remains unchanged
- ✅ Seamless user experience during migration

## Migration Strategies

### 🔄 Zero-Downtime Migration

The key to successful scaling is maintaining your semantic layer interface:

```typescript
// Before: Direct database
const salesCube = defineCube('Sales', {
  sql: (ctx) => ({
    from: schema.orders
  }),
  // ... dimensions and measures
})

// After: Data warehouse - SAME interface!
const salesCube = defineCube('Sales', {
  sql: (ctx) => ({
    from: schema.orders_fact  // Different source
  }),
  // ... SAME dimensions and measures
})
```

### 📊 Gradual Optimization

Optimize cubes one at a time based on usage patterns:

```typescript
// 1. Identify slow cubes
const performanceMetrics = {
  'Sales': { avgQueryTime: 2.3, usage: 'high' },     // Optimize first
  'Users': { avgQueryTime: 0.1, usage: 'medium' },   // Optimize later  
  'Support': { avgQueryTime: 0.5, usage: 'low' }     // Keep as-is
}

// 2. Create optimized version of high-impact cube
export const optimizedSalesCube = defineCube('Sales', {
  sql: (ctx) => ({
    from: schema.sales_summary  // Materialized view
  }),
  // Same interface ensures compatibility
})

// 3. A/B test performance
if (securityContext.features?.optimizedSales) {
  semanticLayer.registerCube(optimizedSalesCube)
} else {
  semanticLayer.registerCube(originalSalesCube)
}
```

## The Power of Abstraction

The semantic layer is your **stable contract** that enables:

- **Frontend Stability**: Dashboards work unchanged across data architecture evolution
- **Team Productivity**: Analysts focus on insights, not infrastructure changes  
- **Business Continuity**: Reports keep working during migrations
- **Gradual Migration**: Upgrade piece by piece without big-bang deployments
- **Cost Optimization**: Right-size your data infrastructure as you grow

## Common Scaling Questions

**Q: When should I start thinking about scaling?**
A: When dashboard queries take >2 seconds or impact your application performance.

**Q: Can I mix different data sources in one semantic layer?**  
A: Yes! Different cubes can use different databases - Drizzle Cube handles the abstraction.

**Q: Will my React dashboards break during migration?**
A: No! As long as cube names and field names stay consistent, dashboards continue working.

**Q: How do I test the new data source before switching?**
A: Use feature flags or environment variables to A/B test cube implementations.

## Next Steps

Ready to scale your analytics?

- **Small SaaS**: Start with [Quick Start](/help/getting-started/quick-start) guide
- **Growing SaaS**: Learn about [Performance](/help/advanced/performance) optimization
- **Enterprise**: Explore [Advanced TypeScript](/help/advanced/typescript) patterns

Remember: **Start simple, scale smart**. Drizzle Cube grows with you! 🚀