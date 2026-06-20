/**
 * DB-free CLI test.
 *
 * Lives in the `cli` vitest project (see vitest.config.ts): no Docker, no
 * globalSetup, no database. Pure logic over in-memory fixtures / captured
 * output, runs in milliseconds. CLI / parser / codegen tests belong here;
 * only code that actually issues SQL belongs in the `server` project.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { chartsList } from '../../src/cli/commands/charts'

describe('charts list (DB-free CLI)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('prints the built-in chart catalogue without touching a database', () => {
    const logged: string[] = []
    vi.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
      logged.push(args.map(String).join(' '))
    })

    chartsList()

    const output = logged.join('\n')
    expect(output).toContain('Available built-in chart types')
    // A representative spread of the catalogue, type + description.
    expect(output).toContain('bar')
    expect(output).toContain('Bar chart')
    expect(output).toContain('funnel')
    expect(output).toContain('table')
  })
})
