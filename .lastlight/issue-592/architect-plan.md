# Architect Plan — Issue #592: MCP Server Name Configurability

## Problem Statement

The MCP server's `initialize` response hardcodes `name: 'drizzle-cube'` at `src/adapters/mcp-transport.ts:294`. This branding leaks into every MCP client that connects, and operators embedding Drizzle Cube under their own product name (e.g. "Semantius Cube", "Cube MCP") cannot change it. The same string is repeated in resource names (`src/adapters/mcp-transport.ts:640,658`) and in `src/mcp-app/mcp-app.tsx:231`, and there is no option in any of the four framework adapters or in `MCPOptions` (`src/adapters/utils.ts:757`) to supply a custom name.

## Summary of What Needs to Change

1. Add an optional `serverName` field to `MCPOptions` in `src/adapters/utils.ts`.
2. Propagate `serverName` from `MCPOptions` into `McpDispatchContext` in `src/adapters/mcp-transport.ts`.
3. Use `serverName` (with fallback to `'drizzle-cube'`) in the `initialize` method response inside `dispatchMcpMethod`.
4. Thread `serverName` through all four framework adapters (Express, Fastify, Hono, Next.js) where `dispatchMcpMethod` is called.
5. Update the test that asserts `serverInfo.name === 'drizzle-cube'` to also cover the configurable case.

The `Drizzle Cube Visualization` resource name in `getMcpAppResource()` / `getMcpAppResources()` and the `mcp-app.tsx` `appInfo.name` are cosmetic labels visible to end-users through resources, not to AI agents via the protocol handshake. These are lower-priority and can be handled separately; include them only if the issue explicitly demands full resource-name configurability. For this issue the core ask is the `serverInfo.name` in `initialize`.

## Files to Modify

### `src/adapters/utils.ts` — lines 757–791
Add `serverName?: string` to `MCPOptions`:
```ts
/**
 * Optional name to use in the MCP serverInfo.name field (initialize response).
 * Defaults to 'drizzle-cube'. Override to match your product branding.
 */
serverName?: string
```

### `src/adapters/mcp-transport.ts` — lines 45–55, 248–299
1. Add `serverName?: string` to `McpDispatchContext` interface (after `appEnabled?`).
2. In `dispatchMcpMethod`, destructure `serverName` from `ctx` and use it:
   ```ts
   const serverName = ctx.serverName ?? 'drizzle-cube'
   // ...
   serverInfo: {
     name: serverName,
     version: typeof process !== 'undefined' ? process.env?.npm_package_version || 'dev' : 'worker'
   }
   ```

### `src/adapters/express/index.ts` — line 702–714
In the `dispatchMcpMethod` call, add `serverName: mcp.serverName` to the context object.

### `src/adapters/fastify/index.ts` — line 776–787
Same as Express: add `serverName: mcp.serverName`.

### `src/adapters/hono/index.ts` — line 691–702
Same as Express: add `serverName: mcp.serverName`.

### `src/adapters/nextjs/index.ts` — line 1008–1018
Same as Express: add `serverName: mcp.serverName`.

### `tests/adapters/mcp-transport.test.ts` — lines 654–662
Update the existing assertion and add a new test case:
- Existing test: keep `toBe('drizzle-cube')` (default behaviour).
- New test: pass `serverName: 'My Product'` in the context and assert `serverInfo.name === 'My Product'`.

## Implementation Approach

1. **`src/adapters/utils.ts`** — Add the JSDoc-commented `serverName?: string` field to `MCPOptions` after `resourceMetadataUrl`.

2. **`src/adapters/mcp-transport.ts`** — Two edits:
   - Add `serverName?: string` to `McpDispatchContext` (between `appEnabled?` and the closing brace).
   - In `dispatchMcpMethod`, derive `const serverName = ctx.serverName ?? 'drizzle-cube'` at the top of the function, then replace the literal `'drizzle-cube'` string at line 294.

3. **Four framework adapters** (Express / Fastify / Hono / Next.js) — Each has one `dispatchMcpMethod` call. Add `serverName: mcp.serverName` to the context object passed to that call. The `mcp` variable is already in scope in all four adapters at the call site.

4. **Tests** — In `tests/adapters/mcp-transport.test.ts`, add a second `it` block inside `describe('initialize method')` that builds a `dispatchCtx` with `serverName: 'Semantius Cube'` and asserts `result.serverInfo.name === 'Semantius Cube'`.

5. Run `npm run typecheck` and `npm run lint` to confirm no regressions. Then run `npm run test:postgres` (or `npm test`) to confirm all tests pass.

## Risks and Edge Cases

- **Backward compatibility**: Defaulting to `'drizzle-cube'` when `serverName` is absent preserves all existing behaviour. No breaking change.
- **MCP spec compliance**: The MCP spec does not restrict the `serverInfo.name` value; any non-empty string is valid.
- **`mcp-app.tsx` `appInfo.name`**: This is embedded in a pre-built HTML bundle (`src/mcp-app/generated-html.ts`). It cannot be parameterised at runtime without plumbing the name into the HTML generation pipeline (a separate, more complex change). Out of scope for this issue.
- **Resource URIs** (`drizzle-cube://quickstart`, `drizzle-cube://schema`): These are opaque identifiers used by clients to request resources. Changing them would be a breaking change for any client that has stored these URIs. Leave as-is.
- **Resource display names** (`'Drizzle Cube MCP Quickstart'`, `'Drizzle Cube Visualization'`): Cosmetic only, but operators can already override resources via `MCPOptions.resources`. No code change required; document that resources can be replaced via that option.

## Test Strategy

- **Unit (existing)**: `tests/adapters/mcp-transport.test.ts` — existing test at line 661 continues to assert the default `'drizzle-cube'` name.
- **Unit (new)**: Add test in the same `describe('initialize method')` block for a custom `serverName` value.
- **Type-check**: `npm run typecheck` must pass — verifies `serverName` threads cleanly through all types.
- **Lint**: `npm run lint` must pass.
- **Integration**: Adapter-level tests (if any) in `tests/adapters/` will exercise the path through each framework adapter indirectly.

## Estimated Complexity

**Simple**

The change is additive (new optional field, no signature breakage), touches a single function in the core transport, and four nearly-identical call sites in the framework adapters. Total diff is expected to be under 40 lines.
