/**
 * `drizzle-cube dbt generate` — generate a Postgres Drizzle schema and Drizzle
 * Cube definitions from local dbt `manifest.json` / `catalog.json` artifacts.
 *
 * This is the only module in the dbt generator that performs I/O or prompting;
 * everything it calls (`parse-artifacts`, `normalize`, the emitters,
 * `write-output`) is pure and unit-tested.
 */

import { parseArgs } from 'node:util'
import { existsSync, readFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { parseManifest, parseCatalog, ArtifactError } from '../dbt/parse-artifacts.js'
import { normalize } from '../dbt/normalize.js'
import { toCamelCase } from '../dbt/naming.js'
import {
  buildFilePlan,
  applyFilePlan,
  displayPath,
  type WriteMode,
  type WriteResult,
  type PlannedFile
} from '../dbt/write-output.js'
import type { SecurityConfig } from '../dbt/types.js'

const USAGE = `
drizzle-cube dbt generate

Generate Drizzle schema + cube files from local dbt artifacts.

Required:
  --manifest <path>          Path to dbt manifest.json
  --catalog  <path>          Path to dbt catalog.json
  --dialect  postgres        Target dialect (only 'postgres' is supported)
  --out      <dir>           Output directory for generated files

Security (choose one, or you will be prompted in a terminal):
  --security-column  <col>   Tenant filter column, e.g. organisation_id
  --security-context <prop>  Security-context property (default: camelCase of column)
  --no-security              Generate cubes without a tenant filter (explicit)

Modes:
  --dry-run                  Print the file plan without writing
  --check                    Exit non-zero if generated output differs from disk (CI)
`

/** A thrown CliError becomes a clean stderr message + exit 1 (no stack trace). */
export class CliError extends Error {}

interface DbtFlags {
  manifest?: string
  catalog?: string
  dialect?: string
  out?: string
  securityColumn?: string
  securityContext?: string
  noSecurity: boolean
  dryRun: boolean
  check: boolean
}

function parseFlags(): DbtFlags {
  const { values } = parseArgs({
    options: {
      manifest: { type: 'string' },
      catalog: { type: 'string' },
      dialect: { type: 'string' },
      out: { type: 'string', short: 'o' },
      'security-column': { type: 'string' },
      'security-context': { type: 'string' },
      'no-security': { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      check: { type: 'boolean', default: false }
    },
    strict: false,
    allowPositionals: true
  })

  return {
    manifest: values.manifest as string | undefined,
    catalog: values.catalog as string | undefined,
    dialect: values.dialect as string | undefined,
    out: values.out as string | undefined,
    securityColumn: values['security-column'] as string | undefined,
    securityContext: values['security-context'] as string | undefined,
    noSecurity: values['no-security'] === true,
    dryRun: values['dry-run'] === true,
    check: values.check === true
  }
}

function validateRequired(flags: DbtFlags): void {
  const required: Array<[string, string | undefined]> = [
    ['--manifest', flags.manifest],
    ['--catalog', flags.catalog],
    ['--dialect', flags.dialect],
    ['--out', flags.out]
  ]
  const missing = required.filter(([, value]) => !value).map(([flag]) => flag)
  if (missing.length > 0) {
    throw new CliError(`Missing required option(s): ${missing.join(', ')}.\n${USAGE}`)
  }
  if (flags.dialect !== 'postgres') {
    throw new CliError(`Unsupported dialect '${flags.dialect}'. v1 supports only 'postgres'.`)
  }
  if (!existsSync(flags.manifest!)) throw new CliError(`Manifest not found: ${flags.manifest}`)
  if (!existsSync(flags.catalog!)) throw new CliError(`Catalog not found: ${flags.catalog}`)
  if (flags.noSecurity && flags.securityColumn) {
    throw new CliError('Pass either --no-security or --security-column, not both.')
  }
}

/** Resolve the security configuration from flags, prompting when interactive. */
async function resolveSecurity(flags: DbtFlags): Promise<SecurityConfig | null> {
  if (flags.noSecurity) return null

  if (flags.securityColumn) {
    return { column: flags.securityColumn, context: flags.securityContext || toCamelCase(flags.securityColumn) }
  }

  // No security flags supplied.
  if (process.stdin.isTTY && process.stdout.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    try {
      const answer = (
        await rl.question('Tenant/organisation filter column (leave empty for no security): ')
      ).trim()
      if (answer === '') return null
      return { column: answer, context: flags.securityContext || toCamelCase(answer) }
    } finally {
      rl.close()
    }
  }

  throw new CliError(
    'Security not specified. Pass --security-column <col> [--security-context <prop>] or --no-security.'
  )
}

function loadArtifacts(flags: DbtFlags) {
  try {
    return {
      manifest: parseManifest(readFileSync(flags.manifest!, 'utf8')),
      catalog: parseCatalog(readFileSync(flags.catalog!, 'utf8'))
    }
  } catch (err) {
    if (err instanceof ArtifactError) throw new CliError(err.message)
    throw err
  }
}

/** Print the outcome for a mode; `check` drift throws to force a non-zero exit. */
function report(
  mode: WriteMode,
  result: WriteResult,
  plan: PlannedFile[],
  cubeCount: number,
  out: string
): void {
  if (mode === 'check') {
    if (result.drift.length > 0) {
      process.stderr.write(`✗ Generated output is out of date (${result.drift.length} file(s)):\n`)
      for (const f of result.drift) process.stderr.write(`  - ${f}\n`)
      throw new CliError('Run `drizzle-cube dbt generate` to update.')
    }
    process.stdout.write(`✓ Generated output is up to date (${plan.length} file(s)).\n`)
    return
  }

  if (mode === 'dry-run') {
    process.stdout.write(`Dry run — ${result.drift.length} file(s) would change under ${out}/:\n`)
    for (const f of plan) {
      const status = result.drift.includes(f.relativePath) ? 'write' : 'unchanged'
      process.stdout.write(`  [${status}] ${f.relativePath}\n`)
    }
    return
  }

  process.stdout.write(
    `✓ Generated ${cubeCount} cube(s) under ${out}/ (${result.written.length} written, ${result.unchanged.length} unchanged).\n`
  )
}

export async function dbtGenerate(): Promise<void> {
  const flags = parseFlags()
  validateRequired(flags)

  const security = await resolveSecurity(flags)
  if (security === null) {
    process.stderr.write(
      '⚠️  No security column configured — generated cubes will NOT filter by tenant.\n'
    )
  }

  const { manifest, catalog } = loadArtifacts(flags)
  const { models, warnings } = normalize(manifest, catalog, { security })
  for (const warning of warnings) process.stderr.write(`⚠️  ${warning}\n`)
  if (models.length === 0) {
    throw new CliError('No materialized models to generate (all models were skipped).')
  }

  const header = { manifestPath: flags.manifest!, catalogPath: flags.catalog! }
  const plan = buildFilePlan(models, security, header)
  const mode: WriteMode = flags.check ? 'check' : flags.dryRun ? 'dry-run' : 'write'
  const result = applyFilePlan(flags.out!, plan, mode)

  report(mode, result, plan, models.length, displayPath(flags.out!))
}
