/**
 * Dashboard Export / Import Utilities
 *
 * Serialises a DashboardConfig (plus the host's name/description) into a small
 * JSON envelope, and parses such files back with a structural shape check and
 * legacy-portlet migration. Pure functions, no extra dependency.
 *
 * Usage:
 * 1. Enable in CubeProvider: features={{ dashboardImportExport: { enabled: true } }}
 * 2. Optionally pass `dashboardMeta` / `onDashboardMetaChange` to AnalyticsDashboard so
 *    exports carry the dashboard name and imports can rename the host's record.
 * 3. Export / Import buttons appear in the dashboard toolbar. Export is offered in view
 *    and edit mode and also on read-only dashboards (`editable={false}`); import only
 *    while editing. `hideToolbar` still hides both.
 *
 * Hosts that create new dashboards from a file (e.g. on a list page) use
 * `readDashboardExportFile()` directly and persist the returned config themselves.
 */

import type {
  DashboardConfig,
  DashboardFilter,
  DashboardFilterMappingEntry,
  DashboardGridSettings,
  DashboardLayoutMode,
  DashboardMeta,
  PortletConfig,
  PortletGroup,
  PortletGroupCell,
  RowLayout,
  RowLayoutColumn,
} from '../types.js'
import { isValidAnalysisConfig } from '../types/analysisConfig.js'
import {
  ensureAnalysisConfig,
  hasAnalysisConfig,
  migrateLegacyPortlet,
} from './configMigration.js'

// ============================================================================
// File format
// ============================================================================

/**
 * The on-disk shape of a dashboard export: the config plus the host-owned name and
 * description. Portlets carry their own `analysisConfig.version` and migrate on read.
 */
export interface DashboardExportFile {
  /** ISO 8601 timestamp of when the file was created */
  exportedAt: string
  name?: string
  description?: string
  config: DashboardConfig
}

/**
 * Why a file could not be imported. The check is structural only: the file has to
 * have the shape of a dashboard config, and its contents are taken on trust from
 * there. Codes, not sentences: the UI resolves them to translated text
 * (`dashboard.import.error.<code>`).
 */
export type DashboardImportError =
  | { code: 'invalidJson' }
  | { code: 'unknownFormat' }
  | { code: 'invalidConfig'; path: string }
  | { code: 'invalidPortlet'; index: number; path: string }

/**
 * Non-fatal findings about an otherwise valid file.
 */
export type DashboardImportWarning =
  | { code: 'unknownFilterMapping'; portletId: string; portletTitle: string; filterId: string }

export type DashboardImportResult =
  | {
      ok: true
      config: DashboardConfig
      name?: string
      description?: string
      warnings: DashboardImportWarning[]
    }
  | { ok: false; errors: DashboardImportError[] }

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
  // ensureAnalysisConfig intentionally falls back to a default query when it
  // cannot parse legacy data. An export must not turn a broken chart into a
  // valid-looking empty one, so validate legacy JSON before migrating it.
  if (!hasAnalysisConfig(portlet)) {
    if (typeof portlet.query !== 'string') {
      throw new Error(`Cannot export portlet "${portlet.id}": no valid analysis configuration`)
    }
    try {
      JSON.parse(portlet.query)
    } catch {
      throw new Error(`Cannot export portlet "${portlet.id}": legacy query is not valid JSON`)
    }
  }

  const normalized: PortletConfig = { ...ensureAnalysisConfig(portlet) }
  if (!hasAnalysisConfig(normalized)) {
    throw new Error(`Cannot export portlet "${portlet.id}": could not migrate analysis configuration`)
  }
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

function toFileNamePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[/\\]/g, '-')
}

/**
 * Filename for an export: `<prefix->?<dashboard-name|dashboard>-<yyyy-mm-dd>.json`.
 * The name is lowercased with spaces turned into dashes — no slugification.
 */
export function dashboardExportFilename(
  name?: string,
  date: Date = new Date(),
  prefix?: string
): string {
  const namePart = toFileNamePart(name ?? '') || 'dashboard'
  const prefixPart = prefix ? toFileNamePart(prefix) : ''
  const day = date.toISOString().slice(0, 10)
  return `${prefixPart ? `${prefixPart}-` : ''}${namePart}-${day}.json`
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

// ============================================================================
// Import
// ============================================================================

const LAYOUT_MODES: readonly DashboardLayoutMode[] = ['grid', 'rows']

type UnknownRecord = Record<string, unknown>

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === 'string'
}

function isOptionalBoolean(value: unknown): value is boolean | undefined {
  return value === undefined || typeof value === 'boolean'
}

function isOptionalRecord(value: unknown): value is UnknownRecord | undefined {
  return value === undefined || isRecord(value)
}

function isLayoutMode(value: unknown): value is DashboardLayoutMode {
  return typeof value === 'string' && LAYOUT_MODES.includes(value as DashboardLayoutMode)
}

function isGridSettings(value: unknown): value is DashboardGridSettings {
  return isRecord(value) && (['cols', 'rowHeight', 'minW', 'minH'] as const).every((key) => isFiniteNumber(value[key]))
}

function isFilterMappingEntry(value: unknown): value is string | DashboardFilterMappingEntry {
  if (typeof value === 'string') return true
  return isRecord(value) && isNonEmptyString(value.filterId) && isOptionalString(value.member)
}

function isDashboardFilter(value: unknown): value is DashboardFilter {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    typeof value.label === 'string' &&
    isRecord(value.filter) &&
    isOptionalBoolean(value.isUniversalTime)
  )
}

function isGroupCell(value: unknown): value is PortletGroupCell {
  return isRecord(value) && Array.isArray(value.portletIds) && value.portletIds.every((id) => typeof id === 'string')
}

function isRowColumn(value: unknown): value is RowLayoutColumn {
  if (!isRecord(value) || !isFiniteNumber(value.w)) return false
  const hasPortlet = value.portletId !== undefined
  const hasGroup = value.groupId !== undefined
  if (hasPortlet === hasGroup) return false
  return isOptionalString(value.portletId) && isOptionalString(value.groupId)
}

type PortletParseResult = { ok: true; portlet: PortletConfig } | { ok: false; error: DashboardImportError }

/**
 * Read one portlet and return it in canonical form (analysisConfig guaranteed,
 * legacy fields migrated and dropped), or the reason its shape was rejected.
 */
function parsePortlet(value: unknown, index: number): PortletParseResult {
  const fail = (path: string): PortletParseResult => ({ ok: false, error: { code: 'invalidPortlet', index, path } })

  if (!isRecord(value)) return fail('')
  if (!isNonEmptyString(value.id)) return fail('id')
  if (typeof value.title !== 'string') return fail('title')
  const { x, y, w, h } = value
  if (!isFiniteNumber(x)) return fail('x')
  if (!isFiniteNumber(y)) return fail('y')
  if (!isFiniteNumber(w)) return fail('w')
  if (!isFiniteNumber(h)) return fail('h')

  const portlet: PortletConfig = { id: value.id, title: value.title, x, y, w, h }

  const mapping = value.dashboardFilterMapping
  if (mapping !== undefined) {
    if (!Array.isArray(mapping) || !mapping.every(isFilterMappingEntry)) return fail('dashboardFilterMapping')
    portlet.dashboardFilterMapping = mapping.filter(isFilterMappingEntry)
  }
  if (!isOptionalBoolean(value.eagerLoad)) return fail('eagerLoad')
  if (value.eagerLoad !== undefined) portlet.eagerLoad = value.eagerLoad

  // Query/chart definition: either a valid canonical analysisConfig, or the legacy
  // `query` JSON string (plus its sibling chart fields) that configMigration upgrades.
  if (value.analysisConfig !== undefined) {
    if (!isValidAnalysisConfig(value.analysisConfig)) return fail('analysisConfig')
    portlet.analysisConfig = value.analysisConfig
    return { ok: true, portlet }
  }
  if (typeof value.query !== 'string') return fail('analysisConfig')
  if (!isOptionalString(value.chartType) || !isOptionalString(value.funnelChartType)) return fail('chartType')
  if (!isOptionalRecord(value.chartConfig) || !isOptionalRecord(value.funnelChartConfig)) return fail('chartConfig')
  if (!isOptionalRecord(value.displayConfig) || !isOptionalRecord(value.funnelDisplayConfig)) return fail('displayConfig')
  const analysisType = value.analysisType
  if (analysisType !== undefined && analysisType !== 'query' && analysisType !== 'funnel') return fail('analysisType')

  const migrated = migrateLegacyPortlet({
    query: value.query,
    chartType: value.chartType,
    chartConfig: value.chartConfig,
    displayConfig: value.displayConfig,
    analysisType,
    funnelChartType: value.funnelChartType,
    funnelChartConfig: value.funnelChartConfig,
    funnelDisplayConfig: value.funnelDisplayConfig,
  })
  portlet.analysisConfig = migrated
  return { ok: true, portlet }
}

type SectionResult<T> = { ok: true; value: T } | { ok: false; error: DashboardImportError }

function invalidConfig<T>(path: string): SectionResult<T> {
  return { ok: false, error: { code: 'invalidConfig', path } }
}

function parseFilters(value: unknown): SectionResult<DashboardFilter[]> {
  if (!Array.isArray(value)) return invalidConfig('filters')
  const filters: DashboardFilter[] = []
  for (let i = 0; i < value.length; i++) {
    const filter: unknown = value[i]
    if (!isDashboardFilter(filter)) return invalidConfig(`filters[${i}]`)
    filters.push(filter)
  }
  return { ok: true, value: filters }
}

function parseGroups(value: unknown, portletIds: Set<string>): SectionResult<PortletGroup[]> {
  if (!Array.isArray(value)) return invalidConfig('groups')
  const groups: PortletGroup[] = []
  for (let i = 0; i < value.length; i++) {
    const group: unknown = value[i]
    if (!isRecord(group)) return invalidConfig(`groups[${i}]`)
    if (!isNonEmptyString(group.id)) return invalidConfig(`groups[${i}].id`)
    if (!isOptionalString(group.title)) return invalidConfig(`groups[${i}].title`)
    if (group.direction !== 'row' && group.direction !== 'column') return invalidConfig(`groups[${i}].direction`)
    if (!Array.isArray(group.cells)) return invalidConfig(`groups[${i}].cells`)
    const cells: PortletGroupCell[] = []
    for (let c = 0; c < group.cells.length; c++) {
      const cell: unknown = group.cells[c]
      if (!isGroupCell(cell)) return invalidConfig(`groups[${i}].cells[${c}]`)
      if (cell.portletIds.some((id) => !portletIds.has(id))) return invalidConfig(`groups[${i}].cells[${c}].portletIds`)
      cells.push(cell)
    }
    const parsed: PortletGroup = { id: group.id, direction: group.direction, cells }
    if (group.title !== undefined) parsed.title = group.title
    groups.push(parsed)
  }
  return { ok: true, value: groups }
}

function parseRows(value: unknown, portletIds: Set<string>, groupIds: Set<string>): SectionResult<RowLayout[]> {
  if (!Array.isArray(value)) return invalidConfig('rows')
  const rows: RowLayout[] = []
  for (let i = 0; i < value.length; i++) {
    const row: unknown = value[i]
    if (!isRecord(row)) return invalidConfig(`rows[${i}]`)
    if (!isNonEmptyString(row.id)) return invalidConfig(`rows[${i}].id`)
    if (!isFiniteNumber(row.h)) return invalidConfig(`rows[${i}].h`)
    if (!Array.isArray(row.columns)) return invalidConfig(`rows[${i}].columns`)
    const columns: RowLayoutColumn[] = []
    for (let c = 0; c < row.columns.length; c++) {
      const column: unknown = row.columns[c]
      if (!isRowColumn(column)) return invalidConfig(`rows[${i}].columns[${c}]`)
      if (column.portletId !== undefined && !portletIds.has(column.portletId)) {
        return invalidConfig(`rows[${i}].columns[${c}].portletId`)
      }
      if (column.groupId !== undefined && !groupIds.has(column.groupId)) {
        return invalidConfig(`rows[${i}].columns[${c}].groupId`)
      }
      columns.push(column)
    }
    rows.push({ id: row.id, h: row.h, columns })
  }
  return { ok: true, value: rows }
}

type ConfigParseResult =
  | { ok: true; config: DashboardConfig; warnings: DashboardImportWarning[] }
  | { ok: false; errors: DashboardImportError[] }

/**
 * Read a bare DashboardConfig object (the `config` of an envelope, or a raw row
 * pasted from the host's database). Builds a fresh, whitelisted config: unknown keys
 * and the transient thumbnail fields do not survive the import.
 */
function parseConfig(value: unknown): ConfigParseResult {
  if (!isRecord(value)) return { ok: false, errors: [{ code: 'invalidConfig', path: '' }] }
  if (!Array.isArray(value.portlets)) return { ok: false, errors: [{ code: 'invalidConfig', path: 'portlets' }] }

  const errors: DashboardImportError[] = []
  const portlets: PortletConfig[] = []
  const portletIds = new Set<string>()

  value.portlets.forEach((raw: unknown, index: number) => {
    const result = parsePortlet(raw, index)
    if (!result.ok) {
      errors.push(result.error)
      return
    }
    portletIds.add(result.portlet.id)
    portlets.push(result.portlet)
  })

  const config: DashboardConfig = { portlets }
  const invalid = (path: string) => errors.push({ code: 'invalidConfig', path })

  if (value.layoutMode !== undefined) {
    if (isLayoutMode(value.layoutMode)) config.layoutMode = value.layoutMode
    else invalid('layoutMode')
  }
  if (value.grid !== undefined) {
    if (isGridSettings(value.grid)) config.grid = value.grid
    else invalid('grid')
  }
  if (value.colorPalette !== undefined) {
    if (typeof value.colorPalette === 'string') config.colorPalette = value.colorPalette
    else invalid('colorPalette')
  }
  if (value.eagerLoad !== undefined) {
    if (typeof value.eagerLoad === 'boolean') config.eagerLoad = value.eagerLoad
    else invalid('eagerLoad')
  }
  if (value.layouts !== undefined) {
    if (isRecord(value.layouts)) config.layouts = value.layouts
    else invalid('layouts')
  }
  if (value.filters !== undefined) {
    const result = parseFilters(value.filters)
    if (result.ok) config.filters = result.value
    else errors.push(result.error)
  }

  const groupIds = new Set<string>()
  if (value.groups !== undefined) {
    const result = parseGroups(value.groups, portletIds)
    if (result.ok) {
      config.groups = result.value
      result.value.forEach((group) => groupIds.add(group.id))
    } else {
      errors.push(result.error)
    }
  }
  if (value.rows !== undefined) {
    const result = parseRows(value.rows, portletIds, groupIds)
    if (result.ok) config.rows = result.value
    else errors.push(result.error)
  }

  if (errors.length > 0) return { ok: false, errors }

  // Warnings: portlets linked to a dashboard filter the file does not define. Not
  // pruned, because hosts may supply those filters programmatically at runtime.
  const warnings: DashboardImportWarning[] = []
  if (config.filters !== undefined) {
    const filterIds = new Set(config.filters.map((filter) => filter.id))
    for (const portlet of portlets) {
      for (const entry of portlet.dashboardFilterMapping ?? []) {
        const filterId = typeof entry === 'string' ? entry : entry.filterId
        if (!filterIds.has(filterId)) {
          warnings.push({ code: 'unknownFilterMapping', portletId: portlet.id, portletTitle: portlet.title, filterId })
        }
      }
    }
  }

  return { ok: true, config, warnings }
}

function optionalTrimmed(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

/**
 * Parse a dashboard export. Accepts the JSON text or an already-parsed value.
 *
 * Two shapes are recognised: the envelope written by `createDashboardExport` (an
 * object with a `config`), and a bare DashboardConfig (an object with a `portlets`
 * array) so a row copied straight from the host's database imports too. Anything
 * else is `unknownFormat`.
 */
export function parseDashboardExport(input: string | unknown): DashboardImportResult {
  let value: unknown = input
  if (typeof input === 'string') {
    try {
      value = JSON.parse(input)
    } catch {
      return { ok: false, errors: [{ code: 'invalidJson' }] }
    }
  }

  if (!isRecord(value)) return { ok: false, errors: [{ code: 'unknownFormat' }] }

  if ('config' in value) {
    const parsed = parseConfig(value.config)
    if (!parsed.ok) return parsed
    return {
      ok: true,
      config: parsed.config,
      name: optionalTrimmed(value.name),
      description: optionalTrimmed(value.description),
      warnings: parsed.warnings,
    }
  }

  if (Array.isArray(value.portlets)) return parseConfig(value)

  return { ok: false, errors: [{ code: 'unknownFormat' }] }
}

function readFileText(file: File): Promise<string> {
  if (typeof file.text === 'function') return file.text()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

/**
 * Read and parse a File picked by the user (e.g. from an `<input type="file">`).
 */
export async function readDashboardExportFile(file: File): Promise<DashboardImportResult> {
  let text: string
  try {
    text = await readFileText(file)
  } catch {
    return { ok: false, errors: [{ code: 'invalidJson' }] }
  }
  return parseDashboardExport(text)
}
