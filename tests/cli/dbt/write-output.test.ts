import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { writeGeneratedOutput, GENERATED_HEADER } from '../../../src/cli/dbt/write-output.js'
import type { GeneratedFile } from '../../../src/cli/dbt/types.js'

async function freshDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'dbt-write-'))
}

function genFile(path: string, body: string): GeneratedFile {
  return { path, content: `${GENERATED_HEADER}\n${body}` }
}

async function readSafe(dir: string, rel: string): Promise<string | null> {
  try {
    return await readFile(join(dir, rel), 'utf-8')
  } catch {
    return null
  }
}

describe('writeGeneratedOutput', () => {
  it('writes new files in normal mode', async () => {
    const dir = await freshDir()
    try {
      const result = await writeGeneratedOutput([genFile('schema.ts', '// a')], {
        outDir: dir, dryRun: false, check: false, force: false,
      })
      expect(result.created).toEqual(['schema.ts'])
      expect(await readSafe(dir, 'schema.ts')).toContain('// a')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('overwrites existing generated files when content differs', async () => {
    const dir = await freshDir()
    try {
      await writeFile(join(dir, 'schema.ts'), `${GENERATED_HEADER}\n// old`, 'utf-8')
      const result = await writeGeneratedOutput([genFile('schema.ts', '// new')], {
        outDir: dir, dryRun: false, check: false, force: false,
      })
      expect(result.updated).toEqual(['schema.ts'])
      expect(await readSafe(dir, 'schema.ts')).toContain('// new')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('refuses to overwrite a non-generated conflict unless --force', async () => {
    const dir = await freshDir()
    try {
      await writeFile(join(dir, 'schema.ts'), 'hand-written', 'utf-8')
      const refused = await writeGeneratedOutput([genFile('schema.ts', '// gen')], {
        outDir: dir, dryRun: false, check: false, force: false,
      })
      expect(refused.conflicts).toEqual(['schema.ts'])
      expect(await readSafe(dir, 'schema.ts')).toBe('hand-written')

      const forced = await writeGeneratedOutput([genFile('schema.ts', '// gen')], {
        outDir: dir, dryRun: false, check: false, force: true,
      })
      expect(forced.updated).toEqual(['schema.ts'])
      expect(await readSafe(dir, 'schema.ts')).toContain('// gen')
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('writes nothing in dry-run mode but reports planned creation', async () => {
    const dir = await freshDir()
    try {
      const result = await writeGeneratedOutput([genFile('schema.ts', '// a')], {
        outDir: dir, dryRun: true, check: false, force: false,
      })
      expect(result.created).toEqual(['schema.ts'])
      expect(await readSafe(dir, 'schema.ts')).toBeNull()
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('check mode reports no drift when output matches', async () => {
    const dir = await freshDir()
    try {
      await writeFile(join(dir, 'schema.ts'), genFile('schema.ts', '// a').content, 'utf-8')
      const result = await writeGeneratedOutput([genFile('schema.ts', '// a')], {
        outDir: dir, dryRun: false, check: true, force: false,
      })
      expect(result.drift).toBe(false)
      expect(result.updated).toEqual([])
      expect(result.missing).toEqual([])
      expect(result.orphaned).toEqual([])
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('check mode reports a changed file as drift', async () => {
    const dir = await freshDir()
    try {
      await writeFile(join(dir, 'schema.ts'), genFile('schema.ts', '// old').content, 'utf-8')
      const result = await writeGeneratedOutput([genFile('schema.ts', '// new')], {
        outDir: dir, dryRun: false, check: true, force: false,
      })
      expect(result.drift).toBe(true)
      expect(result.updated).toEqual(['schema.ts'])
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('check mode reports missing and orphaned generated files together', async () => {
    const dir = await freshDir()
    try {
      // An orphaned generated file no longer expected.
      await mkdir(join(dir, 'cubes'), { recursive: true })
      await writeFile(join(dir, 'cubes', 'stale.ts'), `${GENERATED_HEADER}\n// stale`, 'utf-8')
      const result = await writeGeneratedOutput([genFile('schema.ts', '// a')], {
        outDir: dir, dryRun: false, check: true, force: false,
      })
      expect(result.drift).toBe(true)
      expect(result.missing).toEqual(['schema.ts'])
      expect(result.orphaned).toEqual(['cubes/stale.ts'])
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('normal mode deletes stale generated files and reports them', async () => {
    const dir = await freshDir()
    try {
      await mkdir(join(dir, 'cubes'), { recursive: true })
      await writeFile(join(dir, 'cubes', 'stale.ts'), `${GENERATED_HEADER}\n// stale`, 'utf-8')
      const result = await writeGeneratedOutput([genFile('schema.ts', '// a')], {
        outDir: dir, dryRun: false, check: false, force: false,
      })
      expect(result.deleted).toEqual(['cubes/stale.ts'])
      expect(await readSafe(dir, 'cubes/stale.ts')).toBeNull()
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('refuses a path that escapes the output directory', async () => {
    const dir = await freshDir()
    try {
      await expect(
        writeGeneratedOutput([genFile('../escape.ts', '// a')], {
          outDir: dir, dryRun: false, check: false, force: false,
        }),
      ).rejects.toThrow(/outside output directory/)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
})
