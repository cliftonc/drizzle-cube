# Troubleshooting

This guide covers common issues, error messages, and debugging techniques for Drizzle Cube. Most problems stem from configuration, security context, database connections, or query construction.

## Common Issues

### Database Connection Issues

#### Error: "Connection timeout"

**Symptoms:**
- Queries hanging or timing out
- Connection pool exhausted errors
- Intermittent database connection failures

**Solutions:**

```typescript
// Check connection configuration
import postgres from 'postgres'

const sql = postgres(connectionString, {
  max: 20,              // Increase pool size if needed
  idle_timeout: 20,     // Reduce if connections are being held
  connect_timeout: 30,  // Increase for slow networks
  debug: process.env.NODE_ENV === 'development' // Enable debugging
})
```

**Debugging Steps:**
1. Test database connection directly
2. Check firewall and network settings
3. Monitor connection pool usage
4. Verify connection string format

```bash
# Test PostgreSQL connection
psql "postgresql://user:password@host:port/database"

# Monitor connection pools
SELECT state, count(*) FROM pg_stat_activity GROUP BY state;
```

#### Error: "Database schema not found"

**Symptoms:**
- Table or column does not exist errors
- Schema-related query failures

**Solutions:**

```typescript
// Ensure schema is properly imported and registered
import * as schema from './schema'
import { drizzle } from 'drizzle-orm/postgres-js'

const db = drizzle(sql, { schema }) // Pass schema to drizzle

// Verify schema registration
const executor = createDatabaseExecutor(db, schema, 'postgres')
console.log('Available tables:', Object.keys(schema))
```

### Security Context Issues

#### Error: "organisationId is required"

**Symptoms:**
- Access denied errors on all queries
- Security context extraction failures
- Multi-tenant isolation problems

**Solutions:**

```typescript
// Ensure security context extraction is correct
export const getSecurityContext = async (c: any): Promise<SecurityContext> => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader) {
    throw new Error('Missing Authorization header')
  }

  // Note: Authorization header is now used as-is (no 'Bearer ' prefix removal needed)
  const token = authHeader
  const user = await validateJWT(token)
  
  if (!user.organisationId) {
    throw new Error('User token missing organisationId')
  }

  return {
    organisationId: user.organisationId, // REQUIRED
    userId: user.id,
    userRole: user.role
  }
}
```

**Debugging Steps:**
1. Log the extracted security context
2. Verify JWT token contains required fields
3. Check token validation logic
4. Test with a known good token

```typescript
// Add debug logging
export const getSecurityContext = async (c: any): Promise<SecurityContext> => {
  try {
    const context = await extractContext(c)
    console.log('Security context:', context) // Debug log
    return context
  } catch (error) {
    console.error('Security context extraction failed:', error)
    throw error
  }
}
```

#### Error: "Access denied"

**Symptoms:**
- Queries returning empty results
- Permission-based errors
- Role-based access failures

**Solutions:**

```typescript
// Check cube-level security filtering
sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => ({
  from: employees,
  // Ensure security context is applied
  where: and(
    eq(employees.organisationId, ctx.securityContext.organisationId),
    // Add role-based filtering if needed
    ctx.securityContext.userRole !== 'admin' 
      ? eq(employees.departmentId, ctx.securityContext.departmentId)
      : sql`true`
  )
})
```

### Query Construction Issues

#### Error: "Invalid query: measures or dimensions required"

**Symptoms:**
- Empty query objects
- Missing required query fields
- Malformed query structure

**Solutions:**

```typescript
// Ensure query has required fields
const validQuery = {
  measures: ['Employees.count'], // At least one measure OR dimension required
  dimensions: [], // Optional but recommended
  filters: [], // Optional
  order: [] // Optional
}

// Validate query before execution
function validateQuery(query: CubeQuery): void {
  if (!query.measures?.length && !query.dimensions?.length) {
    throw new Error('Query must have at least one measure or dimension')
  }
  
  if (!query.measures) {
    query.measures = []
  }
  
  if (!query.dimensions) {
    query.dimensions = []
  }
}
```

#### Error: "Unknown cube member: [CubeName].[field]"

**Symptoms:**
- Reference to non-existent cube or field
- Typos in cube/field names
- Case sensitivity issues

**Solutions:**

```typescript
// Check cube registration
const semanticLayer = new SemanticLayerCompiler({ databaseExecutor: executor })

// Register all cubes
semanticLayer.registerCube(employeesCube)
semanticLayer.registerCube(departmentsCube)
// ... ensure all cubes are registered

// Verify cube names match exactly
console.log('Registered cubes:', semanticLayer.getCubeNames())

// Check field names in cube definitions
export const employeesCube = defineCube('Employees', { // Case-sensitive
  dimensions: {
    name: { // Field name must match query exactly
      name: 'name',
      sql: employees.name
    }
  }
})
```

### Time Dimension Issues

#### Error: "Invalid time dimension format"

**Symptoms:**
- Time formatting errors
- Granularity issues
- Date parsing failures

**Solutions:**

```typescript
// Ensure proper time dimension structure
const query = {
  measures: ['Orders.count'],
  timeDimensions: [{
    dimension: 'Orders.createdAt', // Must match cube definition exactly
    granularity: 'month', // Use valid granularity
    dateRange: ['2023-01-01', '2023-12-31'] // ISO date format
  }]
}

// Valid granularity options
const validGranularities = ['year', 'quarter', 'month', 'week', 'day', 'hour']

// Check date format
function validateDateRange(dateRange: [string, string]): void {
  const [start, end] = dateRange
  
  if (!Date.parse(start) || !Date.parse(end)) {
    throw new Error('Invalid date format. Use ISO format: YYYY-MM-DD')
  }
  
  if (new Date(start) >= new Date(end)) {
    throw new Error('Start date must be before end date')
  }
}
```

#### Error: "Time dimension not displaying correctly"

**Symptoms:**
- Raw timestamps in charts instead of formatted dates
- Incorrect time grouping
- Missing time data

**Solutions:**

```typescript
// Ensure time dimension is defined correctly in cube
dimensions: {
  createdAt: {
    name: 'createdAt',
    title: 'Created Date',
    type: 'time', // Must be 'time' type
    sql: employees.createdAt // Column must be date/timestamp type
  }
}

// Use timeDimensions in queries (not regular dimensions)
const timeSeriesQuery = {
  measures: ['Employees.count'],
  dimensions: [], // Don't put time fields here
  timeDimensions: [{ // Put time fields here
    dimension: 'Employees.createdAt',
    granularity: 'month'
  }]
}
```

## Debugging Techniques

### Enable Debug Logging

Add comprehensive logging to track issues:

```typescript
// Enable SQL query logging
if (process.env.NODE_ENV === 'development') {
  const originalExecute = executor.execute
  executor.execute = async function(query, measureFields) {
    console.log('Executing SQL:', query.toQuery())
    const start = performance.now()
    
    try {
      const result = await originalExecute.call(this, query, measureFields)
      console.log(`Query completed in ${performance.now() - start}ms`)
      return result
    } catch (error) {
      console.error('Query failed:', error)
      throw error
    }
  }
}
```

### Query Analysis

Analyze generated SQL and execution plans:

```typescript
// Log generated queries for analysis
export const debugCube = defineCube('Debug', {
  sql: (ctx: QueryContext<Schema>): BaseQueryDefinition => {
    const query = {
      from: employees,
      where: eq(employees.organisationId, ctx.securityContext.organisationId)
    }
    
    // Log the query context for debugging
    console.log('Cube query context:', {
      cubeName: 'Debug',
      securityContext: ctx.securityContext,
      requestedQuery: ctx.query
    })
    
    return query
  }
})
```

### API Response Format Issues

#### Error: "Cannot read property 'data' of undefined"

**Symptoms:**
- Client fails to read response data
- Undefined response structure errors
- Charts not rendering despite successful API calls

**Solutions:**

The API now returns Cube.js-compatible response format. Update client code:

```typescript
// OLD format (deprecated)
{
  data: [...],
  annotation: {...},
  query: {...}
}

// NEW format (current)
{
  queryType: "regularQuery",
  results: [{
    data: [...],           // Raw data moved to results[0].data
    annotation: {...},     // Annotation moved to results[0].annotation
    query: {...},
    requestId: "...",
    lastRefreshTime: "..."
  }],
  pivotQuery: {...},
  slowQuery: false
}
```

The CubeClient automatically handles both formats, but custom client code needs updates:

```typescript
// Update manual API handling
const response = await fetch('/api/cube/load?query=' + encodeURIComponent(JSON.stringify(query)))
const result = await response.json()

// Handle both old and new response formats
const data = result.results?.[0]?.data || result.data || []
const annotation = result.results?.[0]?.annotation || result.annotation || {}
```

#### Error: "HTTP method not allowed"

**Symptoms:**
- 405 Method Not Allowed errors
- API endpoints returning wrong status codes

**Solutions:**

API endpoints now use different HTTP methods:

```typescript
// OLD: POST with body
fetch('/api/cube/load', {
  method: 'POST',
  body: JSON.stringify({ query })
})

// NEW: GET with query parameter
const queryParam = encodeURIComponent(JSON.stringify(query))
fetch(`/api/cube/load?query=${queryParam}`, {
  method: 'GET'
})

// SQL endpoint also uses GET now
fetch(`/api/cube/sql?query=${queryParam}`, {
  method: 'GET'
})

// New dry-run endpoint uses POST
fetch('/api/cube/dry-run', {
  method: 'POST',
  body: JSON.stringify({ query })
})
```

### Network Debugging

Debug API communication issues:

```typescript
// Client-side debugging with updated CubeClient
import { CubeClient } from 'drizzle-cube/client'

const cubeClient = new CubeClient('your-token', {
  apiUrl: '/api/cube',
  headers: {
    'X-Organisation-ID': '1'
  }
})

// Test different endpoints
try {
  // Test load endpoint (GET method)
  const result = await cubeClient.load(query)
  console.log('Load result:', result.rawData())
  
  // Test SQL generation (GET method)  
  const sqlResult = await cubeClient.sql(query)
  console.log('Generated SQL:', sqlResult)
  
  // Test dry run (POST method)
  const dryRunResult = await cubeClient.dryRun(query)
  console.log('Dry run result:', dryRunResult)
  
} catch (error) {
  console.error('API Error:', error.message)
  
  // Enhanced error logging
  if (error.response) {
    console.error('Response status:', error.response.status)
    console.error('Response headers:', error.response.headers)
  }
}
```

## Error Reference

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `organisationId is required` | Missing security context | Check JWT token and extraction logic |
| `Unknown cube member` | Typo in cube/field name | Verify exact names and registration |
| `Connection timeout` | Database connection issue | Check connection string and network |
| `Access denied` | Security context/permissions | Verify security filtering and roles |
| `Invalid date format` | Wrong date string format | Use ISO format: YYYY-MM-DD |
| `Table does not exist` | Schema not found | Check Drizzle schema import and registration |
| `Cannot read property 'data'` | Old response format handling | Update to use results[0].data format |
| `HTTP method not allowed` | Wrong HTTP method | Use GET for /load and /sql, POST for /dry-run |
| `Dry run failed` | Query validation error | Check query structure and cube references |

### HTTP Status Codes

| Status | Meaning | Common Causes |
|--------|---------|---------------|
| 400 | Bad Request | Invalid query structure, missing fields |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | Insufficient permissions for data access |
| 404 | Not Found | API endpoint not found, routing issue |
| 500 | Internal Error | Database connection, code errors |

## Development Debugging

### Test Environment Setup

Set up a debugging-friendly test environment:

```typescript
// test-setup.ts
import { SemanticLayerCompiler } from 'drizzle-cube/server'
import { createTestDatabase } from './helpers/test-database'

// Create test environment with debugging
export async function setupTestEnvironment() {
  const { db, schema } = await createTestDatabase()
  
  const executor = createDatabaseExecutor(db, schema, 'postgres')
  const semanticLayer = new SemanticLayerCompiler({ 
    databaseExecutor: executor,
    debug: true // Enable debug mode
  })

  // Add debug logging
  const originalLoad = semanticLayer.load
  semanticLayer.load = async function(query, context) {
    console.log('Test Query:', JSON.stringify(query, null, 2))
    console.log('Test Context:', context)
    
    try {
      const result = await originalLoad.call(this, query, context)
      console.log('Test Result Count:', result.rawData().length)
      return result
    } catch (error) {
      console.error('Test Query Failed:', error)
      throw error
    }
  }

  return { semanticLayer, db, schema }
}
```

### IDE Debugging

Set up debugger for step-through debugging:

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Drizzle Cube",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "env": {
        "NODE_ENV": "development",
        "DEBUG": "drizzle-cube:*"
      },
      "runtimeArgs": ["-r", "ts-node/register"],
      "sourceMaps": true,
      "cwd": "${workspaceFolder}",
      "protocol": "inspector",
      "restart": true,
      "console": "integratedTerminal"
    }
  ]
}
```

## Production Debugging

### Health Check Endpoints

Implement health checks for production monitoring:

```typescript
// Health check route
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await db.execute(sql`SELECT 1`)
    
    // Test cube compilation
    const testContext = { organisationId: 'health-check' }
    const cubes = await semanticLayer.getMetadata(testContext)
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      cubes: cubes.length,
      version: process.env.npm_package_version
    })
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
})
```

### Error Monitoring

Set up error tracking and alerting:

```typescript
// Error monitoring middleware
import * as Sentry from '@sentry/node'

export function errorHandler(error: Error, req: any, res: any, next: any) {
  // Log error details
  console.error('Drizzle Cube Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: req.user?.id,
    timestamp: new Date().toISOString()
  })

  // Send to error tracking service
  Sentry.captureException(error, {
    tags: {
      component: 'drizzle-cube',
      url: req.url
    },
    user: {
      id: req.user?.id,
      org: req.user?.organisationId
    }
  })

  // Return user-friendly error
  res.status(500).json({
    error: 'Internal server error',
    id: Sentry.lastEventId() // For tracking
  })
}
```

## Getting Help

### Diagnostic Information

When reporting issues, include:

1. **Environment Information:**
   - Node.js version
   - Database type and version
   - Drizzle Cube version
   - Operating system

2. **Query Information:**
   - Complete query object
   - Security context (sanitized)
   - Expected vs. actual results

3. **Error Details:**
   - Complete error message and stack trace
   - SQL query (if available)
   - Steps to reproduce

```typescript
// Generate diagnostic report
function generateDiagnosticReport() {
  return {
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      drizzleCubeVersion: require('../package.json').version
    },
    database: {
      type: 'postgresql', // or mysql, sqlite
      version: 'SELECT version()' // Run this query
    },
    lastError: {
      message: 'Copy error message here',
      stack: 'Copy stack trace here'
    },
    queryExample: {
      // Include problematic query
    }
  }
}
```

### Community Resources

- **GitHub Issues**: https://github.com/cliftonc/drizzle-cube/issues
- **Documentation**: Check help site for examples
- **Database Documentation**: Refer to Drizzle ORM docs

## Next Steps

- Review [Performance](/help/advanced/performance) optimization techniques
- Learn about [TypeScript](/help/advanced/typescript) advanced patterns
- Check the repository for example implementations
- Set up proper monitoring and logging

## Roadmap Ideas

- Automatic error detection and suggestions
- Built-in debugging tools and query analyzer
- Performance profiling and optimization recommendations
- Interactive troubleshooting guide
- Error tracking integration templates