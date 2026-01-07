/**
 * Dashboard Grid Component
 * Uses react-grid-layout for responsive grid layout
 * Simplified version without app-specific dependencies
 */

import {
  useCallback,
  useRef,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
  type HTMLAttributes,
  type DragEvent,
  type MouseEvent,
  type Ref
} from 'react'
import ReactGridLayout, { verticalCompactor, type LayoutItem, type Layout } from 'react-grid-layout'
import { getIcon } from '../icons'
import { useScrollDetection } from '../hooks/useScrollDetection'
import { useElementVisibility } from '../hooks/useElementVisibility'
import DashboardPortletCard from './DashboardPortletCard'
import RowManagedLayout from './RowManagedLayout'
import FloatingEditToolbar from './FloatingEditToolbar'

const ChartBarIcon = getIcon('measure')
const RefreshIcon = getIcon('refresh')
const EditIcon = getIcon('edit')
const CheckIcon = getIcon('check')
const DeleteIcon = getIcon('delete')
const AddIcon = getIcon('add')
const CopyIcon = getIcon('copy')
const FilterIcon = getIcon('filter')
const DesktopIcon = getIcon('desktop')
const GridIcon = getIcon('segment')
const RowsIcon = getIcon('table')
import PortletAnalysisModal from './PortletAnalysisModal'
import PortletFilterConfigModal from './PortletFilterConfigModal'
import ConfirmModal from './ConfirmModal'
import { useCubeFeatures } from '../providers/CubeProvider'
import ColorPaletteSelector from './ColorPaletteSelector'
import DashboardFilterPanel from './DashboardFilterPanel'
import ScaledGridWrapper from './ScaledGridWrapper'
import MobileStackedLayout from './MobileStackedLayout'
import { useResponsiveDashboard } from '../hooks/useResponsiveDashboard'
import { ScrollContainerProvider } from '../providers/ScrollContainerContext'
import { useDashboard } from '../hooks/useDashboardHook'
import type { ColorPalette } from '../utils/colorPalettes'

/**
 * Finds the nearest scrollable ancestor of an element.
 * Used to detect scroll container for lazy loading IntersectionObserver.
 */
function findScrollableAncestor(element: HTMLElement | null): HTMLElement | null {
  if (!element) return null

  let current = element.parentElement

  while (current) {
    const style = window.getComputedStyle(current)
    const overflowY = style.overflowY
    const overflowX = style.overflowX

    const hasScrollableOverflow =
      overflowY === 'auto' || overflowY === 'scroll' ||
      overflowX === 'auto' || overflowX === 'scroll'

    const hasScrollContent =
      current.scrollHeight > current.clientHeight ||
      current.scrollWidth > current.clientWidth

    if (hasScrollableOverflow && hasScrollContent) {
      return current
    }

    if (current === document.body) break
    current = current.parentElement
  }

  return null // Use viewport
}
import type {
  DashboardConfig,
  PortletConfig,
  DashboardFilter,
  CubeMeta,
  DashboardLayoutMode,
  DashboardGridSettings,
  RowLayout,
  RowLayoutColumn
} from '../types'

// CSS for react-grid-layout should be imported by the consuming app
// import 'react-grid-layout/css/styles.css'

interface DashboardGridProps {
  config: DashboardConfig
  editable?: boolean
  dashboardFilters?: DashboardFilter[] // Dashboard-level filters to apply to portlets
  loadingComponent?: ReactNode // Custom loading indicator for all portlets
  onConfigChange?: (config: DashboardConfig) => void
  onPortletRefresh?: (portletId: string) => void
  onSave?: (config: DashboardConfig) => Promise<void> | void
  colorPalette?: ColorPalette  // Complete palette with both colors and gradient
  schema?: CubeMeta | null  // Cube metadata for filter panel
  onDashboardFiltersChange?: (filters: DashboardFilter[]) => void  // Handler for filter changes
  dashboardModes?: DashboardLayoutMode[]
}

const DEFAULT_GRID_SETTINGS: DashboardGridSettings = {
  cols: 12,
  rowHeight: 80,
  minW: 2,
  minH: 2
}

const createRowId = () => `row-${Date.now()}`

const getGridSettings = (config: DashboardConfig): DashboardGridSettings => ({
  cols: config.grid?.cols ?? DEFAULT_GRID_SETTINGS.cols,
  rowHeight: config.grid?.rowHeight ?? DEFAULT_GRID_SETTINGS.rowHeight,
  minW: config.grid?.minW ?? DEFAULT_GRID_SETTINGS.minW,
  minH: config.grid?.minH ?? DEFAULT_GRID_SETTINGS.minH
})

const equalizeRowColumns = (
  portletIds: string[],
  gridSettings: DashboardGridSettings
): RowLayoutColumn[] => {
  const count = portletIds.length
  if (count === 0) return []

  const { cols, minW } = gridSettings
  const minTotal = minW * count

  if (minTotal > cols) {
    const base = Math.floor(cols / count)
    const remainder = cols % count
    return portletIds.map((id, index) => ({
      portletId: id,
      w: base + (index < remainder ? 1 : 0)
    }))
  }

  const remaining = cols - minTotal
  const extra = Math.floor(remaining / count)
  const remainder = remaining % count

  return portletIds.map((id, index) => ({
    portletId: id,
    w: minW + extra + (index < remainder ? 1 : 0)
  }))
}

const adjustRowWidths = (
  columns: RowLayoutColumn[],
  gridSettings: DashboardGridSettings
): RowLayoutColumn[] => {
  if (columns.length === 0) return []

  const { cols, minW } = gridSettings
  const adjusted = columns.map(column => ({
    ...column,
    w: Math.max(minW, column.w)
  }))

  let total = adjusted.reduce((sum, column) => sum + column.w, 0)
  if (total === cols) return adjusted

  if (total < cols) {
    let remaining = cols - total
    let index = 0
    while (remaining > 0) {
      adjusted[index % adjusted.length].w += 1
      remaining -= 1
      index += 1
    }
    return adjusted
  }

  let overflow = total - cols
  for (let index = adjusted.length - 1; index >= 0 && overflow > 0; index -= 1) {
    const column = adjusted[index]
    const reducible = Math.max(0, column.w - minW)
    if (reducible === 0) continue
    const delta = Math.min(reducible, overflow)
    column.w -= delta
    overflow -= delta
  }

  return adjusted
}

// Helper functions moved to useDashboardHook.ts:
// - convertPortletsToRows
// - normalizeRows
// - convertRowsToPortlets

export default function DashboardGrid({
  config,
  editable = false,
  dashboardFilters,
  loadingComponent,
  onConfigChange,
  onPortletRefresh,
  onSave,
  colorPalette,
  schema,
  onDashboardFiltersChange,
  dashboardModes
}: DashboardGridProps) {
  // Get features from context for conditional modal rendering
  const { features } = useCubeFeatures()

  // Responsive dashboard hook for three-tier layout strategy
  const {
    containerRef,
    containerWidth,
    displayMode,
    scaleFactor,
    isEditable: isResponsiveEditable,
    designWidth
  } = useResponsiveDashboard()

  // allowedModes is passed to useDashboard hook which computes layoutMode
  const allowedModes: DashboardLayoutMode[] = dashboardModes && dashboardModes.length > 0
    ? dashboardModes
    : ['rows', 'grid']
  const gridSettings = useMemo(() => getGridSettings(config), [config])

  // Scroll container detection for lazy loading
  // Null = viewport, element = scrolling container
  // Detection happens once in the ref callback to avoid double state updates
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null)
  const containerElementRef = useRef<HTMLDivElement | null>(null)
  const scrollContainerRef = useRef<HTMLElement | null>(null)
  const editBarRef = useRef<HTMLDivElement | null>(null)

  // Combined ref for container
  const combinedContainerRef = useCallback((node: HTMLDivElement | null) => {
    containerElementRef.current = node
    containerRef(node)
    if (node) {
      const foundScrollContainer = findScrollableAncestor(node)
      setScrollContainer(foundScrollContainer)
      scrollContainerRef.current = foundScrollContainer
    }
  }, [containerRef])

  // Calculate grid width based on display mode
  // Desktop: use actual container width (allows wider than 1200px)
  // Scaled: use design width (1200px) and apply CSS scaling
  const gridWidth = displayMode === 'desktop' ? containerWidth : designWidth

  // Refs to store portlet refs for refresh functionality (kept local - DOM-specific)
  const portletRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})
  const portletComponentRefs = useRef<{ [key: string]: { refresh: () => void } | null }>({})
  const draftRowsRef = useRef<RowLayout[] | null>(null)
  const dragStateRef = useRef<{ rowIndex: number; colIndex: number; portletId: string } | null>(null)

  // =========================================================================
  // Dashboard State from Zustand Store via useDashboard hook
  // Replaces 11 useState calls and provides computed values + actions
  // =========================================================================
  const dashboard = useDashboard({
    config,
    editable,
    dashboardFilters,
    gridSettings,
    allowedModes,
    isResponsiveEditable,
    onConfigChange,
    onSave,
    gridWidth,
    portletComponentRefs,
    onPortletRefresh,
  })

  // Destructure for easier access (maintains existing variable names)
  // Note: lastKnownLayout is managed internally by the hook and accessed via actions
  const {
    isEditMode,
    selectedFilterId,
    isPortletModalOpen,
    editingPortlet,
    isFilterConfigModalOpen,
    filterConfigPortlet,
    deleteConfirmPortletId,
    draftRows,
    isDraggingPortlet,
    isInitialized,
    // debugData removed - now read from store directly in DashboardPortletCard
    canEdit,
    canChangeLayoutMode,
    selectedFilter,
    resolvedRows,
    layoutMode,
    actions,
  } = dashboard

  // Sync draftRowsRef with store state (for mouse event handlers)
  useEffect(() => {
    draftRowsRef.current = draftRows
  }, [draftRows])

  // Exit filter selection mode when leaving edit mode or when switching to non-desktop mode
  useEffect(() => {
    if ((!isEditMode || !isResponsiveEditable) && selectedFilterId) {
      actions.exitFilterSelectionMode()
    }
  }, [isEditMode, isResponsiveEditable, selectedFilterId, actions])

  // Exit edit mode when switching to non-desktop view
  useEffect(() => {
    if (!isResponsiveEditable && isEditMode) {
      actions.exitEditMode()
    }
  }, [isResponsiveEditable, isEditMode, actions])

  // Track scroll state for sticky header using debounced scroll detection
  // Uses the actual scroll container (found via findScrollableAncestor) instead of window
  const isScrolled = useScrollDetection(scrollContainerRef, {
    threshold: 20,
    debounceMs: 150,
    container: scrollContainer  // State dependency to trigger re-init when container found
  })

  // Track edit bar visibility for floating toolbar
  // When edit bar scrolls out of view, show floating toolbar
  const isEditBarVisible = useElementVisibility(editBarRef, {
    threshold: 80,
    debounceMs: 100,
    containerRef: scrollContainerRef,
    container: scrollContainer  // State dependency to trigger re-init when container found
  })

  // Set up initialization tracking
  useEffect(() => {
    // Mark as initialized after first render to prevent saves during load/resize
    const timer = setTimeout(() => {
      actions.setIsInitialized(true)
      // Store initial layout for comparison
      const initialLayout = config.portlets.map(portlet => ({
        i: portlet.id,
        x: portlet.x,
        y: portlet.y,
        w: portlet.w,
        h: portlet.h
      }))
      actions.setLastKnownLayout(initialLayout)
    }, 200) // Slightly longer delay to ensure responsive grid is fully settled

    return () => clearTimeout(timer)
  }, [config.portlets, actions])

  // Scroll detection now handled by useScrollDetection hook above (lines 373-378)
  // This eliminates the old window.addEventListener('scroll') listener that was
  // listening to the wrong element and causing performance issues

  // Set up ESC key listener for filter selection mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedFilterId) {
        actions.exitFilterSelectionMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedFilterId, actions])

  const handleLayoutChange = useCallback((_layout: Layout) => {
    // This function is called for ALL layout changes
    // We should NOT save here - only update internal state if needed
    // Actual saving only happens in handleDragStop and handleResizeStop for explicit user actions

    // Note: We don't call onConfigChange here to prevent saving intermediate layout changes
    // The layout changes are handled by react-grid-layout internally
  }, [])  // No dependencies since we're not doing anything

  // Handle drag stop - save when user finishes dragging (only if layout actually changed)
  const handleDragStop = useCallback(async (layout: Layout, _oldItem: LayoutItem | null, _newItem: LayoutItem | null, _placeholder: LayoutItem | null, _e: Event, _element: HTMLElement | undefined) => {
    if (!editable || !isEditMode || !onSave || !isInitialized) return

    // Only save if the layout actually changed from user interaction
    // Convert readonly Layout to mutable array for comparison
    const mutableLayout = [...layout]
    if (!actions.hasLayoutActuallyChanged(mutableLayout)) {
      return // No actual change, don't save
    }

    // Get the current updated config (only called in desktop mode)
    const updatedPortlets = config.portlets.map(portlet => {
      const layoutItem = mutableLayout.find(item => item.i === portlet.id)
      if (layoutItem) {
        return {
          ...portlet,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h
        }
      }
      return portlet
    })

    // Preserve existing responsive layouts, only update with new lg layout
    const updatedConfig = {
      ...config,
      portlets: updatedPortlets,
      layouts: {
        ...config.layouts,
        lg: mutableLayout // Only save the large layout, let RGL handle responsive adjustments
      }
    }

    // Update our tracking of the last known layout
    actions.setLastKnownLayout(mutableLayout)

    // Update config state first
    onConfigChange?.(updatedConfig)

    // Auto-save after drag operation
    try {
      await onSave(updatedConfig)
    } catch (error) {
      console.error('Auto-save failed after drag:', error)
    }
  }, [config, editable, isEditMode, onConfigChange, onSave, isInitialized, actions])

  // Handle resize stop - update config and save (resize is user interaction)
  const handleResizeStop = useCallback(async (layout: Layout, _oldItem: LayoutItem | null, _newItem: LayoutItem | null, _placeholder: LayoutItem | null, _e: Event, _element: HTMLElement | undefined) => {
    if (!editable || !isEditMode || !onConfigChange || !isInitialized) return

    // Only proceed if the layout actually changed from user interaction
    // Convert readonly Layout to mutable array for comparison
    const mutableLayout = [...layout]
    if (!actions.hasLayoutActuallyChanged(mutableLayout)) {
      return // No actual change, don't save
    }

    // Get the current updated config (only called in desktop mode)
    const updatedPortlets = config.portlets.map(portlet => {
      const layoutItem = mutableLayout.find(item => item.i === portlet.id)
      if (layoutItem) {
        return {
          ...portlet,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h
        }
      }
      return portlet
    })

    // Preserve existing responsive layouts, only update with new lg layout
    const updatedConfig = {
      ...config,
      portlets: updatedPortlets,
      layouts: {
        ...config.layouts,
        lg: mutableLayout // Only save the large layout, let RGL handle responsive adjustments
      }
    }

    // Update our tracking of the last known layout
    actions.setLastKnownLayout(mutableLayout)

    // Update config state
    onConfigChange(updatedConfig)

    // Auto-save after resize operation (user deliberately resized)
    if (onSave) {
      try {
        await onSave(updatedConfig)
      } catch (error) {
        console.error('Auto-save failed after resize:', error)
      }
    }
  }, [config, editable, isEditMode, onConfigChange, onSave, isInitialized, actions])

  // handleLayoutModeChange now uses actions.handleLayoutModeChange from hook

  const startRowResize = useCallback((rowIndex: number, event: MouseEvent<HTMLDivElement>) => {
    if (!canEdit) return
    event.preventDefault()

    const startY = event.clientY
    const startRows = resolvedRows.map(row => ({
      ...row,
      columns: row.columns.map(column => ({ ...column }))
    }))

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const delta = moveEvent.clientY - startY
      const deltaUnits = Math.round(delta / gridSettings.rowHeight)
      const nextRows = startRows.map((row, index) => {
        if (index !== rowIndex) return row
        return {
          ...row,
          h: Math.max(gridSettings.minH, row.h + deltaUnits)
        }
      })
      actions.setDraftRows(nextRows)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      const finalRows = draftRowsRef.current ?? startRows
      actions.updateRowLayout(finalRows)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [canEdit, gridSettings, resolvedRows, actions])

  const startColumnResize = useCallback((rowIndex: number, columnIndex: number, event: MouseEvent<HTMLDivElement>) => {
    if (!canEdit) return
    event.preventDefault()

    const startX = event.clientX
    const startRows = resolvedRows.map(row => ({
      ...row,
      columns: row.columns.map(column => ({ ...column }))
    }))

    const row = startRows[rowIndex]
    const leftColumn = row?.columns[columnIndex]
    const rightColumn = row?.columns[columnIndex + 1]
    if (!row || !leftColumn || !rightColumn) return

    const columnGap = 16
    const rowContentWidth = gridWidth - (row.columns.length - 1) * columnGap
    const unitWidth = rowContentWidth / gridSettings.cols

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const delta = moveEvent.clientX - startX
      const deltaUnits = Math.round(delta / unitWidth)
      if (deltaUnits === 0) {
        actions.setDraftRows(startRows)
        return
      }

      let nextLeft = leftColumn.w + deltaUnits
      let nextRight = rightColumn.w - deltaUnits

      if (nextLeft < gridSettings.minW) {
        const diff = gridSettings.minW - nextLeft
        nextLeft = gridSettings.minW
        nextRight -= diff
      }

      if (nextRight < gridSettings.minW) {
        const diff = gridSettings.minW - nextRight
        nextRight = gridSettings.minW
        nextLeft -= diff
      }

      if (nextLeft < gridSettings.minW || nextRight < gridSettings.minW) return

      const nextRows = startRows.map((rowItem, index) => {
        if (index !== rowIndex) return rowItem
        const nextColumns = rowItem.columns.map((column, colIndex) => {
          if (colIndex === columnIndex) {
            return { ...column, w: nextLeft }
          }
          if (colIndex === columnIndex + 1) {
            return { ...column, w: nextRight }
          }
          return column
        })
        return {
          ...rowItem,
          columns: adjustRowWidths(nextColumns, gridSettings)
        }
      })
      actions.setDraftRows(nextRows)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      const finalRows = draftRowsRef.current ?? startRows
      actions.updateRowLayout(finalRows)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [canEdit, gridSettings, gridWidth, resolvedRows, actions])

  const handlePortletDragStart = useCallback((rowIndex: number, colIndex: number, portletId: string, event: DragEvent<HTMLDivElement>) => {
    if (!canEdit) return
    dragStateRef.current = { rowIndex, colIndex, portletId }
    actions.setIsDraggingPortlet(true)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', portletId)
  }, [canEdit, actions])

  const handlePortletDragEnd = useCallback(() => {
    dragStateRef.current = null
    actions.setIsDraggingPortlet(false)
  }, [actions])

  const handleRowDrop = useCallback((rowIndex: number, insertIndex: number | null) => {
    const dragState = dragStateRef.current
    if (!dragState) return

    const nextRows = resolvedRows.map(row => ({
      ...row,
      columns: row.columns.map(column => ({ ...column }))
    }))

    const sourceRowIndex = dragState.rowIndex
    const sourceRow = nextRows[sourceRowIndex]
    if (!sourceRow) return

    const [movedColumn] = sourceRow.columns.splice(dragState.colIndex, 1)
    let sourceRowRemoved = false
    if (sourceRow.columns.length === 0) {
      nextRows.splice(sourceRowIndex, 1)
      sourceRowRemoved = true
    }

    let targetRowIndex = rowIndex
    if (sourceRowRemoved && sourceRowIndex < rowIndex) {
      targetRowIndex -= 1
    }

    const targetRow = nextRows[targetRowIndex]
    if (!targetRow) return

    let targetIndex = insertIndex ?? targetRow.columns.length
    if (!sourceRowRemoved && sourceRowIndex === targetRowIndex && insertIndex !== null) {
      if (insertIndex > dragState.colIndex) {
        targetIndex -= 1
      }
    }
    targetRow.columns.splice(targetIndex, 0, movedColumn)

    const movedBetweenRows = sourceRowIndex !== targetRowIndex || sourceRowRemoved
    if (movedBetweenRows) {
      if (!sourceRowRemoved) {
        nextRows[sourceRowIndex] = {
          ...nextRows[sourceRowIndex],
          columns: equalizeRowColumns(
            nextRows[sourceRowIndex].columns.map(column => column.portletId),
            gridSettings
          )
        }
      }
      nextRows[targetRowIndex] = {
        ...nextRows[targetRowIndex],
        columns: equalizeRowColumns(
          nextRows[targetRowIndex].columns.map(column => column.portletId),
          gridSettings
        )
      }
    }

    actions.updateRowLayout(nextRows)
  }, [gridSettings, resolvedRows, actions])

  const handleNewRowDrop = useCallback((insertIndex: number) => {
    const dragState = dragStateRef.current
    if (!dragState) return

    const nextRows = resolvedRows.map(row => ({
      ...row,
      columns: row.columns.map(column => ({ ...column }))
    }))

    const sourceRow = nextRows[dragState.rowIndex]
    if (!sourceRow) return

    const [movedColumn] = sourceRow.columns.splice(dragState.colIndex, 1)
    if (sourceRow.columns.length === 0) {
      nextRows.splice(dragState.rowIndex, 1)
    } else {
      sourceRow.columns = equalizeRowColumns(
        sourceRow.columns.map(column => column.portletId),
        gridSettings
      )
    }

    const newRow: RowLayout = {
      id: createRowId(),
      h: Math.max(gridSettings.minH, 5),
      columns: equalizeRowColumns([movedColumn.portletId], gridSettings)
    }
    nextRows.splice(insertIndex, 0, newRow)

    actions.updateRowLayout(nextRows)
  }, [gridSettings, resolvedRows, actions])

  // Handle portlet refresh - use action from hook
  const handlePortletRefresh = useCallback((portletId: string) => {
    actions.refreshPortlet(portletId)
  }, [actions])

  // Portlet CRUD operations - now use actions from useDashboard hook
  // The hook handles all logic including row layout updates, saving, and modal state

  // Handle portlet save with scroll-to-new behavior
  const handlePortletSave = useCallback(async (portletData: PortletConfig | Omit<PortletConfig, 'id' | 'x' | 'y'>) => {
    const newPortletId = await actions.savePortlet(portletData)
    actions.closePortletModal()

    // Scroll to the new portlet after DOM update
    if (newPortletId) {
      setTimeout(() => {
        const scrollToPortlet = () => {
          let portletElement: HTMLElement | null = portletRefs.current[newPortletId]
          if (!portletElement) {
            portletElement = document.querySelector(`[data-portlet-id="${newPortletId}"]`)
          }

          if (portletElement) {
            portletElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            })
            return true
          }
          return false
        }

        // Try multiple times with increasing delays
        if (!scrollToPortlet()) {
          setTimeout(() => {
            if (!scrollToPortlet()) {
              setTimeout(() => {
                scrollToPortlet()
              }, 300)
            }
          }, 200)
        }
      }, 200)
    }
  }, [actions])

  // Handle deleting portlet - delegate to hook action
  const handleDeletePortlet = useCallback(async (portletId: string) => {
    await actions.deletePortlet(portletId)
  }, [actions])

  // Handle duplicating portlet - delegate to hook action with scroll to new portlet
  const handleDuplicatePortlet = useCallback(async (portletId: string) => {
    const newPortletId = await actions.duplicatePortlet(portletId)

    // Scroll to the duplicated portlet after DOM update
    if (newPortletId) {
      setTimeout(() => {
        const scrollToPortlet = () => {
          let portletElement: HTMLElement | null = portletRefs.current[newPortletId]
          if (!portletElement) {
            portletElement = document.querySelector(`[data-portlet-id="${newPortletId}"]`)
          }

          if (portletElement) {
            portletElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest'
            })
            return true
          }
          return false
        }

        // Try multiple times with increasing delays
        if (!scrollToPortlet()) {
          setTimeout(() => {
            if (!scrollToPortlet()) {
              setTimeout(() => {
                scrollToPortlet()
              }, 300)
            }
          }, 200)
        }
      }, 200)
    }
  }, [actions])

  // Handle adding new portlet - delegate to hook action
  const handleAddPortlet = useCallback(() => {
    actions.openAddPortlet()
  }, [actions])

  // Handle editing existing portlet - delegate to hook action
  const handleEditPortlet = useCallback((portlet: PortletConfig) => {
    actions.openEditPortlet(portlet)
  }, [actions])

  // Handle palette change - delegate to hook action
  const handlePaletteChange = useCallback(async (paletteName: string) => {
    await actions.handlePaletteChange(paletteName)
  }, [actions])

  // Handle opening filter config modal - delegate to hook action
  const handleOpenFilterConfig = useCallback((portlet: PortletConfig) => {
    actions.openFilterConfig(portlet)
  }, [actions])

  // Handle saving filter configuration - delegate to hook action
  const handleSaveFilterConfig = useCallback(async (mapping: string[]) => {
    await actions.saveFilterConfig(mapping)
  }, [actions])

  // Memoized ref callbacks for DashboardPortletCard
  const handleSetPortletRef = useCallback((portletId: string, element: HTMLDivElement | null) => {
    portletRefs.current[portletId] = element
  }, [])

  const handleSetPortletComponentRef = useCallback((portletId: string, element: { refresh: () => void } | null) => {
    portletComponentRefs.current[portletId] = element
  }, [])

  // Memoized icons object to prevent re-renders
  const portletIcons = useMemo(() => ({
    RefreshIcon, EditIcon, DeleteIcon, CopyIcon, FilterIcon
  }), [])

  // Handle toggling filter for a portlet - delegate to hook action
  const handleToggleFilterForPortlet = useCallback(async (portletId: string, filterId: string) => {
    await actions.toggleFilterForPortlet(portletId, filterId)
  }, [actions])

  // Handle filter selection (click on filter chip) - delegate to hook action
  const handleFilterSelect = useCallback((filterId: string) => {
    actions.selectFilter(filterId)
  }, [actions])

  // Handle select all - delegate to hook action
  const handleSelectAllForFilter = useCallback(async (filterId: string) => {
    await actions.selectAllForFilter(filterId)
  }, [actions])

  // selectedFilter is now computed by the hook

  // Memoized callbacks object for DashboardPortletCard
  // This groups action callbacks into a stable object to reduce prop drilling
  const portletCallbacks = useMemo(() => ({
    onToggleFilter: handleToggleFilterForPortlet,
    onRefresh: handlePortletRefresh,
    onDuplicate: handleDuplicatePortlet,
    onEdit: handleEditPortlet,
    onDelete: handleDeletePortlet,
    onOpenFilterConfig: handleOpenFilterConfig,
  }), [
    handleToggleFilterForPortlet,
    handlePortletRefresh,
    handleDuplicatePortlet,
    handleEditPortlet,
    handleDeletePortlet,
    handleOpenFilterConfig,
  ])

  // Memoize renderPortletCard to prevent unnecessary re-renders of DashboardPortletCard
  // IMPORTANT: Must be defined before any early returns to follow Rules of Hooks
  // State props (isEditMode, selectedFilterId, debugData) now read from store in component
  const renderPortletCard = useCallback((
    portlet: PortletConfig,
    containerProps?: HTMLAttributes<HTMLDivElement>,
    headerProps?: HTMLAttributes<HTMLDivElement>
  ) => (
    <DashboardPortletCard
      portlet={portlet}
      editable={editable}
      dashboardFilters={dashboardFilters}
      configEagerLoad={config.eagerLoad}
      loadingComponent={loadingComponent}
      colorPalette={colorPalette}
      containerProps={containerProps}
      headerProps={headerProps}
      callbacks={portletCallbacks}
      setPortletRef={handleSetPortletRef}
      setPortletComponentRef={handleSetPortletComponentRef}
      icons={portletIcons}
    />
  ), [
    editable,
    dashboardFilters,
    config.eagerLoad,
    loadingComponent,
    colorPalette,
    portletCallbacks,
    handleSetPortletRef,
    handleSetPortletComponentRef,
    portletIcons
  ])

  if (!config.portlets || config.portlets.length === 0) {
    return (
      <>
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <ChartBarIcon style={{ width: '64px', height: '64px', color: 'var(--dc-text-muted)', margin: '0 auto 16px auto' }} />
            <h3 className="text-lg font-semibold mb-2 text-dc-text">No Portlets</h3>
            <p className="text-sm text-dc-text-secondary mb-4">Add your first portlet to start visualizing your data</p>
            {editable && (
              <button
                onClick={handleAddPortlet}
                className="inline-flex items-center px-4 py-2 border border-dc-border bg-dc-surface rounded-md focus:outline-hidden focus:ring-2"
                style={{
                  color: 'var(--dc-primary)',
                  borderColor: 'var(--dc-primary)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--dc-surface-hover)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--dc-surface)'}
              >
                <AddIcon className="w-5 h-5 mr-2" />
                Add Portlet
              </button>
            )}
          </div>
        </div>
        
        {/* Portlet Modal */}
        <PortletAnalysisModal
          isOpen={isPortletModalOpen}
          onClose={actions.closePortletModal}
          onSave={handlePortletSave}
          portlet={editingPortlet}
          title={editingPortlet ? 'Edit Portlet' : 'Add New Portlet'}
          submitText={editingPortlet ? 'Update Portlet' : 'Add Portlet'}
          colorPalette={colorPalette}
          dashboardFilters={dashboardFilters}
        />
      </>
    )
  }

  // Generate grid layout from portlets - only use for lg (desktop) breakpoint
  // Let react-grid-layout handle responsive adjustments automatically
  const baseLayout: LayoutItem[] = config.portlets.map(portlet => ({
    i: portlet.id,
    x: portlet.x,
    y: portlet.y,
    w: portlet.w,
    h: portlet.h,
    minW: gridSettings.minW,
    minH: gridSettings.minH,  // 2 rows at 80px = 160px minimum
    // Only enable drag/resize in edit mode
    isDraggable: canEdit,
    isResizable: canEdit,
    ...(canEdit ? { resizeHandles: ['s', 'w', 'e', 'n', 'se', 'sw', 'ne', 'nw'] as const } : {})
  }))

  // Render the portlet grid content (shared between desktop and scaled modes)
  const renderGridContent = () => (
    <ReactGridLayout
      className="layout"
      layout={baseLayout}
      onLayoutChange={handleLayoutChange}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      width={gridWidth}
      gridConfig={{
        cols: gridSettings.cols,
        rowHeight: gridSettings.rowHeight,
        margin: [16, 16],
        containerPadding: [0, 0]
      }}
      dragConfig={{
        enabled: canEdit,
        handle: '.portlet-drag-handle'
      }}
      resizeConfig={{
        enabled: canEdit,
        handles: ['s', 'w', 'e', 'n', 'se', 'sw', 'ne', 'nw'],
        // Invisible but functional resize handles
        handleComponent: (axis, ref) => (
          <div
            ref={ref as Ref<HTMLDivElement>}
            className={`react-resizable-handle react-resizable-handle-${axis}`}
            style={{ opacity: 0 }}
          />
        )
      }}
      compactor={verticalCompactor}
    >
      {config.portlets
        .filter(portlet => portlet && portlet.id) // Guard against malformed portlets
        .map(portlet => (
          <div key={portlet.id}>
            {renderPortletCard(portlet)}
          </div>
        ))}
    </ReactGridLayout>
  )

  const renderRowContent = () => (
    <RowManagedLayout
      rows={resolvedRows}
      portlets={config.portlets}
      gridSettings={gridSettings}
      gridWidth={gridWidth}
      canEdit={canEdit}
      isDragging={isDraggingPortlet}
      onRowResize={startRowResize}
      onColumnResize={startColumnResize}
      onPortletDragStart={handlePortletDragStart}
      onPortletDragEnd={handlePortletDragEnd}
      onRowDrop={handleRowDrop}
      onNewRowDrop={handleNewRowDrop}
      renderPortlet={renderPortletCard}
    />
  )

  const renderActiveLayout = layoutMode === 'rows' ? renderRowContent() : renderGridContent()
  const editModeHint = 'Drag • Resize • Auto-save'

  return (
    <ScrollContainerProvider value={scrollContainer}>
      <div ref={combinedContainerRef} className="dashboard-grid-container w-full" style={{ maxWidth: '100%', overflow: 'hidden' }}>
        {editable && features.editToolbar !== 'floating' && (
        <div
          ref={editBarRef}
          className={`mb-4 flex justify-between items-center sticky top-0 z-10 px-4 py-4 bg-dc-surface-tertiary border border-dc-border rounded-lg transition-all duration-200 ${
            isScrolled ? 'border-b' : ''
          }`}
          style={{
            boxShadow: isScrolled ? 'var(--dc-shadow-md)' : 'var(--dc-shadow-sm)'
          }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => isResponsiveEditable && actions.toggleEditMode()}
              disabled={!isResponsiveEditable}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2 ${
                !isResponsiveEditable
                  ? 'opacity-50 cursor-not-allowed bg-dc-surface-secondary border border-dc-border'
                  : isEditMode
                    ? 'bg-dc-surface-secondary border border-dc-border hover:bg-dc-surface-hover'
                    : 'bg-dc-surface border border-dc-border hover:bg-dc-surface-hover'
              }`}
              style={{
                color: !isResponsiveEditable ? 'var(--dc-text-muted)' : 'var(--dc-primary)',
                borderColor: !isResponsiveEditable ? 'var(--dc-border)' : isEditMode ? 'var(--dc-border)' : 'var(--dc-primary)'
              }}
            >
              {isEditMode ? <CheckIcon className="w-4 h-4 mr-1.5" /> : <EditIcon className="w-4 h-4 mr-1.5" />}
              {isEditMode ? 'Finish Editing' : 'Edit'}
            </button>
            {isEditMode && allowedModes.length > 1 && (
              <div className="inline-flex rounded-md border border-dc-border overflow-hidden whitespace-nowrap">
                <button
                  onClick={() => actions.handleLayoutModeChange('grid')}
                  disabled={!canChangeLayoutMode}
                  className={`inline-flex items-center gap-2 whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-colors ${
                    layoutMode === 'grid'
                      ? 'bg-dc-surface-secondary text-dc-text shadow-inner'
                      : 'bg-dc-surface text-dc-text-secondary hover:bg-dc-surface-hover'
                  } ${!canChangeLayoutMode ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <GridIcon className="w-4 h-4 shrink-0" />
                  Grid
                </button>
                <button
                  onClick={() => actions.handleLayoutModeChange('rows')}
                  disabled={!canChangeLayoutMode}
                  className={`inline-flex items-center gap-2 whitespace-nowrap px-3 py-1.5 text-sm font-medium transition-colors ${
                    layoutMode === 'rows'
                      ? 'bg-dc-surface-secondary text-dc-text shadow-inner'
                      : 'bg-dc-surface text-dc-text-secondary hover:bg-dc-surface-hover'
                  } ${!canChangeLayoutMode ? 'cursor-not-allowed opacity-50' : ''}`}
                >
                  <RowsIcon className="w-4 h-4 shrink-0" />
                  Rows
                </button>
              </div>
            )}
            {!isResponsiveEditable && (
              <div className="flex items-center gap-2 text-sm text-dc-text-secondary">
                <DesktopIcon className="w-4 h-4" />
                <span>Desktop view required for editing</span>
              </div>
            )}
            {isEditMode && isResponsiveEditable && (
              <p className="hidden md:block text-sm text-dc-text-secondary">
                {editModeHint}
              </p>
            )}
          </div>

          {/* Color Palette Selector and Add Portlet - Only show in edit mode */}
          {isEditMode && (
            <div className="flex items-center gap-3">
              <ColorPaletteSelector
                currentPalette={config.colorPalette}
                onPaletteChange={handlePaletteChange}
                className="shrink-0"
              />

              <button
                onClick={handleAddPortlet}
                className="inline-flex items-center px-4 py-2 text-sm font-medium border rounded-md focus:outline-hidden focus:ring-2 focus:ring-offset-2 border-dc-border bg-dc-surface hover:bg-dc-surface-hover"
                style={{
                  color: 'var(--dc-primary)',
                  borderColor: 'var(--dc-primary)'
                }}
              >
                <AddIcon className="w-5 h-5 mr-2" />
                Add Portlet
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Edit Toolbar - appears when top edit bar scrolls out of view (or always if editToolbar='floating') */}
      {editable && features.editToolbar !== 'top' && displayMode === 'desktop' && (
        <FloatingEditToolbar
          isEditBarVisible={features.editToolbar === 'floating' ? false : isEditBarVisible}
          position={features.floatingToolbarPosition || 'right'}
          isEditMode={isEditMode}
          onEditModeToggle={() => isResponsiveEditable && actions.toggleEditMode()}
          layoutMode={layoutMode}
          onLayoutModeChange={actions.handleLayoutModeChange}
          allowedModes={allowedModes}
          canChangeLayoutMode={canChangeLayoutMode}
          currentPalette={config.colorPalette || 'default'}
          onPaletteChange={actions.handlePaletteChange}
          onAddPortlet={actions.openAddPortlet}
        />
      )}

      {/* Dashboard Filter Panel - Always visible below toolbar */}
      <DashboardFilterPanel
        dashboardFilters={dashboardFilters || []}
        editable={editable}
        schema={schema || null}
        dashboardConfig={config}
        onDashboardFiltersChange={onDashboardFiltersChange || (() => {})}
        onSaveFilters={onSave ? async (filters: DashboardFilter[]) => {
          const updatedConfig = {
            ...config,
            filters
          }
          await onSave(updatedConfig)
        } : undefined}
        selectedFilterId={selectedFilterId}
        onFilterSelect={handleFilterSelect}
        isEditMode={isEditMode}
      />

      {/* Filter Selection Mode Banner */}
      {selectedFilterId && selectedFilter && (
        <div
          className="mb-4 px-4 py-3 rounded-md border-2 transition-all"
          style={{
            backgroundColor: 'var(--dc-primary)',
            borderColor: 'var(--dc-primary)',
            color: 'white'
          }}
        >
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <FilterIcon className="w-5 h-5 shrink-0" />
              <span className="font-medium">
                Filter Selection Mode - Click portlets to toggle '{selectedFilter.label}'
              </span>
              <span className="text-sm opacity-90 hidden sm:inline">• Press ESC to exit</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSelectAllForFilter(selectedFilterId)}
                className="px-3 py-1 rounded-md transition-colors text-sm font-medium"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              >
                Select All
              </button>
              <button
                onClick={() => actions.exitFilterSelectionMode()}
                className="px-3 py-1 rounded-md transition-colors text-sm font-medium"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Render layout based on display mode */}
      {displayMode === 'mobile' ? (
        <MobileStackedLayout
          config={config}
          colorPalette={colorPalette}
          dashboardFilters={dashboardFilters}
          onPortletRefresh={handlePortletRefresh}
        />
      ) : displayMode === 'scaled' ? (
        <ScaledGridWrapper scaleFactor={scaleFactor} designWidth={designWidth}>
          {renderActiveLayout}
        </ScaledGridWrapper>
      ) : (
        renderActiveLayout
      )}
      
      {/* Portlet Modal */}
      <PortletAnalysisModal
        isOpen={isPortletModalOpen}
        onClose={actions.closePortletModal}
        onSave={handlePortletSave}
        portlet={editingPortlet}
        title={editingPortlet ? 'Edit Portlet' : 'Add New Portlet'}
        submitText={editingPortlet ? 'Update Portlet' : 'Add Portlet'}
        colorPalette={colorPalette}
        dashboardFilters={dashboardFilters}
      />

      {/* Filter Configuration Modal */}
      <PortletFilterConfigModal
        isOpen={isFilterConfigModalOpen}
        onClose={actions.closeFilterConfig}
        dashboardFilters={dashboardFilters || []}
        currentMapping={filterConfigPortlet?.dashboardFilterMapping || []}
        onSave={handleSaveFilterConfig}
        portletTitle={filterConfigPortlet?.title || ''}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmPortletId}
        onClose={actions.closeDeleteConfirm}
        onConfirm={actions.confirmDelete}
        title="Delete Portlet"
        message={
          <>
            Are you sure you want to delete{' '}
            <strong>
              {config.portlets.find(p => p.id === deleteConfirmPortletId)?.title || 'this portlet'}
            </strong>
            ? This action cannot be undone.
          </>
        }
        confirmText="Delete"
        confirmVariant="danger"
      />
      </div>
    </ScrollContainerProvider>
  )
}
