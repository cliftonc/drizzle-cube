import { describe, it, expect } from 'vitest'
import { mapPostgresType, normalizeCatalogType } from '../../../src/cli/dbt/postgres-types'

describe('normalizeCatalogType', () => {
  it('strips precision/scale and lowercases', () => {
    expect(normalizeCatalogType('character varying(255)')).toBe('character varying')
    expect(normalizeCatalogType('NUMERIC(10,2)')).toBe('numeric')
    expect(normalizeCatalogType('integer[]')).toBe('integer')
  })
})

describe('mapPostgresType', () => {
  it('maps integer-like types to integer/number', () => {
    for (const t of ['integer', 'int4', 'bigint', 'smallint']) {
      expect(mapPostgresType(t)).toEqual({ drizzleBuilder: 'integer', dimensionType: 'number' })
    }
  })

  it('maps numeric/float-like types to real/number', () => {
    for (const t of ['numeric(10,2)', 'decimal', 'real', 'double precision']) {
      expect(mapPostgresType(t)).toEqual({ drizzleBuilder: 'real', dimensionType: 'number' })
    }
  })

  it('maps text-like types to text/string', () => {
    for (const t of ['text', 'varchar(50)', 'character varying(255)', 'uuid']) {
      expect(mapPostgresType(t)).toEqual({ drizzleBuilder: 'text', dimensionType: 'string' })
    }
  })

  it('maps boolean to boolean/boolean', () => {
    expect(mapPostgresType('boolean')).toEqual({ drizzleBuilder: 'boolean', dimensionType: 'boolean' })
    expect(mapPostgresType('bool')).toEqual({ drizzleBuilder: 'boolean', dimensionType: 'boolean' })
  })

  it('maps timestamp/date/time types to timestamp/time', () => {
    for (const t of ['timestamp without time zone', 'timestamptz', 'date', 'time']) {
      expect(mapPostgresType(t)).toEqual({ drizzleBuilder: 'timestamp', dimensionType: 'time' })
    }
  })

  it('maps json/jsonb to jsonb/string', () => {
    expect(mapPostgresType('jsonb')).toEqual({ drizzleBuilder: 'jsonb', dimensionType: 'string' })
  })

  it('returns null for unsupported types', () => {
    expect(mapPostgresType('point')).toBeNull()
    expect(mapPostgresType('geometry')).toBeNull()
    expect(mapPostgresType('tsvector')).toBeNull()
  })
})
