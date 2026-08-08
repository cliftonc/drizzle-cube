import { describe, expect, it } from 'vitest'
import { mapPostgresCatalogType } from '../../../src/cli/dbt/postgres-types'

describe('Postgres catalog type mapping', () => {
  it('maps supported type families', () => {
    expect(mapPostgresCatalogType('integer')).toMatchObject({ builder: 'integer', dimensionType: 'number' })
    expect(mapPostgresCatalogType('bigint')).toMatchObject({ builder: 'bigint', dimensionType: 'number' })
    expect(mapPostgresCatalogType('numeric(10,2)')).toMatchObject({ builder: 'numeric', dimensionType: 'number' })
    expect(mapPostgresCatalogType('double precision')).toMatchObject({ builder: 'doublePrecision', dimensionType: 'number' })
    expect(mapPostgresCatalogType('varchar')).toMatchObject({ builder: 'text', dimensionType: 'string' })
    expect(mapPostgresCatalogType('bool')).toMatchObject({ builder: 'boolean', dimensionType: 'boolean' })
    expect(mapPostgresCatalogType('date')).toMatchObject({ builder: 'date', dimensionType: 'time' })
    expect(mapPostgresCatalogType('timestamp with time zone')).toMatchObject({ builder: 'timestamp', dimensionType: 'time' })
    expect(mapPostgresCatalogType('jsonb')).toMatchObject({ builder: 'jsonb', dimensionType: 'string' })
  })

  it('returns null for unsupported arrays, enums, and custom types', () => {
    expect(mapPostgresCatalogType('integer[]')).toBeNull()
    expect(mapPostgresCatalogType('my_enum')).toBeNull()
    expect(mapPostgresCatalogType('inet')).toBeNull()
  })
})
