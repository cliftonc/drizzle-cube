/**
 * Internal representation (IR) for the dbt → Drizzle Cube generator.
 *
 * The pipeline is:
 *   parse-artifacts.ts  (raw dbt JSON  -> ParsedManifest / ParsedCatalog)
 *   normalize.ts        (parsed + opts -> GeneratedModel[] + warnings)
 *   emit-*.ts           (IR            -> deterministic TypeScript strings)
 *
 * Keeping the IR in its own module avoids an import cycle between the parser
 * and the normalizer, and gives the emitters a single stable contract.
 */

/** Drizzle Cube dimension type union (subset of `DimensionType` in src/server/types/core.ts). */
export type DimensionType = 'string' | 'number' | 'time' | 'boolean'

/** Measure types the generator is willing to emit in v1 (subset of `MeasureType`). */
export type GeneratedMeasureType =
  | 'count'
  | 'countDistinct'
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'

/** Drizzle `pg-core` column builder names the generator can emit. */
export type DrizzleBuilder =
  | 'integer'
  | 'real'
  | 'text'
  | 'boolean'
  | 'timestamp'
  | 'jsonb'

/** Result of mapping a single catalog type string. */
export interface PostgresTypeMapping {
  /** Drizzle `pg-core` builder, e.g. `integer`. */
  drizzleBuilder: DrizzleBuilder
  /** Drizzle Cube dimension type, e.g. `number`. */
  dimensionType: DimensionType
}

/** Tenant/organisation security filter the user opted into. */
export interface SecurityConfig {
  /** Database column name, e.g. `organisation_id`. */
  column: string
  /** Security-context property to compare against, e.g. `organisationId`. */
  context: string
}

/** A single generated schema column / cube dimension. */
export interface GeneratedColumn {
  /** Database column name, e.g. `customer_id`. */
  dbName: string
  /** Drizzle property / dimension name, e.g. `customerId`. */
  propName: string
  /** Raw catalog type string (kept for diagnostics). */
  catalogType: string
  drizzleBuilder: DrizzleBuilder
  dimensionType: DimensionType
  notNull: boolean
  primaryKey: boolean
  title: string
  description?: string
}

/** A generated measure. `count`/`countDistinct` reference the PK; others a column. */
export interface GeneratedMeasure {
  name: string
  type: GeneratedMeasureType
  /** Property of the column the measure aggregates (omitted for plain `count`). */
  columnProp?: string
  title: string
  description?: string
}

/** A direct `belongsTo` join derived from a dbt `relationships` test. */
export interface GeneratedRelationship {
  /** Join key and string `targetCube` reference (PascalCase cube name). */
  targetCube: string
  /** dbt unique_id of the target model, used for the skip-cascade. */
  targetModelUid: string
  /** Source column property on this model, e.g. `customerId`. */
  sourceColumnProp: string
  /** Target column property on the target model, e.g. `id`. */
  targetColumnProp: string
}

/** One materialized dbt model, fully resolved and ready to emit. */
export interface GeneratedModel {
  /** dbt unique_id, e.g. `model.jaffle_shop.orders`. */
  uid: string
  /** Database relation name, e.g. `orders`. */
  relationName: string
  /** Drizzle table export identifier, e.g. `orders`. */
  tableExport: string
  /** Cube name (PascalCase), e.g. `Orders`. */
  cubeName: string
  /** Exported cube const identifier, e.g. `ordersCube`. */
  cubeVar: string
  /** File name without extension under `cubes/`, e.g. `orders`. */
  fileName: string
  title: string
  description?: string
  columns: GeneratedColumn[]
  measures: GeneratedMeasure[]
  relationships: GeneratedRelationship[]
  /** Property name of the detected primary key column, if any. */
  pkColumnProp?: string
}

/** Output of the normalizer. */
export interface NormalizeResult {
  models: GeneratedModel[]
  /** Human-readable warnings (skipped models, dropped joins, unmapped types). */
  warnings: string[]
  /** Resolved security configuration, or null for the explicit no-security path. */
  security: SecurityConfig | null
}
