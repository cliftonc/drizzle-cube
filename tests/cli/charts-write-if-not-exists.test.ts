import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { writeIfNotExists } from '../../src/cli/commands/charts'

/**
 * `charts init` must never overwrite a file the user already has. The check and
 * the create are one atomic write (`wx`), so there is no window between them
 * (CodeQL js/file-system-race).
 */
describe('writeIfNotExists', () => {
  let dir: string
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dc-cli-write-'))
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warn.mockRestore()
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('writes a new file', () => {
    const file = path.join(dir, 'Chart.tsx')
    writeIfNotExists(file, 'new content')
    expect(fs.readFileSync(file, 'utf-8')).toBe('new content')
    expect(warn).not.toHaveBeenCalled()
  })

  it('keeps an existing file and reports that it skipped it', () => {
    const file = path.join(dir, 'Chart.tsx')
    fs.writeFileSync(file, 'user content')
    writeIfNotExists(file, 'new content')
    expect(fs.readFileSync(file, 'utf-8')).toBe('user content')
    expect(warn).toHaveBeenCalledWith(`  Skipping ${file} (already exists)`)
  })

  it('throws other write errors', () => {
    expect(() => writeIfNotExists(path.join(dir, 'missing', 'Chart.tsx'), 'x')).toThrow(/ENOENT/)
  })
})
