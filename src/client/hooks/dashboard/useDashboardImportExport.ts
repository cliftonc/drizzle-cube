/**
 * useDashboardImportExport
 *
 * The state machine behind the dashboard Export / Import toolbar buttons
 * (features.dashboardImportExport). Export downloads the current config as a JSON
 * file and is offered only for a dashboard that has portlets; Import is offered only
 * while the dashboard is still empty, so a file seeds a newly created dashboard
 * instead of replacing work. Import is two TanStack mutations: reading and parsing
 * the picked file (its result stays staged until the user confirms or dismisses), then applying
 * the staged config through the normal save path and, when the host provided
 * `onDashboardMetaChange`, renaming the host's dashboard record.
 *
 * Exposed on DashboardContext as `importExport` so both bundled toolbars and any
 * host-supplied toolbar drive the same flow. Needs a QueryClientProvider, which
 * CubeProvider supplies.
 */

import { useCallback, useMemo, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import type {
  DashboardConfig,
  DashboardImportExportFeatureConfig,
  DashboardMeta,
} from '../../types.js'
import {
  createDashboardExport,
  dashboardExportFilename,
  downloadDashboardExport,
  readDashboardExportFile,
  type DashboardImportError,
  type DashboardImportResult,
  type DashboardImportWarning,
} from '../../utils/dashboardExport.js'

/** A parsed file waiting for the user to confirm the replacement. */
export interface PendingDashboardImport {
  fileName: string
  config: DashboardConfig
  name?: string
  description?: string
  warnings: DashboardImportWarning[]
}

/** A file that could not be parsed, shown until dismissed. */
export interface FailedDashboardImport {
  fileName: string
  errors: DashboardImportError[]
}

export interface DashboardImportExportState {
  /** Whether features.dashboardImportExport is enabled; toolbars hide the buttons otherwise */
  enabled: boolean
  /**
   * Whether Export should be offered: only once the dashboard has portlets, so an
   * empty, never-populated dashboard cannot be exported.
   */
  canExport: boolean
  /**
   * Whether Import should be offered: only while the dashboard is still empty, so a
   * file can seed a newly created dashboard but never overwrite a populated one.
   */
  canImport: boolean
  /** Download the current dashboard as a JSON file */
  exportDashboard: () => void
  /** Parse a picked file and stage it for confirmation (or surface its errors) */
  importFromFile: (file: File) => Promise<void>
  pendingImport: PendingDashboardImport | null
  failedImport: FailedDashboardImport | null
  /** True while the confirmed import is being saved */
  isImporting: boolean
  /** Drop the staged import without applying it */
  cancelImport: () => void
  /** Apply the staged import: replace the config, then rename via onDashboardMetaChange if provided */
  confirmImport: () => Promise<void>
  /** Dismiss the error dialog */
  dismissImportError: () => void
  /** Whether the host can be asked to rename its record after an import */
  canRename: boolean
}

interface UseDashboardImportExportOptions {
  config: DashboardConfig
  dashboardMeta?: DashboardMeta
  onDashboardMetaChange?: (meta: { name: string; description?: string }) => Promise<void> | void
  importConfig: (config: DashboardConfig) => Promise<void>
  featureConfig?: DashboardImportExportFeatureConfig
}

interface StagedFile {
  fileName: string
  result: DashboardImportResult
}

export function useDashboardImportExport({
  config,
  dashboardMeta,
  onDashboardMetaChange,
  importConfig,
  featureConfig,
}: UseDashboardImportExportOptions): DashboardImportExportState {
  // Latest values without re-creating the callbacks every render
  const configRef = useRef(config)
  configRef.current = config
  const metaRef = useRef(dashboardMeta)
  metaRef.current = dashboardMeta
  const onMetaChangeRef = useRef(onDashboardMetaChange)
  onMetaChangeRef.current = onDashboardMetaChange
  const importConfigRef = useRef(importConfig)
  importConfigRef.current = importConfig
  const filenamePrefix = featureConfig?.filenamePrefix

  const exportDashboard = useCallback(() => {
    const now = new Date()
    const file = createDashboardExport(configRef.current, metaRef.current, now)
    downloadDashboardExport(file, dashboardExportFilename(file.name, now, filenamePrefix))
  }, [filenamePrefix])

  // Step 1: read and parse the picked file. Its `data` is the staged file until reset.
  const { mutateAsync: readFile, reset: resetStaged, data: staged } = useMutation({
    mutationFn: async (file: File): Promise<StagedFile> => ({
      fileName: file.name,
      result: await readDashboardExportFile(file),
    }),
  })

  // Step 2: apply a confirmed import through the normal save path.
  const { mutateAsync: applyImport, isPending: isImporting } = useMutation({
    mutationFn: async (pending: PendingDashboardImport) => {
      await importConfigRef.current(pending.config)
      const onMetaChange = onMetaChangeRef.current
      if (onMetaChange && pending.name) {
        try {
          await onMetaChange({ name: pending.name, description: pending.description })
        } catch (error) {
          // The config is already imported; a failed rename should not look like a failed import
          console.error('Failed to update dashboard name after import:', error)
        }
      }
    },
    onSuccess: () => resetStaged(),
  })

  const pendingImport = useMemo<PendingDashboardImport | null>(() => {
    if (!staged || !staged.result.ok) return null
    const { config: parsed, name, description, warnings } = staged.result
    return { fileName: staged.fileName, config: parsed, name, description, warnings }
  }, [staged])

  const failedImport = useMemo<FailedDashboardImport | null>(() => {
    if (!staged || staged.result.ok) return null
    return { fileName: staged.fileName, errors: staged.result.errors }
  }, [staged])

  const importFromFile = useCallback(
    async (file: File) => {
      await readFile(file)
    },
    [readFile]
  )

  const confirmImport = useCallback(async () => {
    if (!pendingImport || isImporting) return
    try {
      await applyImport(pendingImport)
    } catch (error) {
      console.error('Failed to import dashboard:', error)
    }
  }, [pendingImport, isImporting, applyImport])

  const isEmpty = !config.portlets || config.portlets.length === 0

  return {
    enabled: featureConfig?.enabled === true,
    canExport: !isEmpty,
    canImport: isEmpty,
    exportDashboard,
    importFromFile,
    pendingImport,
    failedImport,
    isImporting,
    cancelImport: resetStaged,
    confirmImport,
    dismissImportError: resetStaged,
    canRename: typeof onDashboardMetaChange === 'function',
  }
}
