/**
 * Tests for dashboard JSON export utilities.
 */

import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  DASHBOARD_EXPORT_FORMAT,
  DASHBOARD_EXPORT_VERSION,
  createDashboardExport,
  serializeDashboardExport,
  downloadDashboardExport,
  dashboardExportFilename,
  normalizeDashboardConfigForExport,
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

describe('dashboardExport', () => {
  describe('createDashboardExport', () => {
    it('wraps the config in a versioned envelope with name and description', () => {
      const now = new Date('2026-09-17T10:00:00.000Z')
      const file = createDashboardExport(sampleConfig(), { name: '  Sales  ', description: 'Weekly ' }, now)

      expect(file.format).toBe(DASHBOARD_EXPORT_FORMAT)
      expect(file.version).toBe(DASHBOARD_EXPORT_VERSION)
      expect(file.exportedAt).toBe('2026-09-17T10:00:00.000Z')
      expect(file.name).toBe('Sales')
      expect(file.description).toBe('Weekly')
      expect(file.config.portlets).toHaveLength(2)
      expect(file.config.layoutMode).toBe('rows')
      expect(file.config.rows).toEqual(sampleConfig().rows)
      expect(file.config.filters).toEqual(sampleConfig().filters)
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

    it('does not mutate the input config', () => {
      const config = sampleConfig()
      normalizeDashboardConfigForExport(config)
      expect(config.thumbnailData).toBeDefined()
      expect(config.portlets[0]).toHaveProperty('analysisConfig')
    })
  })

  describe('serializeDashboardExport', () => {
    it('produces pretty-printed JSON that parses back to the envelope', () => {
      const file = createDashboardExport(sampleConfig(), { name: 'Sales', description: 'Weekly' })
      const json = serializeDashboardExport(file)
      expect(json).toContain('\n  "format": "drizzle-cube-dashboard"')
      expect(JSON.parse(json)).toEqual(file)
    })
  })

  describe('dashboardExportFilename', () => {
    const date = new Date('2026-09-17T23:59:00.000Z')

    it('lowercases the dashboard name, dashes the spaces and appends the date', () => {
      expect(dashboardExportFilename('Sales Overview (Q3) — Résumé', date)).toBe('sales-overview-(q3)-—-résumé-2026-09-17.json')
    })

    it('falls back to "dashboard" without a name', () => {
      expect(dashboardExportFilename(undefined, date)).toBe('dashboard-2026-09-17.json')
      expect(dashboardExportFilename('   ', date)).toBe('dashboard-2026-09-17.json')
    })

    it('prepends an optional prefix', () => {
      expect(dashboardExportFilename('Sales', date, 'Acme Corp')).toBe('acme-corp-sales-2026-09-17.json')
    })

    it('replaces path separators so the name stays a single filename', () => {
      expect(dashboardExportFilename('Q3 / Q4', date)).toBe('q3---q4-2026-09-17.json')
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
      const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
      let downloadName = ''
      const append = vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
        downloadName = (node as HTMLAnchorElement).download
        return node
      })
      vi.spyOn(document.body, 'removeChild').mockImplementation((node) => node)

      const now = new Date('2026-09-17T10:00:00.000Z')
      const file = createDashboardExport(sampleConfig(), { name: 'Sales' }, now)
      downloadDashboardExport(file, dashboardExportFilename(file.name, now))

      expect(click).toHaveBeenCalledTimes(1)
      expect(append).toHaveBeenCalledTimes(1)
      expect(downloadName).toBe('sales-2026-09-17.json')
      expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock')
      expect(blobs).toHaveLength(1)
      expect(blobs[0].type).toBe('application/json')
      expect(JSON.parse(await blobs[0].text())).toEqual(file)
    })
  })
})
