import { readFile } from 'node:fs/promises'
import { DbtGenerateError } from './errors.js'
import type { DbtCatalog, DbtCatalogNode, DbtManifest, DbtManifestNode } from './types.js'

export interface RelationshipTest {
  sourceModelId: string
  targetModelId: string
  sourceColumn: string
  targetColumn: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function readJson(path: string, label: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, 'utf8'))
  } catch (error) {
    throw new DbtGenerateError(`Failed to parse ${label} artifact ${path}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function loadDbtArtifacts(manifestPath: string, catalogPath: string): Promise<{ manifest: DbtManifest; catalog: DbtCatalog }> {
  const manifest = await readJson(manifestPath, 'manifest')
  const catalog = await readJson(catalogPath, 'catalog')
  if (!isRecord(manifest) || !isRecord(manifest.nodes)) {
    throw new DbtGenerateError(`Invalid manifest artifact ${manifestPath}: expected nodes object.`)
  }
  if (!isRecord(catalog) || !isRecord(catalog.nodes)) {
    throw new DbtGenerateError(`Invalid catalog artifact ${catalogPath}: expected nodes object.`)
  }
  return { manifest: manifest as unknown as DbtManifest, catalog: catalog as unknown as DbtCatalog }
}

export function getModelNodes(manifest: DbtManifest): DbtManifestNode[] {
  return Object.values(manifest.nodes).filter((node) => node.resource_type === 'model')
}

export function isMaterializedModel(node: DbtManifestNode): boolean {
  const materialized = typeof node.config?.materialized === 'string' ? node.config.materialized : undefined
  return ['table', 'view', 'incremental', 'materialized_view'].includes(materialized ?? '')
}

export function getCatalogNode(catalog: DbtCatalog, uniqueId: string): DbtCatalogNode | undefined {
  return catalog.nodes[uniqueId]
}

function stringFrom(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function columnFromTest(node: DbtManifestNode): string | undefined {
  return stringFrom(node.column_name)
    ?? stringFrom(node.test_metadata?.kwargs?.column_name)
    ?? stringFrom(node.test_metadata?.kwargs?.field)
}

function targetColumnFromTest(node: DbtManifestNode): string | undefined {
  return stringFrom(node.test_metadata?.kwargs?.target_field)
    ?? stringFrom(node.test_metadata?.kwargs?.to_field)
    ?? stringFrom(node.test_metadata?.kwargs?.field)
    ?? 'id'
}

export function getRelationshipTests(manifest: DbtManifest): RelationshipTest[] {
  const modelIds = new Set(Object.entries(manifest.nodes).filter(([, node]) => node.resource_type === 'model').map(([id]) => id))
  return Object.entries(manifest.nodes).flatMap(([, node]) => {
    if (node.resource_type !== 'test' || node.test_metadata?.name !== 'relationships') return []
    const depends = node.depends_on?.nodes?.filter((id) => modelIds.has(id)) ?? []
    const sourceModelId = stringFrom(node.attached_node) ?? depends[0]
    const sourceColumn = columnFromTest(node)
    const targetColumn = targetColumnFromTest(node)
    const targetModelId = depends.find((id) => id !== sourceModelId)
    if (!sourceModelId || !targetModelId || !sourceColumn || !targetColumn) return []
    return [{ sourceModelId, targetModelId, sourceColumn, targetColumn }]
  })
}

function testName(test: unknown): string | undefined {
  if (typeof test === 'string') return test
  if (isRecord(test)) return Object.keys(test)[0]
  return undefined
}

export function getPrimaryKeyCandidates(manifest: DbtManifest, modelUniqueId: string): string[] {
  const node = manifest.nodes[modelUniqueId]
  if (!node) return []
  const constraints = node.constraints ?? []
  for (const constraint of constraints) {
    if (constraint.type === 'primary_key' && Array.isArray(constraint.columns)) {
      return constraint.columns.filter((column): column is string => typeof column === 'string')
    }
  }
  const metaPk = isRecord(node.meta?.drizzle_cube) ? node.meta.drizzle_cube.primary_key : undefined
  if (typeof metaPk === 'string') return [metaPk]
  if (Array.isArray(metaPk)) return metaPk.filter((column): column is string => typeof column === 'string')

  return Object.entries(node.columns ?? {})
    .filter(([, column]) => {
      const tests = column.tests ?? []
      if (!Array.isArray(tests)) return false
      const names = tests.map(testName)
      return names.includes('unique') && names.includes('not_null')
    })
    .map(([name]) => name)
}
