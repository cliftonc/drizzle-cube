import { defineConfig, type Plugin } from 'vite'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { cjsTypesMarker } from './vite.cjs-marker'

/** The public subpath the MCP transport lazy-loads the MCP App HTML from. */
const MCP_APP_HTML_SPECIFIER = 'drizzle-cube/mcp-app-html'

/**
 * Rewrite the transport's dynamic `import('./mcp-app-html.js')` to the bare,
 * self-referencing specifier `drizzle-cube/mcp-app-html` in the published build.
 *
 * In source the import stays relative so vitest, tsx and typecheck resolve it
 * without aliases. In dist a relative `import("./mcp-app-html-<hash>.js")` would
 * still be lazy, but consumers could not alias it away: bundlers whose size
 * budget counts every emitted module (wrangler / Cloudflare Workers) would keep
 * uploading the ~2 MB blob even with `mcp.enabled: false`. A stable bare
 * specifier gives them something to alias to a stub — see `src/adapters/mcp-app-html.ts`.
 * Node resolves the self-reference through package.json `exports`.
 */
function mcpAppHtmlSelfReference(): Plugin {
  return {
    name: 'drizzle-cube:mcp-app-html-self-reference',
    resolveDynamicImport(specifier, importer) {
      if (
        specifier === './mcp-app-html.js' &&
        importer.endsWith(resolve('src', 'adapters', 'mcp-transport.ts'))
      ) {
        return { id: MCP_APP_HTML_SPECIFIER, external: true }
      }
      return null
    }
  }
}

/** The MCP App that `npm run build:mcp-app` writes (vite-plugin-singlefile). */
const MCP_APP_HTML_FILE = resolve(__dirname, 'dist/mcp-app/mcp-app.html')
const MCP_APP_HTML_MODULE = resolve(__dirname, 'src/adapters/mcp-app-html.ts')

/**
 * Replace `src/adapters/mcp-app-html.ts` with the built MCP App as a string
 * literal in the published build.
 *
 * The HTML is a build artifact and is not committed. In source the module reads
 * `dist/mcp-app/mcp-app.html` with `fs` so the tsx dev server, vitest and
 * typecheck work with or without a build. The published module must not touch
 * `fs` (edge runtimes such as Cloudflare Workers have none), so this plugin
 * swaps in the HTML itself. It fails the build when the MCP App has not been
 * built, rather than shipping an empty app.
 */
function inlineMcpAppHtml(): Plugin {
  return {
    name: 'drizzle-cube:inline-mcp-app-html',
    load(id) {
      if (id !== MCP_APP_HTML_MODULE) return null
      if (!existsSync(MCP_APP_HTML_FILE)) {
        this.error(`${MCP_APP_HTML_FILE} is missing. Run \`npm run build:mcp-app\` before \`npm run build:adapters\`.`)
      }
      const html = readFileSync(MCP_APP_HTML_FILE, 'utf-8')
      if (!html.includes('</head>')) {
        this.error(`${MCP_APP_HTML_FILE} does not look like the built MCP App.`)
      }
      return `/** The bundled MCP App as a single HTML document. */\nexport const mcpAppHtml = ${JSON.stringify(html)}\n`
    }
  }
}

export default defineConfig({
  plugins: [
    mcpAppHtmlSelfReference(),
    inlineMcpAppHtml(),
    dts({
      // Per-file declarations rooted at src/adapters so they land flat at
      // dist/adapters/* (e.g. dist/adapters/fastify/index.d.ts) matching
      // package.json#exports rather than nesting at dist/adapters/adapters. #877.
      // outDirs mirrors the same declarations into dist/cjs/adapters for the
      // require.types condition (CJS via the dist/cjs/package.json marker). #881.
      insertTypesEntry: false,
      include: ['src/adapters/**/*.ts'],
      exclude: ['src/adapters/index.ts'],
      entryRoot: 'src/adapters',
      outDirs: ['dist/adapters', 'dist/cjs/adapters']
    }),
    cjsTypesMarker()
  ],
  build: {
    lib: {
      entry: {
        'hono/index': resolve(__dirname, 'src/adapters/hono/index.ts'),
        'express/index': resolve(__dirname, 'src/adapters/express/index.ts'),
        'fastify/index': resolve(__dirname, 'src/adapters/fastify/index.ts'),
        'nextjs/index': resolve(__dirname, 'src/adapters/nextjs/index.ts'),
        'core/index': resolve(__dirname, 'src/adapters/core/index.ts'),
        'utils': resolve(__dirname, 'src/adapters/utils.ts'),
        'types': resolve(__dirname, 'src/adapters/types.ts'),
        'mcp-tools': resolve(__dirname, 'src/adapters/mcp-tools.ts'),
        // The MCP App HTML as its own entry (`drizzle-cube/mcp-app-html`), so the
        // transport's lazy import() above has a real module to land on.
        'mcp-app-html': resolve(__dirname, 'src/adapters/mcp-app-html.ts')
      },
      formats: ['es', 'cjs']
    },
    outDir: 'dist/adapters',
    rollupOptions: {
      external: ['hono', 'express', 'fastify', '@fastify/cors', 'cors', 'next', 'next/server', '@anthropic-ai/sdk', MCP_APP_HTML_SPECIFIER]
    }
  }
})
