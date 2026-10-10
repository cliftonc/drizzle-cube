import { makeUniqueIdentifier, quoteStringLiteral } from './naming.js'
import type { EmitContext, GeneratedColumn, GeneratedFile, GeneratedModel, PgColumnBuilder } from './types.js'

function builderCall(column: GeneratedColumn): string {
  const name = quoteStringLiteral(column.sqlName)
  if (column.builder === 'bigint') return `bigint(${name}, { mode: 'number' })`
  if (column.withTimezone) return `${column.builder}(${name}, { withTimezone: true })`
  return `${column.builder}(${name})`
}

function isCompositeKey(model: GeneratedModel): boolean {
  return model.columns.filter((column) => column.primaryKey).length > 1
}

function columnLine(column: GeneratedColumn, compositeKey: boolean): string {
  // A composite key is declared once at table level, not per column.
  const primaryKey = column.primaryKey && !compositeKey ? '.primaryKey()' : ''
  return `    ${column.propertyName}: ${builderCall(column)}${column.notNull ? '.notNull()' : ''}${primaryKey}`
}

function tableDefinition(model: GeneratedModel, tableFn: string): string {
  const compositeKey = isCompositeKey(model)
  const columns = model.columns.map((column) => columnLine(column, compositeKey)).join(',\n')
  const extraConfig = compositeKey
    ? `, (table) => [\n  primaryKey({ columns: [${model.columns.filter((column) => column.primaryKey).map((column) => `table.${column.propertyName}`).join(', ')}] })\n]`
    : ''
  return `export const ${model.tableExportName} = ${tableFn}(${quoteStringLiteral(model.relationName)}, {\n${columns}\n}${extraConfig})`
}

export function emitSchema(models: GeneratedModel[], context: EmitContext): GeneratedFile {
  const builders = new Set<PgColumnBuilder>()
  for (const model of models) {
    for (const column of model.columns) builders.add(column.builder)
  }

  // Models in a non-default schema are emitted through pgSchema(...).table so
  // queries target the schema dbt built them in, not the search_path.
  const usedNames = new Set(models.map((model) => model.tableExportName))
  const schemaConsts = new Map<string, string>()
  for (const schemaName of Array.from(new Set(models.map((model) => model.schemaName).filter((name): name is string => name !== undefined))).sort()) {
    const constName = makeUniqueIdentifier(`${schemaName}_schema`, usedNames, 'schema').identifier
    usedNames.add(constName)
    schemaConsts.set(schemaName, constName)
  }

  const helpers = [
    models.some((model) => model.schemaName === undefined) ? 'pgTable' : undefined,
    schemaConsts.size > 0 ? 'pgSchema' : undefined,
    models.some(isCompositeKey) ? 'primaryKey' : undefined
  ].filter((name): name is string => name !== undefined)
  const imports = [...helpers, ...Array.from(builders).sort()].join(', ')
  const schemaDeclarations = Array.from(schemaConsts, ([schemaName, constName]) => `const ${constName} = pgSchema(${quoteStringLiteral(schemaName)})\n\n`).join('')
  const body = models.map((model) => {
    const schemaConst = model.schemaName === undefined ? undefined : schemaConsts.get(model.schemaName)
    return tableDefinition(model, schemaConst ? `${schemaConst}.table` : 'pgTable')
  }).join('\n\n')
  const schemaEntries = models.map((model) => `  ${model.tableExportName}`).join(',\n')

  return {
    path: 'schema.ts',
    content: `${context.header}\n\nimport { ${imports} } from 'drizzle-orm/pg-core'\n\n${schemaDeclarations}${body}\n\nexport const schema = {\n${schemaEntries}\n}\n\nexport type Schema = typeof schema\n`
  }
}
