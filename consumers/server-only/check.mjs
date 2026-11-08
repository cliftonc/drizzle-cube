// A server-only install (drizzle-cube/server + drizzle-cube/mcp): nothing from
// the React client is installed, and the MCP App HTML is not bundled (#1423-#1425).
import { build } from 'esbuild'
import { existsSync, readFileSync, statSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { join } from 'node:path'

const failures = []
const mustNotInstall = [
  'react-router-dom', 'react-dom', 'recharts', 'd3', '@duckdb/node-api',
  '@leonardovida-md/drizzle-neo-duckdb', 'highlight.js', 'knap', 'lz-string',
  'markdown-to-jsx', 'react-intersection-observer', '@modelcontextprotocol/sdk',
  'react-grid-layout', 'exceljs', '@nivo/heatmap'
]
for (const name of mustNotInstall) {
  if (existsSync(join('node_modules', name, 'package.json'))) failures.push(`installed ${name}`)
}

function dirSize(dir) {
  let total = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    total += entry.isDirectory() ? dirSize(path) : entry.isSymbolicLink() ? 0 : statSync(path).size
  }
  return total
}
const mb = dirSize('node_modules') / 1024 / 1024
console.log(`node_modules: ${mb.toFixed(0)} MB`)
// esbuild (a devDependency of this fixture) is ~10 MB; 0.12.3 was 373 MB.
if (mb > 120) failures.push(`node_modules is ${mb.toFixed(0)} MB (budget 120 MB)`)

execFileSync(process.execPath, ['entry.mjs'], { stdio: 'inherit' })
createRequire(import.meta.url)('drizzle-cube/mcp') // the CJS entry loads

await build({ entryPoints: ['entry.mjs'], bundle: true, platform: 'neutral', format: 'esm', mainFields: ['module', 'main'], outfile: 'out/bundle.js', logLevel: 'error' })
const bundle = readFileSync('out/bundle.js', 'utf8')
if (bundle.includes('<!DOCTYPE')) failures.push('server bundle contains the MCP App HTML')
console.log(`server bundle: ${(bundle.length / 1024 / 1024).toFixed(1)} MB`)

if (failures.length > 0) {
  console.error('✗ ' + failures.join('\n✗ '))
  process.exit(1)
}
