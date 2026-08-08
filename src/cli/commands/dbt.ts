import process from 'node:process'
import { createInterface } from 'node:readline/promises'
import { parseArgs } from 'node:util'
import { toCamelCase } from '../dbt/naming.js'
import { generateFromDbt } from '../dbt/generate.js'
import type { GenerationResult, SecurityMode } from '../dbt/types.js'

interface ParsedValues {
  manifest?: string
  catalog?: string
  dialect?: string
  out?: string
  securityColumn?: string
  securityContext?: string
  noSecurity?: boolean
  dryRun?: boolean
  check?: boolean
  force?: boolean
  config?: string
}

export function printDbtHelp(): void {
  console.log(`
drizzle-cube dbt

Commands:
  drizzle-cube dbt generate --manifest target/manifest.json --catalog target/catalog.json --dialect postgres --out ./src/cubes/generated [security]

Security:
  --security-column <column> --security-context <property>  Emit tenant filter
  --no-security                                           Explicitly emit no cube-level filter

Modes:
  --dry-run  Show planned creates/updates/deletes without writing
  --check    Fail if generated output is not up to date
  --force    Overwrite non-generated conflicts
`)
}

function parseDbtArgs(argv: string[]): ParsedValues {
  const parsed = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      manifest: { type: 'string' },
      catalog: { type: 'string' },
      dialect: { type: 'string' },
      out: { type: 'string' },
      'security-column': { type: 'string' },
      'security-context': { type: 'string' },
      'no-security': { type: 'boolean' },
      'dry-run': { type: 'boolean' },
      check: { type: 'boolean' },
      force: { type: 'boolean' },
      config: { type: 'string' }
    }
  })
  return {
    manifest: parsed.values.manifest,
    catalog: parsed.values.catalog,
    dialect: parsed.values.dialect,
    out: parsed.values.out,
    securityColumn: parsed.values['security-column'],
    securityContext: parsed.values['security-context'],
    noSecurity: parsed.values['no-security'],
    dryRun: parsed.values['dry-run'],
    check: parsed.values.check,
    force: parsed.values.force,
    config: parsed.values.config
  }
}

async function promptSecurity(values: ParsedValues): Promise<SecurityMode> {
  if (values.noSecurity) {
    console.error('Warning [no_security]: no cube-level security filter was requested.')
    return { kind: 'none' }
  }
  if (values.securityColumn && values.securityContext) {
    return { kind: 'filter', columnName: values.securityColumn, contextProperty: values.securityContext }
  }
  if (values.securityColumn || values.securityContext) {
    throw new Error('Both --security-column and --security-context are required when configuring security filtering.')
  }
  if (process.stdin.isTTY && process.stdout.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    try {
      const column = (await rl.question('Tenant/organisation column for security filtering (empty for no security): ')).trim()
      if (!column) {
        console.error('Warning [no_security]: no cube-level security filter was requested.')
        return { kind: 'none' }
      }
      const context = (await rl.question(`Security context property [${toCamelCase(column)}]: `)).trim()
      return { kind: 'filter', columnName: column, contextProperty: context || toCamelCase(column) }
    } finally {
      rl.close()
    }
  }
  throw new Error('Non-interactive dbt generation requires --no-security or both --security-column and --security-context.')
}

function requireValue(value: string | undefined, flag: string): string {
  if (!value) throw new Error(`Missing required option ${flag}.`)
  return value
}

function printSummary(result: GenerationResult): void {
  for (const warning of result.warnings) {
    const scope = [warning.modelName, warning.columnName].filter(Boolean).join('.')
    console.error(`Warning [${warning.code}]${scope ? ` ${scope}` : ''}: ${warning.message}`)
  }
  const write = result.writeResult
  console.log(`Generated ${result.files.length} files.`)
  console.log(`Creates: ${write.created.length}; updates: ${write.updated.length}; unchanged: ${write.unchanged.length}; deletes: ${write.deleted.length}; conflicts: ${write.conflicts.length}.`)
}

export async function dbtGenerate(argv = process.argv.slice(4)): Promise<void> {
  const values = parseDbtArgs(argv)
  const dialect = requireValue(values.dialect, '--dialect')
  if (dialect !== 'postgres') throw new Error(`Unsupported dbt dialect '${dialect}'. Only 'postgres' is supported.`)
  const manifestPath = requireValue(values.manifest, '--manifest')
  const catalogPath = requireValue(values.catalog, '--catalog')
  const outDir = requireValue(values.out, '--out')
  const security = await promptSecurity(values)
  const result = await generateFromDbt({
    manifestPath,
    catalogPath,
    dialect,
    outDir,
    security,
    dryRun: values.dryRun === true,
    check: values.check === true,
    force: values.force === true,
    configPath: values.config
  })
  printSummary(result)
}
