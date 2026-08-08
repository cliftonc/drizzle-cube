import { describe, expect, it } from 'vitest'
import manifest from '../../fixtures/dbt/postgres-simple/manifest.json'
import catalog from '../../fixtures/dbt/postgres-simple/catalog.json'
import { normalizeDbtArtifacts } from '../../../src/cli/dbt/normalize'
import { parseDbtArtifacts } from '../../../src/cli/dbt/parse-artifacts'

function normalized() {
  return normalizeDbtArtifacts(parseDbtArtifacts(manifest, catalog), { security: { kind: 'filter', columnName: 'organisation_id', contextProperty: 'organisationId' } })
}

describe('normalizeDbtArtifacts', () => {
  it('includes supported materialized models and warns/skips ephemeral models', () => {
    const result = normalized()
    expect(result.models.map((model) => model.dbtName)).toEqual(['customers', 'orders'])
    expect(result.warnings.some((warning) => warning.code === 'unsupported_materialization')).toBe(true)
  })

  it('marks primary keys and explicit measures', () => {
    const orders = normalized().models.find((model) => model.dbtName === 'orders')
    expect(orders?.columns.find((column) => column.sqlName === 'id')?.primaryKey).toBe(true)
    expect(orders?.measures).toMatchObject([{ name: 'totalAmount', type: 'sum', columnName: 'amount' }])
  })

  it('marks every column in a composite primary key', () => {
    const compositeManifest = {
      nodes: {
        'model.demo.order_lines': {
          resource_type: 'model',
          name: 'order_lines',
          alias: 'order_lines',
          config: { materialized: 'table' },
          columns: {
            order_id: { name: 'order_id', meta: { drizzle_cube: { primary_key: true } } },
            line_number: { name: 'line_number', meta: { drizzle_cube: { primary_key: true } } }
          },
          meta: {}
        }
      }
    }
    const compositeCatalog = {
      nodes: {
        'model.demo.order_lines': {
          columns: {
            order_id: { name: 'order_id', type: 'integer', index: 0 },
            line_number: { name: 'line_number', type: 'integer', index: 1 }
          }
        }
      }
    }
    const orderLines = normalizeDbtArtifacts(parseDbtArtifacts(compositeManifest, compositeCatalog), { security: { kind: 'none' } })
      .models.find((model) => model.dbtName === 'order_lines')
    const primaryKeys = orderLines?.columns.filter((column) => column.primaryKey).map((column) => column.sqlName)
    expect(primaryKeys).toEqual(['order_id', 'line_number'])
  })

  it('throws when model-level identifiers collide after sanitization', () => {
    const collisionManifest = {
      nodes: {
        'model.demo.orders_total': {
          resource_type: 'model',
          name: 'orders_total',
          alias: 'orders_total',
          config: { materialized: 'table' },
          columns: { organisation_id: { name: 'organisation_id' } },
          meta: {}
        },
        'model.demo.orders.total': {
          resource_type: 'model',
          name: 'orders.total',
          alias: 'orders.total',
          config: { materialized: 'table' },
          columns: { organisation_id: { name: 'organisation_id' } },
          meta: {}
        }
      }
    }
    const collisionCatalog = {
      nodes: {
        'model.demo.orders_total': { columns: { organisation_id: { name: 'organisation_id', type: 'integer', index: 0 } } },
        'model.demo.orders.total': { columns: { organisation_id: { name: 'organisation_id', type: 'integer', index: 0 } } }
      }
    }
    expect(() => normalizeDbtArtifacts(parseDbtArtifacts(collisionManifest, collisionCatalog), { security: { kind: 'filter', columnName: 'organisation_id', contextProperty: 'organisationId' } })).toThrow(/collide/i)
  })

  it('skips models missing configured security column', () => {
    const result = normalizeDbtArtifacts(parseDbtArtifacts(manifest, catalog), { security: { kind: 'filter', columnName: 'missing_org', contextProperty: 'organisationId' } })
    expect(result.models).toEqual([])
    expect(result.warnings.some((warning) => warning.code === 'missing_security_column')).toBe(true)
  })

  it('drops relationships when target/source columns are skipped', () => {
    const modifiedCatalog = structuredClone(catalog)
    modifiedCatalog.nodes['model.demo.orders'].columns.customer_id.type = 'inet'
    const result = normalizeDbtArtifacts(parseDbtArtifacts(manifest, modifiedCatalog), { security: { kind: 'filter', columnName: 'organisation_id', contextProperty: 'organisationId' } })
    expect(result.models.find((model) => model.dbtName === 'orders')?.relationships).toEqual([])
    expect(result.warnings.some((warning) => warning.code === 'relationship_dropped')).toBe(true)
  })
})
