import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'
import { GENERATED_HEADER, writeGeneratedOutput } from '../../../src/cli/dbt/write-output'

async function tempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'dbt-write-'))
}

const file = { path: 'schema.ts', content: `${GENERATED_HEADER}\nexport const value = 1\n` }

describe('writeGeneratedOutput', () => {
  it('writes new files and overwrites generated files', async () => {
    const outDir = await tempDir()
    const first = await writeGeneratedOutput([file], { outDir, dryRun: false, check: false, force: false })
    expect(first.created).toEqual(['schema.ts'])
    const second = await writeGeneratedOutput([{ ...file, content: `${GENERATED_HEADER}\nexport const value = 2\n` }], { outDir, dryRun: false, check: false, force: false })
    expect(second.updated).toEqual(['schema.ts'])
    await expect(readFile(join(outDir, 'schema.ts'), 'utf8')).resolves.toContain('value = 2')
  })

  it('detects non-generated conflicts unless forced', async () => {
    const outDir = await tempDir()
    await writeFile(join(outDir, 'schema.ts'), 'manual')
    await expect(writeGeneratedOutput([file], { outDir, dryRun: false, check: false, force: false })).rejects.toThrow('Refusing to overwrite')
    const forced = await writeGeneratedOutput([file], { outDir, dryRun: false, check: false, force: true })
    expect(forced.warnings[0]?.code).toBe('forced_overwrite')
  })

  it('dry-run and check do not write', async () => {
    const outDir = await tempDir()
    const dryRun = await writeGeneratedOutput([file], { outDir, dryRun: true, check: false, force: false })
    expect(dryRun.created).toEqual(['schema.ts'])
    await expect(readFile(join(outDir, 'schema.ts'), 'utf8')).rejects.toThrow()
    await expect(writeGeneratedOutput([file], { outDir, dryRun: false, check: true, force: false })).rejects.toThrow('not up to date')
  })

  it('check succeeds on matching output and fails on stale generated files', async () => {
    const outDir = await tempDir()
    await writeGeneratedOutput([file], { outDir, dryRun: false, check: false, force: false })
    await expect(writeGeneratedOutput([file], { outDir, dryRun: false, check: true, force: false })).resolves.toMatchObject({ unchanged: ['schema.ts'] })
    await mkdir(join(outDir, 'cubes'), { recursive: true })
    await writeFile(join(outDir, 'cubes', 'stale.ts'), `${GENERATED_HEADER}\nstale\n`)
    await expect(writeGeneratedOutput([file], { outDir, dryRun: false, check: true, force: false })).rejects.toThrow('stale')
  })
})
