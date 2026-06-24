/**
 * Deterministic cube-file + `index.ts` emitter.
 *
 * One `cubes/<fileName>.ts` per model plus a root `index.ts`. Cube files import
 * `defineCube` (runtime) and the non-generic public types `QueryContext` /
 * `BaseQueryDefinition` from `drizzle-cube/server`, and reference Drizzle table
 * columns directly (the cube contract). `targetCube` is a string name so
 * one-file-per-model cubes avoid circular imports.
 */

import type {
  EmitContext,
  GeneratedFile,
  GeneratedMeasure,
  GeneratedModel,
  GeneratedRelationship,
} from './types.js'
import { GENERATED_HEADER } from './write-output.js'

function renderHeader(context: EmitContext): string {
  return [
    GENERATED_HEADER,
    `// Source: manifest=${context.manifestPath} catalog=${context.catalogPath} dialect=${context.dialect}`,
    `// To regenerate, run: npx drizzle-cube dbt generate --manifest ${context.manifestPath} --catalog ${context.catalogPath} --dialect ${context.dialect}`,
  ].join('\n')
}

/** TS type literal for narrowing `securityContext` (unknown-typed) to a column value. */
function tsTypeForDimension(dimType: 'string' | 'number' | 'time' | 'boolean'): string {
  switch (dimType) {
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'string':
    case 'time':
    default:
      return 'string'
  }
}

/** The schema table exports this cube needs: its own table + any join targets. */
function schemaImportsFor(model: GeneratedModel): string[] {
  const imports = new Set<string>([model.tableExport])
  for (const rel of model.relationships) {
    imports.add(rel.targetCube)
  }
  return Array.from(imports).sort()
}

/** Whether a cube needs the `eq` import (security filter present). */
function needsEq(model: GeneratedModel, context: EmitContext): boolean {
  return Boolean(model.securityPropertyName) && context.security.kind === 'filter'
}

/** Whether a cube needs the `sql` import (composite-PK countDistinct). */
function needsSql(model: GeneratedModel): boolean {
  return model.measures.some((m) => m.compositeSql)
}

function renderSqlFunction(model: GeneratedModel, context: EmitContext): string {
  if (model.securityPropertyName && context.security.kind === 'filter') {
    const prop = model.securityPropertyName
    const ctxProp = context.security.contextProperty
    const col = model.columns.find((c) => c.propertyName === prop)
    const tsType = col ? tsTypeForDimension(col.dimensionType) : 'string'
    return [
      '  sql: (ctx: QueryContext): BaseQueryDefinition => ({',
      `    from: ${model.tableExport},`,
      `    where: eq(${model.tableExport}.${prop}, ctx.securityContext.${ctxProp} as ${tsType}),`,
      '  }),',
    ].join('\n')
  }
  return [
    '  // No cube-level security filter was requested for this model.',
    '  sql: (): BaseQueryDefinition => ({',
    `    from: ${model.tableExport},`,
    '  }),',
  ].join('\n')
}

function renderDimension(model: GeneratedModel, indent: string): (col: { propertyName: string; title: string; description?: string; dimensionType: 'string' | 'number' | 'time' | 'boolean'; primaryKey: boolean }) => string {
  return (col) => {
    const lines = [
      `${indent}${col.propertyName}: {`,
      `${indent}  name: '${col.propertyName}',`,
      `${indent}  title: ${JSON.stringify(col.title)},`,
    ]
    if (col.description) {
      lines.push(`${indent}  description: ${JSON.stringify(col.description)},`)
    }
    lines.push(`${indent}  type: '${col.dimensionType}',`)
    lines.push(`${indent}  sql: ${model.tableExport}.${col.propertyName},`)
    if (col.primaryKey) {
      lines.push(`${indent}  primaryKey: true,`)
    }
    lines.push(`${indent}},`)
    return lines.join('\n')
  }
}

/** Render a baseline composite-PK `countDistinct` `concat_ws` expression. */
function renderCompositeSql(model: GeneratedModel, compositeSql: string): string {
  const props = compositeSql.replace(/^concat_ws:/, '').split(',')
  const refs = props.map((p) => `\${${model.tableExport}.${p}}`).join(', ')
  return `sql\`concat_ws('|', ${refs})\``
}

function renderMeasure(model: GeneratedModel, measure: GeneratedMeasure): string {
  const lines = [
    `    ${measure.name}: {`,
    `      name: '${measure.name}',`,
    `      title: ${JSON.stringify(measure.title)},`,
    `      type: '${measure.type}',`,
  ]
  if (measure.compositeSql) {
    lines.push(`      sql: ${renderCompositeSql(model, measure.compositeSql)},`)
  } else if (measure.sql) {
    lines.push(`      sql: ${model.tableExport}.${measure.sql},`)
  }
  if (measure.description) {
    lines.push(`      description: ${JSON.stringify(measure.description)},`)
  }
  if (measure.format) {
    lines.push(`      format: '${measure.format}',`)
  }
  lines.push('    },')
  return lines.join('\n')
}

function renderJoin(model: GeneratedModel, rel: GeneratedRelationship): string {
  const onEntries = rel.on
    .map((pair) => `      { source: ${model.tableExport}.${pair.sourceColumn}, target: ${rel.targetCube}.${pair.targetColumn} },`)
    .join('\n')
  return [
    `    ${rel.targetCube}: {`,
    `      targetCube: '${rel.targetCube}',`,
    `      relationship: 'belongsTo',`,
    '      on: [',
    onEntries,
    '      ],',
    '    },',
  ].join('\n')
}

function renderCubeFile(model: GeneratedModel, context: EmitContext): GeneratedFile {
  const header = renderHeader(context)
  const drizzleImports: string[] = []
  if (needsEq(model, context)) drizzleImports.push('eq')
  if (needsSql(model)) drizzleImports.push('sql')

  const lines: string[] = [header, '']

  if (drizzleImports.length > 0) {
    lines.push(`import { ${drizzleImports.sort().join(', ')} } from 'drizzle-orm'`)
  }
  lines.push("import { defineCube } from 'drizzle-cube/server'")
  lines.push("import type { QueryContext, BaseQueryDefinition } from 'drizzle-cube/server'")
  const schemaImports = schemaImportsFor(model)
  lines.push(`import { ${schemaImports.join(', ')} } from '../schema.js'`)
  lines.push('')

  lines.push(`export const ${model.cubeExport} = defineCube('${model.cubeName}', {`)
  lines.push(`  title: ${JSON.stringify(model.title)},`)
  if (model.description) {
    lines.push(`  description: ${JSON.stringify(model.description)},`)
  }
  lines.push(renderSqlFunction(model, context))
  lines.push('')

  lines.push('  dimensions: {')
  for (const col of model.columns) {
    lines.push(
      renderDimension(model, '    ')({
        propertyName: col.propertyName,
        title: col.title,
        ...(col.description ? { description: col.description } : {}),
        dimensionType: col.dimensionType,
        primaryKey: col.primaryKey,
      }),
    )
  }
  lines.push('  },')
  lines.push('')

  lines.push('  measures: {')
  for (const measure of model.measures) {
    lines.push(renderMeasure(model, measure))
  }
  lines.push('  },')

  if (model.relationships.length > 0) {
    lines.push('')
    lines.push('  joins: {')
    for (const rel of model.relationships) {
      lines.push(renderJoin(model, rel))
    }
    lines.push('  },')
  }

  lines.push('})')
  lines.push('')
  return { path: `cubes/${model.fileName}.ts`, content: lines.join('\n') }
}

function renderIndex(models: GeneratedModel[], context: EmitContext): GeneratedFile {
  const header = renderHeader(context)
  const sorted = [...models].sort((a, b) => a.fileName.localeCompare(b.fileName))
  const lines: string[] = [header, '']
  for (const model of sorted) {
    lines.push(`import { ${model.cubeExport} } from './cubes/${model.fileName}.js'`)
  }
  lines.push('')
  const exports = sorted.map((m) => m.cubeExport).join(', ')
  lines.push(`export { ${exports} }`)
  lines.push('')
  const allCubes = sorted.map((m) => `  ${m.cubeExport},`).join('\n')
  lines.push('export const allCubes = [')
  lines.push(allCubes)
  lines.push(']')
  lines.push('')
  return { path: 'index.ts', content: lines.join('\n') }
}

/**
 * Emit one cube file per model (under `cubes/`) plus a root `index.ts`.
 */
export function emitCubes(models: GeneratedModel[], context: EmitContext): GeneratedFile[] {
  const sorted = [...models].sort((a, b) => a.fileName.localeCompare(b.fileName))
  const cubeFiles = sorted.map((m) => renderCubeFile(m, context))
  return [...cubeFiles, renderIndex(models, context)]
}
