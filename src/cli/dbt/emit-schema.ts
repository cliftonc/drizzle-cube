import { quoteStringLiteral } from './naming.js'
import type { EmitContext, GeneratedFile, GeneratedModel, PgColumnBuilder } from './types.js'

function builderCall(builder: PgColumnBuilder, sqlName: string): string {
  if (builder === 'bigint') return `bigint(${quoteStringLiteral(sqlName)}, { mode: 'number' })`
  return `${builder}(${quoteStringLiteral(sqlName)})`
}

function columnLine(column: GeneratedModel['columns'][number]): string {
  const chain = `${builderCall(column.builder, column.sqlName)}${column.notNull ? '.notNull()' : ''}${column.primaryKey ? '.primaryKey()' : ''}`
  return `    ${column.propertyName}: ${chain}`
}

export function emitSchema(models: GeneratedModel[], context: EmitContext): GeneratedFile {
  const builders = new Set<PgColumnBuilder>()
  for (const model of models) {
    for (const column of model.columns) builders.add(column.builder)
  }
  const imports = ['pgTable', ...Array.from(builders).sort()].join(', ')
  const body = models.map((model) => {
    const columns = model.columns.map(columnLine).join(',\n')
    return `export const ${model.tableExportName} = pgTable(${quoteStringLiteral(model.relationName)}, {\n${columns}\n})`
  }).join('\n\n')
  const schemaEntries = models.map((model) => `  ${model.tableExportName}`).join(',\n')

  return {
    path: 'schema.ts',
    content: `${context.header}\n\nimport { ${imports} } from 'drizzle-orm/pg-core'\n\n${body}\n\nexport const schema = {\n${schemaEntries}\n}\n\nexport type Schema = typeof schema\n`
  }
}
