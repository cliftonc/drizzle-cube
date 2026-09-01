/**
 * The bundled MCP App HTML — public subpath `drizzle-cube/mcp-app-html`.
 *
 * This is the ~2 MB single-file MCP App (React + charts, inlined by
 * `vite-plugin-singlefile` → `src/mcp-app/generated-html.ts`). It is only ever
 * needed when `mcp.app` is enabled and a client lists or reads the
 * `ui://drizzle-cube/visualization.html` resource, so the MCP transport loads it
 * with a dynamic `import()` at that moment rather than at adapter import time.
 *
 * **Invariant:** nothing reachable from the adapter entries (`hono`, `express`,
 * `fastify`, `nextjs`, `core`, `utils`) may import this module — or
 * `../mcp-app/generated-html.js` — statically. A static import drags the blob
 * into every consumer's server bundle even with `mcp.enabled: false`
 * (`tests/adapters/mcp-app-html-lazy.test.ts` guards this). The one deliberate
 * static importer is `mcp-tools.ts` (`drizzle-cube/mcp`), whose `resources`
 * array is synchronous public API.
 *
 * In the published build the transport's `import()` targets the bare specifier
 * `drizzle-cube/mcp-app-html` (see `vite.config.adapters.ts`), so bundlers that
 * count every emitted module against a size budget (e.g. wrangler for
 * Cloudflare Workers) can alias it to a stub exporting `mcpAppHtml = ''` when the
 * MCP App is not used.
 */

import { mcpAppHtml as generatedHtml } from '../mcp-app/generated-html.js'

/** The bundled MCP App as a single HTML document. Empty string if not yet built. */
export const mcpAppHtml: string = generatedHtml
