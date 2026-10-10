import { describe, expect, it } from 'vitest'
import manifest from '../../fixtures/dbt/postgres-simple/manifest.json'
import catalog from '../../fixtures/dbt/postgres-simple/catalog.json'
import { parseDbtArtifacts } from '../../../src/cli/dbt/parse-artifacts'

const emptyCatalog = { nodes: {} }

describe('parseDbtArtifacts', () => {
  it('extracts models and catalog columns from dbt artifacts', () => {
    const parsed = parseDbtArtifacts(manifest, catalog)
    expect(parsed.models.map((model) => model.name)).toEqual(['customers', 'orders', 'order_lines', 'ephemeral_rollup'])
    expect(parsed.catalogNodes.get('model.demo.orders')?.columns.map((column) => column.name)).toContain('amount')
  })

  it('reads relationships tests from test_metadata.kwargs, using attached_node as the source', () => {
    // depends_on.nodes is sorted, so the target (customers) comes before the source (orders).
    const parsed = parseDbtArtifacts(manifest, catalog)
    expect(parsed.relationships.map(({ sourceModelId, sourceColumn, targetModelId, targetColumn }) => ({ sourceModelId, sourceColumn, targetModelId, targetColumn }))).toEqual(expect.arrayContaining([
      { sourceModelId: 'model.demo.orders', sourceColumn: 'customer_id', targetModelId: 'model.demo.customers', targetColumn: 'id' },
      { sourceModelId: 'model.demo.orders', sourceColumn: 'referred_by_customer_id', targetModelId: 'model.demo.customers', targetColumn: 'id' },
      { sourceModelId: 'model.demo.order_lines', sourceColumn: 'order_id', targetModelId: 'model.demo.orders', targetColumn: 'id' },
      { sourceModelId: 'model.demo.customers', sourceColumn: 'parent_customer_id', targetModelId: 'model.demo.customers', targetColumn: 'id' }
    ]))
    expect(parsed.relationships).toHaveLength(4)
    expect(parsed.warnings).toEqual([])
  })

  it('attributes column tests to the attached model', () => {
    const parsed = parseDbtArtifacts(manifest, catalog)
    const orders = parsed.models.find((model) => model.name === 'orders')
    const customers = parsed.models.find((model) => model.name === 'customers')
    expect(orders?.testsByColumn.id).toEqual(['unique', 'not_null'])
    expect(customers?.testsByColumn.customer_id).toBeUndefined()
  })

  it('reads composite keys from unique_combination_of_columns tests', () => {
    const orderLines = parseDbtArtifacts(manifest, catalog).models.find((model) => model.name === 'order_lines')
    expect(orderLines?.primaryKeyColumns).toEqual(['order_id', 'line_number'])
  })

  it('reads keys from model and column primary_key constraints', () => {
    const constrained = {
      nodes: {
        'model.demo.a': { resource_type: 'model', name: 'a', constraints: [{ type: 'primary_key', columns: ['x', 'y'] }], columns: {} },
        'model.demo.b': { resource_type: 'model', name: 'b', constraints: [], columns: { id: { name: 'id', constraints: [{ type: 'primary_key' }] } } }
      }
    }
    const models = parseDbtArtifacts(constrained, emptyCatalog).models
    expect(models.map((model) => model.primaryKeyColumns)).toEqual([['x', 'y'], ['id']])
  })

  it('still accepts kwargs on the test node itself', () => {
    const legacy = {
      nodes: {
        'model.demo.orders': { resource_type: 'model', name: 'orders', columns: {} },
        'model.demo.customers': { resource_type: 'model', name: 'customers', columns: {} },
        'test.demo.rel': {
          resource_type: 'test',
          column_name: 'customer_id',
          attached_node: 'model.demo.orders',
          test_metadata: { name: 'relationships' },
          kwargs: { to: "ref('customers')", field: 'id' },
          depends_on: { nodes: ['model.demo.customers', 'model.demo.orders'] }
        }
      }
    }
    expect(parseDbtArtifacts(legacy, emptyCatalog).relationships).toMatchObject([{ sourceModelId: 'model.demo.orders', targetModelId: 'model.demo.customers' }])
  })

  it('warns about relationships it cannot resolve, such as source() targets', () => {
    const withSource = {
      nodes: {
        'model.demo.orders': { resource_type: 'model', name: 'orders', columns: {} },
        'test.demo.rel': {
          resource_type: 'test',
          column_name: 'account_id',
          attached_node: 'model.demo.orders',
          test_metadata: { name: 'relationships', kwargs: { to: "source('crm', 'accounts')", field: 'id' } },
          depends_on: { nodes: ['model.demo.orders', 'source.demo.crm.accounts'] }
        }
      }
    }
    const parsed = parseDbtArtifacts(withSource, emptyCatalog)
    expect(parsed.relationships).toEqual([])
    expect(parsed.warnings).toMatchObject([{ code: 'relationship_unresolved' }])
  })

  it('throws on malformed top-level nodes', () => {
    expect(() => parseDbtArtifacts({}, catalog)).toThrow('manifest.json must contain a top-level nodes object')
    expect(() => parseDbtArtifacts(manifest, {})).toThrow('catalog.json must contain a top-level nodes object')
  })
})
