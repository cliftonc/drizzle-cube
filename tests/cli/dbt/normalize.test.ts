import { describe, expect, it } from 'vitest'
import { normalizeDbtArtifacts } from '../../../src/cli/dbt/normalize.js'
import { parseDbtArtifacts } from '../../../src/cli/dbt/parse-artifacts.js'
import type { ParsedDbtArtifacts } from '../../../src/cli/dbt/types.js'

function model(id: string, name: string, opts: Partial<{
  materialization: string
  relationName: string
  description: string
  meta: Record<string, unknown>
  columns: Record<string, { name: string; type: string; index: number; description?: string; meta?: Record<string, unknown> }>
}> = {}): [string, unknown] {
  return [id, {
    unique_id: id,
    name,
    alias: name,
    schema: 'public',
    resource_type: 'model',
    config: { materialized: opts.materialization ?? 'table' },
    relation_name: opts.relationName ?? name,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.meta ? { meta: opts.meta } : {}),
    columns: opts.columns ?? {},
  }]
}

function artifacts(models: Array<[string, unknown]>, relationships: unknown[] = []): ParsedDbtArtifacts {
  const manifest = { nodes: Object.fromEntries(models) }
  const catalog = {
    nodes: Object.fromEntries(
      models.map(([id, m]) => {
        const cols = (m as { columns?: Record<string, unknown> }).columns ?? {}
        const catalogCols = Object.fromEntries(
          Object.entries(cols).map(([k, c]) => [k, {
            name: (c as { name: string }).name,
            type: (c as { type: string }).type,
            index: (c as { index: number }).index,
          }]),
        )
        return [id, { unique_id: id, name: (m as { name: string }).name, columns: catalogCols }]
      }),
    ),
  }
  return parseArtifactsFromRaw(manifest, catalog, relationships)
}

function parseArtifactsFromRaw(manifest: unknown, catalog: unknown, relationships: unknown[]): ParsedDbtArtifacts {
  const parsed = parseDbtArtifacts(manifest, catalog)
  parsed.relationships = relationships as ParsedDbtArtifacts['relationships']
  return parsed
}

const filterSecurity = { kind: 'none' as const }
const tenantSecurity = (column = 'organisation_id') => ({
  kind: 'filter' as const,
  columnName: column,
  contextProperty: 'organisationId',
})

describe('normalizeDbtArtifacts', () => {
  it('keeps materialized models and skips ephemeral', () => {
    const a = artifacts([
      model('m.orders', 'orders', {
        columns: {
          id: { name: 'id', type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
        },
      }),
      model('m.eph', 'ephemeral_rollup', { materialization: 'ephemeral', columns: { id: { name: 'id', type: 'integer', index: 1 } } }),
    ])
    const { models, warnings } = normalizeDbtArtifacts(a, { security: filterSecurity })
    expect(models.map((m) => m.modelName)).toEqual(['orders'])
    expect(warnings.some((w) => w.code === 'MODEL_SKIPPED' && w.modelName === 'ephemeral_rollup')).toBe(true)
  })

  it('skips models with no catalog columns', () => {
    const a = artifacts([model('m.empty', 'empty', { columns: {} })])
    const { models, warnings } = normalizeDbtArtifacts(a, { security: filterSecurity })
    expect(models).toHaveLength(0)
    expect(warnings.some((w) => w.code === 'MODEL_SKIPPED' && w.modelName === 'empty')).toBe(true)
  })

  it('warns and skips unsupported column types', () => {
    const a = artifacts([
      model('m.orders', 'orders', {
        columns: {
          id: { name: 'id', type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
          blob: { name: 'blob', type: 'bytea', index: 2 },
        },
      }),
    ])
    const { models, warnings } = normalizeDbtArtifacts(a, { security: filterSecurity })
    expect(models[0].columns.map((c) => c.sqlName)).toEqual(['id'])
    expect(warnings.some((w) => w.code === 'COLUMN_SKIPPED' && w.columnName === 'blob')).toBe(true)
  })

  it('marks every composite-PK dimension primaryKey: true', () => {
    const a = artifacts([
      model('m.lines', 'order_lines', {
        columns: {
          order_id: { name: 'order_id', type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
          line_number: { name: 'line_number', type: 'integer', index: 2, meta: { drizzle_cube: { primary_key: true } } },
        },
      }),
    ])
    const { models } = normalizeDbtArtifacts(a, { security: filterSecurity })
    const pks = models[0].columns.filter((c) => c.primaryKey).map((c) => c.sqlName)
    expect(pks).toEqual(['order_id', 'line_number'])
    expect(models[0].measures[0].type).toBe('countDistinct')
  })

  it('skips a model when the configured security column is missing', () => {
    const a = artifacts([
      model('m.orders', 'orders', {
        columns: {
          id: { name: 'id', type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
        },
      }),
    ])
    const { models, warnings } = normalizeDbtArtifacts(a, { security: tenantSecurity('organisation_id') })
    expect(models).toHaveLength(0)
    const skip = warnings.find((w) => w.code === 'MODEL_SKIPPED' && w.modelName === 'orders')
    expect(skip).toBeDefined()
    expect(skip?.message).toContain('security column')
    expect(skip?.columnName).toBe('organisation_id')
  })

  it('skips a model when the security column was skipped on an unsupported type', () => {
    const a = artifacts([
      model('m.orders', 'orders', {
        columns: {
          id: { name: 'id', type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
          organisation_id: { name: 'organisation_id', type: 'bytea', index: 2 },
        },
      }),
    ])
    const { models, warnings } = normalizeDbtArtifacts(a, { security: tenantSecurity('organisation_id') })
    expect(models).toHaveLength(0)
    const skip = warnings.find((w) => w.code === 'MODEL_SKIPPED' && w.modelName === 'orders')
    expect(skip?.message).toContain('unsupported type')
    expect(warnings.some((w) => w.code === 'COLUMN_SKIPPED' && w.columnName === 'organisation_id')).toBe(true)
  })

  it('warns and skips an invalid explicit measure', () => {
    const a = artifacts([
      model('m.orders', 'orders', {
        meta: {
          drizzle_cube: {
            measures: [
              { name: 'bad', type: 'stddev', column: 'amount' }, // unsupported emit type
              { name: 'noType' }, // missing type
              { name: 'good', type: 'sum', column: 'amount' },
            ],
          },
        },
        columns: {
          id: { name: 'id', type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
          amount: { name: 'amount', type: 'numeric', index: 2 },
        },
      }),
    ])
    const { models, warnings } = normalizeDbtArtifacts(a, { security: filterSecurity })
    const measureNames = models[0].measures.map((m) => m.name)
    expect(measureNames).toContain('good')
    expect(measureNames).not.toContain('bad')
    expect(warnings.filter((w) => w.code === 'MEASURE_SKIPPED')).toHaveLength(2)
  })

  it('drops a relationship when the target model was skipped', () => {
    const a = artifacts(
      [
        model('m.orders', 'orders', {
          columns: {
            id: { name: 'id', type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
            customer_id: { name: 'customer_id', type: 'integer', index: 2 },
          },
        }),
        model('m.customers', 'customers', { materialization: 'ephemeral', columns: { id: { name: 'id', type: 'integer', index: 1 } } }),
      ],
      [{ sourceModelId: 'm.orders', targetModelId: 'm.customers', sourceColumn: 'customer_id', targetColumn: 'id' }],
    )
    const { models, warnings } = normalizeDbtArtifacts(a, { security: filterSecurity })
    const orders = models.find((m) => m.modelName === 'orders')
    expect(orders?.relationships).toHaveLength(0)
    const dropped = warnings.find((w) => w.code === 'RELATIONSHIP_DROPPED' && w.modelName === 'orders')
    expect(dropped).toBeDefined()
    expect(dropped?.message).toContain('m.customers')
  })

  it('drops a relationship when the source column was skipped', () => {
    const a = artifacts(
      [
        model('m.orders', 'orders', {
          columns: {
            id: { name: 'id', type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } },
            customer_id: { name: 'customer_id', type: 'bytea', index: 2 }, // unsupported → skipped
          },
        }),
        model('m.customers', 'customers', {
          columns: { id: { name: 'id', type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } } },
        }),
      ],
      [{ sourceModelId: 'm.orders', targetModelId: 'm.customers', sourceColumn: 'customer_id', targetColumn: 'id' }],
    )
    const { models, warnings } = normalizeDbtArtifacts(a, { security: filterSecurity })
    const orders = models.find((m) => m.modelName === 'orders')
    expect(orders?.relationships).toHaveLength(0)
    const dropped = warnings.find((w) => w.code === 'RELATIONSHIP_DROPPED' && w.modelName === 'orders')
    expect(dropped).toBeDefined()
    expect(dropped?.message).toContain('customer_id')
  })

  it('throws IDENTIFIER_COLLISION when two models map to the same cube name', () => {
    const a = artifacts([
      model('m.orders', 'orders', { columns: { id: { name: 'id', type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } } } }),
      model('m.orders2', 'Orders', { relationName: 'orders2', columns: { id: { name: 'id', type: 'integer', index: 1, meta: { drizzle_cube: { primary_key: true } } } } }),
    ])
    expect(() => normalizeDbtArtifacts(a, { security: filterSecurity })).toThrow(/IDENTIFIER_COLLISION/)
  })
})
