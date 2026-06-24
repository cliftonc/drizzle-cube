/**
 * `drizzle-cube dbt` command — the only module that touches `process`,
 * `readline`, console, or CLI-supplied filesystem paths.
 *
 * Parsing, normalization, and emission live in pure, unit-tested modules;
 * this module owns arg parsing, the interactive prompt, and user-facing
 * output (warnings + summary).
 */

import { createInterface } from 'node:readline/promises'
import { parseArgs } from 'node:util'
import type { DbtGenerateOptions, GeneratorWarning, GenerationResult, SecurityMode } from '../dbt/types.js'
import { generateFromDbt } from '../dbt/generate.js'

interface ParsedDbtArgs {
  manifest?: string
  catalog?: string
  dialect?: string
  out?: string
  securityColumn?: string
  securityContext?: string
  noSecurity: boolean
  dryRun: boolean
  check: boolean
  force: boolean
  config?: string
}

function parseDbtArgs(argv: string[]): ParsedDbtArgs {
  const { values } = parseArgs({
    args: argv,
    options: {
      manifest: { type: 'string' },
      catalog: { type: 'string' },
      dialect: { type: 'string' },
      out: { type: 'string' },
      'security-column': { type: 'string' },
      'security-context': { type: 'string' },
      'no-security': { type: 'boolean', default: false },
      'dry-run': { type: 'boolean', default: false },
      check: { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      config: { type: 'string' },
    },
    strict: false,
  })
  return {
    manifest: typeof values.manifest === 'string' ? values.manifest : undefined,
    catalog: typeof values.catalog === 'string' ? values.catalog : undefined,
    dialect: typeof values.dialect === 'string' ? values.dialect : undefined,
    out: typeof values.out === 'string' ? values.out : undefined,
    securityColumn: typeof values['security-column'] === 'string' ? values['security-column'] : undefined,
    securityContext: typeof values['security-context'] === 'string' ? values['security-context'] : undefined,
    noSecurity: values['no-security'] === true,
    dryRun: values['dry-run'] === true,
    check: values.check === true,
    force: values.force === true,
    config: typeof values.config === 'string' ? values.config : undefined,
  }
}

function requireRequiredFlags(args: ParsedDbtArgs): void {
  const missing: string[] = []
  if (!args.manifest) missing.push('--manifest')
  if (!args.catalog) missing.push('--catalog')
  if (!args.dialect) missing.push('--dialect')
  if (!args.out) missing.push('--out')
  if (missing.length > 0) {
    throw new Error(
      `Missing required option(s): ${missing.join(', ')}. Run 'npx drizzle-cube dbt' for usage.`,
    )
  }
}

function validateDialect(dialect: string): void {
  if (dialect !== 'postgres') {
    throw new Error(`Unsupported dialect '${dialect}'. v1 supports: postgres.`)
  }
}

/** Derive a lowerCamel context property from a column name if none was given. */
function deriveContextProperty(columnName: string): string {
  const tokens = columnName.split(/[^A-Za-z0-9]+/).filter((t) => t.length > 0)
  if (tokens.length === 0) return columnName
  return (
    tokens[0].toLowerCase() +
    tokens
      .slice(1)
      .map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
      .join('')
  )
}

async function promptSecurityColumn(): Promise<string | null> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = await rl.question(
      'Enter the tenant/security column name (e.g. organisation_id). Leave empty to skip cube-level security: ',
    )
    const trimmed = answer.trim()
    return trimmed.length > 0 ? trimmed : null
  } finally {
    rl.close()
  }
}

async function resolveSecurityMode(args: ParsedDbtArgs): Promise<SecurityMode> {
  if (args.noSecurity) {
    if (args.securityColumn || args.securityContext) {
      throw new Error(
        '--no-security cannot be combined with --security-column or --security-context.',
      )
    }
    console.warn('[drizzle-cube] No cube-level security filter will be applied (--no-security).')
    return { kind: 'none' }
  }

  if (args.securityColumn && args.securityContext) {
    return {
      kind: 'filter',
      columnName: args.securityColumn,
      contextProperty: args.securityContext,
    }
  }

  if (args.securityColumn || args.securityContext) {
    throw new Error(
      '--security-column and --security-context must be provided together, or use --no-security.',
    )
  }

  // Neither flag: prompt interactively when a TTY is available.
  const isInteractive = Boolean(process.stdin.isTTY && process.stdout.isTTY)
  if (!isInteractive) {
    throw new Error(
      'Security choice required in non-interactive mode: provide --security-column and --security-context, or --no-security.',
    )
  }

  const columnName = await promptSecurityColumn()
  if (columnName === null) {
    console.warn('[drizzle-cube] No cube-level security filter will be applied (empty prompt answer).')
    return { kind: 'none' }
  }
  return {
    kind: 'filter',
    columnName,
    contextProperty: args.securityContext ?? deriveContextProperty(columnName),
  }
}

function printWarnings(warnings: GeneratorWarning[]): void {
  for (const w of warnings) {
    const parts: string[] = []
    if (w.modelName) parts.push(`model=${w.modelName}`)
    if (w.columnName) parts.push(`column=${w.columnName}`)
    const suffix = parts.length > 0 ? ` (${parts.join(' ')})` : ''
    console.error(`[drizzle-cube] ${w.code}: ${w.message}${suffix}`)
  }
}

function capList(items: string[], limit = 20): string[] {
  if (items.length <= limit) return items
  return [...items.slice(0, limit), `... and ${items.length - limit} more`]
}

function printCheckSummary(result: GenerationResult): void {
  const { write } = result
  if (!write.drift) {
    console.log('No drift detected.')
    return
  }
  console.log(
    `Drift detected: ${write.updated.length} changed, ${write.missing.length} missing, ${write.orphaned.length} orphaned.`,
  )
  if (write.updated.length > 0) {
    console.log('changed:')
    for (const p of capList(write.updated)) console.log(`  ${p}`)
  }
  if (write.missing.length > 0) {
    console.log('missing:')
    for (const p of capList(write.missing)) console.log(`  ${p}`)
  }
  if (write.orphaned.length > 0) {
    console.log('orphaned:')
    for (const p of capList(write.orphaned)) console.log(`  ${p}`)
  }
}

function printWriteSummary(result: GenerationResult, prefix: string): void {
  const { write } = result
  console.log(
    `${prefix}created ${write.created.length}, updated ${write.updated.length}, deleted ${write.deleted.length} (stale), conflicts ${write.conflicts.length}.`,
  )
  if (write.conflicts.length > 0) {
    console.log('Conflicting paths (use --force to overwrite):')
    for (const p of write.conflicts) console.log(`  ${p}`)
  }
}

function printSummary(result: GenerationResult, args: ParsedDbtArgs): void {
  if (args.check) {
    printCheckSummary(result)
  } else {
    const prefix = args.dryRun ? '[drizzle-cube dry-run] ' : '[drizzle-cube] '
    printWriteSummary(result, prefix)
  }
}

/** `drizzle-cube dbt generate` — generate Drizzle schema + cubes from dbt artifacts. */
export async function dbtGenerate(argv = process.argv.slice(4)): Promise<void> {
  const args = parseDbtArgs(argv)
  requireRequiredFlags(args)
  validateDialect(args.dialect as string)

  const security = await resolveSecurityMode(args)
  const options: DbtGenerateOptions = {
    manifestPath: args.manifest as string,
    catalogPath: args.catalog as string,
    dialect: 'postgres',
    outDir: args.out as string,
    security,
    dryRun: args.dryRun,
    check: args.check,
    force: args.force,
    ...(args.config ? { configPath: args.config } : {}),
  }

  const result = await generateFromDbt(options)
  printWarnings(result.warnings)
  printSummary(result, args)

  if (args.check && result.write.drift) {
    throw new Error('Drift detected: generated output does not match the current dbt artifacts.')
  }
}

/** `drizzle-cube dbt` — help text. */
export function printDbtHelp(): void {
  console.log(`
drizzle-cube dbt

Commands:
  drizzle-cube dbt generate   Generate Drizzle schema + cubes from dbt artifacts

Options for 'dbt generate':
  --manifest <path>           Path to dbt manifest.json (required)
  --catalog <path>            Path to dbt catalog.json (required)
  --dialect <name>            Target SQL dialect. v1 supports: postgres (required)
  --out <dir>                 Output directory (required)
  --security-column <name>    Tenant/security column for row-level filtering
  --security-context <prop>   Security context property to compare against
  --no-security               Explicitly skip cube-level security
  --dry-run                   Report planned changes without writing
  --check                     Detect drift (changed / missing / orphaned); exit non-zero on drift
  --force                     Overwrite non-generated files at expected paths
  --config <path>             Reserved for a future config file

See docs/dbt-generate.md for full options, security modes, and v1 limitations.
`)
}
