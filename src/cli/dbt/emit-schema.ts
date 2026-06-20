/**
 * Deterministic emitter for the generated Postgres Drizzle schema (`schema.ts`).
 *
 * Mirrors the hand-authored style in `dev/server/schema.ts`: `pgTable` plus
 * `pg-core` column builders, with `.primaryKey()` / `.notNull()` modifiers where
 * the dbt metadata is confident. The PK modifier implies not-null in Drizzle, so
 * `.notNull()` is only emitted for non-PK columns.
 */

import type { GeneratedModel } from './types.js'
import { generatedHeader, quote, sortedUnique, type HeaderInfo } from './emit-shared.js'

function columnLine(column: GeneratedModel['columns'][number]): string {
  let line = `  ${column.propName}: ${column.drizzleBuilder}(${quote(column.dbName)})`
  if (column.primaryKey) {
    line += '.primaryKey()'
  } else if (column.notNull) {
    line += '.notNull()'
  }
  return line
}

function tableBlock(model: GeneratedModel): string {
  const lines = model.columns.map((c) => columnLine(c)).join(',\n')
  return `export const ${model.tableExport} = pgTable(${quote(model.relationName)}, {\n${lines}\n})`
}

/** Emit the full `schema.ts` content for the given models. */
export function emitSchema(models: GeneratedModel[], header: HeaderInfo): string {
  // Tables sorted by export name for stable output.
  const tables = [...models].sort((a, b) =>
    a.tableExport < b.tableExport ? -1 : a.tableExport > b.tableExport ? 1 : 0
  )

  const builders = sortedUnique(tables.flatMap((m) => m.columns.map((c) => c.drizzleBuilder)))
  const importLine = `import { ${['pgTable', ...builders].join(', ')} } from 'drizzle-orm/pg-core'`

  const tableBlocks = tables.map(tableBlock).join('\n\n')

  const schemaKeys = tables.map((m) => `  ${m.tableExport}`).join(',\n')
  const schemaObject = `export const schema = {\n${schemaKeys}\n}`

  return [
    generatedHeader(header),
    '',
    importLine,
    '',
    tableBlocks,
    '',
    schemaObject,
    '',
    'export type Schema = typeof schema',
    ''
  ].join('\n')
}
