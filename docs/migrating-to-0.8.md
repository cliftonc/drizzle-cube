# Migrating to 0.8

0.8 makes cube definitions resolvable **per tenant**. The mechanism is described in
[`per-tenant-cube-sets.md`](./per-tenant-cube-sets.md); this page is only the
breaking changes and what to do about them.

**If you have a single-tenant deployment, nothing behaves differently.** With no
`contextToCubeSetId` configured, every security context resolves to the base set
exactly as before. Only signatures moved.

## 1. `securityContext` is required on every cube-resolving method

Because cube contents can now differ per tenant, these methods take a required
`SecurityContext`:

```diff
- semanticLayer.getMetadata()
+ semanticLayer.getMetadata(securityContext)

- semanticLayer.validateQuery(query)
+ semanticLayer.validateQuery(query, securityContext)

- semanticLayer.getCube(name)          semanticLayer.hasCube(name)
+ semanticLayer.getCube(name, securityContext)
+ semanticLayer.hasCube(name, securityContext)

- semanticLayer.getAllCubes()          semanticLayer.getAllCubesMap()
- semanticLayer.getCubeNames()
+ semanticLayer.getAllCubes(securityContext)
+ semanticLayer.getAllCubesMap(securityContext)
+ semanticLayer.getCubeNames(securityContext)
```

**What to do:** pass the security context you already have. Your compiler will
list every site.

This is deliberately a required parameter rather than an optional one with a
fallback. An optional parameter would leave the exact failure the feature exists
to prevent — a caller that forgets the context still gets *a* cube list, and it
is the wrong tenant's.

If your deployment genuinely has no tenancy, say so explicitly:

```ts
import { SINGLE_TENANT_CONTEXT } from 'drizzle-cube/server'

const metadata = semanticLayer.getMetadata(SINGLE_TENANT_CONTEXT)
```

Registration is unaffected: `registerCube`, `registerCubeSet`,
`unregisterCubeSet` and `getCubeSetStats` take no context, because registration
defines tenancy rather than operating within it.

## 2. `/meta` is tenant-scoped

**Users of the Hono, Express, Fastify and Next.js adapters need no code change** —
`extractSecurityContext` is already in your options and the adapter now passes it
to `/meta` as it always has to every other route. Two things change anyway:

- **`/meta` now invokes your extractor.** It never did before. If your extractor
  throws for unauthenticated requests, anonymous `/meta` calls will now fail. If
  you want metadata to stay public, return `SINGLE_TENANT_CONTEXT` from your
  extractor for anonymous requests.
- **`/meta` is no longer publicly cacheable.** The response used to be identical
  for every caller. A shared cache or CDN keyed on URL alone would now
  cross-serve one tenant's cube list to another.

## 3. Every REST response sets `Cache-Control: private, no-store`

`/meta`, `/load`, `/sql`, `/dry-run`, `/batch` and `/explain` previously carried
no `Cache-Control` at all, which permits heuristic caching of tenant data by a
shared cache. They now set `private, no-store`.

Client-side caching is unaffected: the drizzle-cube React client caches through
TanStack Query's `staleTime`, not the HTTP cache.

## 4. `HttpPort.setHeader` is required — third-party adapters only

If you have written your own framework adapter, `setHeader(name, value)` moved
from `McpHttpPort` to the base `HttpPort` and is now required, so REST responses
can carry the cache header. All four first-party adapters already implemented it.

## 5. Changed handler signatures

Only relevant if you call these directly rather than through an adapter. Each
takes the security context as its second argument, matching `handleLoad`:

- `handleDiscover(semanticLayer, securityContext, body)`
- `handleSuggest(semanticLayer, securityContext, body)`
- `handleValidate(semanticLayer, securityContext, body)`
- `buildMcpResources(semanticLayer, securityContext, resources?)`
- `buildMcpSchemaResource(semanticLayer, securityContext)`
- `handleMetaGet(port, getBaseSecurityContext)` — now async

MCP behaviour follows from this: `discover` and `validate` called without a
resolvable security context now return an error result rather than answering
from the base set, and MCP resources are resolved per request instead of being
built once at handler construction.

## 6. `QueryContext` gains `cast` and `tryCast`

Cube `sql` functions now receive engine-portable cast helpers:

```ts
sql: (ctx) => ctx.tryCast(myTable.value, 'decimal')
```

`tryCast` yields NULL for unparseable input on every engine, rather than failing
the query (Postgres) or silently returning `0` (MySQL/SQLite). Both are required
fields, so if you construct a `QueryContext` by hand — typically in tests — you
must supply them.

## 7. `shown: false` is now honoured

`shown: false` on a dimension or measure previously did nothing. It now omits
the member from `/meta`, the client field picker and AI prompts. The member
remains fully queryable, matching Cube.js semantics. If you had set
`shown: false` expecting it to be ignored, those fields will now disappear from
metadata surfaces.
