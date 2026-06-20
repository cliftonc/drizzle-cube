/**
 * Shared runtime types for the dbt artifact → Drizzle Cube generator.
 *
 * These types are intentionally structural and use string unions rather than
 * importing dbt's own (unavailable) types. Artifact values flow through
 * local type guards in `parse-artifacts.ts` (over `unknown`) before being
 * assigned to any of these — no `as any` is used anywhere in this pipeline.
 */

/**
 * Supported security modes.
 *
 * - `filter`: row-level isolation via an `eq` on a tenant/organisation column
 *   bound to a `securityContext` property.
 * - `none`: the user explicitly opted out of cube-level security.
 */
export type SecurityMode =
  | { kind: 'filter'; columnName: string; contextProperty: string }
  | { kind: 'none' }

/**
 * Options accepted by the generator pipeline. Built by the CLI command module
 * (`commands/dbt.ts`) from flags / prompt and passed into `generateFromDbt`.
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
  /** Optional path to a JSON config file (reserved for v1; not fully wired). */
  configPath?: string
}

/**
 * A structured warning emitted by the parser/normalizer/emitter. Warnings are
 * always surfaced to the user (stderr) and never silently dropped.
 */
export interface GeneratorWarning {
  code: string
  message: string
  modelName?: string
  columnName?: string
}

/**
 * A file the generator intends to write, with its path expressed relative to
 * the output directory using POSIX separators.
 */
export interface GeneratedFile {
  /** POSIX path relative to `outDir`. */
  path: string
  content: string
}

/** dbt materializations the generator emits schema/cubes for. */
export type SupportedMaterialization = 'table' | 'view' | 'incremental'

/** A dbt relationship test extracted from manifest test nodes. */
export interface DbtRelationshipTest {
  /** dbt unique id of the source model (e.g. `model.project.orders`). */
  sourceModelId: string
  /** dbt unique id of the target model. */
  targetModelId: string
  /** SQL name of the source column (may be empty if unresolvable). */
  sourceColumn: string
  /** SQL name of the target column (may be empty if unresolvable). */
  targetColumn: string
}

/** A column as parsed from manifest + catalog. */
export interface DbtColumn {
  /** SQL column name (lowercased by dbt in catalog). */
  name: string
  /** Postgres catalog type string, e.g. `integer`, `character varying(255)`. */
  type: string
  /** 1-based index from the catalog, used for deterministic ordering. */
  index: number
  /** Comment from catalog, if present. */
  comment?: string
  /** Description from manifest, if present. */
  description?: string
  /** Manifest meta for the column, if present. */
  meta?: Record<string, unknown>
}

/** A model as parsed from manifest + catalog (before normalization). */
export interface DbtModel {
  /** dbt unique id, e.g. `model.project.orders`. */
  uniqueId: string
  /** dbt model name. */
  name: string
  /** dbt alias (falls back to name). */
  alias: string
  /** dbt schema. */
  schema: string
  /** dbt database. */
  database?: string
  /** Resource type — only `model` resources are emitted. */
  resourceType: string
  /** Materialization from `config.materialized`. */
  materialization: string
  /** Relation name, e.g. `"public"."orders"`. */
  relationName: string
  /** Model description. */
  description?: string
  /** Model-level meta. */
  meta?: Record<string, unknown>
  /** Columns keyed by SQL name. */
  columns: Record<string, DbtColumn>
}

/** The parsed artifact set (pure data — no file handles). */
export interface ParsedDbtArtifacts {
  /** Materialized model resources keyed by unique id. */
  models: Record<string, DbtModel>
  /** Relationship tests derived from manifest test nodes. */
  relationships: DbtRelationshipTest[]
}

/** A normalized column ready for emission. */
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

/** A normalized measure ready for emission. */
export interface GeneratedMeasure {
  name: string
  title: string
  type: string
  sql?: string
  description?: string
  format?: string
}

/** A normalized `belongsTo` relationship ready for emission. */
export interface GeneratedRelationship {
  sourceCube: string
  targetCube: string
  relationship: 'belongsTo'
  on: Array<{ sourceColumn: string; targetColumn: string }>
}

/** A fully normalized model ready for emission. */
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
  /** Property name on the table object used for the security `where`, if any. */
  securityPropertyName?: string
}

/**
 * Result of writing generated output to disk. In `--check` and `--dry-run`
 * modes, `missing` lists expected files absent from disk and `orphaned`
 * lists on-disk generated files no longer expected, so callers can surface
 * the full drift picture rather than just a boolean.
 */
export interface WriteResult {
  created: string[]
  updated: string[]
  deleted: string[]
  conflicts: string[]
  /** `--check`/`--dry-run`: expected files absent from disk. */
  missing: string[]
  /** `--check`/`--dry-run`: on-disk generated files no longer expected. */
  orphaned: string[]
  /** True when `--check` found drift (changed/missing/conflicting/orphaned). */
  drift: boolean
}

/** Context passed to emitters for stable header generation. */
export interface EmitContext {
  manifestPath: string
  catalogPath: string
  dialect: 'postgres'
  security: SecurityMode
}

/** The complete result of a generation run. */
export interface GenerationResult {
  files: GeneratedFile[]
  write: WriteResult
  warnings: GeneratorWarning[]
}
