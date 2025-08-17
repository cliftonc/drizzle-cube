# Drizzle-Cube Hono Example

A complete example of building an analytics API with [Hono](https://hono.dev/) and [drizzle-cube](../../README.md). This demonstrates how to create a production-ready semantic layer with type-safe analytics queries.

## Features

- 🚀 **Hono web framework** - Fast, lightweight, and built on Web Standards
- 🗃️ **Drizzle ORM integration** - Type-safe database operations with PostgreSQL
- 📊 **Cube.js compatibility** - Drop-in replacement for existing Cube.js frontends
- 🔒 **Multi-tenant security** - Organization-based data isolation
- 📈 **Real-time analytics** - Employee and department analytics with joins
- 🎯 **Type safety** - Full TypeScript support from database to API

## Quick Start

### 1. Setup Database

```bash
# Start PostgreSQL (using Docker)
docker run --name postgres \
  -e POSTGRES_DB=mydb \
  -e POSTGRES_USER=user \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Or use your existing PostgreSQL instance
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your database connection details
```

### 4. Run Migrations & Seed Data

```bash
# Generate and run migrations
npm run db:generate
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The server will start on http://localhost:3000

## API Endpoints

### Analytics API (Cube.js Compatible)

- **GET /cubejs-api/v1/meta** - Get available cubes and schema
- **POST /cubejs-api/v1/load** - Execute analytics queries
- **GET /cubejs-api/v1/load?query=...** - Execute queries via URL
- **POST /cubejs-api/v1/sql** - Generate SQL without execution

### Documentation & Health

- **GET /api/docs** - API documentation with examples
- **GET /health** - Health check endpoint

## Example Queries

### Employee Count by Department

```bash
curl -X POST http://localhost:3000/cubejs-api/v1/load \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "measures": ["Employees.count"],
    "dimensions": ["Employees.departmentName"]
  }'
```

### Salary Analytics

```bash
curl -X POST http://localhost:3000/cubejs-api/v1/load \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "measures": ["Employees.avgSalary", "Employees.totalSalary"],
    "dimensions": ["Employees.departmentName"]
  }'
```

### Active Employees with Filters

```bash
curl -X POST http://localhost:3000/cubejs-api/v1/load \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "measures": ["Employees.activeCount"],
    "dimensions": ["Employees.departmentName"],
    "filters": [{
      "member": "Employees.isActive",
      "operator": "equals",
      "values": [true]
    }]
  }'
```

## Project Structure

```
examples/hono/
├── src/
│   └── index.ts          # Server entry point
├── scripts/
│   ├── migrate.ts        # Database migration runner
│   └── seed.ts           # Sample data seeder
├── app.ts                # Main Hono application
├── schema.ts             # Drizzle database schema
├── cubes.ts              # Analytics cube definitions
├── drizzle.config.ts     # Drizzle configuration
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## Key Files Explained

### `schema.ts`
Defines the database schema using Drizzle ORM:
- `employees` table with salary, department, and organization
- `departments` table with budget information
- Proper relations for type inference

### `cubes.ts`
Defines analytics cubes with type safety:
- `employeesCube` - Employee analytics with department joins
- `departmentsCube` - Department-level budget analytics
- Security context integration for multi-tenant isolation

### `app.ts`
Main Hono application with:
- Drizzle-cube integration
- Security context extraction
- CORS configuration
- Error handling
- API documentation endpoint

## Security

This example implements organization-based multi-tenancy:

1. **Security Context**: Extracted from Authorization header
2. **Data Isolation**: All queries filtered by `organisationId`
3. **SQL Injection Protection**: Drizzle ORM parameterized queries
4. **Type Safety**: Full TypeScript validation

## Customization

### Adding New Cubes

1. Define new tables in `schema.ts`
2. Create cube definitions in `cubes.ts`
3. Register cubes in `app.ts`
4. Run migrations: `npm run db:generate && npm run db:migrate`

### Custom Security Context

Modify the `getSecurityContext` function in `app.ts` to integrate with your authentication system:

```typescript
async function getSecurityContext(c: any): Promise<SecurityContext> {
  // Your auth logic here
  const user = await validateJWT(c.req.header('Authorization'))
  
  return {
    organisationId: user.orgId,
    userId: user.id,
    roles: user.roles // Add custom fields
  }
}
```

### Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - JWT signing secret (if using JWT auth)

## Frontend Integration

This API is compatible with Cube.js frontends:

- [@cubejs-client/core](https://cube.dev/docs/frontend-integrations/javascript)
- [@cubejs-client/react](https://cube.dev/docs/frontend-integrations/react)
- [Cube.js Playground](https://cube.dev/docs/dev-tools/dev-playground)

Simply point your frontend to `http://localhost:3000/cubejs-api/v1` as the API URL.

## Production Deployment

1. **Environment**: Set `NODE_ENV=production`
2. **Database**: Use managed PostgreSQL (AWS RDS, etc.)
3. **Security**: Implement proper JWT validation
4. **Monitoring**: Add logging and metrics
5. **Scaling**: Use load balancers and connection pooling

## Learn More

- [Drizzle-Cube Documentation](../../README.md)
- [Hono Documentation](https://hono.dev/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Cube.js Documentation](https://cube.dev/docs/)