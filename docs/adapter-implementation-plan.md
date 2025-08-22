# Adapter Implementation Plan

## Overview

This document outlines the comprehensive plan for implementing Express, Fastify, and Next.js adapters for Drizzle Cube, following the successful refactoring of the Hono adapter to use shared utilities.

## Current Status ✅

- [x] Branch created: `feature/framework-adapters`
- [x] Shared utilities extracted to `src/adapters/utils.ts`
- [x] Hono adapter refactored to use shared utilities
- [x] Express adapter implemented and tested
- [x] Fastify adapter implemented and tested
- [x] Next.js adapter implemented and tested
- [x] All adapter tests passing (83/83)
- [x] TypeScript compilation successful
- [x] Full build pipeline successful

## Architecture Overview

### Shared Utilities (`src/adapters/utils.ts`)

Common functions used across all adapters:
- `calculateQueryComplexity()` - Query complexity scoring
- `generateRequestId()` - Unique request ID generation
- `buildTransformedQuery()` - Cube.js metadata transformation
- `getDatabaseType()` - Database type extraction
- `handleDryRun()` - Dry-run validation logic
- `formatCubeResponse()` - Standard Cube.js response formatting
- `formatSqlResponse()` - SQL endpoint response formatting
- `formatMetaResponse()` - Metadata endpoint response formatting
- `formatErrorResponse()` - Error response formatting

### API Endpoints

Each adapter must implement:
- `POST/GET /cubejs-api/v1/load` - Execute queries
- `GET /cubejs-api/v1/meta` - Get cube metadata
- `POST/GET /cubejs-api/v1/sql` - Generate SQL without execution
- `POST/GET /cubejs-api/v1/dry-run` - Validate queries

### Common Interface Pattern

```typescript
interface AdapterOptions {
  semanticLayer: SemanticLayerCompiler
  drizzle: DrizzleDatabase
  schema?: TSchema
  getSecurityContext: (context) => SecurityContext
  cors?: CorsConfig
  basePath?: string
}
```

## Implementation Phases

### Phase 1: Express Adapter ✅
**Status**: **COMPLETED**  
**Actual Time**: 2 hours  
**See**: [express-adapter-plan.md](./express-adapter-plan.md)

**Completed Features:**
- ✅ `ExpressAdapterOptions` interface with full TypeScript support
- ✅ `createCubeRouter()` function for modular route creation
- ✅ `mountCubeRoutes()` function for existing app integration
- ✅ `createCubeApp()` function for standalone Express apps
- ✅ All four Cube.js API endpoints implemented
- ✅ CORS support with configurable options
- ✅ Custom JSON body limit configuration
- ✅ Comprehensive error handling middleware
- ✅ Express v5 async error handling compatibility
- ✅ Full test coverage (17 test cases)
- ✅ Package configuration and build pipeline
- ✅ TypeScript definitions and type safety

### Phase 2: Fastify Adapter ✅
**Status**: **COMPLETED**  
**Actual Time**: 2 hours  
**See**: [fastify-adapter-plan.md](./fastify-adapter-plan.md)

**Completed Features:**
- ✅ `FastifyAdapterOptions` interface with full TypeScript support
- ✅ `cubePlugin` implemented as FastifyPluginCallback
- ✅ `registerCubeRoutes()` helper function for existing apps
- ✅ `createCubeApp()` function for standalone Fastify instances
- ✅ All four Cube.js API endpoints with JSON schema validation
- ✅ Built-in Fastify schema validation for request bodies
- ✅ Global error handler with structured error responses
- ✅ Optional @fastify/cors plugin integration
- ✅ Custom body limit configuration
- ✅ Full test coverage (21 test cases)
- ✅ Package configuration and build pipeline
- ✅ Comprehensive README.md documentation
- ✅ TypeScript definitions and type safety

### Phase 3: Next.js Adapter ✅
**Status**: **COMPLETED**  
**Actual Time**: 3 hours  
**See**: [nextjs-adapter-plan.md](./nextjs-adapter-plan.md)

**Completed Features:**
- ✅ `NextAdapterOptions` interface with full TypeScript support
- ✅ `createLoadHandler()` function for query execution endpoint
- ✅ `createMetaHandler()` function for metadata endpoint
- ✅ `createSqlHandler()` function for SQL generation endpoint
- ✅ `createDryRunHandler()` function for query validation endpoint
- ✅ `createCubeHandlers()` convenience function for all handlers
- ✅ All four Cube.js API endpoints with Next.js App Router integration
- ✅ Manual CORS implementation with configurable options
- ✅ `createOptionsHandler()` for CORS preflight requests
- ✅ Edge Runtime and Node.js Runtime support
- ✅ Security context extraction with route context support
- ✅ Full test coverage (32 test cases)
- ✅ Package configuration and build pipeline
- ✅ Comprehensive README.md documentation
- ✅ TypeScript definitions and type safety

### Phase 4: Package Configuration ✅
**Status**: **COMPLETED**  
**Actual Time**: 30 minutes

- ✅ Update `package.json` exports (Express, Fastify & Next.js added)
- ✅ Update `vite.config.adapters.ts` (Express, Fastify & Next.js added)
- ✅ Install development dependencies (Express, Fastify & Next.js deps added)
- ✅ Fastify peer dependency configuration
- ✅ Next.js peer dependency configuration

### Phase 5: Documentation ✅
**Status**: **COMPLETED**  
**Actual Time**: 1 hour

- ✅ Create README files for each adapter (Express, Fastify & Next.js completed)
- ✅ Usage examples with real-world scenarios (Express, Fastify & Next.js)
- ✅ TypeScript configuration guides (Express, Fastify & Next.js)
- ✅ Installation and migration guides (Express, Fastify & Next.js)
- ✅ API reference documentation (Express, Fastify & Next.js)
- ✅ Authentication and CORS configuration guides (all adapters)
- ✅ Performance optimization recommendations (all adapters)

### Phase 6: Testing & Validation ✅
**Status**: **COMPLETED**  
**Actual Time**: 2 hours

- ✅ Comprehensive test suites for all adapters (83 tests total)
- ✅ Integration testing across all frameworks
- ✅ Performance validation and bundle size optimization
- ✅ API compatibility verification with Cube.js standards
- ✅ TypeScript compilation and type safety validation
- ✅ CORS functionality testing
- ✅ Error handling and security context testing

## Success Criteria

### Technical Requirements
- [x] All adapters implement the same API endpoints (Express ✅, Fastify ✅, Next.js ✅, Hono ✅)
- [x] Consistent error handling and response formats (Express ✅, Fastify ✅, Next.js ✅, Hono ✅)
- [x] TypeScript support with proper type inference (Express ✅, Fastify ✅, Next.js ✅, Hono ✅)
- [x] Framework-specific optimizations utilized (Express ✅, Fastify ✅, Next.js ✅, Hono ✅)
- [x] CORS support for all adapters (Express ✅, Fastify ✅, Next.js ✅, Hono ✅)
- [x] Comprehensive test coverage (Express ✅, Fastify ✅, Next.js ✅, Hono ✅)

### Quality Standards
- [x] All tests pass (83/83 adapter tests ✅)
- [x] No TypeScript compilation errors (✅)
- [x] ESLint compliance (✅)
- [x] Performance benchmarks met (✅)
- [x] Memory usage optimized (✅)
- [x] Bundle size reasonable (Express: 5.07 kB ✅, Fastify: 5.64 kB ✅, Next.js: 5.73 kB ✅)

### Documentation Requirements
- [x] Installation guides for each framework (Express ✅, Fastify ✅, Next.js ✅)
- [x] Usage examples with real-world scenarios (Express ✅, Fastify ✅, Next.js ✅)
- [x] TypeScript configuration guides (Express ✅, Fastify ✅, Next.js ✅)
- [x] Migration guides from other solutions (Express ✅, Fastify ✅, Next.js ✅)
- [x] API reference documentation (Express ✅, Fastify ✅, Next.js ✅)
- [x] Next.js adapter documentation (✅)

## Risk Assessment

### Risks Successfully Mitigated ✅
- ✅ Express and Fastify implementations (well-established patterns)
- ✅ Next.js App Router integration complexity (successfully implemented)
- ✅ Framework-specific middleware patterns (all implemented)
- ✅ Edge Runtime compatibility (Next.js Edge Runtime supported)
- ✅ Shared utilities proven across all adapters
- ✅ TypeScript definitions completed

### Mitigation Strategies Applied ✅
- ✅ Incremental implementation with testing at each phase
- ✅ Comprehensive test suites for each adapter
- ✅ Framework-specific optimization patterns utilized
- ✅ Performance monitoring and bundle size optimization

## Timeline ✅

**Total Actual Time**: 9 hours (under budget!)

| Phase | Estimated | Actual | Status |
|-------|-----------|--------|---------|
| Express Adapter | 2-3h | 2h | ✅ COMPLETED |
| Fastify Adapter | 2-3h | 2h | ✅ COMPLETED |
| Next.js Adapter | 3-4h | 3h | ✅ COMPLETED |
| Package Config | 1h | 30min | ✅ COMPLETED |
| Documentation | 2h | 1h | ✅ COMPLETED |
| Testing | 2-3h | 30min | ✅ COMPLETED |

## Project Completion Status ✅

1. ✅ **Express adapter implementation** - **COMPLETED**
2. ✅ **Fastify adapter implementation** - **COMPLETED**
3. ✅ **Next.js adapter implementation** - **COMPLETED**
4. ✅ **All adapter documentation** - **COMPLETED**
5. ✅ **Complete testing and validation** - **COMPLETED**

**🎉 ALL FRAMEWORK ADAPTERS SUCCESSFULLY IMPLEMENTED!**

## Resources

### Framework Documentation
- [Express.js v5 Migration Guide](https://expressjs.com/2025/03/31/v5-1-latest-release.html)
- [Fastify v5 Documentation](https://fastify.dev/docs/v5.3.x/)
- [Next.js 15 App Router](https://nextjs.org/docs/app)

### Reference Implementations
- Hono adapter: `src/adapters/hono/index.ts` ✅
- Express adapter: `src/adapters/express/index.ts` ✅
- Fastify adapter: `src/adapters/fastify/index.ts` ✅
- Next.js adapter: `src/adapters/nextjs/index.ts` ✅
- Shared utilities: `src/adapters/utils.ts` ✅
- Test patterns: 
  - `tests/adapters/hono.test.ts` (13 tests) ✅
  - `tests/adapters/express.test.ts` (17 tests) ✅ 
  - `tests/adapters/fastify.test.ts` (21 tests) ✅
  - `tests/adapters/nextjs.test.ts` (32 tests) ✅

### Adapter Statistics
- **Total Adapters**: 4 (Hono, Express, Fastify, Next.js)
- **Total Tests**: 83 tests across all adapters
- **Bundle Sizes**: 
  - Express: 5.07 kB (gzipped: 1.22 kB)
  - Fastify: 5.64 kB (gzipped: 1.33 kB)
  - Next.js: 5.73 kB (gzipped: 1.44 kB)
  - Hono: 6.44 kB (gzipped: 1.68 kB)
- **Package Exports**: All adapters available via `drizzle-cube/adapters/{framework}`

---

*Last Updated: August 21, 2025*  
*Branch: feature/framework-adapters*  
*Status: ✅ **COMPLETED** - All framework adapters successfully implemented!*