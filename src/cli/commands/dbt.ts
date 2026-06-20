/**
 * `drizzle-cube dbt generate` command — the only module that touches
 * `process`, `readline`, console, or filesystem paths supplied by the CLI.
 *
 * Parses flags, resolves the security mode (flags or interactive prompt),
 * runs `generateFromDbt`, prints warnings to stderr and a file summary to
 * stdout, and exits non-zero on `--check` drift.
 */
import { parseArgs } from 'node:util'
import * as readline from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { generateFromDbt } from '../dbt/generate.js'
import type { DbtGenerateOptions, GeneratorWarning, SecurityMode } from '../dbt/types.js'

const SUPPORTED_DIALECTS = new Set(['postgres'])

/** Print the `dbt` subcommand help. */
export function printDbtHelp(): void {
  console.log(`
drizzle-cube dbt

Generate Drizzle schema and Drizzle Cube files from local dbt artifacts.

Commands:
  drizzle-cube dbt generate  Generate schema + cubes from dbt manifest/catalog artifacts

Usage:
  drizzle-cube dbt generate \\
    --manifest target/manifest.json \\
    --catalog target/catalog.json \\
    --dialect postgres \\
    --out ./src/cubes/generated \\
    --security-column organisation_id \\
    --security-context organisationId

Options (generate):
  --manifest <path>          Path to dbt manifest.json (required)
  --catalog <path>           Path to dbt catalog.json (required)
  --dialect <name>           Target SQL dialect. v1 supports: postgres (required)
  --out <dir>                Output directory for generated files (required)
  --security-column <name>   SQL column used for row-level security filtering
  --security-context <name>  securityContext property bound to the column
  --no-security              Explicitly opt out of cube-level security
  --dry-run                  Report planned writes without writing anything
  --check                    Fail (non-zero) when generated output would change
  --force                    Overwrite non-generated files at expected paths
  --config <path>            Reserved for v1 (JSON config; not fully wired)

See docs/dbt-generate.md for full options, supported types, and v1 limitations.
`)
}

/** Parse the generate subcommand flags. */
function parseGenerateArgs(argv: string[]): {
  values: Record<string, string | boolean | undefined>
} {
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
  return { values: values as Record<string, string | boolean | undefined> }
}

/** Validate that required flags are present; throw with a usage hint if not. */
function requireRequiredFlags(values: Record<string, string | boolean | undefined>): void {
  const missing: string[] = []
  if (!values.manifest) missing.push('--manifest')
  if (!values.catalog) missing.push('--catalog')
  if (!values.dialect) missing.push('--dialect')
  if (!values.out) missing.push('--out')
  if (missing.length > 0) {
    throw new Error(
      `Missing required option(s): ${missing.join(', ')}.\n` +
        `Run 'drizzle-cube dbt' for usage.`,
    )
  }
}

/** Throw if the dialect is not supported in v1. */
function validateDialect(dialect: string): void {
  if (!SUPPORTED_DIALECTS.has(dialect)) {
    throw new Error(
      `Unsupported dialect '${dialect}'. v1 supports: postgres. ` +
        `Run 'drizzle-cube dbt' for usage.`,
    )
  }
}

/** Derive a lowerCamel context property name from a SQL column name. */
function deriveContextProperty(columnName: string): string {
  const tokens = columnName.split(/[_\-\s.]+/).filter(Boolean)
  if (tokens.length === 0) return columnName
  const head = tokens[0].toLowerCase()
  const rest = tokens.slice(1).map((t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase())
  return head + rest.join('')
}

/**
 * Resolve the security mode from flags or an interactive prompt.
 *
 * - `--no-security` → none (with a stderr warning).
 * - Both `--security-column` and `--security-context` → filter.
 * - Exactly one of the two → throw (both required together).
 * - Neither + TTY → prompt; empty answer = none, non-empty derives context.
 * - Neither + non-TTY → throw (require explicit choice).
 */
/** Read a string flag value, ignoring boolean/non-string values. */
function flagString(values: Record<string, string | boolean | undefined>, key: string): string | undefined {
  const v = values[key]
  return typeof v === 'string' ? v : undefined
}

async function resolveSecurityMode(
  values: Record<string, string | boolean | undefined>,
): Promise<SecurityMode> {
  const noSecurity = values['no-security'] === true
  const column = flagString(values, 'security-column')
  const context = flagString(values, 'security-context')

  if (noSecurity) {
    if (column || context) {
      throw new Error(
        `--no-security cannot be combined with --security-column/--security-context.`,
      )
    }
    console.warn(
      '[drizzle-cube] No cube-level security filter will be applied. ' +
        'Generated cubes will not enforce row-level isolation.',
    )
    return { kind: 'none' }
  }

  if (column && context) {
    return { kind: 'filter', columnName: column, contextProperty: context }
  }

  if ((column && !context) || (context && !column)) {
    throw new Error(
      `--security-column and --security-context must be provided together ` +
        `(or use --no-security to opt out).`,
    )
  }

  const isInteractive = process.stdin.isTTY && process.stdout.isTTY
  if (!isInteractive) {
    throw new Error(
      `Security mode is required in non-interactive mode: provide ` +
        `--security-column and --security-context, or --no-security.`,
    )
  }

  const rl = readline.createInterface({ input, output })
  try {
    const answer = (await rl.question(
      'Enter the tenant/organisation column for row-level security (blank for no security): ',
    )).trim()
    if (answer.length === 0) {
      console.warn(
        '[drizzle-cube] No cube-level security filter will be applied. ' +
          'Generated cubes will not enforce row-level isolation.',
      )
      return { kind: 'none' }
    }
    const contextProperty =
      flagString(values, 'security-context') ?? deriveContextProperty(answer)
    return { kind: 'filter', columnName: answer, contextProperty }
  } finally {
    rl.close()
  }
}

/** Build the `DbtGenerateOptions` from parsed flag values + resolved security. */
function buildOptions(
  values: Record<string, string | boolean | undefined>,
  security: SecurityMode,
): DbtGenerateOptions {
  return {
    manifestPath: values.manifest as string,
    catalogPath: values.catalog as string,
    dialect: 'postgres',
    outDir: values.out as string,
    security,
    dryRun: values['dry-run'] === true,
    check: values.check === true,
    force: values.force === true,
    configPath: values.config as string | undefined,
  }
}

/** Print accumulated warnings to stderr. */
function printWarnings(warnings: GeneratorWarning[]): void {
  for (const w of warnings) {
    const ctx = [w.modelName && `model=${w.modelName}`, w.columnName && `column=${w.columnName}`]
      .filter(Boolean)
      .join(' ')
    const suffix = ctx ? ` (${ctx})` : ''
    console.warn(`[drizzle-cube] ${w.code}: ${w.message}${suffix}`)
  }
}

/** Print a human-readable file summary to stdout. */
function printSummary(result: {
  files: { path: string }[]
  write: { created: string[]; updated: string[]; deleted: string[]; conflicts: string[]; missing: string[]; orphaned: string[]; drift: boolean }
  dryRun: boolean
  check: boolean
}): void {
  const { write, dryRun, check } = result
  if (check) {
    if (!write.drift) {
      console.log('[drizzle-cube] No drift detected. Generated output is up to date.')
      return
    }
    const categories: Array<[string, string[]]> = [
      ['changed', write.updated],
      ['missing', write.missing],
      ['orphaned', write.orphaned],
    ]
    const parts: string[] = []
    for (const [label, paths] of categories) {
      if (paths.length === 0) continue
      parts.push(`${paths.length} ${label}`)
    }
    console.log(`[drizzle-cube] Drift detected: ${parts.join(', ') || 'output differs'}.`)
    for (const [label, paths] of categories) {
      if (paths.length === 0) continue
      const shown = paths.slice(0, 20)
      console.log(`[drizzle-cube] ${label}:`)
      for (const p of shown) console.log(`[drizzle-cube]   ${p}`)
      if (paths.length > shown.length) {
        console.log(`[drizzle-cube]   … and ${paths.length - shown.length} more`)
      }
    }
    return
  }

  const prefix = dryRun ? '[drizzle-cube dry-run] ' : '[drizzle-cube] '
  const lines: string[] = []
  if (write.created.length) lines.push(`created: ${write.created.length}`)
  if (write.updated.length) lines.push(`updated: ${write.updated.length}`)
  if (write.deleted.length) lines.push(`deleted (stale): ${write.deleted.length}`)
  if (write.conflicts.length) lines.push(`conflicts: ${write.conflicts.length}`)
  if (lines.length === 0) lines.push('no changes')
  console.log(`${prefix}Generation complete — ${lines.join(', ')}.`)
  if (write.conflicts.length > 0) {
    console.log(`${prefix}Conflicting files (use --force to overwrite):`)
    for (const c of write.conflicts) console.log(`${prefix}  ${c}`)
  }
}

/**
 * Run `drizzle-cube dbt generate`.
 *
 * Throws on usage errors, unsupported dialects, missing files, identifier
 * collisions, or `--check` drift. The caller (`src/cli/index.ts`) catches
 * thrown errors, writes them to stderr, and exits non-zero.
 */
export async function dbtGenerate(argv: string[] = process.argv.slice(4)): Promise<void> {
  const { values } = parseGenerateArgs(argv)
  requireRequiredFlags(values)
  validateDialect(values.dialect as string)

  const security = await resolveSecurityMode(values)
  const options = buildOptions(values, security)

  const result = await generateFromDbt(options)
  printWarnings(result.warnings)
  printSummary({
    files: result.files,
    write: result.write,
    dryRun: options.dryRun,
    check: options.check,
  })

  if (options.check && result.write.drift) {
    throw new Error('Drift detected: generated output does not match the current dbt artifacts.')
  }
}
