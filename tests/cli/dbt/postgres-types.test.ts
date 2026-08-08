import { describe, expect, it } from 'vitest'
import { DbtGenerateError } from '../../../src/cli/dbt/errors.js'
import { mapPostgresCatalogType } from '../../../src/cli/dbt/postgres-types.js'

const cases: Array<[string, string, string | undefined, string]> = [
  ['smallint', 'integer', 'number', "integer('c')"],
  ['int2', 'integer', 'number', "integer('c')"],
  ['integer', 'integer', 'number', "integer('c')"],
  ['int', 'integer', 'number', "integer('c')"],
  ['int4', 'integer', 'number', "integer('c')"],
  ['serial', 'integer', 'number', "integer('c')"],
  ['serial4', 'integer', 'number', "integer('c')"],
  ['bigint', 'bigint', 'number', "bigint('c', { mode: 'number' })"],
  ['int8', 'bigint', 'number', "bigint('c', { mode: 'number' })"],
  ['bigserial', 'bigint', 'number', "bigint('c', { mode: 'number' })"],
  ['serial8', 'bigint', 'number', "bigint('c', { mode: 'number' })"],
  ['numeric', 'numeric', 'number', "numeric('c')"],
  ['decimal', 'numeric', 'number', "numeric('c')"],
  ['money', 'numeric', 'number', "numeric('c')"],
  ['real', 'real', 'number', "real('c')"],
  ['float4', 'real', 'number', "real('c')"],
  ['double precision', 'doublePrecision', 'number', "doublePrecision('c')"],
  ['float8', 'doublePrecision', 'number', "doublePrecision('c')"],
  ['text', 'text', 'string', "text('c')"],
  ['varchar', 'text', 'string', "text('c')"],
  ['character varying', 'text', 'string', "text('c')"],
  ['character', 'text', 'string', "text('c')"],
  ['char', 'text', 'string', "text('c')"],
  ['uuid', 'text', 'string', "text('c')"],
  ['boolean', 'boolean', 'boolean', "boolean('c')"],
  ['bool', 'boolean', 'boolean', "boolean('c')"],
  ['timestamp', 'timestamp', 'time', "timestamp('c')"],
  ['timestamp without time zone', 'timestamp', 'time', "timestamp('c')"],
  ['timestamp with time zone', 'timestamp', 'time', "timestamp('c')"],
  ['timestamptz', 'timestamp', 'time', "timestamp('c')"],
  ['date', 'date', 'time', "date('c')"],
  ['time', 'time', 'time', "time('c')"],
  ['time without time zone', 'time', 'time', "time('c')"],
  ['time with time zone', 'time', 'time', "time('c')"],
  ['timetz', 'time', 'time', "time('c')"],
  ['json', 'jsonb', undefined, "jsonb('c')"],
  ['jsonb', 'jsonb', undefined, "jsonb('c')"],
]

describe('Postgres catalog type mapping', () => {
  it.each(cases)('maps %s', (input, drizzleImport, dimensionType, expression) => {
    const mapping = mapPostgresCatalogType(input)
    expect(mapping.drizzleImport).toBe(drizzleImport)
    expect(mapping.dimensionType).toBe(dimensionType)
    expect(mapping.builderExpression("'c'")).toBe(expression)
  })

  it('strips length and precision suffixes', () => {
    expect(mapPostgresCatalogType('varchar(255)').drizzleImport).toBe('text')
    expect(mapPostgresCatalogType('numeric(10,2)').drizzleImport).toBe('numeric')
  })

  it('supports overrides and fails unsupported types', () => {
    expect(mapPostgresCatalogType('citext', { citext: { drizzleBuilder: 'text', dimensionType: 'string' } }).drizzleImport).toBe('text')
    expect(() => mapPostgresCatalogType('inet')).toThrow(DbtGenerateError)
  })
})
