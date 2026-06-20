import { describe, expect, it } from 'vitest'
import { mapPostgresCatalogType } from '../../../src/cli/dbt/postgres-types.js'

describe('postgres-types', () => {
  describe('integer family', () => {
    it.each(['smallint', 'integer', 'int', 'int4', 'serial', 'smallserial'])(
      'maps %s to integer builder with number dimension',
      (t) => {
        const m = mapPostgresCatalogType(t)
        expect(m).not.toBeNull()
        expect(m?.builder).toBe('integer')
        expect(m?.dimensionType).toBe('number')
      },
    )
  })

  describe('bigint family', () => {
    it.each(['bigint', 'int8', 'bigserial'])('maps %s to bigint with mode number', (t) => {
      const m = mapPostgresCatalogType(t)
      expect(m).not.toBeNull()
      expect(m?.builder).toBe('bigint')
      expect(m?.dimensionType).toBe('number')
      expect(m?.builderArgs).toBe("{ mode: 'number' }")
    })
  })

  it('strips parens/length args before matching', () => {
    expect(mapPostgresCatalogType('character varying(255)')?.builder).toBe('text')
    expect(mapPostgresCatalogType('numeric(10,2)')?.builder).toBe('numeric')
  })

  it('maps numeric/decimal to numeric builder with number dimension', () => {
    const m = mapPostgresCatalogType('numeric')
    expect(m?.builder).toBe('numeric')
    expect(m?.dimensionType).toBe('number')
  })

  it('maps real/float4 to real builder', () => {
    expect(mapPostgresCatalogType('real')?.builder).toBe('real')
    expect(mapPostgresCatalogType('float4')?.builder).toBe('real')
  })

  it('maps double precision/float8 to doublePrecision builder', () => {
    expect(mapPostgresCatalogType('double precision')?.builder).toBe('doublePrecision')
    expect(mapPostgresCatalogType('float8')?.builder).toBe('doublePrecision')
  })

  describe('text family', () => {
    it.each(['text', 'varchar', 'character varying', 'char', 'character', 'uuid'])(
      'maps %s to text builder with string dimension',
      (t) => {
        const m = mapPostgresCatalogType(t)
        expect(m?.builder).toBe('text')
        expect(m?.dimensionType).toBe('string')
      },
    )
  })

  it('maps boolean/bool to boolean builder', () => {
    expect(mapPostgresCatalogType('boolean')?.builder).toBe('boolean')
    expect(mapPostgresCatalogType('boolean')?.dimensionType).toBe('boolean')
    expect(mapPostgresCatalogType('bool')?.builder).toBe('boolean')
  })

  describe('time family', () => {
    it.each(['timestamp', 'timestamp without time zone', 'timestamp with time zone', 'timestamptz'])(
      'maps %s to timestamp builder with time dimension',
      (t) => {
        const m = mapPostgresCatalogType(t)
        expect(m?.builder).toBe('timestamp')
        expect(m?.dimensionType).toBe('time')
      },
    )
    it('maps date to date builder with time dimension', () => {
      const m = mapPostgresCatalogType('date')
      expect(m?.builder).toBe('date')
      expect(m?.dimensionType).toBe('time')
    })
  })

  it('maps json/jsonb to jsonb builder with string dimension', () => {
    expect(mapPostgresCatalogType('json')?.builder).toBe('jsonb')
    expect(mapPostgresCatalogType('jsonb')?.dimensionType).toBe('string')
  })

  describe('unsupported types return null (warn-and-skip)', () => {
    it.each([
      'integer[]',
      'text[]',
      'bytea',
      'interval',
      'money',
      'geometry',
      'inet',
      'cidr',
      'some_custom_type',
      'enum_status',
      'unknown_thing',
    ])('returns null for %s', (t) => {
      expect(mapPostgresCatalogType(t)).toBeNull()
    })
  })
})
