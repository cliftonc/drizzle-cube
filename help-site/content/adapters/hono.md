# Hono Adapter

The Hono adapter provides a complete [Cube.js](https://cube.dev)-compatible API for the [Hono](https://hono.dev) web framework, making it easy to add analytics capabilities to your Hono applications.

## Installation

```bash
npm install drizzle-cube hono drizzle-orm
```

## Quick Start

```typescript
import { Hono } from 'hono';
import { createCubeApp } from 'drizzle-cube/adapters/hono';
import { SemanticLayerCompiler, createDatabaseExecutor } from 'drizzle-cube/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { salesCube } from './cubes';

// Database connection
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// Create semantic layer
const databaseExecutor = createDatabaseExecutor(db, schema, 'postgres');
const semanticLayer = new SemanticLayerCompiler({ databaseExecutor });
semanticLayer.registerCube(salesCube);

// Create main Hono app
const app = new Hono();

// Authentication middleware
app.use('/api/cube/*', async (c, next) => {
  const token = c.req.header('Authorization');
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  // Validate token and set user context
  const user = await validateToken(token);
  c.set('user', user);
  await next();
});

// Create and mount Cube API
const cubeApp = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  getSecurityContext: async (c) => {
    const user = c.get('user');
    return {
      organisationId: user.organisationId,
      userId: user.id,
      roles: user.roles
    };
  }
});

app.route('/api/cube', cubeApp);

export default app;
```

## Configuration Options

### Basic Configuration

```typescript
const cubeApp = createCubeApp({
  // Required
  semanticLayer: semanticLayerInstance,
  drizzle: dbInstance,
  schema: schemaObject,
  getSecurityContext: async (c) => ({ /* context */ }),
  
  // Optional
  corsOptions: {
    origin: ['http://localhost:3000'],
    credentials: true
  },
  
  enablePlayground: process.env.NODE_ENV === 'development',
  
  queryTimeout: 30000, // 30 seconds
  
  onError: (error, c) => {
    console.error('Cube API Error:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});
```

### Advanced Configuration

```typescript
const cubeApp = createCubeApp({
  semanticLayer,
  drizzle: db,
  schema,
  
  getSecurityContext: async (c) => {
    const user = c.get('user');
    const tenant = c.req.header('X-Tenant-ID');
    
    return {
      organisationId: parseInt(tenant!),
      userId: user.id,
      roles: user.roles,
      permissions: user.permissions,
      // Custom context
      region: user.region,
      hasRole: (role: string) => user.roles.includes(role)
    };
  },
  
  // Custom middleware for all cube routes
  middleware: [
    // Rate limiting
    async (c, next) => {
      const userId = c.get('user')?.id;
      if (await isRateLimited(userId)) {
        return c.json({ error: 'Rate limited' }, 429);
      }
      await next();
    },
    
    // Audit logging
    async (c, next) => {
      const start = Date.now();
      await next();
      const duration = Date.now() - start;
      
      await logQuery({
        userId: c.get('user')?.id,
        path: c.req.path,
        duration,
        status: c.res.status
      });
    }
  ],
  
  // Transform queries before execution
  queryTransform: async (query, context) => {
    // Add automatic filters based on user
    if (context.hasRole('sales')) {
      query.filters = query.filters || [];
      query.filters.push({
        member: 'Sales.salesPersonId',
        operator: 'equals',
        values: [context.userId.toString()]
      });
    }
    
    return query;
  }
});
```

## API Endpoints

The Hono adapter provides these [Cube.js](https://cube.dev)-compatible endpoints:

### Load Data
```http
GET /api/cube/load?query=%7B%22measures%22%3A%5B%22Sales.totalRevenue%22%5D%2C%22dimensions%22%3A%5B%22Sales.productCategory%22%5D%2C%22timeDimensions%22%3A%5B%7B%22dimension%22%3A%22Sales.orderDate%22%2C%22granularity%22%3A%22month%22%7D%5D%7D
```

Or with decoded query parameter:
```http
GET /api/cube/load?query={"measures":["Sales.totalRevenue"],"dimensions":["Sales.productCategory"],"timeDimensions":[{"dimension":"Sales.orderDate","granularity":"month"}]}
```

**Response Format:**
```json
{
  "queryType": "regularQuery",
  "results": [{
    "query": {
      "measures": ["Sales.totalRevenue"],
      "dimensions": ["Sales.productCategory"],
      "timeDimensions": [{"dimension": "Sales.orderDate", "granularity": "month"}]
    },
    "lastRefreshTime": "2024-01-15T10:30:00.000Z",
    "usedPreAggregations": {},
    "transformedQuery": {
      "measures": ["Sales.totalRevenue"],
      "dimensions": ["Sales.productCategory"],
      "timeDimensions": [{"dimension": "Sales.orderDate", "granularity": "month"}]
    },
    "requestId": "1705312200000-abc123",
    "annotation": {
      "measures": {
        "Sales.totalRevenue": {
          "title": "Total Revenue",
          "type": "number",
          "drillMembers": []
        }
      },
      "dimensions": {
        "Sales.productCategory": {
          "title": "Product Category",
          "type": "string"
        }
      }
    },
    "dataSource": "default",
    "dbType": "postgres",
    "extDbType": "postgres",
    "external": false,
    "slowQuery": false,
    "data": [
      {
        "Sales.totalRevenue": "12500.00",
        "Sales.productCategory": "Electronics",
        "Sales.orderDate": "2024-01-01T00:00:00.000Z"
      }
    ]
  }],
  "pivotQuery": {
    "measures": ["Sales.totalRevenue"],
    "dimensions": ["Sales.productCategory"],
    "timeDimensions": [{"dimension": "Sales.orderDate", "granularity": "month"}],
    "queryType": "regularQuery"
  },
  "slowQuery": false
}
```

### Get Metadata
```http
GET /api/cube/meta
```

Returns available cubes, dimensions, and measures.

### Execute SQL
```http
GET /api/cube/sql?query=%7B%22measures%22%3A%5B%22Sales.totalRevenue%22%5D%2C%22dimensions%22%3A%5B%22Sales.productCategory%22%5D%7D
```

Or with decoded query parameter:
```http
GET /api/cube/sql?query={"measures":["Sales.totalRevenue"],"dimensions":["Sales.productCategory"]}
```

Returns the generated SQL without executing it.

**Response Format:**
```json
{
  "queryType": "regularQuery",
  "results": [{
    "query": {
      "measures": ["Sales.totalRevenue"],
      "dimensions": ["Sales.productCategory"]
    },
    "lastRefreshTime": "2024-01-15T10:30:00.000Z",
    "usedPreAggregations": {},
    "transformedQuery": {
      "measures": ["Sales.totalRevenue"],
      "dimensions": ["Sales.productCategory"]
    },
    "requestId": "1705312200000-def456",
    "annotation": {
      "measures": {
        "Sales.totalRevenue": {
          "title": "Total Revenue",
          "type": "number",
          "drillMembers": []
        }
      },
      "dimensions": {
        "Sales.productCategory": {
          "title": "Product Category",
          "type": "string"
        }
      }
    },
    "dataSource": "default",
    "dbType": "postgres",
    "extDbType": "postgres",
    "external": false,
    "slowQuery": false,
    "sql": "SELECT \"products\".\"category\" AS \"Sales.productCategory\", SUM(\"sales\".\"amount\") AS \"Sales.totalRevenue\" FROM \"sales\" LEFT JOIN \"products\" ON \"sales\".\"product_id\" = \"products\".\"id\" WHERE \"sales\".\"organisation_id\" = $1 GROUP BY \"products\".\"category\""
  }],
  "pivotQuery": {
    "measures": ["Sales.totalRevenue"],
    "dimensions": ["Sales.productCategory"],
    "queryType": "regularQuery"
  },
  "slowQuery": false
}
```

### Query Validation
```http
POST /api/cube/validate
Content-Type: application/json

{
  "query": {
    "measures": ["Sales.totalRevenue"],
    "dimensions": ["InvalidDimension"]
  }
}
```

### Dry Run (SQL Generation Only)
```http
POST /api/cube/dry-run
Content-Type: application/json

{
  "query": {
    "measures": ["Sales.totalRevenue"],
    "dimensions": ["Sales.productCategory"]
  }
}
```

Returns the generated SQL and query metadata without executing the query. Useful for debugging and query optimization.

## Security Context

The `getSecurityContext` function is crucial for multi-tenant security:

```typescript
getSecurityContext: async (c) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '');
  const user = await verifyJWT(token);
  
  // Extract tenant from subdomain
  const host = c.req.header('Host');
  const subdomain = host?.split('.')[0];
  const tenant = await getTenantBySubdomain(subdomain);
  
  return {
    organisationId: tenant.id,
    userId: user.id,
    roles: user.roles,
    permissions: user.permissions,
    
    // Custom helpers
    hasRole: (role: string) => user.roles.includes(role),
    hasPermission: (permission: string) => user.permissions.includes(permission),
    
    // Regional filtering
    region: user.region,
    allowedRegions: user.allowedRegions
  };
}
```

## Authentication Patterns

### JWT Authentication

```typescript
import { jwt } from 'hono/jwt';

app.use('/api/cube/*', jwt({
  secret: process.env.JWT_SECRET!,
  cookie: 'auth-token' // Optional: read from cookie
}));

app.use('/api/cube/*', async (c, next) => {
  const payload = c.get('jwtPayload');
  const user = await getUserById(payload.sub);
  c.set('user', user);
  await next();
});
```

### API Key Authentication

```typescript
app.use('/api/cube/*', async (c, next) => {
  const apiKey = c.req.header('X-API-Key');
  if (!apiKey) {
    return c.json({ error: 'API key required' }, 401);
  }
  
  const client = await validateApiKey(apiKey);
  if (!client) {
    return c.json({ error: 'Invalid API key' }, 401);
  }
  
  c.set('client', client);
  await next();
});
```

### Session-based Authentication

```typescript
import { getCookie } from 'hono/cookie';

app.use('/api/cube/*', async (c, next) => {
  const sessionId = getCookie(c, 'session_id');
  if (!sessionId) {
    return c.json({ error: 'Not authenticated' }, 401);
  }
  
  const session = await getSession(sessionId);
  if (!session || session.expired) {
    return c.json({ error: 'Session expired' }, 401);
  }
  
  c.set('user', session.user);
  await next();
});
```

## Error Handling

### Custom Error Handler

```typescript
const cubeApp = createCubeApp({
  // ... other options
  
  onError: (error, c) => {
    console.error('Cube API Error:', {
      error: error.message,
      stack: error.stack,
      user: c.get('user')?.id,
      query: c.req.json(),
      timestamp: new Date().toISOString()
    });
    
    // Don't expose internal errors to clients
    if (process.env.NODE_ENV === 'production') {
      return c.json({ 
        error: 'An error occurred processing your request',
        requestId: generateRequestId()
      }, 500);
    }
    
    return c.json({ 
      error: error.message,
      stack: error.stack
    }, 500);
  }
});
```

### Query Timeout

```typescript
const cubeApp = createCubeApp({
  // ... other options
  queryTimeout: 60000, // 60 seconds
  
  onTimeout: (c) => {
    return c.json({
      error: 'Query timeout',
      message: 'The query took too long to execute. Try reducing the date range or adding filters.'
    }, 408);
  }
});
```

## Caching

### Query Result Caching

```typescript
import { cache } from 'hono/cache';

// Cache GET requests for 5 minutes
app.get('/api/cube/meta', cache({
  cacheName: 'cube-meta',
  cacheControl: 'max-age=300'
}));

// Custom caching logic
app.use('/api/cube/load', async (c, next) => {
  const query = await c.req.json();
  const cacheKey = generateCacheKey(query, c.get('user'));
  
  const cached = await getFromCache(cacheKey);
  if (cached) {
    return c.json(cached);
  }
  
  await next();
  
  // Cache the response
  const response = await c.res.json();
  await setCache(cacheKey, response, 300); // 5 minutes
});
```

## Development Tools

### Cube Playground

Enable the playground in development:

```typescript
const cubeApp = createCubeApp({
  // ... other options
  enablePlayground: process.env.NODE_ENV === 'development'
});

// Access at: http://localhost:3000/api/cube/playground
```

### Query Logging

```typescript
app.use('/api/cube/*', async (c, next) => {
  if (process.env.NODE_ENV === 'development') {
    const query = c.req.method === 'POST' ? await c.req.json() : null;
    console.log('Cube Query:', {
      method: c.req.method,
      path: c.req.path,
      query,
      user: c.get('user')?.id
    });
  }
  
  await next();
});
```

## Deployment

### Cloudflare Workers

```typescript
// src/worker.ts
import app from './server';

export default {
  fetch: app.fetch
};

// wrangler.toml
[env.production]
vars = { NODE_ENV = "production" }

[[env.production.bindings]]
name = "DATABASE_URL"
type = "secret"
```

### Node.js Server

```typescript
import { serve } from '@hono/node-server';
import app from './server';

const port = process.env.PORT || 3000;

serve({
  fetch: app.fetch,
  port: Number(port)
});

console.log(`Server running on port ${port}`);
```

### Vercel

```typescript
// api/cube/[...path].ts
import { handle } from '@hono/vercel';
import app from '../../src/server';

export default handle(app);
```

## Next Steps

- [**Custom Adapters**](/help/adapters/custom) - Build adapters for other frameworks
- [**Security**](/help/semantic-layer/security) - Advanced security patterns  
- [**Performance**](/help/advanced/performance) - Optimization techniques