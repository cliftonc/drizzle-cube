/**
 * Map dbt `catalog.json` Postgres type strings to a Drizzle `pg-core` column
 * builder and a Drizzle Cube dimension type.
 *
 * v1 supports a documented, tested subset of common Postgres types. Anything
 * outside the subset returns `null`; the normalizer then skips the owning model
 * with a warning (per the maintainer's failure policy) rather than guessing.
 */

import type { PostgresTypeMapping } from './types.js'

/**
 * Reduce a raw catalog type to a comparable base token: lowercased, with any
 * length/precision/scale suffix and array brackets stripped.
 * e.g. `character varying(255)` -> `character varying`, `numeric(10,2)` -> `numeric`.
 */
export function normalizeCatalogType(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\[\]/g, '')
    .replace(/\([^)]*\)/g, '')
    .trim()
}

const INTEGER_TYPES = new Set([
  'integer',
  'int',
  'int4',
  'bigint',
  'int8',
  'smallint',
  'int2'
])

const NUMERIC_TYPES = new Set([
  'numeric',
  'decimal',
  'real',
  'float4',
  'double precision',
  'float8',
  'float'
])

const TEXT_TYPES = new Set([
  'text',
  'varchar',
  'character varying',
  'char',
  'character',
  'bpchar',
  'uuid',
  'citext'
])

const BOOLEAN_TYPES = new Set(['boolean', 'bool'])

const TIME_TYPES = new Set([
  'timestamp',
  'timestamp without time zone',
  'timestamp with time zone',
  'timestamptz',
  'date',
  'time',
  'time without time zone',
  'time with time zone'
])

const JSON_TYPES = new Set(['json', 'jsonb'])

/**
 * Resolve a catalog type to a Drizzle builder + dimension type, or `null` if the
 * type is unsupported in v1.
 */
export function mapPostgresType(rawType: string): PostgresTypeMapping | null {
  const base = normalizeCatalogType(rawType)

  if (INTEGER_TYPES.has(base)) return { drizzleBuilder: 'integer', dimensionType: 'number' }
  if (NUMERIC_TYPES.has(base)) return { drizzleBuilder: 'real', dimensionType: 'number' }
  if (TEXT_TYPES.has(base)) return { drizzleBuilder: 'text', dimensionType: 'string' }
  if (BOOLEAN_TYPES.has(base)) return { drizzleBuilder: 'boolean', dimensionType: 'boolean' }
  if (TIME_TYPES.has(base)) return { drizzleBuilder: 'timestamp', dimensionType: 'time' }
  if (JSON_TYPES.has(base)) return { drizzleBuilder: 'jsonb', dimensionType: 'string' }

  return null
}
