import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { loadGeneratorConfig } from '../../../src/cli/dbt/config.js'
import { generateDbtFiles } from '../../../src/cli/dbt/generator.js'

const fixtureDir = 'tests/fixtures/dbt/postgres-simple'

async function generate(security: 'security' | 'no-security') {
  const config = security === 'security' ? await loadGeneratorConfig(`${fixtureDir}/config-security.json`) : {}
  return generateDbtFiles({
    manifestPath: `${fixtureDir}/manifest.json`,
    catalogPath: `${fixtureDir}/catalog.json`,
    dialect: 'postgres',
    outDir: 'unused',
    config,
    security: security === 'security' ? config.security! : { mode: 'none' },
  })
}

describe('dbt emitters', () => {
  it('emits exact deterministic files with security', async () => {
    const { files } = await generate('security')
    for (const file of files) {
      await expect(file.content).toBe(await readFile(`${fixtureDir}/expected/security/${file.path}`, 'utf8'))
    }
    expect(files.map((file) => file.path)).toEqual(['schema.ts', 'cubes/customers.ts', 'cubes/orders.ts', 'index.ts'])
  })

  it('emits exact deterministic files without security', async () => {
    const first = await generate('no-security')
    const second = await generate('no-security')
    expect(second.files).toEqual(first.files)
    for (const file of first.files) {
      await expect(file.content).toBe(await readFile(`${fixtureDir}/expected/no-security/${file.path}`, 'utf8'))
    }
    expect(first.warnings).toContainEqual({ message: 'No cube-level security filters will be generated. Use only for public or single-tenant data.' })
  })
})
