# Performance

Drizzle Cube is designed for high-performance analytics with multiple optimization strategies built on Drizzle ORM's efficient query generation and execution. This guide covers performance optimization techniques, monitoring, and best practices.

## Overview

Performance in Drizzle Cube is achieved through:
- **Bundle Size Optimization**: Modular imports and tree shaking (see [Bundle Optimization](/help/advanced/bundle-optimization))
- **Drizzle ORM Query Optimization**: Prepared statements and efficient SQL generation
- **Database-Level Optimization**: Proper indexing and query planning
- **Application-Level Caching**: Result set caching and query memoization
- **Smart Query Execution**: Query path resolution and join optimization

## Client Performance

### Bundle Optimization

For detailed information on optimizing client-side bundle sizes, see the dedicated [Bundle Optimization Guide](/help/advanced/bundle-optimization).

**Quick Overview:**
- Use modular imports for smaller bundles
- Import only what you need: `drizzle-cube/client/charts`, `drizzle-cube/client/hooks`, etc.
- Achieve up to 91% bundle size reduction with targeted imports
- Automatic code splitting with optimized chunks

## Database Performance

### Query Optimization

Drizzle Cube generates optimized SQL through Drizzle ORM's query builder:

```typescript
// Efficient query generation
sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
  from: employees,
  joins: [
    {
      table: departments,
      on: eq(employees.departmentId, departments.id), // Uses index
      type: 'left'
    }
  ],
  where: eq(employees.organisationId, ctx.securityContext.organisationId) // Indexed filter
})
```

**Optimization Features:**
- Prepared statements prevent SQL injection and improve performance
- Parameter binding reduces query parsing overhead
- Efficient join ordering based on selectivity
- Automatic WHERE clause optimization

### Database Indexing

Proper indexing is crucial for Drizzle Cube performance:

```sql
-- Essential indexes for multi-tenant security
CREATE INDEX idx_employees_organisation_id ON employees(organisation_id);
CREATE INDEX idx_departments_organisation_id ON departments(organisation_id);
CREATE INDEX idx_productivity_organisation_id ON productivity(organisation_id);

-- Foreign key indexes for joins
CREATE INDEX idx_employees_department_id ON employees(department_id);
CREATE INDEX idx_productivity_employee_id ON productivity(employee_id);

-- Time dimension indexes for time-series queries
CREATE INDEX idx_productivity_date ON productivity(date);
CREATE INDEX idx_employees_created_at ON employees(created_at);

-- Composite indexes for common query patterns
CREATE INDEX idx_employees_org_dept ON employees(organisation_id, department_id);
CREATE INDEX idx_productivity_org_date ON productivity(organisation_id, date);
```

### Query Execution Plans

Monitor and optimize query execution:

```typescript
// Enable query logging for performance analysis
export const performanceTestCube: Cube<Schema> = defineCube('Performance', {
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => {
    // Log query execution time in development
    if (process.env.NODE_ENV === 'development') {
      console.time(`Query: ${ctx.cube.name}`)
    }
    
    return {
      from: largeTable,
      where: and(
        eq(largeTable.organisationId, ctx.securityContext.organisationId),
        // Add selective filters early
        gte(largeTable.createdAt, ctx.query.dateRange?.[0] || '2023-01-01')
      )
    }
  }
})
```

## Application Performance

### Result Set Caching

Drizzle Cube provides basic query memoization. For advanced caching, you can implement additional caching layers:

```typescript
// Client-side caching with useCubeQuery
function CachedQuery() {
  const query = useMemo(() => ({
    measures: ['Employees.count'],
    dimensions: ['Employees.departmentName']
  }), []) // Memoize query to enable caching

  const { resultSet } = useCubeQuery(query) // Automatically cached
}

// Server-side result caching
class CachedSemanticLayer extends SemanticLayerCompiler {
  private cache = new Map<string, { result: any; timestamp: number }>()
  
  async load(query: SemanticQuery, context: SecurityContext) {
    const cacheKey = this.getCacheKey(query, context)
    const cached = this.cache.get(cacheKey)
    
    // Return cached result if fresh (5 minutes)
    if (cached && Date.now() - cached.timestamp < 300000) {
      return cached.result
    }
    
    const result = await super.load(query, context)
    
    this.cache.set(cacheKey, {
      result,
      timestamp: Date.now()
    })
    
    return result
  }
  
  private getCacheKey(query: SemanticQuery, context: SecurityContext): string {
    return `${context.organisationId}:${JSON.stringify(query)}`
  }
}
```

> **Note**: The `CachedSemanticLayer` example above is custom implementation code that you would need to build. Drizzle Cube currently provides basic client-side query memoization but does not include built-in server-side result caching.

### Query Batching

Batch multiple queries for efficiency:

```typescript
// Batch multiple related queries
async function loadDashboardData(
  semanticLayer: SemanticLayerCompiler,
  context: SecurityContext
) {
  // Execute queries in parallel
  const [employeeMetrics, revenueData, productivityStats] = await Promise.all([
    semanticLayer.load({
      measures: ['Employees.count', 'Employees.avgSalary'],
      dimensions: ['Employees.departmentName']
    }, context),
    
    semanticLayer.load({
      measures: ['Orders.totalRevenue'],
      timeDimensions: [{
        dimension: 'Orders.createdAt',
        granularity: 'month'
      }]
    }, context),
    
    semanticLayer.load({
      measures: ['Productivity.avgLinesOfCode'],
      dimensions: ['Productivity.employeeName']
    }, context)
  ])

  return {
    employees: employeeMetrics.rawData(),
    revenue: revenueData.rawData(), 
    productivity: productivityStats.rawData()
  }
}
```

### Connection Pooling

Optimize database connections:

```typescript
// PostgreSQL with connection pooling
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'

const sql = postgres(connectionString, {
  max: 20,              // Maximum connections
  idle_timeout: 20,     // Close connections after 20s idle
  connect_timeout: 10,  // 10s connection timeout
  prepare: true         // Use prepared statements
})

const db = drizzle(sql, { schema })

// Create executor with optimized connection
const executor = createDatabaseExecutor(db, schema, 'postgres')
```

## Frontend Performance

### React Optimization

Optimize React components for better performance:

```tsx
import { memo, useMemo, useCallback } from 'react'

// Memoize chart components
const OptimizedBarChart = memo(RechartsBarChart)

// Memoize expensive calculations
function DashboardCard({ query, config }) {
  const memoizedQuery = useMemo(() => query, [JSON.stringify(query)])
  
  const handleRefresh = useCallback(() => {
    // Handle refresh without recreating function
  }, [])

  const { resultSet, isLoading } = useCubeQuery(memoizedQuery)
  
  return (
    <OptimizedBarChart 
      resultSet={resultSet}
      chartConfig={config}
      onRefresh={handleRefresh}
    />
  )
}
```

### Lazy Loading

Load components and data on demand:

```tsx
import { lazy, Suspense } from 'react'

// Lazy load chart components
const LazyBarChart = lazy(() => 
  import('drizzle-cube/client').then(m => ({ default: m.RechartsBarChart }))
)

// Lazy load heavy dashboards
const LazyDashboard = lazy(() => import('./HeavyDashboard'))

function App() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <LazyBarChart resultSet={resultSet} />
      <LazyDashboard />
    </Suspense>
  )
}
```

### Virtual Scrolling

Handle large datasets efficiently:

```tsx
// Virtual scrolling for large data tables
import { FixedSizeList as List } from 'react-window'

function LargeDataTable({ resultSet }) {
  const data = resultSet.rawData()
  
  const Row = ({ index, style }) => (
    <div style={style}>
      {Object.values(data[index]).join(' | ')}
    </div>
  )

  return (
    <List
      height={400}
      itemCount={data.length}
      itemSize={35}
      overscanCount={5}
    >
      {Row}
    </List>
  )
}
```

## Monitoring and Profiling

### Performance Metrics

Track key performance indicators:

```typescript
// Performance monitoring middleware
class PerformanceMonitor {
  private metrics = new Map<string, number[]>()

  async measureQuery<T>(
    operation: string,
    queryFn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await queryFn()
      const duration = performance.now() - startTime
      
      this.recordMetric(operation, duration)
      
      // Log slow queries
      if (duration > 1000) {
        console.warn(`Slow query detected: ${operation} took ${duration}ms`)
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      console.error(`Query failed: ${operation} after ${duration}ms`, error)
      throw error
    }
  }

  private recordMetric(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, [])
    }
    
    const metrics = this.metrics.get(operation)!
    metrics.push(duration)
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift()
    }
  }

  getAverageTime(operation: string): number {
    const metrics = this.metrics.get(operation)
    if (!metrics || metrics.length === 0) return 0
    
    return metrics.reduce((sum, time) => sum + time, 0) / metrics.length
  }
}
```

### Query Analysis

Analyze query patterns and performance:

```typescript
// Query performance analyzer
class QueryAnalyzer {
  private queryLog: Array<{
    query: SemanticQuery
    context: SecurityContext
    duration: number
    resultSize: number
    timestamp: Date
  }> = []

  logQuery(
    query: SemanticQuery, 
    context: SecurityContext, 
    duration: number, 
    resultSize: number
  ) {
    this.queryLog.push({
      query,
      context,
      duration,
      resultSize,
      timestamp: new Date()
    })

    // Analyze for optimization opportunities
    this.analyzeQuery(query, duration, resultSize)
  }

  private analyzeQuery(query: SemanticQuery, duration: number, resultSize: number) {
    // Flag expensive queries
    if (duration > 5000) {
      console.warn('Expensive query detected:', {
        cubes: query.measures?.map(m => m.split('.')[0]),
        duration,
        resultSize
      })
    }

    // Flag large result sets
    if (resultSize > 10000) {
      console.warn('Large result set:', {
        query,
        resultSize,
        suggestion: 'Consider adding filters or pagination'
      })
    }

    // Suggest optimizations
    if (!query.filters?.length && duration > 1000) {
      console.info('Consider adding filters to improve performance')
    }
  }

  getSlowQueries(threshold: number = 1000) {
    return this.queryLog
      .filter(log => log.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
  }

  getCubeUsageStats() {
    const stats = new Map<string, { count: number; avgDuration: number }>()
    
    this.queryLog.forEach(log => {
      const cubes = log.query.measures?.map(m => m.split('.')[0]) || []
      
      cubes.forEach(cube => {
        if (!stats.has(cube)) {
          stats.set(cube, { count: 0, avgDuration: 0 })
        }
        
        const stat = stats.get(cube)!
        stat.count++
        stat.avgDuration = (stat.avgDuration * (stat.count - 1) + log.duration) / stat.count
      })
    })
    
    return stats
  }
}
```

## Performance Best Practices

### Query Design

1. **Filter Early**: Apply most selective filters first
2. **Limit Results**: Use `limit` and pagination for large datasets
3. **Index Foreign Keys**: Ensure all join columns are indexed
4. **Avoid N+1 Queries**: Use joins instead of separate queries
5. **Time Range Filters**: Always filter time dimensions to reasonable ranges

```typescript
// Good: Selective filtering
const optimizedQuery = {
  measures: ['Employees.count'],
  dimensions: ['Employees.departmentName'],
  filters: [
    { member: 'Employees.isActive', operator: 'equals', values: [true] },
    { member: 'Employees.createdAt', operator: 'inDateRange', values: ['2023-01-01', '2023-12-31'] }
  ],
  limit: 100
}

// Bad: No filtering, potentially large result set
const unoptimizedQuery = {
  measures: ['Employees.count'],
  dimensions: ['Employees.name'] // Could return thousands of rows
}
```

### Database Schema Design

1. **Proper Indexing**: Index all foreign keys and filter columns
2. **Denormalization**: Consider denormalizing for read-heavy workloads
3. **Partitioning**: Partition large tables by date or organization
4. **Statistics**: Keep database statistics up to date

```sql
-- Partitioning example for large time-series data
CREATE TABLE productivity (
    id SERIAL,
    employee_id INTEGER,
    organisation_id UUID,
    date DATE,
    lines_of_code INTEGER,
    -- other columns...
) PARTITION BY RANGE (date);

-- Create partitions
CREATE TABLE productivity_2023 PARTITION OF productivity
    FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');

CREATE TABLE productivity_2024 PARTITION OF productivity
    FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### Application Architecture

1. **Connection Pooling**: Use appropriate pool sizes
2. **Caching Strategy**: Implement multi-level caching
3. **Load Balancing**: Distribute load across multiple instances
4. **Async Processing**: Use background jobs for expensive operations

## Performance Testing

### Load Testing

Test your Drizzle Cube deployment under load:

```typescript
// Load test script example
import { performance } from 'perf_hooks'

async function loadTest() {
  const queries = [
    { measures: ['Employees.count'], dimensions: ['Employees.departmentName'] },
    { measures: ['Orders.totalRevenue'], timeDimensions: [{ dimension: 'Orders.createdAt', granularity: 'month' }] },
    { measures: ['Productivity.avgLinesOfCode'], dimensions: ['Productivity.employeeName'] }
  ]

  const concurrency = 10
  const iterations = 100

  console.log(`Starting load test: ${concurrency} concurrent users, ${iterations} iterations`)

  const startTime = performance.now()
  
  const promises = Array.from({ length: concurrency }, async () => {
    for (let i = 0; i < iterations; i++) {
      const query = queries[i % queries.length]
      await fetch('/cubejs-api/v1/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })
    }
  })

  await Promise.all(promises)
  
  const totalTime = performance.now() - startTime
  const totalRequests = concurrency * iterations
  const requestsPerSecond = totalRequests / (totalTime / 1000)

  console.log(`Load test complete:`)
  console.log(`Total time: ${totalTime}ms`)
  console.log(`Total requests: ${totalRequests}`)
  console.log(`Requests per second: ${requestsPerSecond.toFixed(2)}`)
}
```

### Benchmarking

Compare performance across different configurations:

```typescript
// Benchmark different query patterns
async function benchmarkQueries() {
  const testCases = [
    { name: 'Simple Count', query: { measures: ['Employees.count'] } },
    { name: 'Grouped Count', query: { measures: ['Employees.count'], dimensions: ['Employees.departmentName'] } },
    { name: 'Time Series', query: { measures: ['Employees.count'], timeDimensions: [{ dimension: 'Employees.createdAt', granularity: 'month' }] } },
    { name: 'Multi-Cube', query: { measures: ['Employees.count', 'Departments.totalBudget'] } }
  ]

  for (const testCase of testCases) {
    const times = []
    
    // Run each test 10 times
    for (let i = 0; i < 10; i++) {
      const start = performance.now()
      await semanticLayer.load(testCase.query, securityContext)
      const duration = performance.now() - start
      times.push(duration)
    }

    const avg = times.reduce((sum, time) => sum + time, 0) / times.length
    const min = Math.min(...times)
    const max = Math.max(...times)

    console.log(`${testCase.name}: avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms`)
  }
}
```

## Common Performance Issues

### Issue: Slow Multi-Tenant Queries

**Problem**: Queries are slow when filtering by organization
**Solution**: Add composite indexes on (organisation_id, other_filter_columns)

```sql
CREATE INDEX idx_employees_org_active ON employees(organisation_id, active);
CREATE INDEX idx_productivity_org_date ON productivity(organisation_id, date);
```

### Issue: Large Result Sets

**Problem**: Queries returning thousands of rows cause memory issues
**Solution**: Implement pagination and result limiting

```typescript
// Add pagination to large queries
const paginatedQuery = {
  measures: ['Employees.count'],
  dimensions: ['Employees.name'],
  limit: 50,
  offset: page * 50
}
```

### Issue: Complex Join Performance

**Problem**: Multi-table joins are slow
**Solution**: Optimize join order and add covering indexes

```sql
-- Covering index for common join pattern
CREATE INDEX idx_productivity_employee_lookup 
ON productivity(employee_id, organisation_id) 
INCLUDE (lines_of_code, date);
```

## Next Steps

- Learn about [Troubleshooting](/help/advanced/troubleshooting) common issues
- Explore [TypeScript](/help/advanced/typescript) advanced patterns
- Review database-specific optimization guides
- Set up performance monitoring in production

## Future Performance Features *(Planned for Upcoming Releases)*

The following performance enhancements are planned for future versions of Drizzle Cube:

- **Automatic query optimization suggestions** - AI-powered query analysis
- **Built-in performance monitoring dashboard** - Real-time performance metrics
- **Query execution plan visualization** - Visual query plan analysis
- **Intelligent caching strategies** - Smart pre-computation and cache invalidation
- **Performance regression testing** - Automated performance testing suite
- **Cost-based query optimization** - Advanced query planning algorithms

These features are not currently available but are on our development roadmap.