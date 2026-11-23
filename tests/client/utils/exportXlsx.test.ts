/**
 * Tests for the file name of a portlet XLSX export (portletXlsxFilename).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { portletXlsxFilename } from '../../../src/client/utils/exportXlsx'

describe('portletXlsxFilename', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 3, 12, 0, 0))
    vi.spyOn(crypto, 'randomUUID').mockReturnValue('ab12cd34-0000-4000-8000-000000000000')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('should name the file with the title as a slug, the date and a random suffix', () => {
    expect(portletXlsxFilename('Sales: EU & US (2026)')).toBe('sales-eu-us-2026-20261103-AB12.xlsx')
  })

  it('should name the file "export" when the portlet has no title', () => {
    expect(portletXlsxFilename()).toBe('export-20261103-AB12.xlsx')
    expect(portletXlsxFilename('')).toBe('export-20261103-AB12.xlsx')
  })
})
