/**
 * Postgres catalog type → Drizzle pg-core builder + cube dimension type.
 *
 * Unsupported types return `null` — callers must **warn-and-skip** the column.
 * Never returns a placeholder `text` (a wrong column is worse than a visible
 * gap).
 */

import type { GeneratorWarning } from './types.js'

export interface PostgresTypeMapping {
  builder: string
  dimensionType: 'string' | 'number' | 'time' | 'boolean'
  builderArgs?: string
  warnings?: GeneratorWarning[]
}

/** Lowercase + strip `(...)` args so `varchar(255)` → `varchar`. */
function normalizeType(type: string): string {
  return type.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim()
}

/**
 * Map a Postgres catalog type to a Drizzle builder + cube dimension type.
 * Returns `null` for anything v1 does not support (arrays, enums, geometry,
 * network, `bytea`, `interval`, `money`, user-defined/custom, unknown).
 */
export function mapPostgresCatalogType(type: string): PostgresTypeMapping | null {
  const normalized = normalizeType(type)

  // Arrays / custom / user-defined are out of scope for v1.
  if (normalized.endsWith('[]')) return null

  switch (normalized) {
    // integer-like
    case 'smallint':
    case 'integer':
    case 'int':
    case 'int4':
    case 'serial':
    case 'smallserial':
      return { builder: 'integer', dimensionType: 'number' }

    // big integer-like — Drizzle bigint needs a mode arg
    case 'bigint':
    case 'int8':
    case 'bigserial':
      return {
        builder: 'bigint',
        dimensionType: 'number',
        builderArgs: "{ mode: 'number' }",
      }

    // numeric/decimal — Drizzle stores strings; cube dimension is `number`
    case 'numeric':
    case 'decimal':
      return { builder: 'numeric', dimensionType: 'number' }

    // floating point
    case 'real':
    case 'float4':
      return { builder: 'real', dimensionType: 'number' }
    case 'double precision':
    case 'float8':
      return { builder: 'doublePrecision', dimensionType: 'number' }

    // text-like
    case 'text':
    case 'varchar':
    case 'character varying':
    case 'char':
    case 'character':
    case 'uuid':
      return { builder: 'text', dimensionType: 'string' }

    // boolean
    case 'boolean':
    case 'bool':
      return { builder: 'boolean', dimensionType: 'boolean' }

    // time
    case 'timestamp':
    case 'timestamp without time zone':
    case 'timestamp with time zone':
    case 'timestamptz':
      return { builder: 'timestamp', dimensionType: 'time' }
    case 'date':
      return { builder: 'date', dimensionType: 'time' }

    // JSON
    case 'json':
    case 'jsonb':
      return { builder: 'jsonb', dimensionType: 'string' }

    default:
      // enums, geometry, network, bytea, interval, money, unknown, custom
      return null
  }
}
