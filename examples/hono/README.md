# Drizzle-Cube Hono Example with React Dashboard

A complete full-stack analytics application with [Hono](https://hono.dev/) backend and React frontend using [drizzle-cube](../../README.md). This demonstrates how to create a production-ready semantic layer with type-safe analytics queries and interactive dashboards.

## Features

- 🚀 **Hono web framework** - Fast, lightweight, and built on Web Standards
- ⚛️ **React dashboard** - Interactive analytics dashboards with chart editing
- 🗃️ **Drizzle ORM integration** - Type-safe database operations with PostgreSQL
- 📊 **Cube.js compatibility** - Drop-in replacement for existing Cube.js frontends
- 🔒 **Multi-tenant security** - Organization-based data isolation
- 📈 **Real-time analytics** - Employee and department analytics with joins
- 💾 **Persistent dashboards** - Save and load dashboard configurations
- 🎯 **Type safety** - Full TypeScript support from database to frontend

## Quick Start

### 1. Setup Database

#### Option A: Using Docker Compose (Recommended)

```bash
# Start PostgreSQL with Docker Compose
npm run docker:up

# View logs (optional)
npm run docker:logs
```

This starts:
- **PostgreSQL** on port `54921` (high random port to avoid conflicts)
- **pgAdmin** on port `5050` for database administration

#### Option B: Manual Docker

```bash
# Start PostgreSQL manually
docker run --name drizzle-cube-postgres \
  -e POSTGRES_DB=drizzle_cube_db \
  -e POSTGRES_USER=drizzle_user \
  -e POSTGRES_PASSWORD=drizzle_pass123 \
  -p 54921:5432 \
  -d postgres:15-alpine
```

#### Option C: Use Your Existing PostgreSQL

Update the `DATABASE_URL` in your `.env` file to point to your existing PostgreSQL instance.

### 2. Install Dependencies

```bash
# Install server dependencies
npm install

# Install client dependencies
npm run install:client
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# The default settings work with Docker Compose
# Edit .env only if using a different database setup
```

### 4. Setup Database & Data

#### Quick Setup (All-in-One)

```bash
# Starts Docker, runs migrations, and seeds data
npm run setup
```

#### Manual Steps

```bash
# Generate migrations from schema
npm run db:generate

# Run migrations to create tables
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### 5. Start Development Servers

```bash
# Start both backend and frontend in watch mode
npm run dev:full

# Or start them separately:
# npm run dev:server  # Backend on http://localhost:3001
# npm run dev:client  # Frontend on http://localhost:3000
```

- **React Dashboard**: http://localhost:3000
- **API Server**: http://localhost:3001
- **API Documentation**: http://localhost:3001/api/docs
- **pgAdmin** (if using Docker): http://localhost:5050
  - Email: `admin@drizzlecube.local`
  - Password: `admin123`

## API Endpoints

### Analytics API (Cube.js Compatible)

- **GET /cubejs-api/v1/meta** - Get available cubes and schema
- **POST /cubejs-api/v1/load** - Execute analytics queries
- **GET /cubejs-api/v1/load?query=...** - Execute queries via URL
- **POST /cubejs-api/v1/sql** - Generate SQL without execution

### Dashboard Management API

- **GET /api/analytics-pages** - List all dashboards
- **GET /api/analytics-pages/:id** - Get specific dashboard
- **POST /api/analytics-pages** - Create new dashboard
- **PUT /api/analytics-pages/:id** - Update dashboard
- **DELETE /api/analytics-pages/:id** - Delete dashboard
- **POST /api/analytics-pages/create-example** - Create example dashboard

### Documentation & Health

- **GET /api/docs** - API documentation with examples
- **GET /health** - Health check endpoint

## Example Queries

### Employee Count by Department

```bash
curl -X POST http://localhost:3001/cubejs-api/v1/load \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "measures": ["Employees.count"],
    "dimensions": ["Employees.departmentName"]
  }'
```

### Salary Analytics

```bash
curl -X POST http://localhost:3001/cubejs-api/v1/load \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-token" \
  -d '{
    "measures": ["Employees.avgSalary", "Employees.totalSalary"],
    "dimensions": ["Employees.departmentName"]
  }'
```

### Active Employees with Filters

```bash
curl -X POST http://localhost:3001/cubejs-api/v1/load \
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
├── client/               # React dashboard frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Dashboard pages
│   │   ├── hooks/        # Custom React hooks
│   │   └── types/        # TypeScript types
│   ├── package.json      # Frontend dependencies
│   └── vite.config.ts    # Vite configuration
├── src/
│   ├── index.ts          # Server entry point
│   └── analytics-routes.ts # Dashboard API routes
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
- `analyticsPages` table for storing dashboard configurations
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
- Dashboard management API routes

### `client/`
React dashboard frontend with:
- Interactive analytics dashboards
- Chart editing and configuration
- Dashboard CRUD operations
- Real-time data visualization using drizzle-cube components

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
- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `JWT_SECRET` - JWT signing secret (if using JWT auth)

## Dashboard Usage

### Creating Dashboards

1. **Via React UI**: Visit http://localhost:3000/dashboards and click "New Dashboard"
2. **Via API**: POST to `/api/analytics-pages` with dashboard configuration
3. **Example Dashboard**: Click "Create Example" to generate a sample dashboard

### Dashboard Configuration

Dashboards are stored as JSON configurations with:
```json
{
  "portlets": [
    {
      "id": "unique-id",
      "title": "Chart Title",
      "query": "{\"measures\":[\"Employees.count\"]}",
      "chartType": "pie",
      "chartConfig": { "x": "dimension", "y": ["measure"] },
      "w": 6, "h": 6, "x": 0, "y": 0
    }
  ]
}
```

### Chart Types

Supported chart types:
- `pie` - Pie chart
- `bar` - Bar chart  
- `line` - Line chart
- `area` - Area chart
- `table` - Data table
- `treemap` - Tree map

## Frontend Integration

This API is compatible with Cube.js frontends:

- [@cubejs-client/core](https://cube.dev/docs/frontend-integrations/javascript)
- [@cubejs-client/react](https://cube.dev/docs/frontend-integrations/react)
- [Cube.js Playground](https://cube.dev/docs/dev-tools/dev-playground)
- **drizzle-cube React components** (included in this example)

Simply point your frontend to `http://localhost:3001/cubejs-api/v1` as the API URL.

## Docker Management

### Available Docker Commands

```bash
# Start services
npm run docker:up

# Stop services
npm run docker:down

# View logs
npm run docker:logs

# Reset everything (removes volumes and data)
npm run docker:reset

# Complete setup from scratch
npm run setup
```

### Docker Services

- **PostgreSQL**: `localhost:54921`
  - Database: `drizzle_cube_db`
  - User: `drizzle_user`
  - Password: `drizzle_pass123`

- **pgAdmin**: `localhost:5050`
  - Email: `admin@drizzlecube.local`
  - Password: `admin123`

### Connecting to PostgreSQL

From your host machine:
```bash
psql -h localhost -p 54921 -U drizzle_user -d drizzle_cube_db
```

From pgAdmin:
1. Open http://localhost:5050
2. Login with the credentials above
3. Add server with:
   - Host: `postgres` (Docker network name)
   - Port: `5432` (internal port)
   - Database: `drizzle_cube_db`
   - Username: `drizzle_user`
   - Password: `drizzle_pass123`

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