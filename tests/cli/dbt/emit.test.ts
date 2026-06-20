import { describe, it, expect } from 'vitest'
import { parseManifest, parseCatalog } from '../../../src/cli/dbt/parse-artifacts'
import { normalize } from '../../../src/cli/dbt/normalize'
import { emitSchema } from '../../../src/cli/dbt/emit-schema'
import { emitCubeFile, emitIndex } from '../../../src/cli/dbt/emit-cubes'
import type { GeneratedModel, SecurityConfig } from '../../../src/cli/dbt/types'
import { fixture, fixtureManifest, fixtureCatalog } from './helpers'

const header = { manifestPath: 'target/manifest.json', catalogPath: 'target/catalog.json' }
const security: SecurityConfig = { column: 'organisation_id', context: 'organisationId' }

function build(sec: SecurityConfig | null) {
  const manifest = parseManifest(fixtureManifest('postgres-simple'))
  const catalog = parseCatalog(fixtureCatalog('postgres-simple'))
  const { models } = normalize(manifest, catalog, { security: sec })
  const byUid = new Map<string, GeneratedModel>(models.map((m) => [m.uid, m]))
  return { models, byUid }
}

describe('emit — golden fixtures (postgres-simple, with security)', () => {
  const { models, byUid } = build(security)

  it('emits schema.ts matching the golden file', () => {
    expect(emitSchema(models, header)).toBe(fixture('postgres-simple', 'expected/schema.ts'))
  })

  it('emits each cube file matching the golden file', () => {
    for (const model of models) {
      const actual = emitCubeFile(model, security, byUid, header)
      expect(actual).toBe(fixture('postgres-simple', `expected/cubes/${model.fileName}.ts`))
    }
  })

  it('emits index.ts matching the golden file', () => {
    expect(emitIndex(models, header)).toBe(fixture('postgres-simple', 'expected/index.ts'))
  })
})

describe('emit — determinism', () => {
  it('produces identical output across two emit passes', () => {
    const a = build(security)
    const b = build(security)
    expect(emitSchema(a.models, header)).toBe(emitSchema(b.models, header))
    expect(emitIndex(a.models, header)).toBe(emitIndex(b.models, header))
  })
})

describe('emit — no-security mode', () => {
  const { models, byUid } = build(null)

  it('omits the where clause and the eq import, using a zero-arg sql function', () => {
    const orders = models.find((m) => m.cubeName === 'Orders')!
    const code = emitCubeFile(orders, null, byUid, header)
    expect(code).not.toContain("import { eq } from 'drizzle-orm'")
    expect(code).not.toContain('where:')
    expect(code).toContain('sql: (): BaseQueryDefinition => ({')
    expect(code).toContain('from: orders')
    // QueryContext is only needed when a security predicate is emitted.
    expect(code).not.toContain('QueryContext')
  })
})
