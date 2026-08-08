/**
 * Normalize parsed dbt artifacts into `GeneratedModel[]`.
 *
 * Phases:
 *  1. Filter — keep only supported materializations; warn-and-skip the rest.
 *  2. Shape derivation + collision detection (throw on collisions).
 *  3. Per-model column mapping, PK detection, security skip, measures.
 *  4. Relationships — build `belongsTo` edges only between kept models/columns.
 *
 * Every unsupported/skipped input produces a visible warning. Identifier
 * collisions throw (a stopped run is better than a silent overwrite).
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
  SupportedMaterialization,
} from './types.js'
import {
  humanizeTitle,
  sanitizeIdentifier,
  toCamelCase,
  toKebabCase,
  toPascalCase,
} from './naming.js'
import { mapPostgresCatalogType } from './postgres-types.js'

const SUPPORTED_MATERIALIZATIONS: ReadonlySet<SupportedMaterialization> = new Set([
  'table',
  'view',
  'incremental',
])

/** Measure types the generator will emit (a safe subset of `MeasureType`). */
const EMITTABLE_MEASURE_TYPES: ReadonlySet<string> = new Set([
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

/** Numeric aggregates that require a referenced numeric column. */
const NUMERIC_AGGREGATE_TYPES: ReadonlySet<string> = new Set([
  'sum',
  'avg',
  'min',
  'max',
  'runningTotal',
])

export interface NormalizeOptions {
  security: SecurityMode
}

export interface NormalizeResult {
  models: GeneratedModel[]
  warnings: GeneratorWarning[]
}

interface MeasureMeta {
  name?: string
  type?: string
  column?: string
  sql?: string
  format?: string
  description?: string
}

// ---------------------------------------------------------------------------
// Phase 1 — filter
// ---------------------------------------------------------------------------

function isSupportedMaterialization(value: string): value is SupportedMaterialization {
  return SUPPORTED_MATERIALIZATIONS.has(value as SupportedMaterialization)
}

interface FilterResult {
  candidates: DbtModel[]
  warnings: GeneratorWarning[]
  skipped: Set<string>
}

function filterModels(models: Record<string, DbtModel>): FilterResult {
  const candidates: DbtModel[] = []
  const warnings: GeneratorWarning[] = []
  const skipped = new Set<string>()
  for (const model of Object.values(models)) {
    if (!isSupportedMaterialization(model.materialization)) {
      warnings.push({
        code: 'MODEL_SKIPPED',
        message: `Model '${model.name}' skipped: unsupported materialization '${model.materialization}'. v1 supports table, view, incremental.`,
        modelName: model.name,
      })
      skipped.add(model.uniqueId)
      continue
    }
    if (Object.keys(model.columns).length === 0) {
      warnings.push({
        code: 'MODEL_SKIPPED',
        message: `Model '${model.name}' skipped: no catalog columns found (schema generation needs column types).`,
        modelName: model.name,
      })
      skipped.add(model.uniqueId)
      continue
    }
    candidates.push(model)
  }
  return { candidates, warnings, skipped }
}

// ---------------------------------------------------------------------------
// Phase 2 — shape derivation + collision detection
// ---------------------------------------------------------------------------

interface ShapeTracker {
  usedTableExports: Map<string, string>
  usedCubeNames: Map<string, string>
  usedCubeExports: Map<string, string>
  usedFileNames: Map<string, string>
}

function newShapeTracker(): ShapeTracker {
  return {
    usedTableExports: new Map(),
    usedCubeNames: new Map(),
    usedCubeExports: new Map(),
    usedFileNames: new Map(),
  }
}

function reserveShape(
  model: DbtModel,
  tableExport: string,
  cubeName: string,
  cubeExport: string,
  fileName: string,
  tracker: ShapeTracker,
): void {
  const reservations: Array<[string, string, Map<string, string>]> = [
    ['table export', tableExport, tracker.usedTableExports],
    ['cube name', cubeName, tracker.usedCubeNames],
    ['cube export', cubeExport, tracker.usedCubeExports],
    ['file name', fileName, tracker.usedFileNames],
  ]
  for (const [namespace, identifier, owners] of reservations) {
    const owner = owners.get(identifier)
    if (owner !== undefined && owner !== model.name) {
      throw new Error(
        `IDENTIFIER_COLLISION: models '${owner}' and '${model.name}' both map to ${namespace} '${identifier}'. Rename a model or adjust dbt aliases before regenerating.`,
      )
    }
    owners.set(identifier, model.name)
  }
}

// ---------------------------------------------------------------------------
// Phase 3 — per-model normalization
// ---------------------------------------------------------------------------

/** Read `meta.drizzle_cube` as a record, or `undefined`. */
function readDrizzleCubeMeta(meta: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  const cube = asRecord(getField(meta, 'drizzle_cube'))
  return cube
}

function getField(record: Record<string, unknown> | undefined, field: string): unknown {
  return record ? record[field] : undefined
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

/** Resolve PK columns from `meta.drizzle_cube.primary_key: true` on a column. */
function resolvePrimaryKeyColumns(model: DbtModel): Set<string> {
  const pkColumns = new Set<string>()
  for (const col of Object.values(model.columns)) {
    const cubeMeta = readDrizzleCubeMeta(col.meta)
    if (cubeMeta && getField(cubeMeta, 'primary_key') === true) {
      pkColumns.add(col.name)
    }
  }
  return pkColumns
}

/** The lowerCamel property name of the configured security column, if present. */
function securityPropertyNameFor(model: DbtModel, security: SecurityMode): string | undefined {
  if (security.kind !== 'filter') return undefined
  for (const col of Object.values(model.columns)) {
    if (col.name === security.columnName) return toCamelCase(col.name)
  }
  return undefined
}

function buildColumn(
  col: DbtColumn,
  isPk: boolean,
): { column: GeneratedColumn; mapping: { builder: string; dimensionType: 'string' | 'number' | 'time' | 'boolean' } } | null {
  const mapping = mapPostgresCatalogType(col.type)
  if (!mapping) return null
  const propertyName = sanitizeIdentifier(toCamelCase(col.name))
  const column: GeneratedColumn = {
    sqlName: col.name,
    propertyName,
    title: humanizeTitle(col.name),
    ...(col.description ? { description: col.description } : {}),
    builder: mapping.builder,
    ...(mapping.builderArgs ? { builderArgs: mapping.builderArgs } : {}),
    dimensionType: mapping.dimensionType,
    primaryKey: isPk,
    notNull: isPk,
  }
  return { column, mapping }
}

/** First non-security column property name, for the no-PK baseline `count`. */
function firstNonSecurityColumn(
  columns: GeneratedColumn[],
  securityPropertyName: string | undefined,
): string | undefined {
  const found = columns.find((c) => c.propertyName !== securityPropertyName)
  return found?.propertyName
}

/**
 * Baseline measure: ≥1 PK → `countDistinct` (single PK → the PK column;
 * composite → a `concat_ws` expression). No PK → plain `count` over a stable
 * non-security column.
 */
function buildBaselineMeasure(
  pkColumns: GeneratedColumn[],
  columns: GeneratedColumn[],
  securityPropertyName: string | undefined,
): GeneratedMeasure {
  if (pkColumns.length === 0) {
    const fallback = firstNonSecurityColumn(columns, securityPropertyName)
    return {
      name: 'count',
      title: 'Count',
      type: 'count',
      ...(fallback ? { sql: fallback } : {}),
    }
  }
  if (pkColumns.length === 1) {
    return {
      name: 'count',
      title: 'Count',
      type: 'countDistinct',
      sql: pkColumns[0].propertyName,
    }
  }
  // Composite PK — encoded concat_ws expression consumed by the cube emitter.
  const props = pkColumns.map((c) => c.propertyName)
  return {
    name: 'count',
    title: 'Count',
    type: 'countDistinct',
    compositeSql: `concat_ws:${props.join(',')}`,
  }
}

function parseExplicitMeasures(
  model: DbtModel,
  columns: GeneratedColumn[],
): { measures: GeneratedMeasure[]; warnings: GeneratorWarning[] } {
  const cubeMeta = readDrizzleCubeMeta(model.meta)
  const rawMeasures = asRecordArray(getField(cubeMeta, 'measures'))
  if (rawMeasures.length === 0) return { measures: [], warnings: [] }

  const measures: GeneratedMeasure[] = []
  const warnings: GeneratorWarning[] = []
  const seenNames = new Set<string>()
  const columnByProperty = new Map(columns.map((c) => [c.propertyName, c]))
  const columnBySqlName = new Map(columns.map((c) => [c.sqlName, c]))

  for (const raw of rawMeasures) {
    const meta = asMeasureMeta(raw)
    if (!meta || !meta.name || !meta.type) {
      warnings.push({
        code: 'MEASURE_SKIPPED',
        message: `Explicit measure skipped on model '${model.name}': missing 'name' or 'type'.`,
        modelName: model.name,
      })
      continue
    }
    if (!EMITTABLE_MEASURE_TYPES.has(meta.type)) {
      warnings.push({
        code: 'MEASURE_SKIPPED',
        message: `Explicit measure '${meta.name}' skipped on model '${model.name}': unsupported type '${meta.type}'.`,
        modelName: model.name,
      })
      continue
    }
    if (seenNames.has(meta.name)) {
      warnings.push({
        code: 'MEASURE_SKIPPED',
        message: `Explicit measure '${meta.name}' skipped on model '${model.name}': duplicate name.`,
        modelName: model.name,
      })
      continue
    }

    let sqlProperty: string | undefined
    if (meta.column) {
      const col = columnBySqlName.get(meta.column) ?? columnByProperty.get(meta.column)
      if (!col) {
        warnings.push({
          code: 'MEASURE_SKIPPED',
          message: `Explicit measure '${meta.name}' skipped on model '${model.name}': referenced column '${meta.column}' not found.`,
          modelName: model.name,
          columnName: meta.column,
        })
        continue
      }
      if (NUMERIC_AGGREGATE_TYPES.has(meta.type) && col.dimensionType !== 'number') {
        warnings.push({
          code: 'MEASURE_SKIPPED',
          message: `Explicit measure '${meta.name}' skipped on model '${model.name}': aggregate '${meta.type}' requires a numeric column, but '${meta.column}' is '${col.dimensionType}'.`,
          modelName: model.name,
          columnName: meta.column,
        })
        continue
      }
      sqlProperty = col.propertyName
    } else if (meta.sql) {
      sqlProperty = meta.sql
    }

    seenNames.add(meta.name)
    measures.push({
      name: meta.name,
      title: humanizeTitle(meta.name),
      type: meta.type,
      ...(sqlProperty ? { sql: sqlProperty } : {}),
      ...(meta.description ? { description: meta.description } : {}),
      ...(meta.format ? { format: meta.format } : {}),
    })
  }

  return { measures, warnings }
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null))
    .filter((v): v is Record<string, unknown> => v !== null)
}

function asMeasureMeta(value: Record<string, unknown>): MeasureMeta | null {
  if (typeof value.name !== 'string' && typeof value.name !== 'undefined') return null
  if (typeof value.type !== 'string' && typeof value.type !== 'undefined') return null
  return {
    name: typeof value.name === 'string' ? value.name : undefined,
    type: typeof value.type === 'string' ? value.type : undefined,
    column: typeof value.column === 'string' ? value.column : undefined,
    sql: typeof value.sql === 'string' ? value.sql : undefined,
    format: typeof value.format === 'string' ? value.format : undefined,
    description: typeof value.description === 'string' ? value.description : undefined,
  }
}

// ---------------------------------------------------------------------------
// Phase 4 — relationships
// ---------------------------------------------------------------------------

function buildRelationships(
  model: GeneratedModel,
  allModels: Map<string, GeneratedModel>,
  relationships: DbtRelationshipTest[],
  skipped: Set<string>,
): { relationships: GeneratedRelationship[]; warnings: GeneratorWarning[] } {
  const warnings: GeneratorWarning[] = []
  const edges = new Map<string, GeneratedRelationship>()
  const sourceColumnsBySqlName = new Map(model.columns.map((c) => [c.sqlName, c]))

  for (const rel of relationships) {
    if (rel.sourceModelId !== model.dbtUniqueId) continue

    const targetModel = allModels.get(rel.targetModelId)
    if (skipped.has(rel.targetModelId) || !targetModel) {
      warnings.push({
        code: 'RELATIONSHIP_DROPPED',
        message: `Relationship from '${model.modelName}.${rel.sourceColumn}' dropped: target model '${rel.targetModelId}' was skipped.`,
        modelName: model.modelName,
        columnName: rel.sourceColumn,
      })
      continue
    }

    const sourceCol = sourceColumnsBySqlName.get(rel.sourceColumn)
    const targetCol = targetModel.columns.find((c) => c.sqlName === rel.targetColumn)
    if (!sourceCol || !targetCol) {
      warnings.push({
        code: 'RELATIONSHIP_DROPPED',
        message: `Relationship from '${model.modelName}.${rel.sourceColumn}' dropped: ${!sourceCol ? 'source' : 'target'} column '${!sourceCol ? rel.sourceColumn : rel.targetColumn}' was skipped.`,
        modelName: model.modelName,
        columnName: rel.sourceColumn,
      })
      continue
    }

    const key = `${targetModel.cubeName}|${rel.sourceColumn}|${rel.targetColumn}`
    edges.set(key, {
      sourceCube: model.cubeName,
      targetCube: targetModel.cubeName,
      relationship: 'belongsTo',
      on: [{ sourceColumn: sourceCol.propertyName, targetColumn: targetCol.propertyName }],
    })
  }

  const sorted = Array.from(edges.values()).sort((a, b) =>
    a.targetCube.localeCompare(b.targetCube),
  )
  return { relationships: sorted, warnings }
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

function normalizeOne(
  model: DbtModel,
  tracker: ShapeTracker,
  security: SecurityMode,
): { model: GeneratedModel; warnings: GeneratorWarning[] } | { skipped: true; warnings: GeneratorWarning[] } {
  const warnings: GeneratorWarning[] = []

  const tableExport = toPascalCase(model.name)
  const cubeName = toPascalCase(model.name)
  const cubeExport = `${toCamelCase(model.name)}Cube`
  const fileName = toKebabCase(model.name)
  reserveShape(model, tableExport, cubeName, cubeExport, fileName, tracker)

  const pkSqlNames = resolvePrimaryKeyColumns(model)
  const columns: GeneratedColumn[] = []
  const droppedPkSqlNames = new Set<string>()
  const skippedColumnSqlNames = new Set<string>()

  for (const col of Object.values(model.columns).sort((a, b) => {
    if (a.index !== b.index) return a.index - b.index
    return a.name.localeCompare(b.name)
  })) {
    const isPk = pkSqlNames.has(col.name)
    const built = buildColumn(col, isPk)
    if (!built) {
      warnings.push({
        code: 'COLUMN_SKIPPED',
        message: `Column '${col.name}' skipped on model '${model.name}': unsupported type '${col.type}'.`,
        modelName: model.name,
        columnName: col.name,
      })
      skippedColumnSqlNames.add(col.name)
      if (isPk) droppedPkSqlNames.add(col.name)
      continue
    }
    columns.push(built.column)
  }

  // Security cascade: configured filter column must exist + not be skipped.
  if (security.kind === 'filter') {
    const hasColumn = Object.values(model.columns).some((c) => c.name === security.columnName)
    if (!hasColumn || skippedColumnSqlNames.has(security.columnName)) {
      const reason = skippedColumnSqlNames.has(security.columnName)
        ? `security column '${security.columnName}' was skipped (unsupported type)`
        : `security column '${security.columnName}' not found`
      warnings.push({
        code: 'MODEL_SKIPPED',
        message: `Model '${model.name}' skipped: ${reason}. Cannot emit a model without row-level filtering when filter security is configured.`,
        modelName: model.name,
        columnName: security.columnName,
      })
      return { skipped: true, warnings }
    }
  }

  const securityPropertyName = securityPropertyNameFor(model, security)
  const pkColumns = columns.filter(
    (c) => pkSqlNames.has(c.sqlName) && !droppedPkSqlNames.has(c.sqlName),
  )
  const baseline = buildBaselineMeasure(pkColumns, columns, securityPropertyName)
  const explicit = parseExplicitMeasures(model, columns)
  warnings.push(...explicit.warnings)
  const measures = [baseline, ...explicit.measures].sort((a, b) => a.name.localeCompare(b.name))

  const generated: GeneratedModel = {
    dbtUniqueId: model.uniqueId,
    modelName: model.name,
    relationName: model.relationName,
    materialization: model.materialization,
    tableExport,
    cubeName,
    cubeExport,
    fileName,
    title: humanizeTitle(model.name),
    ...(model.description ? { description: model.description } : {}),
    columns,
    measures,
    relationships: [],
    ...(securityPropertyName ? { securityPropertyName } : {}),
  }
  return { model: generated, warnings }
}

export function normalizeDbtArtifacts(
  artifacts: ParsedDbtArtifacts,
  options: NormalizeOptions,
): NormalizeResult {
  const allWarnings: GeneratorWarning[] = []
  const { candidates, warnings: filterWarnings, skipped } = filterModels(artifacts.models)
  allWarnings.push(...filterWarnings)

  const tracker = newShapeTracker()
  const generated: GeneratedModel[] = []
  const keptByUniqueId = new Map<string, DbtModel>()

  for (const model of candidates) {
    const result = normalizeOne(model, tracker, options.security)
    allWarnings.push(...result.warnings)
    if ('skipped' in result) {
      skipped.add(model.uniqueId)
      continue
    }
    generated.push(result.model)
    keptByUniqueId.set(model.uniqueId, model)
  }

  // Phase 4 — relationships, only between kept models + kept columns.
  const allModelsByUniqueId = new Map(generated.map((m) => [m.dbtUniqueId, m]))
  for (const gm of generated) {
    const sourceModel = keptByUniqueId.get(gm.dbtUniqueId)
    if (!sourceModel) continue
    const { relationships, warnings } = buildRelationships(
      gm,
      allModelsByUniqueId,
      artifacts.relationships,
      skipped,
    )
    gm.relationships = relationships
    allWarnings.push(...warnings)
  }

  generated.sort((a, b) => a.fileName.localeCompare(b.fileName))
  return { models: generated, warnings: allWarnings }
}
