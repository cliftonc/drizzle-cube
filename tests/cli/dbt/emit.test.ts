import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import manifest from '../../fixtures/dbt/postgres-simple/manifest.json'
import catalog from '../../fixtures/dbt/postgres-simple/catalog.json'
import { emitCubes } from '../../../src/cli/dbt/emit-cubes'
import { emitSchema } from '../../../src/cli/dbt/emit-schema'
import { normalizeDbtArtifacts } from '../../../src/cli/dbt/normalize'
import { parseDbtArtifacts } from '../../../src/cli/dbt/parse-artifacts'
import { GENERATED_HEADER } from '../../../src/cli/dbt/write-output'
import type { SecurityMode } from '../../../src/cli/dbt/types'

const fixtureRoot = join(process.cwd(), 'tests/fixtures/dbt/postgres-simple/expected')

function models(security: SecurityMode = { kind: 'filter', columnName: 'organisation_id', contextProperty: 'organisationId' }) {
  return normalizeDbtArtifacts(parseDbtArtifacts(manifest, catalog), { security }).models
}

describe('dbt emitters', () => {
  it('matches expected security-filter output byte-for-byte', () => {
    const context = { header: GENERATED_HEADER }
    const files = [emitSchema(models(), context), ...emitCubes(models(), context)]
    for (const file of files) {
      expect(file.content).toBe(readFileSync(join(fixtureRoot, file.path), 'utf8'))
    }
  })

  it('emits no-security SQL without eq import', () => {
    const files = emitCubes(models({ kind: 'none' }), { header: GENERATED_HEADER })
    const orders = files.find((file) => file.path === 'cubes/orders.ts')?.content ?? ''
    expect(orders).toContain('No cube-level security filter was requested')
    expect(orders).not.toContain("import { eq }")
  })

  it('uses public drizzle-cube/server imports and direct Drizzle columns', () => {
    const orders = emitCubes(models(), { header: GENERATED_HEADER }).find((file) => file.path === 'cubes/orders.ts')?.content ?? ''
    expect(orders).toContain("from 'drizzle-cube/server'")
    expect(orders).toContain('orders.amount')
    expect(orders).not.toContain('@/server')
  })

  it('emits a countDistinct measure for composite primary keys', () => {
    const compositeManifest = {
      nodes: {
        'model.demo.order_lines': {
          resource_type: 'model',
          name: 'order_lines',
          alias: 'order_lines',
          config: { materialized: 'table' },
          columns: {
            order_id: { name: 'order_id', meta: { drizzle_cube: { primary_key: true } } },
            line_number: { name: 'line_number', meta: { drizzle_cube: { primary_key: true } } }
          },
          meta: {}
        }
      }
    }
    const compositeCatalog = {
      nodes: {
        'model.demo.order_lines': {
          columns: {
            order_id: { name: 'order_id', type: 'integer', index: 0 },
            line_number: { name: 'line_number', type: 'integer', index: 1 }
          }
        }
      }
    }
    const compositeModels = normalizeDbtArtifacts(parseDbtArtifacts(compositeManifest, compositeCatalog), { security: { kind: 'none' } }).models
    const orderLines = emitCubes(compositeModels, { header: GENERATED_HEADER }).find((file) => file.path === 'cubes/order-lines.ts')?.content ?? ''
    expect(orderLines).toContain("import { sql } from 'drizzle-orm'")
    expect(orderLines).toContain("type: 'countDistinct'")
    expect(orderLines).toContain("sql: sql<string>`concat_ws('|', ${orderLines.orderId}, ${orderLines.lineNumber})`")
    expect(orderLines.match(/primaryKey: true/g)).toHaveLength(2)
  })
})
