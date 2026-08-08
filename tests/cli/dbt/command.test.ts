import { afterEach, describe, expect, it, vi } from 'vitest'

const generateFromDbt = vi.fn()
vi.mock('../../../src/cli/dbt/generate', () => ({ generateFromDbt }))

const { dbtGenerate } = await import('../../../src/cli/commands/dbt')

describe('dbt command', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    generateFromDbt.mockReset()
  })

  it('validates required args and dialect before reading artifacts', async () => {
    await expect(dbtGenerate([])).rejects.toThrow('Missing required option --dialect')
    await expect(dbtGenerate(['--dialect', 'mysql', '--manifest', 'm', '--catalog', 'c', '--out', 'o', '--no-security'])).rejects.toThrow("Unsupported dbt dialect 'mysql'")
  })

  it('requires explicit security in non-interactive mode', async () => {
    await expect(dbtGenerate(['--dialect', 'postgres', '--manifest', 'm', '--catalog', 'c', '--out', 'o'])).rejects.toThrow('Non-interactive')
    await expect(dbtGenerate(['--dialect', 'postgres', '--manifest', 'm', '--catalog', 'c', '--out', 'o', '--security-column', 'organisation_id'])).rejects.toThrow('Both --security-column')
  })

  it('supports --no-security warning path and prints summary', async () => {
    const stdout: string[] = []
    const stderr: string[] = []
    vi.spyOn(console, 'log').mockImplementation((message: unknown) => stdout.push(String(message)))
    vi.spyOn(console, 'error').mockImplementation((message: unknown) => stderr.push(String(message)))
    generateFromDbt.mockResolvedValue({
      files: [{ path: 'schema.ts', content: '' }],
      writeResult: { created: ['schema.ts'], updated: [], unchanged: [], deleted: [], conflicts: [], warnings: [] },
      warnings: [{ code: 'example', message: 'Example warning.' }]
    })

    await dbtGenerate(['--dialect', 'postgres', '--manifest', 'm', '--catalog', 'c', '--out', 'o', '--no-security', '--dry-run'])

    expect(generateFromDbt).toHaveBeenCalledWith(expect.objectContaining({ security: { kind: 'none' }, dryRun: true }))
    expect(stderr.join('\n')).toContain('no cube-level security')
    expect(stdout.join('\n')).toContain('Generated 1 files')
  })
})
