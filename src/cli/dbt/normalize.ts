import type { MeasureType } from '../../server/types/core.js'
import { humanizeTitle, isIdentifier, makeUniqueIdentifier, toKebabCase, toPascalCase } from './naming.js'
import { mapPostgresCatalogType } from './postgres-types.js'
import type { CatalogColumn, DbtModel, DbtRelationshipTest, GeneratedColumn, GeneratedMeasure, GeneratedModel, GeneratorWarning, ParsedDbtArtifacts, SecurityMode, SupportedMaterialization } from './types.js'

const MATERIALIZATIONS = new Set<string>(['table', 'view', 'incremental'])
const MEASURE_TYPES = new Set<string>(['count', 'countDistinct', 'countDistinctApprox', 'sum', 'avg', 'min', 'max', 'runningTotal', 'number', 'calculated', 'stddev', 'stddevSamp', 'variance', 'varianceSamp', 'percentile', 'median', 'p95', 'p99', 'lag', 'lead', 'rank', 'denseRank', 'rowNumber', 'ntile', 'firstValue', 'lastValue', 'movingAvg', 'movingSum'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function drizzleCubeMeta(meta: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  const nested = meta?.drizzle_cube
  return isRecord(nested) ? nested : undefined
}

function hasPrimaryKeyMeta(meta: Record<string, unknown> | undefined): boolean {
  return drizzleCubeMeta(meta)?.primary_key === true
}

function columnTests(model: DbtModel, column: string): string[] {
  return model.testsByColumn[column] ?? model.columns.find((candidate) => candidate.name === column)?.tests ?? []
}

function catalogByName(columns: CatalogColumn[]): Map<string, CatalogColumn> {
  return new Map(columns.map((column, index) => [column.name, { ...column, index: column.index ?? index }]))
}

function isMeasureType(value: string): value is MeasureType {
  return MEASURE_TYPES.has(value)
}

function uniqueName(raw: string, used: Set<string>, kind: string, model: DbtModel, warnings: GeneratorWarning[]): string {
  const result = makeUniqueIdentifier(raw, used, kind)
  if (result.warning) warnings.push({ ...result.warning, modelName: model.name })
  used.add(result.identifier)
  return result.identifier
}

// Measure names share the cube's field namespace with dimensions, so they are
// made unique against the dimension names as well as each other.
function explicitMeasures(model: DbtModel, columns: GeneratedColumn[], usedNames: Set<string>, warnings: GeneratorWarning[]): GeneratedMeasure[] {
  const result: GeneratedMeasure[] = []
  const modelMeta = drizzleCubeMeta(model.meta)
  const rawMeasures = Array.isArray(modelMeta?.measures) ? modelMeta.measures : []
  const columnNames = new Set(columns.map((column) => column.sqlName))

  for (const raw of rawMeasures) {
    if (!isRecord(raw) || typeof raw.name !== 'string' || typeof raw.type !== 'string' || !isMeasureType(raw.type)) {
      warnings.push({ code: 'invalid_measure', message: 'Skipping invalid dbt drizzle_cube measure metadata.', modelName: model.name })
      continue
    }
    const columnName = typeof raw.column === 'string' ? raw.column : undefined
    if (columnName && !columnNames.has(columnName)) {
      warnings.push({ code: 'invalid_measure_column', message: `Skipping measure '${raw.name}' because column '${columnName}' was not emitted.`, modelName: model.name, columnName })
      continue
    }
    result.push({ name: uniqueName(raw.name, usedNames, 'measure', model, warnings), title: typeof raw.title === 'string' ? raw.title : humanizeTitle(raw.name), description: typeof raw.description === 'string' ? raw.description : undefined, type: raw.type, columnName })
  }

  for (const column of columns) {
    const dbtColumn = model.columns.find((candidate) => candidate.name === column.sqlName)
    const raw = drizzleCubeMeta(dbtColumn?.meta)?.measure
    if (!isRecord(raw) || typeof raw.name !== 'string' || typeof raw.type !== 'string' || !isMeasureType(raw.type)) continue
    result.push({ name: uniqueName(raw.name, usedNames, 'measure', model, warnings), title: typeof raw.title === 'string' ? raw.title : humanizeTitle(raw.name), type: raw.type, columnName: column.sqlName })
  }

  return result
}

function buildColumns(model: DbtModel, catalogColumns: CatalogColumn[], warnings: GeneratorWarning[]): GeneratedColumn[] {
  const result: GeneratedColumn[] = []
  const usedProps = new Set<string>()
  const usedDims = new Set<string>()
  const manifestByName = new Map(model.columns.map((column) => [column.name, column]))

  for (const catalogColumn of catalogByName(catalogColumns).values()) {
    const mapped = mapPostgresCatalogType(catalogColumn.type)
    if (!mapped) {
      warnings.push({ code: 'unsupported_column_type', message: `Skipping column '${catalogColumn.name}' with unsupported Postgres type '${catalogColumn.type}'.`, modelName: model.name, columnName: catalogColumn.name })
      continue
    }
    const prop = makeUniqueIdentifier(catalogColumn.name, usedProps, 'column')
    const dim = makeUniqueIdentifier(catalogColumn.name, usedDims, 'dimension')
    if (prop.warning) warnings.push({ ...prop.warning, modelName: model.name, columnName: catalogColumn.name })
    if (dim.warning) warnings.push({ ...dim.warning, modelName: model.name, columnName: catalogColumn.name })
    usedProps.add(prop.identifier)
    usedDims.add(dim.identifier)
    const manifestColumn = manifestByName.get(catalogColumn.name)
    result.push({
      sqlName: catalogColumn.name,
      propertyName: prop.identifier,
      dimensionName: dim.identifier,
      title: humanizeTitle(catalogColumn.name),
      description: manifestColumn?.description || catalogColumn.comment,
      builder: mapped.builder,
      withTimezone: mapped.withTimezone === true,
      dimensionType: mapped.dimensionType,
      primaryKey: false,
      notNull: columnTests(model, catalogColumn.name).includes('not_null'),
      catalogIndex: catalogColumn.index ?? result.length
    })
  }
  return result.sort((left, right) => left.catalogIndex - right.catalogIndex)
}

// A declared key (meta.drizzle_cube.primary_key columns, a primary_key
// constraint, or a unique_combination_of_columns test) is emitted whole or not
// at all — a partial composite key would make the count measure wrong. Without
// one, a single unique + not_null column is the key.
function markPrimaryKey(model: DbtModel, columns: GeneratedColumn[], warnings: GeneratorWarning[]): void {
  const metaKey = model.columns.filter((column) => hasPrimaryKeyMeta(column.meta)).map((column) => column.name)
  const declared = metaKey.length > 0 ? metaKey : model.primaryKeyColumns
  let key: string[]
  if (declared.length > 0) {
    const emitted = new Set(columns.map((column) => column.sqlName))
    const missing = declared.filter((name) => !emitted.has(name))
    if (missing.length > 0) {
      warnings.push({ code: 'primary_key_column_skipped', message: `Emitting no primary key for model '${model.name}' because key column(s) ${missing.join(', ')} were not emitted.`, modelName: model.name })
      return
    }
    key = declared
  } else {
    const candidates = columns
      .filter((column) => {
        const tests = columnTests(model, column.sqlName)
        return tests.includes('unique') && tests.includes('not_null')
      })
      .map((column) => column.sqlName)
    if (candidates.length > 1) {
      warnings.push({ code: 'ambiguous_primary_key', message: `Model '${model.name}' has several unique, not-null columns (${candidates.join(', ')}); using '${candidates[0]}' as the primary key. Set meta.drizzle_cube.primary_key on a column to choose another.`, modelName: model.name })
    }
    key = candidates.slice(0, 1)
  }
  for (const column of columns) column.primaryKey = key.includes(column.sqlName)
}

function buildModel(model: DbtModel, artifacts: ParsedDbtArtifacts, security: SecurityMode, warnings: GeneratorWarning[]): GeneratedModel | null {
  const materialized = model.materialized
  if (!materialized || !MATERIALIZATIONS.has(materialized)) {
    warnings.push({ code: 'unsupported_materialization', message: `Skipping model '${model.name}' with unsupported materialization '${materialized ?? 'unknown'}'.`, modelName: model.name })
    return null
  }
  const catalog = artifacts.catalogNodes.get(model.uniqueId)
  if (!catalog) {
    warnings.push({ code: 'missing_catalog', message: `Skipping model '${model.name}' because catalog metadata is missing.`, modelName: model.name })
    return null
  }
  const columns = buildColumns(model, catalog.columns, warnings)
  if (columns.length === 0) {
    warnings.push({ code: 'no_supported_columns', message: `Skipping model '${model.name}' because no supported columns were emitted.`, modelName: model.name })
    return null
  }
  if (security.kind === 'filter' && !columns.some((column) => column.sqlName === security.columnName)) {
    warnings.push({ code: 'missing_security_column', message: `Skipping model '${model.name}' because security column '${security.columnName}' was not emitted.`, modelName: model.name, columnName: security.columnName })
    return null
  }
  markPrimaryKey(model, columns, warnings)
  const usedFieldNames = new Set(columns.map((column) => column.dimensionName))
  const countMeasureName = uniqueName('count', usedFieldNames, 'measure', model, warnings)
  const cubeName = toPascalCase(model.name)
  return {
    uniqueId: model.uniqueId,
    dbtName: model.name,
    relationName: model.alias,
    schemaName: model.schema && model.schema !== 'public' ? model.schema : undefined,
    tableExportName: makeUniqueIdentifier(model.name, new Set(), 'model').identifier,
    cubeName,
    cubeExportName: `${cubeName}Cube`,
    fileName: toKebabCase(model.name),
    title: humanizeTitle(model.name),
    description: model.description || undefined,
    columns,
    countMeasureName,
    measures: explicitMeasures(model, columns, usedFieldNames, warnings),
    relationships: [],
    security
  }
}

function assertNoModelIdentifierCollisions(models: GeneratedModel[]): void {
  const identifiers = [
    { label: 'table export', getValue: (model: GeneratedModel) => model.tableExportName },
    { label: 'cube name', getValue: (model: GeneratedModel) => model.cubeName },
    { label: 'cube export', getValue: (model: GeneratedModel) => model.cubeExportName },
    { label: 'file name', getValue: (model: GeneratedModel) => model.fileName }
  ]

  for (const identifier of identifiers) {
    const used = new Map<string, string>()
    for (const model of models) {
      const value = identifier.getValue(model)
      const existing = used.get(value)
      if (existing) {
        throw new Error(`Generated ${identifier.label} identifier '${value}' collides for dbt models '${existing}' and '${model.dbtName}'. Rename one model or alias before generating.`)
      }
      used.set(value, model.dbtName)
    }
  }
}

function addRelationships(models: GeneratedModel[], artifacts: ParsedDbtArtifacts, warnings: GeneratorWarning[]): void {
  const byId = new Map(models.map((model) => [model.uniqueId, model]))
  const resolved: Array<{ relationship: DbtRelationshipTest; source: GeneratedModel; target: GeneratedModel; sourceColumn: GeneratedColumn; targetColumn: GeneratedColumn }> = []
  for (const relationship of artifacts.relationships) {
    const source = byId.get(relationship.sourceModelId)
    const target = byId.get(relationship.targetModelId)
    const sourceColumn = source?.columns.find((column) => column.sqlName === relationship.sourceColumn)
    const targetColumn = target?.columns.find((column) => column.sqlName === relationship.targetColumn)
    if (!source || !target || !sourceColumn || !targetColumn) {
      warnings.push({ code: 'relationship_dropped', message: `Skipping relationship '${relationship.testId}' because its source/target model or column was skipped.` })
      continue
    }
    if (source === target) {
      warnings.push({ code: 'self_relationship_unsupported', message: `Skipping relationship '${relationship.testId}' because self-joins are not supported.`, modelName: source.dbtName, columnName: relationship.sourceColumn })
      continue
    }
    resolved.push({ relationship, source, target, sourceColumn, targetColumn })
  }

  // The join planner picks the first join it finds between two cubes and has
  // no way to choose another, so a second foreign key to the same target
  // (billing vs referring customer) would be emitted but never used. Keep the
  // first by column order and warn about the rest.
  resolved.sort((left, right) => left.source.fileName.localeCompare(right.source.fileName) || left.sourceColumn.catalogIndex - right.sourceColumn.catalogIndex)
  const usedNames = new Map<GeneratedModel, Set<string>>()
  const joined = new Map<GeneratedModel, Map<GeneratedModel, string>>()
  for (const { relationship, source, target, sourceColumn, targetColumn } of resolved) {
    const targets = joined.get(source) ?? new Map<GeneratedModel, string>()
    joined.set(source, targets)
    const keptColumn = targets.get(target)
    if (keptColumn) {
      warnings.push({ code: 'duplicate_target_relationship', message: `Skipping relationship '${relationship.testId}' because '${source.dbtName}' already joins '${target.dbtName}' on '${keptColumn}'; only one join between two cubes is used.`, modelName: source.dbtName, columnName: relationship.sourceColumn })
      continue
    }
    targets.set(target, relationship.sourceColumn)
    const used = usedNames.get(source) ?? new Set<string>()
    usedNames.set(source, used)
    const name = makeUniqueIdentifier(target.dbtName, used, 'join')
    if (name.warning) warnings.push({ ...name.warning, modelName: source.dbtName })
    used.add(name.identifier)
    source.relationships.push({ name: name.identifier, sourceColumnName: sourceColumn.propertyName, targetCubeName: target.cubeName, targetTableExportName: target.tableExportName, targetColumnName: targetColumn.propertyName })
  }
}

export function normalizeDbtArtifacts(artifacts: ParsedDbtArtifacts, options: { security: SecurityMode }): { models: GeneratedModel[]; warnings: GeneratorWarning[] } {
  // The context property is emitted as `ctx.securityContext.<property>`.
  if (options.security.kind === 'filter' && !isIdentifier(options.security.contextProperty)) {
    throw new Error(`Security context property '${options.security.contextProperty}' must be a plain identifier such as organisationId.`)
  }
  const warnings = [...artifacts.warnings]
  const models = artifacts.models
    .map((model) => buildModel(model, artifacts, options.security, warnings))
    .filter((model): model is GeneratedModel => model !== null)
  assertNoModelIdentifierCollisions(models)
  models.sort((left, right) => left.fileName.localeCompare(right.fileName))
  addRelationships(models, artifacts, warnings)
  return { models, warnings }
}

export type { SupportedMaterialization }
