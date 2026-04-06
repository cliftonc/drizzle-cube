# Architect Plan: MCP Server Name

## Problem Statement
Issue #592 requests configurable MCP branding so embedded deployments can present the MCP server using product-specific naming instead of the hardcoded Drizzle Cube identity. The current implementation hardcodes the server name, prompt names, resource names, app title, and MCP URIs across `src/adapters/mcp-transport.ts`, `src/adapters/mcp-tools.ts`, `src/server/ai/mcp-prompts.ts`, and `src/mcp-app/*`. The issue discussion also explicitly asks that the configured display name drive a derived slug used consistently in MCP URIs and that the embedded MCP App title be runtime-configurable rather than permanently baked into the bundle.

## Summary of what needs to change
Add a single public branding option (`mcp.serverName`) to the adapter-facing MCP configuration, derive a stable slug/tool-prefix from it, thread that branding into the built-in MCP transport and composable MCP tools, and inject runtime app metadata into the embedded MCP app HTML so the served visualization matches the configured brand.

## Files to modify (with line numbers and what to change)
- `src/adapters/utils.ts:757-791` — extend `MCPOptions` with `serverName?: string` and document that it controls display name + derived slug for MCP surfaces.
- `src/adapters/mcp-transport.ts:18-27,45-55,248-299,635-825` — replace hardcoded MCP branding with shared branding helpers; make `serverInfo.name`, default prompts/resources, schema resource URI, MCP app resource URI, quickstart/query-shapes URIs, and app resource display names derive from the configured name/slug; allow `getMcpAppHtml(...)`, `getDefaultResources(...)`, `getDefaultPrompts(...)`, and `buildMcpResources(...)` to accept branding.
- `src/adapters/mcp-tools.ts:88-118,215-228,321-330` — add `serverName?: string` to `GetCubeToolsOptions`; derive the default tool prefix from the branded slug when `toolPrefix` is omitted; brand prompts/resources/app resource consistently.
- `src/adapters/express/index.ts:651-714`, `src/adapters/fastify/index.ts:738-788`, `src/adapters/hono/index.ts:651-703`, `src/adapters/nextjs/index.ts:1008-1019` — pass `mcp.serverName` into MCP transport/resource/prompt builders so all built-in adapters expose branded MCP metadata.
- `src/server/ai/mcp-prompts.ts:17-187` — refactor default prompt creation into a factory that accepts branding and derives prompt names/descriptions/text from display name + slug instead of hardcoded `drizzle-cube-*` strings.
- `src/mcp-app/mcp-app.html:1-10` and `src/mcp-app/mcp-app.tsx:240-267` — add a small runtime config bridge (`window.__DRIZZLE_CUBE_MCP_APP__` or equivalent), use it to set the document title/appInfo name, and keep one reusable compiled bundle.
- `src/mcp-app/generated-html.ts` — regenerate after app/runtime-config changes.
- `tests/adapters/mcp-transport.test.ts:527-930` — add/update coverage for branded initialize response, resource URIs, schema URI, prompt names, and prompt/resource resolution using `serverName`.
- `tests/adapters/mcp-tools.test.ts` (new) — cover branded default tool prefix, branded resources/prompts, and explicit `toolPrefix` override behavior.

## Implementation approach (step-by-step)
1. Add a small branding helper surface that resolves:
   - display name: configured `serverName` or default `Drizzle Cube`
   - protocol/server slug: kebab-cased form of the display name, defaulting to `drizzle-cube`
   - tool prefix: snake-cased slug + trailing underscore, defaulting to `drizzle_cube_`
2. Extend `McpDispatchContext` and MCP utility functions so branding flows through initialize, default resources, schema resource generation, and MCP app resource generation.
3. Refactor prompt generation from static constants to branding-aware factory functions while keeping the same prompt count and message structure.
4. Update each built-in adapter to pass `mcp.serverName` through to prompt/resource builders and the dispatch context.
5. Update `getCubeTools()` so branded servers get branded prompt/resource metadata and a derived default tool prefix without breaking callers that already set `toolPrefix` explicitly.
6. Inject runtime app metadata into the served MCP app HTML and consume it from the React app so the embedded app title/identity matches the configured branding without requiring per-tenant builds.
7. Add/adjust tests first where practical, then implement until the new branding surfaces are covered.
8. Regenerate `src/mcp-app/generated-html.ts` with `npm run build:mcp-app`, then run focused verification (`npm run typecheck`, targeted Vitest suites).

## Risks and edge cases to watch for
- Slug derivation must be deterministic and safe for URI schemes/hosts; whitespace, punctuation, duplicate separators, and empty/invalid names need sane fallbacks.
- Existing consumers may depend on the legacy `drizzle_cube_` prefix; only change the default when `serverName` is explicitly supplied, and keep explicit `toolPrefix` as the strongest override.
- Prompt/resource resolvers that derive from defaults must continue to work when defaults become branding-aware factories.
- Runtime app config injection must avoid corrupting the generated single-file HTML bundle and should remain safe if the name contains quotes or special characters.
- Changing URI schemes affects resource lookup tests and any code assuming hardcoded `drizzle-cube://...`; updates must be internally consistent across list/read/build helpers.

## Test strategy (what tests to write/run)
- Update `tests/adapters/mcp-transport.test.ts` to assert:
  - `dispatchMcpMethod('initialize', ...)` returns branded `serverInfo.name`
  - branded quickstart/query-shapes/schema/app resource URIs are produced when `serverName` is set
  - branded prompt names are exposed through `getDefaultPrompts()`/`prompts/get`
- Add `tests/adapters/mcp-tools.test.ts` for:
  - derived default prefix from `serverName`
  - explicit `toolPrefix` override preserved
  - branded prompts/resources returned from `getCubeTools()`
- Run `CI=true npm install`, `npm run build:mcp-app`, `npm run typecheck`, and targeted Vitest suites covering MCP transport/tools.

## Estimated complexity: medium
