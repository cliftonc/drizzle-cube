# Framework Adapters

HTTP + MCP adapter layer: maps Cube.js-compatible endpoints onto Express, Fastify, Hono, and Next.js. Shared utilities live in the root; each framework subdirectory re-exports a consistent API surface.

## Directory Layout

| Path | Key Exports | Purpose |
|------|-------------|---------|
| types.ts | `BaseAdapterOptions`, `ContextExtractor`, `CorsConfig`, `AdapterResponse`, `AdapterFactory` | Shared interfaces for all adapters |
| utils.ts | `calculateQueryComplexity`, `handleDryRun`, `handleLoad`, `handleBatchRequest`, `handleDiscover`, `handleSuggest`, `handleValidate`, `formatCubeResponse`, `formatSqlResponse`, `formatMetaResponse`, `MCPOptions`, `DiscoverResponse` | Request handlers and response formatters shared across frameworks |
| mcp-transport.ts | `dispatchMcpMethod`, `negotiateProtocol`, `validateOriginHeader`, `parseJsonRpc`, `serializeSseEvent`, `buildJsonRpcError`, `buildJsonRpcResult`, `jsonRpcError`, `resolveMcpPrompts`, `resolveMcpResources`, `resolveMcpInstructions`, `getDefaultInstructions` | MCP JSON-RPC protocol: method dispatch, SSE serialization, origin validation, instructions resolver |
| express/index.ts | `ExpressAdapterOptions`, `createCubeRouter`, `mountCubeRoutes`, `createCubeApp` | Express router/app factory. Thin: maps req/res to an `McpHttpPort` and routes REST + MCP POST to the core. Only the agent/chat SSE stream and the long-lived GET/DELETE `/mcp` lifecycle remain inline (inherently transport-bound). |
| fastify/index.ts | `FastifyAdapterOptions`, `cubePlugin`, `registerCubeRoutes`, `createCubeApp` | Fastify plugin + app factory. Thin: maps request/reply to an `McpHttpPort` and routes REST + MCP POST to the core (route-level `bodyLimit`/`schema` preserved). Only the agent/chat SSE stream and the GET/DELETE `/mcp` lifecycle remain inline (transport-bound). |
| hono/index.ts | `HonoAdapterOptions`, `createCubeRoutes`, `mountCubeRoutes`, `createCubeApp` | Hono routes/app factory. Thin: maps the `Context` to an `McpHttpPort` and routes REST + MCP POST to the core. Agent/chat (`hono/agent-handler.ts`) and the GET/DELETE `/mcp` lifecycle remain inline (transport-bound). |
| core/index.ts | `HttpPort`, `McpHttpPort`, `createCubeHttpHandler`, `CubeHttpHandler`, `CubeHttpHandlerOptions`, `RestHandlers`, `BaseSecurityContextThunk`, `HeaderReader`, `withLocaleFromHeaders`, `resolveSecurityContext` | Framework-agnostic HTTP handler seam — generic `HttpPort<TRes>` (REST) + `McpHttpPort<TRes>` (MCP) ports and the deep `createCubeHttpHandler` core. Covers all REST endpoints (`load`/`meta`/`sql`/`dry-run`/`batch`/`explain`, GET+POST where applicable) **and** MCP POST dispatch. Public so third parties can build adapters for other frameworks. **All four adapters (Express, Fastify, Hono, Next.js) are migrated onto it** — each holds only req/res→port translation + routing. One core, four call sites. |
| nextjs/index.ts | `NextAdapterOptions`, `createLoadHandler`, `createMetaHandler`, `createSqlHandler`, `createDryRunHandler`, `createBatchHandler`, `createExplainHandler`, `createDiscoverHandler`, `createSuggestHandler`, `createValidateHandler`, `createMcpRpcHandler`, `createAgentChatHandler`, `createCubeHandlers` | Next.js App Router — individual handler creators (not a router). The Cube.js REST endpoints + MCP POST route through the core via a per-request `NextRequest`→port mapping (CORS headers attached by the port); the AI-discovery helpers (`discover`/`suggest`/`validate`/`mcp-load`, Next.js-only) and the transport-bound flows (agent/chat SSE, MCP GET stream) stay inline. |

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

Express, Fastify, and Hono export **router/app creators** (`createCubeRouter`, `cubePlugin`, `createCubeRoutes`) that mount all endpoints at once. Next.js instead exports **individual handler creators** (`createLoadHandler`, `createMcpRpcHandler`, etc.) designed for App Router route files — each route file re-exports the relevant handler as `GET`/`POST`/`DELETE`. A convenience `createCubeHandlers` returns all handlers as a single object; it builds one `SemanticLayerCompiler` and injects it (via the `semanticLayer` option) into every handler, so they share one metadata/result cache. Standalone single-handler factories still build their own compiler.

## MCP Transport (mcp-transport.ts)

JSON-RPC 2.0 protocol layer shared by all adapters. `dispatchMcpMethod` routes `initialize`, `tools/list`, `tools/call`, `resources/list`, `resources/read`, `prompts/list`, and `prompts/get` to semantic-layer operations. `negotiateProtocol` selects the highest mutually-supported MCP protocol version. `validateOriginHeader` enforces origin allowlists. `serializeSseEvent` formats Server-Sent Events for the GET /mcp streaming connection.

### Delivering query-construction guidance to the LLM

Most MCP clients do NOT forward `prompts/*` or `resources/*` content to the model — they expose them as user-triggered slash commands. The two channels we *can* rely on are:

1. **`InitializeResult.instructions`** — `dispatchMcpMethod('initialize', …)` returns an `instructions` string that clients merge into the LLM system prompt. Default content lives in `DEFAULT_MCP_INSTRUCTIONS` (`src/server/ai/mcp-prompts.ts`). Override per-deployment via `MCPOptions.instructions` (string or `(defaults) => string` resolver). Use `resolveMcpInstructions()` to apply the resolver in your adapter before passing it to `dispatchMcpMethod` as `ctx.instructions`.
2. **`discover` tool response** — `handleDiscover` always returns `queryLanguageReference` and `dateFilteringGuide` alongside the matched cubes. The `discover` tool description and the default instructions both mandate calling `discover` first, so the model receives the full DSL on the first tool call without an extra roundtrip.

When adding a new adapter: `resolveMcpInstructions(mcp.instructions)` once at setup time, and pass the result as `ctx.instructions` into every `dispatchMcpMethod` call (mirrors the existing `prompts` / `resources` plumbing).

## Guard Rails

1. **Security context is mandatory** — `extractSecurityContext` must be provided; queries cannot execute without it.
2. **API consistency** — all four adapters expose identical endpoints and response shapes.
3. **MCP origin validation** — `validateOriginHeader` in mcp-transport.ts enforces allowed-origin checks before processing MCP requests.
4. **Locale propagation** — the `X-DC-Locale` header is merged into `SecurityContext` via `withLocaleFromHeaders()` (re-exported from `core`; wraps `resolveRequestLocale` + `withLocaleInSecurityContext` from `locale.ts`). Core handlers do this internally; adapters supply a base (pre-locale) context thunk. For transport-bound handlers an adapter keeps inline (e.g. Express agent/chat), call `withLocaleFromHeaders` directly rather than re-declaring the wrapper. See `src/i18n/CLAUDE.md`.
