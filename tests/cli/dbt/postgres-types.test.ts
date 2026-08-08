import { describe, expect, it } from 'vitest'
import { mapPostgresCatalogType } from '../../../src/cli/dbt/postgres-types.js'

describe('mapPostgresCatalogType', () => {
  describe('supported integer-like types', () => {
    const cases: Array<[string, string]> = [
      ['smallint', 'integer'],
      ['integer', 'integer'],
      ['int', 'integer'],
      ['int4', 'integer'],
      ['serial', 'integer'],
      ['smallserial', 'integer'],
    ]
    for (const [input, builder] of cases) {
      it(`maps ${input} → ${builder} / number`, () => {
        const mapping = mapPostgresCatalogType(input)
        expect(mapping).not.toBeNull()
        expect(mapping?.builder).toBe(builder)
        expect(mapping?.dimensionType).toBe('number')
      })
    }
  })

  it('maps bigint with mode:number', () => {
    const mapping = mapPostgresCatalogType('bigint')
    expect(mapping?.builder).toBe('bigint')
    expect(mapping?.dimensionType).toBe('number')
    expect(mapping?.builderArgs).toBe("{ mode: 'number' }")
  })

  it('maps numeric and decimal to numeric / number', () => {
    expect(mapPostgresCatalogType('numeric')?.builder).toBe('numeric')
    expect(mapPostgresCatalogType('decimal')?.builder).toBe('numeric')
  })

  it('maps floating point types', () => {
    expect(mapPostgresCatalogType('real')?.builder).toBe('real')
    expect(mapPostgresCatalogType('float4')?.builder).toBe('real')
    expect(mapPostgresCatalogType('double precision')?.builder).toBe('doublePrecision')
    expect(mapPostgresCatalogType('float8')?.builder).toBe('doublePrecision')
  })

  it('strips length args (varchar(255) → text)', () => {
    expect(mapPostgresCatalogType('varchar(255)')?.builder).toBe('text')
    expect(mapPostgresCatalogType('character varying')?.builder).toBe('text')
    expect(mapPostgresCatalogType('uuid')?.dimensionType).toBe('string')
  })

  it('maps boolean', () => {
    expect(mapPostgresCatalogType('boolean')?.builder).toBe('boolean')
    expect(mapPostgresCatalogType('bool')?.dimensionType).toBe('boolean')
  })

  it('maps time types', () => {
    expect(mapPostgresCatalogType('timestamp')?.builder).toBe('timestamp')
    expect(mapPostgresCatalogType('timestamptz')?.dimensionType).toBe('time')
    expect(mapPostgresCatalogType('date')?.builder).toBe('date')
  })

  it('maps json/jsonb to jsonb / string', () => {
    expect(mapPostgresCatalogType('jsonb')?.builder).toBe('jsonb')
    expect(mapPostgresCatalogType('json')?.dimensionType).toBe('string')
  })

  describe('unsupported types return null (warn-and-skip)', () => {
    const unsupported = [
      'integer[]',
      'text[]',
      'bytea',
      'interval',
      'money',
      'geometry',
      'cidr',
      'inet',
      'enum_mood',
      'user_defined_type',
      'something-wierd',
    ]
    for (const input of unsupported) {
      it(`returns null for ${input}`, () => {
        expect(mapPostgresCatalogType(input)).toBeNull()
      })
    }
  })
})
