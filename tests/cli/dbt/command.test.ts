import { afterEach, describe, expect, it, vi } from 'vitest'

// Mock the generator so command tests never touch real artifacts/db.
const generateFromDbtMock = vi.fn()
vi.mock('../../../src/cli/dbt/generate.js', () => ({
  generateFromDbt: (...args: unknown[]) => generateFromDbtMock(...args),
}))

import { dbtGenerate, printDbtHelp } from '../../../src/cli/commands/dbt.js'

const originalIsTTY = process.stdin.isTTY
const originalStdoutTTY = process.stdout.isTTY

afterEach(() => {
  vi.restoreAllMocks()
  generateFromDbtMock.mockReset()
  // Restore TTY flags between tests.
  Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true })
  Object.defineProperty(process.stdout, 'isTTY', { value: originalStdoutTTY, configurable: true })
})

function setNonInteractive(): void {
  Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true })
  Object.defineProperty(process.stdout, 'isTTY', { value: false, configurable: true })
}

function baseArgv(overrides: Record<string, string | boolean> = {}): string[] {
  return [
    '--manifest', 'target/manifest.json',
    '--catalog', 'target/catalog.json',
    '--dialect', 'postgres',
    '--out', '/tmp/dbt-out',
    ...Object.entries(overrides).flatMap(([k, v]) =>
      typeof v === 'boolean' ? (v ? [`--${k}`] : []) : [`--${k}`, v],
    ),
  ]
}

describe('dbt command', () => {
  it('prints help listing the generate subcommand', () => {
    const logged: string[] = []
    vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => logged.push(a.join(' ')))
    printDbtHelp()
    expect(logged.join('\n')).toContain('dbt generate')
  })

  it.each([
    ['manifest', ['--catalog', 'c', '--dialect', 'postgres', '--out', 'o']],
    ['catalog', ['--manifest', 'm', '--dialect', 'postgres', '--out', 'o']],
    ['dialect', ['--manifest', 'm', '--catalog', 'c', '--out', 'o']],
    ['out', ['--manifest', 'm', '--catalog', 'c', '--dialect', 'postgres']],
  ])('errors when --%s is missing', async (_flag, args) => {
    setNonInteractive()
    await expect(dbtGenerate(['--no-security', ...args])).rejects.toThrow(/Missing required/)
  })

  it('errors on an unsupported dialect', async () => {
    setNonInteractive()
    await expect(
      dbtGenerate(['--manifest', 'm', '--catalog', 'c', '--dialect', 'mysql', '--out', 'o', '--no-security']),
    ).rejects.toThrow(/Unsupported dialect 'mysql'/)
  })

  it('errors in non-interactive mode without security flags', async () => {
    setNonInteractive()
    await expect(
      dbtGenerate(baseArgv()),
    ).rejects.toThrow(/Security mode is required/)
  })

  it('errors when only one of the two security flags is provided', async () => {
    setNonInteractive()
    await expect(
      dbtGenerate(baseArgv({ 'security-column': 'organisation_id' })),
    ).rejects.toThrow(/must be provided together/)
  })

  it('errors when --no-security is combined with security flags', async () => {
    setNonInteractive()
    await expect(
      dbtGenerate(baseArgv({ 'no-security': true, 'security-column': 'organisation_id', 'security-context': 'organisationId' })),
    ).rejects.toThrow(/cannot be combined/)
  })

  it('runs with --no-security and warns about the missing filter', async () => {
    setNonInteractive()
    const warned: string[] = []
    vi.spyOn(console, 'warn').mockImplementation((...a: unknown[]) => warned.push(a.join(' ')))
    generateFromDbtMock.mockResolvedValue({
      files: [{ path: 'schema.ts' }],
      write: { created: ['schema.ts'], updated: [], deleted: [], conflicts: [], drift: false },
      warnings: [],
    })
    vi.spyOn(console, 'log').mockImplementation(() => {})
    await dbtGenerate(baseArgv({ 'no-security': true }))
    expect(generateFromDbtMock).toHaveBeenCalledOnce()
    const opts = generateFromDbtMock.mock.calls[0][0]
    expect(opts.security).toEqual({ kind: 'none' })
    expect(warned.join(' ')).toContain('No cube-level security filter')
  })

  it('runs with filter security flags and passes them through', async () => {
    setNonInteractive()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    generateFromDbtMock.mockResolvedValue({
      files: [{ path: 'schema.ts' }],
      write: { created: ['schema.ts'], updated: [], deleted: [], conflicts: [], drift: false },
      warnings: [],
    })
    await dbtGenerate(baseArgv({ 'security-column': 'organisation_id', 'security-context': 'organisationId' }))
    const opts = generateFromDbtMock.mock.calls[0][0]
    expect(opts.security).toEqual({
      kind: 'filter',
      columnName: 'organisation_id',
      contextProperty: 'organisationId',
    })
  })

  it('throws on --check drift', async () => {
    setNonInteractive()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    generateFromDbtMock.mockResolvedValue({
      files: [{ path: 'schema.ts' }],
      write: { created: [], updated: ['schema.ts'], deleted: [], conflicts: [], missing: [], orphaned: [], drift: true },
      warnings: [],
    })
    await expect(
      dbtGenerate(baseArgv({ 'no-security': true, check: true })),
    ).rejects.toThrow(/Drift detected/)
  })

  it('prints a dry-run summary without writing', async () => {
    setNonInteractive()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const logged: string[] = []
    vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => logged.push(a.join(' ')))
    generateFromDbtMock.mockResolvedValue({
      files: [{ path: 'schema.ts' }, { path: 'cubes/things.ts' }],
      write: { created: ['schema.ts', 'cubes/things.ts'], updated: [], deleted: ['cubes/old.ts'], conflicts: [], missing: [], orphaned: [], drift: false },
      warnings: [],
    })
    await dbtGenerate(baseArgv({ 'no-security': true, 'dry-run': true }))
    const out = logged.join('\n')
    expect(out).toContain('dry-run')
    expect(out).toContain('created: 2')
    expect(out).toContain('deleted (stale): 1')
    const opts = generateFromDbtMock.mock.calls[0][0]
    expect(opts.dryRun).toBe(true)
  })

  it('check summary lists changed, missing, and orphaned paths', async () => {
    setNonInteractive()
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const logged: string[] = []
    vi.spyOn(console, 'log').mockImplementation((...a: unknown[]) => logged.push(a.join(' ')))
    generateFromDbtMock.mockResolvedValue({
      files: [{ path: 'cubes/a.ts' }, { path: 'cubes/b.ts' }, { path: 'cubes/c.ts' }],
      write: {
        created: [],
        updated: ['cubes/a.ts'],
        deleted: [],
        conflicts: [],
        missing: ['cubes/b.ts'],
        orphaned: ['cubes/c.ts'],
        drift: true,
      },
      warnings: [],
    })
    await expect(
      dbtGenerate(baseArgv({ 'no-security': true, check: true })),
    ).rejects.toThrow(/Drift detected/)
    const out = logged.join('\n')
    expect(out).toContain('changed:')
    expect(out).toContain('missing:')
    expect(out).toContain('orphaned:')
    expect(out).toContain('cubes/a.ts')
    expect(out).toContain('cubes/b.ts')
    expect(out).toContain('cubes/c.ts')
  })
})
