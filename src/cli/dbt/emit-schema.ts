/**
 * Emit the generated Drizzle `pg-core` schema file (`schema.ts`).
 *
 * Output is byte-stable: builders are imported sorted alphabetically (with
 * `pgTable` first for readability), columns are emitted in deterministic
 * catalog order, and table exports are emitted in deterministic `fileName`
 * order.
 */
import type { EmitContext, GeneratedColumn, GeneratedFile, GeneratedModel } from './types.js'
import { GENERATED_HEADER } from './write-output.js'
import { quoteStringLiteral } from './naming.js'

/** Collect the set of pg-core builders used across all models. */
function collectBuilders(models: GeneratedModel[]): Set<string> {
  const set = new Set<string>(['pgTable'])
  for (const model of models) {
    for (const col of model.columns) {
      set.add(col.builder)
    }
  }
  return set
}

/** Render the import line for the used pg-core builders (pgTable first). */
function renderBuilderImport(builders: Set<string>): string {
  const rest = Array.from(builders)
    .filter((b) => b !== 'pgTable')
    .sort((a, b) => a.localeCompare(b))
  const names = ['pgTable', ...rest].join(', ')
  return `import { ${names} } from 'drizzle-orm/pg-core'`
}

/** Render a single column property for the schema table. */
function renderColumnProperty(col: GeneratedColumn, indent: string): string {
  const sqlName = quoteStringLiteral(col.sqlName)
  let expr = `${col.builder}('${sqlName}'`
  if (col.builderArgs) {
    expr += `, ${col.builderArgs}`
  }
  expr += ')'
  if (col.primaryKey) expr += '.primaryKey()'
  else if (col.notNull) expr += '.notNull()'
  const desc = col.description ? ` // ${col.description.replace(/\n/g, ' ')}` : ''
  return `${indent}${col.propertyName}: ${expr},${desc}`
}

/** Render a single `pgTable(...)` export. */
function renderTableExport(model: GeneratedModel, indent: string): string {
  const relation = quoteStringLiteral(model.relationName)
  const lines: string[] = []
  lines.push(`export const ${model.tableExport} = pgTable('${relation}', {`)
  for (const col of model.columns) {
    lines.push(renderColumnProperty(col, indent + '  '))
  }
  lines.push(`${indent}})`)
  return lines.join('\n')
}

/**
 * Emit the `schema.ts` file content for the given models.
 *
 * The file imports only the actually-used pg-core builders, exports one
 * `pgTable` per model, and a `schema` object + `Schema` type mapping every
 * table export.
 */
export function emitSchema(models: GeneratedModel[], context: EmitContext): GeneratedFile {
  const builders = collectBuilders(models)
  const importLine = renderBuilderImport(builders)

  const header =
    `${GENERATED_HEADER}\n` +
    `// Source: manifest=${context.manifestPath}, catalog=${context.catalogPath}, dialect=postgres.\n` +
    `// Regenerate with: npx drizzle-cube dbt generate --manifest <path> --catalog <path> --dialect postgres --out <dir>\n` +
    `\n` +
    `${importLine}\n` +
    `\n`

  const sorted = [...models].sort((a, b) => a.fileName.localeCompare(b.fileName))
  const tableExports = sorted.map((m) => renderTableExport(m, '')).join('\n\n')

  const schemaEntries = sorted
    .map((m) => `  ${m.tableExport},`)
    .join('\n')

  const content =
    header +
    tableExports +
    '\n\n' +
    `export const schema = {\n${schemaEntries}\n}\n\n` +
    `export type Schema = typeof schema\n`

  return { path: 'schema.ts', content }
}
