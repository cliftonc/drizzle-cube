import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the generator pipeline so command summary formatting can be asserted
// deterministically without depending on artifact parsing in these unit tests.
vi.mock('../../../src/cli/dbt/generate.js', () => ({
  generateFromDbt: vi.fn(),
}))

import { generateFromDbt } from '../../../src/cli/dbt/generate.js'
import { dbtGenerate, printDbtHelp } from '../../../src/cli/commands/dbt.js'
import type { GenerationResult } from '../../../src/cli/dbt/types.js'

const mockedGenerate = vi.mocked(generateFromDbt)

function genResult(over: Partial<GenerationResult> = {}): GenerationResult {
  return {
    files: [],
    write: {
      created: [], updated: [], deleted: [], conflicts: [], missing: [], orphaned: [], drift: false,
    },
    warnings: [],
    ...over,
  }
}

const baseArgs = [
  '--manifest', 'manifest.json',
  '--catalog', 'catalog.json',
  '--dialect', 'postgres',
  '--out', './out',
]

describe('dbtGenerate — argument validation', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
    mockedGenerate.mockReset()
  })

  it('errors when a required flag is missing', async () => {
    await expect(dbtGenerate(['--manifest', 'x', '--catalog', 'y', '--dialect', 'postgres'])).rejects.toThrow(/--out/)
  })

  it('errors on an unsupported dialect', async () => {
    await expect(dbtGenerate([...baseArgs.slice(0, 6), '--dialect', 'mysql', '--out', './out'])).rejects.toThrow(/Unsupported dialect 'mysql'/)
  })

  it('errors in non-interactive mode without security flags', async () => {
    // isTTY undefined → treated as non-interactive.
    await expect(dbtGenerate(baseArgs)).rejects.toThrow(/non-interactive/)
  })

  it('requires both --security-column and --security-context together', async () => {
    await expect(dbtGenerate([...baseArgs, '--security-column', 'organisation_id'])).rejects.toThrow(/together/)
  })

  it('rejects --no-security combined with security flags', async () => {
    await expect(
      dbtGenerate([...baseArgs, '--no-security', '--security-column', 'organisation_id', '--security-context', 'organisationId']),
    ).rejects.toThrow(/--no-security cannot be combined/)
  })

  it('accepts --no-security, warns, and runs the pipeline', async () => {
    mockedGenerate.mockResolvedValue(genResult())
    await dbtGenerate([...baseArgs, '--no-security'])
    expect(mockedGenerate).toHaveBeenCalledOnce()
    const opts = mockedGenerate.mock.calls[0][0]
    expect(opts.security).toEqual({ kind: 'none' })
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('No cube-level security filter will be applied'),
    )
  })

  it('accepts both security flags and runs the pipeline', async () => {
    mockedGenerate.mockResolvedValue(genResult())
    await dbtGenerate([...baseArgs, '--security-column', 'organisation_id', '--security-context', 'organisationId'])
    const opts = mockedGenerate.mock.calls[0][0]
    expect(opts.security).toEqual({
      kind: 'filter',
      columnName: 'organisation_id',
      contextProperty: 'organisationId',
    })
  })
})

describe('dbtGenerate — summary output', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
    mockedGenerate.mockReset()
  })

  it('prints a non-check summary with counts and prefix', async () => {
    mockedGenerate.mockResolvedValue(
      genResult({
        write: { created: ['schema.ts'], updated: ['cubes/orders.ts'], deleted: [], conflicts: [], missing: [], orphaned: [], drift: false },
      }),
    )
    await dbtGenerate([...baseArgs, '--no-security'])
    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/\[drizzle-cube\] created 1, updated 1, deleted 0 \(stale\), conflicts 0\./),
    )
  })

  it('prints a dry-run summary with the dry-run prefix', async () => {
    mockedGenerate.mockResolvedValue(
      genResult({
        write: { created: ['schema.ts'], updated: [], deleted: [], conflicts: [], missing: [], orphaned: [], drift: false },
      }),
    )
    await dbtGenerate([...baseArgs, '--no-security', '--dry-run'])
    expect(console.log).toHaveBeenCalledWith(
      expect.stringMatching(/\[drizzle-cube dry-run\] created 1, updated 0, deleted 0 \(stale\), conflicts 0\./),
    )
  })

  it('prints warnings to stderr', async () => {
    mockedGenerate.mockResolvedValue(
      genResult({
        warnings: [{ code: 'MODEL_SKIPPED', message: 'skipped it', modelName: 'ephemeral_rollup' }],
      }),
    )
    await dbtGenerate([...baseArgs, '--no-security'])
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('[drizzle-cube] MODEL_SKIPPED: skipped it (model=ephemeral_rollup)'),
    )
  })

  it('prints changed/missing/orphaned paths in check mode and throws on drift', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    mockedGenerate.mockResolvedValue(
      genResult({
        write: {
          created: [], updated: ['schema.ts'], deleted: [], conflicts: [],
          missing: ['cubes/customers.ts'], orphaned: ['cubes/stale.ts'], drift: true,
        },
      }),
    )
    await expect(dbtGenerate([...baseArgs, '--no-security', '--check'])).rejects.toThrow(/Drift detected: generated output does not match/)
    const logged = logSpy.mock.calls.map((c) => String(c[0]))
    expect(logged.some((l) => l.includes('Drift detected: 1 changed, 1 missing, 1 orphaned.'))).toBe(true)
    expect(logged.some((l) => l.includes('schema.ts'))).toBe(true)
    expect(logged.some((l) => l.includes('cubes/stale.ts'))).toBe(true)
  })

  it('prints "No drift detected." and does not throw when check is clean', async () => {
    mockedGenerate.mockResolvedValue(genResult())
    await dbtGenerate([...baseArgs, '--no-security', '--check'])
    expect(console.log).toHaveBeenCalledWith('No drift detected.')
  })
})

describe('printDbtHelp', () => {
  it('lists the generate command and options', () => {
    const logged: string[] = []
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logged.push(args.map(String).join(' '))
    })
    printDbtHelp()
    const output = logged.join('\n')
    expect(output).toContain('drizzle-cube dbt generate')
    expect(output).toContain('--manifest')
    expect(output).toContain('--check')
  })
})
