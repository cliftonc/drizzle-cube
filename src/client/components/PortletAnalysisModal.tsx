import React, { useState, useEffect, useRef, useCallback } from 'react'
import Modal from './Modal'
import AnalysisBuilder from './AnalysisBuilder'
import type { AnalysisBuilderRef } from './AnalysisBuilder/types'
import type { PortletConfig, ColorPalette, CubeQuery } from '../types'

interface PortletAnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (portlet: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'>) => void
  portlet?: PortletConfig | null
  /** Initial data to display (avoids re-fetching when editing) */
  initialData?: any[]
  title: string
  submitText: string
  colorPalette?: ColorPalette
}

/**
 * PortletAnalysisModal - A modal wrapper around AnalysisBuilder for portlet editing
 *
 * This replaces PortletEditModal with the modern AnalysisBuilder interface.
 * Features:
 * - Two-panel layout with results and query builder
 * - Auto-execution of queries
 * - Smart chart defaults
 * - Title input in header
 * - Initial data support (no re-fetch when editing)
 */
export default function PortletAnalysisModal({
  isOpen,
  onClose,
  onSave,
  portlet,
  initialData,
  title: modalTitle,
  submitText,
  colorPalette
}: PortletAnalysisModalProps) {

  // Ref to AnalysisBuilder for getting current query and chart config
  const builderRef = useRef<AnalysisBuilderRef>(null)

  // Title state
  const [formTitle, setFormTitle] = useState('')

  // Parse initial query from portlet
  const initialQuery = React.useMemo<CubeQuery | undefined>(() => {
    if (!portlet?.query) return undefined
    try {
      return JSON.parse(portlet.query)
    } catch {
      return undefined
    }
  }, [portlet?.query])

  // Initial chart config from portlet
  const initialChartConfig = React.useMemo(() => {
    if (!portlet) return undefined
    return {
      chartType: portlet.chartType,
      chartConfig: portlet.chartConfig,
      displayConfig: portlet.displayConfig
    }
  }, [portlet])

  // Reset form state when modal opens/closes or portlet changes
  useEffect(() => {
    if (isOpen) {
      setFormTitle(portlet?.title || '')
    }
  }, [isOpen, portlet])

  // Handle save
  const handleSave = useCallback(() => {
    if (!formTitle.trim()) {
      alert('Please enter a title for the portlet.')
      return
    }

    // Get current query and chart config from AnalysisBuilder
    const currentQuery = builderRef.current?.getCurrentQuery()
    const chartConfig = builderRef.current?.getChartConfig()

    if (!currentQuery) {
      alert('Please configure a query before saving.')
      return
    }

    // Check if query has at least one measure or dimension
    const hasContent =
      (currentQuery.measures && currentQuery.measures.length > 0) ||
      (currentQuery.dimensions && currentQuery.dimensions.length > 0) ||
      (currentQuery.timeDimensions && currentQuery.timeDimensions.length > 0)

    if (!hasContent) {
      alert('Please add at least one metric or breakdown to your query.')
      return
    }

    // Build portlet config
    const portletData: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'> = {
      ...(portlet || {}),
      title: formTitle.trim(),
      query: JSON.stringify(currentQuery),
      chartType: chartConfig?.chartType || 'line',
      chartConfig: chartConfig?.chartConfig || {},
      displayConfig: chartConfig?.displayConfig || {},
      // Preserve existing position or use defaults for new portlets
      w: portlet?.w || 5,
      h: portlet?.h || 4
    } as PortletConfig

    onSave(portletData)
    onClose()
  }, [formTitle, portlet, onSave, onClose])

  // Handle cancel
  const handleCancel = useCallback(() => {
    onClose()
  }, [onClose])

  // Footer with save/cancel buttons
  const footer = (
    <>
      <button
        type="button"
        onClick={handleCancel}
        className="px-4 py-2 text-sm font-medium text-dc-text-secondary hover:text-dc-text bg-dc-surface border border-dc-border rounded-md hover:bg-dc-surface-hover transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={handleSave}
        className="px-4 py-2 text-sm font-medium text-white bg-dc-accent hover:bg-dc-accent-hover rounded-md transition-colors"
      >
        {submitText}
      </button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size="fullscreen-mobile"
      showCloseButton={true}
      closeOnBackdropClick={false}
      closeOnEscape={true}
      noPadding={true}
      footer={footer}
    >
      {/* Custom content with title input */}
      <div className="flex flex-col h-full">
        {/* Title input section */}
        <div className="shrink-0 px-4 py-3 border-b border-dc-border bg-dc-surface-secondary">
          <div className="flex items-center gap-3">
            <label htmlFor="portlet-title" className="text-sm font-medium text-dc-text-secondary shrink-0">
              Title
            </label>
            <input
              id="portlet-title"
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="Enter portlet title..."
              className="flex-1 px-3 py-1.5 text-sm bg-dc-surface border border-dc-border rounded-md text-dc-text placeholder-dc-text-muted focus:outline-none focus:ring-2 focus:ring-dc-accent focus:border-transparent"
              autoFocus
            />
          </div>
        </div>

        {/* AnalysisBuilder content */}
        <div className="flex-1 min-h-0">
          <AnalysisBuilder
            ref={builderRef}
            maxHeight="100%"
            initialQuery={initialQuery}
            initialChartConfig={initialChartConfig}
            initialData={initialData}
            colorPalette={colorPalette}
            disableLocalStorage={true}
            className="h-full"
          />
        </div>
      </div>
    </Modal>
  )
}
