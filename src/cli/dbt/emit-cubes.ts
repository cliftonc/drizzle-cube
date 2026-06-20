import { GENERATED_HEADER_PREFIX, type GeneratedFile, type GeneratedModel, type SecurityConfig } from './types.js'

function securityColumnProperty(model: GeneratedModel, security: SecurityConfig): string | undefined {
  return security.mode === 'column' ? model.columns.find((column) => column.dbName === security.column)?.propertyName : undefined
}

function descriptionLine(description: string | undefined, indent: string): string[] {
  return description ? [`${indent}description: ${JSON.stringify(description)},`] : []
}

function emitCube(model: GeneratedModel, security: SecurityConfig): GeneratedFile {
  const secureProperty = securityColumnProperty(model, security)
  const schemaImports = Array.from(new Set([model.tableExportName, ...model.joins.map((join) => join.targetTableExportName)])).sort()
  const lines = [GENERATED_HEADER_PREFIX]
  if (secureProperty) lines.push("import { eq } from 'drizzle-orm'")
  lines.push("import { defineCube } from 'drizzle-cube/server'")
  lines.push(secureProperty ? "import type { BaseQueryDefinition, QueryContext } from 'drizzle-cube/server'" : "import type { BaseQueryDefinition } from 'drizzle-cube/server'")
  lines.push(`import { ${schemaImports.join(', ')} } from '../schema.js'`)
  lines.push('', `export const ${model.cubeVarName} = defineCube(${JSON.stringify(model.cubeName)}, {`)
  lines.push(`  title: ${JSON.stringify(model.title)},`)
  lines.push(...descriptionLine(model.description, '  '))
  if (secureProperty && security.mode === 'column') {
    lines.push('  sql: (ctx: QueryContext): BaseQueryDefinition => ({')
    lines.push(`    from: ${model.tableExportName},`)
    lines.push(`    where: eq(${model.tableExportName}.${secureProperty}, ctx.securityContext.${security.context})`)
    lines.push('  }),')
  } else {
    lines.push(`  sql: (): BaseQueryDefinition => ({ from: ${model.tableExportName} }),`)
  }
  lines.push('', '  dimensions: {')
  for (const column of model.columns) {
    if (!column.dimensionType) continue
    lines.push(`    ${column.dimensionName}: {`)
    lines.push(`      name: ${JSON.stringify(column.dimensionName)},`)
    lines.push(`      title: ${JSON.stringify(column.title)},`)
    lines.push(...descriptionLine(column.description, '      '))
    lines.push(`      type: ${JSON.stringify(column.dimensionType)},`)
    lines.push(`      sql: ${model.tableExportName}.${column.propertyName}${column.primaryKey ? ',' : ''}`)
    if (column.primaryKey) lines.push('      primaryKey: true')
    lines.push('    },')
  }
  lines.push('  },', '', '  measures: {')
  for (const measure of model.measures) {
    lines.push(`    ${measure.name}: {`)
    lines.push(`      name: ${JSON.stringify(measure.name)},`)
    lines.push(`      title: ${JSON.stringify(measure.title)},`)
    lines.push(...descriptionLine(measure.description, '      '))
    lines.push(`      type: ${JSON.stringify(measure.type)}${measure.columnPropertyName || measure.format ? ',' : ''}`)
    if (measure.columnPropertyName) lines.push(`      sql: ${model.tableExportName}.${measure.columnPropertyName}${measure.format ? ',' : ''}`)
    if (measure.format) lines.push(`      format: ${JSON.stringify(measure.format)}`)
    lines.push('    },')
  }
  lines.push('  },')
  if (model.joins.length > 0) {
    lines.push('', '  joins: {')
    for (const join of model.joins) {
      lines.push(`    ${join.targetCubeName}: {`)
      lines.push(`      targetCube: ${JSON.stringify(join.targetCubeName)},`)
      lines.push(`      relationship: ${JSON.stringify(join.relationship)},`)
      lines.push('      on: [')
      lines.push(`        { source: ${model.tableExportName}.${join.sourceColumnPropertyName}, target: ${join.targetTableExportName}.${join.targetColumnPropertyName} }`)
      lines.push('      ]')
      lines.push('    },')
    }
    lines.push('  },')
  }
  lines.push('})', '')
  return { path: `cubes/${model.fileName}.ts`, content: lines.join('\n') }
}

export function emitCubeFiles(models: GeneratedModel[], options: { security: SecurityConfig }): GeneratedFile[] {
  const cubeFiles = models.map((model) => emitCube(model, options.security))
  const indexLines = [GENERATED_HEADER_PREFIX]
  for (const model of models) {
    indexLines.push(`import { ${model.cubeVarName} } from './cubes/${model.fileName}.js'`)
  }
  indexLines.push('', ...models.map((model) => `export { ${model.cubeVarName} }`), '')
  indexLines.push(`export const allCubes = [${models.map((model) => model.cubeVarName).join(', ')}]`, '')
  return [...cubeFiles, { path: 'index.ts', content: indexLines.join('\n') }]
}
