import { quoteStringLiteral } from './naming.js'
import type { EmitContext, GeneratedFile, GeneratedModel } from './types.js'

function descriptionLine(description: string | undefined, indent: string): string {
  return description ? `${indent}description: ${quoteStringLiteral(description)},\n` : ''
}

function dimensionLines(model: GeneratedModel): string {
  return model.columns.map((column) => {
    return `    ${column.dimensionName}: {\n      name: ${quoteStringLiteral(column.dimensionName)},\n      title: ${quoteStringLiteral(column.title)},\n${descriptionLine(column.description, '      ')}      type: ${quoteStringLiteral(column.dimensionType)},\n      sql: ${model.tableExportName}.${column.propertyName}${column.primaryKey ? ',\n      primaryKey: true' : ''}\n    }`
  }).join(',\n')
}

function countMeasure(model: GeneratedModel): string {
  const pks = model.columns.filter((column) => column.primaryKey)
  if (pks.length === 1 && pks[0]) {
    return `    count: {\n      name: 'count',\n      type: 'countDistinct',\n      sql: ${model.tableExportName}.${pks[0].propertyName}\n    }`
  }
  if (pks.length > 1) {
    return `    count: {\n      name: 'count',\n      type: 'count'\n    }`
  }
  return `    count: {\n      name: 'count',\n      type: 'count'\n    }`
}

function explicitMeasureLines(model: GeneratedModel): string[] {
  return model.measures.map((measure) => {
    const column = measure.columnName ? model.columns.find((candidate) => candidate.sqlName === measure.columnName) : undefined
    const sqlLine = column ? `,\n      sql: ${model.tableExportName}.${column.propertyName}` : ''
    const titleLine = measure.title ? `,\n      title: ${quoteStringLiteral(measure.title)}` : ''
    const description = measure.description ? `,\n      description: ${quoteStringLiteral(measure.description)}` : ''
    return `    ${measure.name}: {\n      name: ${quoteStringLiteral(measure.name)},\n      type: ${quoteStringLiteral(measure.type)}${sqlLine}${titleLine}${description}\n    }`
  })
}

function joinsBlock(model: GeneratedModel): string {
  if (model.relationships.length === 0) return ''
  const joins = model.relationships.map((join) => {
    return `    ${join.name}: {\n      targetCube: ${quoteStringLiteral(join.targetCubeName)},\n      relationship: 'belongsTo',\n      on: [{ source: ${model.tableExportName}.${join.sourceColumnName}, target: ${join.targetTableExportName}.${join.targetColumnName} }]\n    }`
  }).join(',\n')
  return `,\n  joins: {\n${joins}\n  }`
}

function securityValueHelper(model: GeneratedModel): string {
  if (model.security.kind !== 'filter') return ''
  const security = model.security
  const securityColumn = model.columns.find((column) => column.sqlName === security.columnName)
  if (!securityColumn) return ''
  const typeName = securityColumn.dimensionType === 'number' ? 'number' : securityColumn.dimensionType === 'boolean' ? 'boolean' : 'string'
  const transform = typeName === 'string' ? 'String(value)' : 'value'
  return `\nfunction securityValue(ctx: QueryContext): ${typeName} {\n  const value = ctx.securityContext.${security.contextProperty}\n  if (typeof value !== ${quoteStringLiteral(typeName)}) {\n    throw new Error(${quoteStringLiteral(`Missing ${typeName} security context value '${security.contextProperty}'.`)})\n  }\n  return ${transform}\n}\n`
}

function cubeContent(model: GeneratedModel, context: EmitContext): string {
  const needsEq = model.security.kind === 'filter'
  const schemaImports = Array.from(new Set([model.tableExportName, ...model.relationships.map((join) => join.targetTableExportName)])).sort().join(', ')
  let sqlBody = `// No cube-level security filter was requested.\n  sql: (): BaseQueryDefinition => ({ from: ${model.tableExportName} })`
  if (model.security.kind === 'filter') {
    const security = model.security
    const securityColumn = model.columns.find((column) => column.sqlName === security.columnName)
    if (securityColumn) {
      sqlBody = `sql: (ctx: QueryContext): BaseQueryDefinition => ({\n    from: ${model.tableExportName},\n    where: eq(${model.tableExportName}.${securityColumn.propertyName}, securityValue(ctx))\n  })`
    }
  }
  const measures = [countMeasure(model), ...explicitMeasureLines(model)].join(',\n')
  const imports = needsEq ? "import { eq } from 'drizzle-orm'\n" : ''

  return `${context.header}\n\n${imports}import { defineCube, type BaseQueryDefinition, type Cube, type QueryContext } from 'drizzle-cube/server'\nimport { ${schemaImports} } from '../schema'\n${securityValueHelper(model)}\nexport const ${model.cubeExportName}: Cube = defineCube(${quoteStringLiteral(model.cubeName)}, {\n  title: ${quoteStringLiteral(model.title)},\n${descriptionLine(model.description, '  ')}  ${sqlBody},\n  dimensions: {\n${dimensionLines(model)}\n  },\n  measures: {\n${measures}\n  }${joinsBlock(model)}\n})\n`
}

function indexContent(models: GeneratedModel[], context: EmitContext): string {
  const imports = models.map((model) => `import { ${model.cubeExportName} } from './cubes/${model.fileName}'`).join('\n')
  const exports = models.map((model) => `export { ${model.cubeExportName} } from './cubes/${model.fileName}'`).join('\n')
  const array = models.map((model) => `  ${model.cubeExportName}`).join(',\n')
  return `${context.header}\n\n${imports}\n\n${exports}\n\nexport { schema } from './schema'\n\nexport const allCubes = [\n${array}\n]\n`
}

export function emitCubes(models: GeneratedModel[], context: EmitContext): GeneratedFile[] {
  return [
    ...models.map((model) => ({ path: `cubes/${model.fileName}.ts`, content: cubeContent(model, context) })),
    { path: 'index.ts', content: indexContent(models, context) }
  ]
}
