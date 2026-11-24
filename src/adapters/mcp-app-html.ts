/**
 * The bundled MCP App HTML — public subpath `drizzle-cube/mcp-app-html`.
 *
 * This is the ~2 MB single-file MCP App (React + charts, inlined by
 * `vite-plugin-singlefile` into `dist/mcp-app/mcp-app.html` by
 * `npm run build:mcp-app`). It is only ever needed when `mcp.app` is enabled and
 * a client lists or reads the `ui://drizzle-cube/visualization.html` resource,
 * so the MCP transport loads it with a dynamic `import()` at that moment rather
 * than at adapter import time.
 *
 * **Source vs published build.** The HTML is a build artifact and is not
 * committed. From source (tsx dev server, vitest, typecheck) this module reads
 * `dist/mcp-app/mcp-app.html` if it has been built, and is `''` otherwise. In
 * the published build, `vite.config.adapters.ts` replaces this whole module with
 * the HTML as a string literal, so `dist` has no `fs` access and runs on edge
 * runtimes. The adapters build fails if the MCP App has not been built first.
 *
 * **Invariant:** nothing reachable from the adapter entries (`hono`, `express`,
 * `fastify`, `nextjs`, `core`, `utils`) may import this module statically. A
 * static import drags the blob into every consumer's server bundle even with
 * `mcp.enabled: false` (`tests/adapters/mcp-app-html-lazy.test.ts` guards this).
 * `drizzle-cube/mcp` (`mcp-tools.ts`) does not import it either: a host that
 * wants the app with `getCubeTools` imports this subpath itself and passes
 * `app: { html: mcpAppHtml }`.
 *
 * In the published build the transport's `import()` targets the bare specifier
 * `drizzle-cube/mcp-app-html` (see `vite.config.adapters.ts`), so bundlers that
 * count every emitted module against a size budget (e.g. wrangler for
 * Cloudflare Workers) can alias it to a stub exporting `mcpAppHtml = ''` when the
 * MCP App is not used.
 */

import { readFileSync } from 'node:fs'

/** Source-only: the built app if `npm run build:mcp-app` has run, else `''`. */
function readBuiltMcpApp(): string {
  try {
    return readFileSync(new URL('../../dist/mcp-app/mcp-app.html', import.meta.url), 'utf-8')
  } catch {
    return ''
  }
}

/** The bundled MCP App as a single HTML document. Empty string if not yet built. */
export const mcpAppHtml: string = readBuiltMcpApp()
