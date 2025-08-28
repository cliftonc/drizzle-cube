# SingleStore Integration Example

This example demonstrates how to use drizzle-cube with SingleStore database.

## Setup

First, install the required dependencies:

```bash
npm install drizzle-orm mysql2
npm install drizzle-cube
```

## SingleStore Connection

```typescript
import { drizzle } from "drizzle-orm/singlestore";
import mysql from "mysql2/promise";
import { SemanticLayerCompiler, defineCube } from 'drizzle-cube/server';

// Create SingleStore connection
const connection = await mysql.createConnection({
  host: 'your-singlestore-host',
  port: 3306,
  user: 'your-username', 
  password: 'your-password',
  database: 'your-database',
  ssl: {} // Configure SSL as needed
});

const db = drizzle({ client: connection });
```

## Schema Definition

```typescript
import { mysqlTable, int, varchar, timestamp, decimal } from 'drizzle-orm/mysql-core';

export const employees = mysqlTable('employees', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  departmentId: int('department_id').notNull(),
  organisationId: varchar('organisation_id', { length: 50 }).notNull(),
  salary: decimal('salary', { precision: 10, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow()
});
```

## Semantic Layer Setup

```typescript
// Create semantic layer compiler with explicit SingleStore engine type
const compiler = new SemanticLayerCompiler({
  drizzle: db,
  schema: { employees },
  engineType: 'singlestore'  // Explicitly specify SingleStore
});

// Define cube with security context filtering
const employeesCube = defineCube({
  name: 'Employees',
  // REQUIRED: Security context filtering for multi-tenant isolation
  sql: (securityContext) => eq(employees.organisationId, securityContext.organisationId),
  
  measures: {
    count: {
      type: 'count',
      sql: () => employees.id
    },
    averageSalary: {
      type: 'avg',
      sql: () => employees.salary
    },
    totalSalary: {
      type: 'sum', 
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
    departmentId: {
      type: 'number',
      sql: () => employees.departmentId
    },
    createdAt: {
      type: 'time',
      sql: () => employees.createdAt
    }
  }
});

// Register the cube
compiler.registerCube(employeesCube);
```

## Query Execution

```typescript
// Execute queries with security context
const securityContext = {
  organisationId: 'org-123',
  userId: 'user-456'
};

// Simple count query
const countResult = await compiler.query({
  measures: ['Employees.count']
}, securityContext);

console.log('Employee count:', countResult.data[0]['Employees.count']);

// Aggregation query with time dimension
const salaryByMonth = await compiler.query({
  measures: ['Employees.averageSalary', 'Employees.count'],
  timeDimensions: [{
    dimension: 'Employees.createdAt',
    granularity: 'month',
    dateRange: ['2024-01-01', '2024-12-31']
  }]
}, securityContext);

console.log('Salary by month:', salaryByMonth.data);
```

## Express Integration

```typescript
import express from 'express';
import { createCubeApi } from 'drizzle-cube/adapters/express';

const app = express();
app.use(express.json());

// Create Cube API with SingleStore
const cubeApi = createCubeApi({
  extractSecurityContext: async (req) => ({
    organisationId: req.headers['x-organisation-id'] as string,
    userId: req.headers['x-user-id'] as string
  }),
  semanticLayer: compiler
});

app.use('/cubejs-api/v1', cubeApi);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
  console.log('SingleStore analytics API: http://localhost:3000/cubejs-api/v1/meta');
});
```

## SingleStore-Specific Notes

### Compatibility
- SingleStore is largely MySQL-compatible and uses the MySQL wire protocol
- Most MySQL SQL syntax works unchanged in SingleStore
- drizzle-cube treats SingleStore queries similarly to MySQL queries

### Known Limitations
- ORDER BY and LIMIT cannot be chained together in some contexts
- Nested selects with aggregation functions are not supported
- Serial column type only assures uniqueness of values

### Performance Benefits
- SingleStore's distributed architecture provides high-performance analytics
- Columnar storage optimizes analytical queries
- Real-time data ingestion capabilities
- Horizontal scalability for large datasets

## Auto-Detection

If you don't specify the engine type, drizzle-cube will auto-detect based on the Drizzle instance. However, for SingleStore, it's recommended to explicitly specify `engineType: 'singlestore'` to ensure optimal SQL generation.

```typescript
// Auto-detection (may fall back to MySQL)
const compiler = new SemanticLayerCompiler({
  drizzle: db,
  schema
});

// Explicit (recommended for SingleStore)
const compiler = new SemanticLayerCompiler({
  drizzle: db,
  schema,
  engineType: 'singlestore'
});
```

This ensures that drizzle-cube uses SingleStore-specific optimizations and properly handles any SingleStore-specific behaviors.