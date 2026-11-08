#!/usr/bin/env node
/**
 * Consumer smoke tests: install the packed drizzle-cube tarball into each
 * fixture under consumers/ and run its `check` script. See consumers/README.md.
 *
 *   node scripts/consumer-smoke.mjs [--tarball <path.tgz>] [fixture...]
 *
 * --tarball tests a given tarball (e.g. `npm pack drizzle-cube@0.12.3`)
 * instead of packing dist/.
 */
import { execFileSync } from 'node:child_process'
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, existsSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const fixturesDir = join(root, 'consumers')
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

const args = process.argv.slice(2)
const tarballFlag = args.indexOf('--tarball')
const givenTarball = tarballFlag >= 0 ? resolve(args.splice(tarballFlag, 2)[1] ?? '') : undefined

if (!givenTarball && !existsSync(join(root, 'dist', 'server', 'index.js'))) {
  console.error('dist/ is missing. Run `npm run build` first.')
  process.exit(1)
}

// `_shared` holds the client app source that the client fixtures reuse.
const all = readdirSync(fixturesDir).filter(name => !name.startsWith('_') && statSync(join(fixturesDir, name)).isDirectory())
const requested = args
const unknown = requested.filter(name => !all.includes(name))
if (unknown.length > 0) {
  console.error(`Unknown fixture(s): ${unknown.join(', ')}. Known: ${all.join(', ')}`)
  process.exit(1)
}
const fixtures = requested.length > 0 ? requested : all

const work = mkdtempSync(join(tmpdir(), 'dc-consumers-'))
// A clean npm environment: the repo's .npmrc sets legacy-peer-deps, which hides
// exactly the peer problems these fixtures exist to catch.
const env = { ...process.env, npm_config_legacy_peer_deps: 'false', npm_config_audit: 'false', npm_config_fund: 'false' }
for (const key of Object.keys(env)) {
  if (key.startsWith('npm_package_') || key === 'npm_config_userconfig' || key === 'INIT_CWD') delete env[key]
}

function run(cmd, args, cwd, { quiet = false } = {}) {
  return execFileSync(cmd, args, { cwd, env, stdio: quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit', encoding: 'utf8' })
}

let tarball = givenTarball
if (!tarball) {
  console.log('Packing drizzle-cube…')
  tarball = join(work, run(npm, ['pack', '--silent', '--pack-destination', work], root, { quiet: true }).trim().split('\n').pop())
}
console.log(`Tarball: ${tarball}`)

const results = []
for (const name of fixtures) {
  const dir = join(work, name)
  const fixturePkg = JSON.parse(readFileSync(join(fixturesDir, name, 'package.json'), 'utf8'))
  if (fixturePkg.consumerSmoke?.sharedApp) {
    cpSync(join(fixturesDir, '_shared'), dir, { recursive: true })
  }
  cpSync(join(fixturesDir, name), dir, { recursive: true })
  console.log(`\n▶ ${name}`)
  const started = Date.now()
  try {
    // One install with drizzle-cube as a regular dependency, as a user has it.
    const pkgPath = join(dir, 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
    pkg.dependencies = { ...pkg.dependencies, 'drizzle-cube': `file:${tarball}` }
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
    run(npm, ['install', '--no-package-lock', '--loglevel=error'], dir)
    run(npm, ['run', '--silent', 'check'], dir)
    results.push({ name, ok: true, seconds: (Date.now() - started) / 1000 })
  } catch (error) {
    results.push({ name, ok: false, seconds: (Date.now() - started) / 1000 })
  }
}

console.log('\nConsumer smoke tests')
for (const { name, ok, seconds } of results) {
  console.log(`  ${ok ? '✓' : '✗'} ${name} (${seconds.toFixed(0)}s)`)
}
const failed = results.filter(r => !r.ok)
if (failed.length === 0) rmSync(work, { recursive: true, force: true })
else console.log(`\nFixture copies kept in ${work}`)
process.exit(failed.length === 0 ? 0 : 1)
