import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { dbtGenerate } from '../../../src/cli/commands/dbt.js'

const fixtureDir = 'tests/fixtures/dbt/postgres-simple'
const baseArgs = [
  '--manifest', `${fixtureDir}/manifest.json`,
  '--catalog', `${fixtureDir}/catalog.json`,
  '--dialect', 'postgres',
]

async function outDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'dbt-command-'))
}

describe('dbtGenerate command', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    delete (process.stdin as { isTTY?: boolean }).isTTY
    delete (process.stdout as { isTTY?: boolean }).isTTY
  })

  it('validates required args and dialect', async () => {
    await expect(dbtGenerate([])).rejects.toThrow('Missing required --manifest')
    await expect(dbtGenerate([...baseArgs.slice(0, -1), 'mysql', '--out', await outDir(), '--no-security'])).rejects.toThrow('Unsupported dbt generate dialect mysql')
  })

  it('requires explicit security in non-interactive mode', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: false })
    Object.defineProperty(process.stdout, 'isTTY', { configurable: true, value: false })
    await expect(dbtGenerate([...baseArgs, '--out', await outDir()])).rejects.toThrow('Non-interactive dbt generation requires')
  })

  it('runs dry-run and check modes', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const dir = await outDir()
    await dbtGenerate([...baseArgs, '--out', dir, '--no-security', '--dry-run'])
    expect(log.mock.calls.some((call) => String(call[0]).includes('Would write'))).toBe(true)
    expect(warn.mock.calls.some((call) => String(call[0]).includes('No cube-level security'))).toBe(true)
    await expect(dbtGenerate([...baseArgs, '--out', dir, '--no-security', '--check'])).rejects.toThrow('Generated output is not current')
  })

  it('writes with complete security flags', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    await dbtGenerate([...baseArgs, '--out', await outDir(), '--security-column', 'organisation_id', '--security-context', 'organisationId'])
    expect(log.mock.calls.some((call) => String(call[0]).includes('Generated 4 files'))).toBe(true)
  })
})
