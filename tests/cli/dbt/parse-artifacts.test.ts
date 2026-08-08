import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getModelNodes, getPrimaryKeyCandidates, getRelationshipTests, isMaterializedModel, loadDbtArtifacts } from '../../../src/cli/dbt/parse-artifacts.js'
import type { DbtManifest } from '../../../src/cli/dbt/types.js'

const fixtureDir = 'tests/fixtures/dbt/postgres-simple'

describe('dbt artifact parsing', () => {
  it('loads artifacts and selects materialized models', async () => {
    const { manifest, catalog } = await loadDbtArtifacts(`${fixtureDir}/manifest.json`, `${fixtureDir}/catalog.json`)
    expect(Object.keys(catalog.nodes)).toContain('model.project.orders')
    const models = getModelNodes(manifest)
    expect(models.map((model) => model.name).sort()).toEqual(['customers', 'order_rollup_ephemeral', 'orders'])
    expect(models.filter(isMaterializedModel).map((model) => model.name).sort()).toEqual(['customers', 'orders'])
    expect(isMaterializedModel({ resource_type: 'model', name: 'v', config: { materialized: 'view' } })).toBe(true)
    expect(isMaterializedModel({ resource_type: 'model', name: 'i', config: { materialized: 'incremental' } })).toBe(true)
    expect(isMaterializedModel({ resource_type: 'model', name: 'mv', config: { materialized: 'materialized_view' } })).toBe(true)
    expect(isMaterializedModel({ resource_type: 'model', name: 'e', config: { materialized: 'ephemeral' } })).toBe(false)
  })

  it('extracts relationship tests', async () => {
    const { manifest } = await loadDbtArtifacts(`${fixtureDir}/manifest.json`, `${fixtureDir}/catalog.json`)
    expect(getRelationshipTests(manifest)).toEqual([
      {
        sourceModelId: 'model.project.orders',
        targetModelId: 'model.project.customers',
        sourceColumn: 'customer_id',
        targetColumn: 'id',
      },
    ])
  })

  it('detects primary key candidates from attached unique and not_null test nodes', () => {
    const manifest: DbtManifest = {
      nodes: {
        'model.project.orders': {
          unique_id: 'model.project.orders',
          resource_type: 'model',
          name: 'orders',
          config: { materialized: 'table' },
          columns: {
            id: { name: 'id' },
            status: { name: 'status' },
          },
        },
        'test.project.unique_orders_id': {
          unique_id: 'test.project.unique_orders_id',
          resource_type: 'test',
          name: 'unique_orders_id',
          test_metadata: { name: 'unique', kwargs: { column_name: 'id' } },
          depends_on: { nodes: ['model.project.orders'] },
          attached_node: 'model.project.orders',
          column_name: 'id',
        },
        'test.project.not_null_orders_id': {
          unique_id: 'test.project.not_null_orders_id',
          resource_type: 'test',
          name: 'not_null_orders_id',
          test_metadata: { name: 'not_null', kwargs: { column_name: 'id' } },
          depends_on: { nodes: ['model.project.orders'] },
          attached_node: 'model.project.orders',
          column_name: 'id',
        },
        'test.project.not_null_orders_status': {
          unique_id: 'test.project.not_null_orders_status',
          resource_type: 'test',
          name: 'not_null_orders_status',
          test_metadata: { name: 'not_null', kwargs: { column_name: 'status' } },
          depends_on: { nodes: ['model.project.orders'] },
          attached_node: 'model.project.orders',
          column_name: 'status',
        },
      },
    }

    expect(getPrimaryKeyCandidates(manifest, 'model.project.orders')).toEqual(['id'])
  })

  it('wraps malformed JSON and missing nodes errors with paths', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'dbt-parse-'))
    const bad = join(dir, 'manifest.json')
    const missing = join(dir, 'catalog.json')
    await writeFile(bad, '{')
    await writeFile(missing, '{}')
    await expect(loadDbtArtifacts(bad, missing)).rejects.toThrow(bad)
    await writeFile(bad, '{}')
    await expect(loadDbtArtifacts(bad, missing)).rejects.toThrow('manifest.json')
  })
})
