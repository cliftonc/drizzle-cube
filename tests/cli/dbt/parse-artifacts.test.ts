import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getModelNodes, getRelationshipTests, isMaterializedModel, loadDbtArtifacts } from '../../../src/cli/dbt/parse-artifacts.js'

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
