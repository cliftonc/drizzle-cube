import process from 'node:process'
import { createInterface } from 'node:readline/promises'
import { parseArgs } from 'node:util'
import { loadGeneratorConfig } from '../dbt/config.js'
import { DbtGenerateError } from '../dbt/errors.js'
import { generateDbtFiles } from '../dbt/generator.js'
import { toCamelCase } from '../dbt/naming.js'
import { writeGeneratedFiles } from '../dbt/write-output.js'
import type { SecurityConfig } from '../dbt/types.js'

export function printDbtHelp(): void {
  console.log(`
drizzle-cube dbt

Commands:
  drizzle-cube dbt generate --manifest <path> --catalog <path> --dialect postgres --out <dir>

Options:
  --security-column <column>     Tenant filter column present on every generated model
  --security-context <property>  securityContext property to compare against
  --no-security                  Explicitly generate cubes without cube-level filters
  --dry-run                      Print planned writes without changing files
  --check                        Fail if generated output is not current
  --force                        Overwrite non-generated files
`)
}

function requiredString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.length === 0) throw new DbtGenerateError(`Missing required ${name}.`)
  return value
}

async function promptSecurity(): Promise<SecurityConfig> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const column = (await rl.question('Tenant/organisation filter column (blank for no cube-level security):')).trim()
    if (!column) return { mode: 'none' }
    const contextDefault = toCamelCase(column)
    const context = (await rl.question(`Security context property (${contextDefault}):`)).trim() || contextDefault
    return { mode: 'column', column, context }
  } finally {
    rl.close()
  }
}

async function resolveSecurity(values: Record<string, unknown>, configSecurity: SecurityConfig | undefined): Promise<SecurityConfig> {
  const noSecurity = values['no-security'] === true
  const securityColumn = values['security-column']
  const securityContext = values['security-context']
  if (noSecurity && (securityColumn !== undefined || securityContext !== undefined)) {
    throw new DbtGenerateError('--no-security cannot be combined with --security-column or --security-context.')
  }
  if (securityColumn !== undefined || securityContext !== undefined) {
    if (typeof securityColumn !== 'string' || typeof securityContext !== 'string') {
      throw new DbtGenerateError('--security-column and --security-context must be provided together.')
    }
    return { mode: 'column', column: securityColumn, context: securityContext }
  }
  if (noSecurity) return { mode: 'none' }
  if (configSecurity) return configSecurity
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new DbtGenerateError('Non-interactive dbt generation requires --security-column/--security-context or explicit --no-security.')
  }
  return promptSecurity()
}

export async function dbtGenerate(args: string[] = process.argv.slice(4)): Promise<void> {
  const { values } = parseArgs({
    args,
    allowPositionals: false,
    strict: true,
    options: {
      manifest: { type: 'string' },
      catalog: { type: 'string' },
      dialect: { type: 'string' },
      out: { type: 'string' },
      config: { type: 'string' },
      'security-column': { type: 'string' },
      'security-context': { type: 'string' },
      'no-security': { type: 'boolean' },
      'dry-run': { type: 'boolean' },
      check: { type: 'boolean' },
      force: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  })
  if (values.help) {
    printDbtHelp()
    return
  }
  const manifestPath = requiredString(values.manifest, '--manifest')
  const catalogPath = requiredString(values.catalog, '--catalog')
  const dialect = requiredString(values.dialect, '--dialect')
  if (dialect !== 'postgres') throw new DbtGenerateError(`Unsupported dbt generate dialect ${dialect}. Only postgres is supported in v1.`)
  const outDir = requiredString(values.out, '--out')
  const config = await loadGeneratorConfig(typeof values.config === 'string' ? values.config : undefined)
  const security = await resolveSecurity(values, config.security)
  const { files, warnings } = await generateDbtFiles({ manifestPath, catalogPath, dialect: 'postgres', outDir, config, security })
  const result = await writeGeneratedFiles(files, outDir, { dryRun: values['dry-run'] === true, check: values.check === true, force: values.force === true })
  for (const warning of warnings) console.warn(`Warning: ${warning.message}`)
  for (const warning of result.warnings) console.warn(`Warning: ${warning}`)
  const changed = result.entries.filter((entry) => entry.action !== 'unchanged')
  if (values['dry-run']) {
    console.log(`Would write ${changed.length} of ${result.entries.length} files.`)
  } else if (values.check) {
    console.log('Output is current.')
  } else {
    console.log(`Generated ${result.entries.length} files.`)
  }
  for (const entry of result.entries) console.log(`${entry.action} ${entry.path}`)
}
