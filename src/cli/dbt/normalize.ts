/**
 * Build the generator IR (`GeneratedModel[]` + warnings) from parsed dbt
 * artifacts. This module owns every policy decision:
 *
 *  - materialization filter: only `table` / `view` / `incremental` /
 *    `materialized_view` become cubes; `ephemeral` is skipped silently; any
 *    other materialization is skipped with a warning.
 *  - column source of truth is the CATALOG (the real physical relation);
 *    manifest columns only enrich descriptions/meta.
 *  - unsupported catalog type OR missing configured security column => skip the
 *    whole model with a warning (maintainer's failure policy).
 *  - skip-cascade: a `belongsTo` join whose target model was skipped is dropped
 *    with a warning, so every emitted string `targetCube` stays resolvable.
 *  - PK detection: a column with both `unique` + `not_null` tests, or
 *    `meta.drizzle_cube.primary_key`, is the primary key; otherwise none.
 *  - measures: baseline `count` (countDistinct over the PK when known), plus
 *    only measures explicitly declared in `meta.drizzle_cube.measures`.
 */

import type { ParsedManifest, ParsedCatalog, DbtModelNode } from './parse-artifacts.js'
import { mapPostgresType } from './postgres-types.js'
import { toCamelCase, toPascalCase, toTitleCase, toCubeVar, toFileName } from './naming.js'
import type {
  GeneratedColumn,
  GeneratedMeasure,
  GeneratedMeasureType,
  GeneratedModel,
  GeneratedRelationship,
  NormalizeResult,
  SecurityConfig
} from './types.js'

export interface NormalizeOptions {
  security: SecurityConfig | null
}

const MATERIALIZED_RELATIONS = new Set(['table', 'view', 'incremental', 'materialized_view'])

const ALLOWED_MEASURE_TYPES = new Set<GeneratedMeasureType>([
  'count',
  'countDistinct',
  'sum',
  'avg',
  'min',
  'max'
])

interface DrizzleCubeMeta {
  cube_name?: string
  table?: string
  property?: string
  primary_key?: boolean
  measures?: unknown
}

function drizzleCubeMeta(meta: Record<string, unknown>): DrizzleCubeMeta {
  const dc = meta.drizzle_cube
  if (typeof dc === 'object' && dc !== null && !Array.isArray(dc)) {
    return dc as DrizzleCubeMeta
  }
  return {}
}

/** Per-column test flags collected from the manifest. */
interface ColumnTestFlags {
  unique: boolean
  notNull: boolean
}

function collectColumnTests(
  manifest: ParsedManifest
): Map<string, Map<string, ColumnTestFlags>> {
  const byModel = new Map<string, Map<string, ColumnTestFlags>>()
  for (const test of manifest.tests) {
    if (test.testName === 'relationships') continue
    let cols = byModel.get(test.modelUid)
    if (!cols) {
      cols = new Map()
      byModel.set(test.modelUid, cols)
    }
    const flags = cols.get(test.columnName) ?? { unique: false, notNull: false }
    if (test.testName === 'unique') flags.unique = true
    if (test.testName === 'not_null') flags.notNull = true
    cols.set(test.columnName, flags)
  }
  return byModel
}

function resolveCubeName(model: DbtModelNode): string {
  const meta = drizzleCubeMeta(model.meta)
  return meta.cube_name || toPascalCase(model.relationName)
}

function resolveTableExport(model: DbtModelNode): string {
  const meta = drizzleCubeMeta(model.meta)
  return meta.table || toCamelCase(model.relationName)
}

function resolveColumnProp(model: DbtModelNode, dbName: string): string {
  const manifestCol = model.columns[dbName]
  if (manifestCol) {
    const meta = drizzleCubeMeta(manifestCol.meta)
    if (meta.property) return meta.property
  }
  return toCamelCase(dbName)
}

/**
 * Decide whether a model should become a cube. Returns either inclusion, a
 * silent skip (ephemeral), or a skip with a warning message.
 */
function selectModel(
  model: DbtModelNode,
  catalog: ParsedCatalog,
  security: SecurityConfig | null
): { include: true } | { include: false; warning?: string } {
  if (!MATERIALIZED_RELATIONS.has(model.materialized)) {
    // Ephemeral is an expected, silent skip; anything else is worth a warning.
    if (model.materialized === 'ephemeral') return { include: false }
    return {
      include: false,
      warning: `Skipped model '${model.name}': unsupported materialization '${model.materialized || '(none)'}'.`
    }
  }

  const catalogColumns = catalog.columnsByModel[model.uniqueId]
  if (!catalogColumns || Object.keys(catalogColumns).length === 0) {
    return {
      include: false,
      warning: `Skipped model '${model.name}': no catalog entry (run dbt docs generate to produce catalog.json).`
    }
  }

  for (const [colName, catalogType] of Object.entries(catalogColumns)) {
    if (!mapPostgresType(catalogType)) {
      return {
        include: false,
        warning: `Skipped model '${model.name}': unsupported Postgres type '${catalogType}' on column '${colName}'.`
      }
    }
  }

  if (security && !(security.column in catalogColumns)) {
    return {
      include: false,
      warning: `Skipped model '${model.name}': missing security column '${security.column}'.`
    }
  }

  return { include: true }
}

export function normalize(
  manifest: ParsedManifest,
  catalog: ParsedCatalog,
  options: NormalizeOptions
): NormalizeResult {
  const warnings: string[] = []
  const testsByModel = collectColumnTests(manifest)

  // Pass A: decide which models are included (sorted by unique_id for determinism).
  const included = new Map<string, DbtModelNode>()
  const skipped = new Set<string>()
  const sortedModels = [...manifest.models].sort((a, b) =>
    a.uniqueId < b.uniqueId ? -1 : a.uniqueId > b.uniqueId ? 1 : 0
  )

  for (const model of sortedModels) {
    const decision = selectModel(model, catalog, options.security)
    if (decision.include) {
      included.set(model.uniqueId, model)
    } else {
      if (decision.warning) warnings.push(decision.warning)
      skipped.add(model.uniqueId)
    }
  }

  // Pass B: build the IR for included models.
  const models: GeneratedModel[] = []
  for (const model of included.values()) {
    models.push(
      buildModel(model, catalog, testsByModel.get(model.uniqueId), manifest, included, skipped, warnings)
    )
  }

  // Deterministic final ordering by cube name.
  models.sort((a, b) => (a.cubeName < b.cubeName ? -1 : a.cubeName > b.cubeName ? 1 : 0))

  return { models, warnings, security: options.security }
}

function buildModel(
  model: DbtModelNode,
  catalog: ParsedCatalog,
  columnTests: Map<string, ColumnTestFlags> | undefined,
  manifest: ParsedManifest,
  included: Map<string, DbtModelNode>,
  skipped: Set<string>,
  warnings: string[]
): GeneratedModel {
  const catalogColumns = catalog.columnsByModel[model.uniqueId]
  const cubeName = resolveCubeName(model)
  const tableExport = resolveTableExport(model)

  // Detect a primary key column (db name) before building columns.
  const pkDbName = detectPrimaryKey(model, catalogColumns, columnTests)

  // Build columns from the catalog (the real relation), sorted by db name.
  const columns: GeneratedColumn[] = []
  for (const dbName of Object.keys(catalogColumns).sort()) {
    const catalogType = catalogColumns[dbName]
    const mapping = mapPostgresType(catalogType)! // guaranteed by pass A
    const tests = columnTests?.get(dbName)
    const isPk = dbName === pkDbName
    const manifestCol = model.columns[dbName]
    columns.push({
      dbName,
      propName: resolveColumnProp(model, dbName),
      catalogType,
      drizzleBuilder: mapping.drizzleBuilder,
      dimensionType: mapping.dimensionType,
      notNull: isPk || tests?.notNull === true,
      primaryKey: isPk,
      title: toTitleCase(dbName),
      description: manifestCol?.description
    })
  }

  const pkColumnProp = pkDbName ? resolveColumnProp(model, pkDbName) : undefined

  const measures = buildMeasures(model, columns, pkColumnProp, warnings)
  const relationships = buildRelationships(model, manifest, included, skipped, warnings)

  return {
    uid: model.uniqueId,
    relationName: model.relationName,
    tableExport,
    cubeName,
    cubeVar: toCubeVar(cubeName),
    fileName: toFileName(model.relationName),
    title: toTitleCase(model.relationName),
    description: model.description,
    columns,
    measures,
    relationships,
    pkColumnProp
  }
}

function detectPrimaryKey(
  model: DbtModelNode,
  catalogColumns: Record<string, string>,
  columnTests: Map<string, ColumnTestFlags> | undefined
): string | undefined {
  // Explicit meta.drizzle_cube.primary_key wins (first in sorted db order).
  for (const dbName of Object.keys(catalogColumns).sort()) {
    const manifestCol = model.columns[dbName]
    if (manifestCol && drizzleCubeMeta(manifestCol.meta).primary_key === true) {
      return dbName
    }
  }
  // Otherwise: a column with both unique + not_null tests.
  for (const dbName of Object.keys(catalogColumns).sort()) {
    const tests = columnTests?.get(dbName)
    if (tests?.unique && tests?.notNull) return dbName
  }
  return undefined
}

function buildMeasures(
  model: DbtModelNode,
  columns: GeneratedColumn[],
  pkColumnProp: string | undefined,
  warnings: string[]
): GeneratedMeasure[] {
  const measures: GeneratedMeasure[] = []

  // Baseline count.
  if (pkColumnProp) {
    measures.push({
      name: 'count',
      type: 'countDistinct',
      columnProp: pkColumnProp,
      title: 'Count'
    })
  } else {
    measures.push({ name: 'count', type: 'count', title: 'Count' })
  }

  // Explicit measures from model-level meta.drizzle_cube.measures.
  const declared = drizzleCubeMeta(model.meta).measures
  if (Array.isArray(declared)) {
    // Columns are referenceable by either property name or db name.
    const columnsByRef = new Map<string, GeneratedColumn>()
    for (const c of columns) {
      columnsByRef.set(c.propName, c)
      columnsByRef.set(c.dbName, c)
    }
    for (const raw of declared) {
      const m = parseDeclaredMeasure(raw, model.name, columnsByRef, warnings)
      if (m) measures.push(m)
    }
  }

  // count first, then declared measures sorted by name (deterministic).
  const [count, ...rest] = measures
  rest.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  return [count, ...rest]
}

function optStr(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined
}

/** Return an incompatibility message if `type` cannot aggregate `column`, else null. */
function measureColumnIssue(type: GeneratedMeasureType, column: GeneratedColumn): string | null {
  if ((type === 'sum' || type === 'avg') && column.dimensionType !== 'number') {
    return `needs a numeric column, got '${column.dimensionType}'`
  }
  if ((type === 'min' || type === 'max') && column.dimensionType !== 'number' && column.dimensionType !== 'time') {
    return `needs a number/time column, got '${column.dimensionType}'`
  }
  return null
}

function parseDeclaredMeasure(
  raw: unknown,
  modelName: string,
  columnsByRef: Map<string, GeneratedColumn>,
  warnings: string[]
): GeneratedMeasure | null {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>
  const name = optStr(r.name)
  const type = optStr(r.type) as GeneratedMeasureType | undefined
  const ignore = (reason: string) => {
    warnings.push(`Ignored measure ${name ? `'${name}' ` : ''}on model '${modelName}': ${reason}.`)
    return null
  }

  if (!name || !type) return ignore('missing name or type')
  if (!ALLOWED_MEASURE_TYPES.has(type)) return ignore(`unsupported type '${type}'`)

  const title = optStr(r.title) ?? toTitleCase(name)
  if (type === 'count') return { name, type, title }

  const columnRef = optStr(r.column)
  if (!columnRef) return ignore(`'${type}' requires a column`)
  const column = columnsByRef.get(columnRef)
  if (!column) return ignore(`unknown column '${columnRef}'`)

  const issue = measureColumnIssue(type, column)
  if (issue) return ignore(`'${type}' ${issue}`)

  return { name, type, columnProp: column.propName, title, description: optStr(r.description) }
}

function buildRelationships(
  model: DbtModelNode,
  manifest: ParsedManifest,
  included: Map<string, DbtModelNode>,
  skipped: Set<string>,
  warnings: string[]
): GeneratedRelationship[] {
  const relationships: GeneratedRelationship[] = []
  const seen = new Set<string>()

  for (const test of manifest.tests) {
    if (test.testName !== 'relationships') continue
    if (test.modelUid !== model.uniqueId) continue
    if (!test.toModelUid || !test.toField) continue

    const targetModel = included.get(test.toModelUid)
    if (!targetModel) {
      // skip-cascade: target was skipped (or never a model) -> drop the join.
      if (skipped.has(test.toModelUid)) {
        warnings.push(
          `Dropped join on '${model.name}': target model for column '${test.columnName}' was skipped.`
        )
      }
      continue
    }

    const targetCube = resolveCubeName(targetModel)
    if (seen.has(targetCube)) continue // one join per target cube
    seen.add(targetCube)

    relationships.push({
      targetCube,
      targetModelUid: test.toModelUid,
      sourceColumnProp: resolveColumnProp(model, test.columnName),
      targetColumnProp: resolveColumnProp(targetModel, test.toField)
    })
  }

  relationships.sort((a, b) => (a.targetCube < b.targetCube ? -1 : a.targetCube > b.targetCube ? 1 : 0))
  return relationships
}
