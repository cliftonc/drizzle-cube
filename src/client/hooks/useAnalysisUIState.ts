/**
 * useAnalysisUIState
 *
 * Manages UI-only state for AnalysisBuilder:
 * - Active tab selection
 * - View toggle (table/chart)
 * - Field modal state
 * - Display limit
 * - Active table index for multi-query
 */

import { useState } from 'react'
import { useAnalysisBuilderStore, type FieldModalMode } from '../stores/analysisBuilderStore'
import type { QueryPanelTab } from '../components/AnalysisBuilder/types'

export interface UseAnalysisUIStateResult {
  /** Active tab in query panel */
  activeTab: QueryPanelTab
  /** Active view (table or chart) */
  activeView: 'table' | 'chart'
  /** Display limit for table */
  displayLimit: number
  /** Whether field modal is open */
  showFieldModal: boolean
  /** Field modal mode */
  fieldModalMode: FieldModalMode
  /** Active table index for multi-query */
  activeTableIndex: number
  /** User manually selected chart */
  userManuallySelectedChart: boolean

  // Actions
  setActiveTab: (tab: QueryPanelTab) => void
  setActiveView: (view: 'table' | 'chart') => void
  setDisplayLimit: (limit: number) => void
  closeFieldModal: () => void
  setActiveTableIndex: (index: number) => void
}

export function useAnalysisUIState(): UseAnalysisUIStateResult {
  // Store state
  const activeTab = useAnalysisBuilderStore((state) => state.activeTab)
  const activeView = useAnalysisBuilderStore((state) => state.activeView)
  const displayLimit = useAnalysisBuilderStore((state) => state.displayLimit)
  const showFieldModal = useAnalysisBuilderStore((state) => state.showFieldModal)
  const fieldModalMode = useAnalysisBuilderStore((state) => state.fieldModalMode)
  const userManuallySelectedChart = useAnalysisBuilderStore((state) => state.userManuallySelectedChart)

  // Store actions
  const setActiveTab = useAnalysisBuilderStore((state) => state.setActiveTab)
  const setActiveView = useAnalysisBuilderStore((state) => state.setActiveView)
  const setDisplayLimit = useAnalysisBuilderStore((state) => state.setDisplayLimit)
  const closeFieldModal = useAnalysisBuilderStore((state) => state.closeFieldModal)

  // Local state for table index (not persisted)
  const [activeTableIndex, setActiveTableIndex] = useState(0)

  return {
    // State
    activeTab,
    activeView,
    displayLimit,
    showFieldModal,
    fieldModalMode,
    activeTableIndex,
    userManuallySelectedChart,

    // Actions
    setActiveTab,
    setActiveView,
    setDisplayLimit,
    closeFieldModal,
    setActiveTableIndex,
  }
}
