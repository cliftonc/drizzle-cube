import { describe, it, expect } from 'vitest'
import { parseManifest, parseCatalog } from '../../../src/cli/dbt/parse-artifacts'
import type { ParsedManifest, ParsedCatalog } from '../../../src/cli/dbt/parse-artifacts'
import { normalize } from '../../../src/cli/dbt/normalize'
import type { SecurityConfig } from '../../../src/cli/dbt/types'
import { fixtureManifest, fixtureCatalog } from './helpers'

const security: SecurityConfig = { column: 'organisation_id', context: 'organisationId' }

function run(opts: { security: SecurityConfig | null } = { security }) {
  const manifest = parseManifest(fixtureManifest('postgres-simple'))
  const catalog = parseCatalog(fixtureCatalog('postgres-simple'))
  return normalize(manifest, catalog, opts)
}

describe('normalize — model selection', () => {
  it('includes only materialized models (skips ephemeral silently)', () => {
    const { models, warnings } = run()
    expect(models.map((m) => m.cubeName)).toEqual(['Customers', 'Orders'])
    // ephemeral stg_orders is skipped without a warning
    expect(warnings.some((w) => w.includes('stg_orders'))).toBe(false)
  })

  it('builds columns from the catalog with mapped types and titles', () => {
    const orders = run().models.find((m) => m.cubeName === 'Orders')!
    const amount = orders.columns.find((c) => c.dbName === 'amount')!
    expect(amount).toMatchObject({
      propName: 'amount',
      drizzleBuilder: 'real',
      dimensionType: 'number',
      title: 'Amount'
    })
    const orderedAt = orders.columns.find((c) => c.dbName === 'ordered_at')!
    expect(orderedAt.dimensionType).toBe('time')
    const customerId = orders.columns.find((c) => c.dbName === 'customer_id')!
    expect(customerId.propName).toBe('customerId')
  })

  it('sorts columns deterministically by db name', () => {
    const orders = run().models.find((m) => m.cubeName === 'Orders')!
    expect(orders.columns.map((c) => c.dbName)).toEqual([
      'amount',
      'customer_id',
      'id',
      'is_paid',
      'ordered_at',
      'organisation_id'
    ])
  })
})

describe('normalize — primary key detection', () => {
  it('marks id as PK from unique + not_null tests', () => {
    const orders = run().models.find((m) => m.cubeName === 'Orders')!
    const id = orders.columns.find((c) => c.dbName === 'id')!
    expect(id.primaryKey).toBe(true)
    expect(id.notNull).toBe(true)
    expect(orders.pkColumnProp).toBe('id')
  })

  it('does not mark a PK when tests are absent', () => {
    // Strip the orders id tests by hand-rolling a minimal artifact set.
    const manifest: ParsedManifest = {
      models: [
        {
          uniqueId: 'model.p.widgets',
          name: 'widgets',
          relationName: 'widgets',
          materialized: 'table',
          meta: {},
          columns: {}
        }
      ],
      tests: []
    }
    const catalog: ParsedCatalog = {
      columnsByModel: { 'model.p.widgets': { id: 'integer', label: 'text' } }
    }
    const { models } = normalize(manifest, catalog, { security: null })
    expect(models[0].pkColumnProp).toBeUndefined()
    expect(models[0].columns.find((c) => c.dbName === 'id')!.primaryKey).toBe(false)
  })
})

describe('normalize — measures', () => {
  it('emits countDistinct over the PK when known', () => {
    const orders = run().models.find((m) => m.cubeName === 'Orders')!
    const count = orders.measures.find((m) => m.name === 'count')!
    expect(count).toMatchObject({ type: 'countDistinct', columnProp: 'id' })
  })

  it('emits a plain count when no PK is known', () => {
    const manifest: ParsedManifest = {
      models: [
        {
          uniqueId: 'model.p.events',
          name: 'events',
          relationName: 'events',
          materialized: 'table',
          meta: {},
          columns: {}
        }
      ],
      tests: []
    }
    const catalog: ParsedCatalog = { columnsByModel: { 'model.p.events': { label: 'text' } } }
    const { models } = normalize(manifest, catalog, { security: null })
    expect(models[0].measures[0]).toMatchObject({ name: 'count', type: 'count' })
    expect(models[0].measures[0].columnProp).toBeUndefined()
  })

  it('emits explicit declared measures from drizzle_cube meta', () => {
    const orders = run().models.find((m) => m.cubeName === 'Orders')!
    const total = orders.measures.find((m) => m.name === 'totalAmount')!
    expect(total).toMatchObject({
      type: 'sum',
      columnProp: 'amount',
      title: 'Total Amount',
      description: 'Sum of all order amounts.'
    })
  })

  it('ignores a declared sum on a non-numeric column with a warning', () => {
    const manifest: ParsedManifest = {
      models: [
        {
          uniqueId: 'model.p.t',
          name: 't',
          relationName: 't',
          materialized: 'table',
          meta: { drizzle_cube: { measures: [{ name: 'bad', type: 'sum', column: 'label' }] } },
          columns: {}
        }
      ],
      tests: []
    }
    const catalog: ParsedCatalog = { columnsByModel: { 'model.p.t': { label: 'text' } } }
    const { models, warnings } = normalize(manifest, catalog, { security: null })
    expect(models[0].measures.find((m) => m.name === 'bad')).toBeUndefined()
    expect(warnings.some((w) => w.includes("'bad'") && w.includes('numeric'))).toBe(true)
  })
})

describe('normalize — relationships', () => {
  it('builds a belongsTo join from a relationships test', () => {
    const orders = run().models.find((m) => m.cubeName === 'Orders')!
    expect(orders.relationships).toHaveLength(1)
    expect(orders.relationships[0]).toMatchObject({
      targetCube: 'Customers',
      sourceColumnProp: 'customerId',
      targetColumnProp: 'id'
    })
  })
})

describe('normalize — security', () => {
  it('keeps models that have the security column', () => {
    const { models, security: resolved } = run({ security })
    expect(models.map((m) => m.cubeName)).toEqual(['Customers', 'Orders'])
    expect(resolved).toEqual(security)
  })

  it('skips a model missing the security column and drops dangling joins (cascade)', () => {
    const manifest: ParsedManifest = {
      models: [
        {
          uniqueId: 'model.p.orders',
          name: 'orders',
          relationName: 'orders',
          materialized: 'table',
          meta: {},
          columns: {}
        },
        {
          uniqueId: 'model.p.customers',
          name: 'customers',
          relationName: 'customers',
          materialized: 'table',
          meta: {},
          columns: {}
        }
      ],
      tests: [
        {
          testName: 'relationships',
          modelUid: 'model.p.orders',
          columnName: 'customer_id',
          toModelUid: 'model.p.customers',
          toField: 'id'
        }
      ]
    }
    const catalog: ParsedCatalog = {
      columnsByModel: {
        // orders has the security column, customers does NOT
        'model.p.orders': { id: 'integer', customer_id: 'integer', organisation_id: 'integer' },
        'model.p.customers': { id: 'integer' }
      }
    }
    const { models, warnings } = normalize(manifest, catalog, { security })
    expect(models.map((m) => m.cubeName)).toEqual(['Orders'])
    // the orders->customers join must be dropped so no dangling string targetCube remains
    expect(models[0].relationships).toHaveLength(0)
    expect(warnings.some((w) => w.includes('missing security column'))).toBe(true)
    expect(warnings.some((w) => w.includes('Dropped join'))).toBe(true)
  })

  it('no-security mode keeps all models regardless of columns', () => {
    const { models } = run({ security: null })
    expect(models.map((m) => m.cubeName)).toEqual(['Customers', 'Orders'])
  })
})

describe('normalize — unsupported types', () => {
  it('skips a model with an unmappable column type and warns', () => {
    const manifest: ParsedManifest = {
      models: [
        {
          uniqueId: 'model.p.geo',
          name: 'geo',
          relationName: 'geo',
          materialized: 'table',
          meta: {},
          columns: {}
        }
      ],
      tests: []
    }
    const catalog: ParsedCatalog = {
      columnsByModel: { 'model.p.geo': { id: 'integer', shape: 'geometry' } }
    }
    const { models, warnings } = normalize(manifest, catalog, { security: null })
    expect(models).toHaveLength(0)
    expect(warnings.some((w) => w.includes('geometry'))).toBe(true)
  })
})

describe('normalize — determinism', () => {
  it('produces identical output across runs', () => {
    expect(JSON.stringify(run())).toBe(JSON.stringify(run()))
  })
})
