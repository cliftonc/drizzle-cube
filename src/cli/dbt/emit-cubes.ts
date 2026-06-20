/**
 * Emit one cube file per model plus a root `index.ts`.
 *
 * Generated cube code imports `defineCube` and the non-generic public types
 * (`QueryContext`, `BaseQueryDefinition`, `Cube`) from `drizzle-cube/server`,
 * and references Drizzle table/column objects directly for `sql`, dimensions,
 * measures, and joins. Output is byte-stable: imports sorted, stable key
 * ordering, stable whitespace.
 */
import type {
  EmitContext,
  GeneratedColumn,
  GeneratedFile,
  GeneratedMeasure,
  GeneratedModel,
} from './types.js'
import { GENERATED_HEADER } from './write-output.js'
import { toCamelCase } from './naming.js'

/** Render a dimension entry for a cube. */
function renderDimension(col: GeneratedColumn, table: string, indent: string): string[] {
  const lines: string[] = []
  lines.push(`${indent}${col.propertyName}: {`)
  lines.push(`${indent}  name: '${col.propertyName}',`)
  lines.push(`${indent}  title: ${JSON.stringify(col.title)},`)
  if (col.description) {
    lines.push(`${indent}  description: ${JSON.stringify(col.description)},`)
  }
  lines.push(`${indent}  type: '${col.dimensionType}',`)
  lines.push(`${indent}  sql: ${table}.${col.propertyName},`)
  if (col.primaryKey) {
    lines.push(`${indent}  primaryKey: true,`)
  }
  lines.push(`${indent}},`)
  return lines
}

/** Parse the baseline measure's encoded `sql` field into an emitter expression. */
function renderBaselineMeasureSql(measure: GeneratedMeasure, table: string): string | undefined {
  if (measure.type === 'count') {
    return measure.sql
  }
  if (measure.type !== 'countDistinct') return measure.sql ?? ''
  const sql = measure.sql ?? ''
  // Composite PK: encoded as `concat_ws:propA,propB`.
  if (sql.startsWith('concat_ws:')) {
    const props = sql.slice('concat_ws:'.length).split(',').filter(Boolean)
    const refs = props.map((p) => `${table}.${p}`).join(', ')
    return `sql\`count(distinct concat_ws('|', ${refs}))\``
  }
  return sql
}

/** Render a measure entry for a cube. */
function renderMeasure(measure: GeneratedMeasure, table: string, indent: string): string[] {
  const lines: string[] = []
  lines.push(`${indent}${measure.name}: {`)
  lines.push(`${indent}  name: '${measure.name}',`)
  lines.push(`${indent}  title: ${JSON.stringify(measure.title)},`)
  lines.push(`${indent}  type: '${measure.type}',`)
  if (measure.name === 'count') {
    const expr = renderBaselineMeasureSql(measure, table)
    if (expr) lines.push(`${indent}  sql: ${expr},`)
  } else if (measure.sql) {
    lines.push(`${indent}  sql: ${measure.sql},`)
  }
  if (measure.description) {
    lines.push(`${indent}  description: ${JSON.stringify(measure.description)},`)
  }
  if (measure.format) {
    lines.push(`${indent}  format: '${measure.format}',`)
  }
  lines.push(`${indent}},`)
  return lines
}

/** Render a join entry for a cube (string target to avoid circular imports). */
function renderJoin(model: GeneratedModel, indent: string): string[][] {
  const joinBlocks: string[][] = []
  for (const rel of model.relationships) {
    const block: string[] = []
    block.push(`${indent}${rel.targetCube}: {`)
    block.push(`${indent}  targetCube: '${rel.targetCube}',`)
    block.push(`${indent}  relationship: 'belongsTo',`)
    if (rel.on.length === 1) {
      const o = rel.on[0]
      block.push(
        `${indent}  on: [{ source: ${model.tableExport}.${toCamelCase(o.sourceColumn)}, target: ${targetTableExport(rel.targetCube)}.${toCamelCase(o.targetColumn)} }],`,
      )
    } else {
      block.push(`${indent}  on: [`)
      for (const o of rel.on) {
        block.push(
          `${indent}    { source: ${model.tableExport}.${toCamelCase(o.sourceColumn)}, target: ${targetTableExport(rel.targetCube)}.${toCamelCase(o.targetColumn)} },`,
        )
      }
      block.push(`${indent}  ],`)
    }
    block.push(`${indent}},`)
    joinBlocks.push(block)
  }
  return joinBlocks
}

/**
 * Map a target cube name back to the table export identifier.
 *
 * In v1 the cube name is derived from the model name via PascalCase, and the
 * table export is the same PascalCase name, so they match. We keep this as a
 * helper to make the relationship explicit and resilient.
 */
function targetTableExport(cubeName: string): string {
  return cubeName
}

/** Determine whether `sql` from drizzle-orm is needed (composite PK count). */
function needsSqlImport(models: GeneratedModel[]): boolean {
  return models.some((m) =>
    m.measures.some((ms) => ms.name === 'count' && (ms.sql ?? '').startsWith('concat_ws:')),
  )
}

/** Determine whether `eq` from drizzle-orm is needed (security filter). */
function needsEqImport(models: GeneratedModel[]): boolean {
  return models.some((m) => m.securityPropertyName !== undefined)
}

/** Find the generated column for a property name on a model. */
function findColumnByProperty(model: GeneratedModel, propertyName: string): GeneratedColumn | undefined {
  return model.columns.find((c) => c.propertyName === propertyName)
}

/** Map a dimension type to the TypeScript type used for the column value. */
function tsTypeForDimension(type: GeneratedColumn['dimensionType']): string {
  switch (type) {
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'time':
      return 'Date | string'
    case 'string':
    default:
      return 'string'
  }
}

/** Render the `sql` function for a cube (security or no-security). */
function renderSqlFunction(model: GeneratedModel, context: EmitContext, indent: string): string[] {
  const lines: string[] = []
  if (model.securityPropertyName && context.security.kind === 'filter') {
    const secCol = findColumnByProperty(model, model.securityPropertyName)
    // SecurityContext values are typed `unknown` on the public API; narrow to
    // the column's data type for the `eq` operand. This is honest narrowing of
    // a genuinely-loose public type, not validator-silencing.
    const tsType = secCol ? tsTypeForDimension(secCol.dimensionType) : 'unknown'
    lines.push(`${indent}sql: (ctx: QueryContext): BaseQueryDefinition => ({`)
    lines.push(`${indent}  from: ${model.tableExport},`)
    lines.push(
      `${indent}  where: eq(${model.tableExport}.${model.securityPropertyName}, ctx.securityContext.${context.security.contextProperty} as ${tsType})`,
    )
    lines.push(`${indent}}),`)
  } else {
    lines.push(`${indent}// No cube-level security filter was requested for this model.`)
    lines.push(`${indent}sql: (): BaseQueryDefinition => ({`)
    lines.push(`${indent}  from: ${model.tableExport},`)
    lines.push(`${indent}}),`)
  }
  return lines
}

/** Collect the set of target table exports referenced by a model's joins. */
function joinTargetTables(model: GeneratedModel): string[] {
  const set = new Set<string>()
  for (const rel of model.relationships) {
    set.add(targetTableExport(rel.targetCube))
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b))
}

/** Render a single cube file's content. */
function renderCubeFile(model: GeneratedModel, context: EmitContext): string {
  const imports: string[] = []
  const drizzleImports: string[] = []
  if (needsEqImport([model])) drizzleImports.push('eq')
  if (needsSqlImport([model])) drizzleImports.push('sql')
  if (drizzleImports.length > 0) {
    imports.push(`import { ${drizzleImports.sort().join(', ')} } from 'drizzle-orm'`)
  }
  imports.push(`import { defineCube } from 'drizzle-cube/server'`)
  imports.push(`import type { QueryContext, BaseQueryDefinition } from 'drizzle-cube/server'`)
  const schemaImports = [model.tableExport, ...joinTargetTables(model)]
  imports.push(`import { ${schemaImports.join(', ')} } from '../schema.js'`)

  const header =
    `${GENERATED_HEADER}\n` +
    `// Source: manifest=${context.manifestPath}, catalog=${context.catalogPath}, dialect=postgres.\n` +
    `// Model: ${model.modelName} (${model.materialization})\n` +
    `\n` +
    imports.join('\n') +
    `\n\n`

  const lines: string[] = []
  lines.push(`export const ${model.cubeExport} = defineCube('${model.cubeName}', {`)
  lines.push(`  title: ${JSON.stringify(model.title)},`)
  if (model.description) {
    lines.push(`  description: ${JSON.stringify(model.description)},`)
  }
  lines.push('')
  for (const l of renderSqlFunction(model, context, '  ')) lines.push(l)
  lines.push('')

  if (model.relationships.length > 0) {
    lines.push('  joins: {')
    for (const block of renderJoin(model, '    ')) {
      for (const l of block) lines.push(l)
    }
    lines.push('  },')
    lines.push('')
  }

  lines.push('  dimensions: {')
  for (const col of model.columns) {
    for (const l of renderDimension(col, model.tableExport, '    ')) lines.push(l)
  }
  lines.push('  },')
  lines.push('')

  lines.push('  measures: {')
  for (const m of model.measures) {
    for (const l of renderMeasure(m, model.tableExport, '    ')) lines.push(l)
  }
  lines.push('  },')
  lines.push(`})`)
  lines.push('')

  return header + lines.join('\n')
}

/** Render the root `index.ts` that imports and re-exports all cubes. */
function renderIndexFile(models: GeneratedModel[], context: EmitContext): string {
  const sorted = [...models].sort((a, b) => a.fileName.localeCompare(b.fileName))
  const imports = sorted.map(
    (m) => `import { ${m.cubeExport} } from './cubes/${m.fileName}.js'`,
  )
  const exports = sorted.map((m) => `export { ${m.cubeExport} }`)
  const allCubes = sorted.map((m) => `  ${m.cubeExport},`).join('\n')

  const header =
    `${GENERATED_HEADER}\n` +
    `// Source: manifest=${context.manifestPath}, catalog=${context.catalogPath}, dialect=postgres.\n` +
    `// Root index for generated cubes. Re-run 'drizzle-cube dbt generate' to update.\n` +
    `\n` +
    imports.join('\n') +
    `\n\n` +
    exports.join('\n') +
    `\n\n` +
    `export const allCubes = [\n${allCubes}\n]\n`

  return header
}

/**
 * Emit one cube file per model plus a root `index.ts`.
 *
 * Cube files live at `cubes/<fileName>.ts`; the index lives at `index.ts`.
 */
export function emitCubes(models: GeneratedModel[], context: EmitContext): GeneratedFile[] {
  const files: GeneratedFile[] = []
  for (const model of models) {
    files.push({
      path: `cubes/${model.fileName}.ts`,
      content: renderCubeFile(model, context),
    })
  }
  files.push({ path: 'index.ts', content: renderIndexFile(models, context) })
  return files
}
