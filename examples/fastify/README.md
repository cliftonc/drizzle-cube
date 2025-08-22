# Drizzle Cube Fastify Example

A minimal Fastify application demonstrating drizzle-cube integration with a simple analytics dashboard.

## Features

- **Fastify Backend**: Simple server using drizzle-cube Fastify adapter
- **React Frontend**: Two-tab interface with dashboard and query builder
- **PostgreSQL Database**: Self-contained with Docker
- **Sample Data**: Employee and productivity analytics

## Quick Start

```bash
# Install dependencies
npm install

# Setup database and seed data
npm run setup

# Start development servers (Fastify on :4011, React on :4010)
npm run dev
```

Visit:
- **Frontend Dashboard**: http://localhost:4010
- **Cube API**: http://localhost:4011/cubejs-api/v1/meta

## Prerequisites

- **Node.js** 18+ 
- **Docker** (for PostgreSQL)
- **npm** or **yarn**

## Troubleshooting

### Common Issues

1. **Port conflicts**: If ports 4010/4011 are in use, update them in:
   - `server.ts` (line 14)
   - `client/vite.config.ts` (lines 7 and 10)

2. **Database connection errors**: Ensure PostgreSQL is running:
   ```bash
   npm run docker:up
   ```

3. **Static file errors**: The Fastify static plugin requires absolute paths, which are handled automatically via `import.meta.url`

4. **tsx issues**: If tsx fails to run, try:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## Architecture

### Backend (`server.ts`)
- Fastify server with drizzle-cube Fastify plugin
- Plugin-based architecture with async initialization
- Simple security context (demo org/user)
- Cube API endpoints at `/cubejs-api/v1/*`
- Auto-detection for Neon vs local PostgreSQL

### Frontend (`client/`)
- React app with Vite (port 4010)
- Vite proxy forwards `/cubejs-api/*` to backend (port 4011)
- Two tabs: Dashboard view and Query Builder
- Uses `drizzle-cube/client` components with proper CSS imports
- Includes react-grid-layout and recharts for dashboard functionality

### Database
- PostgreSQL in Docker (port 54923)
- Sample employee, department, and productivity data
- Drizzle ORM for type-safe queries

## Available Scripts

```bash
npm run dev          # Start both server and client
npm run dev:server   # Server only (port 4011)
npm run dev:client   # Client only (port 4010)
npm run build        # Build for production
npm start            # Run production build

# Database
npm run setup        # Full setup (Docker + migrate + seed)
npm run docker:up    # Start PostgreSQL
npm run docker:down  # Stop PostgreSQL
npm run db:migrate   # Run migrations
npm run db:seed      # Seed sample data
```

## Dashboard

The example includes an editable 4-chart dashboard:

1. **Employees by Department** (Bar Chart)
2. **Productivity Trend** (Line Chart) 
3. **Team Happiness Distribution** (Pie Chart)
4. **Productivity by Department** (Bar Chart)

### Dashboard Editing
- Click "Edit Dashboard" to enable edit mode
- Drag charts to rearrange layout
- Resize charts using corner handles
- Edit individual chart settings
- Changes are automatically saved to localStorage
- Click "Reset" to restore default configuration

**Note**: This example uses localStorage for simplicity. In a production application, you would typically:
- Save dashboard configurations to your database
- Implement user-specific dashboard storage
- Add sharing and versioning capabilities
- Use proper authentication to control edit permissions

## Query Builder

Interactive query builder for:
- Selecting measures and dimensions
- Adding time dimensions with granularity
- Applying filters
- Live query execution

## API Examples

```bash
# Get cube metadata
curl http://localhost:4011/cubejs-api/v1/meta

# Execute a query
curl -X POST http://localhost:4011/cubejs-api/v1/load \
  -H "Content-Type: application/json" \
  -d '{
    "measures": ["Employees.count"],
    "dimensions": ["Departments.name"],
    "cubes": ["Employees", "Departments"]
  }'
```

## Customization

- **Add Charts**: Modify `client/src/dashboard-config.ts` for default dashboard
- **Add Cubes**: Update `cubes.ts` and register in server
- **Styling**: Edit Tailwind classes in React components or extend drizzle-cube CSS
- **Security**: Implement real authentication in `extractSecurityContext`
- **API Proxy**: Modify `client/vite.config.ts` proxy settings if needed
- **Dashboard Persistence**: Replace localStorage with database storage for production use

### Production Dashboard Storage

For a real application, implement dashboard persistence like the Hono example:

```typescript
// Add to your schema
export const dashboards = pgTable('dashboards', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  config: jsonb('config').notNull(),
  userId: integer('user_id').notNull(),
  organisationId: integer('organisation_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
})

// Replace localStorage with API calls
const saveDashboard = async (config) => {
  await fetch('/api/dashboards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config })
  })
}
```

## Key Fastify Features

This example demonstrates Fastify-specific patterns:

### Plugin Architecture
```typescript
// Register cube plugin
await app.register(cubePlugin, {
  cubes: allCubes,
  drizzle: db,
  schema,
  extractSecurityContext,
  engineType: 'postgres'
})
```

### Fastify Plugins Used
- **`@fastify/cors`**: CORS handling instead of Express cors middleware
- **`@fastify/static`**: Static file serving (requires absolute paths)
- **`cubePlugin`**: Drizzle-cube Fastify adapter

### Differences from Express Example
- **Plugin registration**: Uses `app.register()` instead of `app.use()` 
- **Async initialization**: All plugins registered in async `start()` function
- **Absolute paths**: Static file plugin requires absolute paths via `import.meta.url`
- **Error handling**: Uses Fastify's built-in error handling and logging
- **Request/Reply**: Fastify request/reply objects instead of Express req/res

## Differences from Hono Example

This Fastify example is simplified yet functional:
- **No Cloudflare Worker support** - Node.js only
- **localStorage persistence** - For demo purposes (vs database storage in Hono)
- **Fixed demo security context** - No real authentication
- **Minimal UI** - Just 2 tabs (vs full navigation in Hono)
- **No routing** - Single page application
- **Local-only dashboard customization** - Changes not shared between users

### Why localStorage vs Database?

- **Demo Purpose**: Easy to test dashboard editing without backend complexity
- **Development**: Quick iteration on dashboard layouts during development
- **Learning**: Focus on drizzle-cube features without database setup
- **Production**: See customization section above for proper database persistence

Perfect for getting started, understanding core concepts, and experimenting with dashboard layouts before implementing production persistence!

## Example Server Code

The core Fastify server implementation:

```typescript
import fastify from 'fastify'
import { cubePlugin } from 'drizzle-cube/adapters/fastify'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const app = fastify({ logger: true })

// Register CORS plugin
await app.register(import('@fastify/cors'), {
  origin: ['http://localhost:4010', 'http://localhost:4011'],
  credentials: true
})

// Register cube plugin
await app.register(cubePlugin, {
  cubes: allCubes,
  drizzle: db,
  schema,
  extractSecurityContext: async (request) => ({
    organisationId: 1,
    userId: 1
  }),
  engineType: 'postgres'
})

await app.listen({ port: 4011, host: '0.0.0.0' })
```

This creates a production-ready Fastify server with:
- Full Cube.js API compatibility
- Type-safe queries via Drizzle ORM  
- Plugin-based architecture
- Built-in logging and error handling