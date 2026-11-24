/**
 * Tests for the XLSX export of portlet data.
 *
 * The tests use the real exceljs package and read the downloaded file back,
 * so they check the worksheet names that a user sees in Excel.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ExcelJS from 'exceljs'
import { exportPortletToXlsx, portletXlsxFilename } from '../../../src/client/utils/exportXlsx'
import type { PortletDebugDataEntry } from '../../../src/client/stores/dashboardStore'

let downloads: Blob[] = []

function debugData(data: PortletDebugDataEntry['data']): PortletDebugDataEntry {
  return {
    chartConfig: {},
    displayConfig: {},
    queryObject: null,
    data,
    chartType: 'table',
  }
}

function readBlob(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(blob)
  })
}

async function downloadedSheetNames(): Promise<string[]> {
  expect(downloads).toHaveLength(1)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await readBlob(downloads[0]))
  return workbook.worksheets.map(worksheet => worksheet.name)
}

describe('exportPortletToXlsx', () => {
  const originalCreate = URL.createObjectURL
  const originalRevoke = URL.revokeObjectURL

  beforeEach(() => {
    downloads = []
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    URL.createObjectURL = vi.fn((blob: Blob) => {
      downloads.push(blob)
      return 'blob:portlet-export'
    })
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    URL.createObjectURL = originalCreate
    URL.revokeObjectURL = originalRevoke
    vi.restoreAllMocks()
  })

  const rows = [{ 'Employees.name': 'Alice', 'Employees.count': 3 }]

  it('uses the portlet title as the worksheet name', async () => {
    await expect(exportPortletToXlsx('Employees by department', debugData(rows))).resolves.toBe(true)
    expect(await downloadedSheetNames()).toEqual(['Employees by department'])
  })

  it.each([
    ['Revenue / Cost', 'Revenue - Cost'],
    ['Q1: [draft] *new*?', 'Q1- -draft- -new--'],
    ['C:\\exports', 'C--exports'],
  ])('replaces the characters that Excel rejects in %j', async (title, sheetName) => {
    await expect(exportPortletToXlsx(title, debugData(rows))).resolves.toBe(true)
    expect(await downloadedSheetNames()).toEqual([sheetName])
  })

  it('cuts a long portlet title to 31 characters', async () => {
    const title = 'Active employees per department and office'
    await expect(exportPortletToXlsx(title, debugData(rows))).resolves.toBe(true)
    expect(await downloadedSheetNames()).toEqual(['Active employees per department'])
  })

  it('removes an apostrophe at the start or the end of the worksheet name', async () => {
    await expect(exportPortletToXlsx("'Quoted title'", debugData(rows))).resolves.toBe(true)
    expect(await downloadedSheetNames()).toEqual(['Quoted title'])
  })

  it('removes an apostrophe that the 31-character cut puts at the end', async () => {
    const title = "Revenue of the regional office's sales"
    await expect(exportPortletToXlsx(title, debugData(rows))).resolves.toBe(true)
    expect(await downloadedSheetNames()).toEqual(['Revenue of the regional office'])
  })

  it.each(['History', 'history'])('renames the reserved worksheet name %j', async (title) => {
    await expect(exportPortletToXlsx(title, debugData(rows))).resolves.toBe(true)
    expect(await downloadedSheetNames()).toEqual(['History data'])
  })

  it.each(['', '   ', "''"])('uses Sheet1 when the portlet title %j gives no usable name', async (title) => {
    await expect(exportPortletToXlsx(title, debugData(rows))).resolves.toBe(true)
    expect(await downloadedSheetNames()).toEqual(['Sheet1'])
  })

  it('keeps the Nodes and Links worksheets of flow data', async () => {
    const flowData = {
      nodes: [{ id: 'a', name: 'Start' }],
      links: [{ source: 'a', target: 'a', value: 1 }],
    }
    await expect(
      exportPortletToXlsx('Flow: signup / checkout', debugData(flowData as unknown as PortletDebugDataEntry['data']))
    ).resolves.toBe(true)
    expect(await downloadedSheetNames()).toEqual(['Nodes', 'Links'])
  })
})

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
