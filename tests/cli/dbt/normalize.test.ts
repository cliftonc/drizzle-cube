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

  it('supports no-security mode', async () => {
    const artifacts = await loadDbtArtifacts(`${fixtureDir}/manifest.json`, `${fixtureDir}/catalog.json`)
    const { models, warnings } = normalizeDbtArtifacts({ artifacts, dialect: 'postgres', security: { mode: 'none' }, config: {} })
    expect(models).toHaveLength(2)
    expect(warnings).toContainEqual({ message: 'No cube-level security filters will be generated. Use only for public or single-tenant data.' })
  })
})
