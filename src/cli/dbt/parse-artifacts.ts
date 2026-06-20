/**
 * Load and validate local dbt `manifest.json` and `catalog.json` artifacts and
 * reduce them to the small, normalized shapes the generator needs.
 *
 * v1 is artifact-first and local-only: we read JSON, validate only the fields we
 * consume, and never run dbt, parse YAML/Jinja, or touch the network.
 *
 * The dbt artifact schema is large and versioned; we deliberately read a narrow,
 * stable subset (model nodes, their columns/config/meta, column tests, and
 * catalog column types) that has been consistent across recent dbt versions.
 */

/** A dbt column as seen on a manifest model node. */
export interface DbtColumn {
  name: string
  description?: string
  meta: Record<string, unknown>
}

/** A materialized-or-not dbt model node from `manifest.json`. */
export interface DbtModelNode {
  uniqueId: string
  name: string
  /** Database relation name (alias ?? name). */
  relationName: string
  /** `config.materialized`, e.g. `table` | `view` | `incremental` | `ephemeral`. */
  materialized: string
  description?: string
  meta: Record<string, unknown>
  /** Columns keyed by database column name. */
  columns: Record<string, DbtColumn>
}

/** A column-level dbt test we care about (`unique`, `not_null`, `relationships`). */
export interface DbtColumnTest {
  testName: 'unique' | 'not_null' | 'relationships'
  /** unique_id of the model the test is attached to. */
  modelUid: string
  /** Database column name the test targets. */
  columnName: string
  /** relationships only: unique_id of the referenced (target) model. */
  toModelUid?: string
  /** relationships only: target column name (`field`). */
  toField?: string
}

export interface ParsedManifest {
  /** All `resource_type === 'model'` nodes (ephemeral included; filtered later). */
  models: DbtModelNode[]
  tests: DbtColumnTest[]
}

export interface ParsedCatalog {
  /** uid -> (database column name -> catalog type string). */
  columnsByModel: Record<string, Record<string, string>>
}

/** Thrown for malformed/unusable artifacts; the CLI maps this to a stderr + exit 1. */
export class ArtifactError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ArtifactError'
  }
}

function asRecord(value: unknown, what: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ArtifactError(`${what} is not a JSON object`)
  }
  return value as Record<string, unknown>
}

/** A non-empty string, or undefined. Collapses repeated optional-field checks. */
function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined
}

/** Parse a manifest JSON string into the narrow `ParsedManifest` shape. */
export function parseManifest(json: string): ParsedManifest {
  let root: unknown
  try {
    root = JSON.parse(json)
  } catch (err) {
    throw new ArtifactError(`manifest is not valid JSON: ${(err as Error).message}`)
  }
  const manifest = asRecord(root, 'manifest')
  const nodes = asRecord(manifest.nodes ?? {}, 'manifest.nodes')

  const models: DbtModelNode[] = []
  const tests: DbtColumnTest[] = []

  for (const [uid, rawNode] of Object.entries(nodes)) {
    const node = asRecord(rawNode, `manifest.nodes['${uid}']`)
    const resourceType = node.resource_type

    if (resourceType === 'model') {
      models.push(parseModelNode(uid, node))
    } else if (resourceType === 'test') {
      const test = parseTestNode(node, nodes)
      if (test) tests.push(test)
    }
  }

  return { models, tests }
}

function parseModelColumns(uid: string, node: Record<string, unknown>): Record<string, DbtColumn> {
  const columns: Record<string, DbtColumn> = {}
  const rawColumns = asRecord(node.columns ?? {}, `model '${uid}' columns`)
  for (const [colName, rawCol] of Object.entries(rawColumns)) {
    const col = asRecord(rawCol, `model '${uid}' column '${colName}'`)
    columns[colName] = {
      name: optionalString(col.name) ?? colName,
      description: optionalString(col.description),
      meta: asRecord(col.meta ?? {}, `column '${colName}' meta`)
    }
  }
  return columns
}

function parseModelNode(uid: string, node: Record<string, unknown>): DbtModelNode {
  const name = optionalString(node.name)
  if (!name) throw new ArtifactError(`model '${uid}' has no name`)

  const config = asRecord(node.config ?? {}, `model '${uid}' config`)

  return {
    uniqueId: uid,
    name,
    relationName: optionalString(node.alias) ?? name,
    materialized: String(config.materialized ?? ''),
    description: optionalString(node.description),
    // Model-level meta can live on node.meta or node.config.meta depending on dbt version.
    meta: {
      ...asRecord(config.meta ?? {}, `model '${uid}' config.meta`),
      ...asRecord(node.meta ?? {}, `model '${uid}' meta`)
    },
    columns: parseModelColumns(uid, node)
  }
}

type SupportedTestName = DbtColumnTest['testName']

function supportedTestName(value: unknown): SupportedTestName | null {
  return value === 'unique' || value === 'not_null' || value === 'relationships' ? value : null
}

/** Model dependencies (`model.*`) listed in a test's `depends_on.nodes`. */
function testModelDeps(node: Record<string, unknown>): string[] {
  const dependsOn = asRecord(node.depends_on ?? {}, 'test depends_on')
  const nodes = Array.isArray(dependsOn.nodes) ? dependsOn.nodes : []
  return nodes.filter((n): n is string => typeof n === 'string' && n.startsWith('model.'))
}

/**
 * Extract a supported column test from a manifest test node. Returns null for
 * tests we don't use. Relationship targets are resolved via the test's
 * `depends_on.nodes` (the model node that isn't the attached source model).
 */
function parseTestNode(
  node: Record<string, unknown>,
  allNodes: Record<string, unknown>
): DbtColumnTest | null {
  const testMeta = asRecord(node.test_metadata ?? {}, 'test_metadata')
  const testName = supportedTestName(testMeta.name)
  if (!testName) return null

  const kwargs = asRecord(testMeta.kwargs ?? {}, 'test_metadata.kwargs')
  const columnName = optionalString(node.column_name) ?? optionalString(kwargs.column_name)
  if (!columnName) return null

  // The source model is `attached_node` when present, else the first model dependency.
  const modelDeps = testModelDeps(node)
  const modelUid = optionalString(node.attached_node) ?? modelDeps[0]
  if (!modelUid) return null

  if (testName === 'relationships') {
    const toModelUid = resolveRelationshipTarget(kwargs.to, modelDeps, modelUid, allNodes)
    const toField = optionalString(kwargs.field)
    if (!toModelUid || !toField) return null
    return { testName, modelUid, columnName, toModelUid, toField }
  }

  return { testName, modelUid, columnName }
}

/**
 * Resolve the target model of a relationships test. Prefer matching the
 * `ref('name')` from kwargs against model dependencies; fall back to the model
 * dependency that isn't the source model.
 */
function resolveRelationshipTarget(
  to: unknown,
  modelDeps: string[],
  sourceUid: string,
  allNodes: Record<string, unknown>
): string | undefined {
  const otherDeps = modelDeps.filter((n) => n !== sourceUid)

  if (typeof to === 'string') {
    const match = to.match(/ref\(\s*['"]([^'"]+)['"]\s*\)/)
    const refName = match?.[1]
    if (refName) {
      const byName = otherDeps.find((uid) => {
        const node = allNodes[uid]
        return (
          typeof node === 'object' &&
          node !== null &&
          (node as Record<string, unknown>).name === refName
        )
      })
      if (byName) return byName
    }
  }

  return otherDeps[0]
}

/** Parse a catalog JSON string into per-model column type maps. */
export function parseCatalog(json: string): ParsedCatalog {
  let root: unknown
  try {
    root = JSON.parse(json)
  } catch (err) {
    throw new ArtifactError(`catalog is not valid JSON: ${(err as Error).message}`)
  }
  const catalog = asRecord(root, 'catalog')
  const nodes = asRecord(catalog.nodes ?? {}, 'catalog.nodes')

  const columnsByModel: Record<string, Record<string, string>> = {}
  for (const [uid, rawNode] of Object.entries(nodes)) {
    const node = asRecord(rawNode, `catalog.nodes['${uid}']`)
    const columns = asRecord(node.columns ?? {}, `catalog node '${uid}' columns`)
    const typeMap: Record<string, string> = {}
    for (const [colName, rawCol] of Object.entries(columns)) {
      const col = asRecord(rawCol, `catalog column '${colName}'`)
      if (typeof col.type === 'string') typeMap[colName] = col.type
    }
    columnsByModel[uid] = typeMap
  }

  return { columnsByModel }
}
