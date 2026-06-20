import { describe, expect, it } from 'vitest'
import { parseDbtArtifacts } from '../../../src/cli/dbt/parse-artifacts.js'

function modelNode(name: string, materialized: string, extra: Record<string, unknown> = {}) {
  return {
    resource_type: 'model',
    name,
    alias: name,
    schema: 'public',
    database: 'demo',
    relation_name: `"public"."${name}"`,
    config: { materialized },
    meta: {},
    columns: {},
    ...extra,
  }
}

describe('parse-artifacts', () => {
  it('extracts materialized model resources', () => {
    const manifest = {
      nodes: {
        'model.demo.orders': modelNode('orders', 'table'),
        'model.demo.ephemeral': modelNode('ephemeral', 'ephemeral'),
      },
    }
    const catalog = {
      nodes: {
        'model.demo.orders': {
          columns: { id: { name: 'id', type: 'integer', index: 1 } },
        },
      },
    }
    const { models } = parseDbtArtifacts(manifest, catalog)
    // The parser keeps all models; the normalizer filters by materialization.
    expect(Object.keys(models).sort()).toEqual(['model.demo.ephemeral', 'model.demo.orders'])
    expect(models['model.demo.orders'].materialization).toBe('table')
    expect(models['model.demo.orders'].columns['id'].type).toBe('integer')
  })

  it('merges manifest descriptions with catalog types', () => {
    const manifest = {
      nodes: {
        'model.demo.orders': {
          ...modelNode('orders', 'table'),
          columns: {
            id: { name: 'id', description: 'Order identifier.' },
          },
        },
      },
    }
    const catalog = {
      nodes: {
        'model.demo.orders': {
          columns: { id: { name: 'id', type: 'integer', index: 1 } },
        },
      },
    }
    const { models } = parseDbtArtifacts(manifest, catalog)
    expect(models['model.demo.orders'].columns['id'].description).toBe('Order identifier.')
    expect(models['model.demo.orders'].columns['id'].type).toBe('integer')
  })

  it('extracts relationships tests via test_metadata.name and field kwarg', () => {
    const manifest = {
      nodes: {
        'model.demo.orders': modelNode('orders', 'table'),
        'model.demo.customers': modelNode('customers', 'table'),
        'test.demo.relationships_orders_customer_id': {
          resource_type: 'test',
          column_name: 'customer_id',
          attached_node: 'model.demo.orders',
          depends_on: { nodes: ['model.demo.orders', 'model.demo.customers'] },
          test_metadata: {
            name: 'relationships',
            kwargs: {
              to: { name: 'to', value: "ref('customers')" },
              field: { name: 'field', value: 'id' },
            },
          },
        },
      },
    }
    const catalog = {
      nodes: {
        'model.demo.orders': { columns: { id: { name: 'id', type: 'integer', index: 1 } } },
        'model.demo.customers': { columns: { id: { name: 'id', type: 'integer', index: 1 } } },
      },
    }
    const { relationships } = parseDbtArtifacts(manifest, catalog)
    expect(relationships).toHaveLength(1)
    expect(relationships[0]).toMatchObject({
      sourceModelId: 'model.demo.orders',
      targetModelId: 'model.demo.customers',
      sourceColumn: 'customer_id',
      targetColumn: 'id',
    })
  })

  it('extracts relationships tests via direct-map kwargs', () => {
    const manifest = {
      nodes: {
        'model.demo.orders': modelNode('orders', 'table'),
        'model.demo.customers': modelNode('customers', 'table'),
        'test.demo.rel2': {
          resource_type: 'test',
          column_name: 'customer_id',
          attached_node: 'model.demo.orders',
          depends_on: { nodes: ['model.demo.orders', 'model.demo.customers'] },
          test_metadata: { name: 'relationships', kwargs: { field: 'id' } },
        },
      },
    }
    const catalog = { nodes: {} }
    const { relationships } = parseDbtArtifacts(manifest, catalog)
    expect(relationships[0].targetColumn).toBe('id')
  })

  it('throws on missing top-level nodes in manifest', () => {
    expect(() => parseDbtArtifacts({ notNodes: {} }, { nodes: {} })).toThrow(/manifest/)
  })

  it('throws on missing top-level nodes in catalog', () => {
    expect(() => parseDbtArtifacts({ nodes: {} }, { notNodes: {} })).toThrow(/catalog/)
  })

  it('throws on malformed (non-object) manifest', () => {
    expect(() => parseDbtArtifacts('not-an-object', { nodes: {} })).toThrow(/manifest/)
  })
})
