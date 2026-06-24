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

function collectColumnTests(nodes: Record<string, unknown>): Record<string, Record<string, string[]>> {
  const result: Record<string, Record<string, string[]>> = {}
  for (const raw of Object.values(nodes)) {
    const node = recordValue(raw)
    if (!node || node.resource_type !== 'test') continue
    const dependsOn = recordValue(node.depends_on)
    const modelId = arrayValue(dependsOn?.nodes).find((value): value is string => typeof value === 'string' && value.startsWith('model.'))
    const columnName = stringValue(node.column_name) ?? stringValue(recordValue(node.kwargs)?.column_name)
    const testName = stringValue(recordValue(node.test_metadata)?.name) ?? stringValue(node.name)
    if (!modelId || !columnName || !testName) continue
    result[modelId] ??= {}
    result[modelId][columnName] ??= []
    result[modelId][columnName]?.push(testName)
  }
  return result
}

function collectRelationships(nodes: Record<string, unknown>, warnings: GeneratorWarning[]): DbtRelationshipTest[] {
  const relationships: DbtRelationshipTest[] = []
  for (const raw of Object.values(nodes)) {
    const node = recordValue(raw)
    if (!node || node.resource_type !== 'test') continue
    const metadataName = stringValue(recordValue(node.test_metadata)?.name)
    if (metadataName !== 'relationships' && !stringValue(node.name)?.includes('relationships')) continue

    const dependsOnNodes = arrayValue(recordValue(node.depends_on)?.nodes).filter((value): value is string => typeof value === 'string')
    const sourceModelId = dependsOnNodes.find((value) => value.startsWith('model.'))
    const targetModelId = dependsOnNodes.find((value) => value.startsWith('model.') && value !== sourceModelId)
    const kwargs = recordValue(node.kwargs) ?? {}
    const sourceColumn = stringValue(node.column_name) ?? stringValue(kwargs.column_name)
    const targetColumn = stringValue(kwargs.field) ?? stringValue(kwargs.to_field) ?? stringValue(kwargs.to_column)

    if (sourceModelId && targetModelId && sourceColumn && targetColumn) {
      relationships.push({ sourceModelId, sourceColumn, targetModelId, targetColumn })
    } else {
      warnings.push({ code: 'relationship_unresolved', message: 'Skipping dbt relationships test because source/target model or column could not be resolved.' })
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
  const testsByModel = collectColumnTests(manifestNodes)
  const models: DbtModel[] = []
  for (const [uniqueId, raw] of Object.entries(manifestNodes)) {
    const node = recordValue(raw)
    if (!node || node.resource_type !== 'model') continue
    const name = stringValue(node.name)
    if (!name) continue
    const testsByColumn = testsByModel[uniqueId] ?? {}
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
      testsByColumn
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
