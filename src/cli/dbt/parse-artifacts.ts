/**
 * dbt artifact loading and parsing.
 *
 * File I/O lives in `loadDbtArtifacts`; the pure `parseDbtArtifacts` function
 * accepts already-loaded `unknown` values and routes them through local type
 * guards. No `as any` is used — values are narrowed with real guards before
 * being assigned to the structured types.
 */
import { readFile } from 'node:fs/promises'
import type {
  DbtColumn,
  DbtModel,
  DbtRelationshipTest,
  ParsedDbtArtifacts,
} from './types.js'

// ---------------------------------------------------------------------------
// Local type guards (over `unknown`) — these are the only narrowing used.
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return isRecord(value) ? value : undefined
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function getRecordField(obj: Record<string, unknown>, field: string): unknown {
  return obj[field]
}

function getSubRecord(obj: Record<string, unknown>, field: string): Record<string, unknown> | undefined {
  const v = getRecordField(obj, field)
  return asRecord(v)
}

function getStringField(obj: Record<string, unknown>, field: string): string | undefined {
  return asString(getRecordField(obj, field))
}

function getNumberField(obj: Record<string, unknown>, field: string): number | undefined {
  return asNumber(getRecordField(obj, field))
}

// ---------------------------------------------------------------------------
// Manifest node extraction
// ---------------------------------------------------------------------------

/** Read and parse a JSON artifact file, surfacing a clear error on failure. */
async function readArtifactJson(path: string, label: string): Promise<unknown> {
  let text: string
  try {
    text = await readFile(path, 'utf-8')
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Could not read ${label} at ${path}: ${message}`, { cause: err })
  }
  try {
    return JSON.parse(text)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Could not parse ${label} at ${path} as JSON: ${message}`, { cause: err })
  }
}

/** Require a top-level `nodes` record on an artifact, or throw naming it. */
function requireNodes(artifact: unknown, label: string): Record<string, unknown> {
  const obj = asRecord(artifact)
  if (!obj) {
    throw new Error(`${label} is not a JSON object (missing top-level object).`)
  }
  const nodes = asRecord(getRecordField(obj, 'nodes'))
  if (!nodes) {
    throw new Error(`${label} is missing required top-level field 'nodes' (object).`)
  }
  return nodes
}

/** Build a `DbtColumn` from a manifest column + catalog column record. */
function buildColumn(
  name: string,
  manifestCol: Record<string, unknown> | undefined,
  catalogCol: Record<string, unknown>,
): DbtColumn {
  const type = getStringField(catalogCol, 'type') ?? ''
  const index = getNumberField(catalogCol, 'index') ?? 0
  const comment = getStringField(catalogCol, 'comment')
  const description = manifestCol ? getStringField(manifestCol, 'description') : undefined
  const meta = manifestCol ? asRecord(getRecordField(manifestCol, 'meta')) : undefined
  return { name, type, index, comment, description, meta }
}

/**
 * Extract a model's column map by merging manifest column metadata with the
 * catalog node's `columns`. Catalog column names are authoritative for the
 * column set (they carry the actual SQL types).
 */
function extractColumns(
  manifestColumns: Record<string, unknown> | undefined,
  catalogColumns: Record<string, unknown> | undefined,
): Record<string, DbtColumn> {
  const out: Record<string, DbtColumn> = {}
  if (!isRecord(catalogColumns)) return out
  for (const [name, catRaw] of Object.entries(catalogColumns)) {
    const cat = asRecord(catRaw)
    if (!cat) continue
    const man = manifestColumns ? asRecord(getRecordField(manifestColumns, name)) : undefined
    out[name] = buildColumn(name, man, cat)
  }
  return out
}

/** Parse a single manifest model node into a `DbtModel` plus its raw manifest columns. */
function parseModelNode(
  uniqueId: string,
  node: Record<string, unknown>,
): { model: DbtModel; manifestColumns: Record<string, unknown> } | null {
  const resourceType = getStringField(node, 'resource_type')
  if (resourceType !== 'model') return null

  const name = getStringField(node, 'name') ?? uniqueId
  const alias = getStringField(node, 'alias') ?? name
  const schema = getStringField(node, 'schema') ?? 'public'
  const database = getStringField(node, 'database')
  const config = getSubRecord(node, 'config')
  const materialization = (config && getStringField(config, 'materialized')) ?? 'view'
  const relationName = getStringField(node, 'relation_name') ?? `"${schema}"."${alias}"`
  const description = getStringField(node, 'description')
  const meta = asRecord(getRecordField(node, 'meta'))
  const manifestColumns = getSubRecord(node, 'columns') ?? {}

  return {
    model: {
      uniqueId,
      name,
      alias,
      schema,
      database,
      resourceType,
      materialization,
      relationName,
      description,
      meta,
      // Columns are populated from catalog (with manifest descriptions/meta
      // merged in) during `attachCatalogColumns`. Until then, an empty map.
      columns: {},
    },
    manifestColumns,
  }
}

/**
 * Attach catalog column types to parsed models. Models without a catalog
 * entry keep an empty column map (the normalizer decides to warn-and-skip).
 */
function attachCatalogColumns(
  models: Record<string, DbtModel>,
  manifestColumnsByModel: Map<string, Record<string, unknown>>,
  catalogNodes: Record<string, unknown>,
): void {
  for (const model of Object.values(models)) {
    const catalogNode = asRecord(catalogNodes[model.uniqueId])
    if (!catalogNode) continue
    const catalogColumns = getSubRecord(catalogNode, 'columns')
    const manifestColumns = manifestColumnsByModel.get(model.uniqueId)
    model.columns = extractColumns(manifestColumns, catalogColumns)
  }
}

// ---------------------------------------------------------------------------
// Relationship test extraction
// ---------------------------------------------------------------------------

/**
 * Resolve a dbt node ref like `model.project.orders` to a model unique id.
 * dbt relationship tests reference the target via `depends_on.nodes` or via
 * `kwargs.field`/`kwargs.to`. We accept either shape.
 */
function resolveTargetModelId(testNode: Record<string, unknown>): string | undefined {
  const dependsOn = getSubRecord(testNode, 'depends_on')
  const dependsNodes = dependsOn ? getRecordField(dependsOn, 'nodes') : undefined
  if (Array.isArray(dependsNodes)) {
    // The target model is conventionally the second entry (first is source).
    const target = dependsNodes.find(
      (n, i) => typeof n === 'string' && n.startsWith('model.') && i > 0,
    )
    if (typeof target === 'string') return target
    const anyModel = dependsNodes.find((n) => typeof n === 'string' && n.startsWith('model.'))
    if (typeof anyModel === 'string') return anyModel
  }
  return undefined
}

/** Extract the column name from a dbt `column_name` like `"orders"."customer_id"`. */
function extractColumnName(raw: string | undefined): string {
  if (!raw) return ''
  // Strip surrounding quotes and any table qualifier: `"orders"."customer_id"` → `customer_id`
  const last = raw.split('.').pop() ?? raw
  return last.replace(/"/g, '')
}

/**
 * Read a kwarg value by name from a dbt test_metadata.kwargs record.
 *
 * dbt manifest v12 stores kwargs either as a direct map (`{ field: 'id' }`)
 * or as a map of `{ name, value }` entries (`{ field: { name: 'field', value: 'id' } }`).
 * Returns the string value, or `undefined` if absent/non-string.
 */
function readKwarg(kwargs: Record<string, unknown> | undefined, name: string): string | undefined {
  if (!kwargs) return undefined
  const raw = getRecordField(kwargs, name)
  if (typeof raw === 'string') return raw
  const entry = asRecord(raw)
  if (entry) {
    const value = getRecordField(entry, 'value')
    if (typeof value === 'string') return value
  }
  return undefined
}

/** Parse dbt relationship test nodes into `DbtRelationshipTest` entries. */
function parseRelationships(
  manifestNodes: Record<string, unknown>,
): DbtRelationshipTest[] {
  const out: DbtRelationshipTest[] = []
  for (const [_uniqueId, raw] of Object.entries(manifestNodes)) {
    const node = asRecord(raw)
    if (!node) continue
    if (getStringField(node, 'resource_type') !== 'test') continue

    const testMeta = getSubRecord(node, 'test_metadata')
    const testName = testMeta ? getStringField(testMeta, 'name') : undefined
    if (testName !== 'relationships') continue

    // Source model is the model the test is attached to (attached_node).
    const sourceModelId =
      getStringField(node, 'attached_node') ?? resolveTargetModelId(node)
    if (!sourceModelId) continue

    const targetModelId = resolveTargetModelId(node)
    if (!targetModelId) continue

    const kwargs = testMeta ? asRecord(getRecordField(testMeta, 'kwargs')) : undefined
    // The source column comes from the test's `column_name`.
    const sourceColumn = extractColumnName(getStringField(node, 'column_name'))
    // The target column comes from the `field` kwarg (defaults to 'id').
    const targetColumn = readKwarg(kwargs, 'field') ?? ''

    out.push({ sourceModelId, targetModelId, sourceColumn, targetColumn })
  }
  return out
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Pure parse of already-loaded manifest + catalog `unknown` values.
 *
 * Throws only on structurally invalid artifacts (missing `nodes`); individual
 * malformed nodes are skipped. Relationship tests that cannot resolve a
 * target are omitted (the normalizer warns for unresolved edges).
 */
export function parseDbtArtifacts(manifest: unknown, catalog: unknown): ParsedDbtArtifacts {
  const manifestNodes = requireNodes(manifest, 'manifest')
  const catalogNodes = requireNodes(catalog, 'catalog')

  const models: Record<string, DbtModel> = {}
  const manifestColumnsByModel = new Map<string, Record<string, unknown>>()
  for (const [uniqueId, raw] of Object.entries(manifestNodes)) {
    const node = asRecord(raw)
    if (!node) continue
    const parsed = parseModelNode(uniqueId, node)
    if (parsed) {
      models[uniqueId] = parsed.model
      manifestColumnsByModel.set(uniqueId, parsed.manifestColumns)
    }
  }
  attachCatalogColumns(models, manifestColumnsByModel, catalogNodes)

  const relationships = parseRelationships(manifestNodes)
  return { models, relationships }
}

/** Load and parse dbt artifacts from disk (the only file-I/O entry point). */
export async function loadDbtArtifacts(
  manifestPath: string,
  catalogPath: string,
): Promise<ParsedDbtArtifacts> {
  const manifest = await readArtifactJson(manifestPath, 'manifest')
  const catalog = await readArtifactJson(catalogPath, 'catalog')
  return parseDbtArtifacts(manifest, catalog)
}
