/**
 * DashboardCoordinator
 *
 * Runs the dashboard state machine and all responsive/scroll/drag machinery exactly
 * once, then publishes everything through DashboardContext for the composable pieces.
 *
 * This is the former body of DashboardGrid — the JSX layer now lives in the sibling
 * piece components (DashboardToolbar / DashboardFilterBar / DashboardGridSurface /
 * DashboardModals), which read from context.
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
import { getIcon } from '../../icons/index.js'
import { useScrollDetection } from '../../hooks/useScrollDetection.js'
import { useElementVisibility } from '../../hooks/useElementVisibility.js'
import { useDragAutoScroll } from '../../hooks/useDragAutoScroll.js'
import DashboardPortletCard from '../DashboardPortletCard.js'
import RowManagedLayout from '../RowManagedLayout.js'
import PortletGroupCard from '../PortletGroupCard.js'
import type { PortletCardVariant } from '../dashboardPortletCard/cardStyles.js'
import { findPortletLocation, removeFromGroup, type SnapEdge } from '../../hooks/dashboard/groupUtils.js'
import { ensureAnalysisConfig } from '../../utils/configMigration.js'
import { useCubeFeatures } from '../../providers/CubeProvider.js'
import { useResponsiveDashboard } from '../../hooks/useResponsiveDashboard.js'
import { ScrollContainerProvider } from '../../providers/ScrollContainerContext.js'
import { useDashboard } from '../../hooks/useDashboardHook.js'
import type {
  PortletConfig,
  PortletGroup,
  DashboardFilterMapping,
  DashboardLayoutMode,
  RowLayout
} from '../../types.js'
import {
  getGridSettings,
  equalizeColumns,
  adjustRowWidths,
  adjustInsertIndexForRemovedRow,
  createRowId,
  findScrollableAncestor
} from './dashboardGridUtils.js'
import DashboardContext, {
  type DashboardContextValue,
  type DashboardProviderProps
} from './DashboardContext.js'

const RefreshIcon = getIcon('refresh')
const EditIcon = getIcon('edit')
const DeleteIcon = getIcon('delete')
const CopyIcon = getIcon('copy')
const FilterIcon = getIcon('filter')

export default function DashboardCoordinator({
  config,
  editable = false,
  dashboardFilters,
  loadingComponent,
  onConfigChange,
  onPortletRefresh,
  onSave,
  onSaveThumbnail,
  colorPalette,
  schema,
  onDashboardFiltersChange,
  dashboardModes,
  hideToolbar,
  children
}: DashboardProviderProps) {
  // Get features from context for conditional rendering
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
  // Separate ref for grid content area (used for thumbnail capture - excludes toolbar/filters)
  const gridContentRef = useRef<HTMLDivElement | null>(null)

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
  // Local ref for tracking latest drag rows synchronously (avoids stale reads from useEffect-synced ref)
  const latestDragRowsRef = useRef<RowLayout[] | null>(null)
  /**
   * What is currently being dragged. `groupChild` matters because such a
   * portlet owns no column - splicing by `colIndex` would remove the whole
   * group instead of the one child.
   */
  type DragSource =
    | { kind: 'column'; rowIndex: number; colIndex: number; portletId: string }
    | { kind: 'group'; rowIndex: number; colIndex: number; groupId: string }
    | { kind: 'groupChild'; rowIndex: number; colIndex: number; groupId: string; portletId: string }
  const dragStateRef = useRef<DragSource | null>(null)
  const [draggingPortletId, setDraggingPortletId] = useState<string | null>(null)
  /** Set only while a whole group is in flight; a group owns no `draggingPortletId`. */
  const [draggingGroupId, setDraggingGroupId] = useState<string | null>(null)

  // =========================================================================
  // Dashboard State from Zustand Store via useDashboard hook
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
    onSaveThumbnail,
    gridWidth,
    portletComponentRefs,
    onPortletRefresh,
    dashboardRef: gridContentRef, // For thumbnail capture on exit edit mode (grid content only, excludes toolbar/filters)
  })

  const {
    isEditMode,
    selectedFilterId,
    isPortletModalOpen,
    editingPortlet,
    isTextModalOpen,
    editingTextPortlet,
    isFilterConfigModalOpen,
    filterConfigPortlet,
    deleteConfirmPortletId,
    deleteConfirmGroupId,
    draftRows,
    isDraggingPortlet,
    isInitialized,
    canEdit,
    canChangeLayoutMode,
    selectedFilter,
    resolvedRows,
    resolvedGroups,
    layoutMode,
    selectableModes,
    actions,
  } = dashboard

  // Keep mutable references so high-frequency row interactions
  // don't force callback identity churn into memoized portlet cards.
  const actionsRef = useRef(actions)
  actionsRef.current = actions
  const canEditRef = useRef(canEdit)
  canEditRef.current = canEdit
  const resolvedRowsRef = useRef(resolvedRows)
  resolvedRowsRef.current = resolvedRows
  const resolvedGroupsRef = useRef(resolvedGroups)
  resolvedGroupsRef.current = resolvedGroups

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
  const isScrolled = useScrollDetection(scrollContainerRef, {
    threshold: 20,
    debounceMs: 150,
    container: scrollContainer
  })

  // Track edit bar visibility for floating toolbar
  const isEditBarVisible = useElementVisibility(editBarRef, {
    threshold: 80,
    debounceMs: 100,
    containerRef: scrollContainerRef,
    container: scrollContainer
  })

  // Auto-scroll when dragging portlets near edges in row mode
  useDragAutoScroll(scrollContainerRef, {
    enabled: layoutMode === 'rows' && isDraggingPortlet,
    edgeThreshold: 80,
    maxScrollSpeed: 15
  })

  // Set up initialization tracking
  useEffect(() => {
    if (isInitialized) return

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
  }, [isInitialized, config.portlets, actions])

  // Whether any dashboard modal is open - Enter/Esc belong to the modal then
  const isAnyModalOpen =
    isPortletModalOpen || isTextModalOpen || isFilterConfigModalOpen || !!deleteConfirmPortletId

  // Set up Enter/ESC key listener for filter selection mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedFilterId || isAnyModalOpen) return

      if (e.key === 'Escape') {
        actions.exitFilterSelectionMode()
      } else if (e.key === 'Enter') {
        // Ignore Enter on interactive elements so keyboard activation
        // (e.g. pressing a focused button) doesn't also exit the mode
        const target = e.target as HTMLElement | null
        if (target?.closest('button, a, input, select, textarea, [contenteditable="true"]')) return
        actions.exitFilterSelectionMode()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedFilterId, isAnyModalOpen, actions])

  const handleLayoutChange = useCallback((_layout: Layout) => {
    // This function is called for ALL layout changes
    // We should NOT save here - only update internal state if needed
    // Actual saving only happens in handleDragStop and handleResizeStop for explicit user actions
  }, [])

  // Handle drag stop - save when user finishes dragging (only if layout actually changed)
  const handleDragStop = useCallback(async (layout: Layout, _oldItem: LayoutItem | null, _newItem: LayoutItem | null, _placeholder: LayoutItem | null, _e: Event, _element: HTMLElement | null) => {
    if (!editable || !isEditMode || !onSave || !isInitialized) return

    // Only save if the layout actually changed from user interaction
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
  const handleResizeStop = useCallback(async (layout: Layout, _oldItem: LayoutItem | null, _newItem: LayoutItem | null, _placeholder: LayoutItem | null, _e: Event, _element: HTMLElement | null) => {
    if (!editable || !isEditMode || !onConfigChange || !isInitialized) return

    // Only proceed if the layout actually changed from user interaction
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

  /**
   * Resizing snaps to half a grid unit by default - finer than the whole unit
   * it used to use - and to nothing at all while Shift is held, for pixel work.
   * Read from the live move event so Shift can be pressed mid-drag.
   */
  const quantiseUnits = (units: number, freeform: boolean) =>
    freeform ? units : Math.round(units * 2) / 2

  const startRowResize = useCallback((rowIndex: number, event: MouseEvent<HTMLDivElement>) => {
    if (!canEdit) return
    event.preventDefault()

    const startY = event.clientY
    const startRows = resolvedRows.map(row => ({
      ...row,
      columns: row.columns.map(column => ({ ...column }))
    }))
    latestDragRowsRef.current = null

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const delta = moveEvent.clientY - startY
      const deltaUnits = quantiseUnits(delta / gridSettings.rowHeight, moveEvent.shiftKey)
      const nextRows = startRows.map((row, index) => {
        if (index !== rowIndex) return row
        return {
          ...row,
          h: Math.max(gridSettings.minH, row.h + deltaUnits)
        }
      })
      latestDragRowsRef.current = nextRows
      actions.setDraftRows(nextRows)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      const finalRows = latestDragRowsRef.current ?? startRows
      latestDragRowsRef.current = null
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

    latestDragRowsRef.current = null

    const handleMouseMove = (moveEvent: globalThis.MouseEvent) => {
      const delta = moveEvent.clientX - startX
      const deltaUnits = quantiseUnits(delta / unitWidth, moveEvent.shiftKey)
      if (deltaUnits === 0) {
        latestDragRowsRef.current = startRows
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
      latestDragRowsRef.current = nextRows
      actions.setDraftRows(nextRows)
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      const finalRows = latestDragRowsRef.current ?? startRows
      latestDragRowsRef.current = null
      actions.updateRowLayout(finalRows)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [canEdit, gridSettings, gridWidth, resolvedRows, actions])

  const handlePortletDragStart = useCallback((
    rowIndex: number,
    colIndex: number,
    portletId: string,
    event: DragEvent<HTMLDivElement>,
    groupId?: string
  ) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', groupId ?? portletId)

    if (!canEditRef.current) return

    dragStateRef.current = groupId
      ? { kind: 'group', rowIndex, colIndex, groupId }
      : { kind: 'column', rowIndex, colIndex, portletId }
    setDraggingPortletId(groupId ? null : portletId)
    setDraggingGroupId(groupId ?? null)
    actionsRef.current.setIsDraggingPortlet(true)
  }, [])

  /** A portlet dragged from inside a group - it owns no column of its own. */
  const handleGroupChildDragStart = useCallback((
    groupId: string,
    portletId: string,
    event: DragEvent<HTMLDivElement>
  ) => {
    // setData first: a dragstart that returns without it is cancelled outright.
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', portletId)

    if (!canEditRef.current) return

    const location = findPortletLocation(resolvedRowsRef.current, resolvedGroupsRef.current, portletId)
    dragStateRef.current = {
      kind: 'groupChild',
      rowIndex: location?.rowIndex ?? 0,
      colIndex: location?.colIndex ?? 0,
      groupId,
      portletId
    }
    setDraggingPortletId(portletId)
    actionsRef.current.setIsDraggingPortlet(true)
  }, [])

  const handlePortletDragEnd = useCallback(() => {
    dragStateRef.current = null
    setDraggingPortletId(null)
    setDraggingGroupId(null)
    actionsRef.current.setIsDraggingPortlet(false)
  }, [])

  const handleRowDrop = useCallback((rowIndex: number, insertIndex: number | null) => {
    const dragState = dragStateRef.current
    if (!dragState) return
    // Clear now, not on dragend: a committed drop re-parents the dragged column
    // into another row, React unmounts the old node, and its dragend never
    // fires - leaving the card stuck at its half-opacity dragging style.
    handlePortletDragEnd()

    const nextRows = resolvedRows.map(row => ({
      ...row,
      columns: row.columns.map(column => ({ ...column }))
    }))

    const sourceRowIndex = dragState.rowIndex
    const sourceRow = nextRows[sourceRowIndex]
    if (!sourceRow) return

    // Dragging a portlet out of a group: it has no column to splice, so strip
    // it from the group and give it a fresh column at the drop position.
    if (dragState.kind === 'groupChild') {
      const { groups: nextGroups } = removeFromGroup(resolvedGroups, dragState.portletId)
      const targetRow = nextRows[rowIndex]
      if (!targetRow) return
      targetRow.columns.splice(insertIndex ?? targetRow.columns.length, 0, {
        portletId: dragState.portletId,
        w: 0
      })
      targetRow.columns = equalizeColumns(targetRow.columns, gridSettings)
      actions.updateLayout({ rows: nextRows, groups: nextGroups })
      return
    }

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
          columns: equalizeColumns(nextRows[sourceRowIndex].columns, gridSettings)
        }
      }
      nextRows[targetRowIndex] = {
        ...nextRows[targetRowIndex],
        columns: equalizeColumns(nextRows[targetRowIndex].columns, gridSettings)
      }
    }

    actions.updateRowLayout(nextRows)
  }, [gridSettings, resolvedGroups, resolvedRows, actions, handlePortletDragEnd])

  const handleNewRowDrop = useCallback((insertIndex: number) => {
    const dragState = dragStateRef.current
    if (!dragState) return
    // See handleRowDrop: dragend is lost when the drop re-parents the column.
    handlePortletDragEnd()

    const nextRows = resolvedRows.map(row => ({
      ...row,
      columns: row.columns.map(column => ({ ...column }))
    }))

    const sourceRow = nextRows[dragState.rowIndex]
    if (!sourceRow) return

    // Carry the height across rather than falling back to the default: a card
    // dragged into a row of its own should keep the height it was given, not
    // snap back to three units.
    const newRowHeight = Math.max(sourceRow.h || 0, gridSettings.minH, 1)

    if (dragState.kind === 'groupChild') {
      const { groups: nextGroups } = removeFromGroup(resolvedGroups, dragState.portletId)
      nextRows.splice(insertIndex, 0, {
        id: createRowId(),
        h: newRowHeight,
        columns: equalizeColumns([{ portletId: dragState.portletId, w: 0 }], gridSettings)
      })
      actions.updateLayout({ rows: nextRows, groups: nextGroups })
      return
    }

    const [movedColumn] = sourceRow.columns.splice(dragState.colIndex, 1)
    const sourceRowRemoved = sourceRow.columns.length === 0
    if (sourceRowRemoved) {
      nextRows.splice(dragState.rowIndex, 1)
    } else {
      sourceRow.columns = equalizeColumns(sourceRow.columns, gridSettings)
    }
    const targetIndex = adjustInsertIndexForRemovedRow(
      insertIndex,
      dragState.rowIndex,
      sourceRowRemoved
    )

    const newRow: RowLayout = {
      id: createRowId(),
      h: newRowHeight,
      columns: equalizeColumns([movedColumn], gridSettings)
    }
    nextRows.splice(targetIndex, 0, newRow)

    actions.updateRowLayout(nextRows)
  }, [gridSettings, resolvedGroups, resolvedRows, actions, handlePortletDragEnd])

  /**
   * Snap the dragged portlet against an edge of `targetPortletId`.
   *
   * Only a single portlet can be snapped. A whole group moves as a column, and
   * renders no bands at all while it is in flight, so it targets rows and
   * columns only - the guard here is belt and braces.
   */
  const handleSnapDrop = useCallback((targetPortletId: string, edge: SnapEdge) => {
    const dragState = dragStateRef.current
    if (!dragState) return
    if (dragState.kind === 'group') return handlePortletDragEnd()
    if (dragState.portletId === targetPortletId) return handlePortletDragEnd()
    handlePortletDragEnd()
    actionsRef.current.snapPortletIntoGroup(dragState.portletId, targetPortletId, edge)
  }, [handlePortletDragEnd])

  // Handle portlet refresh - use action from hook
  // Pass { bustCache: true } to bypass client and server caches (shift+click)
  const handlePortletRefresh = useCallback((portletId: string, options?: { bustCache?: boolean }) => {
    actionsRef.current.refreshPortlet(portletId, options)
  }, [])

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
    await actionsRef.current.deletePortlet(portletId)
  }, [])

  // Handle duplicating portlet - delegate to hook action with scroll to new portlet
  const handleDuplicatePortlet = useCallback(async (portletId: string) => {
    const newPortletId = await actionsRef.current.duplicatePortlet(portletId)

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
  }, [])

  // Handle adding new portlet - delegate to hook action
  const handleAddPortlet = useCallback(() => {
    actions.openAddPortlet()
  }, [actions])

  // Handle adding new text portlet - delegate to hook action
  const handleAddText = useCallback(() => {
    actions.openAddText()
  }, [actions])

  // Handle editing existing portlet - route markdown to text modal, others to analysis builder
  const handleEditPortlet = useCallback((portlet: PortletConfig) => {
    const normalized = ensureAnalysisConfig(portlet)
    const chartType = normalized.analysisConfig.charts[normalized.analysisConfig.analysisType]?.chartType
    if (chartType === 'markdown') {
      actionsRef.current.openEditText(portlet)
    } else {
      actionsRef.current.openEditPortlet(portlet)
    }
  }, [])

  // Handle palette change - delegate to hook action
  const handlePaletteChange = useCallback(async (paletteName: string) => {
    await actions.handlePaletteChange(paletteName)
  }, [actions])

  // Handle opening filter config modal - delegate to hook action
  const handleOpenFilterConfig = useCallback((portlet: PortletConfig) => {
    actionsRef.current.openFilterConfig(portlet)
  }, [])

  // Handle saving filter configuration - delegate to hook action
  const handleSaveFilterConfig = useCallback(async (mapping: DashboardFilterMapping) => {
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
    await actionsRef.current.toggleFilterForPortlet(portletId, filterId)
  }, [])

  // Handle filter selection (click on filter chip) - delegate to hook action
  const handleFilterSelect = useCallback((filterId: string) => {
    actions.selectFilter(filterId)
  }, [actions])

  // Handle select all - delegate to hook action
  const handleSelectAllForFilter = useCallback(async (filterId: string) => {
    await actions.selectAllForFilter(filterId)
  }, [actions])

  // Memoized callbacks object for DashboardPortletCard
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
  const renderPortletCard = useCallback((
    portlet: PortletConfig,
    containerProps?: HTMLAttributes<HTMLDivElement>,
    headerProps?: HTMLAttributes<HTMLDivElement>,
    variant: PortletCardVariant = 'standalone'
  ): ReactNode => (
    <DashboardPortletCard
      portlet={portlet}
      variant={variant}
      editable={editable}
      layoutMode={layoutMode}
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
    layoutMode,
    dashboardFilters,
    config.eagerLoad,
    loadingComponent,
    colorPalette,
    portletCallbacks,
    handleSetPortletRef,
    handleSetPortletComponentRef,
    portletIcons
  ])

  // Generate grid layout from portlets - only use for lg (desktop) breakpoint
  const baseLayout: LayoutItem[] = config.portlets.map(portlet => ({
    i: portlet.id,
    x: portlet.x,
    y: portlet.y,
    w: portlet.w,
    h: portlet.h,
    // Grouped children derive widths inside their group's column and can come
    // out below the dashboard minimum; RGL would otherwise widen them, collide,
    // and let the compactor scramble the grid.
    minW: Math.min(gridSettings.minW, portlet.w),
    minH: Math.min(gridSettings.minH, portlet.h),
    // Only enable drag/resize in edit mode
    isDraggable: canEdit,
    isResizable: canEdit,
    ...(canEdit ? { resizeHandles: ['s', 'w', 'e', 'n', 'se', 'sw', 'ne', 'nw'] as const } : {})
  }))

  // Render the portlet grid content (shared between desktop and scaled modes)
  const renderGridContent = useCallback((): ReactNode => (
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
  ), [baseLayout, handleLayoutChange, handleDragStop, handleResizeStop, gridWidth, gridSettings, canEdit, config.portlets, renderPortletCard])

  const portletsById = useMemo(
    () => new Map(config.portlets.map(portlet => [portlet.id, portlet])),
    [config.portlets]
  )

  const renderGroupCard = useCallback((
    group: PortletGroup,
    renderSnapBands: (portletId: string) => ReactNode,
    frameless?: boolean
  ): ReactNode => (
    <PortletGroupCard
      group={group}
      portlets={portletsById}
      canEdit={canEdit}
      frameless={frameless}
      renderChild={(portlet, wrapperProps) => renderPortletCard(portlet, wrapperProps, undefined, 'groupChild')}
      onRename={(groupId, title) => { void actionsRef.current.renameGroup(groupId, title) }}
      onUngroup={(groupId) => { void actionsRef.current.ungroupGroup(groupId) }}
      onDelete={(groupId) => actionsRef.current.deleteGroup(groupId)}
      onChildDragStart={handleGroupChildDragStart}
      onChildDragEnd={handlePortletDragEnd}
      renderSnapBands={renderSnapBands}
    />
  ), [
    canEdit,
    handleGroupChildDragStart,
    handlePortletDragEnd,
    portletsById,
    renderPortletCard,
  ])

  const renderRowContent = useCallback((): ReactNode => (
    <RowManagedLayout
      rows={resolvedRows}
      portlets={config.portlets}
      groups={resolvedGroups}
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
      onSnapDrop={handleSnapDrop}
      draggingPortletId={draggingPortletId}
      draggingGroupId={draggingGroupId}
      renderPortlet={renderPortletCard}
      renderGroup={renderGroupCard}
    />
  ), [resolvedRows, resolvedGroups, config.portlets, gridSettings, gridWidth, canEdit, isDraggingPortlet, startRowResize, startColumnResize, handlePortletDragStart, handlePortletDragEnd, handleRowDrop, handleNewRowDrop, handleSnapDrop, draggingPortletId, draggingGroupId, renderPortletCard, renderGroupCard])

  const renderActiveLayout = useCallback((): ReactNode => (
    layoutMode === 'rows' ? renderRowContent() : renderGridContent()
  ), [layoutMode, renderRowContent, renderGridContent])

  const value: DashboardContextValue = {
    // Props
    config,
    editable,
    dashboardFilters,
    loadingComponent,
    colorPalette,
    schema,
    onSave,
    onConfigChange,
    onDashboardFiltersChange,
    hideToolbar,

    // Store state
    isEditMode,
    selectedFilterId,
    isPortletModalOpen,
    editingPortlet,
    isTextModalOpen,
    editingTextPortlet,
    isFilterConfigModalOpen,
    filterConfigPortlet,
    deleteConfirmPortletId,
    deleteConfirmGroupId,
    draftRows,
    isDraggingPortlet,
    isInitialized,

    // Computed
    canEdit,
    canChangeLayoutMode,
    selectedFilter,
    resolvedRows,
    resolvedGroups,
    layoutMode,
    allowedModes,
    selectableModes,

    // Actions
    actions,

    // Responsive
    displayMode,
    scaleFactor,
    designWidth,
    gridWidth,
    isResponsiveEditable,

    // Scroll / visibility
    isScrolled,
    isEditBarVisible,
    scrollContainer,

    // Features
    features,

    // Refs
    editBarRef,
    gridContentRef,

    // Layout data
    gridSettings,
    baseLayout,

    // Render helpers
    renderPortletCard,
    renderActiveLayout,

    // Handlers
    handleAddPortlet,
    handleAddText,
    handlePaletteChange,
    handleFilterSelect,
    handleSelectAllForFilter,
    handleSaveFilterConfig,
    handlePortletSave,
    handlePortletRefresh,
    handleLayoutChange,
    handleDragStop,
    handleResizeStop,
    startRowResize,
    startColumnResize,
    handlePortletDragStart,
    handlePortletDragEnd,
    handleRowDrop,
    handleNewRowDrop,
  }

  return (
    <DashboardContext.Provider value={value}>
      <ScrollContainerProvider value={scrollContainer}>
        <div
          ref={combinedContainerRef}
          className="dashboard-grid-container dc:w-full"
          style={{ maxWidth: '100%', overflow: 'hidden' }}
        >
          {children}
        </div>
      </ScrollContainerProvider>
    </DashboardContext.Provider>
  )
}
