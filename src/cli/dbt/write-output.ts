/**
 * Generated-file writer/checker. Builds the file plan from the IR via the
 * emitters, then writes it (normal mode), reports it (`--dry-run`), or diffs it
 * against disk (`--check`, for CI).
 *
 * All writes are confined to the `--out` root; a planned path that escapes the
 * root is a hard error rather than a silent traversal.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import type { GeneratedModel, SecurityConfig } from './types.js'
import type { HeaderInfo } from './emit-shared.js'
import { emitSchema } from './emit-schema.js'
import { emitCubeFile, emitIndex } from './emit-cubes.js'

export interface PlannedFile {
  /** Path relative to the output root, POSIX-style, e.g. `cubes/orders.ts`. */
  relativePath: string
  content: string
}

export type WriteMode = 'write' | 'dry-run' | 'check'

export interface WriteResult {
  /** Files written to disk (mode === 'write'). */
  written: string[]
  /** Files already current on disk (skipped to avoid churn). */
  unchanged: string[]
  /** Files that differ from or are missing on disk (mode === 'check'/'dry-run'). */
  drift: string[]
}

/** Build the deterministic file plan for a set of models. */
export function buildFilePlan(
  models: GeneratedModel[],
  security: SecurityConfig | null,
  header: HeaderInfo
): PlannedFile[] {
  const byUid = new Map<string, GeneratedModel>(models.map((m) => [m.uid, m]))
  const plan: PlannedFile[] = [{ relativePath: 'schema.ts', content: emitSchema(models, header) }]

  for (const model of models) {
    plan.push({
      relativePath: `cubes/${model.fileName}.ts`,
      content: emitCubeFile(model, security, byUid, header)
    })
  }

  plan.push({ relativePath: 'index.ts', content: emitIndex(models, header) })

  // Stable ordering by relative path.
  plan.sort((a, b) => (a.relativePath < b.relativePath ? -1 : a.relativePath > b.relativePath ? 1 : 0))
  return plan
}

/** Resolve a planned path under the output root, refusing to escape it. */
function resolveSafe(outDir: string, relativePath: string): string {
  const root = resolve(outDir)
  const target = resolve(root, relativePath)
  const rel = relative(root, target)
  if (rel.startsWith('..') || rel.includes(`..${sep}`)) {
    throw new Error(`refusing to write outside output root: ${relativePath}`)
  }
  return target
}

/**
 * Apply the file plan according to `mode`.
 * - `write`: create dirs and write changed files (unchanged files are skipped).
 * - `dry-run`: write nothing; `drift` lists files that would change.
 * - `check`: write nothing; `drift` lists files that differ or are missing.
 */
export function applyFilePlan(
  outDir: string,
  plan: PlannedFile[],
  mode: WriteMode
): WriteResult {
  const result: WriteResult = { written: [], unchanged: [], drift: [] }

  for (const file of plan) {
    const target = resolveSafe(outDir, file.relativePath)
    const current = existsSync(target) ? readFileSync(target, 'utf8') : null
    const isCurrent = current === file.content

    if (mode === 'check' || mode === 'dry-run') {
      if (isCurrent) result.unchanged.push(file.relativePath)
      else result.drift.push(file.relativePath)
      continue
    }

    // mode === 'write'
    if (isCurrent) {
      result.unchanged.push(file.relativePath)
      continue
    }
    mkdirSync(dirname(target), { recursive: true })
    writeFileSync(target, file.content, 'utf8')
    result.written.push(file.relativePath)
  }

  return result
}

/** Pretty relative output dir for messages. */
export function displayPath(outDir: string): string {
  const rel = relative(process.cwd(), resolve(outDir))
  return rel === '' ? '.' : rel.startsWith('..') ? resolve(outDir) : rel
}

/** Join helper kept here so callers don't import node:path directly. */
export function joinOut(outDir: string, relativePath: string): string {
  return join(outDir, relativePath)
}
