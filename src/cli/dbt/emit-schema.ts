import { GENERATED_HEADER_PREFIX, type GeneratedFile, type GeneratedModel } from './types.js'

interface SourceInfo {
  manifestPath: string
  catalogPath: string
  dialect: 'postgres'
}

export function emitSchemaFile(models: GeneratedModel[], sourceInfo: SourceInfo): GeneratedFile {
  const imports = Array.from(new Set(['pgTable', ...models.flatMap((model) => model.columns.map((column) => column.drizzleImport))])).sort()
  const lines = [
    GENERATED_HEADER_PREFIX,
    `// Source: manifest=${sourceInfo.manifestPath}, catalog=${sourceInfo.catalogPath}, dialect=${sourceInfo.dialect}.`,
    '// Do not edit manually; change dbt metadata or generator config instead.',
    '',
    `import { ${imports.join(', ')} } from 'drizzle-orm/pg-core'`,
    '',
  ]

  for (const model of models) {
    lines.push(`export const ${model.tableExportName} = pgTable(${JSON.stringify(model.relationName)}, {`)
    for (const column of model.columns) {
      const suffix = `${column.primaryKey ? '.primaryKey()' : ''}${column.notNull && !column.primaryKey ? '.notNull()' : ''}`
      lines.push(`  ${column.propertyName}: ${column.drizzleBuilder}${suffix},`)
    }
    lines.push('})', '')
  }

  lines.push('export const schema = {')
  for (const model of models) {
    lines.push(`  ${model.tableExportName},`)
  }
  lines.push('}', '')
  lines.push('export type Schema = typeof schema', '')

  return { path: 'schema.ts', content: lines.join('\n') }
}
