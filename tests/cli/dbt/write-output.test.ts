import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parseManifest, parseCatalog } from '../../../src/cli/dbt/parse-artifacts'
import { normalize } from '../../../src/cli/dbt/normalize'
import { buildFilePlan, applyFilePlan } from '../../../src/cli/dbt/write-output'
import type { SecurityConfig } from '../../../src/cli/dbt/types'
import { fixtureManifest, fixtureCatalog } from './helpers'

const header = { manifestPath: 'm.json', catalogPath: 'c.json' }
const security: SecurityConfig = { column: 'organisation_id', context: 'organisationId' }

function plan() {
  const models = normalize(
    parseManifest(fixtureManifest('postgres-simple')),
    parseCatalog(fixtureCatalog('postgres-simple')),
    { security }
  ).models
  return buildFilePlan(models, security, header)
}

describe('buildFilePlan', () => {
  it('plans schema.ts, one cube per model, and index.ts (sorted)', () => {
    expect(plan().map((f) => f.relativePath)).toEqual([
      'cubes/customers.ts',
      'cubes/orders.ts',
      'index.ts',
      'schema.ts'
    ])
  })
})

describe('applyFilePlan', () => {
  let dir: string
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'dbt-write-'))
  })
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  it('write mode writes all files, then re-run reports them unchanged', () => {
    const p = plan()
    const first = applyFilePlan(dir, p, 'write')
    expect(first.written.sort()).toEqual(p.map((f) => f.relativePath).sort())
    expect(first.unchanged).toEqual([])
    expect(existsSync(join(dir, 'cubes/orders.ts'))).toBe(true)

    const second = applyFilePlan(dir, p, 'write')
    expect(second.written).toEqual([])
    expect(second.unchanged.length).toBe(p.length)
  })

  it('check mode reports drift without writing', () => {
    const p = plan()
    const res = applyFilePlan(dir, p, 'check')
    expect(res.drift.length).toBe(p.length)
    expect(existsSync(join(dir, 'schema.ts'))).toBe(false)
  })

  it('check mode passes when on-disk output is current', () => {
    const p = plan()
    applyFilePlan(dir, p, 'write')
    const res = applyFilePlan(dir, p, 'check')
    expect(res.drift).toEqual([])
    expect(res.unchanged.length).toBe(p.length)
  })

  it('dry-run mode writes nothing', () => {
    const p = plan()
    const res = applyFilePlan(dir, p, 'dry-run')
    expect(res.drift.length).toBe(p.length)
    expect(existsSync(join(dir, 'index.ts'))).toBe(false)
  })

  it('detects drift on a single hand-edited file', () => {
    const p = plan()
    applyFilePlan(dir, p, 'write')
    writeFileSync(join(dir, 'schema.ts'), '// tampered\n')
    const res = applyFilePlan(dir, p, 'check')
    expect(res.drift).toEqual(['schema.ts'])
  })

  it('refuses to write outside the output root', () => {
    expect(() =>
      applyFilePlan(dir, [{ relativePath: '../escape.ts', content: 'x' }], 'write')
    ).toThrow(/outside output root/)
  })
})
