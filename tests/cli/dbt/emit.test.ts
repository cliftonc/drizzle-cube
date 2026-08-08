import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parseDbtArtifacts } from '../../../src/cli/dbt/parse-artifacts.js'
import { normalizeDbtArtifacts } from '../../../src/cli/dbt/normalize.js'
import { emitCubes } from '../../../src/cli/dbt/emit-cubes.js'
import { emitSchema } from '../../../src/cli/dbt/emit-schema.js'
import type { EmitContext } from '../../../src/cli/dbt/types.js'

const FIXTURE = 'tests/fixtures/dbt/postgres-simple'

async function loadAndNormalize(security: EmitContext['security']) {
  const manifest = JSON.parse(await readFile(join(FIXTURE, 'manifest.json'), 'utf-8'))
  const catalog = JSON.parse(await readFile(join(FIXTURE, 'catalog.json'), 'utf-8'))
  const artifacts = parseDbtArtifacts(manifest, catalog)
  return normalizeDbtArtifacts(artifacts, { security })
}

const filterContext = (security: EmitContext['security']): EmitContext => ({
  manifestPath: 'manifest.json',
  catalogPath: 'catalog.json',
  dialect: 'postgres',
  security,
})

const FILTER_SECURITY = { kind: 'filter' as const, columnName: 'organisation_id', contextProperty: 'organisationId' }

async function readExpected(relative: string): Promise<string> {
  return readFile(join(FIXTURE, 'expected', relative), 'utf-8')
}

describe('emitSchema + emitCubes (byte-for-byte vs golden fixtures)', () => {
  it('emits schema.ts byte-for-byte', async () => {
    const { models } = await loadAndNormalize(FILTER_SECURITY)
    const file = emitSchema(models, filterContext(FILTER_SECURITY))
    expect(file.path).toBe('schema.ts')
    expect(file.content).toBe(await readExpected('schema.ts'))
  })

  it('emits each cube file byte-for-byte', async () => {
    const { models } = await loadAndNormalize(FILTER_SECURITY)
    const files = emitCubes(models, filterContext(FILTER_SECURITY))
    for (const file of files) {
      expect(file.content).toBe(await readExpected(file.path))
    }
  })

  it('emits index.ts byte-for-byte', async () => {
    const { models } = await loadAndNormalize(FILTER_SECURITY)
    const files = emitCubes(models, filterContext(FILTER_SECURITY))
    const index = files.find((f) => f.path === 'index.ts')
    expect(index?.content).toBe(await readExpected('index.ts'))
  })
})

describe('emitted cube code shape', () => {
  it('imports from drizzle-cube/server and uses non-generic public types', async () => {
    const { models } = await loadAndNormalize(FILTER_SECURITY)
    const orders = emitCubes(models, filterContext(FILTER_SECURITY))
    const ordersFile = orders.find((f) => f.path === 'cubes/orders.ts')?.content ?? ''
    expect(ordersFile).toContain("import { defineCube } from 'drizzle-cube/server'")
    expect(ordersFile).toContain("import type { QueryContext, BaseQueryDefinition } from 'drizzle-cube/server'")
    expect(ordersFile).not.toMatch(/QueryContext</)
  })

  it('references Drizzle table columns directly and uses string targetCube names', async () => {
    const { models } = await loadAndNormalize(FILTER_SECURITY)
    const ordersFile = emitCubes(models, filterContext(FILTER_SECURITY))
      .find((f) => f.path === 'cubes/orders.ts')?.content ?? ''
    expect(ordersFile).toContain('sql: Orders.id')
    expect(ordersFile).toContain("targetCube: 'Customers'")
    expect(ordersFile).toContain('source: Orders.customerId, target: Customers.id')
  })

  it('emits a security-filter sql function for the filter variant', async () => {
    const { models } = await loadAndNormalize(FILTER_SECURITY)
    const ordersFile = emitCubes(models, filterContext(FILTER_SECURITY))
      .find((f) => f.path === 'cubes/orders.ts')?.content ?? ''
    expect(ordersFile).toContain('where: eq(Orders.organisationId, ctx.securityContext.organisationId as number)')
  })

  it('emits a no-security comment + bare from for the none variant', async () => {
    const { models } = await loadAndNormalize({ kind: 'none' })
    const ordersFile = emitCubes(models, filterContext({ kind: 'none' }))
      .find((f) => f.path === 'cubes/orders.ts')?.content ?? ''
    expect(ordersFile).toContain('// No cube-level security filter was requested for this model.')
    expect(ordersFile).toContain('sql: (): BaseQueryDefinition => ({\n    from: Orders,\n  })')
    expect(ordersFile).not.toContain('import { eq }')
  })

  it('emits countDistinct (not count) for a composite-PK cube', async () => {
    const { models } = await loadAndNormalize(FILTER_SECURITY)
    const orderLinesFile = emitCubes(models, filterContext(FILTER_SECURITY))
      .find((f) => f.path === 'cubes/order-lines.ts')?.content ?? ''
    expect(orderLinesFile).toContain("type: 'countDistinct'")
    expect(orderLinesFile).not.toMatch(/type: 'count',/)
    expect(orderLinesFile).toContain("sql: sql`concat_ws('|', ${OrderLines.orderId}, ${OrderLines.lineNumber})`")
  })
})
