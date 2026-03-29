/**
 * Post-build script: reads dist/mcp-app/mcp-app.html and embeds it
 * directly into src/adapters/mcp-transport.ts as an inline string constant.
 *
 * This avoids code-splitting issues where bundlers (Wrangler/esbuild)
 * tree-shake a separate chunk containing the HTML.
 *
 * Run after build:mcp-app, before build:adapters.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const htmlPath = join(root, 'dist/mcp-app/mcp-app.html')
const transportPath = join(root, 'src/adapters/mcp-transport.ts')

const html = readFileSync(htmlPath, 'utf-8')
const transport = readFileSync(transportPath, 'utf-8')

const marker = '// __MCP_APP_HTML_START__'
const markerEnd = '// __MCP_APP_HTML_END__'

const startIdx = transport.indexOf(marker)
const endIdx = transport.indexOf(markerEnd)

if (startIdx === -1 || endIdx === -1) {
  console.error('ERROR: Could not find MCP App HTML markers in mcp-transport.ts')
  process.exit(1)
}

const before = transport.slice(0, startIdx)
const after = transport.slice(endIdx + markerEnd.length)

const replacement = `${marker}\nconst _mcpAppHtml: string = ${JSON.stringify(html)}\n${markerEnd}`

writeFileSync(transportPath, before + replacement + after, 'utf-8')
console.log(`Embedded MCP App HTML (${(html.length / 1024).toFixed(0)}KB) into mcp-transport.ts`)
