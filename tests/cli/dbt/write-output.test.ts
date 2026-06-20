import { afterEach, describe, expect, it } from 'vitest'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeGeneratedOutput, GENERATED_HEADER } from '../../../src/cli/dbt/write-output.js'
import type { GeneratedFile } from '../../../src/cli/dbt/types.js'

/** Create a unique temp directory for a test. */
async function makeTempDir(name: string): Promise<string> {
  const dir = join(tmpdir(), `drizzle-cube-dbt-${name}-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  await mkdir(dir, { recursive: true })
  return dir
}

const GENERATED_FILE_CONTENT = `${GENERATED_HEADER}\nexport const x = 1\n`
const GENERATED_FILE_CONTENT_V2 = `${GENERATED_HEADER}\nexport const x = 2\n`

function file(path: string, content: string): GeneratedFile {
  return { path, content }
}

const dirs: string[] = []

afterEach(async () => {
  while (dirs.length) {
    const d = dirs.pop()!
    await rm(d, { recursive: true, force: true }).catch(() => {})
  }
})

describe('write-output', () => {
  it('writes new files in normal mode', async () => {
    const out = await makeTempDir('normal-create')
    dirs.push(out)
    const result = await writeGeneratedOutput(
      [file('schema.ts', GENERATED_FILE_CONTENT)],
      { outDir: out, dryRun: false, check: false, force: false },
    )
    expect(result.created).toEqual(['schema.ts'])
    expect(result.updated).toEqual([])
    expect(await readFile(join(out, 'schema.ts'), 'utf-8')).toBe(GENERATED_FILE_CONTENT)
  })

  it('overwrites existing generated-header files in normal mode', async () => {
    const out = await makeTempDir('normal-update')
    dirs.push(out)
    await writeFile(join(out, 'schema.ts'), GENERATED_FILE_CONTENT, 'utf-8')
    const result = await writeGeneratedOutput(
      [file('schema.ts', GENERATED_FILE_CONTENT_V2)],
      { outDir: out, dryRun: false, check: false, force: false },
    )
    expect(result.updated).toEqual(['schema.ts'])
    expect(await readFile(join(out, 'schema.ts'), 'utf-8')).toBe(GENERATED_FILE_CONTENT_V2)
  })

  it('records a conflict for non-generated files without force', async () => {
    const out = await makeTempDir('conflict')
    dirs.push(out)
    await writeFile(join(out, 'manual.ts'), '// hand-written\n', 'utf-8')
    const result = await writeGeneratedOutput(
      [file('manual.ts', GENERATED_FILE_CONTENT)],
      { outDir: out, dryRun: false, check: false, force: false },
    )
    expect(result.conflicts).toEqual(['manual.ts'])
    expect(await readFile(join(out, 'manual.ts'), 'utf-8')).toBe('// hand-written\n')
  })

  it('overwrites non-generated files with force', async () => {
    const out = await makeTempDir('force')
    dirs.push(out)
    await writeFile(join(out, 'manual.ts'), '// hand-written\n', 'utf-8')
    const result = await writeGeneratedOutput(
      [file('manual.ts', GENERATED_FILE_CONTENT)],
      { outDir: out, dryRun: false, check: false, force: true },
    )
    expect(result.updated).toEqual(['manual.ts'])
    expect(await readFile(join(out, 'manual.ts'), 'utf-8')).toBe(GENERATED_FILE_CONTENT)
  })

  it('deletes stale generated files in normal mode', async () => {
    const out = await makeTempDir('stale-delete')
    dirs.push(out)
    await mkdir(join(out, 'cubes'), { recursive: true })
    await writeFile(join(out, 'cubes', 'old.ts'), GENERATED_FILE_CONTENT, 'utf-8')
    await writeFile(join(out, 'schema.ts'), GENERATED_FILE_CONTENT, 'utf-8')
    const result = await writeGeneratedOutput(
      [file('schema.ts', GENERATED_FILE_CONTENT)],
      { outDir: out, dryRun: false, check: false, force: false },
    )
    expect(result.deleted).toEqual(['cubes/old.ts'])
    await expect(readFile(join(out, 'cubes', 'old.ts'), 'utf-8')).rejects.toThrow()
  })

  it('writes nothing in dry-run but reports planned operations', async () => {
    const out = await makeTempDir('dryrun')
    dirs.push(out)
    await mkdir(join(out, 'cubes'), { recursive: true })
    await writeFile(join(out, 'cubes', 'stale.ts'), GENERATED_FILE_CONTENT, 'utf-8')
    const result = await writeGeneratedOutput(
      [file('schema.ts', GENERATED_FILE_CONTENT)],
      { outDir: out, dryRun: true, check: false, force: false },
    )
    expect(result.created).toEqual(['schema.ts'])
    expect(result.deleted).toEqual(['cubes/stale.ts'])
    // Nothing was actually written/deleted.
    await expect(readFile(join(out, 'schema.ts'), 'utf-8')).rejects.toThrow()
    expect(await readFile(join(out, 'cubes', 'stale.ts'), 'utf-8')).toBe(GENERATED_FILE_CONTENT)
  })

  it('check mode succeeds when output matches', async () => {
    const out = await makeTempDir('check-ok')
    dirs.push(out)
    await writeFile(join(out, 'schema.ts'), GENERATED_FILE_CONTENT, 'utf-8')
    const result = await writeGeneratedOutput(
      [file('schema.ts', GENERATED_FILE_CONTENT)],
      { outDir: out, dryRun: false, check: true, force: false },
    )
    expect(result.drift).toBe(false)
  })

  it('check mode detects a changed generated file', async () => {
    const out = await makeTempDir('check-changed')
    dirs.push(out)
    await writeFile(join(out, 'schema.ts'), GENERATED_FILE_CONTENT_V2, 'utf-8')
    const result = await writeGeneratedOutput(
      [file('schema.ts', GENERATED_FILE_CONTENT)],
      { outDir: out, dryRun: false, check: true, force: false },
    )
    expect(result.drift).toBe(true)
  })

  it('check mode detects a missing expected file', async () => {
    const out = await makeTempDir('check-missing')
    dirs.push(out)
    const result = await writeGeneratedOutput(
      [file('schema.ts', GENERATED_FILE_CONTENT)],
      { outDir: out, dryRun: false, check: true, force: false },
    )
    expect(result.drift).toBe(true)
    expect(result.missing).toEqual(['schema.ts'])
    expect(result.orphaned).toEqual([])
  })

  it('check mode detects an orphaned generated file (removal drift)', async () => {
    const out = await makeTempDir('check-orphan')
    dirs.push(out)
    await mkdir(join(out, 'cubes'), { recursive: true })
    await writeFile(join(out, 'cubes', 'removed-model.ts'), GENERATED_FILE_CONTENT, 'utf-8')
    await writeFile(join(out, 'schema.ts'), GENERATED_FILE_CONTENT, 'utf-8')
    const result = await writeGeneratedOutput(
      [file('schema.ts', GENERATED_FILE_CONTENT)],
      { outDir: out, dryRun: false, check: true, force: false },
    )
    expect(result.drift).toBe(true)
    expect(result.missing).toEqual([])
    expect(result.orphaned).toEqual(['cubes/removed-model.ts'])
  })

  it('check mode reports changed, missing, and orphaned paths together', async () => {
    const out = await makeTempDir('check-all-three')
    dirs.push(out)
    await mkdir(join(out, 'cubes'), { recursive: true })
    // changed: existing generated file with differing content
    await writeFile(join(out, 'schema.ts'), GENERATED_FILE_CONTENT_V2, 'utf-8')
    // orphaned: on-disk generated file no longer expected
    await writeFile(join(out, 'cubes', 'removed.ts'), GENERATED_FILE_CONTENT, 'utf-8')
    const result = await writeGeneratedOutput(
      [
        file('schema.ts', GENERATED_FILE_CONTENT),
        file('cubes/new.ts', GENERATED_FILE_CONTENT), // missing
      ],
      { outDir: out, dryRun: false, check: true, force: false },
    )
    expect(result.drift).toBe(true)
    expect(result.updated).toEqual(['schema.ts'])
    expect(result.missing).toEqual(['cubes/new.ts'])
    expect(result.orphaned).toEqual(['cubes/removed.ts'])
  })
})
