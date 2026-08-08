/**
 * dbt artifact loading + pure parsing.
 *
 * File I/O is confined to `loadDbtArtifacts`; `parseDbtArtifacts` is pure and
 * unit-testable. All values are narrowed from `unknown` through local guards —
 * no `as any`, no unchecked casts past a validator.
 */

import { readFile } from 'node:fs/promises'
import type {
  DbtColumn,
  DbtModel,
  DbtRelationshipTest,
  ParsedDbtArtifacts,
} from './types.js'

// ---------------------------------------------------------------------------
// Local type guards over `unknown`
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
}

function getRecordField(record: Record<string, unknown>, field: string): unknown {
  return record[field]
}

function getStringField(record: Record<string, unknown>, field: string): string | undefined {
  return asString(getRecordField(record, field))
}

function getNumberField(record: Record<string, unknown>, field: string): number | undefined {
  return asNumber(getRecordField(record, field))
}

// ---------------------------------------------------------------------------
// I/O
// ---------------------------------------------------------------------------

async function readArtifactJson(filePath: string, label: string): Promise<unknown> {
  let raw: string
  try {
    raw = await readFile(filePath, 'utf-8')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Could not read ${label} file '${filePath}': ${message}`, {
      cause: err,
    })
  }
  try {
    return JSON.parse(raw)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Could not parse ${label} file '${filePath}' as JSON: ${message}`, {
      cause: err,
    })
  }
}

function requireNodes(artifact: unknown, label: string): Record<string, unknown> {
  const nodes = asRecord(artifact)
  if (!nodes || !isRecord(getRecordField(nodes, 'nodes'))) {
    throw new Error(`Invalid ${label}: missing or non-object top-level 'nodes' field.`)
  }
  return asRecord(getRecordField(nodes, 'nodes')) as Record<string, unknown>
}

/**
 * Read + parse dbt `manifest.json` and `catalog.json` from disk.
 * The only file-I/O entry point in the generator.
 */
export async function loadDbtArtifacts(
  manifestPath: string,
  catalogPath: string,
): Promise<ParsedDbtArtifacts> {
  const manifest = await readArtifactJson(manifestPath, 'manifest')
  const catalog = await readArtifactJson(catalogPath, 'catalog')
  return parseDbtArtifacts(manifest, catalog)
}

// ---------------------------------------------------------------------------
// Pure parsing
// ---------------------------------------------------------------------------

/** Extract a column SQL name from a possibly-qualified dbt string like `"orders"."customer_id"`. */
function stripColumnQualifier(raw: string): string {
  const trimmed = raw.trim()
  const last = trimmed.split('.').pop() ?? trimmed
  return last.replace(/"/g, '')
}

function parseColumns(columnsField: unknown): Record<string, DbtColumn> {
  const columns: Record<string, DbtColumn> = {}
  const record = asRecord(columnsField)
  if (!record) return columns
  for (const key of Object.keys(record)) {
    const col = asRecord(record[key])
    if (!col) continue
    const name = getStringField(col, 'name') ?? key
    const description = getStringField(col, 'description')
    const meta = asRecord(getRecordField(col, 'meta'))
    const comment = getStringField(col, 'comment')
    columns[key] = {
      name,
      type: getStringField(col, 'type') ?? 'text',
      index: getNumberField(col, 'index') ?? 0,
      ...(comment !== undefined ? { comment } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(meta ? { meta } : {}),
    }
  }
  return columns
}

/**
 * Merge manifest column descriptions/meta with catalog column types by unique
 * id + column SQL name. Catalog columns are authoritative for the column set
 * (they carry types). Models without a catalog entry keep an empty column map.
 */
function attachCatalogColumns(
  model: DbtModel,
  catalogColumns: Record<string, DbtColumn>,
): void {
  if (Object.keys(catalogColumns).length === 0) {
    model.columns = {}
    return
  }
  const merged: Record<string, DbtColumn> = {}
  for (const key of Object.keys(catalogColumns)) {
    const catCol = catalogColumns[key]
    const manifestCol = asRecord(getRecordField(asRecord(model.columns) ?? {}, key))
    const description =
      (manifestCol && getStringField(manifestCol, 'description')) ?? catCol.description
    const meta =
      (manifestCol && asRecord(getRecordField(manifestCol, 'meta'))) ?? catCol.meta
    merged[key] = {
      name: catCol.name,
      type: catCol.type,
      index: catCol.index,
      ...(catCol.comment !== undefined ? { comment: catCol.comment } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(meta ? { meta } : {}),
    }
  }
  model.columns = merged
}

function parseModels(
  manifestNodes: Record<string, unknown>,
  catalogNodes: Record<string, unknown>,
): Record<string, DbtModel> {
  const models: Record<string, DbtModel> = {}
  for (const uniqueId of Object.keys(manifestNodes)) {
    const node = asRecord(manifestNodes[uniqueId])
    if (!node) continue
    if (getStringField(node, 'resource_type') !== 'model') continue

    const name = getStringField(node, 'name') ?? uniqueId
    const alias = getStringField(node, 'alias') ?? name
    const schema = getStringField(node, 'schema') ?? 'public'
    const database = getStringField(node, 'database')
    const config = asRecord(getRecordField(node, 'config'))
    const materialization = (config && getStringField(config, 'materialized')) ?? 'view'
    const relationName =
      getStringField(node, 'relation_name') ?? `"${schema}"."${alias}"`
    const description = getStringField(node, 'description')
    const meta = asRecord(getRecordField(node, 'meta'))

    const model: DbtModel = {
      uniqueId,
      name,
      alias,
      schema,
      ...(database !== undefined ? { database } : {}),
      resourceType: 'model',
      materialization,
      relationName,
      ...(description !== undefined ? { description } : {}),
      ...(meta ? { meta } : {}),
      columns: parseColumns(getRecordField(node, 'columns')),
    }

    const catalogNode = asRecord(catalogNodes[uniqueId])
    const catalogColumns = parseColumns(getRecordField(catalogNode ?? {}, 'columns'))
    attachCatalogColumns(model, catalogColumns)
    models[uniqueId] = model
  }
  return models
}

/** Read the target column from a dbt `relationships` test `kwargs.field`. */
function readTargetColumnFromKwargs(kwargs: Record<string, unknown>): string {
  // Direct shape: { field: 'id' }
  const direct = getStringField(kwargs, 'field')
  if (direct) return stripColumnQualifier(direct)
  // { name, value } shape
  const nameField = getStringField(kwargs, 'name')
  const valueField = getStringField(kwargs, 'value')
  if (nameField === 'field' && valueField) return stripColumnQualifier(valueField)
  return ''
}

function parseRelationships(manifestNodes: Record<string, unknown>): DbtRelationshipTest[] {
  const relationships: DbtRelationshipTest[] = []
  for (const uniqueId of Object.keys(manifestNodes)) {
    const node = asRecord(manifestNodes[uniqueId])
    if (!node) continue
    if (getStringField(node, 'resource_type') !== 'test') continue
    const testMetadata = asRecord(getRecordField(node, 'test_metadata'))
    if (!testMetadata || getStringField(testMetadata, 'name') !== 'relationships') continue

    const attached = getStringField(node, 'attached_node')
    const dependsOn = asRecord(getRecordField(node, 'depends_on'))
    const rawDeps = getRecordField(dependsOn ?? {}, 'nodes')
    const depList: string[] = Array.isArray(rawDeps)
      ? rawDeps.map((v) => asString(v)).filter((v): v is string => v !== undefined)
      : []

    const sourceModelId = attached ?? depList.find((d) => d.startsWith('model.')) ?? ''
    // Target is the second model. entry, else any other model. entry.
    const modelDeps = depList.filter((d) => d.startsWith('model.'))
    const targetModelId =
      modelDeps.find((d) => d !== sourceModelId) ?? modelDeps[0] ?? ''

    const sourceColumn = stripColumnQualifier(getStringField(node, 'column_name') ?? '')
    const kwargs = asRecord(getRecordField(testMetadata, 'kwargs')) ?? {}
    const targetColumn = readTargetColumnFromKwargs(kwargs)

    if (!sourceModelId || !targetModelId || !sourceColumn || !targetColumn) {
      // Unresolved edges are dropped by the normalizer with a warning.
      continue
    }

    relationships.push({ sourceModelId, targetModelId, sourceColumn, targetColumn })
  }
  return relationships
}

/**
 * Pure parse of in-memory dbt manifest + catalog JSON. No file I/O.
 */
export function parseDbtArtifacts(manifest: unknown, catalog: unknown): ParsedDbtArtifacts {
  const manifestNodes = requireNodes(manifest, 'manifest')
  const catalogNodes = requireNodes(catalog, 'catalog')
  const models = parseModels(manifestNodes, catalogNodes)
  const relationships = parseRelationships(manifestNodes)
  return { models, relationships }
}
