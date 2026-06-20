import { describe, expect, it } from 'vitest'
import { normalizeDbtArtifacts } from '../../../src/cli/dbt/normalize.js'
import type { ParsedDbtArtifacts, SecurityMode } from '../../../src/cli/dbt/types.js'

const FILTER_SECURITY: SecurityMode = {
  kind: 'filter',
  columnName: 'organisation_id',
  contextProperty: 'organisationId',
}

function makeModel(opts: {
  id: string
  name: string
  materialization: string
  columns: Record<string, { type: string; index: number; meta?: Record<string, unknown> }>
  description?: string
  meta?: Record<string, unknown>
}): ParsedDbtArtifacts['models'][string] {
  return {
    uniqueId: opts.id,
    name: opts.name,
    alias: opts.name,
    schema: 'public',
    database: 'demo',
    resourceType: 'model',
    materialization: opts.materialization,
    relationName: `"public"."${opts.name}"`,
    description: opts.description,
    meta: opts.meta,
    columns: Object.fromEntries(
      Object.entries(opts.columns).map(([k, v]) => [
        k,
        { name: k, type: v.type, index: v.index, meta: v.meta },
      ]),
    ),
  }
}

describe('normalize', () => {
  it('includes materialized models and skips ephemeral', () => {
    const artifacts: ParsedDbtArtifacts = {
      models: {
        'model.demo.orders': makeModel({
          id: 'model.demo.orders',
          name: 'orders',
          materialization: 'table',
          columns: {
            id: { type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
            organisation_id: { type: 'integer', index: 2 },
          },
        }),
        'model.demo.ephemeral_rollup': makeModel({
          id: 'model.demo.ephemeral_rollup',
          name: 'ephemeral_rollup',
          materialization: 'ephemeral',
          columns: { id: { type: 'integer', index: 1 } },
        }),
      },
      relationships: [],
    }
    const { models, warnings } = normalizeDbtArtifacts(artifacts, { security: FILTER_SECURITY })
    expect(models.map((m) => m.modelName)).toEqual(['orders'])
    expect(warnings.some((w) => w.code === 'MODEL_SKIPPED' && w.modelName === 'ephemeral_rollup')).toBe(true)
  })

  it('warns and skips unsupported column types while keeping the model', () => {
    const artifacts: ParsedDbtArtifacts = {
      models: {
        'model.demo.orders': makeModel({
          id: 'model.demo.orders',
          name: 'orders',
          materialization: 'table',
          columns: {
            id: { type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
            organisation_id: { type: 'integer', index: 2 },
            blob: { type: 'bytea', index: 3 },
          },
        }),
      },
      relationships: [],
    }
    const { models, warnings } = normalizeDbtArtifacts(artifacts, { security: FILTER_SECURITY })
    expect(models).toHaveLength(1)
    expect(models[0].columns.map((c) => c.sqlName)).not.toContain('blob')
    expect(warnings.some((w) => w.code === 'COLUMN_SKIPPED' && w.columnName === 'blob')).toBe(true)
  })

  it('skips a model when the configured security column is missing', () => {
    const artifacts: ParsedDbtArtifacts = {
      models: {
        'model.demo.orders': makeModel({
          id: 'model.demo.orders',
          name: 'orders',
          materialization: 'table',
          columns: {
            id: { type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
          },
        }),
      },
      relationships: [],
    }
    const { models, warnings } = normalizeDbtArtifacts(artifacts, { security: FILTER_SECURITY })
    expect(models).toHaveLength(0)
    expect(warnings.some((w) => w.code === 'MODEL_SKIPPED' && w.modelName === 'orders')).toBe(true)
  })

  it('marks every composite-PK column primaryKey and emits countDistinct baseline', () => {
    const artifacts: ParsedDbtArtifacts = {
      models: {
        'model.demo.order_lines': makeModel({
          id: 'model.demo.order_lines',
          name: 'order_lines',
          materialization: 'table',
          columns: {
            order_id: { type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
            line_number: { type: 'integer', index: 2, meta: { drizzle_cube: { primary_key: true } } },
            organisation_id: { type: 'integer', index: 3 },
          },
        }),
      },
      relationships: [],
    }
    const { models } = normalizeDbtArtifacts(artifacts, { security: FILTER_SECURITY })
    const model = models[0]
    const pkDims = model.columns.filter((c) => c.primaryKey)
    expect(pkDims.map((c) => c.sqlName).sort()).toEqual(['line_number', 'order_id'])
    const count = model.measures.find((m) => m.name === 'count')
    expect(count?.type).toBe('countDistinct')
    // Composite PK count is encoded for the emitter as concat_ws:<props>.
    expect(count?.sql).toMatch(/^concat_ws:/)
  })

  it('emits countDistinct on a single-PK column reference', () => {
    const artifacts: ParsedDbtArtifacts = {
      models: {
        'model.demo.customers': makeModel({
          id: 'model.demo.customers',
          name: 'customers',
          materialization: 'table',
          columns: {
            id: { type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
            organisation_id: { type: 'integer', index: 2 },
          },
        }),
      },
      relationships: [],
    }
    const { models } = normalizeDbtArtifacts(artifacts, { security: FILTER_SECURITY })
    const count = models[0].measures.find((m) => m.name === 'count')
    expect(count?.type).toBe('countDistinct')
    expect(count?.sql).toBe('Customers.id')
  })

  it('throws on identifier collision across two models', () => {
    // `orders.total` and `orders_total` both PascalCase to `OrdersTotal`.
    const artifacts: ParsedDbtArtifacts = {
      models: {
        'model.demo.orders_total': makeModel({
          id: 'model.demo.orders_total',
          name: 'orders_total',
          materialization: 'table',
          columns: {
            id: { type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
            organisation_id: { type: 'integer', index: 2 },
          },
        }),
        'model.demo.orders.total': makeModel({
          id: 'model.demo.orders.total',
          name: 'orders.total',
          materialization: 'table',
          columns: {
            id: { type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
            organisation_id: { type: 'integer', index: 2 },
          },
        }),
      },
      relationships: [],
    }
    expect(() => normalizeDbtArtifacts(artifacts, { security: FILTER_SECURITY })).toThrow(
      /Identifier collision/,
    )
  })

  it('warns and skips invalid explicit measure metadata', () => {
    const artifacts: ParsedDbtArtifacts = {
      models: {
        'model.demo.orders': makeModel({
          id: 'model.demo.orders',
          name: 'orders',
          materialization: 'table',
          columns: {
            id: { type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
            organisation_id: { type: 'integer', index: 2 },
            amount: { type: 'numeric', index: 3 },
            status: { type: 'text', index: 4 },
          },
          meta: {
            drizzle_cube: {
              measures: [
                { name: 'badType', type: 'unsupportedType', column: 'amount' },
                { name: 'missingColumn', type: 'sum' },
                { name: 'nonNumeric', type: 'sum', column: 'status' },
                { name: 'goodSum', type: 'sum', column: 'amount' },
              ],
            },
          },
        }),
      },
      relationships: [],
    }
    const { models, warnings } = normalizeDbtArtifacts(artifacts, { security: FILTER_SECURITY })
    const model = models[0]
    expect(model.measures.map((m) => m.name)).toContain('goodSum')
    expect(model.measures.map((m) => m.name)).not.toContain('badType')
    expect(model.measures.map((m) => m.name)).not.toContain('missingColumn')
    expect(model.measures.map((m) => m.name)).not.toContain('nonNumeric')
    expect(warnings.filter((w) => w.code === 'MEASURE_SKIPPED')).toHaveLength(3)
  })

  it('drops a relationship when the target model was skipped', () => {
    const artifacts: ParsedDbtArtifacts = {
      models: {
        'model.demo.orders': makeModel({
          id: 'model.demo.orders',
          name: 'orders',
          materialization: 'table',
          columns: {
            id: { type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
            organisation_id: { type: 'integer', index: 2 },
            customer_id: { type: 'integer', index: 3 },
          },
        }),
        // customers is ephemeral → skipped, so the relationship is dropped.
        'model.demo.customers': makeModel({
          id: 'model.demo.customers',
          name: 'customers',
          materialization: 'ephemeral',
          columns: { id: { type: 'integer', index: 1 } },
        }),
      },
      relationships: [
        {
          sourceModelId: 'model.demo.orders',
          targetModelId: 'model.demo.customers',
          sourceColumn: 'customer_id',
          targetColumn: 'id',
        },
      ],
    }
    const { models, warnings } = normalizeDbtArtifacts(artifacts, { security: FILTER_SECURITY })
    const orders = models.find((m) => m.modelName === 'orders')
    expect(orders?.relationships).toHaveLength(0)
    const dropped = warnings.find((w) => w.code === 'RELATIONSHIP_DROPPED')
    expect(dropped).toBeDefined()
    expect(dropped?.modelName).toBe('orders')
    expect(dropped?.message).toContain('model.demo.customers')
  })

  it('drops a relationship when the source column was skipped (unsupported type)', () => {
    const artifacts: ParsedDbtArtifacts = {
      models: {
        'model.demo.orders': makeModel({
          id: 'model.demo.orders',
          name: 'orders',
          materialization: 'table',
          columns: {
            id: { type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
            organisation_id: { type: 'integer', index: 2 },
            // customer_id has an unsupported type → column skipped → join dropped.
            customer_id: { type: 'bytea', index: 3 },
          },
        }),
        'model.demo.customers': makeModel({
          id: 'model.demo.customers',
          name: 'customers',
          materialization: 'table',
          columns: {
            id: { type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
            organisation_id: { type: 'integer', index: 2 },
          },
        }),
      },
      relationships: [
        {
          sourceModelId: 'model.demo.orders',
          targetModelId: 'model.demo.customers',
          sourceColumn: 'customer_id',
          targetColumn: 'id',
        },
      ],
    }
    const { models, warnings } = normalizeDbtArtifacts(artifacts, { security: FILTER_SECURITY })
    const orders = models.find((m) => m.modelName === 'orders')
    expect(orders?.relationships).toHaveLength(0)
    expect(warnings.some((w) => w.code === 'COLUMN_SKIPPED' && w.columnName === 'customer_id')).toBe(true)
    const dropped = warnings.find((w) => w.code === 'RELATIONSHIP_DROPPED')
    expect(dropped).toBeDefined()
    expect(dropped?.columnName).toBe('customer_id')
  })

  it('skips a model whose security column was skipped (unsupported type)', () => {
    const artifacts: ParsedDbtArtifacts = {
      models: {
        'model.demo.orders': makeModel({
          id: 'model.demo.orders',
          name: 'orders',
          materialization: 'table',
          columns: {
            id: { type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
            // organisation_id has an unsupported type → skipped → model skipped.
            organisation_id: { type: 'bytea', index: 2 },
          },
        }),
      },
      relationships: [],
    }
    const { models, warnings } = normalizeDbtArtifacts(artifacts, { security: FILTER_SECURITY })
    expect(models.map((m) => m.modelName)).not.toContain('orders')
    const skipped = warnings.find(
      (w) => w.code === 'MODEL_SKIPPED' && w.modelName === 'orders',
    )
    expect(skipped).toBeDefined()
    expect(skipped?.message).toContain('organisation_id')
    expect(skipped?.message).toMatch(/unsupported type/)
  })

  it('builds a belongsTo relationship when both endpoints resolve', () => {
    const artifacts: ParsedDbtArtifacts = {
      models: {
        'model.demo.orders': makeModel({
          id: 'model.demo.orders',
          name: 'orders',
          materialization: 'table',
          columns: {
            id: { type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
            organisation_id: { type: 'integer', index: 2 },
            customer_id: { type: 'integer', index: 3 },
          },
        }),
        'model.demo.customers': makeModel({
          id: 'model.demo.customers',
          name: 'customers',
          materialization: 'table',
          columns: {
            id: { type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
            organisation_id: { type: 'integer', index: 2 },
          },
        }),
      },
      relationships: [
        {
          sourceModelId: 'model.demo.orders',
          targetModelId: 'model.demo.customers',
          sourceColumn: 'customer_id',
          targetColumn: 'id',
        },
      ],
    }
    const { models } = normalizeDbtArtifacts(artifacts, { security: FILTER_SECURITY })
    const orders = models.find((m) => m.modelName === 'orders')
    expect(orders?.relationships).toHaveLength(1)
    expect(orders?.relationships[0]).toMatchObject({
      sourceCube: 'Orders',
      targetCube: 'Customers',
      relationship: 'belongsTo',
    })
  })
})
