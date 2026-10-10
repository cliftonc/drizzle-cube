import { readFile } from 'node:fs/promises'
import type { CatalogColumn, CatalogNode, DbtColumn, DbtModel, DbtRelationshipTest, GeneratorWarning, ParsedDbtArtifacts } from './types.js'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function recordValue(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

function arrayValue(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function readColumns(value: unknown, testsByColumn: Record<string, string[]>): DbtColumn[] {
  const columns = recordValue(value)
  if (!columns) return []
  return Object.entries(columns).map(([name, raw]) => {
    const column = recordValue(raw) ?? {}
    const meta = recordValue(column.meta)
    return {
      name: stringValue(column.name) ?? name,
      description: stringValue(column.description),
      meta,
      tests: testsByColumn[name] ?? []
    }
  })
}

function readCatalogColumns(value: unknown): CatalogColumn[] {
  const columns = recordValue(value)
  if (!columns) return []
  const result: CatalogColumn[] = []
  for (const [name, raw] of Object.entries(columns)) {
    const column = recordValue(raw) ?? {}
    const type = stringValue(column.type)
    if (!type) continue
    result.push({
      name: stringValue(column.name) ?? name,
      type,
      index: typeof column.index === 'number' ? column.index : undefined,
      comment: stringValue(column.comment)
    })
  }
  return result
}

function stringArray(value: unknown): string[] {
  return arrayValue(value).filter((item): item is string => typeof item === 'string')
}

// dbt keeps a generic test's arguments in test_metadata.kwargs; older or
// hand-written artifacts may put them on the node itself.
function testKwargs(node: Record<string, unknown>): Record<string, unknown> {
  return recordValue(recordValue(node.test_metadata)?.kwargs) ?? recordValue(node.kwargs) ?? {}
}

function testName(node: Record<string, unknown>): string | undefined {
  return stringValue(recordValue(node.test_metadata)?.name) ?? stringValue(node.name)
}

function dependsOnModels(node: Record<string, unknown>): string[] {
  return stringArray(recordValue(node.depends_on)?.nodes).filter((value) => value.startsWith('model.'))
}

// The model a test is defined on. depends_on.nodes is sorted, so its first
// entry is not necessarily the tested model.
function attachedModelId(node: Record<string, unknown>): string | undefined {
  const attached = stringValue(node.attached_node)
  if (attached?.startsWith('model.')) return attached
  const models = dependsOnModels(node)
  return models.length === 1 ? models[0] : undefined
}

function testColumnName(node: Record<string, unknown>): string | undefined {
  return stringValue(node.column_name) ?? stringValue(testKwargs(node).column_name)
}

interface ModelTests {
  testsByColumn: Record<string, Record<string, string[]>>
  keyColumnsByModel: Record<string, string[]>
}

function collectModelTests(nodes: Record<string, unknown>): ModelTests {
  const testsByColumn: Record<string, Record<string, string[]>> = {}
  const keyColumnsByModel: Record<string, string[]> = {}
  for (const raw of Object.values(nodes)) {
    const node = recordValue(raw)
    if (!node || node.resource_type !== 'test') continue
    const modelId = attachedModelId(node)
    const name = testName(node)
    if (!modelId || !name) continue
    if (name === 'unique_combination_of_columns') {
      const columns = stringArray(testKwargs(node).combination_of_columns)
      if (columns.length > 0) keyColumnsByModel[modelId] ??= columns
      continue
    }
    const columnName = testColumnName(node)
    if (!columnName) continue
    testsByColumn[modelId] ??= {}
    testsByColumn[modelId][columnName] ??= []
    testsByColumn[modelId][columnName]?.push(name)
  }
  return { testsByColumn, keyColumnsByModel }
}

function constraintPrimaryKey(node: Record<string, unknown>): string[] {
  for (const raw of arrayValue(node.constraints)) {
    const constraint = recordValue(raw)
    if (constraint?.type === 'primary_key') {
      const columns = stringArray(constraint.columns)
      if (columns.length > 0) return columns
    }
  }
  const columns = recordValue(node.columns) ?? {}
  return Object.entries(columns)
    .filter(([, rawColumn]) => arrayValue(recordValue(rawColumn)?.constraints).some((constraint) => recordValue(constraint)?.type === 'primary_key'))
    .map(([name, rawColumn]) => stringValue(recordValue(rawColumn)?.name) ?? name)
}

// kwargs.to is a Jinja string such as "ref('customers')" or
// "ref('package', 'customers')"; the last quoted argument is the model name.
function referencedModelName(to: string | undefined): string | undefined {
  const match = to?.match(/^\s*ref\s*\((.*)\)\s*$/)
  if (!match?.[1]) return undefined
  const args = Array.from(match[1].matchAll(/['"]([^'"]+)['"]/g), (arg) => arg[1])
  return args.at(-1)
}

function collectRelationships(nodes: Record<string, unknown>, warnings: GeneratorWarning[]): DbtRelationshipTest[] {
  const modelNames = new Map<string, string>()
  for (const [id, raw] of Object.entries(nodes)) {
    const name = stringValue(recordValue(raw)?.name)
    if (id.startsWith('model.') && name) modelNames.set(id, name)
  }

  const relationships: DbtRelationshipTest[] = []
  for (const [testId, raw] of Object.entries(nodes)) {
    const node = recordValue(raw)
    if (!node || node.resource_type !== 'test') continue
    if (testName(node) !== 'relationships') continue

    const kwargs = testKwargs(node)
    const sourceModelId = attachedModelId(node)
    const otherModels = dependsOnModels(node).filter((id) => id !== sourceModelId)
    const refName = referencedModelName(stringValue(kwargs.to))
    let targetModelId: string | undefined
    if (refName) {
      targetModelId = otherModels.find((id) => modelNames.get(id) === refName)
        ?? (sourceModelId && modelNames.get(sourceModelId) === refName ? sourceModelId : undefined)
    } else if (otherModels.length === 1) {
      targetModelId = otherModels[0]
    }
    const sourceColumn = testColumnName(node)
    const targetColumn = stringValue(kwargs.field) ?? stringValue(kwargs.to_field) ?? stringValue(kwargs.to_column)

    if (sourceModelId && targetModelId && sourceColumn && targetColumn) {
      relationships.push({ testId, sourceModelId, sourceColumn, targetModelId, targetColumn })
    } else {
      warnings.push({ code: 'relationship_unresolved', message: `Skipping dbt relationships test '${testId}' because its source/target model or column could not be resolved (only ref() targets are supported).` })
    }
  }
  return relationships
}

export function parseDbtArtifacts(manifest: unknown, catalog: unknown): ParsedDbtArtifacts {
  const manifestRecord = recordValue(manifest)
  const catalogRecord = recordValue(catalog)
  const manifestNodes = recordValue(manifestRecord?.nodes)
  const catalogNodes = recordValue(catalogRecord?.nodes)
  if (!manifestNodes) throw new Error('manifest.json must contain a top-level nodes object')
  if (!catalogNodes) throw new Error('catalog.json must contain a top-level nodes object')

  const warnings: GeneratorWarning[] = []
  const { testsByColumn: testsByModel, keyColumnsByModel } = collectModelTests(manifestNodes)
  const models: DbtModel[] = []
  for (const [uniqueId, raw] of Object.entries(manifestNodes)) {
    const node = recordValue(raw)
    if (!node || node.resource_type !== 'model') continue
    const name = stringValue(node.name)
    if (!name) continue
    const testsByColumn = testsByModel[uniqueId] ?? {}
    const constrainedKey = constraintPrimaryKey(node)
    models.push({
      uniqueId,
      name,
      alias: stringValue(node.alias) ?? name,
      schema: stringValue(node.schema),
      database: stringValue(node.database),
      description: stringValue(node.description),
      materialized: stringValue(recordValue(node.config)?.materialized),
      columns: readColumns(node.columns, testsByColumn),
      meta: recordValue(node.meta),
      testsByColumn,
      primaryKeyColumns: constrainedKey.length > 0 ? constrainedKey : keyColumnsByModel[uniqueId] ?? []
    })
  }

  const catalogMap = new Map<string, CatalogNode>()
  for (const [uniqueId, raw] of Object.entries(catalogNodes)) {
    const node = recordValue(raw)
    if (!node) continue
    catalogMap.set(uniqueId, { uniqueId, columns: readCatalogColumns(node.columns) })
  }

  return { models, catalogNodes: catalogMap, relationships: collectRelationships(manifestNodes, warnings), warnings }
}

export async function loadDbtArtifacts(manifestPath: string, catalogPath: string): Promise<ParsedDbtArtifacts> {
  let manifest: unknown
  let catalog: unknown
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  } catch (error) {
    throw new Error(`Failed to read manifest '${manifestPath}': ${error instanceof Error ? error.message : String(error)}`, { cause: error })
  }
  try {
    catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
  } catch (error) {
    throw new Error(`Failed to read catalog '${catalogPath}': ${error instanceof Error ? error.message : String(error)}`, { cause: error })
  }
  return parseDbtArtifacts(manifest, catalog)
}
