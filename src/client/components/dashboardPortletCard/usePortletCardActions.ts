/**
 * Copy-to-clipboard, XLSX export, and refresh shift-key feedback state for
 * DashboardPortletCard. Extracted to keep the card component flat.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useCubeFeatures } from '../../providers/CubeFeaturesProvider.js'
import { isPortletCopyAvailable, copyPortletToClipboard } from '../../utils/thumbnail.js'
import { isExportAvailable, exportPortletToXlsx, portletXlsxFilename } from '../../utils/exportXlsx.js'
import type { PortletDebugDataEntry } from '../../stores/dashboardStore.js'
import type { ChartExportHandler } from '../../types.js'

export function usePortletCardActions(params: {
  portletTitle: string
  debugData?: PortletDebugDataEntry
  /** The export that the chart registered. It runs in place of the built-in export. */
  chartExport?: ChartExportHandler | null
}) {
  const { portletTitle, debugData, chartExport } = params
  const { features } = useCubeFeatures()

  // State and ref for copy-to-clipboard functionality
  const [copySuccess, setCopySuccess] = useState(false)
  const [copyAvailable, setCopyAvailable] = useState(false)
  const chartContainerRef = useRef<HTMLDivElement | null>(null)

  // State for XLSX export
  const [xlsExportAvailable, setXlsExportAvailable] = useState(false)
  const [exportInProgress, setExportInProgress] = useState(false)

  // Track shift key + hover state for cache bust visual feedback on refresh button
  const [isShiftHeld, setIsShiftHeld] = useState(false)
  const [isHoveringRefresh, setIsHoveringRefresh] = useState(false)

  // Listen for shift key up/down to show visual feedback on refresh button (only when hovering)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftHeld(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftHeld(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Check if copy-to-clipboard capability is available on mount
  useEffect(() => {
    if (features.thumbnail?.enabled) {
      isPortletCopyAvailable().then(setCopyAvailable)
    } else {
      setCopyAvailable(false)
    }
  }, [features.thumbnail?.enabled])

  // Check if XLSX export is available on mount
  useEffect(() => {
    if (features.xlsExport?.enabled) {
      isExportAvailable().then(setXlsExportAvailable)
    } else {
      setXlsExportAvailable(false)
    }
  }, [features.xlsExport?.enabled])

  // The card shows Download for a chart export, also without debug data and
  // without exceljs: the chart writes the file. The built-in export needs both.
  const downloadAvailable = !!chartExport || (xlsExportAvailable && !!debugData)

  // Handler for XLSX export
  const handleExportXlsx = useCallback(async (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation()
    if (exportInProgress) return
    if (chartExport) {
      // The chart export wins over the built-in export of the debug data
      setExportInProgress(true)
      try {
        await chartExport({ fileName: portletXlsxFilename(portletTitle) })
      } catch (error) {
        console.error('[drizzle-cube] Failed to export XLSX:', error)
      } finally {
        setExportInProgress(false)
      }
      return
    }
    if (!debugData) return
    setExportInProgress(true)
    try {
      await exportPortletToXlsx(portletTitle || 'export', debugData)
    } finally {
      setExportInProgress(false)
    }
  }, [chartExport, debugData, exportInProgress, portletTitle])

  // Handler for copy-to-clipboard
  const handleCopyToClipboard = useCallback(async (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation()
    if (!chartContainerRef.current) return

    const success = await copyPortletToClipboard(chartContainerRef.current)
    if (success) {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }, [])

  // Show warning styling only when hovering AND shift is held
  const showCacheBustIndicator = isShiftHeld && isHoveringRefresh

  return {
    chartContainerRef,
    copySuccess,
    copyAvailable,
    downloadAvailable,
    exportInProgress,
    showCacheBustIndicator,
    setIsHoveringRefresh,
    handleExportXlsx,
    handleCopyToClipboard
  }
}
