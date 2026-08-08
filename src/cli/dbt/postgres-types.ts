import type { EmittedDimensionType, GeneratorWarning, PgColumnBuilder } from './types.js'

export interface PostgresTypeMapping {
  builder: PgColumnBuilder
  dimensionType: EmittedDimensionType
  warnings?: GeneratorWarning[]
}

function normalizeType(type: string): string {
  return type.trim().toLowerCase().replace(/\s+/g, ' ').replace(/\(.+\)/, '')
}

export function mapPostgresCatalogType(type: string): PostgresTypeMapping | null {
  const normalized = normalizeType(type)
  if (normalized.endsWith('[]') || normalized.startsWith('_')) return null

  if (['smallint', 'integer', 'int', 'int2', 'int4', 'serial', 'smallserial'].includes(normalized)) {
    return { builder: 'integer', dimensionType: 'number' }
  }
  if (['bigint', 'int8', 'bigserial'].includes(normalized)) {
    return { builder: 'bigint', dimensionType: 'number' }
  }
  if (['numeric', 'decimal'].includes(normalized)) {
    return { builder: 'numeric', dimensionType: 'number' }
  }
  if (['real', 'float4'].includes(normalized)) {
    return { builder: 'real', dimensionType: 'number' }
  }
  if (['double precision', 'float8'].includes(normalized)) {
    return { builder: 'doublePrecision', dimensionType: 'number' }
  }
  if (['text', 'varchar', 'character varying', 'char', 'character', 'uuid'].includes(normalized)) {
    return { builder: 'text', dimensionType: 'string' }
  }
  if (['boolean', 'bool'].includes(normalized)) {
    return { builder: 'boolean', dimensionType: 'boolean' }
  }
  if (normalized === 'date') {
    return { builder: 'date', dimensionType: 'time' }
  }
  if (['timestamp', 'timestamp without time zone', 'timestamp with time zone', 'timestamptz', 'time'].includes(normalized)) {
    return { builder: 'timestamp', dimensionType: 'time' }
  }
  if (['json', 'jsonb'].includes(normalized)) {
    return { builder: 'jsonb', dimensionType: 'string' }
  }

  return null
}
