/**
 * Dashboard Export Utilities
 *
 * Serialises a DashboardConfig (plus the host's name/description) into a versioned
 * JSON envelope that can be downloaded, stored, or imported again later. Pure
 * functions, no extra dependency.
 *
 * Usage:
 * 1. Enable in CubeProvider: features={{ dashboardImportExport: { enabled: true } }}
 * 2. Optionally pass `dashboardMeta` to AnalyticsDashboard so exports carry the
 *    dashboard name and description (the library never stores those itself).
 * 3. An Export button appears in the dashboard toolbar.
 */

import type { DashboardConfig, DashboardMeta, PortletConfig } from '../types.js'
import { ensureAnalysisConfig } from './configMigration.js'

// ============================================================================
// File format
// ============================================================================

export const DASHBOARD_EXPORT_FORMAT = 'drizzle-cube-dashboard' as const
export const DASHBOARD_EXPORT_VERSION = 1 as const

/**
 * The on-disk shape of a dashboard export. `version` is the envelope version;
 * portlets carry their own `analysisConfig.version` and migrate independently.
 */
export interface DashboardExportFile {
  format: typeof DASHBOARD_EXPORT_FORMAT
  version: typeof DASHBOARD_EXPORT_VERSION
  /** ISO 8601 timestamp of when the file was created */
  exportedAt: string
  name?: string
  description?: string
  config: DashboardConfig
}

// ============================================================================
// Export
// ============================================================================

const LEGACY_PORTLET_KEYS = [
  'query',
  'chartType',
  'chartConfig',
  'displayConfig',
  'analysisType',
  'funnelCube',
  'funnelSteps',
  'funnelTimeDimension',
  'funnelBindingKey',
  'funnelChartType',
  'funnelChartConfig',
  'funnelDisplayConfig',
] as const satisfies ReadonlyArray<keyof PortletConfig>

/**
 * Canonical form of a portlet for the file: `analysisConfig` guaranteed (migrating
 * legacy fields on the way) and the deprecated legacy fields dropped.
 */
function normalizePortletForExport(portlet: PortletConfig): PortletConfig {
  const normalized: PortletConfig = { ...ensureAnalysisConfig(portlet) }
  for (const key of LEGACY_PORTLET_KEYS) {
    delete normalized[key]
  }
  return normalized
}

/**
 * Prepare a config for export: canonical portlets, transient thumbnail fields removed,
 * everything else untouched.
 */
export function normalizeDashboardConfigForExport(config: DashboardConfig): DashboardConfig {
  const normalized: DashboardConfig = {
    ...config,
    portlets: config.portlets.map(normalizePortletForExport),
  }
  delete normalized.thumbnailData
  delete normalized.thumbnailUrl
  return normalized
}

/**
 * Build the export envelope for a dashboard.
 */
export function createDashboardExport(
  config: DashboardConfig,
  meta?: DashboardMeta,
  now: Date = new Date()
): DashboardExportFile {
  const file: DashboardExportFile = {
    format: DASHBOARD_EXPORT_FORMAT,
    version: DASHBOARD_EXPORT_VERSION,
    exportedAt: now.toISOString(),
    config: normalizeDashboardConfigForExport(config),
  }
  const name = meta?.name?.trim()
  const description = meta?.description?.trim()
  if (name) file.name = name
  if (description) file.description = description
  return file
}

/**
 * Pretty-printed JSON for the file, so exports diff well in version control.
 */
export function serializeDashboardExport(file: DashboardExportFile): string {
  return JSON.stringify(file, null, 2)
}

const MAX_SLUG_LENGTH = 60

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '')
}

/**
 * Filename for an export: `<prefix->?<dashboard-name|dashboard>-<yyyy-mm-dd>.json`.
 */
export function dashboardExportFilename(
  name?: string,
  date: Date = new Date(),
  prefix?: string
): string {
  const slug = slugify(name ?? '') || 'dashboard'
  const prefixSlug = prefix ? slugify(prefix) : ''
  const day = date.toISOString().slice(0, 10)
  return `${prefixSlug ? `${prefixSlug}-` : ''}${slug}-${day}.json`
}

/**
 * Trigger a browser download of the export file. No-op outside a browser.
 */
export function downloadDashboardExport(file: DashboardExportFile, filename?: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return
  const blob = new Blob([serializeDashboardExport(file)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename ?? dashboardExportFilename(file.name)
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
