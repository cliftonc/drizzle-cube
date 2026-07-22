import { DbtGenerateError } from './errors.js'
import { humanizeName, makeUniqueName, toFileName, toPascalCase, toSafeIdentifier } from './naming.js'
import { getCatalogNode, getColumnTestNames, getModelNodes, getPrimaryKeyCandidates, getRelationshipTests, isMaterializedModel } from './parse-artifacts.js'
import { mapPostgresCatalogType } from './postgres-types.js'
import type { DbtCatalogColumn, DbtManifestColumn, ExplicitMeasureConfig, GeneratedColumn, GeneratedMeasure, GeneratedModel, GeneratorConfig, GeneratorWarning, SecurityConfig } from './types.js'

const validMeasureTypes = new Set([
  'count', 'countDistinct', 'countDistinctApprox', 'sum', 'avg', 'min', 'max', 'runningTotal', 'number', 'calculated',
  'stddev', 'stddevSamp', 'variance', 'varianceSamp', 'percentile', 'median', 'p95', 'p99',
  'lag', 'lead', 'rank', 'denseRank', 'rowNumber', 'ntile', 'firstValue', 'lastValue', 'movingAvg', 'movingSum',
])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function drizzleMeta(value: { meta?: Record<string, unknown> } | undefined): Record<string, unknown> {
  const meta = value?.meta?.drizzle_cube
  return isRecord(meta) ? meta : {}
}

function stringMeta(meta: Record<string, unknown>, key: string): string | undefined {
  return typeof meta[key] === 'string' ? meta[key] : undefined
}

function notNullFromColumn(column: DbtManifestColumn | undefined, attachedTestNames: string[], primaryKey: boolean): boolean {
  if (primaryKey) return true
  const tests = Array.isArray(column?.tests) ? column.tests : []
  return tests.some((test) => test === 'not_null' || (isRecord(test) && Object.prototype.hasOwnProperty.call(test, 'not_null')))
    || attachedTestNames.includes('not_null')
}

function sortedCatalogColumns(columns: Record<string, DbtCatalogColumn>): Array<[string, DbtCatalogColumn]> {
  return Object.entries(columns).sort(([nameA, columnA], [nameB, columnB]) => {
    const indexA = typeof columnA.index === 'number' ? columnA.index : Number.MAX_SAFE_INTEGER
    const indexB = typeof columnB.index === 'number' ? columnB.index : Number.MAX_SAFE_INTEGER
    return indexA - indexB || nameA.localeCompare(nameB)
  })
}

function toRelationName(nodeName: string, catalogName: unknown, alias: unknown): string {
  if (typeof catalogName === 'string') return catalogName
  if (typeof alias === 'string') return alias
  return nodeName
}

function readColumnMeasures(columnName: string, column: DbtManifestColumn | undefined): ExplicitMeasureConfig[] {
  const metaMeasures = drizzleMeta(column).measures
  return Array.isArray(metaMeasures)
    ? metaMeasures.map((measure) => ({ ...(measure as Record<string, unknown>), column: columnName })) as ExplicitMeasureConfig[]
    : []
}

function normalizeMeasure(measure: ExplicitMeasureConfig, columnsByDbName: Map<string, GeneratedColumn>): GeneratedMeasure {
  if (!validMeasureTypes.has(measure.type)) throw new DbtGenerateError(`Invalid measure type ${measure.type}.`)
  const column = measure.column ? columnsByDbName.get(measure.column) : undefined
  if (measure.column && !column) throw new DbtGenerateError(`Measure ${measure.name} references missing column ${measure.column}.`)
  return {
    name: measure.name,
    title: measure.title ?? humanizeName(measure.name),
    type: measure.type,
    columnPropertyName: column?.propertyName,
    description: measure.description,
    format: measure.format,
  }
}

export function normalizeDbtArtifacts(input: {
  artifacts: { manifest: import('./types.js').DbtManifest; catalog: import('./types.js').DbtCatalog }
  config: GeneratorConfig
  security: SecurityConfig
  dialect: 'postgres'
}): { models: GeneratedModel[]; warnings: GeneratorWarning[] } {
  const { manifest, catalog } = input.artifacts
  const warnings: GeneratorWarning[] = []
  if (input.security.mode === 'none') {
    warnings.push({ message: 'No cube-level security filters will be generated. Use only for public or single-tenant data.' })
  }

  const usedTables = new Set<string>()
  const usedCubes = new Set<string>()
  const modelEntries = getModelNodes(manifest).flatMap((node) => {
    const uniqueId = node.unique_id
    const dbtName = node.name
    const materialized = typeof node.config?.materialized === 'string' ? node.config.materialized : 'missing'
    if (!uniqueId || !dbtName) return []
    if (!isMaterializedModel(node)) {
      warnings.push({ message: `Skipping non-materialized dbt model ${dbtName} (${materialized}).` })
      return []
    }
    const catalogNode = getCatalogNode(catalog, uniqueId)
    if (!catalogNode?.columns) throw new DbtGenerateError(`Missing catalog node for materialized model ${dbtName} (${uniqueId}).`)
    const modelMeta = drizzleMeta(node)
    const modelConfig = input.config.models?.[dbtName]
    const tableExportName = makeUniqueName(toSafeIdentifier(modelConfig?.tableExportName ?? stringMeta(modelMeta, 'tableExportName') ?? dbtName, 'table'), usedTables)
    const cubeName = makeUniqueName(modelConfig?.cubeName ?? stringMeta(modelMeta, 'cubeName') ?? toPascalCase(dbtName), usedCubes)
    const pkCandidates = getPrimaryKeyCandidates(manifest, uniqueId)
    const primaryKey = pkCandidates.length === 1 ? pkCandidates[0] : undefined
    const usedProperties = new Set<string>()
    const usedDimensions = new Set<string>()
    const columnsByDbName = new Map<string, GeneratedColumn>()
    const columns = sortedCatalogColumns(catalogNode.columns).map(([dbName, catalogColumn]) => {
      const manifestColumn = node.columns?.[dbName]
      const columnMeta = drizzleMeta(manifestColumn)
      const columnConfig = modelConfig?.columns?.[dbName]
      const mapping = mapPostgresCatalogType(String(catalogColumn.type ?? manifestColumn?.data_type ?? ''), input.config.typeOverrides)
      const dimensionType = columnConfig?.dimensionType ?? stringMeta(columnMeta, 'dimensionType') as GeneratedColumn['dimensionType'] ?? mapping.dimensionType
      const primary = primaryKey === dbName
      const attachedTestNames = getColumnTestNames(manifest, uniqueId, dbName)
      const column: GeneratedColumn = {
        dbName,
        propertyName: makeUniqueName(toSafeIdentifier(columnConfig?.propertyName ?? stringMeta(columnMeta, 'propertyName') ?? dbName, 'column'), usedProperties),
        dimensionName: makeUniqueName(toSafeIdentifier(columnConfig?.dimensionName ?? stringMeta(columnMeta, 'dimensionName') ?? dbName, 'dimension'), usedDimensions),
        title: stringMeta(columnMeta, 'title') ?? humanizeName(dbName),
        description: manifestColumn?.description,
        catalogType: String(catalogColumn.type ?? manifestColumn?.data_type ?? ''),
        drizzleBuilder: mapping.builderExpression(JSON.stringify(dbName)),
        drizzleImport: mapping.drizzleImport,
        dimensionType,
        primaryKey: primary,
        notNull: notNullFromColumn(manifestColumn, attachedTestNames, primary),
      }
      columnsByDbName.set(dbName, column)
      return column
    })

    const primaryKeyColumn = primaryKey ? columnsByDbName.get(primaryKey) : undefined
    const explicitMeasures = [...(modelConfig?.measures ?? []), ...columns.flatMap((column) => readColumnMeasures(column.dbName, node.columns?.[column.dbName]))]
    const measures = [
      primaryKeyColumn
        ? { name: 'count', title: 'Count', type: 'countDistinct' as const, columnPropertyName: primaryKeyColumn.propertyName }
        : { name: 'count', title: 'Count', type: 'count' as const },
      ...explicitMeasures.map((measure) => normalizeMeasure(measure, columnsByDbName)),
    ].sort((a, b) => (a.name === 'count' ? -1 : b.name === 'count' ? 1 : a.name.localeCompare(b.name)))

    const relationName = toRelationName(dbtName, catalogNode.metadata?.name, node.alias)
    return [{
      uniqueId,
      dbtName,
      relationName,
      schemaName: typeof node.schema === 'string' ? node.schema : undefined,
      databaseName: typeof node.database === 'string' ? node.database : undefined,
      tableExportName,
      cubeName,
      cubeVarName: toSafeIdentifier(`${cubeName}Cube`, 'cube'),
      fileName: toFileName(cubeName),
      title: stringMeta(modelMeta, 'title') ?? humanizeName(dbtName),
      description: node.description,
      columns,
      primaryKeyColumn,
      joins: [] as GeneratedModel['joins'],
      measures,
    } satisfies GeneratedModel]
  })

  const models = modelEntries.sort((a, b) => a.cubeName.localeCompare(b.cubeName) || a.dbtName.localeCompare(b.dbtName))
  const modelsById = new Map(models.map((model) => [model.uniqueId, model]))
  if (input.security.mode === 'column') {
    const securityColumn = input.security.column
    const missing = models.filter((model) => !model.columns.some((column) => column.dbName === securityColumn)).map((model) => model.dbtName)
    if (missing.length > 0) throw new DbtGenerateError(`Models missing security column ${securityColumn}: ${missing.join(', ')}.`)
  }

  const seenJoins = new Set<string>()
  for (const relationship of getRelationshipTests(manifest)) {
    const sourceModel = modelsById.get(relationship.sourceModelId)
    const targetModel = modelsById.get(relationship.targetModelId)
    if (!sourceModel || !targetModel) continue
    const sourceColumn = sourceModel.columns.find((column) => column.dbName === relationship.sourceColumn)
    const targetColumn = targetModel.columns.find((column) => column.dbName === relationship.targetColumn)
    if (!sourceColumn || !targetColumn) continue
    const key = `${sourceModel.uniqueId}|${targetModel.uniqueId}|${sourceColumn.dbName}|${targetColumn.dbName}`
    if (seenJoins.has(key)) continue
    seenJoins.add(key)
    sourceModel.joins.push({
      sourceModelId: sourceModel.uniqueId,
      targetModelId: targetModel.uniqueId,
      targetCubeName: targetModel.cubeName,
      sourceColumnPropertyName: sourceColumn.propertyName,
      targetColumnPropertyName: targetColumn.propertyName,
      targetTableExportName: targetModel.tableExportName,
      relationship: 'belongsTo',
    })
  }
  for (const model of models) model.joins.sort((a, b) => a.targetCubeName.localeCompare(b.targetCubeName))

  return { models, warnings }
}
