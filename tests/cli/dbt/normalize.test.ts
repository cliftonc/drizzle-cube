import { describe, expect, it } from 'vitest'
import { loadGeneratorConfig } from '../../../src/cli/dbt/config.js'
import { loadDbtArtifacts } from '../../../src/cli/dbt/parse-artifacts.js'
import { normalizeDbtArtifacts } from '../../../src/cli/dbt/normalize.js'

const fixtureDir = 'tests/fixtures/dbt/postgres-simple'

async function normalize(security = { mode: 'column' as const, column: 'organisation_id', context: 'organisationId' }) {
  const artifacts = await loadDbtArtifacts(`${fixtureDir}/manifest.json`, `${fixtureDir}/catalog.json`)
  return normalizeDbtArtifacts({ artifacts, dialect: 'postgres', security, config: {} })
}

describe('dbt normalization', () => {
  it('normalizes materialized models, columns, measures, and joins', async () => {
    const { models, warnings } = await normalize()
    expect(warnings).toContainEqual({ message: 'Skipping non-materialized dbt model order_rollup_ephemeral (ephemeral).' })
    expect(models.map((model) => model.cubeName)).toEqual(['Customers', 'Orders'])
    const customers = models[0]
    const orders = models[1]
    expect(customers.primaryKeyColumn?.dbName).toBe('id')
    expect(customers.columns.map((column) => [column.propertyName, column.dimensionType, column.description])).toContainEqual(['createdAt', 'time', 'Customer creation timestamp.'])
    expect(orders.measures.map((measure) => [measure.name, measure.type, measure.columnPropertyName])).toEqual([
      ['count', 'countDistinct', 'id'],
      ['totalAmount', 'sum', 'amount'],
    ])
    expect(orders.joins).toEqual([
      expect.objectContaining({ targetCubeName: 'Customers', sourceColumnPropertyName: 'customerId', targetColumnPropertyName: 'id', relationship: 'belongsTo' }),
    ])
  })

  it('applies config measures and validates security columns', async () => {
    const artifacts = await loadDbtArtifacts(`${fixtureDir}/manifest.json`, `${fixtureDir}/catalog.json`)
    const config = await loadGeneratorConfig(`${fixtureDir}/config-security.json`)
    const { models } = normalizeDbtArtifacts({ artifacts, dialect: 'postgres', security: config.security!, config })
    expect(models.find((model) => model.dbtName === 'orders')?.measures.map((measure) => measure.name)).toEqual(['count', 'averageAmount', 'totalAmount'])
    expect(() => normalizeDbtArtifacts({ artifacts, dialect: 'postgres', security: { mode: 'column', column: 'missing_org', context: 'orgId' }, config: {} })).toThrow('missing security column missing_org')
  })

  it('detects primary keys and not-null columns from standard manifest test nodes', async () => {
    const artifacts = await loadDbtArtifacts(`${fixtureDir}/manifest.json`, `${fixtureDir}/catalog.json`)
    const manifest = JSON.parse(JSON.stringify(artifacts.manifest)) as typeof artifacts.manifest
    for (const id of ['model.project.customers', 'model.project.orders']) {
      delete manifest.nodes[id].constraints
      for (const column of Object.values(manifest.nodes[id].columns ?? {})) delete column.tests
    }
    manifest.nodes['test.project.unique_customers_id'] = {
      unique_id: 'test.project.unique_customers_id',
      resource_type: 'test',
      name: 'unique_customers_id',
      test_metadata: { name: 'unique', kwargs: { column_name: 'id' } },
      depends_on: { nodes: ['model.project.customers'] },
      attached_node: 'model.project.customers',
      column_name: 'id',
    }
    manifest.nodes['test.project.not_null_customers_id'] = {
      unique_id: 'test.project.not_null_customers_id',
      resource_type: 'test',
      name: 'not_null_customers_id',
      test_metadata: { name: 'not_null', kwargs: { column_name: 'id' } },
      depends_on: { nodes: ['model.project.customers'] },
      attached_node: 'model.project.customers',
      column_name: 'id',
    }
    manifest.nodes['test.project.unique_orders_id'] = {
      unique_id: 'test.project.unique_orders_id',
      resource_type: 'test',
      name: 'unique_orders_id',
      test_metadata: { name: 'unique', kwargs: { column_name: 'id' } },
      depends_on: { nodes: ['model.project.orders'] },
      attached_node: 'model.project.orders',
      column_name: 'id',
    }
    manifest.nodes['test.project.not_null_orders_id'] = {
      unique_id: 'test.project.not_null_orders_id',
      resource_type: 'test',
      name: 'not_null_orders_id',
      test_metadata: { name: 'not_null', kwargs: { column_name: 'id' } },
      depends_on: { nodes: ['model.project.orders'] },
      attached_node: 'model.project.orders',
      column_name: 'id',
    }
    manifest.nodes['test.project.not_null_orders_organisation_id'] = {
      unique_id: 'test.project.not_null_orders_organisation_id',
      resource_type: 'test',
      name: 'not_null_orders_organisation_id',
      test_metadata: { name: 'not_null', kwargs: { column_name: 'organisation_id' } },
      depends_on: { nodes: ['model.project.orders'] },
      attached_node: 'model.project.orders',
      column_name: 'organisation_id',
    }

    const { models } = normalizeDbtArtifacts({ artifacts: { manifest, catalog: artifacts.catalog }, dialect: 'postgres', security: { mode: 'none' }, config: {} })
    const orders = models.find((model) => model.dbtName === 'orders')!
    expect(orders.primaryKeyColumn?.dbName).toBe('id')
    expect(orders.measures.find((measure) => measure.name === 'count')).toMatchObject({ type: 'countDistinct', columnPropertyName: 'id' })
    expect(orders.columns.find((column) => column.dbName === 'organisation_id')?.notNull).toBe(true)
  })

  it('supports no-security mode', async () => {
    const artifacts = await loadDbtArtifacts(`${fixtureDir}/manifest.json`, `${fixtureDir}/catalog.json`)
    const { models, warnings } = normalizeDbtArtifacts({ artifacts, dialect: 'postgres', security: { mode: 'none' }, config: {} })
    expect(models).toHaveLength(2)
    expect(warnings).toContainEqual({ message: 'No cube-level security filters will be generated. Use only for public or single-tenant data.' })
  })
})
