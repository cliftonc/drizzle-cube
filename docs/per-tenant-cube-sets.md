# Per-tenant cube definitions (cube sets)

Serve different cube definitions to different tenants from one
`SemanticLayerCompiler` — drizzle-cube's equivalent of Cube's `COMPILE_CONTEXT`.

Most multi-tenancy in drizzle-cube needs nothing of the sort: one cube
definition serves every tenant, and `securityContext` is threaded into each
cube's `sql` so rows are filtered per tenant. Reach for cube sets only when the
**shape** of the model differs per tenant — which cubes, dimensions or measures
exist — not merely which rows are visible.

The motivating case is user-defined attributes (EAV): an admin adds a "Health"
attribute for their organisation, it becomes a dimension, and no other tenant
should see it.

**A working example lives in `dev/`**: `dev/server/attribute-cubes.ts` is the
boot loop below against real tables, the seed gives two organisations
*different* attributes, and the dev site's header has an org switcher so you can
watch `/meta` and the Employee Records dashboard change shape between them.
Run `npm run dev:setup && npm run dev`.

Upgrading an existing deployment? See [Release 0.8](https://www.drizzle-cube.dev/guides/migrating-to-0-8/).

## The boot loop

Cube sets are registered synchronously at application startup. There is no
async loader: resolution stays synchronous, so `getMetadata()` and
`validateQuery()` keep their signatures and no request pays a load cost.

```ts
import { SemanticLayerCompiler } from 'drizzle-cube/server'

const layer = new SemanticLayerCompiler({
  drizzle: db,
  schema,
  // Cube's contextToAppId, by another name.
  contextToCubeSetId: (ctx) => String(ctx.organisationId),
  onCubeSetRegistered: (info) => logger.debug('cube set registered', info)
})

// Cubes every tenant shares.
layer.registerCube(employeesCube)
layer.registerCube(departmentsCube)

// One set per tenant, overlaying the base set by cube name.
for (const org of await db.select().from(organisations)) {
  const attrs = await db
    .select()
    .from(attributes)
    .where(eq(attributes.organisationId, org.id))

  layer.registerCubeSet(String(org.id), [buildProjectsCube(attrs)])
}

const stats = layer.getCubeSetStats()
logger.info(
  `registered ${stats.setCount} cube sets, ${stats.cubeCount} cubes ` +
  `in ${stats.totalRegistrationMs}ms (slowest: ${stats.slowestSet?.setId})`
)
```

`registerCubeSet` merges each set over the base set **at registration time**, so
request paths read a precomputed map and never merge. A set may add cubes or
replace a base cube with a tenant-specific version — the usual case, since
adding generated dimensions means re-declaring the cube that carries them.

## Resolution, and what happens when a set is missing

| `contextToCubeSetId` returns | Result |
|---|---|
| not configured at all | base set — the single-tenant default, unchanged behaviour |
| `undefined` / `null` / `''` | base set |
| an id with a registered set | that set, merged over the base set |
| an id with **no** registered set | base set, or throws under `missingCubeSet: 'throw'` |

Set `missingCubeSet: 'throw'` when every tenant is required to have a set — it
turns "this org was never registered" into a loud failure instead of a tenant
silently seeing the base model.

## Every cube read needs a security context

Since cube contents vary per tenant, `securityContext` is a **required**
argument on every method that resolves cubes:

```ts
layer.getMetadata(securityContext)
layer.validateQuery(query, securityContext)
layer.getCube(name, securityContext)
layer.getAllCubes(securityContext)
layer.getAllCubesMap(securityContext)
layer.getCubeNames(securityContext)
layer.hasCube(name, securityContext)
```

This is deliberate. An optional parameter with a base-set fallback would leave
the exact failure this feature exists to remove: a caller that forgets the
context still receives *a* cube list, and it is the wrong tenant's. Requiring
it makes every such site a compile error.

If your deployment has no tenancy, say so explicitly:

```ts
import { SINGLE_TENANT_CONTEXT } from 'drizzle-cube/server'

const metadata = layer.getMetadata(SINGLE_TENANT_CONTEXT)
```

`SecurityContext` is an open index-signature type, so `{}` also type-checks —
the constant exists so that "no tenancy here" reads as a decision rather than an
omission.

Set **lifecycle** is the deliberate exception: `registerCube`,
`registerCubeSet`, `unregisterCubeSet`, `hasCubeSet`, `getCubeSetIds` and
`getCubeSetStats` take no security context, because registration *defines*
tenancy rather than operating within it. They are boot-and-admin API.

## `/meta` is tenant-scoped

The `/meta` endpoint now resolves the security context like every other route,
and returns only that tenant's cubes. Two consequences for existing
deployments, even ones that change no code:

1. **`/meta` invokes your `extractSecurityContext`.** It previously did not. If
   your extractor throws for unauthenticated requests, anonymous `/meta` calls
   now fail. If you genuinely want public metadata, return
   `SINGLE_TENANT_CONTEXT` from your extractor for anonymous requests — an
   explicit choice in your code rather than a framework flag.
2. **`/meta` is no longer publicly cacheable.** The response used to be
   identical for every caller; now a shared cache or CDN keyed on URL alone
   would cross-serve one tenant's cube list to another. drizzle-cube sets
   `Cache-Control: private, no-store` on every REST response for this reason.

## Invalidation

Re-register a set to refresh it:

```ts
layer.registerCubeSet(String(org.id), [buildProjectsCube(await loadAttrs(org.id))])
```

That bumps the set's generation, which:

- drops its cached `/meta` entry (other tenants' entries are untouched), and
- changes its query-cache key component, so results computed from the old
  definitions are never served. This matters: without it, renaming or retyping
  an attribute would keep serving stale rows for the full cache TTL under an
  identical key.

Mutating the **base** set (`registerCube`, `removeCube`, `clearCubes`) rebuilds
every set's merged view and clears all cached metadata, since base cubes are
visible to every tenant.

**Multi-process deployments must signal each process.** The registry lives in
memory, so re-registering in one worker does not reach the others. Broadcast
your own "attributes changed" event and re-register in each process — this is
documented, not solved.

## Cost at boot

Registration is pure in-memory work — validation plus a map merge, with no
database round trip beyond the queries *you* run to load each tenant's
definitions. It is nonetheless proportional to tenants × cubes × dimensions, so
it is measurable rather than hidden:

- `onCubeSetRegistered({ setId, cubeCount, dimensionCount, generation, durationMs })`
  fires per set — emit it to your own logger or metrics. `dimensionCount` is
  usually the number that explains a slow boot, since generated attribute sets
  are where the volume is.
- `getCubeSetStats()` aggregates for a single summary line.
- `DC_DEBUG=cubesets` (or `DC_DEBUG=true`) prints per-set timing with no wiring.

If boot time becomes a problem, the shape of the fix is to make attributes real
indexable columns rather than to load fewer sets — see the performance ladder in
the EAV documentation.

## Limitation: generated attributes in grouped queries

Each generated dimension is a correlated subquery keyed on the record's primary
key, so a **grouped** query must also group by that key:

```js
// Fine — the record key is grouped, so the correlation is legal.
{ dimensions: ['Employees.id', 'Employees.attr_1'], measures: ['Employees.count'] }

// Rejected by Postgres and by MySQL under only_full_group_by.
{ dimensions: ['Employees.attr_1'], measures: ['Employees.count'] }
```

Postgres reports *"subquery uses ungrouped column … from outer query"*. SQLite
permits it, so this will not surface in a SQLite-only test run.

Record-grain listings — `ungrouped: true`, the case attribute dimensions exist
for — are unaffected, as are filtering and sorting. If you need to aggregate
freely across an attribute, pivot it into a real column with a view
(`MAX(CASE WHEN attribute_id = … THEN value END)`), which also makes filtering
and sorting indexable.
