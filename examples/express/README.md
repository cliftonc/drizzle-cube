# Drizzle Cube Express Example

A minimal Express.js application demonstrating drizzle-cube integration with a simple analytics dashboard.

## Features

- **Express Backend**: Simple server using drizzle-cube Express adapter
- **React Frontend**: Two-tab interface with dashboard and query builder
- **PostgreSQL Database**: Self-contained with Docker
- **Sample Data**: Employee and productivity analytics

## Quick Start

```bash
# Install dependencies
npm install

# Setup database and seed data
npm run setup

# Start development servers (Express on :4001, React on :4000)
npm run dev
```

Visit:
- **Frontend Dashboard**: http://localhost:4000
- **Cube API**: http://localhost:4001/cubejs-api/v1/meta

## Architecture

### Backend (`server.js`)
- Express server with drizzle-cube adapter
- Simple security context (demo org/user)
- Cube API endpoints at `/cubejs-api/v1/*`

### Frontend (`client/`)
- React app with Vite (port 4000)
- Vite proxy forwards `/cubejs-api/*` to backend (port 4001)
- Two tabs: Dashboard view and Query Builder
- Uses `drizzle-cube/client` components with proper CSS imports
- Includes react-grid-layout and recharts for dashboard functionality

### Database
- PostgreSQL in Docker (port 54922)
- Sample employee, department, and productivity data
- Drizzle ORM for type-safe queries

## Available Scripts

```bash
npm run dev          # Start both server and client
npm run dev:server   # Server only (port 4001)
npm run dev:client   # Client only (port 4000)
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
curl http://localhost:4001/cubejs-api/v1/meta

# Execute a query
curl -X POST http://localhost:4001/cubejs-api/v1/load \
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

## Differences from Hono Example

This Express example is simplified yet functional:
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