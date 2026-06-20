import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { DbtGenerateError } from './errors.js'
import { GENERATED_HEADER_PREFIX, type GeneratedFile } from './types.js'

export interface WritePlanEntry {
  path: string
  action: 'create' | 'update' | 'unchanged'
}

export interface WriteResult {
  entries: WritePlanEntry[]
  current: boolean
  warnings: string[]
}

async function readExisting(target: string): Promise<string | undefined> {
  try {
    return await readFile(target, 'utf8')
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') return undefined
    throw error
  }
}

function targetPath(outDir: string, filePath: string): string {
  const resolvedOut = path.resolve(outDir)
  const resolvedTarget = path.resolve(resolvedOut, filePath)
  if (resolvedTarget !== resolvedOut && !resolvedTarget.startsWith(`${resolvedOut}${path.sep}`)) {
    throw new DbtGenerateError(`Refusing to write outside output directory: ${filePath}.`)
  }
  return resolvedTarget
}

async function findStaleGenerated(outDir: string, expected: Set<string>): Promise<string[]> {
  async function walk(dir: string): Promise<string[]> {
    let entries: import('node:fs').Dirent[]
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return []
    }
    const nested = await Promise.all(entries.map(async (entry) => {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) return walk(full)
      if (!entry.isFile() || !entry.name.endsWith('.ts')) return []
      const content = await readExisting(full)
      const relative = path.relative(outDir, full).split(path.sep).join('/')
      return content?.startsWith(GENERATED_HEADER_PREFIX) && !expected.has(relative) ? [relative] : []
    }))
    return nested.flat()
  }
  return walk(path.resolve(outDir))
}

export async function writeGeneratedFiles(files: GeneratedFile[], outDir: string, mode: { dryRun?: boolean; check?: boolean; force?: boolean }): Promise<WriteResult> {
  const expected = new Set(files.map((file) => file.path))
  const entries: WritePlanEntry[] = []
  for (const file of files) {
    const target = targetPath(outDir, file.path)
    const existing = await readExisting(target)
    const action: WritePlanEntry['action'] = existing === undefined ? 'create' : existing === file.content ? 'unchanged' : 'update'
    entries.push({ path: file.path, action })
    if (existing !== undefined && existing !== file.content && !existing.startsWith(GENERATED_HEADER_PREFIX) && !mode.force) {
      throw new DbtGenerateError(`Refusing to overwrite non-generated file ${file.path}. Use --force to replace it.`)
    }
    if (!mode.dryRun && !mode.check && action !== 'unchanged') {
      await mkdir(path.dirname(target), { recursive: true })
      await writeFile(target, file.content)
    }
  }
  const current = entries.every((entry) => entry.action === 'unchanged')
  const stale = await findStaleGenerated(outDir, expected)
  const warnings = stale.length > 0 ? [`Generated files not touched by this run remain in ${outDir}: ${stale.join(', ')}`] : []
  if (mode.check && !current) {
    throw new DbtGenerateError(`Generated output is not current: ${entries.filter((entry) => entry.action !== 'unchanged').map((entry) => entry.path).join(', ')}.`)
  }
  return { entries, current, warnings }
}
