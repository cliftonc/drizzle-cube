# Executor Summary: #590 — MCP App locale support

## Changes Made

### `src/adapters/utils.ts`
- Added `McpAppConfig` interface with `defaultLocale?: string` and `detectBrowserLocale?: boolean`
- Changed `MCPOptions.app` from `boolean` to `boolean | McpAppConfig`

### `src/adapters/mcp-transport.ts`
- Imported and re-exported `McpAppConfig`
- Added `appConfig?: McpAppConfig` to `McpDispatchContext`
- Extended `getMcpAppHtml(config?)` to inject `window.__DRIZZLE_CUBE_MCP_APP_CONFIG__` script before `</head>` when config is provided and html is non-empty
- Updated `getMcpAppResource(config?)` to pass config through to `getMcpAppHtml`
- Updated `dispatchMcpMethod` to extract and thread `appConfig` from context into `getMcpAppResource`

### `src/adapters/mcp-tools.ts`
- Imported `McpAppConfig`
- Changed `GetCubeToolsOptions.app` from `boolean` to `boolean | McpAppConfig`
- Extracted `appEnabled` and `appConfig` from `app` option
- Updated `getMcpAppResources(config?)` to pass config through

### `src/adapters/express/index.ts`, `fastify/index.ts`, `hono/index.ts`, `nextjs/index.ts`
- Added `appConfig: typeof mcp.app === 'object' ? mcp.app : undefined` to each dispatch context

### `src/mcp-app/mcp-app.tsx`
- Imported `I18nProvider` from `../client/providers/I18nProvider`
- Added `resolveMcpAppLocale()` helper that reads `window.__DRIZZLE_CUBE_MCP_APP_CONFIG__`:
  - Uses `navigator.language` when `detectBrowserLocale !== false` (default)
  - Falls back to `defaultLocale` or `en-GB`
- Wrapped root render in `<I18nProvider locale={resolveMcpAppLocale()}>`

### `tests/adapters/mcp-transport.test.ts`
- Added import of `getMcpAppHtml` and `McpAppConfig`
- Added `getMcpAppHtml locale config injection` describe block with 4 tests:
  - Empty html case (no build artifact in test env)
  - Config injection pattern (script before `</head>`)
  - `defaultLocale` and `detectBrowserLocale` serialized correctly
  - `getMcpAppHtml(config)` returns `''` when no html built

## Verification

- `node_modules/.bin/tsc --noEmit` — passed clean
- `node_modules/.bin/tsc --noEmit -p tsconfig.tests.json` — passed clean
- DB-dependent test suite: no DB available in sandbox (ECONNREFUSED 127.0.0.1:54333) — consistent with all previous bot attempts on this issue

## Usage After This PR

```ts
// Enable with locale config
mcp: {
  enabled: true,
  app: {
    defaultLocale: 'nl-NL',
    detectBrowserLocale: false,  // force nl-NL regardless of browser
  }
}

// Enable with browser detection (default behavior)
mcp: {
  enabled: true,
  app: {
    defaultLocale: 'en-US',  // fallback if navigator.language unavailable
  }
}

// Boolean still works (en-GB fallback, browser detection on)
mcp: { enabled: true, app: true }
```

## Fix Loop 1 (post-reviewer)

**Issue fixed**: XSS in `getMcpAppHtml` — `JSON.stringify` output was not safe for embedding in `<script>` tags because `</script>` sequences are not escaped by default.

**Fix**: Added `.replace(/<\//g, '<\\/')` after `JSON.stringify` in `getMcpAppHtml`. This is the standard technique for safely embedding JSON in HTML `<script>` blocks — the `</` sequence cannot appear in the output unescaped, preventing script-tag breakout.

**Test updated**: Replaced synthetic reimplementation tests with tests that verify:
- The escaping rule itself (that `</` cannot appear in escaped output)
- Parseability after unescaping (round-trip check)
- JSON shape correctness
- Script placement before `</head>`

Typecheck: still clean after fix.
