/**
 * Deterministic emitters for the generated cube files and the `index.ts` barrel.
 *
 * Each materialized model becomes one self-contained cube file using string
 * `targetCube` join references (so files never import one another and the
 * compiler resolves joins at registration via validateCubeReferences()).
 *
 * Generated cubes use the NON-generic `Cube`/`QueryContext` public types — the
 * generic `Cube<Schema>` form used in `dev/` is not part of the typechecked
 * public surface. The security predicate casts the security-context value to the
 * column's primitive type because Drizzle's `eq` will not accept the wide
 * `number | string | undefined` security-context type directly.
 */

import type { DimensionType, GeneratedModel, SecurityConfig } from './types.js'
import { generatedHeader, quote, sortedUnique, type HeaderInfo } from './emit-shared.js'

/** Primitive TS type to cast the security-context value to, by dimension type. */
function securityCastType(dimensionType: DimensionType): string {
  if (dimensionType === 'number') return 'number'
  if (dimensionType === 'boolean') return 'boolean'
  // text/uuid (string) and the unlikely time case both cast to string.
  return 'string'
}

function dimensionBlock(model: GeneratedModel, column: GeneratedModel['columns'][number]): string {
  const lines = [
    `      name: ${quote(column.propName)}`,
    `      title: ${quote(column.title)}`,
    `      type: ${quote(column.dimensionType)}`,
    `      sql: ${model.tableExport}.${column.propName}`
  ]
  if (column.primaryKey) lines.push('      primaryKey: true')
  if (column.description) lines.push(`      description: ${quote(column.description)}`)
  return `    ${column.propName}: {\n${lines.join(',\n')}\n    }`
}

function measureBlock(model: GeneratedModel, measure: GeneratedModel['measures'][number]): string {
  const lines = [
    `      name: ${quote(measure.name)}`,
    `      title: ${quote(measure.title)}`,
    `      type: ${quote(measure.type)}`
  ]
  if (measure.columnProp) lines.push(`      sql: ${model.tableExport}.${measure.columnProp}`)
  if (measure.description) lines.push(`      description: ${quote(measure.description)}`)
  return `    ${measure.name}: {\n${lines.join(',\n')}\n    }`
}

function joinBlock(
  model: GeneratedModel,
  relationship: GeneratedModel['relationships'][number],
  modelsByUid: Map<string, GeneratedModel>
): string {
  const target = modelsByUid.get(relationship.targetModelUid)!
  const on = `      on: [\n        { source: ${model.tableExport}.${relationship.sourceColumnProp}, target: ${target.tableExport}.${relationship.targetColumnProp} }\n      ]`
  const body = [
    `      targetCube: ${quote(relationship.targetCube)}`,
    `      relationship: 'belongsTo'`,
    on
  ].join(',\n')
  return `    ${relationship.targetCube}: {\n${body}\n    }`
}

function sqlFunction(model: GeneratedModel, security: SecurityConfig | null): string {
  if (!security) {
    return `  sql: (): BaseQueryDefinition => ({\n    from: ${model.tableExport}\n  })`
  }
  const securityColumn = model.columns.find((c) => c.dbName === security.column)!
  const cast = securityCastType(securityColumn.dimensionType)
  const where = `eq(${model.tableExport}.${securityColumn.propName}, ctx.securityContext.${security.context} as ${cast})`
  return `  sql: (ctx: QueryContext): BaseQueryDefinition => ({\n    from: ${model.tableExport},\n    where: ${where}\n  })`
}

/** Emit a single cube file's TypeScript content. */
export function emitCubeFile(
  model: GeneratedModel,
  security: SecurityConfig | null,
  modelsByUid: Map<string, GeneratedModel>,
  header: HeaderInfo
): string {
  // Table imports: own table + every join target table.
  const tableImports = sortedUnique([
    model.tableExport,
    ...model.relationships.map((r) => modelsByUid.get(r.targetModelUid)!.tableExport)
  ])

  const imports: string[] = []
  if (security) imports.push(`import { eq } from 'drizzle-orm'`)
  imports.push(`import { defineCube } from 'drizzle-cube/server'`)
  imports.push(
    security
      ? `import type { QueryContext, BaseQueryDefinition } from 'drizzle-cube/server'`
      : `import type { BaseQueryDefinition } from 'drizzle-cube/server'`
  )
  imports.push(`import { ${tableImports.join(', ')} } from '../schema.js'`)

  const dimensions = model.columns.map((c) => dimensionBlock(model, c)).join(',\n')
  const measures = model.measures.map((m) => measureBlock(model, m)).join(',\n')

  const sections: string[] = []
  sections.push(`  title: ${quote(model.title)}`)
  if (model.description) sections.push(`  description: ${quote(model.description)}`)
  sections.push(sqlFunction(model, security))
  sections.push(`  dimensions: {\n${dimensions}\n  }`)
  sections.push(`  measures: {\n${measures}\n  }`)
  if (model.relationships.length > 0) {
    const joins = model.relationships.map((r) => joinBlock(model, r, modelsByUid)).join(',\n')
    sections.push(`  joins: {\n${joins}\n  }`)
  }

  const cube = `export const ${model.cubeVar} = defineCube(${quote(model.cubeName)}, {\n${sections.join(',\n\n')}\n})`

  return [generatedHeader(header), '', imports.join('\n'), '', cube, ''].join('\n')
}

/** Emit the `index.ts` barrel that re-exports `allCubes`. */
export function emitIndex(models: GeneratedModel[], header: HeaderInfo): string {
  const sorted = [...models].sort((a, b) =>
    a.cubeVar < b.cubeVar ? -1 : a.cubeVar > b.cubeVar ? 1 : 0
  )
  const imports = sorted
    .map((m) => `import { ${m.cubeVar} } from './cubes/${m.fileName}.js'`)
    .join('\n')
  const arrayItems = sorted.map((m) => `  ${m.cubeVar}`).join(',\n')
  return [
    generatedHeader(header),
    '',
    imports,
    '',
    `export const allCubes = [\n${arrayItems}\n]`,
    ''
  ].join('\n')
}
