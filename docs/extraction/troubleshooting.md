# Troubleshooting Guide

This guide covers common issues that may arise during the extraction and setup of the `drizzle-cube` module.

## Build Issues

### TypeScript Compilation Errors

#### Issue: "Cannot find module 'drizzle-cube/server'"
```
error TS2307: Cannot find module 'drizzle-cube/server' or its corresponding type declarations.
```

**Cause**: Package exports not configured correctly or build output missing.

**Solution**:
1. Verify `package.json` exports are correct:
```json
{
  "exports": {
    "./server": {
      "types": "./dist/server/index.d.ts",
      "import": "./dist/server/index.js"
    }
  }
}
```

2. Run the build process:
```bash
npm run build:server
```

3. Check that `dist/server/index.d.ts` exists and is valid.

#### Issue: "Type 'unknown' is not assignable to type 'SemanticCube'"
```
error TS2322: Type 'unknown' is not assignable to type 'SemanticCube'.
```

**Cause**: Circular import or missing type export.

**Solution**:
1. Check import order in `src/server/index.ts`
2. Ensure all types are properly exported:
```typescript
export type { SemanticCube, SemanticQuery } from './types'
```

3. Verify no circular dependencies between modules.

#### Issue: "Property 'queryFn' does not exist on type 'SemanticCube'"
```
error TS2339: Property 'queryFn' does not exist on type 'SemanticCube'.
```

**Cause**: Using `SemanticCube` instead of `CompiledCube`.

**Solution**: Use the correct type:
```typescript
// Wrong
const cube: SemanticCube = semanticLayer.getCube('MyCube')

// Correct  
const cube: CompiledCube | undefined = semanticLayer.getCube('MyCube')
```

### Vite Build Errors

#### Issue: "Failed to resolve entry for package"
```
error: Failed to resolve entry for package "drizzle-cube"
```

**Cause**: Missing or incorrect Vite configuration.

**Solution**:
1. Check all three Vite config files exist:
   - `vite.config.server.ts`
   - `vite.config.client.ts` 
   - `vite.config.adapters.ts`

2. Verify entry points are correct:
```typescript
// vite.config.server.ts
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/server/index.ts'), // Check this path
      formats: ['es']
    }
  }
})
```

#### Issue: "Rollup failed to resolve import"
```
error: 'X' is not exported by node_modules/Y/index.js
```

**Cause**: External dependency not properly configured.

**Solution**: Update rollup externals:
```typescript
// vite.config.*.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['react', 'react-dom', 'hono', 'drizzle-orm'], // Add missing deps
      output: {
        globals: {
          'react': 'React',
          'hono': 'Hono'
        }
      }
    }
  }
})
```

### ESLint Errors

#### Issue: "Parsing error: Cannot read file"
```
error: Parsing error: Cannot read file 'tsconfig.json'
```

**Solution**: Check ESLint configuration:
```json
{
  "parserOptions": {
    "project": "./tsconfig.json" // Ensure correct path
  }
}
```

## Runtime Issues

### Server Runtime Errors

#### Issue: "Database executor not configured"
```
Error: Database executor not configured. Call setDatabaseExecutor() first.
```

**Cause**: SemanticLayerCompiler created without database executor.

**Solution**:
```typescript
// Option 1: Pass in constructor
const semanticLayer = new SemanticLayerCompiler(dbExecutor)

// Option 2: Set after creation
const semanticLayer = new SemanticLayerCompiler()
semanticLayer.setDatabaseExecutor(dbExecutor)
```

#### Issue: "Cube 'X' not found"
```
Error: Cube 'Employees' not found
```

**Cause**: Cube not registered or wrong name used.

**Solution**:
1. Verify cube is registered:
```typescript
semanticLayer.registerCube(employeesCube)
```

2. Check cube name matches exactly:
```typescript
// Cube definition
const employeesCube = { name: 'Employees', ... }

// Query - names must match exactly
const query = { measures: ['Employees.count'] } // Not 'employees.count'
```

#### Issue: "SQL execution failed"
```
Error: Query execution failed: column "invalid_column" does not exist
```

**Cause**: Invalid SQL in cube definition or security context substitution failed.

**Solution**:
1. Test cube SQL manually in database
2. Check security context variables:
```typescript
// Cube SQL
sql: 'SELECT * FROM employees WHERE org = ${SECURITY_CONTEXT.organisation}'

// Security context must provide this key
const context = { organisation: 'org-123' } // Required
```

3. Use SQL debugging:
```typescript
const sqlResult = executor.generateSQL(cube, query, context)
console.log('Generated SQL:', sqlResult.sql)
```

### Client Runtime Errors

#### Issue: "Cube API client not configured"
```
Error: No cube API client provided to CubeProvider
```

**Solution**: Ensure CubeProvider has valid client:
```typescript
import { CubeProvider, createCubeClient } from 'drizzle-cube/client'

const cubeApi = createCubeClient({
  apiUrl: '/cubejs-api/v1'
})

<CubeProvider cubeApi={cubeApi}>
  <App />
</CubeProvider>
```

#### Issue: "Network error: Failed to fetch"
```
Error: Failed to fetch cube data
```

**Cause**: API endpoint not available or CORS issues.

**Solution**:
1. Verify API endpoint is running and accessible
2. Check CORS configuration:
```typescript
// Hono adapter
createCubeApp({
  // ...
  cors: {
    origin: ['http://localhost:3000'], // Add your frontend domain
    credentials: true
  }
})
```

3. Test API endpoint manually:
```bash
curl -X POST http://localhost:8788/cubejs-api/v1/meta
```

#### Issue: "Authentication failed"
```
Error: 401 Unauthorized
```

**Solution**: Check security context extraction:
```typescript
// Hono adapter
createCubeApp({
  // ...
  getSecurityContext: async (c) => {
    const session = c.get('session')
    if (!session) {
      throw new Error('No session found') // This will cause 401
    }
    return { organisation: session.org.id }
  }
})
```

### Adapter Issues

#### Issue: "Hono adapter not working"
```
Error: Cannot read properties of undefined (reading 'req')
```

**Cause**: Incorrect usage of Hono context.

**Solution**: Use proper Hono context handling:
```typescript
// Wrong
app.post('/api', (c) => {
  const body = c.request.json() // Wrong property
})

// Correct
app.post('/api', async (c) => {
  const body = await c.req.json() // Correct: c.req
})
```

#### Issue: "CORS errors in browser"
```
Access to fetch at 'API_URL' from origin 'FRONTEND_URL' has been blocked by CORS policy
```

**Solution**: Configure CORS properly:
```typescript
import { cors } from 'hono/cors'

// Option 1: Use adapter CORS config
createCubeApp({
  cors: {
    origin: ['http://localhost:3000', 'https://yourapp.com'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  }
})

// Option 2: Add CORS middleware manually
app.use('/*', cors({
  origin: 'http://localhost:3000',
  credentials: true
}))
```

## Development Issues

### Hot Reload Not Working

#### Issue: Changes not reflected during development

**Solution**:
1. Use watch mode for development:
```bash
npm run dev # Uses concurrently to run all watch processes
```

2. For server changes only:
```bash
npm run dev:server
```

3. Check file watchers are configured:
```json
// package.json
{
  "scripts": {
    "dev:server": "vite build src/server --watch --mode development"
  }
}
```

### Import Path Issues

#### Issue: "Module not found" with relative imports

**Solution**: Use proper import paths:
```typescript
// Wrong - relative paths
import { SemanticCube } from '../../../types'

// Correct - absolute paths from package root
import { SemanticCube } from 'drizzle-cube/server'

// Or configure path mapping in tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/server/*": ["./src/server/*"]
    }
  }
}
```

### Example Application Issues

#### Issue: Example apps not running

**Solution**:
1. Install dependencies in example directories:
```bash
cd examples/basic && npm install
cd examples/hono-app && npm install
```

2. Build the main module first:
```bash
npm run build
```

3. Link the module for local development:
```bash
npm link
cd examples/basic && npm link drizzle-cube
```

## Testing Issues

### Test Failures

#### Issue: "Cannot resolve module in tests"
```
error: Failed to resolve './src/server' from tests/server.test.ts
```

**Solution**: Configure Vitest resolver:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    alias: {
      '@/server': './src/server',
      '@/client': './src/client'
    }
  }
})
```

#### Issue: "Module not mocked properly"
```
error: Cannot find module 'hono' from 'src/adapters/hono/index.ts'
```

**Solution**: Mock external dependencies:
```typescript
// tests/setup.ts
vi.mock('hono', () => ({
  Hono: vi.fn(() => ({
    post: vi.fn(),
    get: vi.fn(),
    route: vi.fn()
  }))
}))
```

## Publishing Issues

### NPM Publish Errors

#### Issue: "Package already exists"
```
error: You cannot publish over the previously published versions
```

**Solution**: Update version in package.json:
```bash
npm version patch # or minor/major
npm publish
```

#### Issue: "Missing files in published package"
```
error: Package missing dist/ directory
```

**Solution**: 
1. Check `files` field in package.json:
```json
{
  "files": [
    "dist/",
    "README.md", 
    "LICENSE"
  ]
}
```

2. Run build before publishing:
```bash
npm run build
npm publish
```

## Performance Issues

### Large Bundle Size

#### Issue: Client bundle too large

**Solution**:
1. Check for unnecessary dependencies:
```bash
npm run build:client
# Check dist/client/ size
```

2. Make heavy dependencies external:
```typescript
// vite.config.client.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['recharts', 'react-grid-layout'] // Don't bundle heavy deps
    }
  }
})
```

### Slow Query Execution

#### Issue: Queries taking too long

**Solution**:
1. Check generated SQL:
```typescript
const sqlResult = executor.generateSQL(cube, query, context)
console.log('Generated SQL:', sqlResult.sql)
```

2. Add database indexes for cube dimensions
3. Optimize cube SQL with proper JOINs
4. Use LIMIT in development queries

## Security Issues

### Context Injection

#### Issue: "Invalid security context"
```
Error: SQL injection attempt detected
```

**Solution**: Sanitize security context values:
```typescript
function sanitizeContext(context: SecurityContext): SecurityContext {
  const sanitized: SecurityContext = {}
  
  for (const [key, value] of Object.entries(context)) {
    // Only allow alphanumeric and specific chars
    if (typeof value === 'string' && /^[a-zA-Z0-9_-]+$/.test(value)) {
      sanitized[key] = value
    } else {
      throw new Error(`Invalid security context value for ${key}`)
    }
  }
  
  return sanitized
}
```

## Getting Help

### Debug Information Collection

When reporting issues, include:

1. **Environment info**:
```bash
node --version
npm --version
npm list drizzle-cube
```

2. **Build output**:
```bash
npm run build 2>&1 | tee build.log
```

3. **Test results**:
```bash
npm test 2>&1 | tee test.log
```

4. **Configuration files**:
- `package.json`
- `tsconfig.json`
- `vite.config.*.ts`

### Common Debug Commands

```bash
# Check package structure
npm pack --dry-run

# Verify exports
node -e "console.log(require('./package.json').exports)"

# Test imports
node -e "import('./dist/server/index.js').then(console.log)"

# Check TypeScript
npm run typecheck

# Lint check
npm run lint
```

### Support Resources

1. **Documentation**: https://drizzle-cube.dev
2. **Examples**: Check `/examples` directory in the repository
3. **Issues**: Report bugs with full error details and environment info
4. **API Reference**: See [api-design.md](./api-design.md) for complete API documentation

Remember to always include minimal reproduction steps when reporting issues!