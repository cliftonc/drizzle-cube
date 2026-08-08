/**
 * Deterministic `schema.ts` emitter.
 *
 * Byte-stable: sorted imports, deterministic column/table order. Output is
 * importable by the generated cube files and compiles against `drizzle-orm/pg-core`.
 */

import type { EmitContext, GeneratedColumn, GeneratedFile, GeneratedModel } from './types.js'
import { GENERATED_HEADER } from './write-output.js'

function renderHeader(context: EmitContext): string {
  return [
    GENERATED_HEADER,
    `// Source: manifest=${context.manifestPath} catalog=${context.catalogPath} dialect=${context.dialect}`,
    `// To regenerate, run: npx drizzle-cube dbt generate --manifest ${context.manifestPath} --catalog ${context.catalogPath} --dialect ${context.dialect}`,
  ].join('\n')
}

/** Collect every pg-core builder used across all models, sorted (pgTable first). */
function collectBuilders(models: GeneratedModel[]): string[] {
  const builders = new Set<string>(['pgTable'])
  for (const model of models) {
    for (const col of model.columns) {
      builders.add(col.builder)
    }
  }
  return ['pgTable', ...Array.from(builders).filter((b) => b !== 'pgTable').sort()]
}

function renderColumnProperty(col: GeneratedColumn): string {
  const args = col.builderArgs ? `, ${col.builderArgs}` : ''
  let line = `  ${col.propertyName}: ${col.builder}('${col.sqlName}'${args})`
  if (col.primaryKey) {
    line += '.primaryKey()'
  } else if (col.notNull) {
    line += '.notNull()'
  }
  line += ','
  if (col.description) {
    line += ` // ${col.description.replace(/\n/g, ' ')}`
  }
  return line
}

function renderTableExport(model: GeneratedModel): string {
  const cols = model.columns.map(renderColumnProperty).join('\n')
  return `export const ${model.tableExport} = pgTable('${model.relationName}', {\n${cols}\n})`
}

export function emitSchema(models: GeneratedModel[], context: EmitContext): GeneratedFile {
  const header = renderHeader(context)
  const builders = collectBuilders(models)
  const importLine = `import { ${builders.join(', ')} } from 'drizzle-orm/pg-core'`
  const sortedModels = [...models].sort((a, b) => a.tableExport.localeCompare(b.tableExport))
  const tables = sortedModels.map(renderTableExport).join('\n\n')
  const schemaEntries = sortedModels.map((m) => `  ${m.tableExport},`).join('\n')
  const content = [
    header,
    '',
    importLine,
    '',
    tables,
    '',
    'export const schema = {',
    schemaEntries,
    '}',
    '',
    'export type Schema = typeof schema',
    '',
  ].join('\n')
  return { path: 'schema.ts', content }
}
