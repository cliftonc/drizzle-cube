// An Express server without the optional `cors` peer. The adapter used to
// import cors statically, so it failed to load unless cors was installed.
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import express from 'express'
import { drizzle } from 'drizzle-orm/sqlite-proxy'
import { SemanticLayerCompiler } from 'drizzle-cube/server'
import { createCubeRouter } from 'drizzle-cube/adapters/express'

const failures = []
if (existsSync('node_modules/cors/package.json')) failures.push('cors is installed; this fixture must not have it')
createRequire(import.meta.url)('drizzle-cube/adapters/express') // the CJS entry loads too
for (const dts of ['node_modules/drizzle-cube/dist/adapters/express/index.d.ts', 'node_modules/drizzle-cube/dist/cjs/adapters/express/index.d.ts']) {
  if (existsSync(dts) && /from ['"]cors['"]/.test(readFileSync(dts, 'utf8'))) failures.push(`${dts} imports 'cors' types`)
}

// No database is reached: /meta reads the (empty) cube registry.
const db = drizzle(async () => ({ rows: [] }))
const extractSecurityContext = async () => ({ organisationId: 1 })

async function get(router, path) {
  const app = express()
  app.use(router)
  app.use((error, _req, res, _next) => res.status(500).json({ error: error.message }))
  const server = app.listen(0)
  await new Promise(resolve => server.once('listening', resolve))
  try {
    const res = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { headers: { Origin: 'https://app.example.com' } })
    return { status: res.status, body: await res.text() }
  } finally {
    server.close()
  }
}

const semanticLayer = new SemanticLayerCompiler({ drizzle: db, engineType: 'sqlite' })

const plain = await get(createCubeRouter({ semanticLayer, extractSecurityContext }), '/cubejs-api/v1/meta')
console.log(`without the cors option: /meta ${plain.status}`)
if (plain.status !== 200) failures.push(`/meta without cors option returned ${plain.status}: ${plain.body.slice(0, 200)}`)

const logged = []
const consoleError = console.error
console.error = (...args) => { logged.push(args.join(' ')) }
let withCors
try {
  withCors = await get(
    createCubeRouter({ semanticLayer, extractSecurityContext, cors: { origin: 'https://app.example.com' } }),
    '/cubejs-api/v1/meta'
  )
} finally {
  console.error = consoleError
}
console.log(`with the cors option: /meta ${withCors.status}`)
if (withCors.status !== 500 || !withCors.body.includes('npm install cors')) {
  failures.push(`with the cors option and no cors package, expected a 500 naming "npm install cors", got ${withCors.status}: ${withCors.body.slice(0, 200)}`)
}
if (!logged.some(line => line.includes('npm install cors'))) failures.push('startup did not log the "npm install cors" fix')

if (failures.length > 0) {
  console.error('✗ ' + failures.join('\n✗ '))
  process.exit(1)
}
