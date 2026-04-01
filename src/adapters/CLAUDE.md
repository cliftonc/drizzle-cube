# Framework Adapters

HTTP + MCP adapter layer: maps Cube.js-compatible endpoints onto Express, Fastify, Hono, and Next.js. Shared utilities live in the root; each framework subdirectory re-exports a consistent API surface.

## Directory Layout

| Path | Key Exports | Purpose |
|------|-------------|---------|
| types.ts | `BaseAdapterOptions`, `ContextExtractor`, `CorsConfig`, `AdapterResponse`, `AdapterFactory` | Shared interfaces for all adapters |
| utils.ts | `calculateQueryComplexity`, `handleDryRun`, `handleLoad`, `handleBatchRequest`, `handleDiscover`, `handleSuggest`, `handleValidate`, `formatCubeResponse`, `formatSqlResponse`, `formatMetaResponse`, `MCPOptions` | Request handlers and response formatters shared across frameworks |
| mcp-transport.ts | `dispatchMcpMethod`, `negotiateProtocol`, `validateOriginHeader`, `parseJsonRpc`, `serializeSseEvent`, `buildJsonRpcError`, `buildJsonRpcResult`, `jsonRpcError` | MCP JSON-RPC protocol: method dispatch, SSE serialization, origin validation |
| express/index.ts | `ExpressAdapterOptions`, `createCubeRouter`, `mountCubeRoutes`, `createCubeApp` | Express router/app factory |
| fastify/index.ts | `FastifyAdapterOptions`, `cubePlugin`, `registerCubeRoutes`, `createCubeApp` | Fastify plugin + app factory |
| hono/index.ts | `HonoAdapterOptions`, `createCubeRoutes`, `mountCubeRoutes`, `createCubeApp` | Hono routes/app factory |
| nextjs/index.ts | `NextAdapterOptions`, `createLoadHandler`, `createMetaHandler`, `createSqlHandler`, `createDryRunHandler`, `createBatchHandler`, `createExplainHandler`, `createDiscoverHandler`, `createSuggestHandler`, `createValidateHandler`, `createMcpRpcHandler`, `createAgentChatHandler`, `createCubeHandlers` | Next.js App Router — individual handler creators (not a router) |

## API Endpoints

All adapters expose the same Cube.js-compatible surface:

| Method | Path | Purpose |
|--------|------|---------|
| POST, GET | /cubejs-api/v1/load | Execute semantic query |
| POST | /cubejs-api/v1/batch | Batch multiple queries |
| GET | /cubejs-api/v1/meta | Cube metadata |
| POST, GET | /cubejs-api/v1/sql | Generate SQL |
| POST, GET | /cubejs-api/v1/dry-run | Query dry-run |
| POST | /cubejs-api/v1/explain | EXPLAIN plan |
| POST | /cubejs-api/v1/discover | AI discovery |
| POST | /cubejs-api/v1/suggest | AI suggestions |
| POST | /cubejs-api/v1/validate | Query validation |
| POST | /cubejs-api/v1/agent/chat | AI agent SSE endpoint |
| POST | /mcp | MCP JSON-RPC request |
| GET | /mcp | MCP SSE connection |
| DELETE | /mcp | MCP session termination |

## Common Adapter Options

All framework option interfaces extend the same shape:

| Option | Required | Purpose |
|--------|----------|---------|
| `cubes` | yes | Array of cube definitions |
| `drizzle` | yes | Drizzle ORM database instance |
| `extractSecurityContext` | yes | Per-request auth → `SecurityContext` |
| `schema` | no | Drizzle schema for type inference |
| `engineType` | no | DB engine (auto-detected if omitted) |
| `cors` | no | CORS configuration |
| `basePath` | no | API prefix (default `/cubejs-api/v1`) |
| `jsonLimit` | no | Body parser limit (default `10mb`) |
| `cache` | no | Query result caching config |
| `mcp` | no | MCP endpoint config (default enabled) |
| `agent` | no | Agentic AI chat config (requires `@anthropic-ai/sdk`) |
| `rlsSetup` | no | Row-Level Security transaction setup |

## Structural Difference: Next.js

Express, Fastify, and Hono export **router/app creators** (`createCubeRouter`, `cubePlugin`, `createCubeRoutes`) that mount all endpoints at once. Next.js instead exports **individual handler creators** (`createLoadHandler`, `createMcpRpcHandler`, etc.) designed for App Router route files — each route file re-exports the relevant handler as `GET`/`POST`/`DELETE`. A convenience `createCubeHandlers` returns all handlers as a single object.

## MCP Transport (mcp-transport.ts)

JSON-RPC 2.0 protocol layer shared by all adapters. `dispatchMcpMethod` routes `initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `prompts/list`, and `prompts/get` to semantic-layer operations. `negotiateProtocol` selects the highest mutually-supported MCP protocol version. `validateOriginHeader` enforces origin allowlists. `serializeSseEvent` formats Server-Sent Events for the GET /mcp streaming connection.

## Guard Rails

1. **Security context is mandatory** — `extractSecurityContext` must be provided; queries cannot execute without it.
2. **API consistency** — all four adapters expose identical endpoints and response shapes.
3. **MCP origin validation** — `validateOriginHeader` in mcp-transport.ts enforces allowed-origin checks before processing MCP requests.
4. **Locale propagation** — all adapters extract the `X-DC-Locale` header via `resolveRequestLocale()` (in `locale.ts`) and merge it into `SecurityContext`. New adapters must include this. See `src/i18n/CLAUDE.md`.
