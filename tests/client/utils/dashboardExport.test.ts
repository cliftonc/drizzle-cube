/**
 * Tests for dashboard JSON export / import utilities.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  createDashboardExport,
  serializeDashboardExport,
  parseDashboardExport,
  readDashboardExportFile,
  downloadDashboardExport,
  dashboardExportFilename,
  type DashboardImportError,
} from '../../../src/client/utils/dashboardExport'
import type { DashboardConfig, PortletConfig } from '../../../src/client/types'
import type { QueryAnalysisConfig } from '../../../src/client/types/analysisConfig'

function analysisConfig(measure = 'Orders.count'): QueryAnalysisConfig {
  return {
    version: 1,
    analysisType: 'query',
    activeView: 'chart',
    charts: { query: { chartType: 'bar', chartConfig: {}, displayConfig: {} } },
    query: { measures: [measure], dimensions: [] },
  }
}

function portlet(id: string, overrides: Partial<PortletConfig> = {}): PortletConfig {
  return { id, title: `Portlet ${id}`, analysisConfig: analysisConfig(), x: 0, y: 0, w: 6, h: 4, ...overrides }
}

function sampleConfig(): DashboardConfig {
  return {
    portlets: [portlet('a'), portlet('b', { x: 6, dashboardFilterMapping: ['f1'] })],
    layoutMode: 'rows',
    rows: [{ id: 'row-1', h: 4, columns: [{ portletId: 'a', w: 6 }, { portletId: 'b', w: 6 }] }],
    filters: [{ id: 'f1', label: 'Status', filter: { member: 'Orders.status', operator: 'equals', values: ['open'] } }],
    colorPalette: 'ocean',
    eagerLoad: true,
    thumbnailData: 'data:image/png;base64,AAAA',
    thumbnailUrl: 'https://cdn.example.com/thumb.png',
  }
}

function errorCodes(result: ReturnType<typeof parseDashboardExport>): string[] {
  return result.ok ? [] : result.errors.map((e: DashboardImportError) => e.code)
}

describe('dashboardExport', () => {
  describe('createDashboardExport', () => {
    it('wraps the config in an envelope with name and description', () => {
      const now = new Date('2026-09-17T10:00:00.000Z')
      const file = createDashboardExport(sampleConfig(), { name: '  Sales  ', description: 'Weekly ' }, now)

      expect(Object.keys(file)).toEqual(['exportedAt', 'config', 'name', 'description'])
      expect(file.exportedAt).toBe('2026-09-17T10:00:00.000Z')
      expect(file.name).toBe('Sales')
      expect(file.description).toBe('Weekly')
      expect(file.config.portlets).toHaveLength(2)
      expect(file.config.rows).toEqual(sampleConfig().rows)
    })

    it('omits empty name and description', () => {
      const file = createDashboardExport(sampleConfig(), { name: '   ', description: '' })
      expect(file).not.toHaveProperty('name')
      expect(file).not.toHaveProperty('description')
    })

    it('strips transient thumbnail fields', () => {
      const file = createDashboardExport(sampleConfig())
      expect(file.config).not.toHaveProperty('thumbnailData')
      expect(file.config).not.toHaveProperty('thumbnailUrl')
    })

    it('migrates legacy portlets to analysisConfig and drops legacy fields', () => {
      const legacy: PortletConfig = {
        id: 'legacy',
        title: 'Legacy',
        query: JSON.stringify({ measures: ['Orders.count'] }),
        chartType: 'line',
        chartConfig: { yAxis: ['Orders.count'] },
        displayConfig: { showLegend: true },
        x: 0,
        y: 0,
        w: 6,
        h: 4,
      }
      const file = createDashboardExport({ portlets: [legacy] })
      const exported = file.config.portlets[0]

      expect(exported.analysisConfig?.analysisType).toBe('query')
      expect(exported.analysisConfig?.charts.query?.chartType).toBe('line')
      expect(exported).not.toHaveProperty('query')
      expect(exported).not.toHaveProperty('chartType')
      expect(exported).not.toHaveProperty('chartConfig')
      expect(exported).not.toHaveProperty('displayConfig')
    })

    it('rejects malformed legacy portlets instead of exporting an empty chart', () => {
      const malformed: PortletConfig = {
        id: 'malformed',
        title: 'Malformed',
        query: 'not-json',
        chartType: 'line',
        x: 0,
        y: 0,
        w: 6,
        h: 4,
      }

      expect(() => createDashboardExport({ portlets: [malformed] })).toThrow(
        'Cannot export portlet "malformed": legacy query is not valid JSON'
      )
    })
  })

  describe('round trip', () => {
    it('serializes to pretty JSON and parses back to the same config', () => {
      const file = createDashboardExport(sampleConfig(), { name: 'Sales', description: 'Weekly' })
      const json = serializeDashboardExport(file)
      expect(json).toContain('\n  "exportedAt": "')

      const result = parseDashboardExport(json)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.name).toBe('Sales')
      expect(result.description).toBe('Weekly')
      expect(result.config).toEqual(file.config)
      expect(result.warnings).toEqual([])
    })
  })

  describe('dashboardExportFilename', () => {
    const date = new Date('2026-09-17T23:59:00.000Z')

    it('lowercases the name, dashes spaces and path separators, and appends the date', () => {
      expect(dashboardExportFilename('Sales Overview (Q3) — Résumé', date)).toBe('sales-overview-(q3)-—-résumé-2026-09-17.json')
      expect(dashboardExportFilename('Q3 / Q4', date)).toBe('q3---q4-2026-09-17.json')
    })

    it('falls back to "dashboard" without a name', () => {
      expect(dashboardExportFilename(undefined, date)).toBe('dashboard-2026-09-17.json')
      expect(dashboardExportFilename('   ', date)).toBe('dashboard-2026-09-17.json')
    })

    it('prepends an optional prefix', () => {
      expect(dashboardExportFilename('Sales', date, 'Acme Corp')).toBe('acme-corp-sales-2026-09-17.json')
    })
  })

  describe('parseDashboardExport', () => {
    it('rejects invalid JSON text', () => {
      expect(errorCodes(parseDashboardExport('{not json'))).toEqual(['invalidJson'])
    })

    it('rejects values that are neither an envelope nor a config', () => {
      expect(errorCodes(parseDashboardExport('42'))).toEqual(['unknownFormat'])
      expect(errorCodes(parseDashboardExport('[]'))).toEqual(['unknownFormat'])
      expect(errorCodes(parseDashboardExport({ hello: 'world' }))).toEqual(['unknownFormat'])
      expect(errorCodes(parseDashboardExport({ name: 'Sales', exportedAt: 'now' }))).toEqual(['unknownFormat'])
    })

    it('rejects an envelope whose config is not an object', () => {
      const result = parseDashboardExport({ config: 'nope' })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors).toEqual([{ code: 'invalidConfig', path: '' }])
    })

    it('accepts a bare DashboardConfig object', () => {
      const result = parseDashboardExport(sampleConfig())
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.name).toBeUndefined()
      expect(result.config.portlets.map((p) => p.id)).toEqual(['a', 'b'])
      expect(result.config).not.toHaveProperty('thumbnailData')
      expect(result.config).not.toHaveProperty('thumbnailUrl')
    })

    it('accepts a bare config given as JSON text', () => {
      const result = parseDashboardExport(JSON.stringify({ portlets: [portlet('a')] }))
      expect(result.ok).toBe(true)
    })

    it('drops unknown top-level keys', () => {
      const result = parseDashboardExport({ ...sampleConfig(), somethingElse: true })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.config).not.toHaveProperty('somethingElse')
    })

    it('trims name and description and ignores empty ones', () => {
      const envelope = { name: '  Sales ', description: '   ', config: { portlets: [] } }
      const result = parseDashboardExport(envelope)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.name).toBe('Sales')
      expect(result.description).toBeUndefined()
    })

    it('rejects a config without a portlets array', () => {
      const result = parseDashboardExport({ config: { portlets: 'nope' } })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors).toEqual([{ code: 'invalidConfig', path: 'portlets' }])
    })

    it('reports each invalid portlet with its index and offending field', () => {
      const result = parseDashboardExport({
        portlets: [
          { title: 'no id', analysisConfig: analysisConfig(), x: 0, y: 0, w: 6, h: 4 },
          portlet('ok'),
          { id: 'bad-geometry', title: 't', analysisConfig: analysisConfig(), x: 0, y: 0, w: 'wide', h: 4 },
          { id: 'bad-analysis', title: 't', analysisConfig: { version: 2 }, x: 0, y: 0, w: 6, h: 4 },
          { id: 'no-query', title: 't', x: 0, y: 0, w: 6, h: 4 },
        ],
      })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors).toEqual([
        { code: 'invalidPortlet', index: 0, path: 'id' },
        { code: 'invalidPortlet', index: 2, path: 'w' },
        { code: 'invalidPortlet', index: 3, path: 'analysisConfig' },
        { code: 'invalidPortlet', index: 4, path: 'analysisConfig' },
      ])
    })

    it('accepts canonical analysisConfigs, including multi-query and empty queries', () => {
      const withAnalysis = (overrides: Record<string, unknown>) =>
        parseDashboardExport({
          portlets: [{ id: 'p', title: 'P', x: 0, y: 0, w: 6, h: 4, analysisConfig: { ...analysisConfig(), ...overrides } }],
        })
      expect(withAnalysis({}).ok).toBe(true)
      expect(withAnalysis({ query: { queries: [{ measures: ['a'] }, { measures: ['b'] }], mergeStrategy: 'concat' } }).ok).toBe(true)
      expect(withAnalysis({ query: {} }).ok).toBe(true)
    })

    it('migrates legacy portlets on import', () => {
      const result = parseDashboardExport({
        portlets: [
          {
            id: 'legacy',
            title: 'Legacy',
            query: JSON.stringify({ measures: ['Orders.count'] }),
            chartType: 'pie',
            x: 0,
            y: 0,
            w: 6,
            h: 4,
          },
        ],
      })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      const imported = result.config.portlets[0]
      expect(imported.analysisConfig?.charts.query?.chartType).toBe('pie')
      expect(imported).not.toHaveProperty('query')
      expect(imported).not.toHaveProperty('chartType')
    })

    it('accepts a legacy text portlet with an empty query and a legacy funnel merge', () => {
      const text = parseDashboardExport({
        portlets: [{ id: 'md', title: 'Header', query: '{}', chartType: 'markdown', x: 0, y: 0, w: 12, h: 1 }],
      })
      expect(text.ok).toBe(true)

      const funnel = parseDashboardExport({
        portlets: [
          {
            id: 'fn',
            title: 'Funnel',
            query: JSON.stringify({
              queries: [{ measures: ['Events.count'], filters: [{ member: 'Events.name', operator: 'equals', values: ['a'] }] }],
              mergeStrategy: 'funnel',
              queryLabels: ['Step A'],
            }),
            x: 0,
            y: 0,
            w: 6,
            h: 4,
          },
        ],
      })
      expect(funnel.ok).toBe(true)
      if (!funnel.ok) return
      const config = funnel.config.portlets[0].analysisConfig
      expect(config?.analysisType).toBe('funnel')
      expect(config?.charts.funnel?.chartType).toBe('funnel')
    })

    it('keeps valid optional portlet fields', () => {
      const result = parseDashboardExport({
        portlets: [portlet('a', { eagerLoad: true, dashboardFilterMapping: ['f1', { filterId: 'f2', member: 'Orders.date' }] })],
        filters: [
          { id: 'f1', label: 'One', filter: { member: 'Orders.status', operator: 'equals', values: ['x'] } },
          { id: 'f2', label: 'Two', filter: { member: 'Orders.date', operator: 'inDateRange', values: ['last week'] } },
        ],
      })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.config.portlets[0].eagerLoad).toBe(true)
      expect(result.config.portlets[0].dashboardFilterMapping).toEqual(['f1', { filterId: 'f2', member: 'Orders.date' }])
      expect(result.warnings).toEqual([])
    })

    it('rejects a malformed filter mapping', () => {
      const result = parseDashboardExport({ portlets: [portlet('a', { dashboardFilterMapping: [{ member: 'x' }] as never })] })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors).toEqual([{ code: 'invalidPortlet', index: 0, path: 'dashboardFilterMapping' }])
    })

    it('validates top-level config fields', () => {
      const result = parseDashboardExport({
        portlets: [portlet('a')],
        layoutMode: 'diagonal',
        grid: { cols: 12 },
        colorPalette: 7,
        eagerLoad: 'yes',
        layouts: [],
      })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors.map((e) => (e.code === 'invalidConfig' ? e.path : e.code))).toEqual([
        'layoutMode',
        'grid',
        'colorPalette',
        'eagerLoad',
        'layouts',
      ])
    })

    it('rejects rows that reference unknown portlets or groups', () => {
      const unknownPortlet = parseDashboardExport({
        portlets: [portlet('a')],
        rows: [{ id: 'r', h: 4, columns: [{ portletId: 'ghost', w: 12 }] }],
      })
      expect(unknownPortlet.ok).toBe(false)
      if (unknownPortlet.ok) return
      expect(unknownPortlet.errors).toEqual([{ code: 'invalidConfig', path: 'rows[0].columns[0].portletId' }])

      const unknownGroup = parseDashboardExport({
        portlets: [portlet('a')],
        rows: [{ id: 'r', h: 4, columns: [{ groupId: 'ghost', w: 12 }] }],
      })
      expect(unknownGroup.ok).toBe(false)
      if (unknownGroup.ok) return
      expect(unknownGroup.errors).toEqual([{ code: 'invalidConfig', path: 'rows[0].columns[0].groupId' }])
    })

    it('rejects a row column that names both a portlet and a group', () => {
      const result = parseDashboardExport({
        portlets: [portlet('a')],
        rows: [{ id: 'r', h: 4, columns: [{ portletId: 'a', groupId: 'g', w: 12 }] }],
      })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors).toEqual([{ code: 'invalidConfig', path: 'rows[0].columns[0]' }])
    })

    it('accepts groups and rows that reference known ids', () => {
      const result = parseDashboardExport({
        portlets: [portlet('a'), portlet('b')],
        layoutMode: 'rows',
        groups: [{ id: 'g1', title: 'Pair', direction: 'row', cells: [{ portletIds: ['a'] }, { portletIds: ['b'] }] }],
        rows: [{ id: 'r', h: 4, columns: [{ groupId: 'g1', w: 12 }] }],
      })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.config.groups).toEqual([
        { id: 'g1', title: 'Pair', direction: 'row', cells: [{ portletIds: ['a'] }, { portletIds: ['b'] }] },
      ])
      expect(result.config.rows).toEqual([{ id: 'r', h: 4, columns: [{ groupId: 'g1', w: 12 }] }])
    })

    it('rejects groups that reference unknown portlets', () => {
      const result = parseDashboardExport({
        portlets: [portlet('a')],
        groups: [{ id: 'g1', direction: 'column', cells: [{ portletIds: ['ghost'] }] }],
      })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors).toEqual([{ code: 'invalidConfig', path: 'groups[0].cells[0].portletIds' }])
    })

    it('rejects malformed dashboard filters', () => {
      const result = parseDashboardExport({
        portlets: [portlet('a')],
        filters: [{ id: 'f1', label: 'Missing filter body' }],
      })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.errors).toEqual([{ code: 'invalidConfig', path: 'filters[0]' }])
    })

    it('warns about portlets linked to filters the file does not define', () => {
      const result = parseDashboardExport({
        portlets: [portlet('a', { dashboardFilterMapping: ['missing'] })],
        filters: [],
      })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.warnings).toEqual([
        { code: 'unknownFilterMapping', portletId: 'a', portletTitle: 'Portlet a', filterId: 'missing' },
      ])
      // Mapping is kept: the host may provide that filter programmatically
      expect(result.config.portlets[0].dashboardFilterMapping).toEqual(['missing'])
    })

    it('does not warn about mappings when the file defines no filters at all', () => {
      const result = parseDashboardExport({ portlets: [portlet('a', { dashboardFilterMapping: ['runtime'] })] })
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.warnings).toEqual([])
    })
  })

  describe('readDashboardExportFile', () => {
    it('reads and parses a File', async () => {
      const file = createDashboardExport(sampleConfig(), { name: 'From file' })
      const picked = new File([serializeDashboardExport(file)], 'from-file.json', { type: 'application/json' })

      const result = await readDashboardExportFile(picked)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.name).toBe('From file')
      expect(result.config.portlets).toHaveLength(2)
    })

    it('reports invalid JSON files', async () => {
      const picked = new File(['nope'], 'bad.json', { type: 'application/json' })
      expect(errorCodes(await readDashboardExportFile(picked))).toEqual(['invalidJson'])
    })
  })

  describe('downloadDashboardExport', () => {
    const originalCreate = URL.createObjectURL
    const originalRevoke = URL.revokeObjectURL

    afterEach(() => {
      URL.createObjectURL = originalCreate
      URL.revokeObjectURL = originalRevoke
      vi.restoreAllMocks()
    })

    it('downloads the serialized file under the dashboard filename', async () => {
      const blobs: Blob[] = []
      URL.createObjectURL = vi.fn((blob: Blob) => {
        blobs.push(blob)
        return 'blob:mock'
      })
      URL.revokeObjectURL = vi.fn()
      let downloadName = ''
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        downloadName = this.download
      })

      const now = new Date('2026-09-17T10:00:00.000Z')
      const file = createDashboardExport(sampleConfig(), { name: 'Sales' }, now)
      downloadDashboardExport(file, dashboardExportFilename(file.name, now))

      expect(click).toHaveBeenCalledTimes(1)
      expect(downloadName).toBe('sales-2026-09-17.json')
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
      expect(blobs).toHaveLength(1)
      expect(blobs[0].type).toBe('application/json')
      const parsed = parseDashboardExport(await blobs[0].text())
      expect(parsed.ok).toBe(true)
      if (!parsed.ok) return
      expect(parsed.name).toBe('Sales')
    })
  })
})
