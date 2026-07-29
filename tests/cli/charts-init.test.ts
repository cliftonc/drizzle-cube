/**
 * DB-free CLI test.
 *
 * Lives in the `cli` vitest project (see vitest.config.ts): no Docker, no
 * globalSetup, no database. Pure logic over a temp output dir, runs in
 * milliseconds.
 *
 * Regression cover for `charts init --from <type>`: it used to try to copy the
 * built-in's *source* out of the installed package. The published package ships
 * `dist/` only, so nothing was ever copied — yet the command still printed
 * "Chart copied…" and left an `index.ts` importing two files that did not exist.
 * The scaffold now wraps the built-in through the public API instead.
 */
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { chartsInit } from '../../src/cli/commands/charts'

let outDir: string

/** Run `charts init` with the given argv tail, capturing stdout. */
function runInit(...args: string[]): string {
  const logged: string[] = []
  vi.spyOn(console, 'log').mockImplementation((...parts: unknown[]) => {
    logged.push(parts.map(String).join(' '))
  })
  vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'drizzle-cube', ...args])
  chartsInit()
  return logged.join('\n')
}

beforeEach(() => {
  outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-charts-init-'))
})

afterEach(() => {
  vi.restoreAllMocks()
  fs.rmSync(outDir, { recursive: true, force: true })
})

describe('charts init --from <built-in> (DB-free CLI)', () => {
  it('writes all three files without needing the package sources on disk', () => {
    runInit('charts', 'init', '--from', 'table', '-o', outDir)

    // The bug: only index.ts was written, referencing two files that never existed.
    expect(fs.readdirSync(outDir).sort()).toEqual([
      'CustomTableChart.config.ts',
      'CustomTableChart.tsx',
      'index.ts',
    ])
  })

  it('emits only public drizzle-cube imports — no internal paths', () => {
    runInit('charts', 'init', '--from', 'table', '-o', outDir)

    for (const file of fs.readdirSync(outDir)) {
      const source = fs.readFileSync(path.join(outDir, file), 'utf-8')
      // Line-anchored so the usage example inside the doc comment is not matched.
      const imports = [...source.matchAll(/^import .*from '([^']+)'/gm)].map(m => m[1])
      for (const specifier of imports) {
        // Sibling files in the scaffold are fine; anything else must be a
        // public entry point. Internal paths ('../../types.js', './pivotUtils')
        // are what made the old copied output uncompilable.
        const isSibling = specifier.startsWith('./Custom')
        const isPublic = specifier === 'react' || specifier.startsWith('drizzle-cube/')
        expect(isSibling || isPublic, `${file} imports ${specifier}`).toBe(true)
      }
    }
  })

  it('wires the config, component and registration together consistently', () => {
    runInit('charts', 'init', '--from', 'table', '-o', outDir)

    const component = fs.readFileSync(path.join(outDir, 'CustomTableChart.tsx'), 'utf-8')
    const config = fs.readFileSync(path.join(outDir, 'CustomTableChart.config.ts'), 'utf-8')
    const index = fs.readFileSync(path.join(outDir, 'index.ts'), 'utf-8')

    // Renders the real built-in rather than a stub.
    expect(component).toContain(`<LazyChart chartType="table"`)
    // Starts from the built-in's drop zones / display options.
    expect(config).toContain(`getBuiltInChartConfig('table')`)
    // The registration imports the name the config actually exports; the old
    // generator guessed it from the source file name and got 'dataTableConfig'.
    expect(config).toContain('export const customTableChartConfig')
    expect(index).toContain('import { customTableChartConfig }')
    // Registered under a new type so the built-in survives.
    expect(index).toContain(`type: 'customTableChart'`)
  })

  it('honours --name', () => {
    runInit('charts', 'init', '--from', 'bar', '-o', outDir, '--name', 'RevenueBars')

    expect(fs.readdirSync(outDir).sort()).toEqual([
      'RevenueBars.config.ts',
      'RevenueBars.tsx',
      'index.ts',
    ])
    expect(fs.readFileSync(path.join(outDir, 'RevenueBars.config.ts'), 'utf-8'))
      .toContain(`getBuiltInChartConfig('bar')`)
  })

  it('rejects an unknown chart type instead of scaffolding something broken', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exited')
    }) as never)

    expect(() => runInit('charts', 'init', '--from', 'noSuchChart', '-o', outDir)).toThrow('exited')
    expect(exit).toHaveBeenCalledWith(1)
  })
})
