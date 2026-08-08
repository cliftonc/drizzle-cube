import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseDbtArtifacts } from '../../../src/cli/dbt/parse-artifacts.js'

const FIXTURE = 'tests/fixtures/dbt/postgres-simple'

async function loadFixture() {
  const manifest = JSON.parse(await readFile(join(FIXTURE, 'manifest.json'), 'utf-8'))
  const catalog = JSON.parse(await readFile(join(FIXTURE, 'catalog.json'), 'utf-8'))
  return { manifest, catalog }
}

describe('parseDbtArtifacts', () => {
  it('extracts only model nodes', async () => {
    const { manifest, catalog } = await loadFixture()
    const { models } = parseDbtArtifacts(manifest, catalog)
    const names = Object.values(models).map((m) => m.name).sort()
    expect(names).toEqual(['customers', 'ephemeral_rollup', 'order_lines', 'orders'])
    for (const model of Object.values(models)) {
      expect(model.resourceType).toBe('model')
    }
  })

  it('merges catalog column types with manifest descriptions', async () => {
    const { manifest, catalog } = await loadFixture()
    const { models } = parseDbtArtifacts(manifest, catalog)
    const orders = models['model.demo.orders']
    expect(orders.columns.id.type).toBe('integer')
    expect(orders.columns.id.description).toBe('Order primary key.')
    expect(orders.columns.amount.type).toBe('numeric')
  })

  it('reads materialization from config.materialized (default view)', async () => {
    const { manifest, catalog } = await loadFixture()
    const { models } = parseDbtArtifacts(manifest, catalog)
    expect(models['model.demo.orders'].materialization).toBe('table')
    expect(models['model.demo.ephemeral_rollup'].materialization).toBe('ephemeral')
  })

  it('extracts a relationships test edge', async () => {
    const { manifest, catalog } = await loadFixture()
    const { relationships } = parseDbtArtifacts(manifest, catalog)
    expect(relationships).toHaveLength(1)
    expect(relationships[0]).toEqual({
      sourceModelId: 'model.demo.orders',
      targetModelId: 'model.demo.customers',
      sourceColumn: 'customer_id',
      targetColumn: 'id',
    })
  })

  it('surfaces a validation error when top-level nodes is missing', () => {
    expect(() => parseDbtArtifacts({}, {})).toThrow(/missing or non-object top-level 'nodes'/)
  })

  it('surfaces a validation error when nodes is not an object', () => {
    expect(() => parseDbtArtifacts({ nodes: [] }, { nodes: {} })).toThrow(/'nodes'/)
  })
})
