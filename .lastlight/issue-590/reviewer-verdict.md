# Reviewer Verdict: #590

## Critical

**XSS via unescaped `</script>` in injected config block — `src/adapters/mcp-transport.ts:31-35`**

`JSON.stringify` does not escape `</script>` sequences. A server operator who sets:

```ts
app: { defaultLocale: '</script><script>alert(document.cookie)</script>' }
```

produces broken, exploitable HTML. While `defaultLocale` is a server-configured value (not user-controlled input), defence-in-depth requires the injection to be safe regardless. The fix is to escape `</` in the JSON output before interpolating it into a `<script>` block:

```ts
// src/adapters/mcp-transport.ts
const safeJson = JSON.stringify({
  defaultLocale: config.defaultLocale,
  detectBrowserLocale: config.detectBrowserLocale,
}).replace(/<\//g, '<\\/')

const script = `<script>window.__DRIZZLE_CUBE_MCP_APP_CONFIG__ = ${safeJson}</script>`
```

This is standard practice for JSON embedded inside `<script>` tags and must be present before merge.

## Important

**Test for `getMcpAppHtml` does not actually call the function under test — `tests/adapters/mcp-transport.test.ts:938-953`**

The second test is titled "returns html unchanged when no config is provided" but its body re-implements the injection logic manually on a `fakeHtml` string rather than calling `getMcpAppHtml`. It does not exercise the real function at all. Because the test environment has no build artifact (`mcpAppHtml === ''`), the only way to test the real injection path is to either:

1. Export `mcpAppHtml` as a mutable for test patching, or
2. Extract the injection logic into a pure helper (`injectMcpAppConfig(html, config)`) that can be unit-tested independently.

As written, if the injection logic in `getMcpAppHtml` were broken (e.g., wrong replacement token), the test suite would still pass. The fourth test (`getMcpAppHtml with config returns empty string when no html built`) is the only one that calls the real function, and it only verifies the empty-input early-exit path.

## Suggestions

**`McpAppWindowConfig` duplicates `McpAppConfig` — `src/mcp-app/mcp-app.tsx:376-379`**

`McpAppWindowConfig` is an inline interface that is structurally identical to `McpAppConfig` from `src/adapters/utils.ts`. The MCP App bundle does not import from the adapters package (it is a separate browser bundle), so this duplication is understandable, but a shared `src/mcp-app/config.ts` re-exported from both entry points would eliminate the drift risk as fields evolve.

**`resolveMcpAppLocale` is not exported — `src/mcp-app/mcp-app.tsx:381`**

Exporting `resolveMcpAppLocale` would allow unit testing of the locale resolution logic (browser detect vs. fallback) without spinning up a browser. The function is pure enough to test with a mocked `window.__DRIZZLE_CUBE_MCP_APP_CONFIG__`.

## Nits

- Test name mismatch: the second test in the new describe block is titled "returns html unchanged when no config is provided" but the body actually tests config injection on a synthetic string, not the no-config path. The title should reflect what is actually being tested (e.g., "injection logic produces correct script tag given synthetic html").
- TypeScript checks pass clean on both `tsconfig.json` and `tsconfig.tests.json`.
- All four framework adapters (express, fastify, hono, nextjs) are consistently updated.
- The `!!mcp.app` truthiness pattern correctly handles both `boolean` and object values.

## Verdict

REQUEST_CHANGES
