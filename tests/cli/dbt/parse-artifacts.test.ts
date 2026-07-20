import { describe, expect, it } from 'vitest'
import manifest from '../../fixtures/dbt/postgres-simple/manifest.json'
import catalog from '../../fixtures/dbt/postgres-simple/catalog.json'
import { parseDbtArtifacts } from '../../../src/cli/dbt/parse-artifacts'

describe('parseDbtArtifacts', () => {
  it('extracts models and catalog columns from dbt artifacts', () => {
    const parsed = parseDbtArtifacts(manifest, catalog)
    expect(parsed.models.map((model) => model.name)).toEqual(['customers', 'orders', 'ephemeral_rollup'])
    expect(parsed.catalogNodes.get('model.demo.orders')?.columns.map((column) => column.name)).toContain('amount')
  })

  it('extracts relationships tests', () => {
    const parsed = parseDbtArtifacts(manifest, catalog)
    expect(parsed.relationships).toEqual([{ sourceModelId: 'model.demo.orders', sourceColumn: 'customer_id', targetModelId: 'model.demo.customers', targetColumn: 'id' }])
  })

  it('throws on malformed top-level nodes', () => {
    expect(() => parseDbtArtifacts({}, catalog)).toThrow('manifest.json must contain a top-level nodes object')
    expect(() => parseDbtArtifacts(manifest, {})).toThrow('catalog.json must contain a top-level nodes object')
  })
})
