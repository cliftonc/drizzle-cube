import { describe, it, expect } from 'vitest'
import {
  parseManifest,
  parseCatalog,
  ArtifactError
} from '../../../src/cli/dbt/parse-artifacts'
import { fixtureManifest, fixtureCatalog } from './helpers'

describe('parseManifest', () => {
  const manifest = parseManifest(fixtureManifest('postgres-simple'))

  it('extracts model nodes (including ephemeral) but not tests/sources', () => {
    const names = manifest.models.map((m) => m.name).sort()
    expect(names).toEqual(['customers', 'orders', 'stg_orders'])
  })

  it('reads materialization, description, and columns', () => {
    const orders = manifest.models.find((m) => m.name === 'orders')!
    expect(orders.materialized).toBe('table')
    expect(orders.description).toBe('One row per order.')
    expect(orders.columns.customer_id.description).toBe('FK to the customer who placed the order.')
  })

  it('reads model-level drizzle_cube meta from config.meta', () => {
    const orders = manifest.models.find((m) => m.name === 'orders')!
    const dc = orders.meta.drizzle_cube as any
    expect(dc.measures[0]).toMatchObject({ name: 'totalAmount', type: 'sum', column: 'amount' })
  })

  it('extracts unique/not_null/relationships tests', () => {
    const rel = manifest.tests.find((t) => t.testName === 'relationships')!
    expect(rel.modelUid).toBe('model.jaffle_shop.orders')
    expect(rel.columnName).toBe('customer_id')
    expect(rel.toModelUid).toBe('model.jaffle_shop.customers')
    expect(rel.toField).toBe('id')

    const uniques = manifest.tests.filter((t) => t.testName === 'unique')
    expect(uniques.map((t) => t.modelUid).sort()).toEqual([
      'model.jaffle_shop.customers',
      'model.jaffle_shop.orders'
    ])
  })

  it('throws ArtifactError on invalid JSON', () => {
    expect(() => parseManifest('{ not json')).toThrow(ArtifactError)
  })
})

describe('parseCatalog', () => {
  const catalog = parseCatalog(fixtureCatalog('postgres-simple'))

  it('maps each model to its column types', () => {
    expect(catalog.columnsByModel['model.jaffle_shop.orders']).toMatchObject({
      id: 'integer',
      customer_id: 'integer',
      amount: 'numeric(10,2)',
      is_paid: 'boolean',
      ordered_at: 'timestamp without time zone'
    })
  })

  it('throws ArtifactError on invalid JSON', () => {
    expect(() => parseCatalog('nope')).toThrow(ArtifactError)
  })
})
