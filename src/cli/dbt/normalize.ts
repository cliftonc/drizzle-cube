/**
 * Normalize parsed dbt artifacts into `GeneratedModel[]`.
 *
 * Responsibilities:
 *  - Keep only materialized models (table/view/incremental); warn-and-skip the
 *    rest with the model name + materialization.
 *  - Join manifest column descriptions/meta with catalog column types.
 *  - Map each supported catalog column type via `mapPostgresCatalogType`;
 *    unsupported types → warn-and-skip that column (never throw on one column).
 *  - Detect primary keys from dbt `unique`+`not_null` tests or
 *    `meta.drizzle_cube.primary_key`, composite-aware.
 *  - Build a baseline count measure and explicit measures from meta.
 *  - Apply security policy: skip models missing the configured security column.
 *  - Build `belongsTo` relationships only when both endpoints resolve.
 *  - Detect identifier collisions across four namespaces and THROW before emit.
 *  - Sort everything deterministically (models by fileName, columns by index
 *    then SQL name, measures by name, relationships by targetCube).
 */
import type {
  DbtModel,
  DbtColumn,
  DbtRelationshipTest,
  GeneratedColumn,
  GeneratedMeasure,
  GeneratedModel,
  GeneratedRelationship,
  GeneratorWarning,
  ParsedDbtArtifacts,
  SecurityMode,
} from './types.js'
import {
  humanizeTitle,
  toCamelCase,
  toKebabCase,
  toPascalCase,
} from './naming.js'
import { mapPostgresCatalogType } from './postgres-types.js'

const SUPPORTED_MATERIALIZATIONS = new Set(['table', 'view', 'incremental'])

/** Measure types the generator will emit (mirrors `MeasureType` subset). */
const EMITTABLE_MEASURE_TYPES = new Set([
  'count',
  'countDistinct',
  'countDistinctApprox',
  'sum',
  'avg',
  'min',
  'max',
  'runningTotal',
  'number',
])

/** Aggregate measure types that require a numeric source column. */
const NUMERIC_AGGREGATES = new Set(['sum', 'avg', 'min', 'max', 'runningTotal'])

export interface NormalizeOptions {
  security: SecurityMode
}

export interface NormalizeResult {
  models: GeneratedModel[]
  warnings: GeneratorWarning[]
}

/** Read `meta.drizzle_cube` as a record, if present and shaped correctly. */
function readDrizzleCubeMeta(meta: unknown): Record<string, unknown> | undefined {
  if (typeof meta !== 'object' || meta === null) return undefined
  const dc = (meta as Record<string, unknown>)['drizzle_cube']
  if (typeof dc === 'object' && dc !== null && !Array.isArray(dc)) {
    return dc as Record<string, unknown>
  }
  return undefined
}

/** True when a manifest column meta marks it as a primary key. */
function isMetaPrimaryKey(columnMeta: unknown): boolean {
  const dc = readDrizzleCubeMeta(columnMeta)
  return dc ? dc['primary_key'] === true : false
}

/**
 * Resolve the set of primary-key column SQL names for a model.
 *
 * Accepted confident source in v1: `meta.drizzle_cube.primary_key: true` on a
 * column. We never infer a PK from a column merely being named `id`.
 */
function resolvePrimaryKeyColumns(model: DbtModel): Set<string> {
  const pkColumns = new Set<string>()
  for (const [name, col] of Object.entries(model.columns)) {
    if (isMetaPrimaryKey(col.meta)) {
      pkColumns.add(name)
    }
  }
  return pkColumns
}

/** Determine the security property name (lowerCamel) for a column, if filterable. */
function securityPropertyNameFor(model: DbtModel, security: SecurityMode): string | undefined {
  if (security.kind !== 'filter') return undefined
  const sqlName = security.columnName
  const col = model.columns[sqlName]
  if (!col) return undefined
  return toCamelCase(sqlName)
}

/** Build a `GeneratedColumn` from a parsed column + type mapping. */
function buildGeneratedColumn(
  col: DbtColumn,
  mapping: { builder: string; dimensionType: 'string' | 'number' | 'time' | 'boolean'; builderArgs?: string },
  isPrimaryKey: boolean,
): GeneratedColumn {
  return {
    sqlName: col.name,
    propertyName: toCamelCase(col.name),
    title: humanizeTitle(col.name),
    description: col.description,
    builder: mapping.builder,
    builderArgs: mapping.builderArgs,
    dimensionType: mapping.dimensionType,
    primaryKey: isPrimaryKey,
    notNull: isPrimaryKey, // PKs are notNull; others left nullable (conservative).
  }
}

/** Build the baseline count measure for a model. */
function buildBaselineMeasure(
  model: GeneratedModelShape,
  pkColumns: string[],
  firstNonSecurityPropertyName: string | undefined,
): GeneratedMeasure {
  // Composite or single PK → countDistinct.
  if (pkColumns.length >= 1) {
    if (pkColumns.length === 1) {
      return {
        name: 'count',
        title: 'Count',
        type: 'countDistinct',
        sql: `${model.tableExport}.${toCamelCase(pkColumns[0])}`,
      }
    }
    // Composite PK → countDistinct over concat_ws; the emitter renders the
    // `sql` template. We store the column property names so the emitter can
    // build the expression deterministically.
    return {
      name: 'count',
      title: 'Count',
      type: 'countDistinct',
      sql: `concat_ws:${pkColumns.map((c) => toCamelCase(c)).join(',')}`,
    }
  }
  // No PK → plain count. sql is optional for `count` but we prefer a stable
  // column when one exists.
  if (firstNonSecurityPropertyName) {
    return {
      name: 'count',
      title: 'Count',
      type: 'count',
      sql: `${model.tableExport}.${firstNonSecurityPropertyName}`,
    }
  }
  return { name: 'count', title: 'Count', type: 'count' }
}

/** Intermediate shape used while building the baseline measure. */
interface GeneratedModelShape {
  tableExport: string
  cubeName: string
  cubeExport: string
  fileName: string
}

/** Parse explicit measures from model/column `meta.drizzle_cube.measures`. */
function parseExplicitMeasures(
  model: DbtModel,
  tableExport: string,
  columnsByName: Map<string, GeneratedColumn>,
  warnings: GeneratorWarning[],
): GeneratedMeasure[] {
  const out: GeneratedMeasure[] = []
  const seen = new Set<string>()

  const dc = readDrizzleCubeMeta(model.meta)
  const measuresMeta = dc ? dc['measures'] : undefined
  if (!Array.isArray(measuresMeta)) return out

  for (const entry of measuresMeta) {
    if (typeof entry !== 'object' || entry === null) continue
    const m = entry as Record<string, unknown>
    const name = typeof m['name'] === 'string' ? m['name'] : undefined
    const type = typeof m['type'] === 'string' ? m['type'] : undefined
    const column = typeof m['column'] === 'string' ? m['column'] : undefined
    const title = typeof m['title'] === 'string' ? m['title'] : undefined
    const format = typeof m['format'] === 'string' ? m['format'] : undefined
    const description = typeof m['description'] === 'string' ? m['description'] : undefined

    if (!name || !type) {
      warnings.push({
        code: 'MEASURE_SKIPPED',
        message: `Skipping measure missing name/type in meta on model '${model.name}'.`,
        modelName: model.name,
      })
      continue
    }
    if (!EMITTABLE_MEASURE_TYPES.has(type)) {
      warnings.push({
        code: 'MEASURE_SKIPPED',
        message: `Skipping measure '${name}' on model '${model.name}': unsupported type '${type}'.`,
        modelName: model.name,
      })
      continue
    }
    if (seen.has(name)) {
      warnings.push({
        code: 'MEASURE_SKIPPED',
        message: `Skipping duplicate measure '${name}' on model '${model.name}'.`,
        modelName: model.name,
      })
      continue
    }
    // Aggregate measures require a referenced column that exists and is numeric.
    if (NUMERIC_AGGREGATES.has(type)) {
      if (!column) {
        warnings.push({
          code: 'MEASURE_SKIPPED',
          message: `Skipping measure '${name}' on model '${model.name}': aggregate '${type}' requires a column.`,
          modelName: model.name,
        })
        continue
      }
      const col = columnsByName.get(column)
      if (!col) {
        warnings.push({
          code: 'MEASURE_SKIPPED',
          message: `Skipping measure '${name}' on model '${model.name}': column '${column}' not found or skipped.`,
          modelName: model.name,
          columnName: column,
        })
        continue
      }
      if (col.dimensionType !== 'number') {
        warnings.push({
          code: 'MEASURE_SKIPPED',
          message: `Skipping measure '${name}' on model '${model.name}': aggregate '${type}' requires a numeric column (got ${col.dimensionType}).`,
          modelName: model.name,
          columnName: column,
        })
        continue
      }
    }
    seen.add(name)
    const measure: GeneratedMeasure = {
      name,
      title: title ?? humanizeTitle(name),
      type,
    }
    if (column) {
      const col = columnsByName.get(column)
      if (col) measure.sql = `${tableExport}.${col.propertyName}`
    }
    if (description) measure.description = description
    if (format) measure.format = format
    out.push(measure)
  }
  return out
}

/** Build relationships for a model from parsed dbt relationship tests. */
function buildRelationships(
  model: DbtModel,
  modelShapes: Map<string, GeneratedModelShape>,
  keptColumns: Map<string, Set<string>>,
  relationships: DbtRelationshipTest[],
  modelUniqueIds: Set<string>,
  warnings: GeneratorWarning[],
): GeneratedRelationship[] {
  const out: GeneratedRelationship[] = []
  for (const rel of relationships) {
    if (rel.sourceModelId !== model.uniqueId) continue
    if (!modelUniqueIds.has(rel.targetModelId)) {
      warnings.push({
        code: 'RELATIONSHIP_DROPPED',
        message: `Dropping relationship from '${model.name}': target model '${rel.targetModelId}' was skipped.`,
        modelName: model.name,
      })
      continue
    }
    const targetShape = modelShapes.get(rel.targetModelId)
    if (!targetShape) {
      warnings.push({
        code: 'RELATIONSHIP_DROPPED',
        message: `Dropping relationship from '${model.name}': target model '${rel.targetModelId}' not emitted.`,
        modelName: model.name,
      })
      continue
    }
    const sourceCol = rel.sourceColumn
    const targetCol = rel.targetColumn
    const sourceKept = keptColumns.get(model.uniqueId)?.has(sourceCol) ?? false
    const targetKept = keptColumns.get(rel.targetModelId)?.has(targetCol) ?? false
    if (!sourceKept || !targetKept) {
      warnings.push({
        code: 'RELATIONSHIP_DROPPED',
        message: `Dropping relationship from '${model.name}' to '${targetShape.cubeName}': source/target column was skipped.`,
        modelName: model.name,
        columnName: sourceCol,
      })
      continue
    }
    out.push({
      sourceCube: modelShapes.get(model.uniqueId)!.cubeName,
      targetCube: targetShape.cubeName,
      relationship: 'belongsTo',
      on: [{ sourceColumn: sourceCol, targetColumn: targetCol }],
    })
  }
  // Deduplicate by targetCube + on, deterministic order.
  const seen = new Set<string>()
  const deduped: GeneratedRelationship[] = []
  for (const r of out.sort((a, b) => a.targetCube.localeCompare(b.targetCube))) {
    const key = `${r.targetCube}|${r.on.map((o) => `${o.sourceColumn}=${o.targetColumn}`).join(',')}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(r)
  }
  return deduped
}

/**
 * Normalize parsed artifacts into emit-ready models.
 *
 * Throws an `Error` (code `IDENTIFIER_COLLISION`) when two models derive the
 * same `tableExport`, `cubeName`, `cubeExport`, or `fileName` — a collision
 * means generated output would be silently overwritten, which is worse than
 * a stopped run. All other unsupported inputs are warn-and-skip.
 */
export function normalizeDbtArtifacts(
  artifacts: ParsedDbtArtifacts,
  options: NormalizeOptions,
): NormalizeResult {
  const warnings: GeneratorWarning[] = []
  const { security } = options

  // Phase 1: filter to materialized models with catalog entries.
  const candidateModels: DbtModel[] = []
  for (const model of Object.values(artifacts.models)) {
    if (!SUPPORTED_MATERIALIZATIONS.has(model.materialization)) {
      warnings.push({
        code: 'MODEL_SKIPPED',
        message: `Skipping model '${model.name}': unsupported materialization '${model.materialization}'.`,
        modelName: model.name,
      })
      continue
    }
    if (Object.keys(model.columns).length === 0) {
      warnings.push({
        code: 'MODEL_SKIPPED',
        message: `Skipping model '${model.name}': no catalog columns found (schema generation needs types).`,
        modelName: model.name,
      })
      continue
    }
    candidateModels.push(model)
  }

  // Phase 2: derive shapes + collision detection across all four namespaces.
  const usedTableExports = new Set<string>()
  const usedCubeNames = new Set<string>()
  const usedCubeExports = new Set<string>()
  const usedFileNames = new Set<string>()
  const shapes = new Map<string, GeneratedModelShape>()
  const shapeOwners = new Map<string, string>() // shape key → model unique id

  for (const model of candidateModels) {
    const tableExport = toPascalCase(model.name)
    const cubeName = toPascalCase(model.name)
    const cubeExport = `${toCamelCase(model.name)}Cube`
    const fileName = toKebabCase(model.name)

    // Per-model: check each namespace for collision with a different model.
    const collisions: Array<{ namespace: string; identifier: string }> = []
    if (usedTableExports.has(tableExport)) collisions.push({ namespace: 'tableExport', identifier: tableExport })
    if (usedCubeNames.has(cubeName)) collisions.push({ namespace: 'cubeName', identifier: cubeName })
    if (usedCubeExports.has(cubeExport)) collisions.push({ namespace: 'cubeExport', identifier: cubeExport })
    if (usedFileNames.has(fileName)) collisions.push({ namespace: 'fileName', identifier: fileName })

    if (collisions.length > 0) {
      const first = collisions[0]
      const priorOwnerId = shapeOwners.get(`${first.namespace}:${first.identifier}`)
      const priorModel = priorOwnerId ? artifacts.models[priorOwnerId] : undefined
      throw new Error(
        `Identifier collision: model '${model.name}' (${model.uniqueId}) and model ` +
        `'${priorModel?.name ?? priorOwnerId ?? '?'}' (${priorOwnerId ?? '?'}) both derive ` +
        `${first.namespace} '${first.identifier}'. Rename one of the models before generating.`,
      )
    }

    usedTableExports.add(tableExport)
    usedCubeNames.add(cubeName)
    usedCubeExports.add(cubeExport)
    usedFileNames.add(fileName)
    const shape: GeneratedModelShape = { tableExport, cubeName, cubeExport, fileName }
    shapes.set(model.uniqueId, shape)
    shapeOwners.set(`tableExport:${tableExport}`, model.uniqueId)
    shapeOwners.set(`cubeName:${cubeName}`, model.uniqueId)
    shapeOwners.set(`cubeExport:${cubeExport}`, model.uniqueId)
    shapeOwners.set(`fileName:${fileName}`, model.uniqueId)
  }

  // Phase 3: per-model column mapping, PK detection, security skip, measures.
  const keptColumns = new Map<string, Set<string>>()
  const generated: GeneratedModel[] = []

  for (const model of candidateModels) {
    const shape = shapes.get(model.uniqueId)!
    const pkSqlNames = resolvePrimaryKeyColumns(model)
    const securityProp = securityPropertyNameFor(model, security)
    if (security.kind === 'filter' && !securityProp) {
      warnings.push({
        code: 'MODEL_SKIPPED',
        message: `Skipping model '${model.name}': configured security column '${security.columnName}' is missing or was skipped.`,
        modelName: model.name,
      })
      continue
    }

    const columns: GeneratedColumn[] = []
    const keptForModel = new Set<string>()
    for (const col of Object.values(model.columns)) {
      const mapping = mapPostgresCatalogType(col.type)
      if (!mapping) {
        warnings.push({
          code: 'COLUMN_SKIPPED',
          message: `Skipping column '${col.name}' on model '${model.name}': unsupported type '${col.type}'.`,
          modelName: model.name,
          columnName: col.name,
        })
        // Cascade: if this was a PK column, drop it from the PK set.
        pkSqlNames.delete(col.name)
        continue
      }
      const isPk = pkSqlNames.has(col.name)
      columns.push(buildGeneratedColumn(col, mapping, isPk))
      keptForModel.add(col.name)
    }
    keptColumns.set(model.uniqueId, keptForModel)

    // Cascade: if security column was skipped above, skip the model.
    if (security.kind === 'filter' && !keptForModel.has(security.columnName)) {
      warnings.push({
        code: 'MODEL_SKIPPED',
        message: `Skipping model '${model.name}': security column '${security.columnName}' was skipped (unsupported type).`,
        modelName: model.name,
      })
      continue
    }

    const columnsByName = new Map(columns.map((c) => [c.sqlName, c]))
    const pkColumnsArr = columns
      .filter((c) => c.primaryKey)
      .map((c) => c.sqlName)
      .sort((a, b) => {
        const ia = model.columns[a]?.index ?? 0
        const ib = model.columns[b]?.index ?? 0
        return ia - ib || a.localeCompare(b)
      })

    const firstNonSecurityCol = columns.find(
      (c) => c.sqlName !== (security.kind === 'filter' ? security.columnName : ''),
    )
    const baseline = buildBaselineMeasure(shape, pkColumnsArr, firstNonSecurityCol?.propertyName)

    const explicit = parseExplicitMeasures(model, shape.tableExport, columnsByName, warnings)
    const measures = [baseline, ...explicit].sort((a, b) => a.name.localeCompare(b.name))

    generated.push({
      dbtUniqueId: model.uniqueId,
      modelName: model.name,
      relationName: model.relationName,
      materialization: model.materialization,
      tableExport: shape.tableExport,
      cubeName: shape.cubeName,
      cubeExport: shape.cubeExport,
      fileName: shape.fileName,
      title: humanizeTitle(model.name),
      description: model.description,
      columns: columns.sort((a, b) => {
        const ia = model.columns[a.sqlName]?.index ?? 0
        const ib = model.columns[b.sqlName]?.index ?? 0
        return ia - ib || a.sqlName.localeCompare(b.sqlName)
      }),
      measures,
      relationships: [], // populated in phase 4
      securityPropertyName: securityProp,
    })
  }

  // Phase 4: relationships (only between kept models with kept columns).
  const keptModelUniqueIds = new Set(generated.map((m) => m.dbtUniqueId))
  const generatedShapes = new Map<string, GeneratedModelShape>()
  for (const m of generated) {
    generatedShapes.set(m.dbtUniqueId, {
      tableExport: m.tableExport,
      cubeName: m.cubeName,
      cubeExport: m.cubeExport,
      fileName: m.fileName,
    })
  }
  for (const model of generated) {
    const sourceDbtModel = artifacts.models[model.dbtUniqueId]
    if (!sourceDbtModel) continue
    model.relationships = buildRelationships(
      sourceDbtModel,
      generatedShapes,
      keptColumns,
      artifacts.relationships,
      keptModelUniqueIds,
      warnings,
    )
  }

  generated.sort((a, b) => a.fileName.localeCompare(b.fileName))
  return { models: generated, warnings }
}
