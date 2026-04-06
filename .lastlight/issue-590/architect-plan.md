# Architect Plan: #590 — MCP App locale support

## Problem Statement

The MCP App visualization (`src/mcp-app/mcp-app.tsx`) renders charts and tables but is not wrapped in an `I18nProvider`, so locale-sensitive rendering falls back to `en-GB` regardless of user locale. MCP does not forward `Accept-Language` at the transport layer, so locale must come from configuration at server startup time.

## Files to Modify

| File | Change |
|------|--------|
| `src/adapters/utils.ts` | Extend `MCPOptions.app` to accept `boolean \| McpAppConfig` where `McpAppConfig = { defaultLocale?: string; detectBrowserLocale?: boolean }` |
| `src/adapters/mcp-transport.ts` | Add `McpAppConfig` type; extend `McpDispatchContext` with `appConfig?`; update `getMcpAppResource()` to inject `window.__DRIZZLE_CUBE_MCP_APP_CONFIG__` script into HTML when config provided |
| `src/adapters/express/index.ts` | Pass `appConfig` from `mcp.app` through dispatch context |
| `src/adapters/fastify/index.ts` | Same |
| `src/adapters/hono/index.ts` | Same |
| `src/adapters/nextjs/index.ts` | Same |
| `src/mcp-app/mcp-app.tsx` | Read `window.__DRIZZLE_CUBE_MCP_APP_CONFIG__`, resolve locale, wrap `<McpApp />` in `<I18nProvider locale={...}>` |
| `tests/adapters/mcp-transport.test.ts` | Add tests for config injection in `getMcpAppResource` |

## Implementation Steps

1. Add `McpAppConfig` interface to `src/adapters/utils.ts`, change `app?: boolean` to `app?: boolean | McpAppConfig`.
2. In `src/adapters/mcp-transport.ts`:
   - Export `McpAppConfig` (re-export or define locally)
   - Add `appConfig?: McpAppConfig` to `McpDispatchContext`
   - Update `getMcpAppResource(config?)` to inject a `<script>` before `</head>` if config is provided
   - Pass `ctx.appConfig` through `dispatchMcpMethod`
3. In each adapter (`express`, `fastify`, `hono`, `nextjs`):
   - Extract `appConfig = typeof mcp.app === 'object' ? mcp.app : undefined`
   - Pass `appConfig` into dispatch context alongside `appEnabled`
4. In `src/mcp-app/mcp-app.tsx`:
   - Import `I18nProvider` from `../client/providers/I18nProvider`
   - Add `resolveMcpAppLocale()` helper that reads `window.__DRIZZLE_CUBE_MCP_APP_CONFIG__`
   - Wrap `<McpApp />` in `<I18nProvider locale={resolveMcpAppLocale()}>`

## Risks

- Injecting a script into bundled HTML is a regex/string operation on the generated HTML — must be robust to different `</head>` positions (always present in the template).
- `window.__DRIZZLE_CUBE_MCP_APP_CONFIG__` must be declared before the app bundle runs, so placement before `</head>` (not `</body>`) is required.
- The `I18nProvider` re-renders children once locale loads — this is fine since `en-GB` is statically bundled and renders immediately.

## Test Strategy

- Unit test `getMcpAppResource` with and without config (config injection, no injection).
- Verify locale resolution logic in mcp-app (can be tested via the exported helper if extracted).

## Complexity

Low-medium. No new dependencies, no schema changes, no DB interaction.
