# Drizzle Cube Next.js Example

A full-stack Next.js 15 application demonstrating drizzle-cube integration with App Router and a complete analytics dashboard.

## Features

- **Next.js 15 App Router**: Modern React patterns with server components and API routes
- **drizzle-cube Integration**: Semantic layer with Cube.js-compatible API endpoints
- **PostgreSQL Database**: Self-contained with Docker
- **Analytics Dashboard**: Interactive charts with drag-and-drop editing
- **Query Builder**: Real-time query construction and execution
- **TypeScript**: Full type safety from database to UI

## Quick Start

```bash
# Install dependencies
npm install

# Setup database and seed data
npm run setup

# Start Next.js development server (port 6001)
npm run dev
```

Visit:
- **Frontend Dashboard**: http://localhost:6001
- **Cube API**: http://localhost:6001/api/cubejs-api/v1/meta

## Architecture

### Full-Stack Next.js 15 App

This example uses Next.js 15's App Router for a modern full-stack architecture:

- **API Routes**: `app/api/cube/[...path]/route.ts` handles all Cube.js endpoints
- **Client Components**: React components with `'use client'` for interactivity
- **Server Components**: Default server-side rendering for optimal performance
- **Database Integration**: Direct Drizzle ORM connection in API routes

### Key Files

```
examples/nextjs/
├── app/
│   ├── layout.tsx              # Root layout with global styles
│   ├── page.tsx                # Main page with tab navigation
│   ├── globals.css             # Global styles with drizzle-cube imports
│   └── api/cube/[...path]/
│       └── route.ts           # Cube.js API endpoints
├── components/
│   ├── DashboardTab.tsx       # Dashboard with localStorage persistence
│   └── QueryBuilderTab.tsx    # Interactive query builder
├── lib/
│   ├── db.ts                  # Database connection
│   └── dashboard-config.ts    # Default dashboard configuration
├── schema.ts                   # Database schema (Drizzle ORM)
├── cubes.ts                    # Cube definitions
└── docker-compose.yml         # PostgreSQL (port 54924)
```

### API Endpoints

The catch-all route handler provides these Cube.js-compatible endpoints:

- `GET/POST /api/cubejs-api/v1/load` - Execute queries
- `GET /api/cubejs-api/v1/meta` - Get cube metadata
- `GET/POST /api/cubejs-api/v1/sql` - Generate SQL
- `GET/POST /api/cubejs-api/v1/dry-run` - Validate queries

### Database (PostgreSQL)

- **Port**: 54924 (unique to avoid conflicts)
- **Container**: `drizzle-cube-nextjs-postgres`
- **Data**: Employee, department, and productivity analytics
- **Migrations**: Drizzle Kit for schema management

## Available Scripts

```bash
# Development
npm run dev          # Start Next.js development server (port 6001)
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking

# Database
npm run setup        # Full setup (Docker + migrate + seed)
npm run docker:up    # Start PostgreSQL container
npm run docker:down  # Stop PostgreSQL container
npm run docker:reset # Reset database (delete all data)
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed sample data
npm run db:generate  # Generate new migrations
```

## Dashboard Features

The example includes a fully interactive 4-chart dashboard:

### Charts
1. **Employees by Department** (Bar Chart)
2. **Productivity Trend** (Line Chart - Last 30 Days)
3. **Team Happiness Distribution** (Pie Chart)
4. **Productivity by Department** (Bar Chart)

### Dashboard Editing
- **Edit Mode**: Click "Edit Dashboard" to enable layout editing
- **Drag & Drop**: Rearrange charts by dragging titles
- **Resize**: Use corner handles to resize charts
- **Chart Settings**: Edit individual chart configurations
- **Auto-Save**: Changes automatically saved to localStorage
- **Reset**: Restore default layout and configuration

### Data Persistence

This example uses **localStorage** for dashboard customization:

- Simple demo implementation for quick testing
- User-specific layouts persist across browser sessions
- Easy to replace with database storage for production

For production applications, implement server-side persistence:

```typescript
// Replace localStorage with API calls
const saveDashboard = async (config) => {
  await fetch('/api/dashboards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ config })
  })
}
```

## Query Builder

Interactive query construction with:

- **Measures**: Select count, sum, average aggregations
- **Dimensions**: Choose grouping fields
- **Time Dimensions**: Date-based analysis with granularity
- **Filters**: Apply conditions to limit results
- **Live Execution**: See results as you build queries
- **Schema Exploration**: Browse available cubes and fields

## API Examples

```bash
# Get cube metadata
curl http://localhost:6001/api/cubejs-api/v1/meta

# Execute a query
curl -X POST http://localhost:6001/api/cubejs-api/v1/load \
  -H "Content-Type: application/json" \
  -d '{
    "measures": ["Employees.count"],
    "dimensions": ["Departments.name"],
    "cubes": ["Employees", "Departments"]
  }'

# Generate SQL for a query
curl -X POST http://localhost:6001/api/cubejs-api/v1/sql \
  -H "Content-Type: application/json" \
  -d '{
    "measures": ["Productivity.avgLinesOfCode"],
    "timeDimensions": [{
      "dimension": "Productivity.date",
      "granularity": "day"
    }]
  }'
```

## Next.js 15 Integration

### App Router Patterns

This example demonstrates modern Next.js patterns:

```typescript
// Server Component (default)
export default function Layout({ children }) {
  return <html><body>{children}</body></html>
}

// Client Component (interactive)
'use client'
export default function DashboardTab() {
  const [config, setConfig] = useState(defaultConfig)
  // ... interactive logic
}

// API Route (catch-all)
export async function GET(request, { params }) {
  // Handle dynamic routes
}
```

### TypeScript Configuration

Full type safety from database to UI:

- **Database**: Drizzle ORM schema with TypeScript types
- **API**: Next.js adapter with typed security context
- **Client**: React components with proper type inference
- **Configuration**: Strict TypeScript compilation

### Performance Optimization

- **Server Components**: Default server-side rendering
- **Client Components**: Only where interactivity is needed
- **Static Generation**: Build-time optimization for charts
- **API Routes**: Efficient database connection pooling

## Customization

### Adding New Charts

1. **Update Dashboard Config** (`lib/dashboard-config.ts`):
```typescript
export const dashboardConfig = {
  portlets: [
    // ... existing charts
    {
      id: 'new-chart',
      title: 'New Chart Title',
      query: JSON.stringify({
        measures: ['YourCube.measure'],
        dimensions: ['YourCube.dimension']
      }),
      chartType: 'bar', // or 'line', 'pie', 'area'
      x: 0, y: 8, w: 6, h: 4 // Grid position
    }
  ]
}
```

### Adding New Cubes

1. **Define Cube** (`cubes.ts`):
```typescript
export const newCube = defineCube(schema, {
  name: 'NewCube',
  sql: ({ db, securityContext }) => 
    db.select()
      .from(schema.newTable)
      .where(eq(schema.newTable.organisationId, securityContext.organisationId)),
  measures: {
    count: { sql: schema.newTable.id, type: 'count' }
  },
  dimensions: {
    name: { sql: schema.newTable.name, type: 'string' }
  }
})
```

2. **Register Cube** (`cubes.ts`):
```typescript
export const allCubes = [existingCubes, newCube]
```

### Security Context

For production applications, implement real authentication:

```typescript
// app/api/cube/[...path]/route.ts
const extractSecurityContext = async (request: NextRequest) => {
  // Extract JWT from Authorization header
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  const decoded = await verifyJWT(token)
  
  return {
    organisationId: decoded.orgId,
    userId: decoded.userId,
    roles: decoded.roles
  }
}
```

### Styling

The example uses Tailwind CSS with drizzle-cube styles:

- **Global Styles**: `app/globals.css` imports drizzle-cube CSS
- **Components**: Tailwind classes for responsive design
- **Charts**: Recharts with customizable themes
- **Grid Layout**: react-grid-layout for dashboard editing

## Differences from Express Example

This Next.js example provides enhanced functionality:

### ✅ Next.js 15 Advantages
- **App Router**: Modern React patterns with server components
- **Full-Stack**: API routes integrated with frontend
- **TypeScript**: Strict type checking throughout
- **Performance**: Server-side rendering and optimization
- **Developer Experience**: Hot reload for both API and UI

### 🔄 Shared Functionality
- **Same Database Schema**: Identical to Express example
- **Same Cubes**: Exact same analytics definitions
- **Same Dashboard**: 4-chart layout with editing
- **Same API**: Cube.js-compatible endpoints
- **localStorage**: Dashboard persistence for demo

### 📦 Simplified Deployment
- **Single Application**: No separate server/client builds
- **Unified Configuration**: One package.json, one Docker setup
- **API Integration**: No proxy configuration needed
- **Static Export**: Can build for static hosting

## Production Considerations

### Database Persistence

Replace localStorage with proper database storage:

```typescript
// Add to schema.ts
export const dashboards = pgTable('dashboards', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull(),
  config: jsonb('config').notNull(),
  userId: integer('user_id').notNull(),
  organisationId: integer('organisation_id').notNull(),
  createdAt: timestamp('created_at').defaultNow()
})
```

### Authentication

Implement proper security:

- JWT token validation
- Role-based access control
- Multi-tenant data isolation
- Rate limiting and CORS

### Performance

Optimize for production:

- Enable Next.js static generation
- Implement proper caching strategies
- Use CDN for static assets
- Database connection pooling

### Monitoring

Add observability:

- Error tracking (Sentry)
- Performance monitoring
- Database query optimization
- API usage analytics

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure port 54924 is available for PostgreSQL
2. **Database Connection**: Check Docker container is running
3. **Type Errors**: Run `npm run type-check` for TypeScript issues
4. **CSS Not Loading**: Verify drizzle-cube styles import in globals.css

### Development Tips

- Use `npm run docker:reset` to clean database state
- Check browser console for client-side errors
- Use Next.js DevTools for debugging
- Monitor API calls in Network tab

Perfect for learning drizzle-cube with modern Next.js patterns and building production-ready analytics applications!