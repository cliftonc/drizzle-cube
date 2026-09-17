/**
 * useDashboardImportExport
 *
 * The state behind the dashboard Export toolbar button (features.dashboardImportExport):
 * downloads the current config, plus the host's dashboard name/description, as a
 * JSON file.
 *
 * Exposed on DashboardContext as `importExport` so both bundled toolbars and any
 * host-supplied toolbar drive the same flow.
 */

import { useCallback, useRef } from 'react'
import type {
  DashboardConfig,
  DashboardImportExportFeatureConfig,
  DashboardMeta,
} from '../../types.js'
import {
  createDashboardExport,
  dashboardExportFilename,
  downloadDashboardExport,
} from '../../utils/dashboardExport.js'

export interface DashboardImportExportState {
  /** Whether features.dashboardImportExport is enabled; toolbars hide the buttons otherwise */
  enabled: boolean
  /** Download the current dashboard as a JSON file */
  exportDashboard: () => void
}

interface UseDashboardImportExportOptions {
  config: DashboardConfig
  dashboardMeta?: DashboardMeta
  featureConfig?: DashboardImportExportFeatureConfig
}

export function useDashboardImportExport({
  config,
  dashboardMeta,
  featureConfig,
}: UseDashboardImportExportOptions): DashboardImportExportState {
  // Latest values without re-creating the callback every render
  const configRef = useRef(config)
  configRef.current = config
  const metaRef = useRef(dashboardMeta)
  metaRef.current = dashboardMeta
  const filenamePrefix = featureConfig?.filenamePrefix

  const exportDashboard = useCallback(() => {
    const now = new Date()
    const file = createDashboardExport(configRef.current, metaRef.current, now)
    downloadDashboardExport(file, dashboardExportFilename(file.name, now, filenamePrefix))
  }, [filenamePrefix])

  return {
    enabled: featureConfig?.enabled === true,
    exportDashboard,
  }
}
