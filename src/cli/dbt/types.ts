/**
 * Shared runtime types for the dbt-artifact → Drizzle schema/cube generator.
 *
 * No `as any` lives here or in any module that consumes these types. Values
 * parsed from untrusted dbt JSON are narrowed through the local guards in
 * `parse-artifacts.ts` before being assigned to these interfaces.
 */

/**
 * Security mode chosen by the user (flag, prompt, or explicit opt-out).
 *
 * `filter` applies a cube-level `where` equating a tenant column to a
 * property of the query security context. `none` is an *intentional* opt-out
 * (empty prompt answer or `--no-security`) — never an inferred default.
 */
export type SecurityMode =
  | { kind: 'filter'; columnName: string; contextProperty: string }
  | { kind: 'none' }

/**
 * Fully-resolved options for `generateFromDbt`. The command module
 * (`commands/dbt.ts`) is responsible for producing this from argv + prompt.
 */
export interface DbtGenerateOptions {
  manifestPath: string
  catalogPath: string
  dialect: 'postgres'
  outDir: string
  security: SecurityMode
  dryRun: boolean
  check: boolean
  force: boolean
  /** Reserved for a future config-file path; v1 does not read it. */
  configPath?: string
}

/**
 * A warning surfaced to the user. Every unsupported/skipped input produces
 * one — the generator never silently drops output.
 */
export interface GeneratorWarning {
  code: string
  message: string
  modelName?: string
  columnName?: string
}

/**
 * A generated file. `path` is POSIX, relative to the output directory.
 */
export interface GeneratedFile {
  path: string
  content: string
}

export type SupportedMaterialization = 'table' | 'view' | 'incremental'

/**
 * A dbt `relationships` test edge, normalized to source/target model ids +
 * columns. Only direct `belongsTo` edges are derived from these.
 */
export interface DbtRelationshipTest {
  sourceModelId: string
  targetModelId: string
  sourceColumn: string
  targetColumn: string
}

/**
 * A dbt catalog column (authoritative for the column set + types).
 */
export interface DbtColumn {
  name: string
  type: string
  index: number
  comment?: string
  description?: string
  meta?: Record<string, unknown>
}

/**
 * A dbt model node, merged with its catalog entry.
 */
export interface DbtModel {
  uniqueId: string
  name: string
  alias: string
  schema: string
  database?: string
  resourceType: string
  materialization: string
  relationName: string
  description?: string
  meta?: Record<string, unknown>
  columns: Record<string, DbtColumn>
}

export interface ParsedDbtArtifacts {
  models: Record<string, DbtModel>
  relationships: DbtRelationshipTest[]
}

/**
 * A normalized column ready for emission.
 */
export interface GeneratedColumn {
  sqlName: string
  propertyName: string
  title: string
  description?: string
  builder: string
  builderArgs?: string
  dimensionType: 'string' | 'number' | 'time' | 'boolean'
  primaryKey: boolean
  notNull: boolean
}

/**
 * A normalized measure ready for emission.
 */
export interface GeneratedMeasure {
  name: string
  title: string
  type: string
  /** Column property the measure aggregates, when applicable. */
  sql?: string
  description?: string
  format?: string
  /**
   * For composite-PK baseline `countDistinct`: a rendered `concat_ws:`
   * expression marker consumed by the cube emitter. Absent for normal
   * measures.
   */
  compositeSql?: string
}

/**
 * A normalized `belongsTo` join between two kept models.
 */
export interface GeneratedRelationship {
  sourceCube: string
  targetCube: string
  relationship: 'belongsTo'
  on: Array<{ sourceColumn: string; targetColumn: string }>
}

/**
 * A fully normalized model ready for schema + cube emission.
 */
export interface GeneratedModel {
  dbtUniqueId: string
  modelName: string
  relationName: string
  materialization: string
  tableExport: string
  cubeName: string
  cubeExport: string
  fileName: string
  title: string
  description?: string
  columns: GeneratedColumn[]
  measures: GeneratedMeasure[]
  relationships: GeneratedRelationship[]
  securityPropertyName?: string
}

/**
 * Result of writing (or dry-run/checking) generated files.
 *
 * `missing` (expected files absent from disk) and `orphaned` (on-disk
 * generated files no longer expected) are populated in `--check`/`--dry-run`
 * so callers surface the *full* drift picture, including removals.
 */
export interface WriteResult {
  created: string[]
  updated: string[]
  deleted: string[]
  conflicts: string[]
  missing: string[]
  orphaned: string[]
  drift: boolean
}

/**
 * Context threaded through the emitters. Carries the info baked into file
 * headers + the security decision that shapes cube `sql` functions.
 */
export interface EmitContext {
  manifestPath: string
  catalogPath: string
  dialect: 'postgres'
  security: SecurityMode
}

export interface GenerationResult {
  files: GeneratedFile[]
  write: WriteResult
  warnings: GeneratorWarning[]
}
