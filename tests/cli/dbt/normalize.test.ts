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
