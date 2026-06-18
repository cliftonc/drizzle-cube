# Adapters — Domain Glossary

Ubiquitous language for the HTTP + MCP transport layer (`src/adapters/`). Architecture terms (**module, interface, seam, adapter, deep/shallow, leverage, locality**) follow the `/codebase-design` vocabulary. Use these terms exactly in issues, tests, and proposals — don't drift to "service", "API layer", or "boundary".

## Terms

### Handler protocol
The framework-agnostic **seam** where "an HTTP request becomes a Cube result" lives **once**. Composed of the **HttpPort** interface plus the **CubeHttpHandler core**. Before it, the four framework adapters each re-implemented the same request → query → response flow inline (shallow, duplicated); the handler protocol is the deep module they all translate onto. Introduced incrementally: REST `/load` (issue #906), rest of the endpoints + MCP (#908), all four adapters + SSE (#909).

### HttpPort
The small, **public** transport **interface** the core runs against — `getHeader`, `getBody`, `getQueryParam`, `send`. Generic over the framework response type (`HttpPort<TRes>`) so `send(status, body)` works whether the framework mutates a response object (Express) or returns one (Hono, Next.js). Deliberately tiny and dumb: `formatErrorResponse` and all decisions live in the core, not the port. Exported via `./adapters/core` so third parties can author adapters for other frameworks.

### CubeHttpHandler core
The deep **module** behind the handler protocol — `createCubeHttpHandler({ semanticLayer, onError })`. Owns REST orchestration (validate → execute → `formatCubeResponse`), security-context + locale-merge, the `x-cache-control` cache bypass, and all 400-vs-500 mapping. Contains **no framework types**. The interface is the test surface: tested against a fake port with a stubbed `semanticLayer`, no running server.

### Adapter
In this repo, a **thin per-framework translation** (Express, Fastify, Hono, Next.js) from framework-native `req`/`res` onto the HttpPort, plus route wiring. Adapters should hold no request-handling logic once the handler protocol is fully adopted — that's the deepening goal. (Distinct from a **database adapter** in `src/server/adapters/`, which is engine-specific SQL generation.)

### REST load vs `handleLoad`
Two intentionally distinct load orchestrations:
- **REST load** — the HTTP `/load` flavor: no field normalization, validation failure → 400 JSON, honors `x-cache-control: no-cache`, returns `formatCubeResponse(...)`. Owned by the CubeHttpHandler core.
- **`handleLoad`** (`src/server/query-handlers.ts`) — the MCP/agent flavor: runs `normalizeQueryFields`, **throws** on invalid, no cache control, returns raw `{ data, annotation, query }`. Used by MCP transport, the agent tools, and the Next.js MCP load handler.

They coexist by design; converging them is an open, unticketed decision — do not silently merge them.

### Security context
The per-request auth/tenant value produced by the user-supplied `extractSecurityContext(req, res)` and threaded into every query for multi-tenant isolation. The user's extractor takes framework-native `req`/`res`, so adapters wrap it in a framework-free thunk before handing it to the core.

### Locale propagation
Merging the `X-DC-Locale` request header into the security context via `resolveRequestLocale` + `withLocaleInSecurityContext`. Historically a copy-pasted `extractSecurityContextWithLocale` wrapper per adapter; the handler protocol moves locale-merge **into the core** (reading the header through `HttpPort.getHeader`), deleting the wrapper as endpoints migrate.

### MCP transport
The JSON-RPC 2.0 protocol layer (`mcp-transport.ts`) shared by all adapters: `dispatchMcpMethod`, protocol negotiation, origin validation, SSE serialization. SSE support enters the HttpPort in #909 as an **optional** member / `SseCapablePort` extension — never a new required member, since the port is public.
