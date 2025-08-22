# CLAUDE.md - Examples Guide

This guide explains how to create new drizzle-cube example applications based on the Express example template.

## Overview

Each example demonstrates drizzle-cube integration with different web frameworks:
- **Hono**: Full-featured example with Cloudflare Workers support and dashboard management
- **Express**: Simplified example with TypeScript server and React client
- **Fastify**: (To be created) Fastify server with React client 
- **Next.js**: (To be created) Next.js full-stack application

## Creating a New Example

### 1. Directory Structure

```
examples/[framework]/
├── server.ts                    # Main server file (TypeScript)
├── schema.ts                    # Database schema (copied from Hono)
├── cubes.ts                     # Cube definitions (copied from Hono)
├── package.json                 # Server dependencies
├── docker-compose.yml           # PostgreSQL setup (unique port)
├── drizzle.config.ts           # Drizzle configuration
├── drizzle/                    # Database migrations (copied)
├── scripts/                    # Migration & seed scripts
│   ├── init-db.sql
│   ├── migrate.ts
│   └── seed.ts
├── client/                     # React frontend
│   ├── src/
│   │   ├── App.tsx             # Main app with tabs
│   │   ├── main.tsx            # React entry point
│   │   ├── index.css           # CSS with drizzle-cube imports
│   │   └── dashboard-config.ts # Fixed dashboard configuration
│   ├── index.html
│   ├── package.json            # Client dependencies
│   ├── vite.config.ts          # Vite config with proxy
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── tsconfig.node.json
└── README.md                   # Setup and usage guide
```

### 2. Server Implementation

#### Basic Server Template (`server.ts`)
```typescript
import express from 'express'
import { createCubeRouter } from 'drizzle-cube/adapters/[framework]'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { schema } from './schema'
import { allCubes } from './cubes'

const port = parseInt(process.env.PORT || '[PORT]')
const db = drizzle(postgres(connectionString), { schema })

// Simple security context for demo
const extractSecurityContext = async (req, res) => ({
  organisationId: 1,
  userId: 1
})

// Create and mount cube routes
const cubeRouter = createCubeRouter({
  cubes: allCubes,
  drizzle: db,
  schema,
  extractSecurityContext,
  engineType: 'postgres'
})

app.use('/', cubeRouter) // Mount at root - adapter handles basePath

app.listen(port, () => {
  console.log(`🚀 [Framework] server running on http://localhost:${port}`)
})
```

#### Port Assignments
- **Express**: Server 4001, Client 4000
- **Fastify**: Server 5001, Client 5000  
- **Next.js**: Full-stack 6000
- **Database**: Each example uses unique PostgreSQL port (54922, 54923, etc.)

### 3. Package.json Configuration

#### Server Dependencies
```json
{
  "name": "drizzle-cube-[framework]-example",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm:dev:server\" \"npm:dev:client\"",
    "dev:server": "tsx watch server.ts",
    "dev:client": "cd client && npm run dev",
    "setup": "npm run docker:up && sleep 5 && npm run db:migrate && npm run db:seed && npm run install:client"
  },
  "dependencies": {
    "drizzle-cube": "file:../..",
    "drizzle-orm": "^0.44.4",
    "postgres": "^3.4.0",
    "@neondatabase/serverless": "^1.0.1",
    "[framework-specific-deps]": "^x.x.x"
  },
  "devDependencies": {
    "tsx": "^4.0.0",
    "typescript": "^5.0.0",
    "concurrently": "^8.2.0",
    "drizzle-kit": "^0.31.4"
  }
}
```

#### Client Dependencies  
```json
{
  "dependencies": {
    "drizzle-cube": "file:../../..",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-grid-layout": "^1.4.0",
    "react-resizable": "^3.0.0",
    "recharts": "^2.8.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "@types/react-grid-layout": "^1.3.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

### 4. Critical Configuration Files

#### Vite Config with Proxy (`client/vite.config.ts`)
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: [CLIENT_PORT],
    proxy: {
      '/cubejs-api': {
        target: 'http://localhost:[SERVER_PORT]',
        changeOrigin: true
      }
    }
  }
})
```

#### CSS Imports (`client/src/index.css`)
```css
/* Import Drizzle Cube styles (includes grid layout styles) */
@import 'drizzle-cube/client/styles.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

/* Your custom styles */
body {
  /* ... */
}
```

#### Client App Structure (`client/src/App.tsx`)
```tsx
import { useState } from 'react'
import { QueryBuilder, AnalyticsDashboard } from 'drizzle-cube/client'
import { dashboardConfig } from './dashboard-config'

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'query'>('dashboard')
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab navigation */}
      <div className="bg-white shadow-sm border-b">
        {/* Tab buttons */}
      </div>
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' ? (
          <AnalyticsDashboard 
            config={dashboardConfig}
            baseUrl="/cubejs-api/v1"  {/* IMPORTANT: Use relative URL */}
          />
        ) : (
          <QueryBuilder apiUrl="/cubejs-api/v1" />
        )}
      </div>
    </div>
  )
}
```

### 5. Database Setup Files

#### Copy Shared Infrastructure
```bash
# Copy from Hono example
cp ../hono/schema.ts ./
cp ../hono/cubes.ts ./
cp -r ../hono/drizzle ./
cp ../hono/scripts/init-db.sql ./scripts/
```

#### Update Connection Strings
- Change database port in `docker-compose.yml`
- Update `drizzle.config.ts` with new port
- Update `scripts/migrate.ts` and `scripts/seed.ts` with new port

### 6. Essential Requirements Checklist

#### Server Setup
- [ ] TypeScript server file with framework adapter
- [ ] Import schema and cubes from shared files
- [ ] Mount cube router at root path (`app.use('/', cubeRouter)`)
- [ ] Simple demo security context
- [ ] Unique port assignment

#### Client Setup  
- [ ] Vite proxy configuration pointing to server port
- [ ] CSS imports in `index.css` using `@import 'drizzle-cube/client/styles.css'`
- [ ] Required dependencies: react-grid-layout, react-resizable, recharts
- [ ] Relative API URLs (`/cubejs-api/v1`) not absolute URLs
- [ ] Tailwind CSS configuration
- [ ] TypeScript configuration

#### Database Setup
- [ ] Unique PostgreSQL port in docker-compose
- [ ] Updated connection strings in all config files
- [ ] Working migrate and seed scripts with proper connection closing

#### Package.json Scripts
- [ ] `npm run dev` - Start both server and client concurrently
- [ ] `npm run setup` - Full setup (Docker + migrate + seed + install client)
- [ ] Proper TypeScript execution with `tsx`

### 7. Common Pitfalls to Avoid

1. **Double Path Prefix**: Don't mount cube router at `/cubejs-api/v1` - mount at `/` since adapter handles basePath
2. **Absolute URLs**: Use `/cubejs-api/v1` not `http://localhost:XXXX/cubejs-api/v1` in client
3. **Missing CSS**: Must import `drizzle-cube/client/styles.css` in CSS file, not TypeScript
4. **Missing Dependencies**: Include all required chart/grid dependencies in client package.json
5. **Port Conflicts**: Ensure unique ports for each example's database and servers
6. **Connection Leaks**: Add `process.exit(0)` to migrate/seed scripts
7. **Proxy Configuration**: Vite proxy must target correct server port

### 8. Testing Your Example

```bash
# Full setup
npm run setup

# Start development
npm run dev

# Test API direct
curl http://localhost:[SERVER_PORT]/cubejs-api/v1/meta

# Test API through proxy  
curl http://localhost:[CLIENT_PORT]/cubejs-api/v1/meta

# Test query
curl -X POST http://localhost:[CLIENT_PORT]/cubejs-api/v1/load \
  -H "Content-Type: application/json" \
  -d '{"measures": ["Employees.count"], "dimensions": ["Departments.name"], "cubes": ["Employees", "Departments"]}'
```

The example should show:
- Dashboard with 4 working charts
- Query builder with schema exploration
- Proper styling and grid layout
- Working API calls through proxy

## Framework-Specific Notes

### Express
- Uses `createCubeRouter()` function
- Standard Express middleware and routing
- CORS configuration for development

### Fastify (Future)
- Will use `createCubePlugin()` or similar
- Fastify plugin architecture
- Different middleware patterns

### Next.js (Future)  
- API routes in `app/api/cube/[...path]/route.ts`
- Server-side rendering considerations
- Different proxy/routing setup

Each example should be self-contained and demonstrate the specific framework's best practices while maintaining consistency in functionality and user experience.