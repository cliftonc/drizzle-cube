/**
 * Postgres catalog type → Drizzle `pg-core` builder mapping.
 *
 * Returns the builder name + cube dimension type for a supported catalog type,
 * or `null` for anything the generator does not support. Callers must
 * warn-and-skip columns that map to `null` — this module never returns a
 * placeholder `text` for an unknown type (a wrong column is worse than a
 * visible gap, per `src/cli/CLAUDE.md`).
 */
import type { GeneratorWarning } from './types.js'

export interface PostgresTypeMapping {
  builder: string
  dimensionType: 'string' | 'number' | 'time' | 'boolean'
  builderArgs?: string
  warnings?: GeneratorWarning[]
}

/** Normalize a catalog type string for matching: lowercase, strip parens/args. */
function normalizeType(raw: string): string {
  return raw.trim().toLowerCase().replace(/\(.*\)/g, '').trim()
}

/**
 * Map a Postgres catalog column type to a Drizzle builder + cube dimension
 * type, or `null` if unsupported.
 *
 * Supported families (verified against installed `drizzle-orm` pg-core types):
 * - integer-like: `smallint`, `integer`, `int`, `int4`, `serial`, `smallserial`
 * - big integer-like: `bigint`, `int8`, `bigserial` (`{ mode: 'number' }`)
 * - numeric/decimal: `numeric`, `decimal` (string runtime values; cube `number`)
 * - floating: `real`/`float4`, `double precision`/`float8`
 * - text: `text`, `varchar`, `character varying`, `char`, `character`, `uuid`
 * - boolean: `boolean`, `bool`
 * - time: `timestamp`, `timestamptz`, `time` → `timestamp`; `date` → `date`
 * - JSON: `json`, `jsonb` (cube dimension `string`)
 *
 * Returns `null` for arrays (`[]` suffix), enums, geometry, network types,
 * user-defined/custom types, `bytea`, `interval`, `money`, and unknowns.
 */
export function mapPostgresCatalogType(type: string): PostgresTypeMapping | null {
  const normalized = normalizeType(type)

  // Arrays (e.g. `integer[]`) and custom/enum types are unsupported in v1.
  if (normalized.endsWith('[]')) return null

  // Integer-like (32-bit and smaller).
  if (
    normalized === 'smallint' ||
    normalized === 'integer' ||
    normalized === 'int' ||
    normalized === 'int4' ||
    normalized === 'serial' ||
    normalized === 'smallserial'
  ) {
    return { builder: 'integer', dimensionType: 'number' }
  }

  // Big integers — emit `bigint('col', { mode: 'number' })` for JS-number
  // ergonomics. Verified to compile against installed drizzle-orm.
  if (
    normalized === 'bigint' ||
    normalized === 'int8' ||
    normalized === 'bigserial'
  ) {
    return {
      builder: 'bigint',
      dimensionType: 'number',
      builderArgs: "{ mode: 'number' }",
    }
  }

  // Numeric/decimal — Drizzle stores these as strings by default; the cube
  // dimension is `number` so analytics treat them numerically. Documented
  // limitation in docs/dbt-generate.md.
  if (normalized === 'numeric' || normalized === 'decimal') {
    return { builder: 'numeric', dimensionType: 'number' }
  }

  // Floating point.
  if (normalized === 'real' || normalized === 'float4') {
    return { builder: 'real', dimensionType: 'number' }
  }
  if (normalized === 'double precision' || normalized === 'float8') {
    return { builder: 'doublePrecision', dimensionType: 'number' }
  }

  // Text family.
  if (
    normalized === 'text' ||
    normalized === 'varchar' ||
    normalized === 'character varying' ||
    normalized === 'char' ||
    normalized === 'character' ||
    normalized === 'uuid'
  ) {
    return { builder: 'text', dimensionType: 'string' }
  }

  // Booleans.
  if (normalized === 'boolean' || normalized === 'bool') {
    return { builder: 'boolean', dimensionType: 'boolean' }
  }

  // Time family.
  if (
    normalized === 'timestamp' ||
    normalized === 'timestamp without time zone' ||
    normalized === 'timestamp with time zone' ||
    normalized === 'timestamptz' ||
    normalized === 'time'
  ) {
    return { builder: 'timestamp', dimensionType: 'time' }
  }
  if (normalized === 'date') {
    return { builder: 'date', dimensionType: 'time' }
  }

  // JSON — no cube dimension type beyond string in v1.
  if (normalized === 'json' || normalized === 'jsonb') {
    return { builder: 'jsonb', dimensionType: 'string' }
  }

  // Explicitly unsupported: bytea, interval, money, geometry, network types,
  // enums, custom/user-defined types, and anything unrecognized.
  return null
}
