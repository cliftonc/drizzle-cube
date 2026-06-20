import type { MeasureType } from '../../server/types/core.js'
import { humanizeTitle, makeUniqueIdentifier, toCamelCase, toKebabCase, toPascalCase } from './naming.js'
import { mapPostgresCatalogType } from './postgres-types.js'
import type { CatalogColumn, DbtModel, GeneratedColumn, GeneratedMeasure, GeneratedModel, GeneratorWarning, ParsedDbtArtifacts, SecurityMode, SupportedMaterialization } from './types.js'

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

function isPrimaryKey(model: DbtModel, column: string): boolean {
  const dbtColumn = model.columns.find((candidate) => candidate.name === column)
  const tests = model.testsByColumn[column] ?? dbtColumn?.tests ?? []
  return hasPrimaryKeyMeta(dbtColumn?.meta) || (tests.includes('unique') && tests.includes('not_null'))
}

function catalogByName(columns: CatalogColumn[]): Map<string, CatalogColumn> {
  return new Map(columns.map((column, index) => [column.name, { ...column, index: column.index ?? index }]))
}

function isMeasureType(value: string): value is MeasureType {
  return MEASURE_TYPES.has(value)
}

function explicitMeasures(model: DbtModel, columns: GeneratedColumn[], warnings: GeneratorWarning[]): GeneratedMeasure[] {
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
    result.push({ name: toCamelCase(raw.name), title: typeof raw.title === 'string' ? raw.title : humanizeTitle(raw.name), description: typeof raw.description === 'string' ? raw.description : undefined, type: raw.type, columnName })
  }

  for (const column of columns) {
    const dbtColumn = model.columns.find((candidate) => candidate.name === column.sqlName)
    const raw = drizzleCubeMeta(dbtColumn?.meta)?.measure
    if (!isRecord(raw) || typeof raw.name !== 'string' || typeof raw.type !== 'string' || !isMeasureType(raw.type)) continue
    result.push({ name: toCamelCase(raw.name), title: typeof raw.title === 'string' ? raw.title : humanizeTitle(raw.name), type: raw.type, columnName: column.sqlName })
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
      description: manifestColumn?.description ?? catalogColumn.comment,
      builder: mapped.builder,
      dimensionType: mapped.dimensionType,
      primaryKey: isPrimaryKey(model, catalogColumn.name),
      notNull: (model.testsByColumn[catalogColumn.name] ?? manifestColumn?.tests ?? []).includes('not_null'),
      catalogIndex: catalogColumn.index ?? result.length
    })
  }
  return result.sort((left, right) => left.catalogIndex - right.catalogIndex)
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
  const cubeName = toPascalCase(model.name)
  return {
    uniqueId: model.uniqueId,
    dbtName: model.name,
    relationName: model.alias,
    tableExportName: makeUniqueIdentifier(model.name, new Set(), 'model').identifier,
    cubeName,
    cubeExportName: `${cubeName}Cube`,
    fileName: toKebabCase(model.name),
    title: humanizeTitle(model.name),
    description: model.description,
    columns,
    measures: explicitMeasures(model, columns, warnings),
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
  for (const relationship of artifacts.relationships) {
    const source = byId.get(relationship.sourceModelId)
    const target = byId.get(relationship.targetModelId)
    const sourceColumn = source?.columns.find((column) => column.sqlName === relationship.sourceColumn)
    const targetColumn = target?.columns.find((column) => column.sqlName === relationship.targetColumn)
    if (!source || !target || !sourceColumn || !targetColumn) {
      warnings.push({ code: 'relationship_dropped', message: 'Skipping relationship because source/target model or column was skipped.' })
      continue
    }
    source.relationships.push({ name: toCamelCase(target.dbtName), sourceColumnName: sourceColumn.propertyName, targetCubeName: target.cubeName, targetTableExportName: target.tableExportName, targetColumnName: targetColumn.propertyName })
  }
}

export function normalizeDbtArtifacts(artifacts: ParsedDbtArtifacts, options: { security: SecurityMode }): { models: GeneratedModel[]; warnings: GeneratorWarning[] } {
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
