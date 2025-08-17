# Framework Adapters

This directory contains framework-specific adapters for Drizzle Cube. Each adapter provides a standardized way to integrate the semantic layer with different web frameworks.

## Available Adapters

### Hono Adapter

**Import**: `drizzle-cube/adapters/hono`  
**Framework**: [Hono](https://hono.dev)  
**Features**: Full Cube.js API compatibility, CORS support, flexible authentication  

```typescript
import { createCubeApp } from 'drizzle-cube/adapters/hono'

const app = createCubeApp({
  semanticLayer,
  getSecurityContext: (c) => ({ organisation: c.get('org') })
})
```

## Creating New Adapters

To create an adapter for a new framework:

1. Create a new directory: `src/adapters/your-framework/`
2. Implement the adapter following the Hono example
3. Add exports to the main package.json
4. Create tests in `tests/adapters/your-framework.test.ts`
5. Add documentation

### Adapter Requirements

All adapters should:
- Provide the three Cube.js endpoints: `/load`, `/meta`, `/sql`
- Accept a `getSecurityContext` function
- Support both GET and POST for `/load` and `/sql`
- Handle errors gracefully
- Return responses in Cube.js format
- Allow custom base paths
- Support CORS configuration